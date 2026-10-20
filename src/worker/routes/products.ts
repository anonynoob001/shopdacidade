// Shop Carajás - Products Public Catalog & Search Routes
import { DatabaseAdapter } from '../db';

export async function handleProductsRoutes(req: { method: string; path: string; query?: any }, db: DatabaseAdapter) {
  const { method, path, query } = req;

  // GET /api/products
  if (method === 'GET' && path === '/api/products') {
    const category = query?.category;
    const store = query?.store;
    const search = query?.search;
    const minPrice = query?.minPrice;
    const maxPrice = query?.maxPrice;
    const sort = query?.sort || 'recent'; // recent, price_asc, price_desc, name
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query?.limit) || 20));
    const offset = (page - 1) * limit;

    let sql = `
      SELECT p.*, s.name as store_name, s.slug as store_slug, s.neighborhood as store_neighborhood,
             s.delivery_fee_base, s.delivery_time_min, c.name as category_name
      FROM products p
      JOIN stores s ON s.id = p.store_id
      LEFT JOIN product_categories c ON c.id = p.category_id
      WHERE p.is_active = 1 AND s.status = 'active'
    `;
    const params: any[] = [];

    if (category) {
      sql += ' AND (c.slug = ? OR p.category_id = ?)';
      params.push(category, category);
    }
    if (store) {
      sql += ' AND (s.slug = ? OR s.id = ?)';
      params.push(store, store);
    }
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (minPrice) {
      sql += ' AND COALESCE(p.promotional_price, p.price) >= ?';
      params.push(Number(minPrice));
    }
    if (maxPrice) {
      sql += ' AND COALESCE(p.promotional_price, p.price) <= ?';
      params.push(Number(maxPrice));
    }

    if (sort === 'price_asc') {
      sql += ' ORDER BY COALESCE(p.promotional_price, p.price) ASC';
    } else if (sort === 'price_desc') {
      sql += ' ORDER BY COALESCE(p.promotional_price, p.price) DESC';
    } else if (sort === 'name') {
      sql += ' ORDER BY p.name ASC';
    } else {
      sql += ' ORDER BY p.is_featured DESC, p.created_at DESC';
    }

    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await db.prepare(sql).bind(...params).all();

    return {
      status: 200,
      data: {
        products: results,
        page,
        limit
      }
    };
  }

  // GET /api/products/:id
  const prodMatch = path.match(/^\/api\/products\/([a-zA-Z0-9_-]+)$/);
  if (method === 'GET' && prodMatch) {
    const id = prodMatch[1];
    const product = await db.prepare(`
      SELECT p.*, s.name as store_name, s.slug as store_slug, s.neighborhood as store_neighborhood,
             s.delivery_fee_base, s.delivery_time_min, s.whatsapp as store_whatsapp,
             s.free_delivery_minimum, s.accepts_delivery, s.accepts_pickup,
             c.name as category_name
      FROM products p
      JOIN stores s ON s.id = p.store_id
      LEFT JOIN product_categories c ON c.id = p.category_id
      WHERE p.id = ? AND p.is_active = 1
    `).bind(id).first<any>();

    if (!product) {
      return { status: 404, data: { error: 'Produto não encontrado ou indisponível.' } };
    }

    // Related products from same store or category
    const related = await db.prepare(`
      SELECT p.*, s.name as store_name, s.slug as store_slug
      FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE p.store_id = ? AND p.id != ? AND p.is_active = 1
      LIMIT 4
    `).bind(product.store_id, product.id).all();

    return { status: 200, data: { product, related: related.results } };
  }

  return null;
}
