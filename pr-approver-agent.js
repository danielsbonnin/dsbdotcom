#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

class PRApproverAgent {
    constructor() {
        this.approvalCriteria = {
            maxFilesChanged: 10,
            maxLinesChanged: 500,
            requiredChecks: ['build', 'test', 'lint'],
            restrictedPaths: ['.github/workflows', 'package.json', 'tsconfig.json'],
            approvalScoreThreshold: 75
        };
        this.evaluationLog = [];
    }

    async run(prNumber) {
        console.log(`🔍 PR Approver Agent analyzing PR #${prNumber}`);
        console.log(`🤖 Automated review in progress...\n`);
        
        try {
            const prData = await this.fetchPRData(prNumber);
            const evaluation = await this.evaluatePR(prData);
            const decision = await this.makeApprovalDecision(evaluation);
            await this.executeDecision(prNumber, decision);
            await this.generateApprovalReport(prNumber, evaluation, decision);
            
            return { prNumber, evaluation, decision };
        } catch (error) {
            console.error(`❌ PR approval failed: ${error.message}`);
            throw error;
        }
    }

    async fetchPRData(prNumber) {
        console.log('📋 Fetching PR data...');
        
        try {
            // Get PR details
            const { stdout: prJson } = await execAsync(`gh pr view ${prNumber} --json title,body,author,state,mergeable,files,additions,deletions,commits`);
            const prData = JSON.parse(prJson);
            
            // Get diff details
            const { stdout: diffOutput } = await execAsync(`gh pr diff ${prNumber}`);
            
            // Get status checks
            const { stdout: checksJson } = await execAsync(`gh pr checks ${prNumber} --json`);
            const checks = JSON.parse(checksJson);
            
            console.log(`   📝 Title: ${prData.title}`);
            console.log(`   👤 Author: ${prData.author.login}`);
            console.log(`   📊 Files: ${prData.files.length}, +${prData.additions}/-${prData.deletions}`);
            console.log(`   ✅ Checks: ${checks.length} status checks`);
            
            return {
                ...prData,
                diff: diffOutput,
                checks: checks
            };
            
        } catch (error) {
            throw new Error(`Failed to fetch PR data: ${error.message}`);
        }
    }

    async evaluatePR(prData) {
        console.log('\n🔬 Evaluating PR against approval criteria...');
        
        const evaluation = {
            scores: {},
            issues: [],
            recommendations: [],
            totalScore: 0
        };
        
        // 1. File change analysis
        const fileScore = this.evaluateFileChanges(prData);
        evaluation.scores.fileChanges = fileScore;
        console.log(`   📁 File Changes Score: ${fileScore.score}/100`);
        
        // 2. Code quality analysis
        const qualityScore = this.evaluateCodeQuality(prData);
        evaluation.scores.codeQuality = qualityScore;
        console.log(`   🧹 Code Quality Score: ${qualityScore.score}/100`);
        
        // 3. Security analysis
        const securityScore = this.evaluateSecurity(prData);
        evaluation.scores.security = securityScore;
        console.log(`   🔒 Security Score: ${securityScore.score}/100`);
        
        // 4. Test coverage analysis
        const testScore = this.evaluateTestCoverage(prData);
        evaluation.scores.testCoverage = testScore;
        console.log(`   🧪 Test Coverage Score: ${testScore.score}/100`);
        
        // 5. CI/CD checks analysis
        const ciScore = this.evaluateCIChecks(prData);
        evaluation.scores.ciChecks = ciScore;
        console.log(`   ⚙️  CI/CD Checks Score: ${ciScore.score}/100`);
        
        // Calculate weighted total score
        evaluation.totalScore = this.calculateTotalScore(evaluation.scores);
        console.log(`\n📊 Total Evaluation Score: ${evaluation.totalScore}/100`);
        
        // Collect all issues and recommendations
        Object.values(evaluation.scores).forEach(scoreData => {
            evaluation.issues.push(...scoreData.issues);
            evaluation.recommendations.push(...scoreData.recommendations);
        });
        
        return evaluation;
    }

    evaluateFileChanges(prData) {
        const result = { score: 100, issues: [], recommendations: [] };
        
        // Check number of files changed
        if (prData.files.length > this.approvalCriteria.maxFilesChanged) {
            result.score -= 20;
            result.issues.push(`Too many files changed: ${prData.files.length} (max: ${this.approvalCriteria.maxFilesChanged})`);
        }
        
        // Check lines changed
        const totalLines = prData.additions + prData.deletions;
        if (totalLines > this.approvalCriteria.maxLinesChanged) {
            result.score -= 15;
            result.issues.push(`Too many lines changed: ${totalLines} (max: ${this.approvalCriteria.maxLinesChanged})`);
        }
        
        // Check for restricted paths
        const restrictedFiles = prData.files.filter(file => 
            this.approvalCriteria.restrictedPaths.some(path => file.path.includes(path))
        );
        
        if (restrictedFiles.length > 0) {
            result.score -= 25;
            result.issues.push(`Restricted files modified: ${restrictedFiles.map(f => f.path).join(', ')}`);
            result.recommendations.push('Restricted file changes require manual review');
        }
        
        // Check for binary files
        const binaryFiles = prData.files.filter(file => file.patch === null);
        if (binaryFiles.length > 0) {
            result.score -= 10;
            result.issues.push(`Binary files changed: ${binaryFiles.length}`);
        }
        
        return result;
    }

