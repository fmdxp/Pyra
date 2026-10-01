import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Attempt 1: Read catalog.json from current directory or process.cwd()
    const possiblePaths = [
      path.join(__dirname, 'catalog.json'),
      path.join(process.cwd(), 'api', 'catalog.json'),
      path.join(process.cwd(), 'catalog.json'),
    ];

    let fileContent: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        fileContent = fs.readFileSync(p, 'utf-8');
        break;
      }
    }

    if (fileContent) {
      const parsed = JSON.parse(fileContent);
      return res.status(200).json(parsed);
    }

    // Attempt 2: Direct require fallback
    const fallbackData = require('./catalog.json');
    return res.status(200).json(fallbackData);
  } catch (err: any) {
    console.error('Catalog API Error:', err);
    return res.status(500).json({
      error: 'Failed to load catalog',
      message: err.message || String(err),
    });
  }
}
