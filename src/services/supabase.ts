// Shop da Cidade - Supabase Database Integration & Client Service
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase configuration from environment or localStorage
const STORAGE_KEY_URL = 'shop_cidade_supabase_url';
const STORAGE_KEY_KEY = 'shop_cidade_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;

export function getSavedSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) || '' : '';

  return {
    url: storedUrl || envUrl,
    anonKey: storedKey || envKey
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
    else localStorage.removeItem(STORAGE_KEY_URL);

    if (anonKey) localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
    else localStorage.removeItem(STORAGE_KEY_KEY);

    cachedClient = null; // reset cached client
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSavedSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http'));
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getSavedSupabaseConfig();
  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    return cachedClient;
  } catch (err) {
    console.error('[Supabase] Failed to initialize client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL e Chave Anon do Supabase são obrigatórios.' };
  }

  const startTime = Date.now();
  try {
    const testClient = createClient(url.trim(), anonKey.trim());
    // Test a basic select or health ping against Supabase REST
    const { data, error } = await testClient.from('platform_settings').select('key').limit(1);
    
    const latencyMs = Date.now() - startTime;
    if (error) {
      // If table doesn't exist yet, but connection succeeded, it returns code PGRST204 or 42P01
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          success: true,
          latencyMs,
          message: 'Conexão com o Supabase estabelecida com sucesso! (Tabelas ainda não criadas. Execute o script SQL abaixo).'
        };
      }
      return { success: false, message: `Erro Supabase: ${error.message} (${error.code || ''})` };
    }

    return {
      success: true,
      latencyMs,
      message: `Conexão ativa e tabelas encontradas no Supabase! (${latencyMs}ms)`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Falha ao conectar: ${err?.message || 'Verifique a URL e a Chave'}`
    };
  }
}

/**
 * Returns complete PostgreSQL DDL script for Supabase SQL Editor.
 * Includes all tables: users, stores, products, orders, categories, services, couriers, site settings.
 */
export function getSupabaseSchemaSQL(): string {
  return `-- ==============================================================================
-- SHOP DA CIDADE - SCHEMA COMPLETO PARA BANCO DE DADOS SUPABASE (POSTGRESQL)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==============================================================================

-- 1. Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Usuários
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT ('usr_' || substr(gen_random_uuid()::text, 1, 12)),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  salt TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'cliente' CHECK (role IN ('cliente', 'lojista', 'prestador', 'entregador', 'admin', 'superadmin')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Endereços de Usuários
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

-- 5. Lojas do Marketplace (com personalização de cores e URL própria)
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

-- 6. Categorias de Produtos
CREATE TABLE IF NOT EXISTS public.product_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Produtos
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
  images_json TEXT NOT NULL DEFAULT '[]',
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  track_stock INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'un',
  is_active INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Entregadores
CREATE TABLE IF NOT EXISTS public.couriers (
  id TEXT PRIMARY KEY DEFAULT ('courier_' || substr(gen_random_uuid()::text, 1, 12)),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL DEFAULT 'moto' CHECK (vehicle_type IN ('moto', 'bike', 'carro', 'van')),
  vehicle_plate TEXT,
  is_available INTEGER NOT NULL DEFAULT 1,
  is_approved INTEGER NOT NULL DEFAULT 1,
  current_location_neighborhood TEXT,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  rating_average NUMERIC(3,2) NOT NULL DEFAULT 5.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Pedidos (Multi-lojas com split de comissão e PIX)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY DEFAULT ('ord_' || substr(gen_random_uuid()::text, 1, 12)),
  order_code TEXT UNIQUE NOT NULL,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address_json TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'credit_card', 'cash_on_delivery')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'failed', 'refunded')),
  subtotal_amount NUMERIC(10,2) NOT NULL,
  total_delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Sub-pedidos por Loja
CREATE TABLE IF NOT EXISTS public.sub_orders (
  id TEXT PRIMARY KEY DEFAULT ('sub_' || substr(gen_random_uuid()::text, 1, 12)),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id TEXT NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'preparing', 'ready_for_pickup', 'dispatched', 'delivered', 'cancelled')),
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 8.0,
  commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  store_payout_amount NUMERIC(10,2) NOT NULL,
  delivery_type TEXT NOT NULL DEFAULT 'delivery' CHECK (delivery_type IN ('delivery', 'pickup')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Itens do Pedido
CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY DEFAULT ('item_' || substr(gen_random_uuid()::text, 1, 12)),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sub_order_id TEXT NOT NULL REFERENCES public.sub_orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_item_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Categorias de Serviços
CREATE TABLE IF NOT EXISTS public.service_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Prestadores de Serviços
CREATE TABLE IF NOT EXISTS public.service_providers (
  id TEXT PRIMARY KEY DEFAULT ('prov_' || substr(gen_random_uuid()::text, 1, 12)),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES public.service_categories(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  banner_url TEXT,
  description TEXT,
  phone TEXT,
  whatsapp TEXT,
  neighborhoods_json TEXT NOT NULL DEFAULT '["Centro"]',
  city TEXT NOT NULL DEFAULT 'Canaã dos Carajás',
  state TEXT NOT NULL DEFAULT 'PA',
  hourly_rate_estimate NUMERIC(10,2),
  is_approved INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  rating_average NUMERIC(3,2) NOT NULL DEFAULT 5.0,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Solicitações de Orçamentos de Serviços
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id TEXT PRIMARY KEY DEFAULT ('quote_' || substr(gen_random_uuid()::text, 1, 12)),
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  provider_id TEXT REFERENCES public.service_providers(id) ON DELETE SET NULL,
  category_id TEXT REFERENCES public.service_categories(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  neighborhood TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  preferred_date DATE,
  urgency TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Configurações Globais da Plataforma (Cores, Contatos, Identidade)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir configurações iniciais com a paleta oficial da logo Shop da Cidade
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
  ('banner_notice', 'Bem-vindo ao Shop da Cidade! Conectando você às melhores lojas e prestadores de Canaã dos Carajás - PA.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Índices recomendados para máxima performance
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(status);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_providers_slug ON public.service_providers(slug);

-- RLS (Row Level Security) - Leitura pública para marketplace
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público de leitura em lojas" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Acesso público de leitura em produtos" ON public.products FOR SELECT USING (true);
CREATE POLICY "Acesso público de leitura em categorias" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Acesso público de leitura em prestadores" ON public.service_providers FOR SELECT USING (true);
CREATE POLICY "Acesso público de leitura em configurações" ON public.platform_settings FOR SELECT USING (true);
`;
}
