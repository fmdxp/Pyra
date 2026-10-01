import { VercelRequest, VercelResponse } from '@vercel/node';
import catalogData from './catalog.json';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers so Pyra launcher can fetch catalog securely
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

  return res.status(200).json(catalogData);
}
