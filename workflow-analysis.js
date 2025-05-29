#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

class WorkflowAnalyzer {
    constructor() {
        this.workflows = [];
        this.analysisResults = {
            redundant: [],
            failing: [],
            successful: [],
            recommendations: []
        };
    }

    async run() {
        console.log('🔍 Starting GitHub Actions Workflow Analysis...\n');
        
        try {
            await this.fetchWorkflows();
            await this.analyzeWorkflows();
            await this.generateReport();
            await this.saveResults();
        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            process.exit(1);
        }
    }

    async fetchWorkflows() {
        console.log('📥 Fetching workflow information...');
        
        try {
            const { stdout } = await execAsync('gh api repos/:owner/:repo/actions/workflows');
            const data = JSON.parse(stdout);
            this.workflows = data.workflows;
            
            console.log(`✅ Found ${this.workflows.length} workflows:`);
            this.workflows.forEach(wf => {
                console.log(`   - ${wf.name} (${wf.path}) - ${wf.state}`);
            });
            console.log();
        } catch (error) {
            throw new Error(`Failed to fetch workflows: ${error.message}`);
        }
    }

    async analyzeWorkflows() {
        console.log('🔬 Analyzing workflows...\n');
        
        for (const workflow of this.workflows) {
            await this.analyzeWorkflow(workflow);
        }
    }

    async analyzeWorkflow(workflow) {
        console.log(`📊 Analyzing: ${workflow.name} (${workflow.path})`);
        
        try {
            // Get recent runs
            const { stdout } = await execAsync(`gh api repos/:owner/:repo/actions/workflows/${workflow.id}/runs --jq ".workflow_runs[0:10]"`);
            const runs = JSON.parse(stdout);
            
            const analysis = {
                workflow,
                runs,
                stats: this.calculateStats(runs),
                issues: this.identifyIssues(workflow, runs)
            };
            
            // Categorize workflow
            if (analysis.issues.includes('REDUNDANT')) {
                this.analysisResults.redundant.push(analysis);
            }
            
            if (analysis.stats.failureRate > 50) {
                this.analysisResults.failing.push(analysis);
            } else if (analysis.stats.failureRate < 20) {
                this.analysisResults.successful.push(analysis);
            }
            
            console.log(`   ✅ Success Rate: ${(100 - analysis.stats.failureRate).toFixed(1)}%`);
            console.log(`   📊 Recent Runs: ${analysis.stats.totalRuns}`);
            console.log(`   ⚠️  Issues: ${analysis.issues.join(', ') || 'None'}`);
            console.log();
            
        } catch (error) {
            console.log(`   ❌ Failed to analyze: ${error.message}\n`);
        }
    }

    calculateStats(runs) {
        const totalRuns = runs.length;
        const failedRuns = runs.filter(run => run.conclusion === 'failure' || run.conclusion === 'cancelled').length;
        const successfulRuns = runs.filter(run => run.conclusion === 'success').length;
        const failureRate = totalRuns > 0 ? (failedRuns / totalRuns) * 100 : 0;
        
        const avgDuration = runs
            .filter(run => run.conclusion === 'success')
            .map(run => {
                const start = new Date(run.created_at);
                const end = new Date(run.updated_at);
                return (end - start) / 1000; // seconds
            })
            .reduce((sum, duration, _, arr) => sum + duration / arr.length, 0);

        return {
            totalRuns,
            failedRuns,
            successfulRuns,
            failureRate,
            avgDuration: Math.round(avgDuration)
        };
    }

    identifyIssues(workflow, runs) {
        const issues = [];
        
        // Check for redundant workflows
        const duplicateNames = this.workflows.filter(w => 
            w.name === workflow.name && w.id !== workflow.id
        );
        if (duplicateNames.length > 0) {
            issues.push('REDUNDANT');
        }
        
        // Check for high failure rate
        const failureRate = this.calculateStats(runs).failureRate;
        if (failureRate > 50) {
            issues.push('HIGH_FAILURE_RATE');
        }
        
        // Check for no recent runs
        if (runs.length === 0) {
            issues.push('NO_RECENT_RUNS');
        }
        
        // Check for disabled state
        if (workflow.state !== 'active') {
            issues.push('DISABLED');
        }
        
        return issues;
    }

    async generateReport() {
        console.log('\n📋 WORKFLOW ANALYSIS REPORT');
        console.log('=' .repeat(50));
        
        // Redundant workflows
        if (this.analysisResults.redundant.length > 0) {
            console.log('\n🔴 REDUNDANT WORKFLOWS:');
            this.analysisResults.redundant.forEach(analysis => {
                console.log(`   - ${analysis.workflow.name} (${analysis.workflow.path})`);
                const duplicates = this.workflows.filter(w => 
                    w.name === analysis.workflow.name && w.id !== analysis.workflow.id
                );
                duplicates.forEach(dup => {
                    console.log(`     └─ Duplicate: ${dup.path} (ID: ${dup.id})`);
                });
            });
            
            this.analysisResults.recommendations.push({
                type: 'REMOVE_REDUNDANT',
                message: 'Remove duplicate AI Agent workflows - keep only the most recent/stable version',
                action: 'Delete redundant workflow files and disable unused workflows'
            });
        }
        
        // Failing workflows
        if (this.analysisResults.failing.length > 0) {
            console.log('\n🟡 HIGH-FAILURE WORKFLOWS:');
            this.analysisResults.failing.forEach(analysis => {
                console.log(`   - ${analysis.workflow.name}: ${analysis.stats.failureRate.toFixed(1)}% failure rate`);
            });
        }
        
        // Successful workflows
        if (this.analysisResults.successful.length > 0) {
            console.log('\n🟢 WELL-PERFORMING WORKFLOWS:');
            this.analysisResults.successful.forEach(analysis => {
                console.log(`   - ${analysis.workflow.name}: ${(100 - analysis.stats.failureRate).toFixed(1)}% success rate`);
            });
        }
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        this.analysisResults.recommendations.forEach((rec, idx) => {
            console.log(`   ${idx + 1}. ${rec.message}`);
            console.log(`      Action: ${rec.action}`);
        });
        
        // Check for disabled workflow files
        const disabledFiles = [
            '.github/workflows/gemini-ai-agent.yml.disabled',
            '.github/workflows/ai-agent-backup.yml.disabled',
            '.github/workflows/ai-agent-advanced.yml.disabled',
            '.github/workflows/ai-agent-advanced-fixed.yml.disabled'
        ];
        
        console.log('\n🗂️  DISABLED WORKFLOW FILES:');
        disabledFiles.forEach(file => {
            if (fs.existsSync(path.join(process.cwd(), file))) {
                console.log(`   - ${file}`);
            }
        });
        
        this.analysisResults.recommendations.push({
            type: 'CLEANUP_DISABLED',
            message: 'Remove disabled workflow files to clean up repository',
            action: 'Delete .disabled workflow files that are no longer needed'
        });
    }

    async saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `workflow-analysis-${timestamp}.json`;
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalWorkflows: this.workflows.length,
                redundantWorkflows: this.analysisResults.redundant.length,
                failingWorkflows: this.analysisResults.failing.length,
                successfulWorkflows: this.analysisResults.successful.length
            },
            workflows: this.workflows,
            analysisResults: this.analysisResults
        };
        
        fs.writeFileSync(filename, JSON.stringify(report, null, 2));
        console.log(`\n💾 Analysis saved to: ${filename}`);
    }
}

// Run the analysis
if (require.main === module) {
    const analyzer = new WorkflowAnalyzer();
    analyzer.run().catch(console.error);
}

module.exports = WorkflowAnalyzer;
