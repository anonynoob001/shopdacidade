PRAGMA foreign_keys = OFF;
-- Migration 0001: Initial schema for Shop Carajás (Cloudflare D1 SQLite & local SQLite)

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

CREATE TABLE IF NOT EXISTS user_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Principal', -- Casa, Trabalho, etc.
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
  target_audience TEXT NOT NULL, -- lojista, prestador
  price REAL NOT NULL DEFAULT 0,
  billing_period TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly, free
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
  status TEXT NOT NULL DEFAULT 'active', -- pending, active, suspended
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
  vehicle_type TEXT NOT NULL DEFAULT 'moto', -- moto, bicicleta, carro
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
  delivery_type TEXT NOT NULL DEFAULT 'delivery', -- delivery, pickup
  shipping_address_json TEXT,
  payment_method TEXT NOT NULL DEFAULT 'pix', -- pix, delivery_cash, delivery_card, credit_card
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, failed, refunded
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
  status TEXT NOT NULL DEFAULT 'pending', -- pending, preparing, ready_for_pickup, out_for_delivery, delivered, cancelled
  delivery_model TEXT NOT NULL DEFAULT 'store_delivery', -- store_delivery, platform_courier, pickup
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
  status TEXT NOT NULL DEFAULT 'waiting_courier', -- waiting_courier, offered, accepted, heading_to_store, picked_up, in_transit, delivered, cancelled
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
  neighborhoods_json TEXT, -- array of covered neighborhoods
  starting_price REAL DEFAULT 0,
  availability_status TEXT NOT NULL DEFAULT 'available', -- available, busy, away
  is_approved INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  portfolio_json TEXT, -- array of photo items
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
  urgency TEXT NOT NULL DEFAULT 'media', -- baixa, media, alta, urgente
  photos_json TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, answered, accepted, rejected, expired
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
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
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
  scheduled_date TEXT NOT NULL, -- YYYY-MM-DD
  scheduled_time_slot TEXT NOT NULL, -- 09:00, 14:00, etc.
  status TEXT NOT NULL DEFAULT 'requested', -- requested, confirmed, completed, cancelled
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_type TEXT NOT NULL, -- store, provider
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
  target_id TEXT NOT NULL, -- store_id or provider_id
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, past_due, canceled
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
  target_type TEXT NOT NULL, -- store, provider, product
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

-- Indices for high performance
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


-- ==========================================
-- SEED DATA (Shop da Cidade - Canaã dos Carajás, PA)
-- ==========================================

INSERT OR IGNORE INTO platform_settings (key, value) VALUES
('platform_name', 'Shop da Cidade'),
('site_tagline', 'O Shopping Virtual da Sua Cidade'),
('city_name', 'Canaã dos Carajás'),
('city_state', 'PA'),
('primary_color', '#fdca04'),
('secondary_color', '#0f172a'),
('accent_color', '#f59e0b'),
('official_whatsapp', '(94) 99123-4567'),
('official_email', 'atendimento@shopdacidade.com.br'),
('default_commission_rate', '8.0'),
('pix_key', 'financeiro@shopdacidade.com.br'),
('pix_key_type', 'email'),
('pix_beneficiary', 'SHOP DA CIDADE LTDA'),
('pix_city', 'CANAA DOS CARAJAS'),
('free_delivery_active', '1'),
('courier_base_fee', '8.00'),
('asaas_environment', 'sandbox'),
('asaas_api_key', ''),
('banner_notice', 'Bem-vindo ao Shop da Cidade em Canaã dos Carajás! Conectando você ao comércio e serviços da nossa terra.');

