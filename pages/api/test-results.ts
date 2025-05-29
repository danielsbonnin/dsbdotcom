import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

const testResultsDir = path.join(process.cwd(), 'test-results');

interface TestResult {
  success: boolean;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestResult[]>
) {
  try {
    const files = await fs.readdir(testResultsDir);
    const results: TestResult[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(testResultsDir, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const json = JSON.parse(fileContent);
        results.push({ success: json.success, message: `Test ${file} - ${json.message || 'Result'}` });
      }
    }
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json([{ success: false, message: 'Error fetching test results' }]);
  }
}