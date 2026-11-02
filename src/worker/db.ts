// Shop Carajás - Unified SQLite / Cloudflare D1 Client Adapter

export interface PreparedStatement {
  bind(...params: any[]): PreparedStatement;
  all<T = any>(): Promise<{ results: T[] }>;
  first<T = any>(colName?: string): Promise<T | null>;
  run(): Promise<{ success: boolean; meta: any }>;
}

export interface DatabaseAdapter {
  prepare(query: string): PreparedStatement;
  exec(query: string): Promise<void>;
  batch(statements: PreparedStatement[]): Promise<any[]>;
}

// In Node.js environment (dev server), we wrap node:sqlite DatabaseSync
class NodeSqliteAdapter implements DatabaseAdapter {
  private db: any;

  constructor(dbInstance: any) {
    this.db = dbInstance;
  }

  prepare(query: string): PreparedStatement {
    return new NodePreparedStatement(this.db, query);
  }

  async exec(query: string): Promise<void> {
    this.db.exec(query);
  }

  async batch(statements: PreparedStatement[]): Promise<any[]> {
    const results = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return results;
  }
}

class NodePreparedStatement implements PreparedStatement {
  private db: any;
  private query: string;
  private params: any[] = [];

  constructor(db: any, query: string) {
    this.db = db;
    this.query = query;
  }

  bind(...params: any[]): PreparedStatement {
    this.params = params.map(p => (p === undefined ? null : p));
    return this;
  }

  async all<T = any>(): Promise<{ results: T[] }> {
    try {
      const stmt = this.db.prepare(this.query);
      const rows = stmt.all(...this.params) as T[];
      return { results: rows || [] };
    } catch (err) {
      console.error('Error executing query all():', this.query, this.params, err);
      throw err;
    }
  }

  async first<T = any>(colName?: string): Promise<T | null> {
    try {
      const stmt = this.db.prepare(this.query);
      const row = stmt.get(...this.params) as any;
      if (!row) return null;
      if (colName && row[colName] !== undefined) return row[colName] as T;
      return row as T;
    } catch (err) {
      console.error('Error executing query first():', this.query, this.params, err);
      throw err;
    }
  }

  async run(): Promise<{ success: boolean; meta: any }> {
    try {
      const stmt = this.db.prepare(this.query);
      const info = stmt.run(...this.params);
      return { success: true, meta: info };
    } catch (err) {
      console.error('Error executing query run():', this.query, this.params, err);
      throw err;
    }
  }
}

// Wrap Cloudflare D1
class CloudflareD1Adapter implements DatabaseAdapter {
  private d1: any;

  constructor(d1: any) {
    this.d1 = d1;
  }

  prepare(query: string): PreparedStatement {
    const d1Stmt = this.d1.prepare(query);
    return new CloudflarePreparedStatement(d1Stmt);
  }

  async exec(query: string): Promise<void> {
    if (typeof this.d1.exec === 'function') {
      try {
        await this.d1.exec(query);
      } catch {
        await this.d1.prepare(query).run();
      }
    } else {
      await this.d1.prepare(query).run();
    }
  }

  async batch(statements: any[]): Promise<any[]> {
    return await this.d1.batch(statements.map((s: any) => s.d1Stmt || s));
  }
}

class CloudflarePreparedStatement implements PreparedStatement {
  private stmt: any;

  constructor(stmt: any) {
    this.stmt = stmt;
  }

  bind(...params: any[]): PreparedStatement {
    this.stmt = this.stmt.bind(...params.map(p => (p === undefined ? null : p)));
    return this;
  }

  async all<T = any>(): Promise<{ results: T[] }> {
    const res = await this.stmt.all();
    return { results: res.results || [] };
  }

  async first<T = any>(colName?: string): Promise<T | null> {
    return (await this.stmt.first(colName)) || null;
  }

  async run(): Promise<{ success: boolean; meta: any }> {
    const res = await this.stmt.run();
    return { success: res.success, meta: res.meta };
  }
}

