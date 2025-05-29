#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const EventEmitter = require('events');

const execAsync = util.promisify(exec);

class AIAgentDebugger extends EventEmitter {
    constructor() {
        super();
        this.sessionId = Date.now();
        this.debugLog = [];
        this.actionHistory = [];
        this.duplicateTracker = new Map();
        this.prTracker = [];
        this.issueTracker = [];
        
        // Set up event listeners
        this.on('action', this.logAction);
        this.on('duplicate', this.trackDuplicate);
        this.on('pr_created', this.trackPR);
        this.on('error', this.logError);
    }

    async run(issueNumber) {
        console.log(`🔍 Starting AI Agent Debug Session for Issue #${issueNumber}`);
        console.log(`📋 Session ID: ${this.sessionId}\n`);
        
        try {
            await this.initializeDebugSession(issueNumber);
            await this.monitorWorkflowExecution();
            await this.trackActionDuplicates();
            await this.monitorPRGeneration();
            await this.generateDebugReport();
        } catch (error) {
            this.emit('error', error);
            console.error('❌ Debug session failed:', error.message);
        }
    }

    async initializeDebugSession(issueNumber) {
        console.log('🚀 Initializing debug session...');
        
        // Fetch issue details
        try {
            const { stdout } = await execAsync(`gh issue view ${issueNumber} --json title,body,labels,assignees,state`);
            const issue = JSON.parse(stdout);
            
            this.issueTracker.push({
                number: issueNumber,
                title: issue.title,
                body: issue.body,
                labels: issue.labels,
                state: issue.state,
                timestamp: new Date().toISOString()
            });
            
            console.log(`   📝 Issue: #${issueNumber} - ${issue.title}`);
            console.log(`   📊 State: ${issue.state}`);
            console.log(`   🏷️  Labels: ${issue.labels.map(l => l.name).join(', ') || 'None'}`);
            
            this.emit('action', {
                type: 'ISSUE_FETCH',
                data: issue,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            throw new Error(`Failed to fetch issue #${issueNumber}: ${error.message}`);
        }
    }

    async monitorWorkflowExecution() {
        console.log('\n🔄 Monitoring workflow execution...');
        
        try {
            // Get current workflow runs
            const { stdout } = await execAsync('gh run list --limit 20 --json status,conclusion,workflowName,createdAt,url');
            const runs = JSON.parse(stdout);
            
            console.log(`   📊 Found ${runs.length} recent workflow runs`);
            
            // Track AI agent related workflows
            const aiAgentRuns = runs.filter(run => 
                run.workflowName.toLowerCase().includes('ai') || 
                run.workflowName.toLowerCase().includes('agent') ||
                run.workflowName.toLowerCase().includes('gemini')
            );
            
            console.log(`   🤖 AI Agent workflows: ${aiAgentRuns.length}`);
            
            // Check for duplicate executions
            const workflowCounts = {};
            aiAgentRuns.forEach(run => {
                const key = run.workflowName;
                workflowCounts[key] = (workflowCounts[key] || 0) + 1;
            });
            
            Object.entries(workflowCounts).forEach(([name, count]) => {
                if (count > 1) {
                    this.emit('duplicate', {
                        type: 'WORKFLOW_EXECUTION',
                        workflow: name,
                        count,
                        timestamp: new Date().toISOString()
                    });
                }
            });
            
            this.actionHistory.push({
                type: 'WORKFLOW_MONITOR',
                data: { total: runs.length, aiAgent: aiAgentRuns.length },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            this.emit('error', new Error(`Workflow monitoring failed: ${error.message}`));
        }
    }

    async trackActionDuplicates() {
        console.log('\n🔍 Scanning for duplicate actions...');
        
        try {
            // Check for duplicate workflow files
            const workflowDir = '.github/workflows';
            if (fs.existsSync(workflowDir)) {
                const files = fs.readdirSync(workflowDir);
                const aiWorkflows = files.filter(f => 
                    f.includes('ai') || f.includes('agent') || f.includes('gemini')
                );
                
                console.log(`   📁 Found ${aiWorkflows.length} AI-related workflow files:`);
                aiWorkflows.forEach(file => {
                    console.log(`      - ${file}`);
                });
                
                // Check for potential duplicates based on naming patterns
                const patterns = new Map();
                aiWorkflows.forEach(file => {
                    const basePattern = file.replace(/-(backup|fixed|advanced|disabled)/, '').replace(/\d+/, '');
                    if (!patterns.has(basePattern)) {
                        patterns.set(basePattern, []);
                    }
                    patterns.get(basePattern).push(file);
                });
                
                patterns.forEach((files, pattern) => {
                    if (files.length > 1) {
                        this.emit('duplicate', {
                            type: 'WORKFLOW_FILES',
                            pattern,
                            files,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            }
            
            // Check for duplicate issues with similar titles
            const { stdout } = await execAsync('gh issue list --limit 50 --json number,title,state');
            const issues = JSON.parse(stdout);
            
            const titleSimilarity = new Map();
            issues.forEach(issue => {
                const keywords = issue.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                keywords.forEach(keyword => {
                    if (!titleSimilarity.has(keyword)) {
                        titleSimilarity.set(keyword, []);
                    }
                    titleSimilarity.get(keyword).push(issue);
                });
            });
            
            titleSimilarity.forEach((similarIssues, keyword) => {
                if (similarIssues.length > 1) {
                    console.log(`   🔄 Similar issues for "${keyword}": ${similarIssues.map(i => `#${i.number}`).join(', ')}`);
                }
            });
            
        } catch (error) {
            this.emit('error', new Error(`Duplicate tracking failed: ${error.message}`));
        }
    }

    async monitorPRGeneration() {
        console.log('\n📋 Monitoring PR generation process...');
        
        try {
            // Get recent PRs
            const { stdout } = await execAsync('gh pr list --limit 20 --json number,title,state,createdAt,author');
            const prs = JSON.parse(stdout);
            
            console.log(`   📊 Found ${prs.length} recent PRs`);
            
            // Check for AI agent generated PRs
            const aiGeneratedPRs = prs.filter(pr => 
                pr.author.login.includes('bot') || 
                pr.author.login.includes('ai') ||
                pr.title.toLowerCase().includes('ai') ||
                pr.title.toLowerCase().includes('automated')
            );
            
            console.log(`   🤖 AI-generated PRs: ${aiGeneratedPRs.length}`);
            
            this.prTracker = aiGeneratedPRs.map(pr => ({
                ...pr,
                tracked_at: new Date().toISOString()
            }));
            
            // Check for rapid-fire PR creation (potential duplicate behavior)
            const recentPRs = prs.filter(pr => {
                const created = new Date(pr.createdAt);
                const now = new Date();
                const hoursDiff = (now - created) / (1000 * 60 * 60);
                return hoursDiff < 1; // PRs created in the last hour
            });
            
            if (recentPRs.length > 3) {
                this.emit('duplicate', {
                    type: 'RAPID_PR_CREATION',
                    count: recentPRs.length,
                    prs: recentPRs,
                    timestamp: new Date().toISOString()
                });
            }
            
        } catch (error) {
            this.emit('error', new Error(`PR monitoring failed: ${error.message}`));
        }
    }

    logAction(action) {
        this.debugLog.push({
            level: 'INFO',
            message: `Action: ${action.type}`,
            data: action.data,
            timestamp: action.timestamp
        });
        console.log(`   ✅ Logged action: ${action.type}`);
    }

    trackDuplicate(duplicate) {
        const key = `${duplicate.type}-${duplicate.workflow || duplicate.pattern || 'unknown'}`;
        this.duplicateTracker.set(key, duplicate);
        
        this.debugLog.push({
            level: 'WARNING',
            message: `Duplicate detected: ${duplicate.type}`,
            data: duplicate,
            timestamp: duplicate.timestamp
        });
        
        console.log(`   ⚠️  Duplicate detected: ${duplicate.type} - ${JSON.stringify(duplicate, null, 2)}`);
    }

    trackPR(prData) {
        this.debugLog.push({
            level: 'INFO',
            message: `PR tracked: #${prData.number}`,
            data: prData,
            timestamp: new Date().toISOString()
        });
        console.log(`   📋 PR tracked: #${prData.number} - ${prData.title}`);
    }

    logError(error) {
        this.debugLog.push({
            level: 'ERROR',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        console.error(`   ❌ Error logged: ${error.message}`);
    }

    async generateDebugReport() {
        console.log('\n📊 Generating debug report...');
        
        const report = {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            summary: {
                totalActions: this.actionHistory.length,
                totalDuplicates: this.duplicateTracker.size,
                totalPRsTracked: this.prTracker.length,
                totalErrors: this.debugLog.filter(log => log.level === 'ERROR').length
            },
            issueTracker: this.issueTracker,
            actionHistory: this.actionHistory,
            duplicates: Array.from(this.duplicateTracker.entries()).map(([key, value]) => ({ key, ...value })),
            prTracker: this.prTracker,
            debugLog: this.debugLog,
            recommendations: this.generateRecommendations()
        };
        
        const filename = `ai-agent-debug-session-${this.sessionId}.json`;
        fs.writeFileSync(filename, JSON.stringify(report, null, 2));
        
        console.log(`\n📋 DEBUG REPORT SUMMARY`);
        console.log('=' .repeat(50));
        console.log(`Session ID: ${this.sessionId}`);
        console.log(`Total Actions: ${report.summary.totalActions}`);
        console.log(`Duplicates Found: ${report.summary.totalDuplicates}`);
        console.log(`PRs Tracked: ${report.summary.totalPRsTracked}`);
        console.log(`Errors: ${report.summary.totalErrors}`);
        console.log(`\n💾 Full report saved to: ${filename}`);
        
        // Print recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        report.recommendations.forEach((rec, idx) => {
            console.log(`   ${idx + 1}. ${rec.title}`);
            console.log(`      ${rec.description}`);
            console.log(`      Action: ${rec.action}\n`);
        });
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Duplicate workflow recommendations
        if (this.duplicateTracker.size > 0) {
            recommendations.push({
                title: 'Remove Duplicate Workflows',
                description: 'Multiple similar workflows detected that may cause conflicts',
                action: 'Consolidate or remove redundant workflow files',
                priority: 'HIGH'
            });
        }
        
        // PR generation recommendations
        if (this.prTracker.length > 2) {
            recommendations.push({
                title: 'Implement PR Approval Process',
                description: 'Multiple AI-generated PRs detected, consider adding an approval agent',
                action: 'Create a PR approval workflow with human or AI review',
                priority: 'MEDIUM'
            });
        }
        
        // Error handling recommendations
        const errors = this.debugLog.filter(log => log.level === 'ERROR');
        if (errors.length > 0) {
            recommendations.push({
                title: 'Improve Error Handling',
                description: `${errors.length} errors detected during AI agent execution`,
                action: 'Add better error handling and retry mechanisms',
                priority: 'HIGH'
            });
        }
        
        return recommendations;
    }
}

// CLI interface
if (require.main === module) {
    const issueNumber = process.argv[2];
    if (!issueNumber) {
        console.error('Usage: node ai-agent-debugger.js <issue-number>');
        process.exit(1);
    }
      const aiDebugger = new AIAgentDebugger();
    aiDebugger.run(issueNumber).catch(console.error);
}

module.exports = AIAgentDebugger;
