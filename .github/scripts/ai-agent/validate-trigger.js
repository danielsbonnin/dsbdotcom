/**
 * Validates if the AI agent should process the current GitHub event
 */
async function validateTrigger({ github, context, core }) {
  try {
    const { issue } = context.payload;
    
    if (!issue) {
      core.info('No issue found in event payload');
      return { 'should-process': 'false' };
    }

    // Check if this is a labeled event on a newly created issue (within 30 seconds)
    if (context.payload.action === 'labeled') {
      const issueCreated = new Date(issue.created_at);
      const now = new Date();
      const timeDiffSeconds = (now - issueCreated) / 1000;
      
      if (timeDiffSeconds < 30) {
        core.info(`Issue #${issue.number}: Skipping labeled event on newly created issue (created ${timeDiffSeconds}s ago)`);
        return { 'should-process': 'false' };
      }
    }

    // Check for ai-agent label
    const hasAiAgentLabel = issue.labels?.some(label => label.name === 'ai-agent');
    
    // Check for @ai-agent mention in comments
    const hasAiAgentMention = context.payload.comment?.body?.includes('@ai-agent');
    
    // Check for [AI-TASK] prefix in title
    const hasAiTaskPrefix = issue.title?.startsWith('[AI-TASK]');

    const shouldProcess = Boolean(hasAiAgentLabel || hasAiAgentMention || hasAiTaskPrefix);
    
    core.info(`Issue #${issue.number}: Checking triggers - Label: ${hasAiAgentLabel}, Mention: ${hasAiAgentMention}, AI-TASK: ${hasAiTaskPrefix}`);
    core.info(`Issue #${issue.number}: AI Agent trigger ${shouldProcess ? 'detected' : 'not found'}`);
    
    if (shouldProcess) {
      const issueData = {
        number: issue.number,
        title: issue.title,
        body: issue.body || '',
        labels: issue.labels?.map(l => l.name) || [],
        author: issue.user.login
      };
      
      core.setOutput('issue-data', JSON.stringify(issueData));
    }
    
    const shouldProcessString = shouldProcess.toString();
    core.setOutput('should-process', shouldProcessString);
    
    return { 'should-process': shouldProcessString };
    
  } catch (error) {
    core.setFailed(`Trigger validation failed: ${error.message}`);
    return { 'should-process': 'false' };
  }
}

module.exports = { validateTrigger };
