#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

class AIAgentTestSuite {
    constructor() {
        this.testSession = {
            id: Date.now(),
            startTime: new Date().toISOString(),
            steps: [],
            results: {}
        };
    }

    async runFullTest() {
        console.log('🚀 Starting AI Agent Full Test Suite');
        console.log(`📋 Session ID: ${this.testSession.id}\n`);
        
        try {
            // Step 1: Create test issue (already done - Issue #37)
            await this.step1_VerifyTestIssue();
            
            // Step 2: Monitor workflow triggers
            await this.step2_MonitorWorkflowTriggers();
            
            // Step 3: Track AI agent execution
            await this.step3_TrackAIExecution();
            
            // Step 4: Monitor PR creation
            await this.step4_MonitorPRCreation();
            
            // Step 5: Test PR approval process
            await this.step5_TestPRApproval();
            
            // Step 6: Generate comprehensive report
            await this.step6_GenerateReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            this.logStep('ERROR', 'Test suite failed', { error: error.message });
        }
    }

    async step1_VerifyTestIssue() {
        this.logStep('INFO', 'Step 1: Verifying test issue #37');
        
        try {
            const { stdout } = await execAsync('gh issue view 37 --json number,title,state,labels');
            const issue = JSON.parse(stdout);
            
            console.log(`✅ Issue #37 verified: ${issue.title}`);
            console.log(`   State: ${issue.state}`);
            
            this.testSession.results.testIssue = issue;
            this.logStep('SUCCESS', 'Test issue verified', issue);
            
        } catch (error) {
            throw new Error(`Failed to verify test issue: ${error.message}`);
        }
    }

    async step2_MonitorWorkflowTriggers() {
        this.logStep('INFO', 'Step 2: Monitoring workflow triggers');
        
        try {
            // Get baseline workflow runs
            const { stdout } = await execAsync('gh run list --limit 5 --json id,workflowName,status,createdAt');
            const baselineRuns = JSON.parse(stdout);
            
            console.log(`📊 Baseline: ${baselineRuns.length} recent workflow runs`);
            baselineRuns.forEach(run => {
                console.log(`   - ${run.workflowName}: ${run.status}`);
            });
            
            this.testSession.results.baselineRuns = baselineRuns;
            
            // Trigger workflow by adding a label (if AI agent is configured to respond to labels)
            console.log('\n🏷️  Adding AI-agent label to trigger workflow...');
            await execAsync('gh issue edit 37 --add-label "ai-agent"');
            
            // Wait a bit and check for new runs
            console.log('⏳ Waiting 30 seconds for workflow to trigger...');
            await this.sleep(30000);
            
            const { stdout: newRuns } = await execAsync('gh run list --limit 10 --json id,workflowName,status,createdAt');
            const currentRuns = JSON.parse(newRuns);
            
            const triggeredRuns = currentRuns.filter(run => 
                !baselineRuns.find(baseline => baseline.id === run.id)
            );
            
            if (triggeredRuns.length > 0) {
                console.log(`✅ Detected ${triggeredRuns.length} new workflow runs:`);
                triggeredRuns.forEach(run => {
                    console.log(`   - ${run.workflowName}: ${run.status}`);
                });
                this.testSession.results.triggeredRuns = triggeredRuns;
            } else {
                console.log('⚠️  No new workflows detected - may need manual trigger');
                this.testSession.results.triggeredRuns = [];
            }
            
            this.logStep('SUCCESS', 'Workflow monitoring completed', { triggered: triggeredRuns.length });
            
        } catch (error) {
            this.logStep('WARNING', 'Workflow monitoring had issues', { error: error.message });
        }
    }

    async step3_TrackAIExecution() {
        this.logStep('INFO', 'Step 3: Tracking AI agent execution');
        
        try {
            // Run the AI agent debugger
            console.log('🔍 Running AI Agent Debugger...');
            const { stdout } = await execAsync('node ai-agent-debugger.js 37');
            
            console.log('AI Agent Debugger Output:');
            console.log(stdout);
            
            // Check for debug report files
            const debugFiles = fs.readdirSync('.').filter(file => 
                file.startsWith('ai-agent-debug-session-')
            );
            
            if (debugFiles.length > 0) {
                const latestDebugFile = debugFiles.sort().pop();
                const debugReport = JSON.parse(fs.readFileSync(latestDebugFile, 'utf8'));
                
                console.log(`✅ Debug report generated: ${latestDebugFile}`);
                console.log(`   Duplicates found: ${debugReport.summary.totalDuplicates}`);
                console.log(`   Actions tracked: ${debugReport.summary.totalActions}`);
                
                this.testSession.results.debugReport = debugReport;
            }
            
            this.logStep('SUCCESS', 'AI execution tracking completed');
            
        } catch (error) {
            this.logStep('WARNING', 'AI execution tracking had issues', { error: error.message });
        }
    }

