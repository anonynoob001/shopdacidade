// Cloudflare Pages Function adapter for /api/* routes
import { getDb } from '../../src/worker/db';
import { dispatchApiRequest } from '../../src/worker/router';

export async function onRequest(context: any): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

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

  // Parse headers
  const headersObj: Record<string, string> = {};
  request.headers.forEach((value: string, key: string) => {
    headersObj[key.toLowerCase()] = value;
  });

  // Parse query params
  const queryObj: Record<string, string> = {};
  url.searchParams.forEach((value: string, key: string) => {
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

  try {
    const db = getDb(env);

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
  } catch (err: any) {
    console.error('Unhandled Pages Function error:', err);
    return new Response(
      JSON.stringify({
        error: 'Erro interno no servidor Cloudflare Pages Function',
        message: err?.message || 'Erro inesperado',
        path: url.pathname
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
}
