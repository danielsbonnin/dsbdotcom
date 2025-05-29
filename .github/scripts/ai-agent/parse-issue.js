/**
 * Parses issue content and extracts structured task data
 */
async function parseIssueContent({ github, context, core }) {
  try {
    const { issue } = context.payload;
    
    if (!issue) {
      core.setFailed('No issue found in context');
      return {};
    }

    const issueBody = issue.body || '';
    const issueTitle = issue.title || '';

    // Extract task information using more robust parsing
    const taskData = {
      issueNumber: issue.number,
      title: issueTitle,
      description: extractDescription(issueBody, issueTitle),
      taskType: extractTaskType(issueBody),
      priority: extractPriority(issueBody),
      requirements: extractRequirements(issueBody),
      author: issue.user.login,
      labels: issue.labels?.map(l => l.name) || [],
      createdAt: issue.created_at
    };

    core.info(`Parsed task data: ${JSON.stringify(taskData, null, 2)}`);
    
    // Validate required fields
    if (!taskData.title || !taskData.description) {
      throw new Error('Missing required task information (title or description)');
    }
    
    core.setOutput('task-data', JSON.stringify(taskData));
    
    return { 'task-data': JSON.stringify(taskData) };
    
  } catch (error) {
    core.setFailed(`Issue parsing failed: ${error.message}`);
    return {};
  }
}

function extractDescription(body, fallbackTitle) {
  // Try multiple patterns for description extraction
  const patterns = [
    /(?:Task Description|Description)[\s\S]*?###\s*([\s\S]+?)(?:\n###|$)/i,
    /(?:Description|Summary):\s*([\s\S]+?)(?:\n\n|\n###|$)/i,
    /^([\s\S]+?)(?:\n###|\n\n##|$)/
  ];
  
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }
  }
  
  return fallbackTitle;
}

function extractTaskType(body) {
  // Try multiple patterns to extract task type
  const patterns = [
    /### Task Type\s*\n([^\n]+)/i,
    /(?:Task Type|Type)[\s\S]*?:\s*(.+)/i,
    /(?:Task Type|Type)[\s\S]*?###\s*(.+)/i
  ];
  
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return 'Development';
}

function extractPriority(body) {
  // Try multiple patterns to extract priority
  const patterns = [
    /### Priority\s*\n([^\n]+)/i,
    /(?:Priority)[\s\S]*?:\s*(.+)/i,
    /(?:Priority)[\s\S]*?###\s*(.+)/i
  ];
  
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match && match[1]) {
      const priority = match[1].trim().toLowerCase();
      if (priority.includes('high') || priority.includes('urgent')) return 'High';
      if (priority.includes('low')) return 'Low';
      return priority.charAt(0).toUpperCase() + priority.slice(1);
    }
  }
  
  return 'Medium';
}

function extractRequirements(body) {
  const patterns = [
    /(?:Requirements|Acceptance Criteria)[\s\S]*?###\s*([\s\S]+?)(?:\n###|$)/i,
    /(?:Requirements|Criteria):\s*([\s\S]+?)(?:\n\n|\n###|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }
  }
  
  return null;
}

module.exports = { parseIssueContent };