// Resilient In-Memory Database Adapter used as fallback when Cloudflare env.DB binding is not yet attached
class InMemoryDatabaseAdapter implements DatabaseAdapter {
  private tables: Map<string, any[]> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    // 1. Settings
    this.tables.set('platform_settings', [
      { key: 'platform_name', value: 'Shop da Cidade' },
      { key: 'site_tagline', value: 'O Shopping Virtual da Sua Cidade' },
      { key: 'city_name', value: 'Canaã dos Carajás' },
      { key: 'city_state', value: 'PA' },
      { key: 'primary_color', value: '#fdca04' },
      { key: 'secondary_color', value: '#0f172a' },
      { key: 'accent_color', value: '#f59e0b' },
      { key: 'official_whatsapp', value: '(94) 99123-4567' },
      { key: 'official_email', value: 'atendimento@shopdacidade.com.br' },
      { key: 'default_commission_rate', value: '8.0' },
      { key: 'asaas_environment', value: 'sandbox' },
      { key: 'asaas_api_key', value: '' },
      { key: 'banner_notice', value: 'Bem-vindo ao Shop da Cidade em Canaã dos Carajás!' }
    ]);

    // 2. Product Categories
    this.tables.set('product_categories', [
      { id: 'cat_mercado', name: 'Supermercados & Mercearias', slug: 'supermercados', icon: 'ShoppingCart', sort_order: 1, is_active: 1 },
      { id: 'cat_farmacia', name: 'Farmácias & Saúde', slug: 'farmacias', icon: 'HeartPulse', sort_order: 2, is_active: 1 },
      { id: 'cat_restaurantes', name: 'Restaurantes & Lanches', slug: 'restaurantes', icon: 'Utensils', sort_order: 3, is_active: 1 },
      { id: 'cat_moda', name: 'Moda, Roupas & Calçados', slug: 'moda-e-roupas', icon: 'ShoppingBag', sort_order: 4, is_active: 1 },
      { id: 'cat_eletronicos', name: 'Eletrônicos & Celulares', slug: 'eletronicos', icon: 'Smartphone', sort_order: 5, is_active: 1 },
      { id: 'cat_construcao', name: 'Construção & Ferramentas', slug: 'construcao', icon: 'Hammer', sort_order: 6, is_active: 1 }
    ]);

    // 3. Service Categories
    this.tables.set('service_categories', [
      { id: 'scat_saude', name: 'Óticas, Clínicas & Saúde', slug: 'saude-e-oticas', icon: 'HeartPulse', sort_order: 1, is_active: 1 },
      { id: 'scat_beleza', name: 'Barbearias & Salões de Beleza', slug: 'beleza-e-estetica', icon: 'Sparkles', sort_order: 2, is_active: 1 },
      { id: 'scat_reformas', name: 'Eletricistas & Manutenção', slug: 'reformas-e-manutencao', icon: 'Wrench', sort_order: 3, is_active: 1 },
      { id: 'scat_ar', name: 'Ar-Condicionado & Climatização', slug: 'ar-condicionado', icon: 'Wind', sort_order: 4, is_active: 1 }
    ]);

    // 4. Stores
    this.tables.set('stores', [
      {
        id: 'store_super_carajas',
        user_id: 'usr_lojista_1',
        name: 'Supermercado Carajás Real',
        slug: 'supermercado-carajas-real',
        logo_url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&q=80',
        banner_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80',
        description: 'O maior mix de alimentos, bebidas, hortifrúti fresco e carnes selecionadas de Canaã dos Carajás.',
        category: 'Supermercados & Mercearias',
        phone: '(94) 3358-1200',
        whatsapp: '(94) 99122-3344',
        neighborhood: 'Centro',
        city: 'Canaã dos Carajás',
        state: 'PA',
        delivery_time_min: '40-60 min',
        delivery_fee_base: 8.0,
        free_delivery_minimum: 150.0,
        is_open: 1,
        theme_color_primary: '#059669',
        theme_color_secondary: '#064e3b',
        status: 'active',
        is_featured: 1
      },
      {
        id: 'store_otica_visao',
        user_id: 'usr_lojista_2',
        name: 'Ótica & Centro da Visão Carajás',
        slug: 'otica-visao-carajas',
        logo_url: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=400&q=80',
        banner_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1200&q=80',
        description: 'Exames de vista computadorizados, armações de grife, lentes de contato e laboratório óptico próprio.',
        category: 'Farmácias & Saúde',
        phone: '(94) 3358-2200',
        whatsapp: '(94) 99133-5566',
        neighborhood: 'Novo Horizonte',
        city: 'Canaã dos Carajás',
        state: 'PA',
        delivery_time_min: '30-45 min',
        delivery_fee_base: 6.0,
        free_delivery_minimum: 200.0,
        is_open: 1,
        theme_color_primary: '#2563eb',
        theme_color_secondary: '#1e1b4b',
        status: 'active',
        is_featured: 1
      },
      {
        id: 'store_burger_serra',
        user_id: 'usr_lojista_3',
        name: 'Serra Burguer Artesanal',
        slug: 'serra-burguer-artesanal',
        logo_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80',
        banner_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
        description: 'Hambúrgueres defumados na brasa, batata rústica crocante e molhos especiais da casa.',
        category: 'Restaurantes & Lanches',
        phone: '(94) 99188-7766',
        whatsapp: '(94) 99188-7766',
        neighborhood: 'Centro',
        city: 'Canaã dos Carajás',
        state: 'PA',
        delivery_time_min: '25-45 min',
        delivery_fee_base: 7.0,
        free_delivery_minimum: 80.0,
        is_open: 1,
        theme_color_primary: '#ea580c',
        theme_color_secondary: '#431407',
        status: 'active',
        is_featured: 1
      }
    ]);

