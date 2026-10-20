// Shop Carajás - Public Endpoints
import { DatabaseAdapter } from '../db';

export async function handlePublicRoutes(req: { method: string; path: string; query?: any }, db: DatabaseAdapter) {
  const { method, path } = req;

  // GET /api/public/initial-data (fast aggregated boot payload for homepage)
  if (method === 'GET' && path === '/api/public/initial-data') {
    const [banners, productCats, serviceCats, settingsRows, featuredStores, featuredProducts, featuredProviders, ads] = await Promise.all([
      db.prepare('SELECT * FROM promotional_banners WHERE is_active = 1 ORDER BY position ASC').all(),
      db.prepare('SELECT * FROM product_categories WHERE is_active = 1 ORDER BY sort_order ASC').all(),
      db.prepare('SELECT * FROM service_categories WHERE is_active = 1 ORDER BY sort_order ASC').all(),
      db.prepare('SELECT key, value FROM platform_settings').all(),
      db.prepare(`
        SELECT s.*, 
          (SELECT COUNT(*) FROM products p WHERE p.store_id = s.id AND p.is_active = 1) as total_products,
          (SELECT ROUND(AVG(rating), 1) FROM reviews r WHERE r.target_type = 'store' AND r.target_id = s.id) as rating
        FROM stores s 
        WHERE s.status = 'active' 
        ORDER BY s.is_featured DESC, s.name ASC
      `).all(),
      db.prepare(`
        SELECT p.*, s.name as store_name, s.slug as store_slug, s.neighborhood as store_neighborhood,
               c.name as category_name
        FROM products p
        JOIN stores s ON s.id = p.store_id
        LEFT JOIN product_categories c ON c.id = p.category_id
        WHERE p.is_active = 1 AND s.status = 'active'
        ORDER BY p.is_featured DESC, p.created_at DESC
        LIMIT 12
      `).all(),
      db.prepare(`
        SELECT sp.*, sc.name as category_name, sc.slug as category_slug
        FROM service_providers sp
        JOIN service_categories sc ON sc.id = sp.category_id
        WHERE sp.is_approved = 1
        ORDER BY sp.is_featured DESC, sp.rating_average DESC
        LIMIT 6
      `).all(),
      db.prepare('SELECT * FROM local_ads WHERE is_active = 1 LIMIT 4').all()
    ]);

    const settingsObj: Record<string, string> = {};
    for (const row of (settingsRows.results as any[])) {
      settingsObj[row.key] = row.value;
    }

    return {
      status: 200,
      data: {
        banners: banners.results,
        productCategories: productCats.results,
        serviceCategories: serviceCats.results,
        featuredStores: featuredStores.results,
        featuredProducts: featuredProducts.results,
        featuredProviders: featuredProviders.results,
        localAds: ads.results,
        settings: settingsObj
      }
    };
  }

  // GET /api/public/plans
  if (method === 'GET' && path === '/api/public/plans') {
    const { results } = await db.prepare('SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price ASC').all();
    return { status: 200, data: { plans: results } };
  }

  // GET /api/public/settings
  if (method === 'GET' && path === '/api/public/settings') {
    const { results } = await db.prepare('SELECT key, value FROM platform_settings').all();
    const settingsObj: Record<string, string> = {};
    for (const row of (results as any[])) {
      settingsObj[row.key] = row.value;
    }
    return { status: 200, data: { settings: settingsObj } };
  }

  return null;
}
