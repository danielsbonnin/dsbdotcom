import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export const dynamic = 'force-dynamic';

interface PipelineStatus {
  issue?: {
    number: number;
    title: string;
    state: string;
    created_at: string;
    labels: string[];
  };
  pr?: {
    number: number;
    title: string;
    state: string;
    created_at: string;
    merged_at?: string;
    reviews: Array<{
      state: string;
      submitted_at: string;
      user: string;
    }>;
  };
  workflows: Array<{
    name: string;
    status: string;
    conclusion?: string;
    created_at: string;
    html_url: string;
  }>;
  deployment?: {
    status: string;
    environment: string;
    created_at: string;
    updated_at: string;
  };
  timeline: Array<{
    stage: string;
    status: 'completed' | 'in_progress' | 'pending' | 'failed';
    timestamp?: string;
    duration?: number;
  }>;
  overall_status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  estimated_completion?: string;
}

async function getGitHubClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN not configured');
  }
  return new Octokit({ auth: token });
}

async function fetchPipelineStatus(issueNumber?: number, prNumber?: number): Promise<PipelineStatus> {
  const github = await getGitHubClient();
  const owner = 'danielsbonnin';
  const repo = 'danielsbonnin.com';
  
  const status: PipelineStatus = {
    workflows: [],
    timeline: [],
    overall_status: 'not_started'
  };

  try {
    // Fetch issue details if provided
    if (issueNumber) {
      const { data: issue } = await github.rest.issues.get({
        owner,
        repo,
        issue_number: issueNumber
      });
      
      status.issue = {
        number: issue.number,
        title: issue.title,
        state: issue.state,
        created_at: issue.created_at,
        labels: issue.labels.map((label: any) => typeof label === 'string' ? label : label.name)
      };
      
      status.timeline.push({
        stage: 'Issue Created',
        status: 'completed',
        timestamp: issue.created_at
      });
    }

    // Fetch PR details if provided
    if (prNumber) {
      const { data: pr } = await github.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber
      });
      
      const { data: reviews } = await github.rest.pulls.listReviews({
        owner,
        repo,
        pull_number: prNumber
      });
      
      status.pr = {
        number: pr.number,
        title: pr.title,
        state: pr.state,
        created_at: pr.created_at,
        merged_at: pr.merged_at,
        reviews: reviews.map(review => ({
          state: review.state,
          submitted_at: review.submitted_at,
          user: review.user?.login || 'unknown'
        }))
      };
      
      status.timeline.push({
        stage: 'PR Created',
        status: 'completed',
        timestamp: pr.created_at
      });
      
      if (reviews.length > 0) {
        const approvedReview = reviews.find(r => r.state === 'APPROVED');
        if (approvedReview) {
          status.timeline.push({
            stage: 'AI Review & Approval',
            status: 'completed',
            timestamp: approvedReview.submitted_at
          });
        }
      }
      
      if (pr.merged_at) {
        status.timeline.push({
          stage: 'PR Merged',
          status: 'completed',
          timestamp: pr.merged_at
        });
      }
    }

    // Fetch recent workflow runs
    const { data: workflowRuns } = await github.rest.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      per_page: 10,
      status: 'completed'
    });
    
    // Filter for relevant workflows
    const relevantWorkflows = workflowRuns.workflow_runs.filter(run => 
      run.name.includes('AI Agent') || 
      run.name.includes('CI/CD') || 
      run.name.includes('Deploy')
    );
    
    status.workflows = relevantWorkflows.slice(0, 5).map(run => ({
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      created_at: run.created_at,
      html_url: run.html_url
    }));
    
    // Add workflow stages to timeline
    relevantWorkflows.forEach(run => {
      if (run.name.includes('AI Agent')) {
        status.timeline.push({
          stage: 'AI Implementation',
          status: run.conclusion === 'success' ? 'completed' : 
                 run.conclusion === 'failure' ? 'failed' : 'in_progress',
          timestamp: run.created_at
        });
      }
      
      if (run.name.includes('CI/CD') && run.conclusion === 'success') {
        status.timeline.push({
          stage: 'CI/CD Pipeline',
          status: 'completed',
          timestamp: run.created_at
        });
      }
      
      if (run.name.includes('Deploy') && run.conclusion === 'success') {
        status.timeline.push({
          stage: 'Deployment',
          status: 'completed',
          timestamp: run.created_at
        });
      }
    });

    // Determine overall status
    const hasFailedStage = status.timeline.some(stage => stage.status === 'failed');
    const hasInProgressStage = status.timeline.some(stage => stage.status === 'in_progress');
    const allStagesComplete = status.timeline.length > 0 && 
      status.timeline.every(stage => stage.status === 'completed');
    
    if (hasFailedStage) {
      status.overall_status = 'failed';
    } else if (hasInProgressStage) {
      status.overall_status = 'in_progress';
    } else if (allStagesComplete && status.timeline.length >= 4) {
      status.overall_status = 'completed';
    } else if (status.timeline.length > 0) {
      status.overall_status = 'in_progress';
    }
    
    // Sort timeline by timestamp
    status.timeline.sort((a, b) => 
      new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
    );
    
    // Calculate durations
    for (let i = 1; i < status.timeline.length; i++) {
      const current = status.timeline[i];
      const previous = status.timeline[i - 1];
      if (current.timestamp && previous.timestamp) {
        current.duration = new Date(current.timestamp).getTime() - 
                          new Date(previous.timestamp).getTime();
      }
    }
    
    // Estimate completion time if in progress
    if (status.overall_status === 'in_progress') {
      const avgDuration = 120000; // 2 minutes average per stage
      const remainingStages = 5 - status.timeline.length;
      const estimatedMs = Date.now() + (remainingStages * avgDuration);
      status.estimated_completion = new Date(estimatedMs).toISOString();
    }

    return status;
    
  } catch (error) {
    console.error('Error fetching pipeline status:', error);
    return {
      workflows: [],
      timeline: [{
        stage: 'Error',
        status: 'failed',
        timestamp: new Date().toISOString()
      }],
      overall_status: 'failed'
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issueParam = searchParams.get('issue');
    const prParam = searchParams.get('pr');
    
    const issueNumber = issueParam ? parseInt(issueParam) : undefined;
    const prNumber = prParam ? parseInt(prParam) : undefined;
    
    const status = await fetchPipelineStatus(issueNumber, prNumber);
    
    return NextResponse.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('AI Agent Status API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch pipeline status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}



export async function GET() {
  try {
    const status = await getAiAgentStatus();
    return Response.json(status, { status: 200 });
  } catch (error) {
    console.error('Error fetching AI agent status:', error);
    return Response.json({ lastRun: null, status: 'Error fetching status' }, { status: 500 });
  }
}