    // 5. Products
    this.tables.set('products', [
      {
        id: 'prod_armacao_titanio',
        store_id: 'store_otica_visao',
        category_id: 'cat_farmacia',
        name: 'Armação Masculina Titânio Flex Ultraleve',
        slug: 'armacao-masculina-titanio-flex-ultraleve',
        description: 'Armação premium confeccionada em titânio aeroespacial. Super flexível e antialérgica.',
        price: 349.9,
        promotional_price: 279.9,
        stock_quantity: 15,
        image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80',
        is_active: 1,
        is_featured: 1
      },
      {
        id: 'prod_burger_monstro',
        store_id: 'store_burger_serra',
        category_id: 'cat_restaurantes',
        name: 'Combo Burger Vulcão da Serra + Batata Rústica',
        slug: 'combo-burger-vulcao-da-serra',
        description: '2x Blend bovino 160g, queijo cheddar inglês derretido, cebola caramelizada e maionese defumada.',
        price: 44.9,
        promotional_price: 37.9,
        stock_quantity: 50,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
        is_active: 1,
        is_featured: 1
      }
    ]);

    // 6. Service Providers
    this.tables.set('service_providers', [
      {
        id: 'prov_otica_exames',
        user_id: 'usr_lojista_2',
        business_name: 'Dr. Roberto Lins - Exames de Vista & Acuidade Visual',
        slug: 'dr-roberto-lins-exames-de-vista',
        photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80',
        category_id: 'scat_saude',
        specialty: 'Optometria Clínica, Medição de Grau e Testes de Refração',
        description: 'Atendimento humanizado com equipamentos digitais de última geração. Agende online e faça seus exames.',
        phone: '(94) 3358-2200',
        whatsapp: '(94) 99133-5566',
        neighborhoods_json: JSON.stringify(['Centro', 'Novo Horizonte', 'Parque dos Ipês', 'Vale Canaã']),
        starting_price: 120.0,
        rating_average: 4.9,
        total_reviews: 42,
        is_approved: 1,
        is_featured: 1
      }
    ]);

    // 7. Promotional Banners
    this.tables.set('promotional_banners', [
      {
        id: 'ban_1',
        title: 'Compre no Comércio de Canaã dos Carajás',
        subtitle: 'Lojas e restaurantes locais com entrega rápida e pagamento online via Pix Asaas',
        image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1600&q=80',
        link_url: '/lojas',
        is_active: 1,
        position: 1
      },
      {
        id: 'ban_2',
        title: 'Óticas e Serviços Especializados',
        subtitle: 'Agende exames de vista, consultas e tratamentos estéticos pelo aplicativo',
        image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1600&q=80',
        link_url: '/servicos',
        is_active: 1,
        position: 2
      }
    ]);

    // 8. Subscription Plans
    this.tables.set('subscription_plans', [
      {
        id: 'plan_store_free',
        name: 'Lojista Inicial',
        target_audience: 'lojista',
        price: 0,
        billing_period: 'free',
        product_limit: 25,
        features_json: JSON.stringify(['Até 25 produtos ativos', 'Catálogo digital', 'Comissão padrão'])
      },
      {
        id: 'plan_store_pro',
        name: 'Lojista Pro Canaã',
        target_audience: 'lojista',
        price: 79.9,
        billing_period: 'monthly',
        product_limit: 250,
        features_json: JSON.stringify(['Até 250 produtos', 'Comissão reduzida', 'Selo Oficial'])
      }
    ]);

