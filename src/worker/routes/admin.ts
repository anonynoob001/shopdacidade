// Shop Carajás - Central Admin Panel Routes
import { DatabaseAdapter } from '../db';
import { User } from '../types';

export async function handleAdminRoutes(req: { method: string; path: string; query?: any; body?: any; user?: User | null }, db: DatabaseAdapter) {
  const { method, path, query, body, user } = req;

  // Authorization check: User must be admin or superadmin
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return { status: 403, data: { error: 'Acesso restrito ao Painel Central da Administração.' } };
  }

  // GET /api/admin/metrics (Real business indicators)
  if (method === 'GET' && path === '/api/admin/metrics') {
    const [counts, orderStats, storesCount, providersCount, couriersCount] = await Promise.all([
      db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM stores WHERE status = 'active') as active_stores,
          (SELECT COUNT(*) FROM service_providers WHERE is_approved = 1) as active_providers,
          (SELECT COUNT(*) FROM couriers WHERE is_approved = 1) as active_couriers,
          (SELECT COUNT(*) FROM quote_requests) as total_quotes,
          (SELECT COUNT(*) FROM service_schedules) as total_schedules
      `).first<any>(),
      db.prepare(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(total_amount), 0) as gmv,
          COALESCE(SUM(total_delivery_fee), 0) as total_delivery_fees
        FROM orders
        WHERE payment_status = 'confirmed'
      `).first<any>(),
      db.prepare("SELECT COUNT(*) as count FROM stores WHERE status = 'pending'").first<{ count: number }>(),
      db.prepare('SELECT COUNT(*) as count FROM service_providers WHERE is_approved = 0').first<{ count: number }>(),
      db.prepare('SELECT COUNT(*) as count FROM couriers WHERE is_approved = 0').first<{ count: number }>()
    ]);

    const commissions = await db.prepare(`
      SELECT COALESCE(SUM(commission_amount), 0) as total_commission
      FROM sub_orders
      WHERE status != 'cancelled'
    `).first<{ total_commission: number }>();

    return {
      status: 200,
      data: {
        metrics: {
          totalUsers: counts?.total_users || 0,
          activeStores: counts?.active_stores || 0,
          activeProviders: counts?.active_providers || 0,
          activeCouriers: counts?.active_couriers || 0,
          totalQuotes: counts?.total_quotes || 0,
          totalSchedules: counts?.total_schedules || 0,
          totalOrders: orderStats?.total_orders || 0,
          gmv: orderStats?.gmv || 0,
          totalCommissionEarned: commissions?.total_commission || 0,
          pendingStoreApprovals: storesCount?.count || 0,
          pendingProviderApprovals: providersCount?.count || 0,
          pendingCourierApprovals: couriersCount?.count || 0
        }
      }
    };
  }

  // GET /api/admin/users
  if (method === 'GET' && path === '/api/admin/users') {
    const { results } = await db.prepare('SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT 100').all();
    return { status: 200, data: { users: results } };
  }

  // PATCH /api/admin/users/:id
  const userMatch = path.match(/^\/api\/admin\/users\/([a-zA-Z0-9_-]+)$/);
  if (method === 'PATCH' && userMatch) {
    const targetUserId = userMatch[1];
    const { role, is_active } = body || {};

    await db.prepare(`
      UPDATE users SET
        role = COALESCE(?, role),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(role || null, is_active !== undefined ? (is_active ? 1 : 0) : null, targetUserId).run();

    // Audit log
    await db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, details_json)
      VALUES (?, ?, ?, 'UPDATE_USER', 'user', ?, ?)
    `).bind('log_' + crypto.randomUUID().slice(0, 8), user.id, user.name, targetUserId, JSON.stringify(body)).run();

    return { status: 200, data: { success: true } };
  }

  // GET /api/admin/stores
  if (method === 'GET' && path === '/api/admin/stores') {
    const { results } = await db.prepare(`
      SELECT s.*, u.name as owner_name, u.email as owner_email,
             (SELECT COUNT(*) FROM products p WHERE p.store_id = s.id) as total_products
      FROM stores s
      JOIN users u ON u.id = s.user_id
      ORDER BY s.created_at DESC
    `).all();
    return { status: 200, data: { stores: results } };
  }

  // PATCH /api/admin/stores/:id
  const storeAdminMatch = path.match(/^\/api\/admin\/stores\/([a-zA-Z0-9_-]+)$/);
  if (method === 'PATCH' && storeAdminMatch) {
    const storeId = storeAdminMatch[1];
    const { status, is_featured, commission_rate_override } = body || {};

    await db.prepare(`
      UPDATE stores SET
        status = COALESCE(?, status),
        is_featured = COALESCE(?, is_featured),
        commission_rate_override = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      status || null,
      is_featured !== undefined ? (is_featured ? 1 : 0) : null,
      commission_rate_override !== undefined ? Number(commission_rate_override) : null,
      storeId
    ).run();

    return { status: 200, data: { success: true } };
  }

  // GET /api/admin/providers
  if (method === 'GET' && path === '/api/admin/providers') {
    const { results } = await db.prepare(`
      SELECT sp.*, u.name as owner_name, u.email as owner_email, sc.name as category_name
      FROM service_providers sp
      JOIN users u ON u.id = sp.user_id
      LEFT JOIN service_categories sc ON sc.id = sp.category_id
      ORDER BY sp.created_at DESC
    `).all();
    return { status: 200, data: { providers: results } };
  }

  // PATCH /api/admin/providers/:id
  const providerAdminMatch = path.match(/^\/api\/admin\/providers\/([a-zA-Z0-9_-]+)$/);
  if (method === 'PATCH' && providerAdminMatch) {
    const providerId = providerAdminMatch[1];
    const { is_approved, is_featured } = body || {};

    await db.prepare(`
      UPDATE service_providers SET
        is_approved = COALESCE(?, is_approved),
        is_featured = COALESCE(?, is_featured),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      is_approved !== undefined ? (is_approved ? 1 : 0) : null,
      is_featured !== undefined ? (is_featured ? 1 : 0) : null,
      providerId
    ).run();

    return { status: 200, data: { success: true } };
  }

  // GET /api/admin/settings
  if (method === 'GET' && path === '/api/admin/settings') {
    const { results } = await db.prepare('SELECT key, value FROM platform_settings').all();
    const settings: Record<string, string> = {};
    for (const row of (results as any[])) {
      settings[row.key] = row.value;
    }
    return { status: 200, data: { settings } };
  }

  // POST /api/admin/settings
  if (method === 'POST' && path === '/api/admin/settings') {
    const settingsMap = body || {};
    for (const [key, value] of Object.entries(settingsMap)) {
      await db.prepare(`
        INSERT OR REPLACE INTO platform_settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).bind(key, String(value)).run();
    }
    return { status: 200, data: { success: true } };
  }

  // GET /api/admin/banners
  if (method === 'GET' && path === '/api/admin/banners') {
    const { results } = await db.prepare('SELECT * FROM promotional_banners ORDER BY position ASC').all();
    return { status: 200, data: { banners: results } };
  }

  // POST /api/admin/banners
  if (method === 'POST' && path === '/api/admin/banners') {
    const { title, subtitle, image_url, link_url, target_type = 'store', position = 1 } = body || {};
    const bannerId = 'banner_' + crypto.randomUUID().slice(0, 8);
    await db.prepare(`
      INSERT INTO promotional_banners (id, title, subtitle, image_url, link_url, target_type, position, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(bannerId, title, subtitle || null, image_url, link_url || null, target_type, Number(position)).run();

    return { status: 201, data: { success: true, id: bannerId } };
  }

  // DELETE /api/admin/banners/:id
  const bannerDelMatch = path.match(/^\/api\/admin\/banners\/([a-zA-Z0-9_-]+)$/);
  if (method === 'DELETE' && bannerDelMatch) {
    const bannerId = bannerDelMatch[1];
    await db.prepare('DELETE FROM promotional_banners WHERE id = ?').bind(bannerId).run();
    return { status: 200, data: { success: true } };
  }

  // GET /api/admin/audit-logs
  if (method === 'GET' && path === '/api/admin/audit-logs') {
    const { results } = await db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50').all();
    return { status: 200, data: { logs: results } };
  }

  // GET /api/admin/export-csv
  if (method === 'GET' && path === '/api/admin/export-csv') {
    const { results: orders } = await db.prepare(`
      SELECT o.order_code, o.customer_name, o.customer_email, o.customer_phone,
             o.payment_method, o.payment_status, o.total_amount, o.total_delivery_fee,
             o.created_at
      FROM orders o
      ORDER BY o.created_at DESC
    `).all();

    let csv = 'Código;Cliente;Email;Telefone;Pagamento;Status;Valor_Total;Taxa_Entrega;Data\n';
    for (const ord of (orders as any[])) {
      csv += `"${ord.order_code}";"${ord.customer_name}";"${ord.customer_email}";"${ord.customer_phone}";"${ord.payment_method}";"${ord.payment_status}";"${ord.total_amount}";"${ord.total_delivery_fee}";"${ord.created_at}"\n`;
    }

    return {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="pedidos_shop_carajas.csv"'
      },
      data: csv
    };
  }

  // GET /api/admin/database/stats (Cloudflare D1 & Database Inspector)
  if (method === 'GET' && path === '/api/admin/database/stats') {
    try {
      const knownTables = [
        'users',
        'stores',
        'products',
        'product_categories',
        'service_providers',
        'service_items',
        'orders',
        'sub_orders',
        'order_items',
        'couriers',
        'delivery_assignments',
        'quote_requests',
        'service_schedules',
        'subscription_plans',
        'promotional_banners',
        'platform_settings',
        'audit_logs',
        'notifications'
      ];

      const tables: { name: string; count: number }[] = [];
      let totalRecords = 0;

      for (const t of knownTables) {
        try {
          const res = await db.prepare(`SELECT COUNT(*) as count FROM ${t}`).first<{ count: number }>();
          const count = res?.count || 0;
          tables.push({ name: t, count });
          totalRecords += count;
        } catch {
          // table might not be created yet
        }
      }

      return {
        status: 200,
        data: {
          success: true,
          engine: 'Cloudflare D1 (SQLite Engine)',
          databaseName: 'shop_cidade_db',
          d1Binding: 'DB',
          totalRecords,
          tables
        }
      };
    } catch (err: any) {
      return { status: 500, data: { error: err.message || 'Falha ao inspecionar o banco de dados.' } };
    }
  }

  // POST /api/admin/database/query (Cloudflare D1 Live SQL Console)
  if (method === 'POST' && path === '/api/admin/database/query') {
    const { query: sqlQuery } = body || {};
    if (!sqlQuery || typeof sqlQuery !== 'string' || !sqlQuery.trim()) {
      return { status: 400, data: { error: 'Comando SQL não informado.' } };
    }

    const trimmed = sqlQuery.trim();
    const isSelect = /^SELECT\b/i.test(trimmed) || /^PRAGMA\b/i.test(trimmed) || /^EXPLAIN\b/i.test(trimmed);

    const startTime = performance.now();
    try {
      if (isSelect) {
        // Enforce safe limit if not specified
        let safeQuery = trimmed;
        if (!/LIMIT\s+\d+/i.test(trimmed)) {
          safeQuery += ' LIMIT 100';
        }

        const { results } = await db.prepare(safeQuery).all();
        const latencyMs = Math.round(performance.now() - startTime);
        const rows = (results as any[]) || [];
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

        return {
          status: 200,
          data: {
            success: true,
            columns,
            rows,
            rowCount: rows.length,
            latencyMs
          }
        };
      } else {
        // Non-select statement (INSERT, UPDATE, DELETE, CREATE, etc.)
        await db.exec(trimmed);
        const latencyMs = Math.round(performance.now() - startTime);

        return {
          status: 200,
          data: {
            success: true,
            columns: ['status'],
            rows: [{ status: 'Comando executado com sucesso no Cloudflare D1.' }],
            rowCount: 1,
            latencyMs
          }
        };
      }
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        status: 400,
        data: {
          success: false,
          error: err.message || 'Erro na execução do comando SQL',
          latencyMs
        }
      };
    }
  }

  return null;
}
