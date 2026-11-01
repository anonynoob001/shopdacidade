// Shop Carajás - Universal API Router (Shared between Cloudflare Worker and Express dev server)
import { DatabaseAdapter, getDb } from './db';
import { runCronTasks } from './jobs/cron';
import { handleAdminRoutes } from './routes/admin';
import { handleAuthRoutes } from './routes/auth';
import { handleDeliveriesRoutes } from './routes/deliveries';
import { handleOrdersRoutes } from './routes/orders';
import { handlePaymentsRoutes } from './routes/payments';
import { handleProductsRoutes } from './routes/products';
import { handlePublicRoutes } from './routes/public';
import { handleServicesRoutes } from './routes/services';
import { handleStoresRoutes } from './routes/stores';
import { getUserByToken } from './services/auth';
import { INITIAL_SCHEMA_SQL } from './schema_ddl';
import { seedDatabase } from './services/seed';
import { User } from './types';

export interface ApiRequest {
  method: string;
  path: string;
  query?: Record<string, string>;
  headers: Record<string, string>;
  body?: any;
  user?: User | null;
}

export interface ApiResponse {
  status: number;
  headers?: Record<string, string>;
  data: any;
}

export function splitSqlStatements(sqlScript: string): string[] {
  // Strip block comments /* ... */
  const noBlock = sqlScript.replace(/\/\*[\s\S]*?\*\//g, '');
  // Strip single-line comments -- ...
  const noLine = noBlock.replace(/--[^\r\n]*/g, '');
  return noLine
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export async function runSchemaMigration(db: DatabaseAdapter): Promise<{ success: boolean; totalExecuted: number }> {
  const statements = splitSqlStatements(INITIAL_SCHEMA_SQL);
  let totalExecuted = 0;

  for (const sql of statements) {
    try {
      await db.prepare(sql).run();
      totalExecuted++;
    } catch {
      try {
        await db.exec(sql);
        totalExecuted++;
      } catch (err: any) {
        // Many statements use IF NOT EXISTS or INSERT OR IGNORE, ignore normal duplicates
        console.warn('[Shop da Cidade] Notice during SQL migration:', sql.slice(0, 50), err?.message);
      }
    }
  }

  // Ensure 2FA columns exist in users table
  try { await db.prepare('ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0;').run(); } catch (_) {}
  try { await db.prepare('ALTER TABLE users ADD COLUMN two_factor_secret TEXT;').run(); } catch (_) {}
  try { await db.prepare('ALTER TABLE users ADD COLUMN two_factor_backup_codes TEXT;').run(); } catch (_) {}

  return { success: true, totalExecuted };
}

let dbReady = false;

async function ensureDatabaseReady(db: DatabaseAdapter) {
  if (dbReady) return;

  try {
    // Check if critical tables 'users' and 'platform_settings' exist in D1 SQLite
    const usersTable = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").first().catch(() => null);
    const settingsTable = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='platform_settings'").first().catch(() => null);

    if (!usersTable || !settingsTable) {
      console.log('[Shop da Cidade] Initializing complete D1 schema and initial seeds...');
      await runSchemaMigration(db);
      console.log('[Shop da Cidade] D1 database initialized successfully.');
    }

    // Verify users table exists now
    const verified = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").first().catch(() => null);
    if (verified) {
      dbReady = true;
    }
  } catch (err) {
    console.error('[Shop da Cidade] DB auto-init error:', err);
  }
}

export async function dispatchApiRequest(req: ApiRequest, db: DatabaseAdapter): Promise<ApiResponse> {
  try {
    // Auto-initialize schema if tables are not yet created in D1
    await ensureDatabaseReady(db);

    // Extract user from authorization header or cookie if present
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    if (token) {
      try {
        req.user = await getUserByToken(db, token);
      } catch (err) {
        console.warn('[Shop da Cidade] Auth token resolution failed:', err);
        req.user = null;
      }
    }

    // 1. Public routes
    const pubRes = await handlePublicRoutes(req, db);
    if (pubRes) return pubRes;

    // 2. Auth routes
    const authRes = await handleAuthRoutes(req, db);
    if (authRes) return authRes;

    // 3. Products routes
    const prodRes = await handleProductsRoutes(req, db);
    if (prodRes) return prodRes;

    // 4. Stores routes
    const storeRes = await handleStoresRoutes(req, db);
    if (storeRes) return storeRes;

    // 5. Orders routes
    const orderRes = await handleOrdersRoutes(req, db);
    if (orderRes) return orderRes;

    // 6. Deliveries routes
    const delivRes = await handleDeliveriesRoutes(req, db);
    if (delivRes) return delivRes;

    // 7. Services routes
    const servRes = await handleServicesRoutes(req, db);
    if (servRes) return servRes;

    // 8. Admin routes
    const adminRes = await handleAdminRoutes(req, db);
    if (adminRes) return adminRes;

    // 9. Asaas Payments routes
    const payRes = await handlePaymentsRoutes(req, db);
    if (payRes) return payRes;

    // 10. Manual Cron Trigger endpoint (for testing cron jobs)
    if (req.method === 'POST' && req.path === '/api/cron/run') {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
        return { status: 403, data: { error: 'Acesso restrito.' } };
      }
      const cronSummary = await runCronTasks(db);
      return { status: 200, data: { success: true, summary: cronSummary } };
    }

    return { status: 404, data: { error: `Endpoint não encontrado: ${req.method} ${req.path}` } };
  } catch (error: any) {
    console.error('Unhandled API Router Error:', error);
    return {
      status: 500,
      data: {
        error: 'Ocorreu um erro interno ao processar a solicitação no servidor.',
        message: error?.message || 'Erro inesperado'
      }
    };
  }
}