    // 9. Users
    this.tables.set('users', [
      {
        id: 'usr_admin_1',
        name: 'Administrador Shop da Cidade',
        email: 'admin@shopcarajas.com.br',
        password_hash: '78552bef20048edb3a63905a4adfa1908f7c3ccc4b6fe4af83a87d2a8849e751',
        salt: 's_seed_1',
        role: 'superadmin',
        is_active: 1
      },
      {
        id: 'usr_admin_2',
        name: 'Administrador Shop da Cidade',
        email: 'admin@shopdacidade.com.br',
        password_hash: '78552bef20048edb3a63905a4adfa1908f7c3ccc4b6fe4af83a87d2a8849e751',
        salt: 's_seed_1',
        role: 'superadmin',
        is_active: 1
      },
      {
        id: 'usr_lojista_demo',
        name: 'João Pedro da Silva',
        email: 'lojista@shopcarajas.com.br',
        password_hash: '78552bef20048edb3a63905a4adfa1908f7c3ccc4b6fe4af83a87d2a8849e751',
        salt: 's_seed_1',
        role: 'lojista',
        is_active: 1
      }
    ]);
  }

  prepare(query: string): PreparedStatement {
    return new InMemoryPreparedStatement(this.tables, query);
  }

  async exec(_query: string): Promise<void> {
    // No-op for resilient memory fallback
  }

  async batch(statements: any[]): Promise<any[]> {
    const results = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return results;
  }
}

class InMemoryPreparedStatement implements PreparedStatement {
  private tables: Map<string, any[]>;
  private query: string;
  private params: any[] = [];

  constructor(tables: Map<string, any[]>, query: string) {
    this.tables = tables;
    this.query = query;
  }

  bind(...params: any[]): PreparedStatement {
    this.params = params;
    return this;
  }

  private getTargetTable(): string {
    // Explicit primary table matching to avoid nested subquery false positives
    if (/\bFROM\s+stores\b/i.test(this.query) || /\b(?:INTO|UPDATE)\s+stores\b/i.test(this.query)) return 'stores';
    if (/\bFROM\s+products\b/i.test(this.query) || /\b(?:INTO|UPDATE)\s+products\b/i.test(this.query)) return 'products';
    if (/\bFROM\s+service_providers\b/i.test(this.query) || /\b(?:INTO|UPDATE)\s+service_providers\b/i.test(this.query)) return 'service_providers';
    if (/\bFROM\s+promotional_banners\b/i.test(this.query) || /\b(?:INTO|UPDATE)\s+promotional_banners\b/i.test(this.query)) return 'promotional_banners';
    if (/\bFROM\s+platform_settings\b/i.test(this.query) || /\b(?:INTO|UPDATE)\s+platform_settings\b/i.test(this.query)) return 'platform_settings';
    if (/\bFROM\s+subscription_plans\b/i.test(this.query) || /\b(?:INTO|UPDATE)\s+subscription_plans\b/i.test(this.query)) return 'subscription_plans';
    if (/\bFROM\s+sessions\b/i.test(this.query) || /\b(?:INTO|UPDATE)\s+sessions\b/i.test(this.query)) return 'sessions';
    if (/\bFROM\s+users\b/i.test(this.query) || /\b(?:INTO|UPDATE)\s+users\b/i.test(this.query)) return 'users';
    if (/\bFROM\s+couriers\b/i.test(this.query) || /\b(?:INTO|UPDATE)\s+couriers\b/i.test(this.query)) return 'couriers';
    if (/\bFROM\s+orders\b/i.test(this.query) || /\b(?:INTO|UPDATE)\s+orders\b/i.test(this.query)) return 'orders';
    if (/\bFROM\s+local_ads\b/i.test(this.query) || /\b(?:INTO|UPDATE)\s+local_ads\b/i.test(this.query)) return 'local_ads';
    if (/\bFROM\s+product_categories\b/i.test(this.query)) return 'product_categories';
    if (/\bFROM\s+service_categories\b/i.test(this.query)) return 'service_categories';

    const match = this.query.match(/(?:FROM|INTO|UPDATE)\s+([a-zA-Z0-9_]+)/i);
    return match ? match[1].toLowerCase() : '';
  }

  async all<T = any>(): Promise<{ results: T[] }> {
    const tbl = this.getTargetTable();
    const rows = (this.tables.get(tbl) || []) as T[];
    return { results: rows };
  }

