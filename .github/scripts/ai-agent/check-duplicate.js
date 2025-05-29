/**
 * Checks if the AI agent has already processed this issue
 */
async function checkDuplicateProcessing({ github, context, core }) {
  try {
    const { issue } = context.payload;
    
    if (!issue) {
      core.setFailed('No issue found in context');
      return { 'should-continue': 'false' };
    }

    // Check for existing AI agent comments
    const comments = await github.rest.issues.listComments({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issue.number
    });

    const aiAgentComment = comments.data.find(comment => 
      comment.user.login === 'github-actions[bot]' && 
      comment.body.includes('🤖 **AI Agent Assigned**')
    );

    const shouldContinue = !aiAgentComment;
    
    if (aiAgentComment) {
      core.info(`AI Agent already processed issue #${issue.number} - skipping duplicate`);
    } else {
      core.info(`AI Agent not yet processed issue #${issue.number} - proceeding`);
    }
    
    core.setOutput('should-continue', shouldContinue.toString());
    
    return { 'should-continue': shouldContinue.toString() };
    
  } catch (error) {
    core.setFailed(`Duplicate check failed: ${error.message}`);
    return { 'should-continue': 'false' };
  }
}

module.exports = { checkDuplicateProcessing };
