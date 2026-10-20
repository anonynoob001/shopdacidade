// Shop Carajás - Cloudflare Workers Main Entry Point
import { getDb } from './db';
import { runCronTasks } from './jobs/cron';
import { dispatchApiRequest } from './router';

export interface Env {
  DB: any; // Cloudflare D1 Database binding
  ASSETS: any; // Cloudflare Static Assets binding
  MEDIA_BUCKET?: any; // Cloudflare R2 binding
  ENVIRONMENT?: string;
  APP_URL?: string;
  CITY_NAME?: string;
}

export default {
  // HTTP Fetch Handler
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Route /api/* to the universal API Router
    if (url.pathname.startsWith('/api/')) {
      const db = getDb(env);

      // Parse headers
      const headersObj: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        headersObj[key.toLowerCase()] = value;
      });

      // Parse query params
      const queryObj: Record<string, string> = {};
      url.searchParams.forEach((value, key) => {
        queryObj[key] = value;
      });

      // Parse body if present
      let body: any = undefined;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            body = await request.json();
          } catch {
            body = undefined;
          }
        }
      }

      const apiRes = await dispatchApiRequest(
        {
          method: request.method,
          path: url.pathname,
          query: queryObj,
          headers: headersObj,
          body
        },
        db
      );

      const responseHeaders = new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        ...(apiRes.headers || {})
      });

      const bodyContent = typeof apiRes.data === 'string' ? apiRes.data : JSON.stringify(apiRes.data);
      return new Response(bodyContent, {
        status: apiRes.status,
        headers: responseHeaders
      });
    }

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Cloudflare Workers Static Assets binding (Frontend SPA fallback)
    if (env.ASSETS) {
      try {
        const response = await env.ASSETS.fetch(request);
        if (response.status === 404) {
          // SPA HTML fallback
          return await env.ASSETS.fetch(new Request(new URL('/', request.url), request));
        }
        return response;
      } catch (e) {
        console.error('Asset fetch error:', e);
      }
    }

    return new Response('Shop Carajás Worker is running.', { status: 200 });
  },

  // Cloudflare Scheduled Cron Triggers Handler
  async scheduled(event: any, env: Env, ctx: any): Promise<void> {
    ctx.waitUntil(
      (async () => {
        const db = getDb(env);
        await runCronTasks(db);
      })()
    );
  }
};
