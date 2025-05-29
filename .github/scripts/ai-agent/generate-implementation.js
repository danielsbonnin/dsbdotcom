const fs = require('fs');
const path = require('path');

/**
 * Generates AI implementation using Gemini API
 */
async function generateImplementation({ github, context, core, taskData }) {
  try {
    // Validate environment
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    core.info('Starting AI implementation generation...');

    // Analyze project structure
    const projectContext = analyzeProjectStructure();
    
    // Generate AI prompt
    const prompt = createImplementationPrompt(taskData, projectContext);
    
    core.info('Sending request to Gemini AI...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();
      core.info('Processing AI response...');
    let implementation;
    
    try {
      implementation = parseAIResponse(aiResponse);
    } catch (parseError) {
      core.warning(`Failed to parse AI response: ${parseError.message}`);
      core.info('Attempting fallback implementation...');
      
      // Create a fallback implementation based on the task type
      implementation = createFallbackImplementation(taskData, aiResponse);
    }
    
    // Apply implementation
    const implementationSummary = await applyImplementation(implementation, taskData);
    
    // Ensure proper JSON serialization
    const resultString = JSON.stringify(implementationSummary);
    core.setOutput('implementation-result', resultString);
    
    return { 'implementation-result': resultString };
      } catch (error) {
    core.error('AI implementation failed with error:', error);
    core.error('Error stack:', error.stack);
    
    // Log additional context for debugging
    if (error.message.includes('parse')) {
      core.error('This appears to be a JSON parsing error. Check the AI response format.');
    }
    
    core.setFailed(`AI implementation failed: ${error.message}`);
    throw error;
  }
}

function analyzeProjectStructure() {
  const projectFiles = [];
  const maxDepth = 3;
  
  const walkDirectory = (dir, currentDepth = 0) => {
    if (currentDepth >= maxDepth) return;
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        // Skip hidden files and node_modules
        if (item.startsWith('.') && item !== '.github') continue;
        if (item === 'node_modules') continue;
        
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDirectory(fullPath, currentDepth + 1);
        } else if (isRelevantFile(item)) {
          const relativePath = path.relative(process.cwd(), fullPath);
          projectFiles.push(relativePath);
        }
      }
    } catch (error) {
      console.warn(`Error reading directory ${dir}:`, error.message);
    }
  };
  
  walkDirectory(process.cwd());
  
  return {
    structure: projectFiles.slice(0, 100), // Limit for prompt size
    packageJson: readPackageJson(),
    nextConfig: readNextConfig()
  };
}

function isRelevantFile(filename) {
  const relevantExtensions = [
    '.ts', '.tsx', '.js', '.jsx', 
    '.md', '.json', '.yml', '.yaml',
    '.css', '.scss', '.module.css'
  ];
  
  return relevantExtensions.some(ext => filename.endsWith(ext));
}

function readPackageJson() {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
      return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    }
  } catch (error) {
    console.warn('Error reading package.json:', error.message);
  }
  return null;
}

function readNextConfig() {
  try {
    const configPath = path.join(process.cwd(), 'next.config.js');
    if (fs.existsSync(configPath)) {
      return fs.readFileSync(configPath, 'utf8');
    }
  } catch (error) {
    console.warn('Error reading next.config.js:', error.message);
  }
  return null;
}

function createImplementationPrompt(taskData, projectContext) {
  return `You are an expert Next.js developer working on a portfolio website (danielsbonnin.com).

**Project Information:**
- Framework: Next.js 15 with App Router
- Language: TypeScript
- Styling: Tailwind CSS
- Current files: ${projectContext.structure.slice(0, 50).join(', ')}

**Task Details:**
- Title: ${taskData.title}
- Type: ${taskData.taskType}
- Priority: ${taskData.priority}
- Description: ${taskData.description}
${taskData.requirements ? `- Requirements: ${taskData.requirements}` : ''}

**Instructions:**
1. Analyze the task and determine what files need to be created/modified
2. Generate complete, production-ready code
3. Follow Next.js 15 best practices and TypeScript standards
4. Ensure responsive design with Tailwind CSS
5. Make the implementation functional and complete

**Response Format:**
You MUST respond with VALID JSON ONLY. No markdown, no explanations outside the JSON. Use this exact structure:

{
  "analysis": "Brief explanation of the implementation approach",
  "files": [
    {
      "path": "relative/path/to/file.tsx",
      "action": "create",
      "content": "COMPLETE_FILE_CONTENT_HERE",
      "explanation": "Purpose and functionality of this file"
    }
  ],
  "instructions": "Setup or deployment instructions if needed"
}

**CRITICAL JSON FORMATTING RULES:**
- Use ONLY double quotes for all strings
- Escape ALL quotes inside strings as \\"
- Escape ALL newlines inside strings as \\n
- Escape ALL backslashes as \\\\
- NO trailing commas
- NO comments in JSON
- NO markdown code blocks around the JSON
- The entire response must be parseable by JSON.parse()

**Content Rules:**
- Generate real, working code (no placeholders like "// existing code...")
- Include proper TypeScript types
- Use modern React patterns (hooks, functional components)
- Ensure code is complete and functional
- Properly escape all special characters in code content

Start your response immediately with { and end with }. No other text.`;
}

