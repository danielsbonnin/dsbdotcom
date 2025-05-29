#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');

const execAsync = util.promisify(exec);

class DeploymentTracker {
    constructor() {
        this.startTime = new Date();
        this.sessionId = Date.now();
        this.deployLog = [];
    }

    log(message, level = 'INFO', data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level, message, data };
        this.deployLog.push(logEntry);

        // Pretty terminal output
        const timeStr = new Date().toLocaleTimeString();
        const icons = {
            'INFO': '📋',
            'SUCCESS': '✅',
            'WARNING': '⚠️',
            'ERROR': '❌',
            'PROGRESS': '🔄',
            'DEPLOY': '🚀'
        };

        const icon = icons[level] || '📋';
        console.log(`${icon} [${timeStr}] ${message}`);
        
        if (data) {
            console.log(`   📊 Data: ${JSON.stringify(data, null, 2)}`);
        }
    }

    async checkGitStatus() {
        this.log('Checking Git status...', 'PROGRESS');
        
        try {
            const { stdout } = await execAsync('git status --porcelain');
            const changes = stdout.trim().split('\n').filter(line => line.length > 0);
            
            if (changes.length === 0) {
                this.log('No changes to commit', 'WARNING');
                return false;
            }

            this.log(`Found ${changes.length} changes to commit`, 'SUCCESS', { 
                changes: changes.slice(0, 5) // Show first 5 changes
            });
            
            return true;
        } catch (error) {
            this.log(`Git status check failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async addAndCommit() {
        this.log('Adding files to Git...', 'PROGRESS');
        
        try {
            // Add all changes
            await execAsync('git add .');
            this.log('Files added to staging area', 'SUCCESS');

            // Create commit message
            const commitMessage = `🤖 AI Agent Workflow Fixes - ${new Date().toISOString().split('T')[0]}

- Fixed duplicate workflow file conflicts
- Added missing js-yaml dependency
- Fixed GitHub CLI JSON field errors
- Added missing workflow permissions
- Resolved TypeScript/ESLint issues
- Improved error handling and debugging

Session: ${this.sessionId}`;

            // Commit changes
            await execAsync(`git commit -m "${commitMessage}"`);
            this.log('Changes committed successfully', 'SUCCESS');
            
        } catch (error) {
            this.log(`Commit failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async pushToRemote() {
        this.log('Pushing to remote repository...', 'DEPLOY');
        
        try {
            // Get current branch
            const { stdout: branchOutput } = await execAsync('git branch --show-current');
            const currentBranch = branchOutput.trim();
            
            this.log(`Pushing to branch: ${currentBranch}`, 'INFO');
            
            // Push changes
            await execAsync(`git push origin ${currentBranch}`);
            this.log('Successfully pushed to remote repository', 'SUCCESS');
            
        } catch (error) {
            this.log(`Push failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async trackWorkflows() {
        this.log('Monitoring workflow triggers...', 'PROGRESS');
        
        try {
            // Wait a moment for GitHub to detect the push
            await this.sleep(5000);
            
            // Get recent workflow runs
            const { stdout } = await execAsync('gh run list --limit 10 --json number,workflowName,status,createdAt,conclusion');
            const runs = JSON.parse(stdout);
            
            const recentRuns = runs.filter(run => {
                const runTime = new Date(run.createdAt);
                const timeDiff = (new Date() - runTime) / (1000 * 60); // minutes
                return timeDiff < 10; // Runs from last 10 minutes
            });
            
            this.log(`Found ${recentRuns.length} recent workflow runs`, 'SUCCESS');
            
            recentRuns.forEach((run, index) => {
                this.log(`Workflow ${index + 1}: ${run.workflowName}`, 'INFO', {
                    status: run.status,
                    conclusion: run.conclusion || 'running',
                    runNumber: run.number,
                    createdAt: run.createdAt
                });
            });
            
            // Monitor AI Agent workflow specifically
            const aiAgentRuns = recentRuns.filter(run => 
                run.workflowName.toLowerCase().includes('ai') || 
                run.workflowName.toLowerCase().includes('agent')
            );
            
            if (aiAgentRuns.length > 0) {
                this.log(`🤖 AI Agent workflows detected: ${aiAgentRuns.length}`, 'SUCCESS');
                
                for (const run of aiAgentRuns) {
                    this.log(`Monitoring AI Agent run #${run.number}...`, 'PROGRESS');
                    
                    if (run.status === 'completed') {
                        const icon = run.conclusion === 'success' ? '✅' : '❌';
                        this.log(`${icon} AI Agent run completed: ${run.conclusion}`, 
                                run.conclusion === 'success' ? 'SUCCESS' : 'ERROR');
                    } else {
                        this.log(`🔄 AI Agent run in progress: ${run.status}`, 'PROGRESS');
                    }
                }
            } else {
                this.log('No AI Agent workflows triggered yet', 'WARNING');
            }
            
        } catch (error) {
            this.log(`Workflow tracking failed: ${error.message}`, 'ERROR');
            // Don't throw - this is optional monitoring
        }
    }

    async validateDeployment() {
        this.log('Validating deployment...', 'PROGRESS');
        
        try {
            // Run AI agent validation
            const { stdout } = await execAsync('node .github/scripts/ai-agent/validate-workflow.js');
            
            if (stdout.includes('✅ No critical errors found')) {
                this.log('Deployment validation passed', 'SUCCESS');
            } else if (stdout.includes('❌')) {
                this.log('Deployment validation found errors', 'WARNING');
            } else {
                this.log('Deployment validation completed with warnings', 'WARNING');
            }
            
        } catch (error) {
            this.log(`Validation failed: ${error.message}`, 'ERROR');
        }
    }

    async generateDeploymentReport() {
        const endTime = new Date();
        const duration = Math.round((endTime - this.startTime) / 1000);
        
        const report = {
            sessionId: this.sessionId,
            startTime: this.startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: `${duration} seconds`,
            deployLog: this.deployLog,
            summary: {
                totalSteps: this.deployLog.length,
                successSteps: this.deployLog.filter(log => log.level === 'SUCCESS').length,
                errorSteps: this.deployLog.filter(log => log.level === 'ERROR').length,
                warningSteps: this.deployLog.filter(log => log.level === 'WARNING').length
            }
        };
        
        const filename = `deployment-report-${this.sessionId}.json`;
        fs.writeFileSync(filename, JSON.stringify(report, null, 2));
        
        this.log(`📊 Deployment report saved: ${filename}`, 'SUCCESS');
        
        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('🚀 DEPLOYMENT SUMMARY');
        console.log('='.repeat(60));
        console.log(`📋 Session ID: ${this.sessionId}`);
        console.log(`⏱️  Duration: ${duration} seconds`);
        console.log(`✅ Success Steps: ${report.summary.successSteps}`);
        console.log(`❌ Error Steps: ${report.summary.errorSteps}`);
        console.log(`⚠️  Warning Steps: ${report.summary.warningSteps}`);
        console.log(`📊 Total Steps: ${report.summary.totalSteps}`);
        console.log('='.repeat(60));
        
        return report;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async deploy() {
        console.log('🚀 Starting AI Agent Deployment & Tracking');
        console.log('=' .repeat(50));
        console.log(`📋 Session ID: ${this.sessionId}`);
        console.log(`⏰ Start Time: ${this.startTime.toLocaleString()}\n`);
        
        try {
            // Step 1: Check git status
            const hasChanges = await this.checkGitStatus();
            
            if (!hasChanges) {
                this.log('No changes to deploy', 'WARNING');
                return await this.generateDeploymentReport();
            }
            
            // Step 2: Add and commit
            await this.addAndCommit();
            
            // Step 3: Push to remote
            await this.pushToRemote();
            
            // Step 4: Track workflows
            await this.trackWorkflows();
            
            // Step 5: Validate deployment
            await this.validateDeployment();
            
            // Step 6: Generate report
            const report = await this.generateDeploymentReport();
            
            this.log('🎉 Deployment completed successfully!', 'SUCCESS');
            
            return report;
            
        } catch (error) {
            this.log(`💥 Deployment failed: ${error.message}`, 'ERROR');
            console.error('\n❌ Deployment failed with error:', error.message);
            await this.generateDeploymentReport();
            process.exit(1);
        }
    }
}

// CLI interface
if (require.main === module) {
    const tracker = new DeploymentTracker();
    tracker.deploy().catch(console.error);
}

module.exports = DeploymentTracker;
