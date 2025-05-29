import { MetadataRoute } from 'next/server';
import { Metadata } from 'next';
import { useEffect, useState } from 'react';

const getLatestTestResult = (): string | null => {
  const files = require('fs').readdirSync('./test-results');
  const jsonFiles = files.filter(file => file.endsWith('.json'));
  if (jsonFiles.length === 0) return null;
  const latestFile = jsonFiles.reduce((a, b) => (parseInt(a.split('-')[3].slice(0,-5)) > parseInt(b.split('-')[3].slice(0,-5)) ? a : b));
  try {
    const data = require(`../test-results/${latestFile}`);
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Error reading test results:', error);
    return null;
  }
};

export default function Home() {
  const [testResults, setTestResults] = useState<string | null>(null);

  useEffect(() => {
    const results = getLatestTestResult();
    setTestResults(results);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="text-center">
          This is a test to verify the AI Agent workflow is now working after fixing the CommonJS module issue.
        </p>
        {testResults ? (
          <pre className="p-4 border rounded bg-gray-100 overflow-auto">
            {testResults}
          </pre>
        ) : (
          <p>Loading or no test results found.</p>
        )}
      </div>
    </main>
  );
}

export const metadata: Metadata = {
  title: 'DanielsBonnin.com',
};