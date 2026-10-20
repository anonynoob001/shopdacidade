// Shop Carajás - Full-Stack Express Server (Port 3000 & Vite Middlewares)
import express, { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { createNodeSqliteAdapter, setGlobalDb } from './src/worker/db.ts';
import { dispatchApiRequest } from './src/worker/router.ts';
import { seedDatabase } from './src/worker/services/seed.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse CLI arguments (e.g., --port 3000 --host 0.0.0.0)
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const cliPort = portIndex !== -1 && args[portIndex + 1] ? parseInt(args[portIndex + 1]) : null;
const isProduction = process.env.NODE_ENV === 'production';
const PORT = cliPort || (isProduction && process.env.PORT ? Number(process.env.PORT) : 3000);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Ensure data directory exists
  const dataDir = path.resolve(__dirname, '.data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Initialize SQLite database
  const dbPath = path.resolve(dataDir, 'shop_carajas.db');
  const sqliteInstance = new DatabaseSync(dbPath);
  
  // Enable foreign keys
  sqliteInstance.exec('PRAGMA foreign_keys = ON;');

  const dbAdapter = createNodeSqliteAdapter(sqliteInstance);
  setGlobalDb(dbAdapter);

  // Apply migrations
  try {
    const migrationPath = path.resolve(__dirname, 'migrations', '0001_initial_schema.sql');
    if (fs.existsSync(migrationPath)) {
      const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
      sqliteInstance.exec(migrationSql);
    }

    // Ensure stores custom theme columns exist
    const storeCols = (sqliteInstance.prepare('PRAGMA table_info(stores)').all() as any[]).map(c => c.name);
    const colsToAdd: [string, string][] = [
      ['theme_color_primary', "TEXT DEFAULT '#fdca04'"],
      ['theme_color_secondary', "TEXT DEFAULT '#0f172a'"],
      ['custom_announcement', 'TEXT'],
      ['instagram', 'TEXT']
    ];
    for (const [col, def] of colsToAdd) {
      if (!storeCols.includes(col)) {
        try {
          sqliteInstance.exec(`ALTER TABLE stores ADD COLUMN ${col} ${def};`);
        } catch {
          // column may already exist
        }
      }
    }
  } catch (migErr) {
    console.warn('[Shop da Cidade] Migration execution note:', migErr);
  }

  // Seed database if needed (idempotent)
  try {
    await seedDatabase(dbAdapter);
  } catch (seedErr) {
    console.warn('[Shop Carajás] Database seed note:', seedErr);
  }

  // Mount API router on /api/*
  app.all('/api/*', async (req: Request, res: Response) => {
    try {
      const headersObj: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (typeof v === 'string') headersObj[k.toLowerCase()] = v;
      }

      const queryObj: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.query)) {
        if (typeof v === 'string') queryObj[k] = v;
      }

      const apiRes = await dispatchApiRequest(
        {
          method: req.method,
          path: req.path,
          query: queryObj,
          headers: headersObj,
          body: req.body
        },
        dbAdapter
      );

      if (apiRes.headers) {
        for (const [k, v] of Object.entries(apiRes.headers)) {
          res.setHeader(k, v);
        }
      }

      res.status(apiRes.status).json(apiRes.data);
    } catch (err: any) {
      console.error('Server API error:', err);
      res.status(500).json({ error: 'Erro no servidor', details: err?.message });
    }
  });

  // Mount Vite or static files
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Shop Carajás] Dev Server online on http://0.0.0.0:${PORT} (Canaã dos Carajás - PA)`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
