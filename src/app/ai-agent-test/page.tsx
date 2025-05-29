import { useEffect, useState } from 'react';

interface AiAgentStatus {
  lastRun: string | null;
  status: string | null;
}

export default function AiAgentTestPage() {
  const [status, setStatus] = useState<AiAgentStatus>({ lastRun: null, status: null });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/ai-agent-status');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: AiAgentStatus = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Error fetching AI agent status:', error);
        setStatus({ lastRun: null, status: 'Error fetching status' });
      }
    };

    checkStatus();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">AI Agent Status</h1>
      <p>Last Run: {status.lastRun || 'N/A'}</p>
      <p>Status: {status.status || 'N/A'}</p>
    </div>
  );
}
