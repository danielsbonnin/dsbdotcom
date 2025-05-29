import { useState } from 'react';

interface TestResult {
  success: boolean;
  message: string;
}

export default function TestPage() {
  const [result, setResult] = useState<TestResult | null>(null);

  const runTest = async () => {
    try {
      const response = await fetch('/api/test-ai-agent');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: TestResult = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, message: (error as Error).message });
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold underline">AI Agent Test</h1>
      <button onClick={runTest} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Run Test
      </button>
      {result && (
        <div className="mt-4">
          <p className={`text-${result.success ? 'green' : 'red'}-500`}>
            {result.success ? 'Success!' : 'Failure!'} 
          </p>
          <p>{result.message}</p>
        </div>
      )}
    </div>
  );
}