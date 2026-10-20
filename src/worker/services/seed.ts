// Shop Carajás - Database Seeder for Canaã dos Carajás, PA
import { DatabaseAdapter } from '../db';
import { generateSalt, hashPassword } from './auth';

export async function seedDatabase(db: DatabaseAdapter): Promise<void> {
  console.log('Verifying Shop Carajás database seeding for Canaã dos Carajás...');

  // 1. Platform Settings
  const settings = [
    ['platform_name', 'Shop da Cidade'],
    ['site_tagline', 'O Shopping Virtual da Sua Cidade'],
    ['city_name', 'Canaã dos Carajás'],
    ['city_state', 'PA'],
    ['primary_color', '#fdca04'],
    ['secondary_color', '#0f172a'],
    ['accent_color', '#f59e0b'],
    ['official_whatsapp', '(94) 99123-4567'],
    ['official_email', 'atendimento@shopdacidade.com.br'],
    ['default_commission_rate', '8.0'],
    ['pix_key', 'financeiro@shopdacidade.com.br'],
    ['pix_key_type', 'email'],
    ['pix_beneficiary', 'SHOP DA CIDADE LTDA'],
    ['pix_city', 'CANAA DOS CARAJAS'],
    ['free_delivery_active', '1'],
    ['courier_base_fee', '8.00'],
    ['banner_notice', 'Bem-vindo ao Shop da Cidade! Conectando você às melhores lojas e prestadores de Canaã dos Carajás - PA.']
  ];

  for (const [key, value] of settings) {
    await db.prepare(`
      INSERT OR REPLACE INTO platform_settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).bind(key, value).run();
  }

  // 2. Subscription Plans
  const plans = [
    {
      id: 'plan_store_free',
      name: 'Lojista Inicial',
      target_audience: 'lojista',
      price: 0,
      billing_period: 'free',
      product_limit: 25,
      highlight_included: 0,
      commission_discount_percent: 0,
      description: 'Ideal para pequenos comércios e lojas iniciando as vendas online em Canaã.',
      features_json: JSON.stringify(['Até 25 produtos ativos', 'Receba pedidos com entrega e retirada', 'Painel de vendas completo', 'Comissão padrão de 8%'])
    },
    {
      id: 'plan_store_pro',
      name: 'Lojista Pro Canaã',
      target_audience: 'lojista',
      price: 79.90,
      billing_period: 'monthly',
      product_limit: 250,
      highlight_included: 1,
      commission_discount_percent: 3.0,
      description: 'Para lojas consolidadas com alto volume de vendas e destaque na plataforma.',
      features_json: JSON.stringify(['Até 250 produtos cadastrados', 'Comissão reduzida de 5%', 'Selo de Loja Oficial', 'Destaque prioritário na página inicial', 'Suporte WhatsApp dedicado'])
    },
    {
      id: 'plan_pro_free',
      name: 'Profissional Autônomo',
      target_audience: 'prestador',
      price: 0,
      billing_period: 'free',
      product_limit: 5,
      highlight_included: 0,
      commission_discount_percent: 0,
      description: 'Receba pedidos de orçamento e clientes de toda a cidade sem mensalidade.',
      features_json: JSON.stringify(['Perfil público com WhatsApp', 'Receba até 15 orçamentos por mês', 'Agenda básica', 'Avaliações de clientes'])
    },
    {
      id: 'plan_pro_vip',
      name: 'Prestador VIP & Destaque',
      target_audience: 'prestador',
      price: 49.90,
      billing_period: 'monthly',
      product_limit: 20,
      highlight_included: 1,
      commission_discount_percent: 0,
      description: 'Para profissionais e empresas que desejam máxima visibilidade e clientes diários.',
      features_json: JSON.stringify(['Destaque no topo da categoria', 'Orçamentos ilimitados', 'Galeria de fotos de obras/serviços', 'Selo Profissional Verificado', 'Agendamento online direto'])
    }
  ];

  for (const plan of plans) {
    await db.prepare(`
      INSERT OR IGNORE INTO subscription_plans (id, name, target_audience, price, billing_period, product_limit, highlight_included, commission_discount_percent, description, features_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(plan.id, plan.name, plan.target_audience, plan.price, plan.billing_period, plan.product_limit, plan.highlight_included, plan.commission_discount_percent, plan.description, plan.features_json).run();
  }

  // 3. Product Categories
  const productCats = [
    { id: 'cat_construcao', name: 'Construção & Reforma', slug: 'construcao-e-reforma', icon: 'Hammer', sort_order: 1 },
    { id: 'cat_supermercado', name: 'Supermercado & Bebidas', slug: 'supermercado-e-bebidas', icon: 'ShoppingCart', sort_order: 2 },
    { id: 'cat_eletronicos', name: 'Eletrônicos & Informática', slug: 'eletronicos-e-informatica', icon: 'Smartphone', sort_order: 3 },
    { id: 'cat_moda', name: 'Moda & Calçados', slug: 'moda-e-calcados', icon: 'Shirt', sort_order: 4 },
    { id: 'cat_casa', name: 'Casa, Decoração & Móveis', slug: 'casa-decoracao', icon: 'Home', sort_order: 5 },
    { id: 'cat_farmacia', name: 'Farmácia & Beleza', slug: 'farmacia-e-beleza', icon: 'HeartPulse', sort_order: 6 },
    { id: 'cat_auto', name: 'Auto & Moto Peças', slug: 'auto-moto', icon: 'Car', sort_order: 7 },
    { id: 'cat_pet', name: 'Pet Shop & Agro', slug: 'pet-shop-agro', icon: 'PawPrint', sort_order: 8 }
  ];

  for (const cat of productCats) {
    await db.prepare(`
      INSERT OR IGNORE INTO product_categories (id, name, slug, icon, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `).bind(cat.id, cat.name, cat.slug, cat.icon, cat.sort_order).run();
  }

  // 4. Service Categories
  const serviceCats = [
    { id: 'scat_climatizacao', name: 'Climatização & Ar-Condicionado', slug: 'climatizacao-ar-condicionado', icon: 'Wind', description: 'Instalação, limpeza e conserto de ar condicionado split em Canaã.', sort_order: 1 },
    { id: 'scat_eletrica', name: 'Eletricista Residencial & Padrão', slug: 'eletricista-residencial', icon: 'Zap', description: 'Instalações elétricas, quadros de energia e padrão Equatorial.', sort_order: 2 },
    { id: 'scat_hidraulica', name: 'Encanador & Hidráulica', slug: 'encanador-hidraulica', icon: 'Wrench', description: 'Conserto de vazamentos, bombas d’água e instalações hidráulicas.', sort_order: 3 },
    { id: 'scat_obras', name: 'Pedreiros, Pintores & Reformas', slug: 'pedreiros-pintores-reformas', icon: 'Paintbrush', description: 'Construção, assentamento de pisos, porcelanato e pintura geral.', sort_order: 4 },
    { id: 'scat_mecanica', name: 'Mecânica & Auto Socorro', slug: 'mecanica-auto-socorro', icon: 'Settings', description: 'Mecânica de automóveis, motos, troca de óleo e socorro mecânico.', sort_order: 5 },
    { id: 'scat_limpeza', name: 'Diaristas, Faxina & Pós-Obra', slug: 'diaristas-faxina', icon: 'Sparkles', description: 'Profissionais de limpeza residencial, comercial e pós-obra.', sort_order: 6 },
    { id: 'scat_ti', name: 'Informática, Câmeras & CFTV', slug: 'informatica-cftv', icon: 'Monitor', description: 'Manutenção de computadores, instalação de redes e segurança eletrônica.', sort_order: 7 }
  ];

  for (const scat of serviceCats) {
    await db.prepare(`
      INSERT OR IGNORE INTO service_categories (id, name, slug, icon, description, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(scat.id, scat.name, scat.slug, scat.icon, scat.description, scat.sort_order).run();
  }

  // 5. Seed Users
  const salt = generateSalt();
  const defaultPasswordHash = await hashPassword('123456', salt);

  const users = [
    {
      id: 'usr_superadmin',
      name: 'Administrador Shop Carajás',
      email: 'admin@shopcarajas.com.br',
      phone: '(94) 99100-0001',
      role: 'superadmin'
    },
    {
      id: 'usr_cliente',
      name: 'Mariana Silva Santos',
      email: 'cliente@shopcarajas.com.br',
      phone: '(94) 99200-0002',
      role: 'cliente'
    },
    {
      id: 'usr_lojista',
      name: 'João Pedro da Silva (Carajás Construção)',
      email: 'lojista@shopcarajas.com.br',
      phone: '(94) 99300-0003',
      role: 'lojista'
    },
    {
      id: 'usr_prestador',
      name: 'Eng. Roberto Moura (Carajás Clima)',
      email: 'prestador@shopcarajas.com.br',
      phone: '(94) 99400-0004',
      role: 'prestador'
    },
    {
      id: 'usr_entregador',
      name: 'Carlos Oliveira (Entregador Canaã)',
      email: 'entregador@shopcarajas.com.br',
      phone: '(94) 99500-0005',
      role: 'entregador'
    }
  ];

  for (const u of users) {
    await db.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, password_hash, salt, phone, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(u.id, u.name, u.email, defaultPasswordHash, salt, u.phone, u.role).run();
  }

  // 6. User Address
  await db.prepare(`
    INSERT OR IGNORE INTO user_addresses (id, user_id, label, street, number, complement, neighborhood, city, state, zip_code, reference_point, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).bind(
    'addr_demo_1',
    'usr_cliente',
    'Minha Residência',
    'Rua das Palmeiras',
    '142',
    'Apto 102',
    'Novo Horizonte',
    'Canaã dos Carajás',
    'PA',
    '68537-000',
    'Próximo à Praça da Bíblia'
  ).run();

  // 7. Seed Stores
  const stores = [
    {
      id: 'store_construcao',
      user_id: 'usr_lojista',
      name: 'Carajás Materiais de Construção',
      slug: 'carajas-construcao',
      logo_url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=300&h=300&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=400&fit=crop&q=80',
      description: 'Do alicerce ao acabamento: cimento, pisos, ferramentas, tintas e materiais elétricos com entrega rápida em toda Canaã dos Carajás.',
      category: 'Construção & Reforma',
      phone: '(94) 3358-1234',
      whatsapp: '(94) 99123-4455',
      street: 'Av. Weyne Cavalcante',
      number: '1240',
      neighborhood: 'Centro',
      delivery_fee_base: 10.00,
      delivery_time_min: '40-60 min',
      free_delivery_minimum: 200.00,
      plan_id: 'plan_store_pro',
      status: 'active',
      is_featured: 1
    },
    {
      id: 'store_mercado',
      user_id: 'usr_lojista',
      name: 'Supermercado & Conveniência Vale do Sol',
      slug: 'supermercado-vale-do-sol',
      logo_url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&h=300&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=400&fit=crop&q=80',
      description: 'Hortifrúti fresquinho, carnes selecionadas, bebidas geladas e produtos de mercearia com entrega no seu bairro.',
      category: 'Supermercado & Bebidas',
      phone: '(94) 3358-8899',
      whatsapp: '(94) 99222-3344',
      street: 'Av. dos Pioneiros',
      number: '450',
      neighborhood: 'Novo Horizonte',
      delivery_fee_base: 8.00,
      delivery_time_min: '30-45 min',
      free_delivery_minimum: 120.00,
      plan_id: 'plan_store_pro',
      status: 'active',
      is_featured: 1
    },
    {
      id: 'store_tech',
      user_id: 'usr_lojista',
      name: 'TechCarajás Informática & Games',
      slug: 'techcarajas-informatica',
      logo_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=300&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1200&h=400&fit=crop&q=80',
      description: 'Smartphones, fones sem fio, periféricos gamer, cabos, fontes e acessórios de tecnologia com garantia.',
      category: 'Eletrônicos & Informática',
      phone: '(94) 3358-7711',
      whatsapp: '(94) 99111-9988',
      street: 'Rua do Comércio',
      number: '88',
      neighborhood: 'Centro',
      delivery_fee_base: 7.00,
      delivery_time_min: '25-40 min',
      free_delivery_minimum: 150.00,
      plan_id: 'plan_store_free',
      status: 'active',
      is_featured: 1
    },
    {
      id: 'store_moda',
      user_id: 'usr_lojista',
      name: 'Boutique Elegância Carajás',
      slug: 'boutique-elegancia-carajas',
      logo_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=300&h=300&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop&q=80',
      description: 'Moda feminina e masculina, vestidos, calçados e acessórios das melhores marcas com entrega rápida no seu endereço.',
      category: 'Moda & Calçados',
      phone: '(94) 3358-3322',
      whatsapp: '(94) 99188-7766',
      street: 'Av. Weyne Cavalcante',
      number: '890',
      neighborhood: 'Centro',
      delivery_fee_base: 6.00,
      delivery_time_min: '20-35 min',
      free_delivery_minimum: 160.00,
      plan_id: 'plan_store_pro',
      status: 'active',
      is_featured: 1
    },
    {
      id: 'store_casa',
      user_id: 'usr_lojista',
      name: 'Canaã Lar Móveis & Decoração',
      slug: 'canaa-lar-moveis',
      logo_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=400&fit=crop&q=80',
      description: 'Móveis para sala, quarto e cozinha, colchões, cortinas, iluminação e artigos de decoração com montagem inclusa.',
      category: 'Casa, Decoração & Móveis',
      phone: '(94) 3358-4455',
      whatsapp: '(94) 99233-1122',
      street: 'Av. dos Pioneiros',
      number: '710',
      neighborhood: 'Novo Horizonte',
      delivery_fee_base: 12.00,
      delivery_time_min: '45-60 min',
      free_delivery_minimum: 250.00,
      plan_id: 'plan_store_pro',
      status: 'active',
      is_featured: 1
    },
    {
      id: 'store_farmacia',
      user_id: 'usr_lojista',
      name: 'Drogaria & Saúde Canaã',
      slug: 'drogaria-saude-canaa',
      logo_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=300&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1200&h=400&fit=crop&q=80',
      description: 'Medicamentos, perfumaria, suplementos vitamínicos, cuidados infantis e dermocosméticos com entrega expressa.',
      category: 'Farmácia & Beleza',
      phone: '(94) 3358-9900',
      whatsapp: '(94) 99144-8899',
      street: 'Rua Agenor Paiva',
      number: '315',
      neighborhood: 'Centro',
      delivery_fee_base: 5.00,
      delivery_time_min: '15-30 min',
      free_delivery_minimum: 80.00,
      plan_id: 'plan_store_pro',
      status: 'active',
      is_featured: 1
    },
    {
      id: 'store_auto',
      user_id: 'usr_lojista',
      name: 'Vale Auto Peças & Moto Center',
      slug: 'vale-auto-pecas-carajas',
      logo_url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=300&h=300&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&h=400&fit=crop&q=80',
      description: 'Peças para carros nacionais e importados, motos, baterias com troca grátis, óleos lubrificantes e acessórios.',
      category: 'Auto & Moto Peças',
      phone: '(94) 3358-1100',
      whatsapp: '(94) 99177-3344',
      street: 'Av. São João',
      number: '520',
      neighborhood: 'Novo Horizonte',
      delivery_fee_base: 8.00,
      delivery_time_min: '30-45 min',
      free_delivery_minimum: 150.00,
      plan_id: 'plan_store_free',
      status: 'active',
      is_featured: 1
    },
    {
      id: 'store_pet',
      user_id: 'usr_lojista',
      name: 'AgroPet Carajás',
      slug: 'agropet-carajas',
      logo_url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=300&h=300&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&h=400&fit=crop&q=80',
      description: 'Rações Super Premium, petiscos, farmácia veterinária, antipulgas, brinquedos e artigos para chácaras e fazendas.',
      category: 'Pet Shop & Agro',
      phone: '(94) 3358-6677',
      whatsapp: '(94) 99155-2211',
      street: 'Av. Minas Gerais',
      number: '210',
      neighborhood: 'Alto Bonito',
      delivery_fee_base: 7.00,
      delivery_time_min: '25-40 min',
      free_delivery_minimum: 100.00,
      plan_id: 'plan_store_pro',
      status: 'active',
      is_featured: 1
    }
  ];

  for (const s of stores) {
    await db.prepare(`
      INSERT OR IGNORE INTO stores (id, user_id, name, slug, logo_url, banner_url, description, category, phone, whatsapp, street, number, neighborhood, delivery_fee_base, delivery_time_min, free_delivery_minimum, plan_id, status, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      s.id, s.user_id, s.name, s.slug, s.logo_url, s.banner_url, s.description, s.category,
      s.phone, s.whatsapp, s.street, s.number, s.neighborhood, s.delivery_fee_base,
      s.delivery_time_min, s.free_delivery_minimum, s.plan_id, s.status, s.is_featured
    ).run();
  }

  // 8. Seed Products
  const products = [
    {
      id: 'prod_cimento',
      store_id: 'store_construcao',
      category_id: 'cat_construcao',
      name: 'Cimento CP-II 50kg Nacional',
      slug: 'cimento-cp-ii-50kg',
      description: 'Cimento Portland composto de alta resistência, ideal para fundações, estruturas e rebocos em geral.',
      image_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&h=600&fit=crop&q=80',
      sku: 'CIM-50KG',
      price: 43.90,
      promotional_price: 39.90,
      stock_quantity: 120,
      is_active: 1,
      is_featured: 1,
      weight_kg: 50.0
    },
    {
      id: 'prod_tinta',
      store_id: 'store_construcao',
      category_id: 'cat_construcao',
      name: 'Tinta Acrílica Premium Fosca Branco Neve 18L',
      slug: 'tinta-acrilica-premium-18l',
      description: 'Máxima cobertura e durabilidade para ambientes internos e externos em Canaã. Antimofo e sem cheiro após 3h.',
      image_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&h=600&fit=crop&q=80',
      sku: 'TNT-18L-BR',
      price: 289.00,
      promotional_price: 259.90,
      stock_quantity: 35,
      is_active: 1,
      is_featured: 1,
      weight_kg: 22.0
    },
    {
      id: 'prod_furadeira',
      store_id: 'store_construcao',
      category_id: 'cat_construcao',
      name: 'Furadeira e Parafusadeira de Impacto 12V com Maleta',
      slug: 'furadeira-parafusadeira-12v',
      description: 'Potente, acompanha duas baterias de lítio recarregáveis, carregador bivolt e kit de brocas e pontas.',
      image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=600&fit=crop&q=80',
      sku: 'FER-FUR12V',
      price: 249.90,
      promotional_price: 219.00,
      stock_quantity: 18,
      is_active: 1,
      is_featured: 1,
      weight_kg: 2.1
    },
    {
      id: 'prod_cesta',
      store_id: 'store_mercado',
      category_id: 'cat_supermercado',
      name: 'Cesta Básica Completa Família Carajás 18 Itens',
      slug: 'cesta-basica-familia-carajas',
      description: 'Arroz tipo 1 5kg, feijão carioquinha 2kg, açúcar 2kg, óleo de soja, café torrado, leite em pó, farinha de trigo, biscoito e itens essenciais.',
      image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=600&fit=crop&q=80',
      sku: 'ALM-CST18',
      price: 189.90,
      promotional_price: 169.90,
      stock_quantity: 45,
      is_active: 1,
      is_featured: 1,
      weight_kg: 18.0
    },
    {
      id: 'prod_cafe',
      store_id: 'store_mercado',
      category_id: 'cat_supermercado',
      name: 'Café Especial Torrado e Moído Regional 500g',
      slug: 'cafe-especial-regional-500g',
      description: 'Aroma encorpado e sabor marcante para começar bem o dia. Embalagem a vácuo com fechamento hermético.',
      image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&h=600&fit=crop&q=80',
      sku: 'ALM-CAF500',
      price: 24.50,
      promotional_price: 19.90,
      stock_quantity: 80,
      is_active: 1,
      is_featured: 0,
      weight_kg: 0.5
    },
    {
      id: 'prod_fone',
      store_id: 'store_tech',
      category_id: 'cat_eletronicos',
      name: 'Fone de Ouvido Bluetooth Sem Fio TWS com Cancelamento de Ruído',
      slug: 'fone-bluetooth-tws-pro',
      description: 'Autonomia de até 28 horas com estojo de recarga rápida USB-C. Resistência a respingos de água e suor (IPX4).',
      image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop&q=80',
      sku: 'TEC-FONE-TWS',
      price: 159.00,
      promotional_price: 129.90,
      stock_quantity: 26,
      is_active: 1,
      is_featured: 1,
      weight_kg: 0.2
    },
    {
      id: 'prod_carregador',
      store_id: 'store_tech',
      category_id: 'cat_eletronicos',
      name: 'Carregador Turbo Power 33W USB-C Bivolt',
      slug: 'carregador-turbo-33w-usbc',
      description: 'Carregamento ultra rápido compatível com Samsung, Motorola, Xiaomi e iPhone (cabo reforçado de 1 metro incluso).',
      image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=600&fit=crop&q=80',
      sku: 'TEC-CHG-33W',
      price: 79.90,
      promotional_price: 64.90,
      stock_quantity: 50,
      is_active: 1,
      is_featured: 0,
      weight_kg: 0.15
    },
    {
      id: 'prod_vestido',
      store_id: 'store_moda',
      category_id: 'cat_moda',
      name: 'Vestido Midi Linho Floral Casual',
      slug: 'vestido-midi-linho-floral',
      description: 'Tecido leve e fresco de linho com algodão, perfeito para o clima de Canaã dos Carajás. Acabamento premium.',
      image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&h=600&fit=crop&q=80',
      sku: 'MOD-VES-LIN',
      price: 189.90,
      promotional_price: 159.90,
      stock_quantity: 15,
      is_active: 1,
      is_featured: 1,
      weight_kg: 0.3
    },
    {
      id: 'prod_poltrona',
      store_id: 'store_casa',
      category_id: 'cat_casa',
      name: 'Poltrona Decorativa Eames Estofada',
      slug: 'poltrona-decorativa-eames',
      description: 'Design sofisticado para sala ou escritório, pés em madeira maciça e espuma D-28 de alta densidade.',
      image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop&q=80',
      sku: 'CAS-POL-EAM',
      price: 499.00,
      promotional_price: 429.00,
      stock_quantity: 8,
      is_active: 1,
      is_featured: 1,
      weight_kg: 8.5
    },
    {
      id: 'prod_vitamina',
      store_id: 'store_farmacia',
      category_id: 'cat_farmacia',
      name: 'Multivitamínico A-Z Completo 60 Cápsulas',
      slug: 'multivitaminico-a-z-60caps',
      description: 'Suplemento vitamínico e mineral para imunidade, disposição e energia diária.',
      image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=600&fit=crop&q=80',
      sku: 'FAR-VIT-AZ',
      price: 54.90,
      promotional_price: 44.90,
      stock_quantity: 45,
      is_active: 1,
      is_featured: 1,
      weight_kg: 0.1
    },
    {
      id: 'prod_oleo',
      store_id: 'store_auto',
      category_id: 'cat_auto',
      name: 'Óleo Motor 5W30 Sintético 1L',
      slug: 'oleo-motor-5w30-sintetico',
      description: 'Lubrificante 100% sintético de alta performance para motores flex e gasolina. Máxima proteção e economia.',
      image_url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&h=600&fit=crop&q=80',
      sku: 'AUT-OLEO-5W30',
      price: 48.00,
      promotional_price: 42.00,
      stock_quantity: 60,
      is_active: 1,
      is_featured: 1,
      weight_kg: 0.95
    },
    {
      id: 'prod_racao',
      store_id: 'store_pet',
      category_id: 'cat_pet',
      name: 'Ração Premier Cães Adultos Frango 15kg',
      slug: 'racao-premier-caes-15kg',
      description: 'Alimento Super Premium com ingredientes selecionados, pelos brilhantes e fezes firmes. Alta digestibilidade.',
      image_url: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&h=600&fit=crop&q=80',
      sku: 'PET-RAC-PREM15',
      price: 239.90,
      promotional_price: 219.00,
      stock_quantity: 20,
      is_active: 1,
      is_featured: 1,
      weight_kg: 15.0
    }
  ];

  for (const p of products) {
    await db.prepare(`
      INSERT OR IGNORE INTO products (id, store_id, category_id, name, slug, description, image_url, sku, price, promotional_price, stock_quantity, is_active, is_featured, weight_kg)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      p.id, p.store_id, p.category_id, p.name, p.slug, p.description, p.image_url,
      p.sku, p.price, p.promotional_price, p.stock_quantity, p.is_active, p.is_featured, p.weight_kg
    ).run();
  }

  // 9. Seed Service Providers
  const providers = [
    {
      id: 'prov_climatizacao',
      user_id: 'usr_prestador',
      business_name: 'Carajás Climatização & Refrigeração',
      slug: 'carajas-climatizacao',
      photo_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=300&fit=crop&q=80',
      category_id: 'scat_climatizacao',
      specialty: 'Instalação e Higienização Química de Ar-Condicionado Split e Inverter',
      description: 'Mais de 8 anos de experiência em Canaã dos Carajás. Instalações com tubulação 100% cobre, teste de estanqueidade com nitrogênio e bomba de vácuo.',
      phone: '(94) 99188-7766',
      whatsapp: '(94) 99188-7766',
      neighborhoods_json: JSON.stringify(['Centro', 'Novo Horizonte', 'Alto Bonito', 'Bela Vista', 'Vale dos Sonhos', 'Residencial Canaã']),
      starting_price: 180.00,
      availability_status: 'available',
      is_approved: 1,
      is_featured: 1,
      rating_average: 4.9,
      total_reviews: 38
    },
    {
      id: 'prov_eletrica',
      user_id: 'usr_prestador',
      business_name: 'EletroCarajás - Instalações & Padrão Celpa/Equatorial',
      slug: 'eletrocarajas-instalacoes',
      photo_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&h=300&fit=crop&q=80',
      category_id: 'scat_eletrica',
      specialty: 'Quadros de Distribuição, Padrão Monofásico/Trifásico e Iluminação LED',
      description: 'Eletrotécnico credenciado. Atendimento residencial e comercial com laudo técnico e conformidade com a norma NR-10.',
      phone: '(94) 99233-1122',
      whatsapp: '(94) 99233-1122',
      neighborhoods_json: JSON.stringify(['Todos os bairros de Canaã dos Carajás e zona rural']),
      starting_price: 150.00,
      availability_status: 'available',
      is_approved: 1,
      is_featured: 1,
      rating_average: 5.0,
      total_reviews: 24
    },
    {
      id: 'prov_limpeza',
      user_id: 'usr_prestador',
      business_name: 'VIP Limpeza Residencial & Pós-Obra Canaã',
      slug: 'vip-limpeza-canaa',
      photo_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&h=300&fit=crop&q=80',
      category_id: 'scat_limpeza',
      specialty: 'Diaristas Profissionais, Limpeza Pesada e Pós-Reforma',
      description: 'Equipe de confiança, pontual e equipada com produtos e maquinário especializado para deixar seu imóvel impecável.',
      phone: '(94) 99199-5544',
      whatsapp: '(94) 99199-5544',
      neighborhoods_json: JSON.stringify(['Centro', 'Novo Horizonte', 'Parque dos Carajás', 'Alto Bonito']),
      starting_price: 160.00,
      availability_status: 'available',
      is_approved: 1,
      is_featured: 1,
      rating_average: 4.8,
      total_reviews: 19
    }
  ];

  for (const prov of providers) {
    await db.prepare(`
      INSERT OR IGNORE INTO service_providers (id, user_id, business_name, slug, photo_url, category_id, specialty, description, phone, whatsapp, neighborhoods_json, starting_price, availability_status, is_approved, is_featured, rating_average, total_reviews)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      prov.id, prov.user_id, prov.business_name, prov.slug, prov.photo_url,
      prov.category_id, prov.specialty, prov.description, prov.phone, prov.whatsapp,
      prov.neighborhoods_json, prov.starting_price, prov.availability_status,
      prov.is_approved, prov.is_featured, prov.rating_average, prov.total_reviews
    ).run();
  }

  // 10. Seed Courier
  await db.prepare(`
    INSERT OR IGNORE INTO couriers (id, user_id, vehicle_type, license_plate, document_number, is_available, is_approved, current_location_name, total_deliveries, balance)
    VALUES (?, ?, ?, ?, ?, 1, 1, 'Centro - Canaã dos Carajás', 142, 384.50)
  `).bind('courier_carlos', 'usr_entregador', 'moto', 'QXA-8822', '034.882.112-90').run();

  // 11. Seed Promotional Banners
  const banners = [
    {
      id: 'banner_1',
      title: 'Compre no Comércio de Canaã dos Carajás com Entrega Rápida',
      subtitle: 'Materiais de construção, supermercado, eletrônicos e farmácia na porta da sua casa.',
      image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&h=500&fit=crop&q=80',
      link_url: '/lojas',
      target_type: 'store',
      position: 1
    },
    {
      id: 'banner_2',
      title: 'Precisa de Climatização, Eletricista ou Limpeza?',
      subtitle: 'Conecte-se com os melhores profissionais autônomos verificados de Canaã dos Carajás.',
      image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1400&h=500&fit=crop&q=80',
      link_url: '/servicos',
      target_type: 'service',
      position: 2
    },
    {
      id: 'banner_3',
      title: 'Seja um Parceiro Shop da Cidade!',
      subtitle: 'Cadastre sua loja ou ofereça seus serviços profissionais para milhares de moradores.',
      image_url: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?w=1400&h=500&fit=crop&q=80',
      link_url: '/cadastro-parceiro',
      target_type: 'join',
      position: 3
    }
  ];

  for (const b of banners) {
    await db.prepare(`
      INSERT OR IGNORE INTO promotional_banners (id, title, subtitle, image_url, link_url, target_type, position, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(b.id, b.title, b.subtitle, b.image_url, b.link_url, b.target_type, b.position).run();
  }

  // 12. Seed Local Ads / Patrocinadores Locais
  const ads = [
    {
      id: 'ad_vale_mineracao',
      advertiser_name: 'Mineração & Serviços Carajás',
      title: 'Fornecedor de Equipamentos de Proteção Individual (EPI)',
      image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=300&fit=crop&q=80',
      click_url: '#'
    },
    {
      id: 'ad_posto_canaa',
      advertiser_name: 'Auto Posto & Conveniência Canaã',
      title: 'Combustível com garantia de procedência e troca de óleo rápida',
      image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&h=300&fit=crop&q=80',
      click_url: '#'
    }
  ];

  for (const ad of ads) {
    await db.prepare(`
      INSERT OR IGNORE INTO local_ads (id, advertiser_name, title, image_url, click_url, impressions_count, clicks_count, is_active)
      VALUES (?, ?, ?, ?, ?, 120, 14, 1)
    `).bind(ad.id, ad.advertiser_name, ad.title, ad.image_url, ad.click_url).run();
  }

  // 13. Seed an initial demo order so orders history works immediately
  const demoOrder = {
    id: 'ord_demo_1001',
    order_code: 'CARAJAS-8491',
    user_id: 'usr_cliente',
    customer_name: 'Mariana Silva Santos',
    customer_email: 'cliente@shopcarajas.com.br',
    customer_phone: '(94) 99200-0002',
    delivery_type: 'delivery',
    shipping_address_json: JSON.stringify({
      street: 'Rua das Palmeiras',
      number: '142',
      neighborhood: 'Novo Horizonte',
      city: 'Canaã dos Carajás',
      state: 'PA',
      zip_code: '68537-000'
    }),
    payment_method: 'pix',
    payment_status: 'confirmed',
    pix_code: '00020126360014BR.GOV.BCB.PIX0114financeiro@shopcarajas.com.br5204000053039865406179.805802BR5920SHOP CARAJAS LTDA6017CANAA DOS CARAJAS62070503***6304ABCD',
    total_items: 169.90,
    total_delivery_fee: 8.00,
    total_discount: 0,
    total_amount: 177.90
  };

  await db.prepare(`
    INSERT OR IGNORE INTO orders (id, order_code, user_id, customer_name, customer_email, customer_phone, delivery_type, shipping_address_json, payment_method, payment_status, pix_code, total_items, total_delivery_fee, total_discount, total_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    demoOrder.id, demoOrder.order_code, demoOrder.user_id, demoOrder.customer_name,
    demoOrder.customer_email, demoOrder.customer_phone, demoOrder.delivery_type,
    demoOrder.shipping_address_json, demoOrder.payment_method, demoOrder.payment_status,
    demoOrder.pix_code, demoOrder.total_items, demoOrder.total_delivery_fee,
    demoOrder.total_discount, demoOrder.total_amount
  ).run();

  const demoSubOrder = {
    id: 'subord_1001',
    sub_order_code: 'CARAJAS-8491-1',
    order_id: 'ord_demo_1001',
    store_id: 'store_mercado',
    status: 'delivered',
    delivery_model: 'platform_courier',
    store_subtotal: 169.90,
    delivery_fee: 8.00,
    commission_rate: 8.0,
    commission_amount: 13.59,
    store_net_amount: 156.31,
    courier_id: 'courier_carlos',
    courier_fee: 8.00
  };

  await db.prepare(`
    INSERT OR IGNORE INTO sub_orders (id, sub_order_code, order_id, store_id, status, delivery_model, store_subtotal, delivery_fee, commission_rate, commission_amount, store_net_amount, courier_id, courier_fee)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    demoSubOrder.id, demoSubOrder.sub_order_code, demoSubOrder.order_id, demoSubOrder.store_id,
    demoSubOrder.status, demoSubOrder.delivery_model, demoSubOrder.store_subtotal,
    demoSubOrder.delivery_fee, demoSubOrder.commission_rate, demoSubOrder.commission_amount,
    demoSubOrder.store_net_amount, demoSubOrder.courier_id, demoSubOrder.courier_fee
  ).run();

  await db.prepare(`
    INSERT OR IGNORE INTO order_items (id, sub_order_id, product_id, product_name, product_image, product_sku, unit_price, quantity, subtotal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    'item_1001',
    demoSubOrder.id,
    'prod_cesta',
    'Cesta Básica Completa Família Carajás 18 Itens',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=600&fit=crop&q=80',
    'ALM-CST18',
    169.90,
    1,
    169.90
  ).run();

  // 14. Seed Reviews
  await db.prepare(`
    INSERT OR IGNORE INTO reviews (id, user_id, target_type, target_id, rating, comment, is_verified, is_published)
    VALUES (?, ?, ?, ?, ?, ?, 1, 1)
  `).bind(
    'rev_demo_1',
    'usr_cliente',
    'store',
    'store_mercado',
    5,
    'Entrega super rápida aqui no Novo Horizonte! Produtos vieram bem embalados e frescos.'
  ).run();

  await db.prepare(`
    INSERT OR IGNORE INTO reviews (id, user_id, target_type, target_id, rating, comment, is_verified, is_published)
    VALUES (?, ?, ?, ?, ?, ?, 1, 1)
  `).bind(
    'rev_demo_2',
    'usr_cliente',
    'provider',
    'prov_climatizacao',
    5,
    'Excelente profissional! Instalou dois aparelhos de ar no meu escritório no Centro, pontual e muito caprichoso.'
  ).run();

  console.log('Shop Carajás database seeding completed successfully!');
}
