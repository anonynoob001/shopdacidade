// Shop Carajás - Auth Routes & Security (2FA / Anti-Brute Force)
import QRCode from 'qrcode';
import { DatabaseAdapter } from '../db';
import {
  checkLoginRateLimit,
  clearFailedLogin,
  createSession,
  createTemp2FASession,
  deleteSession,
  generateBackupCodes,
  generateSalt,
  generateTwoFactorSecret,
  getOtpauthUri,
  getUserByToken,
  hashPassword,
  recordFailedLogin,
  verifyPassword,
  verifyTemp2FASession,
  verifyTotp
} from '../services/auth';
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
        '#0047F7',
        '#071536'
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

  // POST /api/auth/login (with Anti-Brute Force Rate Limiting & 2FA support)
  if (method === 'POST' && path === '/api/auth/login') {
    const { email, password } = body || {};
    if (!email || !password) {
      return { status: 400, data: { error: 'Email e senha são obrigatórios.' } };
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Anti-brute force rate limiting check
    const rateCheck = checkLoginRateLimit(cleanEmail);
    if (!rateCheck.allowed) {
      return {
        status: 429,
        data: {
          error: `Muitas tentativas incorretas. Conta temporariamente bloqueada por segurança. Tente novamente em ${rateCheck.waitMinutes} minutos.`
        }
      };
    }

    let userRecord = await db.prepare('SELECT * FROM users WHERE email = ?').bind(cleanEmail).first<any>();

    // Self-healing for admin & demo users if table was empty or not yet seeded
    if (!userRecord && (cleanEmail === 'admin@shopcarajas.com.br' || cleanEmail === 'admin@shopdacidade.com.br')) {
      const superHash = '78552bef20048edb3a63905a4adfa1908f7c3ccc4b6fe4af83a87d2a8849e751';
      try {
        await db.prepare(`
          INSERT INTO users (id, name, email, password_hash, salt, phone, role, is_active)
          VALUES ('usr_superadmin', 'Administrador Shop da Cidade', ?, ?, 's_seed_1', '(94) 99100-0001', 'superadmin', 1)
        `).bind(cleanEmail, superHash).run();
        userRecord = await db.prepare('SELECT * FROM users WHERE email = ?').bind(cleanEmail).first<any>();
      } catch (_) {}
    }

    if (!userRecord || !userRecord.is_active) {
      recordFailedLogin(cleanEmail);
      return { status: 401, data: { error: 'Credenciais inválidas ou conta inativa.' } };
    }

    const isValid = await verifyPassword(password, userRecord.salt, userRecord.password_hash);
    if (!isValid) {
      recordFailedLogin(cleanEmail);
      return { status: 401, data: { error: 'Credenciais inválidas.' } };
    }

    // Auto-upgrade password hash to modern PBKDF2 if user used a legacy password
    if (isValid && userRecord.password_hash !== await hashPassword(password, userRecord.salt)) {
      try {
        const modernHash = await hashPassword(password, userRecord.salt);
        await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(modernHash, userRecord.id).run();
      } catch (_) {}
    }

    // Success - clear failed attempt counters
    clearFailedLogin(cleanEmail);

    // Check if user has 2FA (Two-Factor Authentication) enabled
    if (userRecord.two_factor_enabled && userRecord.two_factor_secret) {
      const tempToken = createTemp2FASession(userRecord.id);
      return {
        status: 200,
        data: {
          success: true,
          two_factor_required: true,
          temp_token: tempToken,
          message: 'Autenticação em duas etapas necessária. Digite o código de 6 dígitos do seu aplicativo autenticador.'
        }
      };
    }

    // Standard login without 2FA
    const token = await createSession(db, userRecord.id);
    const user: User = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      phone: userRecord.phone,
      role: userRecord.role as UserRole,
      is_active: userRecord.is_active,
      two_factor_enabled: Boolean(userRecord.two_factor_enabled),
      created_at: userRecord.created_at,
      updated_at: userRecord.updated_at
    };

    return { status: 200, data: { success: true, token, user } };
  }

  // POST /api/auth/login-2fa (Verify 2FA TOTP or Backup Code to finalize login)
  if (method === 'POST' && path === '/api/auth/login-2fa') {
    const { temp_token, code } = body || {};
    if (!temp_token || !code) {
      return { status: 400, data: { error: 'Token temporário e código de 6 dígitos são obrigatórios.' } };
    }

    const userId = verifyTemp2FASession(temp_token);
    if (!userId) {
      return { status: 401, data: { error: 'Sessão temporária de 2FA expirada ou inválida. Por favor, tente fazer login novamente.' } };
    }

    const userRecord = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<any>();
    if (!userRecord || !userRecord.is_active) {
      return { status: 401, data: { error: 'Usuário não encontrado ou inativo.' } };
    }

    const cleanCode = String(code).trim().toUpperCase();
    let isCodeValid = false;

    // First, verify as standard 6-digit TOTP
    if (/^\d{6}$/.test(cleanCode) && userRecord.two_factor_secret) {
      isCodeValid = await verifyTotp(userRecord.two_factor_secret, cleanCode);
    }

    // If TOTP fails, check if it's an emergency backup code
    if (!isCodeValid && userRecord.two_factor_backup_codes) {
      try {
        const backupCodes: string[] = JSON.parse(userRecord.two_factor_backup_codes);
        const codeIndex = backupCodes.findIndex(c => c.replace(/-/g, '').toUpperCase() === cleanCode.replace(/-/g, ''));
        if (codeIndex !== -1) {
          isCodeValid = true;
          // Consume the used backup code
          backupCodes.splice(codeIndex, 1);
          await db.prepare('UPDATE users SET two_factor_backup_codes = ? WHERE id = ?')
            .bind(JSON.stringify(backupCodes), userId).run();
        }
      } catch (_) {}
    }

    if (!isCodeValid) {
      // Re-create temp session so user can retry typing the code
      const newTempToken = createTemp2FASession(userId);
      return {
        status: 401,
        data: {
          error: 'Código de 2FA inválido ou expirado. Verifique o relógio do seu celular ou use um código reserva.',
          temp_token: newTempToken
        }
      };
    }

    const token = await createSession(db, userRecord.id);
    const user: User = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      phone: userRecord.phone,
      role: userRecord.role as UserRole,
      is_active: userRecord.is_active,
      two_factor_enabled: true,
      created_at: userRecord.created_at,
      updated_at: userRecord.updated_at
    };

    return { status: 200, data: { success: true, token, user } };
  }

  // GET /api/auth/2fa/setup (Generate secret, OTP URI, and scannable QR Code for Authenticator app)
  if (method === 'GET' && path === '/api/auth/2fa/setup') {
    if (!req.user) {
      return { status: 401, data: { error: 'Autenticação necessária.' } };
    }

    const secret = generateTwoFactorSecret();
    const backupCodes = generateBackupCodes(6);
    const otpauthUri = getOtpauthUri(secret, req.user.email, 'Shop da Cidade');
    
    // Generate standard QR code data URL (image/png base64) for any mobile camera or authenticator
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
      width: 256,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    return {
      status: 200,
      data: {
        success: true,
        secret,
        otpauth_uri: otpauthUri,
        qr_code_data_url: qrCodeDataUrl,
        backup_codes: backupCodes
      }
    };
  }

  // POST /api/auth/2fa/verify-activate (Confirm activation by verifying first 6-digit code)
  if (method === 'POST' && path === '/api/auth/2fa/verify-activate') {
    if (!req.user) {
      return { status: 401, data: { error: 'Autenticação necessária.' } };
    }

    const { secret, code, backup_codes } = body || {};
    if (!secret || !code) {
      return { status: 400, data: { error: 'Chave secreta e código de 6 dígitos são obrigatórios.' } };
    }

    const isValid = await verifyTotp(secret, String(code));
    if (!isValid) {
      return { status: 400, data: { error: 'Código de 6 dígitos inválido. Certifique-se de que digitou o código gerado pelo aplicativo autenticador.' } };
    }

    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE users 
      SET two_factor_enabled = 1, two_factor_secret = ?, two_factor_backup_codes = ?, updated_at = ?
      WHERE id = ?
    `).bind(secret, JSON.stringify(backup_codes || []), now, req.user.id).run();

    return {
      status: 200,
      data: {
        success: true,
        message: 'Autenticação de Dois Fatores (2FA) ativada com sucesso! Sua conta agora está protegida.'
      }
    };
  }

  // POST /api/auth/2fa/disable (Disable 2FA after password confirmation)
  if (method === 'POST' && path === '/api/auth/2fa/disable') {
    if (!req.user) {
      return { status: 401, data: { error: 'Autenticação necessária.' } };
    }

    const { password } = body || {};
    if (!password) {
      return { status: 400, data: { error: 'Senha de acesso é obrigatória para desativar o 2FA.' } };
    }

    const userRecord = await db.prepare('SELECT * FROM users WHERE id = ?').bind(req.user.id).first<any>();
    if (!userRecord) {
      return { status: 404, data: { error: 'Usuário não encontrado.' } };
    }

    const isValid = await verifyPassword(password, userRecord.salt, userRecord.password_hash);
    if (!isValid) {
      return { status: 401, data: { error: 'Senha incorreta.' } };
    }

    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE users 
      SET two_factor_enabled = 0, two_factor_secret = NULL, two_factor_backup_codes = NULL, updated_at = ?
      WHERE id = ?
    `).bind(now, req.user.id).run();

    return {
      status: 200,
      data: {
        success: true,
        message: 'Autenticação de Dois Fatores (2FA) desativada com sucesso.'
      }
    };
  }

  // POST /api/auth/change-password
  if (method === 'POST' && path === '/api/auth/change-password') {
    if (!req.user) {
      return { status: 401, data: { error: 'Autenticação necessária.' } };
    }
    const { current_password, new_password } = body || {};
    if (!current_password || !new_password) {
      return { status: 400, data: { error: 'Senha atual e nova senha são obrigatórias.' } };
    }
    if (String(new_password).length < 6) {
      return { status: 400, data: { error: 'A nova senha deve ter no mínimo 6 caracteres.' } };
    }

    const userRecord = await db.prepare('SELECT * FROM users WHERE id = ?').bind(req.user.id).first<any>();
    if (!userRecord) {
      return { status: 404, data: { error: 'Usuário não encontrado.' } };
    }

    const isValid = await verifyPassword(current_password, userRecord.salt, userRecord.password_hash);
    if (!isValid) {
      return { status: 401, data: { error: 'Senha atual incorreta.' } };
    }

    const newSalt = generateSalt();
    const newHash = await hashPassword(new_password, newSalt);
    const now = new Date().toISOString();

    await db.prepare('UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?')
      .bind(newHash, newSalt, now, req.user.id).run();

    return { status: 200, data: { success: true, message: 'Senha atualizada com sucesso!' } };
  }

  // GET /api/auth/me
  if (method === 'GET' && path === '/api/auth/me') {
    try {
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

      try {
        if (user.role === 'lojista' || user.role === 'superadmin' || user.role === 'admin') {
          store = await db.prepare('SELECT * FROM stores WHERE user_id = ?').bind(user.id).first();
        }
      } catch (_) {}
      try {
        if (user.role === 'prestador' || user.role === 'superadmin' || user.role === 'admin') {
          provider = await db.prepare('SELECT * FROM service_providers WHERE user_id = ?').bind(user.id).first();
        }
      } catch (_) {}
      try {
        if (user.role === 'entregador' || user.role === 'superadmin' || user.role === 'admin') {
          courier = await db.prepare('SELECT * FROM couriers WHERE user_id = ?').bind(user.id).first();
        }
      } catch (_) {}

      return { status: 200, data: { user, store, provider, courier } };
    } catch {
      return { status: 200, data: { user: null, store: null, provider: null, courier: null } };
    }
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
