import { createServer } from '../dist/server/index.js';

export default function handler(req, res) {
  const app = createServer();
  return app(req, res);
}