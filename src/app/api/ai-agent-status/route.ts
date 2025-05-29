import { NextApiRequest, NextApiResponse } from 'next';

// Replace with actual logic to fetch AI agent status.  This is a placeholder.
const getAiAgentStatus = async (): Promise<{ lastRun: string | null; status: string | null; }> => {
  // Example: Read from a file or database to get the last run time and status.
  return {
    lastRun: new Date().toISOString(),
    status: "Successfully running (mock)",
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const status = await getAiAgentStatus();
    res.status(200).json(status);
  } catch (error) {
    console.error('Error fetching AI agent status:', error);
    res.status(500).json({ lastRun: null, status: 'Error fetching status' });
  }
}
