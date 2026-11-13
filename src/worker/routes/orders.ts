// Shop Carajás - Orders & Checkout Routes (Multi-store backend calculations, PIX & integrity)
import { DatabaseAdapter } from '../db';
import { User } from '../types';

// Helper to generate PIX Copy & Paste string (BR Code standard format)
function generatePixPayload(key: string, beneficiary: string, city: string, amount: number, txid: string): string {
  const cleanCity = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().slice(0, 15);
  const cleanBeneficiary = beneficiary.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().slice(0, 25);
  const formattedAmount = amount.toFixed(2);

  const part = (id: string, val: string) => `${id}${val.length.toString().padStart(2, '0')}${val}`;

  const payloadFormat = part('00', '01');
  const pointOfInit = part('01', '12'); // Dynamic or static
  const merchantAccount = part('26', `${part('00', 'BR.GOV.BCB.PIX')}${part('01', key)}`);
  const merchantCategory = part('52', '0000');
  const currency = part('53', '986'); // BRL
  const transAmount = part('54', formattedAmount);
  const country = part('58', 'BR');
  const merchantName = part('59', cleanBeneficiary);
  const merchantCity = part('60', cleanCity);
  const additionalData = part('62', `${part('05', txid)}`);

  const raw = `${payloadFormat}${pointOfInit}${merchantAccount}${merchantCategory}${currency}${transAmount}${country}${merchantName}${merchantCity}${additionalData}6304`;
  
  // CRC16 CCITT
  let crc = 0xFFFF;
  for (let i = 0; i < raw.length; i++) {
    crc ^= (raw.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
  return `${raw}${crcHex}`;
}

export async function handleOrdersRoutes(req: { method: string; path: string; body?: any; user?: User | null }, db: DatabaseAdapter) {
  const { method, path, body, user } = req;

  // POST /api/orders (Create multi-store checkout order)
  if (method === 'POST' && path === '/api/orders') {
    const {
      customer_name,
      customer_email,
      customer_phone,
      delivery_type = 'delivery', // delivery | pickup
      shipping_address, // { street, number, complement, neighborhood, reference_point }
      payment_method = 'pix', // pix | delivery_cash | delivery_card | credit_card
      items = [], // [ { product_id, quantity, selected_variation } ]
      notes
    } = body || {};

    if (!customer_name || !customer_email || !customer_phone) {
      return { status: 400, data: { error: 'Nome, e-mail e telefone do cliente são obrigatórios.' } };
    }

    if (!Array.isArray(items) || items.length === 0) {
      return { status: 400, data: { error: 'O carrinho está vazio.' } };
    }

    if (delivery_type === 'delivery' && (!shipping_address || !shipping_address.street || !shipping_address.neighborhood)) {
      return { status: 400, data: { error: 'Endereço de entrega completo com bairro em Canaã dos Carajás é obrigatório.' } };
    }

    // 1. Fetch products and stores from DB to verify stock, prices and availability
    const productIds = items.map((it: any) => it.product_id);
    const placeholders = productIds.map(() => '?').join(',');
    const { results: dbProducts } = await db.prepare(`
      SELECT p.*, s.id as store_real_id, s.name as store_name, s.slug as store_slug,
             s.delivery_fee_base, s.free_delivery_minimum, s.commission_rate_override,
             s.street as store_street, s.number as store_number, s.neighborhood as store_neighborhood,
             s.neighborhood_fees_json,
             s.is_open, s.status as store_status
      FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE p.id IN (${placeholders})
    `).bind(...productIds).all();

    const productMap = new Map<string, any>();
    for (const p of (dbProducts as any[])) {
      productMap.set(p.id, p);
    }

    // Group items by store
    const storeGroups = new Map<string, { store: any; items: Array<{ product: any; quantity: number; variation?: string }> }>();

    for (const item of items) {
      const prod = productMap.get(item.product_id);
      if (!prod || !prod.is_active || prod.store_status !== 'active') {
        return { status: 400, data: { error: `O produto "${prod?.name || item.product_id}" não está mais disponível.` } };
      }

      const qty = Math.max(1, parseInt(item.quantity) || 1);
      if (prod.stock_quantity < qty) {
        return { status: 400, data: { error: `Estoque insuficiente para "${prod.name}". Disponível: ${prod.stock_quantity}.` } };
      }

      if (!storeGroups.has(prod.store_real_id)) {
        storeGroups.set(prod.store_real_id, { store: prod, items: [] });
      }
      storeGroups.get(prod.store_real_id)!.items.push({
        product: prod,
        quantity: qty,
        variation: item.selected_variation
      });
    }

    // Get default platform commission rate
    const globalCommSetting = await db.prepare("SELECT value FROM platform_settings WHERE key = 'default_commission_rate'").first<{ value: string }>();
    const defaultCommRate = parseFloat(globalCommSetting?.value || '8.0');

    // 2. Calculate values per store sub-order
    let orderTotalItems = 0;
    let orderTotalDelivery = 0;
    const subOrdersToCreate: any[] = [];
    let subOrderIndex = 1;

    for (const [storeId, group] of storeGroups.entries()) {
      let storeSubtotal = 0;
      const subOrderItems: any[] = [];

      for (const item of group.items) {
        const unitPrice = item.product.promotional_price && item.product.promotional_price > 0
          ? item.product.promotional_price
          : item.product.price;
        const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
        storeSubtotal += lineTotal;

        subOrderItems.push({
          id: 'item_' + crypto.randomUUID().slice(0, 10),
          product_id: item.product.id,
          product_name: item.product.name,
          product_image: item.product.image_url,
          product_sku: item.product.sku,
          unit_price: unitPrice,
          quantity: item.quantity,
          subtotal: lineTotal,
          selected_variation: item.variation || null
        });
      }

      let storeDeliveryFee = 0;
      if (delivery_type === 'delivery') {
        if (group.store.free_delivery_minimum && storeSubtotal >= group.store.free_delivery_minimum) {
          storeDeliveryFee = 0;
        } else {
          let customFee: number | null = null;
          if (shipping_address?.neighborhood && group.store.neighborhood_fees_json) {
            try {
              const feesObj = typeof group.store.neighborhood_fees_json === 'string'
                ? JSON.parse(group.store.neighborhood_fees_json)
                : group.store.neighborhood_fees_json;
              if (feesObj && feesObj[shipping_address.neighborhood] !== undefined) {
                const parsedVal = parseFloat(feesObj[shipping_address.neighborhood]);
                if (!isNaN(parsedVal)) {
                  customFee = parsedVal;
                }
              }
            } catch {}
          }
          storeDeliveryFee = customFee !== null ? customFee : (Number(group.store.delivery_fee_base) || 7.00);
        }
      }

      const commissionRate = group.store.commission_rate_override !== null && group.store.commission_rate_override !== undefined
        ? Number(group.store.commission_rate_override)
        : defaultCommRate;

      const commissionAmount = Number(((storeSubtotal * commissionRate) / 100).toFixed(2));
      const storeNetAmount = Number((storeSubtotal - commissionAmount).toFixed(2));

      orderTotalItems += storeSubtotal;
      orderTotalDelivery += storeDeliveryFee;

      subOrdersToCreate.push({
        store_id: storeId,
        store_name: group.store.store_name,
        store_address: `${group.store.store_street || ''}, ${group.store.store_number || ''} - ${group.store.store_neighborhood || 'Centro'}`,
        index: subOrderIndex++,
        store_subtotal: Number(storeSubtotal.toFixed(2)),
        delivery_fee: storeDeliveryFee,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        store_net_amount: storeNetAmount,
        delivery_model: delivery_type === 'pickup' ? 'pickup' : 'platform_courier',
        items: subOrderItems
      });
    }

    const orderGrandTotal = Number((orderTotalItems + orderTotalDelivery).toFixed(2));
    const orderId = 'ord_' + crypto.randomUUID().slice(0, 10);
    const orderCode = 'CARAJAS-' + Math.floor(1000 + Math.random() * 9000);

    // PIX Payload generation
    const pixSetting = await db.prepare("SELECT value FROM platform_settings WHERE key = 'pix_key'").first<{ value: string }>();
    const pixBeneficiary = await db.prepare("SELECT value FROM platform_settings WHERE key = 'pix_beneficiary'").first<{ value: string }>();
    const pixKey = pixSetting?.value || 'financeiro@shopcarajas.com.br';
    const beneficiaryName = pixBeneficiary?.value || 'SHOP CARAJAS LTDA';
    const pixCode = generatePixPayload(pixKey, beneficiaryName, 'CANAA DOS CARAJAS', orderGrandTotal, orderCode);

    // Initial payment status
    const initialPaymentStatus = payment_method === 'pix' ? 'pending' : 'confirmed';

    // 3. Persist Order in database
    await db.prepare(`
      INSERT INTO orders (
        id, order_code, user_id, customer_name, customer_email, customer_phone,
        delivery_type, shipping_address_json, payment_method, payment_status,
        pix_code, total_items, total_delivery_fee, total_discount, total_amount, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).bind(
      orderId, orderCode, user?.id || null, customer_name, customer_email, customer_phone,
      delivery_type, JSON.stringify(shipping_address || null), payment_method, initialPaymentStatus,
      pixCode, Number(orderTotalItems.toFixed(2)), Number(orderTotalDelivery.toFixed(2)),
      orderGrandTotal, notes || null
    ).run();

    // 4. Persist Sub-orders and items, deduct stock
    for (const sub of subOrdersToCreate) {
      const subOrderId = 'subord_' + crypto.randomUUID().slice(0, 10);
      const subOrderCode = `${orderCode}-${sub.index}`;

      await db.prepare(`
        INSERT INTO sub_orders (
          id, sub_order_code, order_id, store_id, status, delivery_model,
          store_subtotal, delivery_fee, commission_rate, commission_amount,
          store_net_amount, courier_fee
        ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        subOrderId, subOrderCode, orderId, sub.store_id, sub.delivery_model,
        sub.store_subtotal, sub.delivery_fee, sub.commission_rate, sub.commission_amount,
        sub.store_net_amount, sub.delivery_fee
      ).run();

      for (const item of sub.items) {
        await db.prepare(`
          INSERT INTO order_items (
            id, sub_order_id, product_id, product_name, product_image,
            product_sku, unit_price, quantity, subtotal, selected_variation
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          item.id, subOrderId, item.product_id, item.product_name, item.product_image,
          item.product_sku, item.unit_price, item.quantity, item.subtotal, item.selected_variation
        ).run();

        // Atomically decrement stock
        await db.prepare(`
          UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?
        `).bind(item.quantity, item.product_id).run();
      }

      // If delivery is needed via platform courier, create delivery entry
      if (sub.delivery_model === 'platform_courier') {
        const deliveryId = 'deliv_' + crypto.randomUUID().slice(0, 10);
        const destinationStr = `${shipping_address.street}, ${shipping_address.number} - ${shipping_address.neighborhood}, Canaã dos Carajás`;
        await db.prepare(`
          INSERT INTO deliveries (
            id, sub_order_id, status, pickup_address, delivery_address,
            delivery_fee, courier_earnings, platform_fee, customer_contact
          ) VALUES (?, ?, 'waiting_courier', ?, ?, ?, ?, ?, ?)
        `).bind(
          deliveryId, subOrderId, sub.store_address, destinationStr,
          sub.delivery_fee, Number((sub.delivery_fee * 0.8).toFixed(2)),
          Number((sub.delivery_fee * 0.2).toFixed(2)), `${customer_name} (${customer_phone})`
        ).run();
      }
    }

    return {
      status: 201,
      data: {
        success: true,
        orderId,
        orderCode,
        totalAmount: orderGrandTotal,
        paymentMethod: payment_method,
        paymentStatus: initialPaymentStatus,
        pixCode,
        subOrdersCount: subOrdersToCreate.length
      }
    };
  }

  // GET /api/orders/my-orders
  if (method === 'GET' && path === '/api/orders/my-orders') {
    if (!user) return { status: 401, data: { error: 'Autenticação necessária.' } };

    const { results: orders } = await db.prepare(`
      SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
    `).bind(user.id).all();

    for (const ord of (orders as any[])) {
      const { results: subOrders } = await db.prepare(`
        SELECT so.*, s.name as store_name, s.slug as store_slug, s.phone as store_phone
        FROM sub_orders so
        JOIN stores s ON s.id = so.store_id
        WHERE so.order_id = ?
      `).bind(ord.id).all();

      for (const so of (subOrders as any[])) {
        const items = await db.prepare('SELECT * FROM order_items WHERE sub_order_id = ?').bind(so.id).all();
        so.items = items.results;
      }
      ord.sub_orders = subOrders;
    }

    return { status: 200, data: { orders } };
  }

  // GET /api/orders/:code (Order tracking by code)
  const orderCodeMatch = path.match(/^\/api\/orders\/([a-zA-Z0-9_-]+)$/);
  if (method === 'GET' && orderCodeMatch) {
    const code = orderCodeMatch[1];
    const order = await db.prepare('SELECT * FROM orders WHERE order_code = ? OR id = ?').bind(code, code).first<any>();

    if (!order) {
      return { status: 404, data: { error: 'Pedido não encontrado.' } };
    }

    const { results: subOrders } = await db.prepare(`
      SELECT so.*, s.name as store_name, s.slug as store_slug, s.phone as store_phone,
             s.neighborhood as store_neighborhood, s.whatsapp as store_whatsapp
      FROM sub_orders so
      JOIN stores s ON s.id = so.store_id
      WHERE so.order_id = ?
    `).bind(order.id).all();

    for (const so of (subOrders as any[])) {
      const items = await db.prepare('SELECT * FROM order_items WHERE sub_order_id = ?').bind(so.id).all();
      so.items = items.results;

      const delivery = await db.prepare('SELECT * FROM deliveries WHERE sub_order_id = ?').bind(so.id).first();
      so.delivery = delivery;
    }

    order.sub_orders = subOrders;
    return { status: 200, data: { order } };
  }

  // POST /api/orders/:code/confirm-pix (Manual confirmation - strictly restricted to authenticated administrators)
  const pixConfirmMatch = path.match(/^\/api\/orders\/([a-zA-Z0-9_-]+)\/confirm-pix$/);
  if (method === 'POST' && pixConfirmMatch) {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return { status: 403, data: { error: 'Acesso negado. Apenas administradores do Shop da Cidade podem confirmar pagamentos manualmente.' } };
    }

    const code = pixConfirmMatch[1];
    const order = await db.prepare('SELECT * FROM orders WHERE order_code = ? OR id = ?').bind(code, code).first<any>();

    if (!order) {
      return { status: 404, data: { error: 'Pedido não encontrado.' } };
    }

    await db.prepare("UPDATE orders SET payment_status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(order.id).run();
    await db.prepare("UPDATE sub_orders SET status = 'preparing', updated_at = CURRENT_TIMESTAMP WHERE order_id = ? AND status = 'pending'").bind(order.id).run();

    // Register security audit log
    try {
      await db.prepare(`
        INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details_json, created_at)
        VALUES (?, ?, 'MANUAL_PIX_CONFIRM', 'order', ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        'log_' + crypto.randomUUID().slice(0, 8),
        user.name || user.email,
        order.id,
        JSON.stringify({ confirmedBy: user.email, userRole: user.role, orderCode: order.order_code })
      ).run();
    } catch (_) {}

    return { status: 200, data: { success: true, message: 'Pagamento PIX confirmado com sucesso pelo administrador! Lojas notificadas.' } };
  }

  return null;
}
