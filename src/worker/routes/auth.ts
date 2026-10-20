// Shop Carajás - Auth Routes
import { DatabaseAdapter } from '../db';
import { createSession, deleteSession, generateSalt, getUserByToken, hashPassword, verifyPassword } from '../services/auth';
import { User, UserRole } from '../types';

export async function handleAuthRoutes(req: { method: string; path: string; body?: any; headers: any; user?: User | null }, db: DatabaseAdapter) {
  const { method, path, body, headers } = req;

  // POST /api/auth/register
  if (method === 'POST' && path === '/api/auth/register') {
    const { name, email, password, phone, role = 'cliente' } = body || {};
    if (!name || !email || !password) {
      return { status: 400, data: { error: 'Nome, email e senha são obrigatórios.' } };
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(cleanEmail).first();
    if (existing) {
      return { status: 400, data: { error: 'Este e-mail já está cadastrado.' } };
    }

    const allowedRoles: UserRole[] = ['cliente', 'lojista', 'prestador', 'entregador'];
    const assignedRole = allowedRoles.includes(role) ? role : 'cliente';

    const userId = 'usr_' + crypto.randomUUID().slice(0, 12);
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);

    await db.prepare(`
      INSERT INTO users (id, name, email, password_hash, salt, phone, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(userId, name.trim(), cleanEmail, passwordHash, salt, phone || null, assignedRole).run();

    // If registered as courier, create courier record
    let createdCourier = null;
    if (assignedRole === 'entregador') {
      const courierId = 'courier_' + crypto.randomUUID().slice(0, 8);
      await db.prepare(`
        INSERT INTO couriers (id, user_id, vehicle_type, vehicle_plate, is_available, is_approved, current_location_neighborhood)
        VALUES (?, ?, ?, ?, 1, 1, ?)
      `).bind(courierId, userId, body?.vehicle_type || 'moto', body?.vehicle_plate || null, body?.neighborhood || 'Centro').run();
      createdCourier = await db.prepare('SELECT * FROM couriers WHERE id = ?').bind(courierId).first();
    }

    // If registered as lojista, create store record automatically
    let createdStore = null;
    if (assignedRole === 'lojista') {
      const storeName = body?.store_name || name.trim();
      const baseSlug = storeName.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const uniqueSuffix = Math.floor(Math.random() * 899 + 100);
      const storeSlug = `${baseSlug}-${uniqueSuffix}`;
      const storeId = 'store_' + crypto.randomUUID().slice(0, 10);
      
      await db.prepare(`
        INSERT INTO stores (
          id, user_id, name, slug, logo_url, banner_url, description, category,
          phone, whatsapp, neighborhood, city, state, zip_code,
          is_open, accepts_pickup, accepts_delivery, delivery_fee_base, delivery_time_min,
          free_delivery_minimum, plan_id, status, is_featured,
          theme_color_primary, theme_color_secondary
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, 'Canaã dos Carajás', 'PA', '68537-000',
          1, 1, 1, ?, '30-50 min',
          150.00, 'plan_store_free', 'active', 0,
          ?, ?
        )
      `).bind(
        storeId, userId, storeName, storeSlug,
        body?.logo_url || 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=300&h=300&fit=crop&q=80',
        body?.banner_url || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=400&fit=crop&q=80',
        body?.description || `Loja oficial de ${storeName} no Shop da Cidade em Canaã dos Carajás`,
        body?.category || 'Comércio Geral',
        phone || null, body?.whatsapp || phone || null, body?.neighborhood || 'Centro',
        Number(body?.delivery_fee_base) || 7.00,
        body?.theme_color_primary || '#fdca04',
        body?.theme_color_secondary || '#0f172a'
      ).run();
      createdStore = await db.prepare('SELECT * FROM stores WHERE id = ?').bind(storeId).first();
    }

    // If registered as prestador, create service provider record automatically
    let createdProvider = null;
    if (assignedRole === 'prestador') {
      const businessName = body?.business_name || name.trim();
      const baseSlug = businessName.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const uniqueSuffix = Math.floor(Math.random() * 899 + 100);
      const providerSlug = `${baseSlug}-${uniqueSuffix}`;
      const providerId = 'prov_' + crypto.randomUUID().slice(0, 10);

      await db.prepare(`
        INSERT INTO service_providers (
          id, user_id, category_id, business_name, slug, avatar_url, banner_url,
          description, phone, whatsapp, neighborhoods_json, city, state,
          hourly_rate_estimate, is_approved, is_featured
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, 'Canaã dos Carajás', 'PA',
          ?, 1, 0
        )
      `).bind(
        providerId, userId, body?.category_id || 'cat_serv_reformas', businessName, providerSlug,
        body?.avatar_url || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=200&h=200&fit=crop&q=80',
        body?.banner_url || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&h=400&fit=crop&q=80',
        body?.description || `Serviços profissionais de ${businessName} em Canaã dos Carajás.`,
        phone || null, body?.whatsapp || phone || null,
        JSON.stringify([body?.neighborhood || 'Todos os bairros de Canaã dos Carajás']),
        Number(body?.hourly_rate_estimate) || 90.00
      ).run();
      createdProvider = await db.prepare('SELECT * FROM service_providers WHERE id = ?').bind(providerId).first();
    }

    const token = await createSession(db, userId);
    const user = await getUserByToken(db, token);

    return {
      status: 201,
      data: {
        success: true,
        token,
        user,
        store: createdStore,
        provider: createdProvider,
        courier: createdCourier
      }
    };
  }

  // POST /api/auth/login
  if (method === 'POST' && path === '/api/auth/login') {
    const { email, password } = body || {};
    if (!email || !password) {
      return { status: 400, data: { error: 'Email e senha são obrigatórios.' } };
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const userRecord = await db.prepare('SELECT * FROM users WHERE email = ?').bind(cleanEmail).first<any>();

    if (!userRecord || !userRecord.is_active) {
      return { status: 401, data: { error: 'Credenciais inválidas ou conta inativa.' } };
    }

    const isValid = await verifyPassword(password, userRecord.salt, userRecord.password_hash);
    if (!isValid) {
      return { status: 401, data: { error: 'Credenciais inválidas.' } };
    }

    const token = await createSession(db, userRecord.id);
    const user: User = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      phone: userRecord.phone,
      role: userRecord.role as UserRole,
      is_active: userRecord.is_active,
      created_at: userRecord.created_at,
      updated_at: userRecord.updated_at
    };

    return { status: 200, data: { success: true, token, user } };
  }

  // POST /api/auth/quick-switch (Demo switcher for seamless test experience)
  if (method === 'POST' && path === '/api/auth/quick-switch') {
    const { role } = body || {};
    const validRoles = ['superadmin', 'admin', 'lojista', 'prestador', 'entregador', 'cliente'];
    if (!validRoles.includes(role)) {
      return { status: 400, data: { error: 'Perfil inválido para troca rápida.' } };
    }

    const userRecord = await db.prepare('SELECT * FROM users WHERE role = ? AND is_active = 1 LIMIT 1').bind(role).first<any>();
    if (!userRecord) {
      return { status: 404, data: { error: `Nenhum usuário com perfil ${role} encontrado.` } };
    }

    const token = await createSession(db, userRecord.id);
    const user: User = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      phone: userRecord.phone,
      role: userRecord.role as UserRole,
      is_active: userRecord.is_active,
      created_at: userRecord.created_at,
      updated_at: userRecord.updated_at
    };

    return { status: 200, data: { success: true, token, user } };
  }

  // GET /api/auth/me
  if (method === 'GET' && path === '/api/auth/me') {
    const authHeader = headers['authorization'] || headers['Authorization'];
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    const user = await getUserByToken(db, token);

    if (!user) {
      return { status: 200, data: { user: null } };
    }

    // Check if user has an associated store or provider profile
    let store = null;
    let provider = null;
    let courier = null;

    if (user.role === 'lojista' || user.role === 'superadmin' || user.role === 'admin') {
      store = await db.prepare('SELECT * FROM stores WHERE user_id = ?').bind(user.id).first();
    }
    if (user.role === 'prestador' || user.role === 'superadmin' || user.role === 'admin') {
      provider = await db.prepare('SELECT * FROM service_providers WHERE user_id = ?').bind(user.id).first();
    }
    if (user.role === 'entregador' || user.role === 'superadmin' || user.role === 'admin') {
      courier = await db.prepare('SELECT * FROM couriers WHERE user_id = ?').bind(user.id).first();
    }

    return { status: 200, data: { user, store, provider, courier } };
  }

  // POST /api/auth/logout
  if (method === 'POST' && path === '/api/auth/logout') {
    const authHeader = headers['authorization'] || headers['Authorization'];
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    if (token) {
      await deleteSession(db, token);
    }
    return { status: 200, data: { success: true } };
  }

  // GET /api/auth/addresses
  if (method === 'GET' && path === '/api/auth/addresses') {
    if (!req.user) {
      return { status: 401, data: { error: 'Autenticação necessária.' } };
    }
    const { results } = await db.prepare('SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').bind(req.user.id).all();
    return { status: 200, data: { addresses: results } };
  }

  // POST /api/auth/addresses
  if (method === 'POST' && path === '/api/auth/addresses') {
    if (!req.user) {
      return { status: 401, data: { error: 'Autenticação necessária.' } };
    }
    const { label, street, number, complement, neighborhood, reference_point, is_default } = body || {};
    if (!street || !number || !neighborhood) {
      return { status: 400, data: { error: 'Rua, número e bairro são obrigatórios.' } };
    }

    if (is_default) {
      await db.prepare('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?').bind(req.user.id).run();
    }

    const addrId = 'addr_' + crypto.randomUUID().slice(0, 10);
    await db.prepare(`
      INSERT INTO user_addresses (id, user_id, label, street, number, complement, neighborhood, city, state, zip_code, reference_point, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Canaã dos Carajás', 'PA', '68537-000', ?, ?)
    `).bind(addrId, req.user.id, label || 'Principal', street, number, complement || null, neighborhood, reference_point || null, is_default ? 1 : 0).run();

    return { status: 201, data: { success: true, id: addrId } };
  }

  return null;
}
