import { useState, useEffect } from 'react';

interface TestResult {
  success: boolean;
  message: string;
}

export default function Home() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch('/api/test-results');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: TestResult[] = await response.json();
        setTestResults(data);
      } catch (error) {
        console.error('Error fetching test results:', error);
        setTestResults([{ success: false, message: 'Error fetching test results' }]);
      }
    };

    fetchResults();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold underline">Test Results</h1>
      <ul>
        {testResults.map((result, index) => (
          <li key={index} className={`p-2 ${result.success ? 'bg-green-200' : 'bg-red-200'}`}>
            {result.message}
          </li>
        ))}
      </ul>
    </div>
  );
}