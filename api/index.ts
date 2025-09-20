import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServer } from '../server/index';

const app = createServer();

// Adaptador: Express → Vercel
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}