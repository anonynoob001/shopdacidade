// Shop da Cidade - Cloudflare D1 Database Integration & Management Service

const STORAGE_KEY_CF_ACCOUNT = 'shop_cidade_cf_account_id';
const STORAGE_KEY_D1_ID = 'shop_cidade_d1_database_id';
const STORAGE_KEY_D1_NAME = 'shop_cidade_d1_database_name';

export interface CloudflareD1Config {
  databaseName: string;
  databaseId: string;
  accountId: string;
  binding: string;
}

export function getSavedCloudflareD1Config(): CloudflareD1Config {
  const storedAccount = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_CF_ACCOUNT) || '' : '';
  const storedId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_D1_ID) || '' : '';
  const storedName = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_D1_NAME) || 'shop_cidade_db' : 'shop_cidade_db';

  return {
    databaseName: storedName,
    databaseId: storedId,
    accountId: storedAccount,
    binding: 'DB'
  };
}

export function saveCloudflareD1Config(config: Partial<CloudflareD1Config>): void {
  if (typeof window !== 'undefined') {
    if (config.databaseName) localStorage.setItem(STORAGE_KEY_D1_NAME, config.databaseName.trim());
    if (config.databaseId) localStorage.setItem(STORAGE_KEY_D1_ID, config.databaseId.trim());
    if (config.accountId) localStorage.setItem(STORAGE_KEY_CF_ACCOUNT, config.accountId.trim());
  }
}

/**
 * Returns formatted Wrangler CLI commands for Cloudflare D1 deployment
 */
export function getD1CliCommands(databaseName: string = 'shop_cidade_db'): {
  create: string;
  applyMigrationRemote: string;
  applyMigrationLocal: string;
  exportDatabase: string;
  executeSqlRemote: string;
} {
  return {
    create: `npx wrangler d1 create ${databaseName}`,
    applyMigrationRemote: `npx wrangler d1 migrations apply ${databaseName} --remote`,
    applyMigrationLocal: `npx wrangler d1 migrations apply ${databaseName} --local`,
    exportDatabase: `npx wrangler d1 export ${databaseName} --remote --output=./backup_shop_cidade.sql`,
    executeSqlRemote: `npx wrangler d1 execute ${databaseName} --remote --command="SELECT COUNT(*) FROM stores;"`
  };
}

/**
 * Cloudflare D1 wrangler configuration snippet
 */
export function getWranglerD1ConfigSnippet(databaseName: string, databaseId: string): string {
  return `  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "${databaseName || 'shop_cidade_db'}",
      "database_id": "${databaseId || '00000000-0000-0000-0000-000000000000'}",
      "migrations_dir": "migrations"
    }
  ]`;
}

export function getCloudflareD1SchemaSQL(): string {
  return `-- ==============================================================================
-- SHOP DA CIDADE - SCHEMA PARA BANCO DE DADOS CLOUDFLARE D1 (SQLITE NA EDGE)
-- Arquivo: migrations/0001_initial_schema.sql
-- ==============================================================================

-- 1. Usuários da Plataforma
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'cliente', -- cliente, lojista, prestador, entregador, admin, superadmin
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Endereços de Usuários
CREATE TABLE IF NOT EXISTS user_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Principal',
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Canaã dos Carajás',
  state TEXT NOT NULL DEFAULT 'PA',
  zip_code TEXT NOT NULL DEFAULT '68537-000',
  reference_point TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Sessões de Autenticação
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Planos de Assinatura
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  product_limit INTEGER NOT NULL DEFAULT 20,
  highlight_included INTEGER NOT NULL DEFAULT 0,
  commission_discount_percent REAL NOT NULL DEFAULT 0,
  description TEXT,
  features_json TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Lojas do Marketplace (com personalização de cores e URL própria)
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

-- 6. Categorias de Produtos
CREATE TABLE IF NOT EXISTS product_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Produtos
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  category_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  promotional_price REAL,
  cost_price REAL,
  sku TEXT,
  images_json TEXT NOT NULL DEFAULT '[]',
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  track_stock INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'un',
  is_active INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL
);

-- 8. Entregadores
CREATE TABLE IF NOT EXISTS couriers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'moto',
  vehicle_plate TEXT,
  is_available INTEGER NOT NULL DEFAULT 1,
  is_approved INTEGER NOT NULL DEFAULT 0,
  current_location_neighborhood TEXT,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  rating_average REAL NOT NULL DEFAULT 5.0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Pedidos (Multi-store com split PIX)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_code TEXT UNIQUE NOT NULL,
  user_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address_json TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  subtotal_amount REAL NOT NULL,
  total_delivery_fee REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL,
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 10. Sub-pedidos por Loja
CREATE TABLE IF NOT EXISTS sub_orders (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  store_subtotal REAL NOT NULL,
  delivery_fee REAL NOT NULL DEFAULT 0,
  commission_rate REAL NOT NULL DEFAULT 8.0,
  commission_amount REAL NOT NULL DEFAULT 0,
  store_net_amount REAL NOT NULL,
  delivery_type TEXT NOT NULL DEFAULT 'delivery',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- 11. Itens do Pedido
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  sub_order_id TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  product_price REAL NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_item_price REAL NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (sub_order_id) REFERENCES sub_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 12. Configurações da Plataforma
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices essenciais para máxima velocidade
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_sub_orders_store_id ON sub_orders(store_id);
`;
}