INSERT OR IGNORE INTO subscription_plans (id, name, target_audience, price, billing_period, product_limit, highlight_included, commission_discount_percent, description, features_json) VALUES
('plan_store_free', 'Lojista Inicial', 'lojista', 0, 'free', 25, 0, 0, 'Ideal para pequenos comércios e lojas iniciando as vendas online em Canaã.', '["Até 25 produtos ativos","Receba pedidos com entrega e retirada","Painel de vendas completo","Comissão padrão de 8%"]'),
('plan_store_pro', 'Lojista Pro Canaã', 'lojista', 79.90, 'monthly', 250, 1, 3.0, 'Para lojas consolidadas com alto volume de vendas e destaque na plataforma.', '["Até 250 produtos cadastrados","Comissão reduzida de 5%","Selo de Loja Oficial","Destaque prioritário na página inicial","Suporte WhatsApp dedicado"]'),
('plan_pro_free', 'Profissional Autônomo', 'prestador', 0, 'free', 5, 0, 0, 'Receba pedidos de orçamento e clientes de toda a cidade sem mensalidade.', '["Perfil público com WhatsApp","Receba até 15 orçamentos por mês","Agenda básica","Avaliações de clientes"]'),
('plan_pro_vip', 'Prestador VIP & Destaque', 'prestador', 49.90, 'monthly', 20, 1, 0, 'Para profissionais e empresas que desejam máxima visibilidade e clientes diários.', '["Destaque no topo da categoria","Orçamentos ilimitados","Galeria de fotos de obras/serviços","Selo Profissional Verificado","Agendamento online direto"]');

INSERT OR IGNORE INTO product_categories (id, name, slug, icon, sort_order) VALUES
('cat_construcao', 'Construção & Reforma', 'construcao-e-reforma', 'Hammer', 1),
('cat_supermercado', 'Supermercado & Bebidas', 'supermercado-e-bebidas', 'ShoppingCart', 2),
('cat_eletronicos', 'Eletrônicos & Informática', 'eletronicos-e-informatica', 'Smartphone', 3),
('cat_moda', 'Moda & Calçados', 'moda-e-calcados', 'Shirt', 4),
('cat_casa', 'Casa, Decoração & Móveis', 'casa-decoracao', 'Home', 5),
('cat_farmacia', 'Farmácia & Beleza', 'farmacia-e-beleza', 'HeartPulse', 6),
('cat_auto', 'Auto & Moto Peças', 'auto-moto', 'Car', 7),
('cat_pet', 'Pet Shop & Agro', 'pet-shop-agro', 'PawPrint', 8);

INSERT OR IGNORE INTO service_categories (id, name, slug, icon, description, sort_order) VALUES
('scat_saude', 'Óticas, Clínicas & Saúde', 'saude-e-oticas', 'HeartPulse', 'Exames de vista, óculos de grau, consultas odontológicas e exames laboratoriais.', 1),
('scat_climatizacao', 'Climatização & Ar-Condicionado', 'climatizacao-ar-condicionado', 'Wind', 'Instalação, limpeza e conserto de ar condicionado split em Canaã.', 2),
('scat_eletrica', 'Eletricista Residencial & Padrão', 'eletricista-residencial', 'Zap', 'Instalações elétricas, quadros de energia e padrão Equatorial.', 3),
('scat_beleza', 'Barbearias & Salões de Beleza', 'beleza-e-estetica', 'Sparkles', 'Cortes modernos, barboterapia, manicure, pedicure e estética facial.', 4),
('scat_hidraulica', 'Encanador & Hidráulica', 'encanador-hidraulica', 'Wrench', 'Conserto de vazamentos, bombas d’água e instalações hidráulicas.', 5),
('scat_obras', 'Pedreiros, Pintores & Reformas', 'pedreiros-pintores-reformas', 'Paintbrush', 'Construção, assentamento de pisos, porcelanato e pintura geral.', 6),
('scat_limpeza', 'Diaristas, Faxina & Pós-Obra', 'diaristas-faxina', 'Sparkles', 'Profissionais de limpeza residencial, comercial e pós-obra.', 7);