function parseAIResponse(aiResponse) {
  let jsonStr = aiResponse.trim();
  
  // Extract JSON from markdown code blocks if present
  const jsonMatch = aiResponse.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }
  
  // Clean up common JSON issues
  jsonStr = cleanJsonString(jsonStr);
  
  try {
    const implementation = JSON.parse(jsonStr);
    
    // Validate structure
    if (!implementation || !Array.isArray(implementation.files)) {
      throw new Error('Invalid implementation structure: missing files array');
    }
    
    return implementation;
    
  } catch (parseError) {
    console.error('JSON Parse Error:', parseError.message);
    console.error('Response preview:', jsonStr.substring(0, 800));
    console.error('Error position context:', getErrorContext(jsonStr, parseError.message));
    
    // Try to fix common JSON issues and parse again
    const fixedJson = attemptJsonFix(jsonStr);
    if (fixedJson) {
      try {
        const implementation = JSON.parse(fixedJson);
        if (implementation && Array.isArray(implementation.files)) {
          console.log('✅ Successfully fixed and parsed JSON');
          return implementation;
        }
      } catch (secondError) {
        console.error('Second parse attempt failed:', secondError.message);
      }
    }
    
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
  }
}

function cleanJsonString(jsonStr) {
  // Remove any leading/trailing non-JSON content
  const startIndex = jsonStr.indexOf('{');
  const endIndex = jsonStr.lastIndexOf('}');
  
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    jsonStr = jsonStr.substring(startIndex, endIndex + 1);
  }
  
  return jsonStr;
}

function getErrorContext(jsonStr, errorMessage) {
  const positionMatch = errorMessage.match(/position (\d+)/);
  if (positionMatch) {
    const position = parseInt(positionMatch[1]);
    const start = Math.max(0, position - 50);
    const end = Math.min(jsonStr.length, position + 50);
    const context = jsonStr.substring(start, end);
    const indicator = ' '.repeat(Math.min(50, position - start)) + '^';
    return `\n${context}\n${indicator}`;
  }
  return '';
}

function attemptJsonFix(jsonStr) {
  try {
    // Common fixes for malformed JSON
    let fixed = jsonStr
      // Remove any BOM or invisible characters
      .replace(/^\uFEFF/, '')
      // Fix unescaped backslashes first
      .replace(/\\(?!["\\/bfnrt])/g, '\\\\')
      // Fix unescaped newlines in strings (but preserve intentional \\n)
      .replace(/(?<!\\)\n/g, '\\n')
      // Fix unescaped carriage returns
      .replace(/(?<!\\)\r/g, '\\r')
      // Fix unescaped tabs
      .replace(/(?<!\\)\t/g, '\\t')
      // Fix trailing commas
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix missing commas between objects/arrays
      .replace(/}(\s*){/g, '},$1{')
      .replace(/](\s*){/g, '],$1{');
    
    // Additional safety: ensure proper string escaping
    fixed = fixed.replace(/"content":\s*"((?:[^"\\]|\\.)*)"/g, (match, content) => {
      // Re-escape the content properly
      const escapedContent = content
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return `"content": "${escapedContent}"`;
    });
    
    // Validate the fix by attempting to parse
    JSON.parse(fixed);
    console.log('✅ JSON fix successful');
    return fixed;
  } catch (error) {
    console.error('JSON fix attempt failed:', error.message);
    return null;
  }
}

