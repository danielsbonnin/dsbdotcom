const { notifyProcessingStart } = require('./.github/scripts/ai-agent/notifications.js');

// Create a simple test
async function testNotificationDirectly() {
  const createCommentCalls = [];
  const addLabelsCalls = [];
  
  const mockGitHub = {
    rest: {
      issues: {
        createComment: (params) => {
          console.log('createComment called with:', params);
          createCommentCalls.push(params);
          return Promise.resolve({ data: { id: 456 } });
        },
        addLabels: (params) => {
          console.log('addLabels called with:', params);
          addLabelsCalls.push(params);
          return Promise.resolve({});
        }
      }
    }
  };
  
  // Store calls directly on the functions too
  mockGitHub.rest.issues.createComment.calls = createCommentCalls;
  mockGitHub.rest.issues.addLabels.calls = addLabelsCalls;

  const mockContext = {
    repo: {
      owner: 'danielsbonnin',
      repo: 'danielsbonnin.com'
    },
    issue: {
      number: 123
    }
  };

  const taskData = {
    title: 'Test Task',
    taskType: 'Feature',
    priority: 'Medium'
  };

  console.log('Testing notification function directly...');
  
  try {
    await notifyProcessingStart({ 
      github: mockGitHub, 
      context: mockContext, 
      taskData 
    });
    
    console.log('Notification completed successfully');
    console.log('createComment calls:', createCommentCalls.length);
    console.log('addLabels calls:', addLabelsCalls.length);
    console.log('Function property calls:', {
      createComment: mockGitHub.rest.issues.createComment.calls?.length,
      addLabels: mockGitHub.rest.issues.addLabels.calls?.length
    });
    
  } catch (error) {
    console.error('Notification failed:', error);
  }
}

testNotificationDirectly();