    async step4_MonitorPRCreation() {
        this.logStep('INFO', 'Step 4: Monitoring PR creation');
        
        try {
            // Wait for potential PR creation
            console.log('⏳ Waiting for AI agent to create PR (60 seconds)...');
            await this.sleep(60000);
            
            // Check for recent PRs
            const { stdout } = await execAsync('gh pr list --limit 10 --json number,title,author,createdAt,state');
            const prs = JSON.parse(stdout);
            
            // Look for recent PRs (within last 10 minutes)
            const recentPRs = prs.filter(pr => {
                const created = new Date(pr.createdAt);
                const now = new Date();
                const minutesDiff = (now - created) / (1000 * 60);
                return minutesDiff < 10;
            });
            
            if (recentPRs.length > 0) {
                console.log(`✅ Found ${recentPRs.length} recent PRs:`);
                recentPRs.forEach(pr => {
                    console.log(`   - PR #${pr.number}: ${pr.title} by ${pr.author.login}`);
                });
                
                this.testSession.results.generatedPRs = recentPRs;
                
                // Test the most recent PR with the approver
                if (recentPRs.length > 0) {
                    await this.step5_TestPRApproval(recentPRs[0].number);
                }
            } else {
                console.log('⚠️  No recent PRs found - AI agent may not have created one yet');
                this.testSession.results.generatedPRs = [];
                
                // Create a mock PR for testing the approver
                await this.createMockPR();
            }
            
            this.logStep('SUCCESS', 'PR monitoring completed', { prsFound: recentPRs.length });
            
        } catch (error) {
            this.logStep('WARNING', 'PR monitoring had issues', { error: error.message });
        }
    }

    async step5_TestPRApproval(prNumber = null) {
        this.logStep('INFO', 'Step 5: Testing PR approval process');
        
        try {
            if (!prNumber) {
                console.log('ℹ️  No PR number provided, skipping approval test');
                return;
            }
            
            console.log(`🔍 Testing PR approval for PR #${prNumber}...`);
            
            // Run the PR approver agent
            const { stdout } = await execAsync(`node pr-approver-agent.js ${prNumber}`);
            
            console.log('PR Approver Agent Output:');
            console.log(stdout);
            
            // Check for approval report files
            const approvalFiles = fs.readdirSync('.').filter(file => 
                file.startsWith(`pr-approval-report-${prNumber}-`)
            );
            
            if (approvalFiles.length > 0) {
                const latestApprovalFile = approvalFiles.sort().pop();
                const approvalReport = JSON.parse(fs.readFileSync(latestApprovalFile, 'utf8'));
                
                console.log(`✅ Approval report generated: ${latestApprovalFile}`);
                console.log(`   Decision: ${approvalReport.decision.approved ? 'APPROVED' : 'REJECTED'}`);
                console.log(`   Score: ${approvalReport.evaluation.totalScore}/100`);
                
                this.testSession.results.approvalReport = approvalReport;
            }
            
            this.logStep('SUCCESS', 'PR approval testing completed');
            
        } catch (error) {
            this.logStep('WARNING', 'PR approval testing had issues', { error: error.message });
        }
    }

