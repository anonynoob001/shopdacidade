// Shop da Cidade - Cloudflare D1 & Cloudflare Ecosystem Integration
import { apiRequest } from './api';

export interface CloudflareConfig {
  databaseId: string;
  databaseName: string;
  accountId: string;
  apiToken: string;
  r2Bucket: string;
  environment: string;
}

const STORAGE_KEY_CONFIG = 'shop_cidade_cloudflare_config';

export function getSavedCloudflareConfig(): CloudflareConfig {
  const envDbId = (import.meta as any).env?.VITE_CLOUDFLARE_D1_ID || '';
  const envDbName = (import.meta as any).env?.VITE_CLOUDFLARE_D1_NAME || 'shop_cidade_db';
  const envAccountId = (import.meta as any).env?.VITE_CLOUDFLARE_ACCOUNT_ID || '';
  const envR2 = (import.meta as any).env?.VITE_CLOUDFLARE_R2_BUCKET || 'shop-cidade-media';

  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        databaseId: parsed.databaseId || envDbId,
        databaseName: parsed.databaseName || envDbName,
        accountId: parsed.accountId || envAccountId,
        apiToken: parsed.apiToken || '',
        r2Bucket: parsed.r2Bucket || envR2,
        environment: parsed.environment || 'production'
      };
    }
  } catch (e) {
    // ignore
  }

  return {
    databaseId: envDbId,
    databaseName: envDbName,
    accountId: envAccountId,
    apiToken: '',
    r2Bucket: envR2,
    environment: 'production'
  };
}

export function saveCloudflareConfig(config: Partial<CloudflareConfig>): void {
  try {
    const current = getSavedCloudflareConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save Cloudflare config:', e);
  }
}

export interface TableStat {
  name: string;
  count: number;
}

export interface DatabaseStatsResponse {
  engine: string;
  status: 'connected' | 'error';
  tables: TableStat[];
  totalRecords: number;
  latencyMs: number;
  environment: string;
  databaseName: string;
  d1Binding: string;
}

export async function fetchDatabaseStats(): Promise<DatabaseStatsResponse> {
  const start = performance.now();
  const res = await apiRequest<{
    success: boolean;
    engine: string;
    tables: TableStat[];
    totalRecords: number;
    databaseName?: string;
    d1Binding?: string;
  }>('/api/admin/database/stats');

  const latencyMs = Math.round(performance.now() - start);

  return {
    engine: res.engine || 'Cloudflare D1 (SQLite Engine)',
    status: 'connected',
    tables: res.tables || [],
    totalRecords: res.totalRecords || 0,
    latencyMs,
    environment: 'production / edge',
    databaseName: res.databaseName || 'shop_cidade_db',
    d1Binding: res.d1Binding || 'DB'
  };
}

export async function executeD1Query(query: string): Promise<{
  success: boolean;
  columns: string[];
  rows: any[];
  rowCount: number;
  latencyMs: number;
  error?: string;
}> {
  const res = await apiRequest<{
    success: boolean;
    columns: string[];
    rows: any[];
    rowCount: number;
    latencyMs: number;
    error?: string;
  }>('/api/admin/database/query', {
    method: 'POST',
    body: JSON.stringify({ query })
  });

  return res;
}

export function getCloudflareWranglerCommands(config: CloudflareConfig): {
  createDb: string;
  applyMigrations: string;
  testQuery: string;
  deploy: string;
  r2Create: string;
} {
  const dbName = config.databaseName || 'shop_cidade_db';
  const bucketName = config.r2Bucket || 'shop-cidade-media';

  return {
    createDb: `npx wrangler d1 create ${dbName}`,
    applyMigrations: `npx wrangler d1 migrations apply ${dbName} --remote`,
    testQuery: `npx wrangler d1 execute ${dbName} --remote --command "SELECT count(*) FROM stores"`,
    deploy: `npm run build && npx wrangler deploy`,
    r2Create: `npx wrangler r2 bucket create ${bucketName}`
  };
}

