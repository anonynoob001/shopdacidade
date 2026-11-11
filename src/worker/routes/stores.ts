// Shop Carajás - Stores & Merchant Routes
import { DatabaseAdapter } from '../db';
import { User } from '../types';

export async function handleStoresRoutes(req: { method: string; path: string; query?: any; body?: any; user?: User | null }, db: DatabaseAdapter) {
  const { method, path, query, body, user } = req;

  // GET /api/stores (Public store directory)
  if (method === 'GET' && path === '/api/stores') {
    const category = query?.category;
    const search = query?.search;
    const neighborhood = query?.neighborhood;

    let sql = `
      SELECT s.*, 
        (SELECT COUNT(*) FROM products p WHERE p.store_id = s.id AND p.is_active = 1) as total_products,
        (SELECT ROUND(AVG(rating), 1) FROM reviews r WHERE r.target_type = 'store' AND r.target_id = s.id) as rating
      FROM stores s 
      WHERE s.status = 'active'
    `;
    const params: any[] = [];

    if (category) {
      sql += ` AND (
        s.category = ? 
        OR LOWER(s.category) = LOWER(?)
        OR s.category IN (SELECT name FROM product_categories WHERE slug = ? OR id = ?)
      )`;
      params.push(category, category, category, category);
    }
    if (neighborhood) {
      sql += ' AND s.neighborhood = ?';
      params.push(neighborhood);
    }
    if (search) {
      sql += ' AND (s.name LIKE ? OR s.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY s.is_featured DESC, s.name ASC';
    const { results } = await db.prepare(sql).bind(...params).all();

    return { status: 200, data: { stores: results } };
  }

  // GET /api/stores/:slug (Public store details + products)
  const storeSlugMatch = path.match(/^\/api\/stores\/([a-zA-Z0-9_-]+)$/);
  if (method === 'GET' && storeSlugMatch) {
    const slug = storeSlugMatch[1];
    const store = await db.prepare('SELECT * FROM stores WHERE slug = ?').bind(slug).first<any>();

    if (!store) {
      return { status: 404, data: { error: 'Loja não encontrada.' } };
    }

    const [productsRes, reviewsRes] = await Promise.all([
      db.prepare(`
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN product_categories c ON c.id = p.category_id
        WHERE p.store_id = ? AND p.is_active = 1
        ORDER BY p.is_featured DESC, p.name ASC
      `).bind(store.id).all(),
      db.prepare(`
        SELECT r.*, u.name as user_name
        FROM reviews r
        LEFT JOIN users u ON u.id = r.user_id
        WHERE r.target_type = 'store' AND r.target_id = ? AND r.is_published = 1
        ORDER BY r.created_at DESC
        LIMIT 10
      `).bind(store.id).all()
    ]);

    return {
      status: 200,
      data: {
        store,
        products: productsRes.results,
        reviews: reviewsRes.results
      }
    };
  }

  // ==================== MERCHANT PANEL ROUTES ====================

  // GET /api/merchant/store
  if (method === 'GET' && path === '/api/merchant/store') {
    if (!user) {
      return { status: 401, data: { error: 'Autenticação necessária.' } };
    }
    let store = await db.prepare('SELECT * FROM stores WHERE user_id = ?').bind(user.id).first();
    if (!store && (user.role === 'superadmin' || user.role === 'admin')) {
      store = await db.prepare('SELECT * FROM stores ORDER BY created_at ASC LIMIT 1').first();
    }
    return { status: 200, data: { store: store || null } };
  }

  // POST /api/merchant/store (Create / register store)
  if (method === 'POST' && path === '/api/merchant/store') {
    if (!user) {
      return { status: 401, data: { error: 'Autenticação necessária.' } };
    }

    const { name, category, phone, whatsapp, street, number, neighborhood, description, delivery_fee_base, free_delivery_minimum } = body || {};
    if (!name || !category || !neighborhood) {
      return { status: 400, data: { error: 'Nome da loja, categoria e bairro são obrigatórios.' } };
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(100 + Math.random() * 900);
    const storeId = 'store_' + crypto.randomUUID().slice(0, 10);

    await db.prepare(`
      INSERT INTO stores (
        id, user_id, name, slug, logo_url, banner_url, description, category,
        phone, whatsapp, street, number, neighborhood, city, state, zip_code,
        is_open, accepts_pickup, accepts_delivery, delivery_fee_base, delivery_time_min,
        free_delivery_minimum, plan_id, status, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Canaã dos Carajás', 'PA', '68537-000', 1, 1, 1, ?, '30-50 min', ?, 'plan_store_free', 'active', 0)
    `).bind(
      storeId, user.id, name, slug,
      body?.logo_url || 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=300&h=300&fit=crop&q=80',
      body?.banner_url || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=400&fit=crop&q=80',
      description || 'Loja oficial em Canaã dos Carajás', category,
      phone || null, whatsapp || null, street || null, number || null, neighborhood,
      Number(delivery_fee_base) || 7.00, Number(free_delivery_minimum) || 150.00
    ).run();

    // Ensure user role is updated to lojista if was cliente
    if (user.role === 'cliente') {
      await db.prepare("UPDATE users SET role = 'lojista' WHERE id = ?").bind(user.id).run();
    }

    const created = await db.prepare('SELECT * FROM stores WHERE id = ?').bind(storeId).first();
    return { status: 201, data: { success: true, store: created } };
  }

  // PUT /api/merchant/store
  if (method === 'PUT' && path === '/api/merchant/store') {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };

    let store = await db.prepare('SELECT * FROM stores WHERE user_id = ?').bind(user.id).first<any>();
    if (!store && (user.role === 'superadmin' || user.role === 'admin')) {
      store = await db.prepare('SELECT * FROM stores ORDER BY created_at ASC LIMIT 1').first<any>();
    }
    if (!store) return { status: 404, data: { error: 'Loja não encontrada.' } };

    const {
      name, category, description, phone, whatsapp, street, number, neighborhood,
      is_open, accepts_pickup, accepts_delivery, delivery_fee_base,
      delivery_time_min, free_delivery_minimum, logo_url, banner_url,
      slug, theme_color_primary, theme_color_secondary, custom_announcement, instagram,
      opening_hours_json, neighborhood_fees_json
    } = body || {};

    let cleanSlug = slug ? String(slug).toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-') : undefined;
    if (cleanSlug) {
      // Check if slug taken by another store
      const slugExists = await db.prepare('SELECT id FROM stores WHERE slug = ? AND id != ?').bind(cleanSlug, store.id).first();
      if (slugExists) {
        cleanSlug = `${cleanSlug}-${Math.floor(Math.random() * 899 + 100)}`;
      }
    }

    await db.prepare(`
      UPDATE stores SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        slug = COALESCE(?, slug),
        description = COALESCE(?, description),
        phone = COALESCE(?, phone),
        whatsapp = COALESCE(?, whatsapp),
        instagram = COALESCE(?, instagram),
        street = COALESCE(?, street),
        number = COALESCE(?, number),
        neighborhood = COALESCE(?, neighborhood),
        is_open = COALESCE(?, is_open),
        accepts_pickup = COALESCE(?, accepts_pickup),
        accepts_delivery = COALESCE(?, accepts_delivery),
        delivery_fee_base = COALESCE(?, delivery_fee_base),
        delivery_time_min = COALESCE(?, delivery_time_min),
        free_delivery_minimum = COALESCE(?, free_delivery_minimum),
        logo_url = COALESCE(?, logo_url),
        banner_url = COALESCE(?, banner_url),
        theme_color_primary = COALESCE(?, theme_color_primary),
        theme_color_secondary = COALESCE(?, theme_color_secondary),
        custom_announcement = COALESCE(?, custom_announcement),
        opening_hours_json = COALESCE(?, opening_hours_json),
        neighborhood_fees_json = COALESCE(?, neighborhood_fees_json),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name, category || null, cleanSlug || null, description, phone, whatsapp, instagram || null, street, number, neighborhood,
      is_open !== undefined ? (is_open ? 1 : 0) : null,
      accepts_pickup !== undefined ? (accepts_pickup ? 1 : 0) : null,
      accepts_delivery !== undefined ? (accepts_delivery ? 1 : 0) : null,
      delivery_fee_base !== undefined ? Number(delivery_fee_base) : null,
      delivery_time_min,
      free_delivery_minimum !== undefined ? Number(free_delivery_minimum) : null,
      logo_url, banner_url,
      theme_color_primary || null, theme_color_secondary || null, custom_announcement || null,
      opening_hours_json !== undefined ? (typeof opening_hours_json === 'string' ? opening_hours_json : JSON.stringify(opening_hours_json)) : null,
      neighborhood_fees_json !== undefined ? (typeof neighborhood_fees_json === 'string' ? neighborhood_fees_json : JSON.stringify(neighborhood_fees_json)) : null,
      store.id
    ).run();

    const updated = await db.prepare('SELECT * FROM stores WHERE id = ?').bind(store.id).first();
    return { status: 200, data: { success: true, store: updated } };
  }

  // GET /api/merchant/products
  if (method === 'GET' && path === '/api/merchant/products') {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };
    let store = await db.prepare('SELECT id FROM stores WHERE user_id = ?').bind(user.id).first<any>();
    if (!store && (user.role === 'superadmin' || user.role === 'admin')) {
      store = await db.prepare('SELECT id FROM stores ORDER BY created_at ASC LIMIT 1').first<any>();
    }
    if (!store) return { status: 200, data: { products: [] } };

    const { results } = await db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN product_categories c ON c.id = p.category_id
      WHERE p.store_id = ?
      ORDER BY p.created_at DESC
    `).bind(store.id).all();

    return { status: 200, data: { products: results } };
  }

  // POST /api/merchant/products
  if (method === 'POST' && path === '/api/merchant/products') {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };
    let store = await db.prepare('SELECT * FROM stores WHERE user_id = ?').bind(user.id).first<any>();
    if (!store && (user.role === 'superadmin' || user.role === 'admin')) {
      store = await db.prepare('SELECT * FROM stores ORDER BY created_at ASC LIMIT 1').first<any>();
    }
    if (!store) return { status: 400, data: { error: 'Você ainda não possui uma loja cadastrada.' } };

    const { name, category_id, description, price, promotional_price, stock_quantity, image_url, sku, weight_kg } = body || {};
    if (!name || !price || !category_id) {
      return { status: 400, data: { error: 'Nome, preço e categoria são obrigatórios.' } };
    }

    const prodId = 'prod_' + crypto.randomUUID().slice(0, 10);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(100 + Math.random() * 900);

    await db.prepare(`
      INSERT INTO products (
        id, store_id, category_id, name, slug, description, image_url, sku,
        price, promotional_price, stock_quantity, is_active, weight_kg
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).bind(
      prodId, store.id, category_id, name, slug, description || '',
      image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=600&fit=crop&q=80',
      sku || 'CAR-' + Math.floor(1000 + Math.random() * 9000),
      Number(price), promotional_price ? Number(promotional_price) : null,
      Number(stock_quantity) || 0, Number(weight_kg) || 0.5
    ).run();

    const created = await db.prepare('SELECT * FROM products WHERE id = ?').bind(prodId).first();
    return { status: 201, data: { success: true, product: created } };
  }

  // PUT /api/merchant/products/:id
  const prodMatch = path.match(/^\/api\/merchant\/products\/([a-zA-Z0-9_-]+)$/);
  if (method === 'PUT' && prodMatch) {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };
    let store = await db.prepare('SELECT id FROM stores WHERE user_id = ?').bind(user.id).first<any>();
    if (!store && (user.role === 'superadmin' || user.role === 'admin')) {
      store = await db.prepare('SELECT id FROM stores ORDER BY created_at ASC LIMIT 1').first<any>();
    }
    if (!store) return { status: 403, data: { error: 'Acesso negado.' } };

    const prodId = prodMatch[1];
    const { name, category_id, description, price, promotional_price, stock_quantity, image_url, sku, is_active } = body || {};

    await db.prepare(`
      UPDATE products SET
        name = COALESCE(?, name),
        category_id = COALESCE(?, category_id),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        promotional_price = ?,
        stock_quantity = COALESCE(?, stock_quantity),
        image_url = COALESCE(?, image_url),
        sku = COALESCE(?, sku),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND store_id = ?
    `).bind(
      name, category_id, description,
      price !== undefined ? Number(price) : null,
      promotional_price ? Number(promotional_price) : null,
      stock_quantity !== undefined ? Number(stock_quantity) : null,
      image_url, sku,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      prodId, store.id
    ).run();

    const updated = await db.prepare('SELECT * FROM products WHERE id = ?').bind(prodId).first();
    return { status: 200, data: { success: true, product: updated } };
  }

  // DELETE /api/merchant/products/:id
  if (method === 'DELETE' && prodMatch) {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };
    let store = await db.prepare('SELECT id FROM stores WHERE user_id = ?').bind(user.id).first<any>();
    if (!store && (user.role === 'superadmin' || user.role === 'admin')) {
      store = await db.prepare('SELECT id FROM stores ORDER BY created_at ASC LIMIT 1').first<any>();
    }
    if (!store) return { status: 403, data: { error: 'Acesso negado.' } };

    const prodId = prodMatch[1];
    await db.prepare('UPDATE products SET is_active = 0 WHERE id = ? AND store_id = ?').bind(prodId, store.id).run();
    return { status: 200, data: { success: true, message: 'Produto desativado com sucesso.' } };
  }

  // GET /api/merchant/orders
  if (method === 'GET' && path === '/api/merchant/orders') {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };
    let store = await db.prepare('SELECT id FROM stores WHERE user_id = ?').bind(user.id).first<any>();
    if (!store && (user.role === 'superadmin' || user.role === 'admin')) {
      store = await db.prepare('SELECT id FROM stores ORDER BY created_at ASC LIMIT 1').first<any>();
    }
    if (!store) return { status: 200, data: { orders: [] } };

    const { results } = await db.prepare(`
      SELECT so.*, o.order_code, o.customer_name, o.customer_phone, o.payment_method, o.payment_status,
             o.shipping_address_json, o.delivery_type
      FROM sub_orders so
      JOIN orders o ON o.id = so.order_id
      WHERE so.store_id = ?
      ORDER BY so.created_at DESC
    `).bind(store.id).all();

    // Fetch items for each sub_order
    for (const subOrder of (results as any[])) {
      const items = await db.prepare('SELECT * FROM order_items WHERE sub_order_id = ?').bind(subOrder.id).all();
      subOrder.items = items.results;
    }

    return { status: 200, data: { orders: results } };
  }

  // PATCH /api/merchant/orders/:id/status
  const orderStatusMatch = path.match(/^\/api\/merchant\/orders\/([a-zA-Z0-9_-]+)\/status$/);
  if (method === 'PATCH' && orderStatusMatch) {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };
    let store = await db.prepare('SELECT id FROM stores WHERE user_id = ?').bind(user.id).first<any>();
    if (!store && (user.role === 'superadmin' || user.role === 'admin')) {
      store = await db.prepare('SELECT id FROM stores ORDER BY created_at ASC LIMIT 1').first<any>();
    }
    if (!store) return { status: 403, data: { error: 'Acesso negado.' } };

    const subOrderId = orderStatusMatch[1];
    const { status } = body || {};
    const validStatuses = ['pending', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return { status: 400, data: { error: 'Status de pedido inválido.' } };
    }

    await db.prepare('UPDATE sub_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?')
      .bind(status, subOrderId, store.id).run();

    // If order became ready_for_pickup and delivery_model is platform_courier, ensure delivery is in waiting_courier
    if (status === 'ready_for_pickup') {
      const subOrder = await db.prepare('SELECT * FROM sub_orders WHERE id = ?').bind(subOrderId).first<any>();
      if (subOrder && subOrder.delivery_model === 'platform_courier') {
        await db.prepare("UPDATE deliveries SET status = 'waiting_courier' WHERE sub_order_id = ? AND status = 'waiting_courier'").bind(subOrderId).run();
      }
    }

    return { status: 200, data: { success: true, status } };
  }

  // GET /api/merchant/analytics
  if (method === 'GET' && path === '/api/merchant/analytics') {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };
    let store = await db.prepare('SELECT id FROM stores WHERE user_id = ?').bind(user.id).first<any>();
    if (!store && (user.role === 'superadmin' || user.role === 'admin')) {
      store = await db.prepare('SELECT id FROM stores ORDER BY created_at ASC LIMIT 1').first<any>();
    }
    if (!store) {
      return {
        status: 200,
        data: {
          analytics: {
            total_orders: 0,
            gross_sales: 0,
            total_commissions: 0,
            net_earnings: 0
          }
        }
      };
    }

    const stats = await db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(store_subtotal), 0) as gross_sales,
        COALESCE(SUM(commission_amount), 0) as total_commissions,
        COALESCE(SUM(store_net_amount), 0) as net_earnings
      FROM sub_orders
      WHERE store_id = ? AND status != 'cancelled'
    `).bind(store.id).first<any>();

    return { status: 200, data: { analytics: stats } };
  }

  return null;
}
