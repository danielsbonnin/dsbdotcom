import { NextResponse } from 'next/server';

// Replace this with your actual AI agent status check
const getAiAgentStatus = async (): Promise<{ success: boolean; message: string }> => {
  // Simulate a successful status
  return { success: true, message: 'AI Agent is functioning correctly!' };
  // Example of failure:
  // throw new Error('AI Agent failed');
};

export async function GET() {
  try {
    const status = await getAiAgentStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}