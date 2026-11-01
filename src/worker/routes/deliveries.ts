// Shop Carajás - Couriers & Deliveries Module (Local Couriers & Vainabag Delivery API)
import { DatabaseAdapter } from '../db';
import { getVainabagService } from '../services/vainabag';
import { User } from '../types';

export async function handleDeliveriesRoutes(req: { method: string; path: string; body?: any; user?: User | null }, db: DatabaseAdapter) {
  const { method, path, body, user } = req;

  // GET /api/couriers/profile
  if (method === 'GET' && path === '/api/couriers/profile') {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };

    let courier = await db.prepare(`
      SELECT c.*, u.name as user_name, u.phone as user_phone, u.email as user_email
      FROM couriers c
      JOIN users u ON u.id = c.user_id
      WHERE c.user_id = ?
    `).bind(user.id).first<any>();

    // If user is admin or entregador without courier row, create one
    if (!courier && (user.role === 'entregador' || user.role === 'superadmin' || user.role === 'admin')) {
      const courierId = 'courier_' + crypto.randomUUID().slice(0, 8);
      await db.prepare(`
        INSERT INTO couriers (id, user_id, vehicle_type, is_available, is_approved, current_location_name, total_deliveries, balance)
        VALUES (?, ?, 'moto', 1, 1, 'Centro - Canaã dos Carajás', 0, 0)
      `).bind(courierId, user.id).run();

      courier = await db.prepare('SELECT * FROM couriers WHERE id = ?').bind(courierId).first<any>();
    }

    if (!courier) {
      return { status: 404, data: { error: 'Perfil de entregador não encontrado.' } };
    }

    return { status: 200, data: { courier } };
  }

  // POST /api/couriers/availability (Toggle online / offline)
  if (method === 'POST' && path === '/api/couriers/availability') {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };
    const { is_available, current_location } = body || {};

    await db.prepare(`
      UPDATE couriers SET
        is_available = ?,
        current_location_name = COALESCE(?, current_location_name),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(is_available ? 1 : 0, current_location || null, user.id).run();

    return { status: 200, data: { success: true, is_available: !!is_available } };
  }

  // GET /api/deliveries/available (Deliveries available for courier pickup)
  if (method === 'GET' && path === '/api/deliveries/available') {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };

    const { results } = await db.prepare(`
      SELECT d.*, so.sub_order_code, s.name as store_name, s.neighborhood as store_neighborhood,
             s.phone as store_phone
      FROM deliveries d
      JOIN sub_orders so ON so.id = d.sub_order_id
      JOIN stores s ON s.id = so.store_id
      WHERE d.status = 'waiting_courier'
      ORDER BY d.created_at ASC
    `).all();

    return { status: 200, data: { deliveries: results } };
  }

  // GET /api/deliveries/my-active (Deliveries accepted by this courier)
  if (method === 'GET' && path === '/api/deliveries/my-active') {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };

    const courier = await db.prepare('SELECT id FROM couriers WHERE user_id = ?').bind(user.id).first<any>();
    if (!courier) return { status: 403, data: { error: 'Apenas entregadores credenciados podem acessar.' } };

    const { results } = await db.prepare(`
      SELECT d.*, so.sub_order_code, s.name as store_name, s.phone as store_phone,
             s.neighborhood as store_neighborhood, o.order_code
      FROM deliveries d
      JOIN sub_orders so ON so.id = d.sub_order_id
      JOIN stores s ON s.id = so.store_id
      JOIN orders o ON o.id = so.order_id
      WHERE d.courier_id = ? AND d.status NOT IN ('delivered', 'cancelled')
      ORDER BY d.created_at DESC
    `).bind(courier.id).all();

    return { status: 200, data: { deliveries: results } };
  }

  // GET /api/deliveries/my-history
  if (method === 'GET' && path === '/api/deliveries/my-history') {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };

    const courier = await db.prepare('SELECT id FROM couriers WHERE user_id = ?').bind(user.id).first<any>();
    if (!courier) return { status: 403, data: { error: 'Apenas entregadores credenciados podem acessar.' } };

    const { results } = await db.prepare(`
      SELECT d.*, so.sub_order_code, s.name as store_name, o.order_code
      FROM deliveries d
      JOIN sub_orders so ON so.id = d.sub_order_id
      JOIN stores s ON s.id = so.store_id
      JOIN orders o ON o.id = so.order_id
      WHERE d.courier_id = ? AND d.status = 'delivered'
      ORDER BY d.delivered_time DESC
      LIMIT 30
    `).bind(courier.id).all();

    return { status: 200, data: { deliveries: results } };
  }

  // POST /api/deliveries/:id/accept (Atomic accept: prevents concurrency)
  const acceptMatch = path.match(/^\/api\/deliveries\/([a-zA-Z0-9_-]+)\/accept$/);
  if (method === 'POST' && acceptMatch) {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };

    const courier = await db.prepare('SELECT id FROM couriers WHERE user_id = ?').bind(user.id).first<any>();
    if (!courier) return { status: 403, data: { error: 'Perfil de entregador não encontrado.' } };

    const deliveryId = acceptMatch[1];

    // Atomically claim delivery only if status is still 'waiting_courier'
    const claimRes = await db.prepare(`
      UPDATE deliveries 
      SET status = 'accepted', courier_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'waiting_courier'
    `).bind(courier.id, deliveryId).run();

    // Check if updated
    const delivery = await db.prepare('SELECT * FROM deliveries WHERE id = ?').bind(deliveryId).first<any>();
    if (!delivery || delivery.courier_id !== courier.id) {
      return { status: 409, data: { error: 'Esta entrega já foi assumida por outro entregador.' } };
    }

    // Also link courier to sub_order
    await db.prepare('UPDATE sub_orders SET courier_id = ? WHERE id = ?').bind(courier.id, delivery.sub_order_id).run();

    return { status: 200, data: { success: true, delivery } };
  }

  // POST /api/deliveries/:id/status (Advance state: heading_to_store, picked_up, in_transit, delivered)
  const statusMatch = path.match(/^\/api\/deliveries\/([a-zA-Z0-9_-]+)\/status$/);
  if (method === 'POST' && statusMatch) {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };

    const courier = await db.prepare('SELECT id FROM couriers WHERE user_id = ?').bind(user.id).first<any>();
    if (!courier) return { status: 403, data: { error: 'Acesso restrito.' } };

    const deliveryId = statusMatch[1];
    const { status } = body || {};
    const validFlow = ['heading_to_store', 'picked_up', 'in_transit', 'delivered', 'cancelled'];

    if (!validFlow.includes(status)) {
      return { status: 400, data: { error: 'Status de entrega inválido.' } };
    }

    const delivery = await db.prepare('SELECT * FROM deliveries WHERE id = ? AND courier_id = ?').bind(deliveryId, courier.id).first<any>();
    if (!delivery) {
      return { status: 404, data: { error: 'Entrega não encontrada ou não atribuída a você.' } };
    }

    let extraSql = '';
    const extraParams: any[] = [];

    if (status === 'picked_up') {
      extraSql = ', pickup_time = CURRENT_TIMESTAMP';
      await db.prepare("UPDATE sub_orders SET status = 'out_for_delivery' WHERE id = ?").bind(delivery.sub_order_id).run();
    } else if (status === 'delivered') {
      extraSql = ', delivered_time = CURRENT_TIMESTAMP';
      await db.prepare("UPDATE sub_orders SET status = 'delivered' WHERE id = ?").bind(delivery.sub_order_id).run();
      // Credit courier earnings
      await db.prepare(`
        UPDATE couriers SET
          total_deliveries = total_deliveries + 1,
          balance = balance + ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(delivery.courier_earnings, courier.id).run();
    }

    await db.prepare(`
      UPDATE deliveries SET status = ?, updated_at = CURRENT_TIMESTAMP ${extraSql}
      WHERE id = ?
    `).bind(status, ...extraParams, deliveryId).run();

    return { status: 200, data: { success: true, status } };
  }

  // GET /api/deliveries/vainabag/status
  if (method === 'GET' && path === '/api/deliveries/vainabag/status') {
    const vainabag = await getVainabagService(db);
    const settingsRows = await db.prepare("SELECT key, value FROM platform_settings WHERE key LIKE 'vainabag_%'").all<any>();
    const conf: Record<string, string> = {};
    for (const r of settingsRows?.results || []) conf[r.key] = r.value;

    return {
      status: 200,
      data: {
        is_configured: vainabag.isConfigured(),
        environment: conf['vainabag_env'] || 'sandbox',
        client_id_masked: conf['vainabag_client_id'] ? `${conf['vainabag_client_id'].slice(0, 6)}...` : '',
        store_code: conf['vainabag_store_code'] || ''
      }
    };
  }

  // POST /api/deliveries/vainabag/quote (Estimate delivery fee)
  if (method === 'POST' && path === '/api/deliveries/vainabag/quote') {
    const { neighborhood, package_value = 50 } = body || {};
    const vainabag = await getVainabagService(db);
    const quote = await vainabag.estimateDeliveryFee({
      neighborhood: neighborhood || 'Centro',
      packageValue: Number(package_value)
    });
    return { status: 200, data: quote };
  }

  // POST /api/deliveries/vainabag/dispatch (Dispatch order delivery to Vainabag)
  if (method === 'POST' && path === '/api/deliveries/vainabag/dispatch') {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };

    const { sub_order_id } = body || {};
    if (!sub_order_id) {
      return { status: 400, data: { error: 'ID do pedido obrigatório.' } };
    }

    const subOrder = await db.prepare(`
      SELECT so.*, s.name as store_name, s.neighborhood as store_neighborhood,
             o.customer_name, o.customer_phone, o.customer_street, o.customer_number,
             o.customer_neighborhood, o.payment_method
      FROM sub_orders so
      JOIN stores s ON s.id = so.store_id
      JOIN orders o ON o.id = so.order_id
      WHERE so.id = ?
    `).bind(sub_order_id).first<any>();

    if (!subOrder) {
      return { status: 404, data: { error: 'Pedido não encontrado.' } };
    }

    const items = await db.prepare('SELECT product_name as name, quantity, unit_price as price FROM order_items WHERE sub_order_id = ?').bind(sub_order_id).all<any>();

    const vainabag = await getVainabagService(db);
    const dispatchResult = await vainabag.createDeliveryOrder({
      order_id: subOrder.sub_order_code || sub_order_id,
      customer_name: subOrder.customer_name || 'Cliente',
      customer_phone: subOrder.customer_phone || '(94) 99123-4567',
      delivery_address: {
        street: subOrder.customer_street || 'Av. Weyne Cavalcante',
        number: subOrder.customer_number || 'S/N',
        neighborhood: subOrder.customer_neighborhood || 'Centro',
        city: 'Canaã dos Carajás',
        state: 'PA'
      },
      items: items?.results || [{ name: 'Pedido Shop da Cidade', quantity: 1, price: subOrder.total_amount }],
      total_amount: subOrder.total_amount,
      payment_method: subOrder.payment_method || 'PIX'
    });

    // Update sub_order status to dispatched / out_for_delivery
    await db.prepare("UPDATE sub_orders SET status = 'out_for_delivery', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(sub_order_id).run();

    return {
      status: 200,
      data: {
        success: true,
        message: 'Entrega solicitada à Vainabag com sucesso!',
        dispatch: dispatchResult
      }
    };
  }

  // POST /api/deliveries/vainabag/simulate (Advance sandbox order)
  if (method === 'POST' && path === '/api/deliveries/vainabag/simulate') {
    const { order_id, step } = body || {};
    if (!order_id || !step) {
      return { status: 400, data: { error: 'order_id e step são obrigatórios.' } };
    }

    const vainabag = await getVainabagService(db);
    const simResult = await vainabag.simulateStep(order_id, step);
    return { status: 200, data: simResult };
  }

  return null;
}
