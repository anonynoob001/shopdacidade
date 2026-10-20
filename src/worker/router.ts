// Shop Carajás - Universal API Router (Shared between Cloudflare Worker and Express dev server)
import { DatabaseAdapter, getDb } from './db';
import { runCronTasks } from './jobs/cron';
import { handleAdminRoutes } from './routes/admin';
import { handleAuthRoutes } from './routes/auth';
import { handleDeliveriesRoutes } from './routes/deliveries';
import { handleOrdersRoutes } from './routes/orders';
import { handleProductsRoutes } from './routes/products';
import { handlePublicRoutes } from './routes/public';
import { handleServicesRoutes } from './routes/services';
import { handleStoresRoutes } from './routes/stores';
import { getUserByToken } from './services/auth';
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

export async function dispatchApiRequest(req: ApiRequest, db: DatabaseAdapter): Promise<ApiResponse> {
  try {
    // Extract user from authorization header or cookie if present
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    if (token) {
      req.user = await getUserByToken(db, token);
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

    // 9. Manual Cron Trigger endpoint (for testing cron jobs)
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
