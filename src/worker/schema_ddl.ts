// Cloudflare D1 / SQLite Universal Auto-DDL
export const INITIAL_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'cliente',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  additional_images_json TEXT,
  sku TEXT,
  price REAL NOT NULL,
  promotional_price REAL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  variations_json TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  weight_kg REAL DEFAULT 0.5,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES product_categories(id)
);

CREATE TABLE IF NOT EXISTS couriers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL DEFAULT 'moto',
  license_plate TEXT,
  document_number TEXT,
  is_available INTEGER NOT NULL DEFAULT 1,
  is_approved INTEGER NOT NULL DEFAULT 1,
  current_location_name TEXT DEFAULT 'Centro',
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  balance REAL NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_code TEXT UNIQUE NOT NULL,
  user_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_type TEXT NOT NULL DEFAULT 'delivery',
  shipping_address_json TEXT,
  payment_method TEXT NOT NULL DEFAULT 'pix',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  pix_code TEXT,
  pix_qr_base64 TEXT,
  total_items REAL NOT NULL DEFAULT 0,
  total_delivery_fee REAL NOT NULL DEFAULT 0,
  total_discount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sub_orders (
  id TEXT PRIMARY KEY,
  sub_order_code TEXT UNIQUE NOT NULL,
  order_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  delivery_model TEXT NOT NULL DEFAULT 'store_delivery',
  store_subtotal REAL NOT NULL DEFAULT 0,
  delivery_fee REAL NOT NULL DEFAULT 0,
  commission_rate REAL NOT NULL DEFAULT 8.0,
  commission_amount REAL NOT NULL DEFAULT 0,
  store_net_amount REAL NOT NULL DEFAULT 0,
  courier_id TEXT,
  courier_fee REAL NOT NULL DEFAULT 0,
  tracking_notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT,
  FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  sub_order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  product_sku TEXT,
  unit_price REAL NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal REAL NOT NULL,
  selected_variation TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sub_order_id) REFERENCES sub_orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY,
  sub_order_id TEXT NOT NULL UNIQUE,
  courier_id TEXT,
  status TEXT NOT NULL DEFAULT 'waiting_courier',
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_fee REAL NOT NULL DEFAULT 10.0,
  courier_earnings REAL NOT NULL DEFAULT 8.0,
  platform_fee REAL NOT NULL DEFAULT 2.0,
  customer_contact TEXT NOT NULL,
  pickup_time DATETIME,
  delivered_time DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sub_order_id) REFERENCES sub_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS service_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS service_providers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  photo_url TEXT,
  category_id TEXT NOT NULL,
  specialty TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  whatsapp TEXT,
  neighborhoods_json TEXT,
  starting_price REAL DEFAULT 0,
  availability_status TEXT NOT NULL DEFAULT 'available',
  is_approved INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  portfolio_json TEXT,
  rating_average REAL NOT NULL DEFAULT 5.0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES service_categories(id)
);

CREATE TABLE IF NOT EXISTS quote_requests (
  id TEXT PRIMARY KEY,
  quote_code TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  service_title TEXT NOT NULL,
  description TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  preferred_date TEXT,
  urgency TEXT NOT NULL DEFAULT 'media',
  photos_json TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quote_proposals (
  id TEXT PRIMARY KEY,
  quote_request_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  proposal_text TEXT NOT NULL,
  estimated_price REAL NOT NULL,
  materials_included INTEGER NOT NULL DEFAULT 0,
  estimated_days INTEGER NOT NULL DEFAULT 1,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_request_id) REFERENCES quote_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS service_schedules (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  service_name TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  scheduled_time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  order_or_service_id TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified INTEGER NOT NULL DEFAULT 1,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

CREATE TABLE IF NOT EXISTS promotional_banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  target_type TEXT NOT NULL DEFAULT 'store',
  position INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  start_date DATE,
  end_date DATE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sponsored_highlights (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  title TEXT NOT NULL,
  badge_label TEXT DEFAULT 'Patrocinado',
  starts_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_ads (
  id TEXT PRIMARY KEY,
  advertiser_name TEXT NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  click_url TEXT,
  impressions_count INTEGER NOT NULL DEFAULT 0,
  clicks_count INTEGER NOT NULL DEFAULT 0,
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
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details_json TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_sub_orders_order ON sub_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_store ON sub_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_status ON sub_orders(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_courier ON deliveries(courier_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_provider ON quote_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_user ON quote_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_schedules_provider ON service_schedules(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
`;
