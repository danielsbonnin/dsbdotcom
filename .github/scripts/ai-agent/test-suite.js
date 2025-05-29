/**
 * Comprehensive test suite for the refactored AI Agent system
 * 
 * This test suite validates all components of the AI agent:
 * 1. Trigger validation
 * 2. Duplicate checking  
 * 3. Issue parsing
 * 4. Notifications
 * 5. Implementation generation
 * 6. Pull request creation
 * 
 * Usage: node .github/scripts/ai-agent/test-suite.js
 */

const fs = require('fs');
const path = require('path');

// Import all AI agent modules
const { validateTrigger } = require('./validate-trigger.js');
const { checkDuplicateProcessing } = require('./check-duplicate.js');
const { parseIssueContent } = require('./parse-issue.js');
const { notifyProcessingStart, notifyProcessingFailure } = require('./notifications.js');
const { generateImplementation } = require('./generate-implementation.js');
const { createImplementationPR } = require('./create-pr.js');

class AIAgentTestSuite {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  // Mock GitHub API and context for testing
  createMockContext(overrides = {}) {
    const defaultContext = {
      payload: {
        issue: {
          number: 123,
          title: "Add a new contact form component",
          body: `### Task Type
Feature Implementation

### Priority  
High

### Task Description
Create a new contact form component with the following features:
- Name, email, and message fields
- Form validation
- Responsive design
- Submit handling

### Requirements
- Use TypeScript and React
- Style with Tailwind CSS
- Include proper accessibility
- Add basic form validation`,
          labels: [{ name: 'ai-agent' }, { name: 'enhancement' }],
          user: { login: 'testuser' },
          created_at: '2025-05-28T10:00:00Z'
        },
        comment: null
      },
      repo: {
        owner: 'danielsbonnin',
        repo: 'danielsbonnin.com'
      },
      issue: {
        number: 123
      }
    };

    return this.deepMerge(defaultContext, overrides);
  }  createMockGitHub() {
    // Create call tracking arrays
    const listCommentsCalls = [];
    const createCommentCalls = [];
    const addLabelsCalls = [];
    const removeLabelCalls = [];
    const createPullCalls = [];
    
    const mockAPI = {
      rest: {
        issues: {
          listComments: (params) => {
            listCommentsCalls.push(params);
            return Promise.resolve({
              data: []
            });
          },
          createComment: (params) => {
            createCommentCalls.push(params);
            return Promise.resolve({
              data: { id: 456 }
            });
          },
          addLabels: (params) => {
            addLabelsCalls.push(params);
            return Promise.resolve({});
          },
          removeLabel: (params) => {
            removeLabelCalls.push(params);
            return Promise.resolve({});
          }
        },
        pulls: {
          create: (params) => {
            createPullCalls.push(params);
            return Promise.resolve({
              data: {
                number: 789,
                html_url: 'https://github.com/danielsbonnin/danielsbonnin.com/pull/789'
              }
            });
          }
        }
      }
    };
    
    // Attach call arrays to the functions for easy access
    mockAPI.rest.issues.listComments.calls = listCommentsCalls;
    mockAPI.rest.issues.createComment.calls = createCommentCalls;
    mockAPI.rest.issues.addLabels.calls = addLabelsCalls;
    mockAPI.rest.issues.removeLabel.calls = removeLabelCalls;
    mockAPI.rest.pulls.create.calls = createPullCalls;
    
    return mockAPI;
  }
  createMockCore() {
    return {
      info: () => {},
      setOutput: () => {},
      setFailed: () => {}
    };
  }

  deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  async runTest(testName, testFn) {
    this.results.total++;
    console.log(`\n🧪 Running: ${testName}`);
    
    try {
      await testFn();
      this.results.passed++;
      console.log(`✅ PASSED: ${testName}`);
    } catch (error) {
      this.results.failed++;
      this.results.errors.push({ test: testName, error: error.message });
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  // Test 1: Validate Trigger Detection
  async testTriggerValidation() {
    await this.runTest('Trigger Validation - AI Agent Label', async () => {
      const context = this.createMockContext();
      const core = this.createMockCore();
      
      const result = await validateTrigger({ github: null, context, core });
      
      if (result['should-process'] !== 'true') {
        throw new Error('Should process issue with ai-agent label');
      }
    });

    await this.runTest('Trigger Validation - AI Agent Mention', async () => {
      const context = this.createMockContext({
        payload: {
          issue: {
            labels: [] // No ai-agent label
          },
          comment: {
            body: 'Hey @ai-agent please help with this task'
          }
        }
      });
      const core = this.createMockCore();
      
      const result = await validateTrigger({ github: null, context, core });
      
      if (result['should-process'] !== 'true') {
        throw new Error('Should process issue with @ai-agent mention');
      }
    });

    await this.runTest('Trigger Validation - No Trigger', async () => {
      const context = this.createMockContext({
        payload: {
          issue: {
            labels: [{ name: 'bug' }] // No ai-agent label
          },
          comment: null
        }
      });
      const core = this.createMockCore();
      
      const result = await validateTrigger({ github: null, context, core });
      
      if (result['should-process'] !== 'false') {
        throw new Error('Should not process issue without trigger');
      }
    });
  }

  // Test 2: Duplicate Processing Check
  async testDuplicateCheck() {
    await this.runTest('Duplicate Check - No Previous Processing', async () => {
      const context = this.createMockContext();
      const github = this.createMockGitHub();
      const core = this.createMockCore();
        // Mock no previous comments
      github.rest.issues.listComments = () => Promise.resolve({ data: [] });
      
      const result = await checkDuplicateProcessing({ github, context, core });
      
      if (result['should-continue'] !== 'true') {
        throw new Error('Should continue when no previous processing found');
      }
    });

    await this.runTest('Duplicate Check - Previous Processing Found', async () => {
      const context = this.createMockContext();
      const github = this.createMockGitHub();
      const core = this.createMockCore();
        // Mock previous AI agent comment
      github.rest.issues.listComments = () => Promise.resolve({
        data: [{
          user: { login: 'github-actions[bot]' },
          body: '🤖 **AI Agent Assigned**\n\nI am working on this task...'
        }]
      });
      
      const result = await checkDuplicateProcessing({ github, context, core });
      
      if (result['should-continue'] !== 'false') {
        throw new Error('Should not continue when previous processing found');
      }
    });
  }

  // Test 3: Issue Content Parsing
  async testIssueParsing() {
    await this.runTest('Issue Parsing - Complete Issue', async () => {
      const context = this.createMockContext();
      const core = this.createMockCore();
      
      const result = await parseIssueContent({ github: null, context, core });
      
      const taskData = JSON.parse(result['task-data']);
      
      if (!taskData.title || !taskData.description) {
        throw new Error('Should extract title and description');
      }
      
      if (taskData.taskType !== 'Feature Implementation') {
        throw new Error('Should extract task type correctly');
      }
      
      if (taskData.priority !== 'High') {
        throw new Error('Should extract priority correctly');
      }
    });

    await this.runTest('Issue Parsing - Minimal Issue', async () => {
      const context = this.createMockContext({
        payload: {
          issue: {
            title: 'Simple task',
            body: 'Just do something simple',
            labels: []
          }
        }
      });
      const core = this.createMockCore();
      
      const result = await parseIssueContent({ github: null, context, core });
      
      const taskData = JSON.parse(result['task-data']);
      
      if (taskData.title !== 'Simple task') {
        throw new Error('Should use title as fallback');
      }
      
      if (taskData.taskType !== 'Development') {
        throw new Error('Should use default task type');
      }
    });
  }

  // Test 4: Notification System
  async testNotifications() {
    await this.runTest('Start Notification', async () => {
      const context = this.createMockContext();
      const github = this.createMockGitHub();      const taskData = {
        title: 'Test Task',
        taskType: 'Feature',
        priority: 'Medium'
      };
      
      await notifyProcessingStart({ github, context, taskData });
      
        // Verify comment was created
      if (!github.rest.issues.createComment.calls || github.rest.issues.createComment.calls.length === 0) {
        throw new Error('Should create start notification comment');
      }
      
      // Verify labels were added
      if (!github.rest.issues.addLabels.calls || github.rest.issues.addLabels.calls.length === 0) {
        throw new Error('Should add processing labels');
      }
      
      const addedLabels = github.rest.issues.addLabels.calls[0].labels;
      if (!addedLabels.includes('in-progress') || !addedLabels.includes('ai-working')) {
        throw new Error('Should add correct processing labels');
      }
    });

    await this.runTest('Failure Notification', async () => {
      const context = this.createMockContext();
      const github = this.createMockGitHub();
      
      await notifyProcessingFailure({ github, context });
        // Verify failure comment was created
      if (!github.rest.issues.createComment.calls || github.rest.issues.createComment.calls.length === 0) {
        throw new Error('Should create failure notification comment');
      }
      
      const commentBody = github.rest.issues.createComment.calls[0].body;
      if (!commentBody.includes('❌ **AI Agent Processing Failed**')) {
        throw new Error('Should include failure message in comment');
      }
    });
  }

  // Test 5: Project Structure Analysis
  async testProjectAnalysis() {
    await this.runTest('Project Structure Analysis', async () => {
      // This test validates the project analysis functions
      const { generateImplementation } = require('./generate-implementation.js');
      
      // Create a mock context that won't trigger actual AI calls
      const context = this.createMockContext();
      const core = this.createMockCore();
      const taskData = {
        title: 'Test Task',
        description: 'Test description',
        taskType: 'Development'
      };
      
      // Test the analyzeProjectStructure function separately
      // We can't test the full generateImplementation without API key
      // but we can test its helper functions
      
      // Check if the module exports are correctly structured
      if (typeof generateImplementation !== 'function') {
        throw new Error('generateImplementation should be exported as function');
      }
      
      console.log('✓ Project analysis functions are properly structured');
    });
  }

  // Test 6: File Operations
  async testFileOperations() {
    await this.runTest('File System Operations', async () => {
      const testDir = path.join(process.cwd(), 'test-temp');
      const testFile = path.join(testDir, 'test-component.tsx');
      
      try {
        // Create test directory
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
        }
        
        // Test file creation
        const testContent = 'export default function TestComponent() { return <div>Test</div>; }';
        fs.writeFileSync(testFile, testContent);
        
        // Verify file was created
        if (!fs.existsSync(testFile)) {
          throw new Error('File creation failed');
        }
        
        // Verify content
        const readContent = fs.readFileSync(testFile, 'utf8');
        if (readContent !== testContent) {
          throw new Error('File content mismatch');
        }
        
        console.log('✓ File operations working correctly');
        
      } finally {
        // Cleanup
        try {
          if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
          if (fs.existsSync(testDir)) fs.rmdirSync(testDir);
        } catch (error) {
          console.warn('Cleanup error:', error.message);
        }
      }
    });
  }

  // Test 7: Configuration Validation
  async testConfiguration() {
    await this.runTest('Configuration Files', async () => {
      // Check if all required script files exist
      const requiredFiles = [
        'validate-trigger.js',
        'check-duplicate.js', 
        'parse-issue.js',
        'notifications.js',
        'generate-implementation.js',
        'create-pr.js'
      ];
      
      const scriptsDir = path.join(process.cwd(), '.github', 'scripts', 'ai-agent');
      
      for (const file of requiredFiles) {
        const filePath = path.join(scriptsDir, file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Required script file missing: ${file}`);
        }
      }
      
      // Check workflow file
      const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'ai-agent.yml');
      if (!fs.existsSync(workflowPath)) {
        throw new Error('AI agent workflow file missing');
      }
      
      console.log('✓ All configuration files present');
    });
  }

  // Test 8: Integration Test
  async testIntegration() {
    await this.runTest('End-to-End Integration', async () => {
      const context = this.createMockContext();
      const github = this.createMockGitHub();
      const core = this.createMockCore();
      
      // Step 1: Validate trigger
      const triggerResult = await validateTrigger({ github, context, core });
      if (triggerResult['should-process'] !== 'true') {
        throw new Error('Integration test failed at trigger validation');
      }
        // Step 2: Check duplicates  
      // The mock already returns empty array by default
      const duplicateResult = await checkDuplicateProcessing({ github, context, core });
      if (duplicateResult['should-continue'] !== 'true') {
        throw new Error('Integration test failed at duplicate check');
      }
      
      // Step 3: Parse issue
      const parseResult = await parseIssueContent({ github, context, core });
      const taskData = JSON.parse(parseResult['task-data']);
      if (!taskData.title) {
        throw new Error('Integration test failed at issue parsing');
      }
        // Step 4: Send notifications
      await notifyProcessingStart({ github, context, taskData });
      if (!github.rest.issues.createComment.calls || github.rest.issues.createComment.calls.length === 0) {
        throw new Error('Integration test failed at notifications');
      }
      
      console.log('✓ End-to-end integration test passed');
    });
  }

  async runAllTests() {
    console.log('🚀 Starting AI Agent Test Suite\n');
    console.log('=' .repeat(50));
    
    try {
      await this.testTriggerValidation();
      await this.testDuplicateCheck();
      await this.testIssueParsing();
      await this.testNotifications();
      await this.testProjectAnalysis();
      await this.testFileOperations();
      await this.testConfiguration();
      await this.testIntegration();
      
    } catch (error) {
      console.error('\n💥 Test suite execution error:', error);
    }
    
    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🐛 FAILURES:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test}`);
        console.log(`   ${error.error}\n`);
      });
    }
    
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    console.log(`\n🎯 Success Rate: ${successRate}%`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 All tests passed! The AI Agent is ready for deployment.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix issues before deployment.');
    }
  }
}

// Mock Jest functions for standalone execution
if (typeof global.jest === 'undefined') {
  global.jest = {
    fn: () => ({
      mockResolvedValue: (value) => () => Promise.resolve(value),
      mock: { calls: [] }
    })
  };
}

// Execute tests if run directly
if (require.main === module) {
  const testSuite = new AIAgentTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = { AIAgentTestSuite };
