import { createServer as createViteServer } from 'vite';
import { Express } from 'express';

export async function setupVite(app: Express) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
  return vite;
}
