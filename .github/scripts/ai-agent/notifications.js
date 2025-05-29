/**
 * Handles notifications for AI agent processing
 */
async function notifyProcessingStart({ github, context, taskData }) {
  try {
    await github.rest.issues.createComment({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: generateStartNotification(taskData)
    });

    // Add processing labels
    await github.rest.issues.addLabels({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      labels: ['in-progress', 'ai-working']
    });

  } catch (error) {
    console.error('Failed to post start notification:', error);
    throw error;
  }
}

async function notifyProcessingFailure({ github, context }) {
  try {
    await github.rest.issues.createComment({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: `❌ **AI Agent Processing Failed**
      
      I encountered an error while processing this task. Please check the workflow logs for details.
      
      **Next Steps:**
      1. Review the error logs in the GitHub Actions tab
      2. Fix any configuration issues
      3. Re-trigger by adding the \`ai-agent\` label or mentioning \`@ai-agent\`
      
      If the issue persists, please manually review the requirements and try again.`
    });

    // Update labels
    await github.rest.issues.removeLabel({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      name: 'ai-working'
    }).catch(() => {}); // Ignore if label doesn't exist

    await github.rest.issues.addLabels({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      labels: ['ai-failed']
    });

  } catch (error) {
    console.error('Failed to post failure notification:', error);
  }
}

function generateStartNotification(taskData) {
  return `🤖 **AI Agent Assigned**
  
I've been assigned to work on this task. I'll analyze the requirements and create a pull request with the implementation.

**Task Analysis:**
- **Title:** ${taskData.title}
- **Type:** ${taskData.taskType}
- **Priority:** ${taskData.priority}
- **Status:** In Progress 🔄

**Next Steps:**
1. 🔍 Analyze project structure and requirements
2. 🧠 Generate implementation using Gemini AI
3. 📝 Create pull request with working code
4. ✅ Provide detailed implementation notes

Expected completion time: 5-10 minutes.

I'll update this issue with my progress and link to the pull request when ready for review.`;
}

module.exports = { 
  notifyProcessingStart, 
  notifyProcessingFailure 
};
