/**
 * Validates the AI Agent workflow configuration and dependencies
 * 
 * This script checks:
 * 1. Workflow YAML syntax
 * 2. Job dependencies
 * 3. Required files and structure
 * 4. Environment variables
 * 5. Permissions
 * 
 * Usage: node .github/scripts/ai-agent/validate-workflow.js
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class WorkflowValidator {
  constructor() {
    this.issues = [];
    this.warnings = [];
  }

  addIssue(severity, message, context = '') {
    const issue = { severity, message, context };
    if (severity === 'error') {
      this.issues.push(issue);
    } else {
      this.warnings.push(issue);
    }
  }

  // Validate workflow YAML structure
  validateWorkflowSyntax() {
    console.log('🔍 Validating workflow YAML syntax...');
    
    const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'ai-agent.yml');
    
    if (!fs.existsSync(workflowPath)) {
      this.addIssue('error', 'AI agent workflow file not found', workflowPath);
      return null;
    }

    try {
      const workflowContent = fs.readFileSync(workflowPath, 'utf8');
      const workflow = yaml.load(workflowContent);
      
      // Basic structure validation
      if (!workflow.name) {
        this.addIssue('error', 'Workflow missing name');
      }
      
      if (!workflow.on) {
        this.addIssue('error', 'Workflow missing trigger configuration');
      }
      
      if (!workflow.jobs) {
        this.addIssue('error', 'Workflow missing jobs');
      }
      
      console.log('✅ YAML syntax is valid');
      return workflow;
      
    } catch (error) {
      this.addIssue('error', `YAML syntax error: ${error.message}`, workflowPath);
      return null;
    }
  }

  // Validate job dependencies and flow
  validateJobFlow(workflow) {
    console.log('🔍 Validating job dependencies...');
    
    if (!workflow || !workflow.jobs) {
      return;
    }

    const expectedJobs = [
      'validate-trigger',
      'check-duplicate', 
      'parse-issue',
      'notify-start',
      'ai-implementation',
      'create-pull-request',
      'handle-failure'
    ];

    const actualJobs = Object.keys(workflow.jobs);
    
    // Check all expected jobs exist
    for (const expectedJob of expectedJobs) {
      if (!actualJobs.includes(expectedJob)) {
        this.addIssue('error', `Missing required job: ${expectedJob}`);
      }
    }

    // Validate job dependencies
    const jobDependencies = {
      'check-duplicate': ['validate-trigger'],
      'parse-issue': ['validate-trigger', 'check-duplicate'],
      'notify-start': ['validate-trigger', 'check-duplicate', 'parse-issue'],
      'ai-implementation': ['validate-trigger', 'check-duplicate', 'parse-issue', 'notify-start'],
      'create-pull-request': ['parse-issue', 'ai-implementation'],
      'handle-failure': ['validate-trigger', 'check-duplicate', 'parse-issue', 'notify-start', 'ai-implementation', 'create-pull-request']
    };

    for (const [job, expectedDeps] of Object.entries(jobDependencies)) {
      if (workflow.jobs[job]) {
        const actualDeps = workflow.jobs[job].needs;
        
        if (!actualDeps && expectedDeps.length > 0) {
          this.addIssue('error', `Job ${job} missing dependencies`, `Expected: ${expectedDeps.join(', ')}`);
        } else if (actualDeps) {
          const deps = Array.isArray(actualDeps) ? actualDeps : [actualDeps];
          for (const expectedDep of expectedDeps) {
            if (!deps.includes(expectedDep)) {
              this.addIssue('warning', `Job ${job} missing dependency: ${expectedDep}`);
            }
          }
        }
      }
    }

    console.log('✅ Job dependencies validated');
  }

  // Validate required script files
  validateScriptFiles() {
    console.log('🔍 Validating script files...');
    
    const scriptsDir = path.join(process.cwd(), '.github', 'scripts', 'ai-agent');
    const requiredScripts = [
      'validate-trigger.js',
      'check-duplicate.js',
      'parse-issue.js', 
      'notifications.js',
      'generate-implementation.js',
      'create-pr.js'
    ];

    for (const script of requiredScripts) {
      const scriptPath = path.join(scriptsDir, script);
      
      if (!fs.existsSync(scriptPath)) {
        this.addIssue('error', `Missing script file: ${script}`, scriptPath);
        continue;
      }

      // Validate script exports
      try {
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');
        
        // Check for module.exports
        if (!scriptContent.includes('module.exports')) {
          this.addIssue('error', `Script ${script} missing module.exports`);
        }

        // Validate specific function exports
        const expectedExports = {
          'validate-trigger.js': ['validateTrigger'],
          'check-duplicate.js': ['checkDuplicateProcessing'],
          'parse-issue.js': ['parseIssueContent'],
          'notifications.js': ['notifyProcessingStart', 'notifyProcessingFailure'],
          'generate-implementation.js': ['generateImplementation'],
          'create-pr.js': ['createImplementationPR']
        };

        const requiredFunctions = expectedExports[script] || [];
        for (const func of requiredFunctions) {
          if (!scriptContent.includes(func)) {
            this.addIssue('error', `Script ${script} missing function: ${func}`);
          }
        }
        
      } catch (error) {
        this.addIssue('error', `Error reading script ${script}: ${error.message}`);
      }
    }

    console.log('✅ Script files validated');
  }

  // Validate permissions
  validatePermissions(workflow) {
    console.log('🔍 Validating job permissions...');
    
    if (!workflow || !workflow.jobs) {
      return;
    }

    const requiredPermissions = {
      'validate-trigger': ['issues: read'],
      'check-duplicate': ['issues: read'],
      'parse-issue': ['issues: read'],
      'notify-start': ['issues: write'],
      'ai-implementation': ['contents: write', 'issues: write', 'pull-requests: write'],
      'create-pull-request': ['contents: read', 'issues: write', 'pull-requests: write'],
      'handle-failure': ['issues: write']
    };

    for (const [jobName, requiredPerms] of Object.entries(requiredPermissions)) {
      const job = workflow.jobs[jobName];
      if (!job) continue;

      if (!job.permissions) {
        this.addIssue('warning', `Job ${jobName} missing permissions configuration`);
        continue;
      }

      for (const perm of requiredPerms) {
        const [resource, level] = perm.split(': ');
        if (!job.permissions[resource] || job.permissions[resource] !== level) {
          this.addIssue('warning', `Job ${jobName} missing permission: ${perm}`);
        }
      }
    }

    console.log('✅ Permissions validated');
  }

  // Validate environment and secrets
  validateEnvironment() {
    console.log('🔍 Validating environment configuration...');
    
    // Check package.json dependencies
    const packagePath = path.join(process.cwd(), 'package.json');
    
    if (fs.existsSync(packagePath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // Required dependencies for AI agent
        const requiredDeps = [
          '@google/generative-ai',
          'js-yaml'  // For this validation script
        ];

        for (const dep of requiredDeps) {
          if (!dependencies[dep]) {
            this.addIssue('warning', `Missing dependency: ${dep}`, 'Consider adding to package.json');
          }
        }
        
      } catch (error) {
        this.addIssue('warning', `Error reading package.json: ${error.message}`);
      }
    }

    // Check for required secrets documentation
    const readmePath = path.join(process.cwd(), 'README.md');
    if (fs.existsSync(readmePath)) {
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      if (!readmeContent.includes('GEMINI_API_KEY')) {
        this.addIssue('warning', 'README should document GEMINI_API_KEY secret requirement');
      }
    }

    console.log('✅ Environment validated');
  }

  // Validate workflow triggers
  validateTriggers(workflow) {
    console.log('🔍 Validating workflow triggers...');
    
    if (!workflow || !workflow.on) {
      return;
    }

    const expectedTriggers = ['issues', 'issue_comment'];
    
    for (const trigger of expectedTriggers) {
      if (!workflow.on[trigger]) {
        this.addIssue('error', `Missing trigger: ${trigger}`);
      }
    }

    // Validate issue trigger types
    if (workflow.on.issues) {
      const expectedTypes = ['opened', 'labeled'];
      const actualTypes = workflow.on.issues.types || [];
      
      for (const type of expectedTypes) {
        if (!actualTypes.includes(type)) {
          this.addIssue('warning', `Missing issue trigger type: ${type}`);
        }
      }
    }

    // Validate comment trigger types
    if (workflow.on.issue_comment) {
      const expectedTypes = ['created'];
      const actualTypes = workflow.on.issue_comment.types || [];
      
      for (const type of expectedTypes) {
        if (!actualTypes.includes(type)) {
          this.addIssue('warning', `Missing comment trigger type: ${type}`);
        }
      }
    }

    console.log('✅ Triggers validated');
  }

  // Check for common issues
  validateCommonIssues(workflow) {
    console.log('🔍 Checking for common issues...');
    
    // Check for proper Node.js version
    if (workflow && workflow.env && workflow.env.NODE_VERSION) {
      const nodeVersion = workflow.env.NODE_VERSION;
      if (nodeVersion < '18') {
        this.addIssue('warning', `Node.js version ${nodeVersion} may be too old. Consider using 18+`);
      }
    }

    // Check for sparse checkout optimization
    const workflowContent = fs.readFileSync(
      path.join(process.cwd(), '.github', 'workflows', 'ai-agent.yml'), 
      'utf8'
    );
    
    if (!workflowContent.includes('sparse-checkout')) {
      this.addIssue('warning', 'Consider using sparse-checkout for better performance');
    }

    // Check for background processes
    if (!workflowContent.includes('isBackground')) {
      this.addIssue('info', 'Consider using isBackground for long-running tasks');
    }

    console.log('✅ Common issues checked');
  }

  // Run all validations
  async validate() {
    console.log('🚀 Starting AI Agent Workflow Validation\n');
    console.log('='.repeat(60));
    
    const workflow = this.validateWorkflowSyntax();
    this.validateJobFlow(workflow);
    this.validateScriptFiles();
    this.validatePermissions(workflow);
    this.validateEnvironment();
    this.validateTriggers(workflow);
    this.validateCommonIssues(workflow);
    
    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION RESULTS');
    console.log('='.repeat(60));
    
    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('🎉 All validations passed! The AI Agent workflow is properly configured.');
      return;
    }

    if (this.issues.length > 0) {
      console.log('\n❌ ERRORS (Must Fix):');
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.message}`);
        if (issue.context) {
          console.log(`   Context: ${issue.context}`);
        }
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (Recommended):');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.message}`);
        if (warning.context) {
          console.log(`   Context: ${warning.context}`);
        }
      });
    }

    console.log(`\n📈 Summary: ${this.issues.length} errors, ${this.warnings.length} warnings`);
    
    if (this.issues.length > 0) {
      console.log('\n🛠️  Please fix all errors before deploying the AI Agent.');
    } else {
      console.log('\n✅ No critical errors found. The workflow should function correctly.');
    }
  }
}

// Install js-yaml if not present (for validation)
function ensureDependencies() {
  try {
    require('js-yaml');
  } catch (error) {
    console.log('📦 Installing js-yaml for validation...');
    const { execSync } = require('child_process');
    try {
      execSync('npm install js-yaml', { stdio: 'inherit' });
      console.log('✅ js-yaml installed successfully');
    } catch (installError) {
      console.warn('⚠️  Could not install js-yaml. YAML validation may be limited.');
      // Provide a basic YAML parser fallback
      global.yaml = {
        load: (content) => {
          try {
            // Very basic YAML to JSON conversion for validation purposes
            return JSON.parse(content.replace(/^---\n/, '').replace(/\n$/, ''));
          } catch {
            throw new Error('Basic YAML parsing failed');
          }
        }
      };
    }
  }
}

// Execute validation if run directly
if (require.main === module) {
  ensureDependencies();
  const validator = new WorkflowValidator();
  validator.validate().catch(console.error);
}

module.exports = { WorkflowValidator };
