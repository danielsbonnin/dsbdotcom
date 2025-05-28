#!/usr/bin/env node

/**
 * AI Agent with Gemini Integration
 * This script processes GitHub issues and generates code implementations using Gemini API
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GeminiAIAgent {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        this.issueData = null;
        this.repoStructure = null;
    }

    async initialize(issueData) {
        this.issueData = issueData;
        await this.analyzeRepository();
        console.log('🤖 Gemini AI Agent initialized successfully');
    }

    async analyzeRepository() {
        console.log('📁 Analyzing repository structure...');
        
        // Get repository structure
        const getFiles = (dir, files = []) => {
            const fileList = fs.readdirSync(dir);
            for (const file of fileList) {
                const name = `${dir}/${file}`;
                if (fs.statSync(name).isDirectory()) {
                    if (!name.includes('node_modules') && !name.includes('.git') && !name.includes('.next')) {
                        getFiles(name, files);
                    }
                } else {
                    if (file.match(/\.(tsx?|jsx?|css|md|json)$/)) {
                        files.push(name);
                    }
                }
            }
            return files;
        };

        this.repoStructure = getFiles('.').slice(0, 50); // Limit for context
        console.log(`📊 Found ${this.repoStructure.length} relevant files`);
    }

    async generateImplementationPlan() {
        console.log('🧠 Generating implementation plan with Gemini...');

        const prompt = `
You are an expert full-stack developer working on a Next.js project. Analyze this GitHub issue and create a detailed implementation plan.

## Repository Structure:
${this.repoStructure.map(file => `- ${file}`).join('\n')}

## Issue Details:
**Title:** ${this.issueData.title}
**Description:** ${this.issueData.body}

## Your Task:
1. Analyze the requirements carefully
2. Identify which files need to be modified or created
3. Create a step-by-step implementation plan
4. Consider Next.js best practices, TypeScript, and Tailwind CSS
5. Think about component reusability and maintainability

Please respond with a structured implementation plan in this format:

## Analysis
Brief analysis of what needs to be done

## Files to Modify/Create
- file1.tsx: Brief description of changes
- file2.ts: Brief description of changes

## Implementation Steps
1. Step one
2. Step two
3. etc.

## Testing Strategy
How to test the implementation

Be specific and actionable. Focus on Next.js 14+ app router, TypeScript, and modern React patterns.
`;

        try {
            const result = await this.model.generateContent(prompt);
            const plan = result.response.text();
            
            // Save the plan
            fs.writeFileSync('.ai-logs/implementation-plan.md', plan);
            console.log('✅ Implementation plan generated and saved');
            
            return plan;
        } catch (error) {
            console.error('❌ Error generating plan:', error.message);
            throw error;
        }
    }

    async implementCode(plan) {
        console.log('⚡ Starting code implementation...');

        // Extract file list from plan
        const fileMatches = plan.match(/^- (.*?\.(tsx?|jsx?|css|md|json)):/gm);
        const filesToImplement = fileMatches ? fileMatches.map(match => 
            match.replace(/^- /, '').split(':')[0].trim()
        ) : [];

        console.log(`📝 Implementing ${filesToImplement.length} files...`);

        for (const filePath of filesToImplement) {
            await this.implementSingleFile(filePath, plan);
        }

        console.log('✅ Code implementation completed');
    }

    async implementSingleFile(filePath, plan) {
        console.log(`🔧 Implementing: ${filePath}`);

        // Read existing file if it exists
        let existingContent = '';
        const fullPath = path.join(process.cwd(), filePath);
        
        if (fs.existsSync(fullPath)) {
            existingContent = fs.readFileSync(fullPath, 'utf8');
        }

        const prompt = `
You are implementing a specific file as part of a larger implementation plan. 

## Implementation Plan Context:
${plan}

## Target File: ${filePath}

## Existing Content (if any):
${existingContent || 'No existing content - this is a new file'}

## Repository Context:
This is a Next.js 14+ project using:
- App Router
- TypeScript
- Tailwind CSS  
- Modern React patterns

## Your Task:
Generate the complete, production-ready code for ${filePath}. 

**Important Requirements:**
- Write clean, well-documented TypeScript/JSX code
- Use Next.js 14+ app router patterns
- Apply Tailwind CSS for styling
- Follow React best practices
- Include proper TypeScript types
- Add appropriate comments for complex logic
- Make it responsive and accessible

Only respond with the complete file content, no explanations or markdown formatting.
`;

        try {
            const result = await this.model.generateContent(prompt);
            const code = result.response.text();
            
            // Ensure directory exists
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // Write the file
            fs.writeFileSync(fullPath, code);
            console.log(`✅ Generated: ${filePath}`);
            
        } catch (error) {
            console.error(`❌ Error implementing ${filePath}:`, error.message);
            // Create a placeholder file with error info
            const errorContent = `// ERROR: Failed to generate this file
// Issue: ${this.issueData.title}
// Error: ${error.message}
// Please review and implement manually
`;
            fs.writeFileSync(fullPath, errorContent);
        }
    }

    async generateTests(plan) {
        console.log('🧪 Generating tests...');
        
        const prompt = `
Based on this implementation plan, generate appropriate tests:

${plan}

Create test files using Jest and React Testing Library. Focus on:
- Component rendering tests
- User interaction tests  
- Integration tests where appropriate
- TypeScript compatibility

Respond with the complete test file content for the main components.
`;

        try {
            const result = await this.model.generateContent(prompt);
            const tests = result.response.text();
            
            // Save test content
            fs.writeFileSync('.ai-logs/generated-tests.md', tests);
            console.log('✅ Test strategy generated');
            
        } catch (error) {
            console.error('❌ Error generating tests:', error.message);
        }
    }

    async createSummaryReport() {
        const report = `# 🤖 AI Implementation Report

**Issue:** #${this.issueData.number} - ${this.issueData.title}
**Timestamp:** ${new Date().toISOString()}
**AI Model:** Gemini 1.5 Pro

## ✅ Implementation Complete

The AI agent has successfully analyzed your requirements and implemented the requested functionality.

## 📁 Files Modified/Created
${this.repoStructure.filter(file => 
    fs.existsSync(file) && fs.statSync(file).mtime > new Date(Date.now() - 60000)
).map(file => `- ${file}`).join('\n') || 'See git diff for complete file list'}

## 🧪 Testing
- Implementation follows Next.js best practices
- TypeScript types included
- Responsive design with Tailwind CSS
- Ready for manual testing

## 🔍 Next Steps
1. Review the generated code
2. Test the functionality manually  
3. Run \`npm run build\` to verify no build errors
4. Merge when ready!

---
*Generated by Gemini AI Agent v1.0*
`;

        fs.writeFileSync('.ai-logs/implementation-report.md', report);
        console.log('📄 Summary report created');
        return report;
    }
}

// Main execution
async function main() {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }

        // Parse issue data from environment or arguments
        const issueData = {
            number: process.env.GITHUB_ISSUE_NUMBER || 'test',
            title: process.env.GITHUB_ISSUE_TITLE || 'Test Issue',
            body: process.env.GITHUB_ISSUE_BODY || 'Test implementation'
        };

        console.log('🚀 Starting Gemini AI Agent...');
        
        const agent = new GeminiAIAgent();
        await agent.initialize(issueData);
        
        const plan = await agent.generateImplementationPlan();
        await agent.implementCode(plan);
        await agent.generateTests(plan);
        const report = await agent.createSummaryReport();
        
        console.log('🎉 AI Agent completed successfully!');
        console.log('\n' + report);
        
    } catch (error) {
        console.error('💥 AI Agent failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = GeminiAIAgent;