  async first<T = any>(_colName?: string): Promise<T | null> {
    const tbl = this.getTargetTable();
    if (tbl === 'sessions' && this.params.length > 0) {
      const token = this.params[0];
      const sessions = this.tables.get('sessions') || [];
      const sess = sessions.find((s: any) => s.token === token);
      if (!sess) return null;
      const users = this.tables.get('users') || [];
      const usr = users.find((u: any) => u.id === sess.user_id) || users[0];
      return { ...usr, user_id: sess.user_id, token: sess.token } as T;
    }
    const res = await this.all<T>();
    return res.results.length > 0 ? res.results[0] : null;
  }

  async run(): Promise<{ success: boolean; meta: any }> {
    const tbl = this.getTargetTable();

    // Persist settings in memory so color changes and name changes persist
    if (tbl === 'platform_settings' && this.params.length >= 2) {
      const key = this.params[0];
      const value = String(this.params[1]);
      const list = this.tables.get('platform_settings') || [];
      const idx = list.findIndex((row: any) => row.key === key);
      if (idx !== -1) {
        list[idx].value = value;
      } else {
        list.push({ key, value });
      }
      this.tables.set('platform_settings', list);
    }

    // Persist sessions in memory
    if (tbl === 'sessions' && this.params.length >= 4) {
      const [sessionId, userId, token, expiresAt] = this.params;
      const list = this.tables.get('sessions') || [];
      list.push({ id: sessionId, user_id: userId, token, expires_at: expiresAt });
      this.tables.set('sessions', list);
    }

    // Persist store updates in memory
    if (tbl === 'stores' && /UPDATE/i.test(this.query)) {
      const stores = this.tables.get('stores') || [];
      if (stores.length > 0) {
        const storeId = this.params[this.params.length - 1];
        const idx = stores.findIndex((s: any) => s.id === storeId || stores.length === 1);
        if (idx !== -1) {
          const s = { ...stores[idx] };
          if (this.params[0]) s.name = this.params[0];
          if (this.params[1]) s.slug = this.params[1];
          if (this.params[2]) s.description = this.params[2];
          if (this.params[3]) s.phone = this.params[3];
          if (this.params[4]) s.whatsapp = this.params[4];
          if (this.params[5]) s.instagram = this.params[5];
          if (this.params[6]) s.street = this.params[6];
          if (this.params[7]) s.number = this.params[7];
          if (this.params[8]) s.neighborhood = this.params[8];
          if (this.params[9] !== null && this.params[9] !== undefined) s.is_open = this.params[9];
          if (this.params[12] !== null && this.params[12] !== undefined) s.delivery_fee_base = Number(this.params[12]);
          if (this.params[13]) s.delivery_time_min = this.params[13];
          if (this.params[14] !== null && this.params[14] !== undefined) s.free_delivery_minimum = Number(this.params[14]);
          if (this.params[15]) s.logo_url = this.params[15];
          if (this.params[16]) s.banner_url = this.params[16];
          if (this.params[17]) s.theme_color_primary = this.params[17];
          if (this.params[18]) s.theme_color_secondary = this.params[18];
          if (this.params[19]) s.custom_announcement = this.params[19];
          stores[idx] = s;
          this.tables.set('stores', stores);
        }
      }
    }

    return { success: true, meta: { changes: 1 } };
  }
}

let globalDb: DatabaseAdapter | null = null;
let fallbackMemoryDb: DatabaseAdapter | null = null;

export function setGlobalDb(adapter: DatabaseAdapter) {
  globalDb = adapter;
}

export function getDb(env?: any): DatabaseAdapter {
  if (env) {
    const d1Binding = env.DB || env.db || env.shop_cidade_db || env.D1 || env.DATABASE;
    if (d1Binding && typeof d1Binding.prepare === 'function') {
      return new CloudflareD1Adapter(d1Binding);
    }
  }
  if (globalDb) {
    return globalDb;
  }
  // Safe in-memory fallback prevents Error 1101 / 500 when Cloudflare Pages D1 binding is pending
  if (!fallbackMemoryDb) {
    console.warn('[Shop da Cidade] D1 database binding not detected in Cloudflare environment. Using resilient in-memory fallback.');
    fallbackMemoryDb = new InMemoryDatabaseAdapter();
  }
  return fallbackMemoryDb;
}

export function createNodeSqliteAdapter(nodeDbInstance: any): DatabaseAdapter {
  return new NodeSqliteAdapter(nodeDbInstance);
}

