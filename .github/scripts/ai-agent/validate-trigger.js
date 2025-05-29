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

    // Check for ai-agent label
    const hasAiAgentLabel = issue.labels?.some(label => label.name === 'ai-agent');
    
    // Check for @ai-agent mention in comments
    const hasAiAgentMention = context.payload.comment?.body?.includes('@ai-agent');
    
    const shouldProcess = hasAiAgentLabel || hasAiAgentMention;
    
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
    
    core.setOutput('should-process', shouldProcess.toString());
    
    return { 'should-process': shouldProcess.toString() };
    
  } catch (error) {
    core.setFailed(`Trigger validation failed: ${error.message}`);
    return { 'should-process': 'false' };
  }
}

module.exports = { validateTrigger };
