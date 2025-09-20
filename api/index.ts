import type { VercelRequest, VercelResponse } from '@vercel/node';
// Importa do JS compilado gerado pelo esbuild na pasta dist
import { createServer } from '../dist/server/index.js';

const app = createServer();

// Adaptador: Express → Vercel
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}