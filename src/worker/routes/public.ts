// Shop Carajás - Public Endpoints
import { DatabaseAdapter } from '../db';
import { INITIAL_SCHEMA_SQL } from '../schema_ddl';

export async function handlePublicRoutes(req: { method: string; path: string; query?: any }, db: DatabaseAdapter) {
  const { method, path } = req;

  // GET /api/public/initial-data (fast aggregated boot payload for homepage)
  if (method === 'GET' && path === '/api/public/initial-data') {
    try {
      const [banners, productCats, serviceCats, settingsRows, featuredStores, featuredProducts, featuredProviders, ads] = await Promise.all([
        db.prepare('SELECT * FROM promotional_banners WHERE is_active = 1 ORDER BY position ASC').all().catch(() => ({ results: [] })),
        db.prepare('SELECT * FROM product_categories WHERE is_active = 1 ORDER BY sort_order ASC').all().catch(() => ({ results: [] })),
        db.prepare('SELECT * FROM service_categories WHERE is_active = 1 ORDER BY sort_order ASC').all().catch(() => ({ results: [] })),
        db.prepare('SELECT key, value FROM platform_settings').all().catch(() => ({ results: [] })),
        db.prepare(`
          SELECT s.*, 
            (SELECT COUNT(*) FROM products p WHERE p.store_id = s.id AND p.is_active = 1) as total_products,
            (SELECT ROUND(AVG(rating), 1) FROM reviews r WHERE r.target_type = 'store' AND r.target_id = s.id) as rating
          FROM stores s 
          WHERE s.status = 'active' 
          ORDER BY s.is_featured DESC, s.name ASC
        `).all().catch(() => ({ results: [] })),
        db.prepare(`
          SELECT p.*, s.name as store_name, s.slug as store_slug, s.neighborhood as store_neighborhood,
                 c.name as category_name
          FROM products p
          JOIN stores s ON s.id = p.store_id
          LEFT JOIN product_categories c ON c.id = p.category_id
          WHERE p.is_active = 1 AND s.status = 'active'
          ORDER BY p.is_featured DESC, p.created_at DESC
          LIMIT 12
        `).all().catch(() => ({ results: [] })),
        db.prepare(`
          SELECT sp.*, sc.name as category_name, sc.slug as category_slug
          FROM service_providers sp
          JOIN service_categories sc ON sc.id = sp.category_id
          WHERE sp.is_approved = 1
          ORDER BY sp.is_featured DESC, sp.rating_average DESC
          LIMIT 6
        `).all().catch(() => ({ results: [] })),
        db.prepare('SELECT * FROM local_ads WHERE is_active = 1 LIMIT 4').all().catch(() => ({ results: [] }))
      ]);

      const settingsObj: Record<string, string> = {};
      for (const row of ((settingsRows?.results || []) as any[])) {
        settingsObj[row.key] = row.value;
      }

      return {
        status: 200,
        data: {
          banners: banners?.results || [],
          productCategories: productCats?.results || [],
          serviceCategories: serviceCats?.results || [],
          featuredStores: featuredStores?.results || [],
          featuredProducts: featuredProducts?.results || [],
          featuredProviders: featuredProviders?.results || [],
          localAds: ads?.results || [],
          settings: settingsObj
        }
      };
    } catch (err: any) {
      console.error('Error fetching initial-data:', err);
      return {
        status: 200,
        data: {
          banners: [],
          productCategories: [],
          serviceCategories: [],
          featuredStores: [],
          featuredProducts: [],
          featuredProviders: [],
          localAds: [],
          settings: {
            platform_name: 'Shop da Cidade',
            site_tagline: 'O Shopping Virtual da Sua Cidade',
            city_name: 'Canaã dos Carajás',
            city_state: 'PA'
          }
        }
      };
    }
  }

  // GET /api/public/db-status (Diagnostic for Cloudflare D1 integration)
  if (method === 'GET' && path === '/api/public/db-status') {
    try {
      const tablesRes = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name ASC").all();
      const tableNames = (tablesRes.results as any[]).map(t => t.name);

      let storeCount = 0;
      let productCount = 0;
      let userCount = 0;
      let isSeeded = false;

      if (tableNames.includes('stores')) {
        const sRes = await db.prepare('SELECT COUNT(*) as cnt FROM stores').first<{ cnt: number }>();
        storeCount = sRes?.cnt || 0;
      }
      if (tableNames.includes('products')) {
        const pRes = await db.prepare('SELECT COUNT(*) as cnt FROM products').first<{ cnt: number }>();
        productCount = pRes?.cnt || 0;
      }
      if (tableNames.includes('users')) {
        const uRes = await db.prepare('SELECT COUNT(*) as cnt FROM users').first<{ cnt: number }>();
        userCount = uRes?.cnt || 0;
      }

      isSeeded = tableNames.length >= 15 && storeCount > 0;

      return {
        status: 200,
        data: {
          ok: true,
          tables_found: tableNames.length,
          tables: tableNames,
          counts: {
            stores: storeCount,
            products: productCount,
            users: userCount
          },
          is_seeded: isSeeded,
          status_message: isSeeded
            ? 'Banco de dados D1 conectado e tabelas povoadas com sucesso!'
            : tableNames.length === 0
            ? 'Atenção: Nenhuma tabela encontrada no D1. É necessário rodar o script SQL no Console do D1.'
            : 'Tabelas encontradas, mas sem dados iniciais. Execute o script de povoamento.'
        }
      };
    } catch (err: any) {
      return {
        status: 500,
        data: {
          ok: false,
          error: err?.message || 'Falha ao consultar banco D1',
          hint: 'Verifique se o vínculo DB está configurado nas Settings -> Functions do Cloudflare Pages.'
        }
      };
    }
  }

  // GET & POST /api/public/setup-db (One-click Cloudflare D1 initialization)
  if ((method === 'GET' || method === 'POST') && path === '/api/public/setup-db') {
    try {
      await db.exec(INITIAL_SCHEMA_SQL);
      
      const tablesRes = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name ASC").all();
      const tableNames = (tablesRes.results as any[]).map(t => t.name);
      
      const sRes = await db.prepare('SELECT COUNT(*) as cnt FROM stores').first<{ cnt: number }>().catch(() => ({ cnt: 0 }));
      const pRes = await db.prepare('SELECT COUNT(*) as cnt FROM products').first<{ cnt: number }>().catch(() => ({ cnt: 0 }));
      const uRes = await db.prepare('SELECT COUNT(*) as cnt FROM users').first<{ cnt: number }>().catch(() => ({ cnt: 0 }));

      return {
        status: 200,
        data: {
          ok: true,
          success: true,
          message: 'Banco de dados D1 inicializado com sucesso!',
          tables_created: tableNames.length,
          tables: tableNames,
          counts: {
            stores: sRes?.cnt || 0,
            products: pRes?.cnt || 0,
            users: uRes?.cnt || 0
          }
        }
      };
    } catch (err: any) {
      console.error('Setup DB error:', err);
      return {
        status: 500,
        data: {
          ok: false,
          success: false,
          error: err?.message || 'Falha ao inicializar banco D1',
          hint: 'Verifique se o vínculo DB está configurado nas Settings -> Functions do Cloudflare Pages.'
        }
      };
    }
  }

  // GET /api/public/plans
  if (method === 'GET' && path === '/api/public/plans') {
    try {
      const { results } = await db.prepare('SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price ASC').all();
      return { status: 200, data: { plans: results } };
    } catch {
      return { status: 200, data: { plans: [] } };
    }
  }

  // GET /api/public/settings
  if (method === 'GET' && path === '/api/public/settings') {
    try {
      const { results } = await db.prepare('SELECT key, value FROM platform_settings').all();
      const settingsObj: Record<string, string> = {};
      for (const row of (results as any[])) {
        settingsObj[row.key] = row.value;
      }
      return { status: 200, data: { settings: settingsObj } };
    } catch {
      return { status: 200, data: { settings: {} } };
    }
  }

  return null;
}