-- Users (Senhas criptografadas com hash sha256 salt - senha padrão '123456')
INSERT OR IGNORE INTO users (id, name, email, password_hash, salt, phone, role, is_active) VALUES
('usr_superadmin', 'Administrador Shop da Cidade', 'admin@shopcarajas.com.br', 'e6378e9f565ecfa74f4b23d9faaf2f122e1329bf927de0d65b7410eb8a61476d', 's_seed_1', '(94) 99100-0001', 'superadmin', 1),
('usr_cliente', 'Mariana Silva Santos', 'cliente@shopcarajas.com.br', 'e6378e9f565ecfa74f4b23d9faaf2f122e1329bf927de0d65b7410eb8a61476d', 's_seed_1', '(94) 99200-0002', 'cliente', 1),
('usr_lojista', 'João Pedro da Silva', 'lojista@shopcarajas.com.br', 'e6378e9f565ecfa74f4b23d9faaf2f122e1329bf927de0d65b7410eb8a61476d', 's_seed_1', '(94) 99300-0003', 'lojista', 1),
('usr_prestador', 'Dr. Roberto Moura', 'prestador@shopcarajas.com.br', 'e6378e9f565ecfa74f4b23d9faaf2f122e1329bf927de0d65b7410eb8a61476d', 's_seed_1', '(94) 99400-0004', 'prestador', 1),
('usr_entregador', 'Carlos Oliveira', 'entregador@shopcarajas.com.br', 'e6378e9f565ecfa74f4b23d9faaf2f122e1329bf927de0d65b7410eb8a61476d', 's_seed_1', '(94) 99500-0005', 'entregador', 1);

INSERT OR IGNORE INTO user_addresses (id, user_id, label, street, number, complement, neighborhood, city, state, zip_code, reference_point, is_default) VALUES
('addr_demo_1', 'usr_cliente', 'Minha Residência', 'Rua das Palmeiras', '142', 'Apto 102', 'Novo Horizonte', 'Canaã dos Carajás', 'PA', '68537-000', 'Próximo à Praça da Bíblia', 1);

