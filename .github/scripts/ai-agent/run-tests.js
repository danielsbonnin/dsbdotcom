#!/usr/bin/env node

/**
 * AI Agent Testing Orchestrator
 * 
 * This script orchestrates all testing activities for the refactored AI Agent:
 * 1. Workflow validation
 * 2. Unit tests for individual components
 * 3. Mock integration tests
 * 4. Performance benchmarks
 * 5. Configuration checks
 * 
 * Usage: node .github/scripts/ai-agent/run-tests.js [--verbose] [--skip-performance]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AIAgentTestOrchestrator {
  constructor(options = {}) {
    this.options = {
      verbose: options.verbose || false,
      skipPerformance: options.skipPerformance || false,
      outputDir: options.outputDir || path.join(process.cwd(), 'test-results')
    };
    
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      tests: {},
      recommendations: []
    };
    
    this.ensureOutputDirectory();
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️ ',
      error: '❌',
      debug: '🔍'
    }[level] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (this.options.verbose || level !== 'debug') {
      // Could also write to log file here
    }
  }

  async runWorkflowValidation() {
    this.log('Running workflow validation...', 'info');
    
    try {
      const { WorkflowValidator } = require('./validate-workflow.js');
      const validator = new WorkflowValidator();
      
      // Capture validation results
      const originalConsoleLog = console.log;
      const logs = [];
      console.log = (...args) => logs.push(args.join(' '));
      
      await validator.validate();
      
      console.log = originalConsoleLog;
      
      const result = {
        passed: validator.issues.length === 0,
        errors: validator.issues.length,
        warnings: validator.warnings.length,
        details: {
          issues: validator.issues,
          warnings: validator.warnings
        },
        logs: logs
      };
      
      this.results.tests.workflowValidation = result;
      this.updateSummary(result);
      
      if (result.passed) {
        this.log('Workflow validation passed', 'success');
      } else {
        this.log(`Workflow validation failed: ${result.errors} errors, ${result.warnings} warnings`, 'error');
      }
      
      return result;
      
    } catch (error) {
      this.log(`Workflow validation error: ${error.message}`, 'error');
      const result = { passed: false, error: error.message };
      this.results.tests.workflowValidation = result;
      this.updateSummary(result);
      return result;
    }
  }

  async runUnitTests() {
    this.log('Running unit tests...', 'info');
    
    try {
      // Check if we can run the test suite
      const testSuitePath = path.join(__dirname, 'test-suite.js');
      
      if (!fs.existsSync(testSuitePath)) {
        throw new Error('Test suite file not found');
      }
      
      // Mock Jest if not available
      if (typeof global.jest === 'undefined') {
        global.jest = {
          fn: () => ({
            mockResolvedValue: (value) => () => Promise.resolve(value),
            mock: { calls: [] }
          })
        };
      }
      
      const { AIAgentTestSuite } = require('./test-suite.js');
      const testSuite = new AIAgentTestSuite();
      
      // Capture test results
      const originalConsoleLog = console.log;
      const logs = [];
      console.log = (...args) => logs.push(args.join(' '));
      
      await testSuite.runAllTests();
      
      console.log = originalConsoleLog;
      
      const result = {
        passed: testSuite.results.failed === 0,
        total: testSuite.results.total,
        passed_count: testSuite.results.passed,
        failed_count: testSuite.results.failed,
        errors: testSuite.results.errors,
        logs: logs
      };
      
      this.results.tests.unitTests = result;
      this.updateSummary(result);
      
      if (result.passed) {
        this.log(`Unit tests passed: ${result.passed_count}/${result.total}`, 'success');
      } else {
        this.log(`Unit tests failed: ${result.failed_count}/${result.total} failed`, 'error');
      }
      
      return result;
      
    } catch (error) {
      this.log(`Unit tests error: ${error.message}`, 'error');
      const result = { passed: false, error: error.message };
      this.results.tests.unitTests = result;
      this.updateSummary(result);
      return result;
    }
  }

  async runMockIntegrationTests() {
    this.log('Running mock integration tests...', 'info');
    
    try {
      const { MockAIAgentTest } = require('./mock-test.js');
      const mockTest = new MockAIAgentTest();
      
      // Capture mock test results
      const originalConsoleLog = console.log;
      const logs = [];
      console.log = (...args) => logs.push(args.join(' '));
      
      await mockTest.runCompleteTest();
      
      console.log = originalConsoleLog;
      
      // Analyze mock test logs for results
      const passedTests = logs.filter(log => log.includes('✅')).length;
      const failedTests = logs.filter(log => log.includes('❌')).length;
      const totalTests = passedTests + failedTests;
      
      const result = {
        passed: failedTests === 0,
        total: totalTests,
        passed_count: passedTests,
        failed_count: failedTests,
        logs: logs.slice(0, 50) // Limit log size
      };
      
      this.results.tests.mockIntegration = result;
      this.updateSummary(result);
      
      if (result.passed) {
        this.log(`Mock integration tests passed: ${result.passed_count}/${result.total}`, 'success');
      } else {
        this.log(`Mock integration tests failed: ${result.failed_count}/${result.total} failed`, 'error');
      }
      
      return result;
      
    } catch (error) {
      this.log(`Mock integration tests error: ${error.message}`, 'error');
      const result = { passed: false, error: error.message };
      this.results.tests.mockIntegration = result;
      this.updateSummary(result);
      return result;
    }
  }

  async runConfigurationChecks() {
    this.log('Running configuration checks...', 'info');
    
    try {
      const checks = [];
      
      // Check 1: Required files exist
      const requiredFiles = [
        '.github/workflows/ai-agent.yml',
        '.github/scripts/ai-agent/validate-trigger.js',
        '.github/scripts/ai-agent/check-duplicate.js',
        '.github/scripts/ai-agent/parse-issue.js',
        '.github/scripts/ai-agent/notifications.js',
        '.github/scripts/ai-agent/generate-implementation.js',
        '.github/scripts/ai-agent/create-pr.js',
        'package.json'
      ];
      
      for (const file of requiredFiles) {
        const filePath = path.join(process.cwd(), file);
        checks.push({
          name: `File exists: ${file}`,
          passed: fs.existsSync(filePath),
          critical: true
        });
      }
      
      // Check 2: Package.json dependencies
      try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        const requiredDeps = ['@google/generative-ai'];
        
        for (const dep of requiredDeps) {
          checks.push({
            name: `Dependency: ${dep}`,
            passed: !!dependencies[dep],
            critical: true
          });
        }
      } catch (error) {
        checks.push({
          name: 'Package.json readable',
          passed: false,
          critical: true,
          error: error.message
        });
      }
      
      // Check 3: Environment variables documentation
      const readmePath = path.join(process.cwd(), 'README.md');
      if (fs.existsSync(readmePath)) {
        const readmeContent = fs.readFileSync(readmePath, 'utf8');
        checks.push({
          name: 'GEMINI_API_KEY documented',
          passed: readmeContent.includes('GEMINI_API_KEY'),
          critical: false
        });
      }
      
      // Check 4: Git configuration
      try {
        execSync('git --version', { stdio: 'ignore' });
        checks.push({
          name: 'Git available',
          passed: true,
          critical: false
        });
      } catch (error) {
        checks.push({
          name: 'Git available',
          passed: false,
          critical: false
        });
      }
      
      const passedChecks = checks.filter(c => c.passed).length;
      const failedChecks = checks.filter(c => !c.passed).length;
      const criticalFailures = checks.filter(c => !c.passed && c.critical).length;
      
      const result = {
        passed: criticalFailures === 0,
        total: checks.length,
        passed_count: passedChecks,
        failed_count: failedChecks,
        critical_failures: criticalFailures,
        checks: checks
      };
      
      this.results.tests.configuration = result;
      this.updateSummary(result);
      
      if (result.passed) {
        this.log(`Configuration checks passed: ${result.passed_count}/${result.total}`, 'success');
      } else {
        this.log(`Configuration checks failed: ${result.critical_failures} critical failures`, 'error');
      }
      
      return result;
      
    } catch (error) {
      this.log(`Configuration checks error: ${error.message}`, 'error');
      const result = { passed: false, error: error.message };
      this.results.tests.configuration = result;
      this.updateSummary(result);
      return result;
    }
  }

  async runPerformanceBenchmarks() {
    if (this.options.skipPerformance) {
      this.log('Skipping performance benchmarks', 'info');
      return { skipped: true };
    }
    
    this.log('Running performance benchmarks...', 'info');
    
    try {
      const benchmarks = [];
      
      // Benchmark 1: Module loading time
      const moduleLoadStart = Date.now();
      require('./validate-trigger.js');
      require('./check-duplicate.js');
      require('./parse-issue.js');
      require('./notifications.js');
      require('./generate-implementation.js');
      require('./create-pr.js');
      const moduleLoadTime = Date.now() - moduleLoadStart;
      
      benchmarks.push({
        name: 'Module Loading',
        time: moduleLoadTime,
        threshold: 1000, // 1 second
        passed: moduleLoadTime < 1000
      });
      
      // Benchmark 2: Mock API response time
      const { MockAIAgentTest } = require('./mock-test.js');
      const mockTest = new MockAIAgentTest();
      
      const apiStart = Date.now();
      await mockTest.testTriggerValidation();
      await mockTest.testDuplicateCheck();
      await mockTest.testIssueParsing();
      const apiTime = Date.now() - apiStart;
      
      benchmarks.push({
        name: 'Mock API Operations',
        time: apiTime,
        threshold: 5000, // 5 seconds
        passed: apiTime < 5000
      });
      
      // Benchmark 3: File operations
      const fileStart = Date.now();
      const tempFile = path.join(process.cwd(), 'temp-benchmark.txt');
      fs.writeFileSync(tempFile, 'benchmark test');
      const content = fs.readFileSync(tempFile, 'utf8');
      fs.unlinkSync(tempFile);
      const fileTime = Date.now() - fileStart;
      
      benchmarks.push({
        name: 'File Operations',
        time: fileTime,
        threshold: 100, // 100ms
        passed: fileTime < 100
      });
      
      const passedBenchmarks = benchmarks.filter(b => b.passed).length;
      const result = {
        passed: passedBenchmarks === benchmarks.length,
        total: benchmarks.length,
        passed_count: passedBenchmarks,
        failed_count: benchmarks.length - passedBenchmarks,
        benchmarks: benchmarks
      };
      
      this.results.tests.performance = result;
      this.updateSummary(result);
      
      if (result.passed) {
        this.log(`Performance benchmarks passed: all within thresholds`, 'success');
      } else {
        this.log(`Performance benchmarks failed: ${result.failed_count} exceeded thresholds`, 'warning');
      }
      
      return result;
      
    } catch (error) {
      this.log(`Performance benchmarks error: ${error.message}`, 'error');
      const result = { passed: false, error: error.message };
      this.results.tests.performance = result;
      this.updateSummary(result);
      return result;
    }
  }

  updateSummary(result) {
    this.results.summary.total++;
    
    if (result.passed) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
    
    if (result.warnings || result.warnings > 0) {
      this.results.summary.warnings += result.warnings || 1;
    }
  }

  generateRecommendations() {
    this.log('Generating recommendations...', 'info');
    
    const recommendations = [];
    
    // Workflow recommendations
    if (this.results.tests.workflowValidation && !this.results.tests.workflowValidation.passed) {
      recommendations.push({
        type: 'critical',
        category: 'workflow',
        message: 'Fix workflow validation errors before deployment',
        action: 'Review and fix all errors in .github/workflows/ai-agent.yml'
      });
    }
    
    // Configuration recommendations
    if (this.results.tests.configuration && this.results.tests.configuration.critical_failures > 0) {
      recommendations.push({
        type: 'critical',
        category: 'configuration',
        message: 'Critical configuration files missing',
        action: 'Ensure all required files exist and dependencies are installed'
      });
    }
    
    // Performance recommendations
    if (this.results.tests.performance && !this.results.tests.performance.passed) {
      recommendations.push({
        type: 'optimization',
        category: 'performance',
        message: 'Performance benchmarks exceeded thresholds',
        action: 'Consider optimizing slow operations or increasing timeout values'
      });
    }
    
    // General recommendations
    if (this.results.summary.passed === this.results.summary.total) {
      recommendations.push({
        type: 'success',
        category: 'deployment',
        message: 'All tests passed - ready for deployment',
        action: 'Deploy the AI Agent to production and monitor initial runs'
      });
    }
    
    this.results.recommendations = recommendations;
    
    return recommendations;
  }

  saveResults() {
    const resultFile = path.join(this.options.outputDir, `ai-agent-test-results-${Date.now()}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(this.results, null, 2));
    
    // Also save a human-readable report
    const reportFile = path.join(this.options.outputDir, `ai-agent-test-report-${Date.now()}.md`);
    const report = this.generateMarkdownReport();
    fs.writeFileSync(reportFile, report);
    
    this.log(`Results saved to: ${resultFile}`, 'success');
    this.log(`Report saved to: ${reportFile}`, 'success');
    
    return { resultFile, reportFile };
  }

  generateMarkdownReport() {
    const { summary, tests, recommendations } = this.results;
    
    return `# AI Agent Test Report

Generated: ${this.results.timestamp}

## Summary

- **Total Tests:** ${summary.total}
- **Passed:** ${summary.passed} ✅
- **Failed:** ${summary.failed} ❌
- **Warnings:** ${summary.warnings} ⚠️
- **Success Rate:** ${((summary.passed / summary.total) * 100).toFixed(1)}%

## Test Results

### Workflow Validation
${tests.workflowValidation ? 
  (tests.workflowValidation.passed ? '✅ PASSED' : `❌ FAILED (${tests.workflowValidation.errors} errors)`) :
  '⏭️ SKIPPED'
}

### Unit Tests
${tests.unitTests ? 
  (tests.unitTests.passed ? '✅ PASSED' : `❌ FAILED (${tests.unitTests.failed_count}/${tests.unitTests.total})`) :
  '⏭️ SKIPPED'
}

### Mock Integration Tests
${tests.mockIntegration ? 
  (tests.mockIntegration.passed ? '✅ PASSED' : `❌ FAILED (${tests.mockIntegration.failed_count}/${tests.mockIntegration.total})`) :
  '⏭️ SKIPPED'
}

### Configuration Checks
${tests.configuration ? 
  (tests.configuration.passed ? '✅ PASSED' : `❌ FAILED (${tests.configuration.critical_failures} critical)`) :
  '⏭️ SKIPPED'
}

### Performance Benchmarks
${tests.performance ? 
  (tests.performance.skipped ? '⏭️ SKIPPED' : 
   tests.performance.passed ? '✅ PASSED' : `⚠️ SLOW (${tests.performance.failed_count}/${tests.performance.total})`) :
  '⏭️ SKIPPED'
}

## Recommendations

${recommendations.map(rec => `
### ${rec.type.toUpperCase()}: ${rec.category}
${rec.message}

**Action:** ${rec.action}
`).join('\n')}

## Next Steps

${summary.failed === 0 ? 
  '🎉 All tests passed! The AI Agent is ready for production deployment.' :
  '⚠️ Please address failed tests before deploying to production.'
}

---
*Generated by AI Agent Test Orchestrator*
`;
  }

  printFinalResults() {
    console.log('\n' + '='.repeat(70));
    console.log('🎯 AI AGENT TEST ORCHESTRATOR - FINAL RESULTS');
    console.log('='.repeat(70));
    
    const { summary } = this.results;
    
    console.log(`\n📊 Overall Summary:`);
    console.log(`   Total Tests: ${summary.total}`);
    console.log(`   ✅ Passed: ${summary.passed}`);
    console.log(`   ❌ Failed: ${summary.failed}`);
    console.log(`   ⚠️  Warnings: ${summary.warnings}`);
    console.log(`   🎯 Success Rate: ${((summary.passed / summary.total) * 100).toFixed(1)}%`);
    
    console.log(`\n📋 Test Breakdown:`);
    Object.entries(this.results.tests).forEach(([testName, result]) => {
      const status = result.skipped ? '⏭️ SKIP' : result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${status} ${testName.replace(/([A-Z])/g, ' $1').trim()}`);
    });
    
    if (this.results.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      this.results.recommendations.forEach((rec, index) => {
        const icon = rec.type === 'critical' ? '🚨' : rec.type === 'success' ? '🎉' : '💡';
        console.log(`   ${icon} ${rec.message}`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    
    if (summary.failed === 0) {
      console.log('🎉 SUCCESS: AI Agent is ready for production!');
      console.log('   All components validated and working correctly.');
    } else {
      console.log('⚠️  ACTION REQUIRED: Please fix failed tests before deployment.');
      console.log('   Review detailed logs and recommendations above.');
    }
    
    console.log('='.repeat(70));
  }

  async runAllTests() {
    this.log('Starting comprehensive AI Agent testing...', 'info');
    
    try {
      await this.runWorkflowValidation();
      await this.runUnitTests();
      await this.runMockIntegrationTests();
      await this.runConfigurationChecks();
      await this.runPerformanceBenchmarks();
      
      this.generateRecommendations();
      const files = this.saveResults();
      
      this.printFinalResults();
      
      return {
        success: this.results.summary.failed === 0,
        results: this.results,
        files
      };
      
    } catch (error) {
      this.log(`Critical error during testing: ${error.message}`, 'error');
      console.error(error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose'),
    skipPerformance: args.includes('--skip-performance')
  };
  
  console.log('🚀 AI Agent Test Orchestrator');
  console.log('============================\n');
  
  if (options.verbose) {
    console.log('🔍 Verbose mode enabled');
  }
  
  if (options.skipPerformance) {
    console.log('⏭️  Performance tests skipped');
  }
  
  const orchestrator = new AIAgentTestOrchestrator(options);
  orchestrator.runAllTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { AIAgentTestOrchestrator };
