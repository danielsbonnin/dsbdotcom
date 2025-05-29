import { NextRequest, NextResponse } from 'next/server';

// Replace with actual logic to fetch AI agent status.  This is a placeholder.
const getAiAgentStatus = async (): Promise<{ lastRun: string | null; status: string | null; }> => {
  // Example: Read from a file or database to get the last run time and status.
  return {
    lastRun: new Date().toISOString(),
    status: "Successfully running (mock)",
  };
};

export async function GET(request: NextRequest) {
  try {
    const status = await getAiAgentStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching AI agent status:', error);
    return NextResponse.json(
      { lastRun: null, status: 'Error fetching status' },
      { status: 500 }
    );
  }
}