    async createMockPR() {
        console.log('🎭 Creating mock PR for testing...');
        
        try {
            // Create a simple change
            const mockFile = 'test-mock-change.md';
            const mockContent = `# Mock Change\n\nThis is a test change created at ${new Date().toISOString()}\n\nFor testing the PR approval process.`;
            
            fs.writeFileSync(mockFile, mockContent);
            
            // Commit and push
            await execAsync('git add test-mock-change.md');
            await execAsync('git commit -m "test: Add mock change for PR approval testing"');
            await execAsync('git push origin main');
            
            // Create PR
            const { stdout } = await execAsync(`gh pr create --title "test: Mock PR for approval testing" --body "This is a mock PR created for testing the AI PR approval process."`);
            
            const prUrl = stdout.trim();
            const prNumber = prUrl.split('/').pop();
            
            console.log(`✅ Mock PR created: #${prNumber}`);
            this.testSession.results.mockPR = { number: prNumber, url: prUrl };
            
            return prNumber;
            
        } catch (error) {
            console.log(`⚠️  Failed to create mock PR: ${error.message}`);
            return null;
        }
    }

    async step6_GenerateReport() {
        this.logStep('INFO', 'Step 6: Generating comprehensive test report');
        
        const endTime = new Date().toISOString();
        const duration = new Date(endTime) - new Date(this.testSession.startTime);
        
        const fullReport = {
            session: {
                ...this.testSession,
                endTime,
                duration: Math.round(duration / 1000) // seconds
            },
            summary: {
                issueCreated: !!this.testSession.results.testIssue,
                workflowsTriggered: this.testSession.results.triggeredRuns?.length || 0,
                duplicatesFound: this.testSession.results.debugReport?.summary?.totalDuplicates || 0,
                prsGenerated: this.testSession.results.generatedPRs?.length || 0,
                approvalTested: !!this.testSession.results.approvalReport
            },
            recommendations: this.generateRecommendations(),
            nextSteps: this.generateNextSteps()
        };
        
        const reportFile = `ai-agent-full-test-report-${this.testSession.id}.json`;
        fs.writeFileSync(reportFile, JSON.stringify(fullReport, null, 2));
        
        console.log('\n📊 COMPREHENSIVE TEST REPORT');
        console.log('=' .repeat(50));
        console.log(`Session Duration: ${Math.round(duration / 60000)} minutes`);
        console.log(`Issue Created: ${fullReport.summary.issueCreated ? '✅' : '❌'}`);
        console.log(`Workflows Triggered: ${fullReport.summary.workflowsTriggered}`);
        console.log(`Duplicates Found: ${fullReport.summary.duplicatesFound}`);
        console.log(`PRs Generated: ${fullReport.summary.prsGenerated}`);
        console.log(`Approval Tested: ${fullReport.summary.approvalTested ? '✅' : '❌'}`);
        
        console.log('\n💡 RECOMMENDATIONS:');
        fullReport.recommendations.forEach((rec, idx) => {
            console.log(`   ${idx + 1}. ${rec}`);
        });
        
        console.log('\n📋 NEXT STEPS:');
        fullReport.nextSteps.forEach((step, idx) => {
            console.log(`   ${idx + 1}. ${step}`);
        });
        
        console.log(`\n💾 Full report saved to: ${reportFile}`);
        
        this.logStep('SUCCESS', 'Test report generated', { reportFile });
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.testSession.results.debugReport?.summary?.totalDuplicates > 0) {
            recommendations.push('Clean up duplicate workflows to prevent conflicts');
        }
        
        if (!this.testSession.results.generatedPRs?.length) {
            recommendations.push('Verify AI agent configuration - no PRs were generated');
        }
        
        if (this.testSession.results.approvalReport?.decision?.approved === false) {
            recommendations.push('Review PR approval criteria - test PR was rejected');
        }
        
        recommendations.push('Set up monitoring dashboard for AI agent activities');
        recommendations.push('Consider implementing rate limiting for AI agent actions');
        
        return recommendations;
    }

    generateNextSteps() {
        return [
            'Configure webhook triggers for more responsive AI agent activation',
            'Set up automated cleanup of duplicate workflows',
            'Implement PR approval confidence scoring improvements',
            'Add notification system for AI agent activities',
            'Create rollback mechanism for AI-generated changes',
            'Set up performance metrics tracking for AI agents'
        ];
    }

    logStep(level, message, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        };
        
        this.testSession.steps.push(logEntry);
        console.log(`   ${level === 'ERROR' ? '❌' : level === 'WARNING' ? '⚠️' : '✅'} ${message}`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CLI interface
if (require.main === module) {
    const testSuite = new AIAgentTestSuite();
    testSuite.runFullTest().catch(console.error);
}

module.exports = AIAgentTestSuite;