INSERT OR IGNORE INTO stores (id, user_id, name, slug, logo_url, banner_url, description, category, phone, whatsapp, street, number, neighborhood, delivery_fee_base, delivery_time_min, free_delivery_minimum, plan_id, status, is_featured, theme_color_primary, theme_color_secondary) VALUES
('store_construcao', 'usr_lojista', 'Carajás Materiais de Construção', 'carajas-construcao', 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=300&h=300&fit=crop&q=80', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=400&fit=crop&q=80', 'Do alicerce ao acabamento: cimento, pisos, ferramentas, tintas e materiais elétricos com entrega rápida em Canaã.', 'Construção & Reforma', '(94) 3358-1234', '(94) 99123-4455', 'Av. Weyne Cavalcante', '1240', 'Centro', 10.00, '40-60 min', 200.00, 'plan_store_pro', 'active', 1, '#ea580c', '#431407'),
('store_mercado', 'usr_lojista', 'Supermercado & Conveniência Vale do Sol', 'supermercado-vale-do-sol', 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&h=300&fit=crop&q=80', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=400&fit=crop&q=80', 'Hortifrúti fresquinho, carnes selecionadas, bebidas geladas e produtos de mercearia com entrega no seu bairro.', 'Supermercado & Bebidas', '(94) 3358-8899', '(94) 99222-3344', 'Av. dos Pioneiros', '450', 'Novo Horizonte', 8.00, '30-45 min', 120.00, 'plan_store_pro', 'active', 1, '#16a34a', '#052e16'),
('store_tech', 'usr_lojista', 'TechCarajás Informática & Games', 'techcarajas-informatica', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=300&fit=crop&q=80', 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1200&h=400&fit=crop&q=80', 'Smartphones, fones sem fio, periféricos gamer, cabos, fontes e acessórios de tecnologia com garantia.', 'Eletrônicos & Informática', '(94) 3358-7711', '(94) 99111-9988', 'Rua do Comércio', '88', 'Centro', 7.00, '25-40 min', 150.00, 'plan_store_free', 'active', 1, '#3b82f6', '#172554'),
('store_moda', 'usr_lojista', 'Boutique Elegância Carajás', 'boutique-elegancia-carajas', 'https://images.unsplash.com/photo-1544441893-675973e31985?w=300&h=300&fit=crop&q=80', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop&q=80', 'Moda feminina e masculina, vestidos, calçados e acessórios das melhores marcas com entrega rápida no seu endereço.', 'Moda & Calçados', '(94) 3358-3322', '(94) 99188-7766', 'Av. Weyne Cavalcante', '890', 'Centro', 6.00, '20-35 min', 160.00, 'plan_store_pro', 'active', 1, '#ec4899', '#500724'),
('store_casa', 'usr_lojista', 'Canaã Lar Móveis & Decoração', 'canaa-lar-moveis', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop&q=80', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=400&fit=crop&q=80', 'Móveis para sala, quarto e cozinha, colchões, cortinas, iluminação e artigos de decoração com montagem inclusa.', 'Casa, Decoração & Móveis', '(94) 3358-4455', '(94) 99233-1122', 'Av. dos Pioneiros', '710', 'Novo Horizonte', 12.00, '45-60 min', 250.00, 'plan_store_pro', 'active', 1, '#d97706', '#451a03'),
('store_farmacia', 'usr_lojista', 'Drogaria & Saúde Canaã', 'drogaria-saude-canaa', 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=300&fit=crop&q=80', 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1200&h=400&fit=crop&q=80', 'Medicamentos, perfumaria, suplementos vitamínicos, cuidados infantis e dermocosméticos com entrega expressa.', 'Farmácia & Beleza', '(94) 3358-9900', '(94) 99144-8899', 'Rua Agenor Paiva', '315', 'Centro', 5.00, '15-30 min', 80.00, 'plan_store_pro', 'active', 1, '#0284c7', '#082f49');

INSERT OR IGNORE INTO products (id, store_id, category_id, name, slug, description, image_url, sku, price, promotional_price, stock_quantity, is_active, is_featured, weight_kg) VALUES
('prod_cimento', 'store_construcao', 'cat_construcao', 'Cimento CP-II 50kg Nacional', 'cimento-cp-ii-50kg', 'Cimento Portland composto de alta resistência, ideal para fundações e rebocos.', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&h=600&fit=crop&q=80', 'CIM-50KG', 43.90, 39.90, 120, 1, 1, 50.0),
('prod_tinta', 'store_construcao', 'cat_construcao', 'Tinta Acrílica Premium Fosca Branco Neve 18L', 'tinta-acrilica-premium-18l', 'Máxima cobertura e durabilidade para ambientes internos e externos em Canaã.', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&h=600&fit=crop&q=80', 'TNT-18L-BR', 289.00, 259.90, 35, 1, 1, 22.0),
('prod_furadeira', 'store_construcao', 'cat_construcao', 'Furadeira e Parafusadeira de Impacto 12V com Maleta', 'furadeira-parafusadeira-12v', 'Potente, acompanha duas baterias de lítio recarregáveis, carregador bivolt.', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=600&fit=crop&q=80', 'FER-FUR12V', 249.90, 219.00, 18, 1, 1, 2.1),
('prod_cesta', 'store_mercado', 'cat_supermercado', 'Cesta Básica Completa Família Carajás 18 Itens', 'cesta-basica-familia-carajas', 'Arroz 5kg, feijão 2kg, açúcar, óleo, café, leite em pó e itens essenciais.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=600&fit=crop&q=80', 'ALM-CST18', 189.90, 169.90, 45, 1, 1, 18.0),
('prod_cafe', 'store_mercado', 'cat_supermercado', 'Café Especial Torrado e Moído Regional 500g', 'cafe-especial-regional-500g', 'Aroma encorpado e sabor marcante para começar bem o dia.', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&h=600&fit=crop&q=80', 'ALM-CAF500', 24.50, 19.90, 80, 1, 0, 0.5),
('prod_fone', 'store_tech', 'cat_eletronicos', 'Fone de Ouvido Bluetooth Sem Fio TWS', 'fone-bluetooth-tws-pro', 'Autonomia de até 28 horas com estojo de recarga rápida USB-C.', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop&q=80', 'TEC-FONE-TWS', 159.00, 129.90, 26, 1, 1, 0.2),
('prod_carregador', 'store_tech', 'cat_eletronicos', 'Carregador Turbo Power 33W USB-C Bivolt', 'carregador-turbo-33w-usbc', 'Carregamento ultra rápido compatível com smartphones modernos.', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=600&fit=crop&q=80', 'TEC-CHG-33W', 79.90, 64.90, 50, 1, 0, 0.15),
('prod_vestido', 'store_moda', 'cat_moda', 'Vestido Midi Linho Floral Casual', 'vestido-midi-linho-floral', 'Tecido leve e fresco de linho com algodão, perfeito para Canaã dos Carajás.', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&h=600&fit=crop&q=80', 'MOD-VES-LIN', 189.90, 159.90, 15, 1, 1, 0.3),
('prod_poltrona', 'store_casa', 'cat_casa', 'Poltrona Decorativa Eames Estofada', 'poltrona-decorativa-eames', 'Design sofisticado para sala ou escritório, pés em madeira maciça.', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop&q=80', 'CAS-POL-EAM', 499.00, 429.00, 8, 1, 1, 8.5),
('prod_vitamina', 'store_farmacia', 'cat_farmacia', 'Multivitamínico A-Z Completo 60 Cápsulas', 'multivitaminico-a-z-60caps', 'Suplemento vitamínico e mineral para imunidade, disposição e energia.', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=600&fit=crop&q=80', 'FAR-VIT-AZ', 54.90, 44.90, 45, 1, 1, 0.1);

INSERT OR IGNORE INTO service_providers (id, user_id, business_name, slug, photo_url, category_id, specialty, description, phone, whatsapp, neighborhoods_json, starting_price, availability_status, is_approved, is_featured, rating_average, total_reviews) VALUES
('prov_otica_visao', 'usr_prestador', 'Ótica & Centro da Visão Carajás', 'otica-visao-carajas', 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=300&h=300&fit=crop&q=80', 'scat_saude', 'Exames de Vista Computadorizados, Óculos de Grau e Lentes', 'Agendamento de exames computadorizados, armações e lentes. Pagamento com comissão integrada.', '(94) 3358-2200', '(94) 99133-5566', '["Centro","Novo Horizonte","Alto Bonito"]', 80.00, 'available', 1, 1, 5.0, 42),
('prov_climatizacao', 'usr_prestador', 'Carajás Climatização & Refrigeração', 'carajas-climatizacao', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=300&fit=crop&q=80', 'scat_climatizacao', 'Instalação e Higienização Química de Ar-Condicionado Split', 'Mais de 8 anos de experiência em Canaã dos Carajás. Tubulação 100% cobre e bomba de vácuo.', '(94) 99188-7766', '(94) 99188-7766', '["Centro","Novo Horizonte","Alto Bonito","Bela Vista"]', 180.00, 'available', 1, 1, 4.9, 38),
('prov_eletrica', 'usr_prestador', 'EletroCarajás - Instalações & Padrão Celpa/Equatorial', 'eletrocarajas-instalacoes', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&h=300&fit=crop&q=80', 'scat_eletrica', 'Quadros de Distribuição, Padrão Monofásico/Trifásico e Iluminação', 'Eletrotécnico credenciado. Atendimento residencial e comercial com conformidade NR-10.', '(94) 99233-1122', '(94) 99233-1122', '["Todos os bairros de Canaã dos Carajás"]', 150.00, 'available', 1, 1, 5.0, 24);

INSERT OR IGNORE INTO couriers (id, user_id, vehicle_type, license_plate, document_number, is_available, is_approved, current_location_name, total_deliveries, balance) VALUES
('courier_carlos', 'usr_entregador', 'moto', 'QXA-8822', '034.882.112-90', 1, 1, 'Centro - Canaã dos Carajás', 142, 384.50);

INSERT OR IGNORE INTO promotional_banners (id, title, subtitle, image_url, link_url, target_type, position, is_active) VALUES
('banner_1', 'Compre no Comércio de Canaã dos Carajás com Entrega Rápida', 'Materiais de construção, supermercado, eletrônicos e farmácia na sua porta.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&h=500&fit=crop&q=80', '/lojas', 'store', 1, 1),
('banner_2', 'Precisa de Ótica, Climatização, Eletricista ou Limpeza?', 'Conecte-se com os melhores profissionais e clínicas verificadas de Canaã.', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1400&h=500&fit=crop&q=80', '/servicos', 'service', 2, 1),
('banner_3', 'Seja um Parceiro Shop da Cidade!', 'Cadastre sua loja ou ofereça seus serviços profissionais para milhares de moradores.', 'https://images.unsplash.com/photo-1556742049-0a67e557224f?w=1400&h=500&fit=crop&q=80', '/cadastro-parceiro', 'join', 3, 1);

PRAGMA foreign_keys = ON;