async function applyImplementation(implementation, taskData) {
  const appliedFiles = [];
  
  for (const file of implementation.files) {
    try {
      const filePath = file.path;
      const directory = path.dirname(filePath);
      
      // Create directory structure if needed
      if (directory !== '.' && !fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
        console.log(`Created directory: ${directory}`);
      }
      
      // Write file content
      fs.writeFileSync(filePath, file.content, 'utf8');
      console.log(`${file.action === 'create' ? 'Created' : 'Modified'}: ${filePath}`);
      
      appliedFiles.push({
        path: filePath,
        action: file.action,
        explanation: file.explanation
      });
      
    } catch (error) {
      console.error(`Error applying file ${file.path}:`, error);
      throw new Error(`Failed to apply implementation for ${file.path}: ${error.message}`);
    }
  }
  
  // Create implementation summary
  const summary = {
    analysis: implementation.analysis,
    filesModified: appliedFiles.length,
    files: appliedFiles,
    instructions: implementation.instructions || 'No additional setup required',
    taskData: taskData,
    timestamp: new Date().toISOString()
  };
  
  // Write summary file
  const summaryContent = generateSummaryMarkdown(summary);
  fs.writeFileSync('AI_IMPLEMENTATION.md', summaryContent, 'utf8');
  
  return summary;
}

function generateSummaryMarkdown(summary) {
  return `# AI Implementation Summary

## Task Information
- **Issue:** #${summary.taskData.issueNumber}
- **Title:** ${summary.taskData.title}
- **Type:** ${summary.taskData.taskType}
- **Priority:** ${summary.taskData.priority}
- **Generated:** ${summary.timestamp}

## Implementation Analysis
${summary.analysis}

## Files Modified (${summary.filesModified})
${summary.files.map(f => `- **${f.path}** (${f.action}): ${f.explanation}`).join('\n')}

## Setup Instructions
${summary.instructions}

## Next Steps
1. Review the generated code for quality and correctness
2. Test the implementation locally
3. Deploy by merging the pull request

---
*Generated by AI Agent using Gemini 1.5 Flash*
`;
}

function createFallbackImplementation(taskData, aiResponse) {
  core.info('Creating fallback implementation based on task type...');
  
  // Extract any meaningful content from the failed response
  let analysis = 'Fallback implementation generated due to JSON parsing error.';
  
  // Try to extract analysis from the response
  const analysisMatch = aiResponse.match(/"analysis":\s*"([^"]*?)"/);
  if (analysisMatch) {
    analysis = analysisMatch[1] + ' (Auto-recovered from parsing error)';
  }
  
  const fallbackFiles = [];
  
  // Generate fallback based on task type and content
  if (taskData.taskType === 'BUG' || taskData.taskType === 'AI-TASK') {
    // For UI/Bug fixes, create a basic component enhancement
    if (taskData.description.toLowerCase().includes('ui') || taskData.title.toLowerCase().includes('ui')) {
      fallbackFiles.push({
        path: 'src/components/UIEnhancement.tsx',
        action: 'create',
        content: `'use client';

import React from 'react';

interface UIEnhancementProps {
  children: React.ReactNode;
  className?: string;
}

export default function UIEnhancement({ children, className = '' }: UIEnhancementProps) {
  return (
    <div className={\`bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 shadow-lg transition-all duration-300 hover:shadow-xl \${className}\`}>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}`,
        explanation: 'Enhanced UI component with modern styling and smooth transitions'
      });
      
      fallbackFiles.push({
        path: 'src/app/page.tsx',
        action: 'modify',
        content: `import UIEnhancement from '@/components/UIEnhancement';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <UIEnhancement className="max-w-4xl mx-auto">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Daniel Bonnin
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Full-Stack Developer & AI Enthusiast
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <a
                href="/portfolio"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Portfolio
              </a>
              <a
                href="/contact"
                className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Get In Touch
              </a>
            </div>
          </div>
        </UIEnhancement>
      </div>
    </main>
  );
}`,
        explanation: 'Enhanced homepage with improved UI and modern design'
      });
    }
  }
  
  // If no specific files were generated, create a documentation file
  if (fallbackFiles.length === 0) {
    fallbackFiles.push({
      path: 'AI_IMPLEMENTATION_NOTE.md',
      action: 'create',
      content: `# AI Implementation Note

## Task: ${taskData.title}
**Type:** ${taskData.taskType}
**Priority:** ${taskData.priority}

## Description
${taskData.description}

## Status
This task required manual intervention due to AI response formatting issues.
The original AI response could not be properly parsed as JSON.

## Next Steps
Please review the task requirements and implement manually or re-run the AI agent.

## Original Response Preview
\`\`\`
${aiResponse.substring(0, 500)}...
\`\`\`
`,
      explanation: 'Documentation of the task and parsing issues encountered'
    });
  }
  
  return {
    analysis,
    files: fallbackFiles,
    instructions: 'Fallback implementation generated. Please review and refine as needed.'
  };
}

module.exports = { generateImplementation };
