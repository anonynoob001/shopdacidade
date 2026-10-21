-- ==============================================================================
-- SHOP DA CIDADE - SCHEMA COMPLETO PARA SUPABASE (POSTGRESQL + 2FA + SEEDS)
-- Execute este script no SQL Editor do seu projeto Supabase (https://supabase.com)
-- ==============================================================================

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Usuários (com suporte a 2FA Authenticator)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT ('usr_' || substr(gen_random_uuid()::text, 1, 12)),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  salt TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'cliente' CHECK (role IN ('cliente', 'lojista', 'prestador', 'entregador', 'admin', 'superadmin')),
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret TEXT,
  backup_codes_json TEXT DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Endereços
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id TEXT PRIMARY KEY DEFAULT ('addr_' || substr(gen_random_uuid()::text, 1, 12)),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Planos de Assinatura
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_audience TEXT NOT NULL CHECK (target_audience IN ('lojista', 'prestador')),
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  product_limit INTEGER NOT NULL DEFAULT 25,
  highlight_included INTEGER NOT NULL DEFAULT 0,
  commission_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  description TEXT,
  features_json TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Categorias de Produtos
CREATE TABLE IF NOT EXISTS public.product_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Categorias de Serviços
CREATE TABLE IF NOT EXISTS public.service_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Lojas
CREATE TABLE IF NOT EXISTS public.stores (
  id TEXT PRIMARY KEY DEFAULT ('store_' || substr(gen_random_uuid()::text, 1, 12)),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  category TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  instagram TEXT,
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
  delivery_fee_base NUMERIC(10,2) NOT NULL DEFAULT 7.00,
  delivery_time_min TEXT NOT NULL DEFAULT '30-50 min',
  free_delivery_minimum NUMERIC(10,2) DEFAULT 150.00,
  plan_id TEXT,
  commission_rate_override NUMERIC(5,2),
  theme_color_primary TEXT DEFAULT '#fdca04',
  theme_color_secondary TEXT DEFAULT '#0f172a',
  custom_announcement TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
  is_featured INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Produtos
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY DEFAULT ('prod_' || substr(gen_random_uuid()::text, 1, 12)),
  store_id TEXT NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  promotional_price NUMERIC(10,2),
  cost_price NUMERIC(10,2),
  sku TEXT,
  image_url TEXT,
  images_json TEXT NOT NULL DEFAULT '[]',
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  weight_kg NUMERIC(6,2) DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Entregadores
CREATE TABLE IF NOT EXISTS public.couriers (
  id TEXT PRIMARY KEY DEFAULT ('courier_' || substr(gen_random_uuid()::text, 1, 12)),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL DEFAULT 'moto',
  vehicle_plate TEXT,
  is_available INTEGER NOT NULL DEFAULT 1,
  is_approved INTEGER NOT NULL DEFAULT 1,
  current_location_neighborhood TEXT DEFAULT 'Centro',
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY DEFAULT ('ord_' || substr(gen_random_uuid()::text, 1, 12)),
  order_code TEXT UNIQUE NOT NULL,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address_json TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'pix',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  total_items NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  pix_code TEXT,
  pix_qr_base64 TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Sub-pedidos por Loja
CREATE TABLE IF NOT EXISTS public.sub_orders (
  id TEXT PRIMARY KEY DEFAULT ('sub_' || substr(gen_random_uuid()::text, 1, 12)),
  sub_order_code TEXT UNIQUE NOT NULL,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id TEXT NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending',
  store_subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 8.0,
  commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  store_net_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  courier_id TEXT,
  courier_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Itens do Pedido
CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY DEFAULT ('item_' || substr(gen_random_uuid()::text, 1, 12)),
  sub_order_id TEXT NOT NULL REFERENCES public.sub_orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Prestadores de Serviços
CREATE TABLE IF NOT EXISTS public.service_providers (
  id TEXT PRIMARY KEY DEFAULT ('prov_' || substr(gen_random_uuid()::text, 1, 12)),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES public.service_categories(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  photo_url TEXT,
  specialty TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  whatsapp TEXT,
  neighborhoods_json TEXT NOT NULL DEFAULT '["Centro"]',
  starting_price NUMERIC(10,2) DEFAULT 0,
  is_approved INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  rating_average NUMERIC(3,2) NOT NULL DEFAULT 5.0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Banners Promocionais da Home
CREATE TABLE IF NOT EXISTS public.promotional_banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  target_type TEXT NOT NULL DEFAULT 'store',
  position INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Configurações Globais
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS (Row Level Security) - Leitura Pública Liberada
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Acesso público de leitura em stores" ON public.stores FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Acesso público de leitura em products" ON public.products FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Acesso público de leitura em categories" ON public.product_categories FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Acesso público de leitura em service_categories" ON public.service_categories FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Acesso público de leitura em service_providers" ON public.service_providers FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Acesso público de leitura em promotional_banners" ON public.promotional_banners FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Acesso público de leitura em platform_settings" ON public.platform_settings FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- INSERTS INICIAIS (SEEDS DE CANAÃ DOS CARAJÁS - PA)
INSERT INTO public.platform_settings (key, value) VALUES
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
  ('banner_notice', 'Bem-vindo ao Shop da Cidade em Canaã dos Carajás!')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.product_categories (id, name, slug, icon, sort_order) VALUES
  ('cat_construcao', 'Construção & Reforma', 'construcao-e-reforma', 'Hammer', 1),
  ('cat_supermercado', 'Supermercado & Bebidas', 'supermercado-e-bebidas', 'ShoppingCart', 2),
  ('cat_eletronicos', 'Eletrônicos & Informática', 'eletronicos-e-informatica', 'Smartphone', 3),
  ('cat_moda', 'Moda & Calçados', 'moda-e-calcados', 'Shirt', 4),
  ('cat_casa', 'Casa, Decoração & Móveis', 'casa-decoracao', 'Home', 5),
  ('cat_farmacia', 'Farmácia & Beleza', 'farmacia-e-beleza', 'HeartPulse', 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.service_categories (id, name, slug, icon, description, sort_order) VALUES
  ('scat_saude', 'Óticas, Clínicas & Saúde', 'saude-e-oticas', 'HeartPulse', 'Exames de vista, óculos de grau e consultas em Canaã.', 1),
  ('scat_climatizacao', 'Climatização & Ar-Condicionado', 'climatizacao-ar-condicionado', 'Wind', 'Instalação, limpeza e conserto de split.', 2),
  ('scat_eletrica', 'Eletricista Residencial & Padrão', 'eletricista-residencial', 'Zap', 'Instalações elétricas e padrão Equatorial.', 3),
  ('scat_beleza', 'Barbearias & Salões de Beleza', 'beleza-e-estetica', 'Sparkles', 'Cortes modernos, manicure e estética.', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, name, email, password_hash, salt, phone, role) VALUES
  ('usr_superadmin', 'Administrador Shop da Cidade', 'admin@shopcarajas.com.br', 'e6378e9f565ecfa74f4b23d9faaf2f122e1329bf927de0d65b7410eb8a61476d', 's_seed_1', '(94) 99100-0001', 'superadmin'),
  ('usr_lojista', 'João Pedro da Silva', 'lojista@shopcarajas.com.br', 'e6378e9f565ecfa74f4b23d9faaf2f122e1329bf927de0d65b7410eb8a61476d', 's_seed_1', '(94) 99300-0003', 'lojista'),
  ('usr_prestador', 'Dr. Roberto Moura', 'prestador@shopcarajas.com.br', 'e6378e9f565ecfa74f4b23d9faaf2f122e1329bf927de0d65b7410eb8a61476d', 's_seed_1', '(94) 99400-0004', 'prestador')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stores (id, user_id, name, slug, logo_url, banner_url, description, category, phone, whatsapp, street, number, neighborhood, delivery_fee_base, delivery_time_min, free_delivery_minimum, status, is_featured, theme_color_primary) VALUES
  ('store_construcao', 'usr_lojista', 'Carajás Materiais de Construção', 'carajas-construcao', 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=300&h=300&fit=crop&q=80', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=400&fit=crop&q=80', 'Do alicerce ao acabamento: cimento, pisos e ferramentas com entrega rápida em Canaã.', 'Construção & Reforma', '(94) 3358-1234', '(94) 99123-4455', 'Av. Weyne Cavalcante', '1240', 'Centro', 10.00, '40-60 min', 200.00, 'active', 1, '#ea580c'),
  ('store_mercado', 'usr_lojista', 'Supermercado & Conveniência Vale do Sol', 'supermercado-vale-do-sol', 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&h=300&fit=crop&q=80', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=400&fit=crop&q=80', 'Hortifrúti fresquinho, carnes selecionadas e bebidas com entrega rápida.', 'Supermercado & Bebidas', '(94) 3358-8899', '(94) 99222-3344', 'Av. dos Pioneiros', '450', 'Novo Horizonte', 8.00, '30-45 min', 120.00, 'active', 1, '#16a34a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, store_id, category_id, name, slug, description, image_url, price, promotional_price, stock_quantity, is_active, is_featured) VALUES
  ('prod_cimento', 'store_construcao', 'cat_construcao', 'Cimento CP-II 50kg Nacional', 'cimento-cp-ii-50kg', 'Cimento Portland composto de alta resistência.', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&h=600&fit=crop&q=80', 43.90, 39.90, 120, 1, 1),
  ('prod_tinta', 'store_construcao', 'cat_construcao', 'Tinta Acrílica Premium Fosca Branco Neve 18L', 'tinta-acrilica-premium-18l', 'Máxima cobertura e durabilidade para ambientes internos e externos.', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&h=600&fit=crop&q=80', 289.00, 259.90, 35, 1, 1),
  ('prod_cesta', 'store_mercado', 'cat_supermercado', 'Cesta Básica Completa Família Carajás 18 Itens', 'cesta-basica-familia-carajas', 'Arroz 5kg, feijão 2kg, açúcar, óleo, café e itens essenciais.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=600&fit=crop&q=80', 189.90, 169.90, 45, 1, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.service_providers (id, user_id, business_name, slug, photo_url, category_id, specialty, description, phone, whatsapp, starting_price, is_approved, is_featured) VALUES
  ('prov_otica_visao', 'usr_prestador', 'Ótica & Centro da Visão Carajás', 'otica-visao-carajas', 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=300&h=300&fit=crop&q=80', 'scat_saude', 'Exames de Vista Computadorizados e Óculos de Grau', 'Agendamento de exames computadorizados, armações e lentes.', '(94) 3358-2200', '(94) 99133-5566', 80.00, 1, 1),
  ('prov_climatizacao', 'usr_prestador', 'Carajás Climatização & Refrigeração', 'carajas-climatizacao', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=300&fit=crop&q=80', 'scat_climatizacao', 'Instalação e Higienização Química de Ar-Condicionado Split', 'Mais de 8 anos de experiência em Canaã dos Carajás.', '(94) 99188-7766', '(94) 99188-7766', 180.00, 1, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.promotional_banners (id, title, subtitle, image_url, link_url, target_type, position, is_active) VALUES
  ('banner_1', 'Compre no Comércio de Canaã dos Carajás com Entrega Rápida', 'Materiais de construção, supermercado, farmácia e muito mais na sua porta.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&h=500&fit=crop&q=80', '/lojas', 'store', 1, 1),
  ('banner_2', 'Precisa de Ótica, Climatização, Eletricista ou Limpeza?', 'Conecte-se com os melhores profissionais e clínicas verificadas de Canaã.', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1400&h=500&fit=crop&q=80', '/servicos', 'service', 2, 1)
ON CONFLICT (id) DO NOTHING;
