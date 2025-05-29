import {useState, useEffect} from 'react';

interface AiAgentStatus {
  success: boolean;
  message: string;
}

export default function AiAgentStatusPage() {
  const [status, setStatus] = useState<AiAgentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/ai-agent-status');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: AiAgentStatus = await response.json();
        setStatus(data);
      } catch (error: any) {
        setError(error.message);
      }
    };

    fetchStatus();
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-100 rounded-md text-red-700">
        <p>Error fetching AI agent status: {error}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-4">
        <p>Fetching AI agent status...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">AI Agent Status</h1>
      <div className={`p-4 rounded-md ${status.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        <p>{status.message}</p>
      </div>
    </div>
  );
}