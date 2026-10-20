// Shop Carajás - Service Providers Platform, Quotes & Scheduling
import { DatabaseAdapter } from '../db';
import { User } from '../types';

export async function handleServicesRoutes(req: { method: string; path: string; query?: any; body?: any; user?: User | null }, db: DatabaseAdapter) {
  const { method, path, query, body, user } = req;

  // GET /api/services/providers (Directory of local professionals)
  if (method === 'GET' && path === '/api/services/providers') {
    const category = query?.category;
    const search = query?.search;
    const neighborhood = query?.neighborhood;

    let sql = `
      SELECT sp.*, sc.name as category_name, sc.slug as category_slug
      FROM service_providers sp
      JOIN service_categories sc ON sc.id = sp.category_id
      WHERE sp.is_approved = 1
    `;
    const params: any[] = [];

    if (category) {
      sql += ' AND (sc.slug = ? OR sp.category_id = ?)';
      params.push(category, category);
    }
    if (search) {
      sql += ' AND (sp.business_name LIKE ? OR sp.specialty LIKE ? OR sp.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (neighborhood) {
      sql += ' AND (sp.neighborhoods_json LIKE ?)';
      params.push(`%${neighborhood}%`);
    }

    sql += ' ORDER BY sp.is_featured DESC, sp.rating_average DESC, sp.business_name ASC';
    const { results } = await db.prepare(sql).bind(...params).all();

    return { status: 200, data: { providers: results } };
  }

  // GET /api/services/providers/:slug (Provider profile)
  const providerSlugMatch = path.match(/^\/api\/services\/providers\/([a-zA-Z0-9_-]+)$/);
  if (method === 'GET' && providerSlugMatch) {
    const slug = providerSlugMatch[1];
    const provider = await db.prepare(`
      SELECT sp.*, sc.name as category_name, sc.slug as category_slug
      FROM service_providers sp
      JOIN service_categories sc ON sc.id = sp.category_id
      WHERE sp.slug = ?
    `).bind(slug).first<any>();

    if (!provider) {
      return { status: 404, data: { error: 'Prestador de serviços não encontrado.' } };
    }

    const reviews = await db.prepare(`
      SELECT r.*, u.name as user_name
      FROM reviews r
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.target_type = 'provider' AND r.target_id = ? AND r.is_published = 1
      ORDER BY r.created_at DESC
      LIMIT 10
    `).bind(provider.id).all();

    return {
      status: 200,
      data: {
        provider,
        reviews: reviews.results
      }
    };
  }

  // ==================== QUOTE REQUESTS (ORÇAMENTOS) ====================

  // POST /api/services/quotes (Client submits budget request)
  if (method === 'POST' && path === '/api/services/quotes') {
    if (!user) return { status: 401, data: { error: 'Faça login para solicitar um orçamento.' } };

    const { provider_id, service_title, description, neighborhood, preferred_date, urgency = 'media', photos } = body || {};
    if (!provider_id || !service_title || !description || !neighborhood) {
      return { status: 400, data: { error: 'Prestador, título do serviço, descrição e bairro são obrigatórios.' } };
    }

    const quoteId = 'quote_' + crypto.randomUUID().slice(0, 10);
    const quoteCode = 'ORC-' + Math.floor(1000 + Math.random() * 9000);

    await db.prepare(`
      INSERT INTO quote_requests (
        id, quote_code, user_id, provider_id, service_title, description,
        neighborhood, preferred_date, urgency, photos_json, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      quoteId, quoteCode, user.id, provider_id, service_title, description,
      neighborhood, preferred_date || null, urgency, JSON.stringify(photos || [])
    ).run();

    // Create persistent in-app notification for the provider
    const prov = await db.prepare('SELECT user_id, business_name FROM service_providers WHERE id = ?').bind(provider_id).first<any>();
    if (prov) {
      await db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, link_url)
        VALUES (?, ?, 'Nova Solicitação de Orçamento!', ?, '/painel/prestador/orcamentos')
      `).bind(
        'notif_' + crypto.randomUUID().slice(0, 8),
        prov.user_id,
        `${user.name} solicitou orçamento para "${service_title}" no bairro ${neighborhood}.`
      ).run();
    }

    return { status: 201, data: { success: true, quoteCode, quoteId } };
  }

  // GET /api/services/quotes/my-requests (Client's requested quotes)
  if (method === 'GET' && path === '/api/services/quotes/my-requests') {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };

    const { results: quotes } = await db.prepare(`
      SELECT qr.*, sp.business_name as provider_name, sp.slug as provider_slug,
             sp.phone as provider_phone, sp.whatsapp as provider_whatsapp,
             sp.photo_url as provider_photo
      FROM quote_requests qr
      JOIN service_providers sp ON sp.id = qr.provider_id
      WHERE qr.user_id = ?
      ORDER BY qr.created_at DESC
    `).bind(user.id).all();

    for (const q of (quotes as any[])) {
      const proposals = await db.prepare('SELECT * FROM quote_proposals WHERE quote_request_id = ?').bind(q.id).all();
      q.proposals = proposals.results;
    }

    return { status: 200, data: { quotes } };
  }

  // GET /api/services/quotes/provider-inbox (Provider's received quotes)
  if (method === 'GET' && path === '/api/services/quotes/provider-inbox') {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };

    const provider = await db.prepare('SELECT id FROM service_providers WHERE user_id = ?').bind(user.id).first<any>();
    if (!provider) return { status: 403, data: { error: 'Perfil de prestador não encontrado.' } };

    const { results: quotes } = await db.prepare(`
      SELECT qr.*, u.name as client_name, u.phone as client_phone, u.email as client_email
      FROM quote_requests qr
      JOIN users u ON u.id = qr.user_id
      WHERE qr.provider_id = ?
      ORDER BY qr.created_at DESC
    `).bind(provider.id).all();

    for (const q of (quotes as any[])) {
      const proposals = await db.prepare('SELECT * FROM quote_proposals WHERE quote_request_id = ?').bind(q.id).all();
      q.proposals = proposals.results;
    }

    return { status: 200, data: { quotes } };
  }

  // POST /api/services/quotes/:id/proposals (Provider submits formal proposal)
  const proposalMatch = path.match(/^\/api\/services\/quotes\/([a-zA-Z0-9_-]+)\/proposals$/);
  if (method === 'POST' && proposalMatch) {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };

    const provider = await db.prepare('SELECT id, business_name FROM service_providers WHERE user_id = ?').bind(user.id).first<any>();
    if (!provider) return { status: 403, data: { error: 'Apenas prestadores podem enviar propostas.' } };

    const quoteId = proposalMatch[1];
    const { proposal_text, estimated_price, materials_included, estimated_days, valid_until } = body || {};

    if (!proposal_text || !estimated_price) {
      return { status: 400, data: { error: 'Descrição da proposta e valor estimado são obrigatórios.' } };
    }

    const proposalId = 'prop_' + crypto.randomUUID().slice(0, 10);
    await db.prepare(`
      INSERT INTO quote_proposals (
        id, quote_request_id, provider_id, proposal_text, estimated_price,
        materials_included, estimated_days, valid_until, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      proposalId, quoteId, provider.id, proposal_text, Number(estimated_price),
      materials_included ? 1 : 0, Number(estimated_days) || 1, valid_until || null
    ).run();

    await db.prepare("UPDATE quote_requests SET status = 'answered', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(quoteId).run();

    // Notify client
    const quoteReq = await db.prepare('SELECT user_id, service_title FROM quote_requests WHERE id = ?').bind(quoteId).first<any>();
    if (quoteReq) {
      await db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, link_url)
        VALUES (?, ?, 'Proposta de Orçamento Recebida!', ?, '/painel/cliente/orcamentos')
      `).bind(
        'notif_' + crypto.randomUUID().slice(0, 8),
        quoteReq.user_id,
        `${provider.business_name} enviou uma proposta de R$ ${Number(estimated_price).toFixed(2)} para "${quoteReq.service_title}".`
      ).run();
    }

    return { status: 201, data: { success: true, proposalId } };
  }

  // POST /api/services/proposals/:id/respond (Client accepts or rejects proposal)
  const respondProposalMatch = path.match(/^\/api\/services\/proposals\/([a-zA-Z0-9_-]+)\/respond$/);
  if (method === 'POST' && respondProposalMatch) {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };

    const proposalId = respondProposalMatch[1];
    const { action } = body || {}; // 'accept' | 'reject'

    if (action !== 'accept' && action !== 'reject') {
      return { status: 400, data: { error: 'Ação inválida.' } };
    }

    const proposal = await db.prepare(`
      SELECT p.*, q.user_id as client_id, q.id as quote_id
      FROM quote_proposals p
      JOIN quote_requests q ON q.id = p.quote_request_id
      WHERE p.id = ?
    `).bind(proposalId).first<any>();

    if (!proposal || proposal.client_id !== user.id) {
      return { status: 403, data: { error: 'Acesso negado à proposta.' } };
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    await db.prepare('UPDATE quote_proposals SET status = ? WHERE id = ?').bind(newStatus, proposalId).run();
    await db.prepare('UPDATE quote_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(newStatus, proposal.quote_id).run();

    return { status: 200, data: { success: true, status: newStatus } };
  }

  // ==================== SCHEDULING (AGENDAMENTO) ====================

  // POST /api/services/schedules (Book an appointment)
  if (method === 'POST' && path === '/api/services/schedules') {
    if (!user) return { status: 401, data: { error: 'Faça login para agendar um serviço.' } };

    const { provider_id, service_name, scheduled_date, scheduled_time_slot, client_phone, notes } = body || {};
    if (!provider_id || !service_name || !scheduled_date || !scheduled_time_slot) {
      return { status: 400, data: { error: 'Prestador, serviço, data e horário são obrigatórios.' } };
    }

    // Double booking check: Ensure slot isn't already booked for this provider
    const existing = await db.prepare(`
      SELECT id FROM service_schedules
      WHERE provider_id = ? AND scheduled_date = ? AND scheduled_time_slot = ? AND status != 'cancelled'
    `).bind(provider_id, scheduled_date, scheduled_time_slot).first();

    if (existing) {
      return { status: 409, data: { error: 'Este horário já foi reservado. Por favor escolha outro horário disponível.' } };
    }

    const scheduleId = 'sched_' + crypto.randomUUID().slice(0, 10);
    await db.prepare(`
      INSERT INTO service_schedules (
        id, provider_id, user_id, client_name, client_phone,
        service_name, scheduled_date, scheduled_time_slot, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'requested', ?)
    `).bind(
      scheduleId, provider_id, user.id, user.name, client_phone || user.phone || '',
      service_name, scheduled_date, scheduled_time_slot, notes || null
    ).run();

    return { status: 201, data: { success: true, scheduleId } };
  }

  // GET /api/services/schedules/my-schedules
  if (method === 'GET' && path === '/api/services/schedules/my-schedules') {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };

    // Fetch for client or provider
    const provider = await db.prepare('SELECT id FROM service_providers WHERE user_id = ?').bind(user.id).first<any>();

    let results = [];
    if (provider) {
      const res = await db.prepare(`
        SELECT ss.*, sp.business_name as provider_name
        FROM service_schedules ss
        JOIN service_providers sp ON sp.id = ss.provider_id
        WHERE ss.provider_id = ? OR ss.user_id = ?
        ORDER BY ss.scheduled_date DESC, ss.scheduled_time_slot ASC
      `).bind(provider.id, user.id).all();
      results = res.results;
    } else {
      const res = await db.prepare(`
        SELECT ss.*, sp.business_name as provider_name, sp.phone as provider_phone
        FROM service_schedules ss
        JOIN service_providers sp ON sp.id = ss.provider_id
        WHERE ss.user_id = ?
        ORDER BY ss.scheduled_date DESC, ss.scheduled_time_slot ASC
      `).bind(user.id).all();
      results = res.results;
    }

    return { status: 200, data: { schedules: results } };
  }

  // PATCH /api/services/schedules/:id/status
  const schedStatusMatch = path.match(/^\/api\/services\/schedules\/([a-zA-Z0-9_-]+)\/status$/);
  if (method === 'PATCH' && schedStatusMatch) {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };

    const scheduleId = schedStatusMatch[1];
    const { status } = body || {};
    const valid = ['requested', 'confirmed', 'completed', 'cancelled'];
    if (!valid.includes(status)) {
      return { status: 400, data: { error: 'Status inválido.' } };
    }

    await db.prepare('UPDATE service_schedules SET status = ? WHERE id = ?').bind(status, scheduleId).run();
    return { status: 200, data: { success: true, status } };
  }

  return null;
}