export function getCloudflareD1SchemaSQL(): string {
  return `-- SHOP DA CIDADE - SCHEMA COMPLETO PARA CLOUDFLARE D1 (SQLITE DISTRIBUÍDO)
-- Executável diretamente via Wrangler:
--   npx wrangler d1 execute shop_cidade_db --remote --file=./migrations/0001_initial_schema.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'cliente',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price REAL NOT NULL,
  interval TEXT NOT NULL DEFAULT 'monthly',
  max_products INTEGER NOT NULL DEFAULT 50,
  commission_discount_percent REAL NOT NULL DEFAULT 0,
  description TEXT,
  features_json TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  category TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  street TEXT,
  number TEXT,
  neighborhood TEXT NOT NULL DEFAULT 'Centro',
  city TEXT NOT NULL DEFAULT 'Canaã dos Carajás',
  state TEXT NOT NULL DEFAULT 'PA',
  zip_code TEXT NOT NULL DEFAULT '68537-000',
  opening_hours_json TEXT,
  is_open INTEGER NOT NULL DEFAULT 1,
  accepts_pickup INTEGER NOT NULL DEFAULT 1,
  accepts_delivery INTEGER NOT NULL DEFAULT 1,
  delivery_fee_base REAL NOT NULL DEFAULT 7.00,
  delivery_time_min TEXT NOT NULL DEFAULT '30-50 min',
  free_delivery_minimum REAL DEFAULT 150.00,
  plan_id TEXT,
  commission_rate_override REAL,
  theme_color_primary TEXT DEFAULT '#fdca04',
  theme_color_secondary TEXT DEFAULT '#0f172a',
  custom_announcement TEXT,
  instagram TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_featured INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

CREATE TABLE IF NOT EXISTS product_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  category_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  original_price REAL,
  cost_price REAL,
  stock_quantity INTEGER NOT NULL DEFAULT 10,
  sku TEXT,
  barcode TEXT,
  image_url TEXT,
  is_available INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES product_categories(id)
);

CREATE TABLE IF NOT EXISTS service_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS service_providers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_id TEXT NOT NULL,
  headline TEXT,
  description TEXT,
  phone TEXT,
  whatsapp TEXT,
  coverage_area TEXT NOT NULL DEFAULT 'Toda a Cidade',
  avatar_url TEXT,
  banner_url TEXT,
  is_approved INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES service_categories(id)
);

CREATE TABLE IF NOT EXISTS service_items (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_price REAL,
  price_type TEXT NOT NULL DEFAULT 'quote',
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quote_requests (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  service_item_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  preferred_date TEXT,
  location_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  customer_phone TEXT,
  budget_estimate REAL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_schedules (
  id TEXT PRIMARY KEY,
  quote_id TEXT,
  customer_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS couriers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'moto',
  vehicle_plate TEXT,
  document_cnh TEXT,
  pix_key TEXT,
  is_available INTEGER NOT NULL DEFAULT 1,
  is_approved INTEGER NOT NULL DEFAULT 1,
  current_lat REAL,
  current_lng REAL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_code TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  delivery_address_street TEXT NOT NULL,
  delivery_address_number TEXT NOT NULL,
  delivery_address_neighborhood TEXT NOT NULL,
  delivery_address_city TEXT NOT NULL DEFAULT 'Canaã dos Carajás',
  delivery_address_state TEXT NOT NULL DEFAULT 'PA',
  delivery_address_zip TEXT,
  delivery_address_complement TEXT,
  delivery_type TEXT NOT NULL DEFAULT 'delivery',
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  pix_code TEXT,
  pix_qr_code_url TEXT,
  subtotal REAL NOT NULL,
  total_delivery_fee REAL NOT NULL,
  total_discount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sub_orders (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  subtotal REAL NOT NULL,
  delivery_fee REAL NOT NULL DEFAULT 0,
  commission_rate REAL NOT NULL DEFAULT 0.08,
  commission_amount REAL NOT NULL DEFAULT 0,
  net_merchant_amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  sub_order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  unit_price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  total_price REAL NOT NULL,
  notes TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (sub_order_id) REFERENCES sub_orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS delivery_assignments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  sub_order_id TEXT NOT NULL,
  courier_id TEXT,
  status TEXT NOT NULL DEFAULT 'searching',
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_fee REAL NOT NULL,
  courier_payout REAL NOT NULL,
  accepted_at DATETIME,
  picked_up_at DATETIME,
  delivered_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotional_banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  target_type TEXT NOT NULL DEFAULT 'store',
  position INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details_json TEXT,
  ip_address TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read INTEGER NOT NULL DEFAULT 0,
  link_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_store ON sub_orders(store_id);
`;
}