    evaluateCodeQuality(prData) {
        const result = { score: 100, issues: [], recommendations: [] };
        
        // Check for common code quality indicators in diff
        const diff = prData.diff.toLowerCase();
        
        // Check for console.log statements
        if (diff.includes('console.log') || diff.includes('console.error')) {
            result.score -= 10;
            result.issues.push('Debug statements found (console.log/error)');
            result.recommendations.push('Remove debug statements before merging');
        }
        
        // Check for TODO/FIXME comments
        if (diff.includes('todo') || diff.includes('fixme')) {
            result.score -= 5;
            result.issues.push('TODO/FIXME comments found');
        }
        
        // Check for proper error handling patterns
        if (diff.includes('try') && !diff.includes('catch')) {
            result.score -= 15;
            result.issues.push('Try blocks without catch found');
            result.recommendations.push('Add proper error handling');
        }
        
        // Check for TypeScript compliance
        if (prData.files.some(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'))) {
            if (diff.includes('any') && diff.split('any').length > 3) {
                result.score -= 10;
                result.issues.push('Excessive use of "any" type');
                result.recommendations.push('Use proper TypeScript types instead of "any"');
            }
        }
        
        return result;
    }

    evaluateSecurity(prData) {
        const result = { score: 100, issues: [], recommendations: [] };
        
        const diff = prData.diff.toLowerCase();
        
        // Check for hardcoded secrets/credentials
        const secretPatterns = [
            /api[_-]?key/i,
            /secret/i,
            /password/i,
            /token/i,
            /credential/i
        ];
        
        secretPatterns.forEach(pattern => {
            if (pattern.test(prData.diff)) {
                result.score -= 30;
                result.issues.push(`Potential secret in code: ${pattern.source}`);
                result.recommendations.push('Use environment variables for secrets');
            }
        });
        
        // Check for dangerous functions
        if (diff.includes('eval(') || diff.includes('dangerouslysetinnerhtml')) {
            result.score -= 25;
            result.issues.push('Dangerous functions detected (eval, dangerouslySetInnerHTML)');
            result.recommendations.push('Review security implications of dangerous functions');
        }
        
        // Check for external dependencies in package.json changes
        const packageJsonFile = prData.files.find(f => f.path === 'package.json');
        if (packageJsonFile && packageJsonFile.patch) {
            const addedDeps = packageJsonFile.patch.match(/^\+.*".*":\s*".*"/gm);
            if (addedDeps && addedDeps.length > 0) {
                result.score -= 5;
                result.issues.push(`New dependencies added: ${addedDeps.length}`);
                result.recommendations.push('Review new dependencies for security vulnerabilities');
            }
        }
        
        return result;
    }

    evaluateTestCoverage(prData) {
        const result = { score: 100, issues: [], recommendations: [] };
        
        // Check if tests are included
        const testFiles = prData.files.filter(file => 
            file.path.includes('test') || 
            file.path.includes('spec') || 
            file.path.endsWith('.test.ts') || 
            file.path.endsWith('.spec.ts')
        );
        
        const sourceFiles = prData.files.filter(file => 
            (file.path.endsWith('.ts') || file.path.endsWith('.tsx') || 
             file.path.endsWith('.js') || file.path.endsWith('.jsx')) &&
            !file.path.includes('test') && !file.path.includes('spec')
        );
        
        if (sourceFiles.length > 0 && testFiles.length === 0) {
            result.score -= 30;
            result.issues.push('No test files included with source changes');
            result.recommendations.push('Add tests for new functionality');
        }
        
        // Check test to source ratio
        if (testFiles.length > 0 && sourceFiles.length > 0) {
            const ratio = testFiles.length / sourceFiles.length;
            if (ratio < 0.5) {
                result.score -= 15;
                result.issues.push('Low test-to-source file ratio');
                result.recommendations.push('Consider adding more comprehensive tests');
            }
        }
        
        return result;
    }

    evaluateCIChecks(prData) {
        const result = { score: 100, issues: [], recommendations: [] };
        
        if (!prData.checks || prData.checks.length === 0) {
            result.score -= 40;
            result.issues.push('No CI checks found');
            result.recommendations.push('Set up continuous integration checks');
            return result;
        }
        
        // Check if required checks are present
        const checkNames = prData.checks.map(check => check.name.toLowerCase());
        
        this.approvalCriteria.requiredChecks.forEach(requiredCheck => {
            const hasCheck = checkNames.some(name => name.includes(requiredCheck));
            if (!hasCheck) {
                result.score -= 15;
                result.issues.push(`Missing required check: ${requiredCheck}`);
            }
        });
        
        // Check if all checks are passing
        const failedChecks = prData.checks.filter(check => 
            check.conclusion === 'failure' || check.conclusion === 'cancelled'
        );
        
        if (failedChecks.length > 0) {
            result.score -= 30;
            result.issues.push(`Failed checks: ${failedChecks.map(c => c.name).join(', ')}`);
            result.recommendations.push('Fix failing CI checks before approval');
        }
        
        return result;
    }

    calculateTotalScore(scores) {
        const weights = {
            fileChanges: 0.15,
            codeQuality: 0.25,
            security: 0.30,
            testCoverage: 0.20,
            ciChecks: 0.10
        };
        
        let totalScore = 0;
        Object.entries(weights).forEach(([category, weight]) => {
            totalScore += (scores[category]?.score || 0) * weight;
        });
        
        return Math.round(totalScore);
    }

    async makeApprovalDecision(evaluation) {
        console.log('\n🤔 Making approval decision...');
        
        const decision = {
            approved: false,
            confidence: 0,
            reasoning: [],
            requiredActions: []
        };
        
        // Base decision on total score
        if (evaluation.totalScore >= this.approvalCriteria.approvalScoreThreshold) {
            decision.approved = true;
            decision.confidence = evaluation.totalScore;
            decision.reasoning.push(`Score ${evaluation.totalScore} exceeds threshold ${this.approvalCriteria.approvalScoreThreshold}`);
        } else {
            decision.approved = false;
            decision.confidence = 100 - evaluation.totalScore;
            decision.reasoning.push(`Score ${evaluation.totalScore} below threshold ${this.approvalCriteria.approvalScoreThreshold}`);
        }
        
        // Check for blocking issues
        const blockingIssues = evaluation.issues.filter(issue => 
            issue.includes('Restricted') || 
            issue.includes('secret') || 
            issue.includes('Failed checks')
        );
        
        if (blockingIssues.length > 0) {
            decision.approved = false;
            decision.reasoning.push('Blocking issues found');
            decision.requiredActions.push(...blockingIssues);
        }
        
        console.log(`   Decision: ${decision.approved ? '✅ APPROVED' : '❌ REJECTED'}`);
        console.log(`   Confidence: ${decision.confidence}%`);
        
        return decision;
    }

    async executeDecision(prNumber, decision) {
        console.log('\n⚡ Executing approval decision...');
        
        try {
            if (decision.approved) {
                // Approve the PR
                await execAsync(`gh pr review ${prNumber} --approve --body "🤖 Automated approval based on evaluation criteria. Score: ${decision.confidence}%"`);
                console.log('   ✅ PR approved automatically');
                
                // Check if we should auto-merge
                if (decision.confidence >= 90) {
                    console.log('   🔄 High confidence score - attempting auto-merge...');
                    try {
                        await execAsync(`gh pr merge ${prNumber} --squash --auto`);
                        console.log('   ✅ Auto-merge enabled');
                    } catch (mergeError) {
                        console.log('   ⚠️  Auto-merge failed - manual intervention required');
                    }
                }
            } else {
                // Request changes
                const reviewBody = `🤖 Automated review found issues that need attention:\n\n${decision.reasoning.join('\n')}\n\nRequired actions:\n${decision.requiredActions.map(action => `- ${action}`).join('\n')}`;
                
                await execAsync(`gh pr review ${prNumber} --request-changes --body "${reviewBody}"`);
                console.log('   ❌ PR review requested changes');
            }
        } catch (error) {
            console.error(`   ❌ Failed to execute decision: ${error.message}`);
        }
    }

    async generateApprovalReport(prNumber, evaluation, decision) {
        const timestamp = new Date().toISOString();
        const report = {
            prNumber,
            timestamp,
            evaluation,
            decision,
            approvalCriteria: this.approvalCriteria,
            evaluationLog: this.evaluationLog
        };
        
        const filename = `pr-approval-report-${prNumber}-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(report, null, 2));
        
        console.log(`\n📊 APPROVAL REPORT - PR #${prNumber}`);
        console.log('=' .repeat(50));
        console.log(`Final Decision: ${decision.approved ? 'APPROVED ✅' : 'REJECTED ❌'}`);
        console.log(`Confidence: ${decision.confidence}%`);
        console.log(`Total Score: ${evaluation.totalScore}/100`);
        console.log('\nScore Breakdown:');
        Object.entries(evaluation.scores).forEach(([category, data]) => {
            console.log(`  ${category}: ${data.score}/100`);
        });
        
        if (evaluation.issues.length > 0) {
            console.log('\nIssues Found:');
            evaluation.issues.forEach(issue => {
                console.log(`  - ${issue}`);
            });
        }
        
        if (evaluation.recommendations.length > 0) {
            console.log('\nRecommendations:');
            evaluation.recommendations.forEach(rec => {
                console.log(`  - ${rec}`);
            });
        }
        
        console.log(`\n💾 Full report saved to: ${filename}`);
        
        return report;
    }
}

// CLI interface
if (require.main === module) {
    const prNumber = process.argv[2];
    if (!prNumber) {
        console.error('Usage: node pr-approver-agent.js <pr-number>');
        process.exit(1);
    }
    
    const approver = new PRApproverAgent();
    approver.run(prNumber).catch(console.error);
}

module.exports = PRApproverAgent;
