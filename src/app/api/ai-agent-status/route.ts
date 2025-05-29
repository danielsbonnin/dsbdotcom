export const dynamic = 'force-dynamic'; // Add this line

// Replace with actual logic to fetch AI agent status.  This is a placeholder.
const getAiAgentStatus = async (): Promise<{ lastRun: string | null; status: string | null; }> => {
  // Example: Read from a file or database to get the last run time and status.
  return {
    lastRun: new Date().toISOString(),
    status: "Successfully running (mock)",
  };
};

export async function GET() {
  try {
    const status = await getAiAgentStatus();
    return Response.json(status, { status: 200 });
  } catch (error) {
    console.error('Error fetching AI agent status:', error);
    return Response.json({ lastRun: null, status: 'Error fetching status' }, { status: 500 });
  }
}
