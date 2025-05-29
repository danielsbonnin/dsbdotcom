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
    const implementation = parseAIResponse(aiResponse);
      // Apply implementation
    const implementationSummary = await applyImplementation(implementation, taskData);
    
    // Ensure proper JSON serialization
    const resultString = JSON.stringify(implementationSummary);
    core.setOutput('implementation-result', resultString);
    
    return { 'implementation-result': resultString };
    
  } catch (error) {
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
Respond with VALID JSON ONLY using this structure:

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

**Critical Requirements:**
- Use double quotes for all JSON strings
- Escape newlines as \\n in content
- Escape quotes as \\" in content
- Generate real, working code (no placeholders)
- Include proper TypeScript types
- Use modern React patterns (hooks, functional components)

Generate actual implementation code that works immediately.`;
}

function parseAIResponse(aiResponse) {
  let jsonStr = aiResponse.trim();
  
  // Extract JSON from markdown code blocks if present
  const jsonMatch = aiResponse.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }
  
  try {
    const implementation = JSON.parse(jsonStr);
    
    // Validate structure
    if (!implementation || !Array.isArray(implementation.files)) {
      throw new Error('Invalid implementation structure: missing files array');
    }
    
    return implementation;
    
  } catch (parseError) {
    console.error('JSON Parse Error:', parseError.message);
    console.error('Response preview:', jsonStr.substring(0, 500));
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
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

module.exports = { generateImplementation };
