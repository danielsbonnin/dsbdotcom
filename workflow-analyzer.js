const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 GitHub Actions Workflow Analysis\n');

// Get all workflows
console.log('📥 Fetching workflows...');
const workflowsOutput = execSync('gh api repos/:owner/:repo/actions/workflows', { encoding: 'utf8' });
const workflows = JSON.parse(workflowsOutput).workflows;

console.log(`✅ Found ${workflows.length} workflows:\n`);

const analysis = {
    redundant: [],
    issues: [],
    recommendations: []
};

workflows.forEach((workflow, idx) => {
    console.log(`${idx + 1}. ${workflow.name}`);
    console.log(`   📂 Path: ${workflow.path}`);
    console.log(`   🟢 State: ${workflow.state}`);
    console.log(`   🆔 ID: ${workflow.id}`);
    
    // Check for duplicates
    const duplicates = workflows.filter(w => 
        w.name === workflow.name && w.id !== workflow.id
    );
    
    if (duplicates.length > 0) {
        console.log(`   ⚠️  DUPLICATE NAME with ${duplicates.length} other workflow(s)`);
        analysis.redundant.push({
            workflow,
            duplicates
        });
    }
    
    console.log();
});

// Analyze redundant workflows
console.log('\n🔴 REDUNDANCY ANALYSIS:');
if (analysis.redundant.length > 0) {
    analysis.redundant.forEach(item => {
        console.log(`\n❌ Redundant: "${item.workflow.name}"`);
        console.log(`   Main: ${item.workflow.path} (ID: ${item.workflow.id})`);
        item.duplicates.forEach(dup => {
            console.log(`   Duplicate: ${dup.path} (ID: ${dup.id})`);
        });
    });
    
    analysis.recommendations.push(
        'Remove duplicate "AI Agent Automation" workflows - keep only ai-agent-fixed.yml'
    );
} else {
    console.log('✅ No redundant workflows found.');
}

// Check disabled files
console.log('\n🗂️  DISABLED WORKFLOW FILES:');
const disabledFiles = [
    '.github/workflows/gemini-ai-agent.yml.disabled',
    '.github/workflows/ai-agent-backup.yml.disabled', 
    '.github/workflows/ai-agent-advanced.yml.disabled',
    '.github/workflows/ai-agent-advanced-fixed.yml.disabled'
];

const existingDisabled = disabledFiles.filter(file => fs.existsSync(file));
if (existingDisabled.length > 0) {
    existingDisabled.forEach(file => console.log(`   📄 ${file}`));
    analysis.recommendations.push('Remove disabled workflow files to clean up repository');
} else {
    console.log('✅ No disabled workflow files found.');
}

// Get recent run statistics
console.log('\n📊 WORKFLOW PERFORMANCE:');
workflows.forEach(workflow => {
    try {
        // Skip the auto-generated pages workflow
        if (workflow.path.includes('dynamic/pages/')) {
            console.log(`🔄 ${workflow.name}: Auto-generated (GitHub Pages)`);
            return;
        }
        
        const runsOutput = execSync(`gh run list --workflow "${workflow.path.split('/').pop()}" --limit 10 --json status,conclusion`, { encoding: 'utf8' });
        const runs = JSON.parse(runsOutput);
        
        const successful = runs.filter(r => r.conclusion === 'success').length;
        const failed = runs.filter(r => r.conclusion === 'failure').length;
        const total = runs.length;
        const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : 'N/A';
        
        console.log(`📈 ${workflow.name}:`);
        console.log(`   Success Rate: ${successRate}% (${successful}/${total})`);
        
        if (parseFloat(successRate) < 50 && total > 0) {
            analysis.issues.push(`${workflow.name} has low success rate: ${successRate}%`);
        }
        
    } catch (error) {
        console.log(`📈 ${workflow.name}: Unable to fetch run data`);
    }
});

// Final recommendations
console.log('\n💡 RECOMMENDATIONS:');
if (analysis.recommendations.length > 0) {
    analysis.recommendations.forEach((rec, idx) => {
        console.log(`   ${idx + 1}. ${rec}`);
    });
} else {
    console.log('✅ No issues found - workflows look good!');
}

if (analysis.issues.length > 0) {
    console.log('\n⚠️  ISSUES TO ADDRESS:');
    analysis.issues.forEach((issue, idx) => {
        console.log(`   ${idx + 1}. ${issue}`);
    });
}

// Generate cleanup script
const cleanupScript = `
# Workflow Cleanup Script
echo "🧹 Cleaning up redundant GitHub Actions workflows..."

# Remove redundant AI Agent workflow (keep the fixed version)
echo "📌 Keeping ai-agent-fixed.yml as the primary AI Agent workflow"
echo "🗑️  Removing redundant ai-agent.yml..."
# gh api -X DELETE repos/:owner/:repo/actions/workflows/164863251

# Remove disabled workflow files
${existingDisabled.map(file => `# rm "${file}"`).join('\n')}

echo "✅ Cleanup completed!"
`;

fs.writeFileSync('workflow-cleanup.sh', cleanupScript);
console.log('\n💾 Cleanup script generated: workflow-cleanup.sh');

console.log('\n🎯 SUMMARY:');
console.log(`   Total workflows: ${workflows.length}`);
console.log(`   Redundant workflows: ${analysis.redundant.length}`);
console.log(`   Issues found: ${analysis.issues.length}`);
console.log(`   Recommendations: ${analysis.recommendations.length}`);
