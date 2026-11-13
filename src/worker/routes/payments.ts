// Shop da Cidade - Payment Routes (Asaas Integration, Pix, Card, Commissions & Webhooks)
import { DatabaseAdapter } from '../db';
import { AsaasService, getAsaasConfig } from '../services/asaas';
import { User } from '../types';

export async function handlePaymentsRoutes(
  req: { method: string; path: string; query?: Record<string, string>; body?: any; headers: any; user?: User | null },
  db: DatabaseAdapter
) {
  const { method, path, body, query, headers, user } = req;

  // 1. GET /api/payments/config - Public & Admin payment configuration status
  if (method === 'GET' && path === '/api/payments/config') {
    const config = await getAsaasConfig(db);
    return {
      status: 200,
      data: {
        isConfigured: !!config.apiKey && config.apiKey.length > 10,
        environment: config.environment,
        hasWebhookToken: !!config.webhookToken,
        defaultCommissionPercent: config.defaultCommissionPercent,
        apiKeyMasked: config.apiKey ? `••••••••••••${config.apiKey.slice(-4)}` : '',
        webhookUrl: '/api/payments/webhook'
      }
    };
  }

  // 2. POST /api/payments/config - Super Admin updates Asaas settings
  if (method === 'POST' && path === '/api/payments/config') {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return { status: 403, data: { error: 'Acesso restrito ao Super Admin.' } };
    }

    const { apiKey, environment = 'sandbox', webhookToken, defaultCommissionPercent } = body || {};

    if (apiKey !== undefined) {
      await db.prepare("INSERT OR REPLACE INTO platform_settings (key, value, updated_at) VALUES ('asaas_api_key', ?, CURRENT_TIMESTAMP)").bind(apiKey.trim()).run();
    }
    if (environment !== undefined) {
      await db.prepare("INSERT OR REPLACE INTO platform_settings (key, value, updated_at) VALUES ('asaas_environment', ?, CURRENT_TIMESTAMP)").bind(environment).run();
    }
    if (webhookToken !== undefined) {
      await db.prepare("INSERT OR REPLACE INTO platform_settings (key, value, updated_at) VALUES ('asaas_webhook_token', ?, CURRENT_TIMESTAMP)").bind(webhookToken.trim()).run();
    }
    if (defaultCommissionPercent !== undefined) {
      await db.prepare("INSERT OR REPLACE INTO platform_settings (key, value, updated_at) VALUES ('default_commission_rate', ?, CURRENT_TIMESTAMP)").bind(String(defaultCommissionPercent)).run();
    }

    return { status: 200, data: { success: true, message: 'Configurações do Asaas salvas com sucesso.' } };
  }

  // 3. POST /api/payments/charge/pix - Generate Pix Charge for an Order
  if (method === 'POST' && path === '/api/payments/charge/pix') {
    const { orderId, customer } = body || {};
    if (!orderId) {
      return { status: 400, data: { error: 'ID do pedido obrigatório.' } };
    }

    const order = await db.prepare('SELECT * FROM orders WHERE id = ? OR order_code = ?').bind(orderId, orderId).first<any>();
    if (!order) {
      return { status: 404, data: { error: 'Pedido não encontrado.' } };
    }

    // Get order store and calculate split rules if store has Asaas Wallet ID
    const subOrders = await db.prepare(`
      SELECT so.*, s.name as store_name, s.pix_key
      FROM sub_orders so
      JOIN stores s ON s.id = so.store_id
      WHERE so.order_id = ?
    `).bind(order.id).all<any>();

    const config = await getAsaasConfig(db);
    const asaas = new AsaasService(config);

    try {
      const pixRes = await asaas.createPixCharge({
        orderId: order.order_code,
        amount: order.total_amount,
        description: `Pedido ${order.order_code} - Shop da Cidade`,
        customer: {
          name: customer?.name || order.customer_name,
          email: customer?.email || order.customer_email || 'cliente@shopdacidade.com.br',
          phone: customer?.phone || order.customer_phone,
          cpfCnpj: customer?.cpfCnpj
        }
      });

      // Save Pix info to order
      await db.prepare(`
        UPDATE orders
        SET pix_code = ?, pix_qr_base64 = ?, payment_status = 'pending', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(pixRes.pixCode, pixRes.pixQrBase64 || pixRes.pixQrCodeUrl || '', order.id).run();

      return {
        status: 200,
        data: {
          success: true,
          chargeId: pixRes.chargeId,
          pixCode: pixRes.pixCode,
          pixQrCodeUrl: pixRes.pixQrCodeUrl,
          pixQrBase64: pixRes.pixQrBase64,
          amount: order.total_amount,
          orderCode: order.order_code
        }
      };
    } catch (err: any) {
      return { status: 400, data: { error: err.message || 'Erro ao gerar Pix no Asaas.' } };
    }
  }

  // 4. POST /api/payments/charge/card - Process Credit Card payment
  if (method === 'POST' && path === '/api/payments/charge/card') {
    const { orderId, customer, card, installments = 1 } = body || {};
    if (!orderId || !card) {
      return { status: 400, data: { error: 'Dados do pedido e do cartão obrigatórios.' } };
    }

    const order = await db.prepare('SELECT * FROM orders WHERE id = ? OR order_code = ?').bind(orderId, orderId).first<any>();
    if (!order) {
      return { status: 404, data: { error: 'Pedido não encontrado.' } };
    }

    const config = await getAsaasConfig(db);
    const asaas = new AsaasService(config);

    try {
      const cardRes = await asaas.createCardCharge({
        orderId: order.order_code,
        amount: order.total_amount,
        description: `Pedido ${order.order_code} - Shop da Cidade`,
        customer: {
          name: customer?.name || order.customer_name,
          email: customer?.email || order.customer_email || 'cliente@shopdacidade.com.br',
          phone: customer?.phone || order.customer_phone,
          cpfCnpj: customer?.cpfCnpj,
          postalCode: customer?.postalCode,
          addressNumber: customer?.addressNumber
        },
        card,
        installments
      });

      if (cardRes.status === 'CONFIRMED' || cardRes.status === 'RECEIVED') {
        await db.prepare("UPDATE orders SET payment_status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(order.id).run();
        await db.prepare("UPDATE sub_orders SET status = 'preparing', updated_at = CURRENT_TIMESTAMP WHERE order_id = ?").bind(order.id).run();
      }

      return {
        status: 200,
        data: {
          success: true,
          chargeId: cardRes.chargeId,
          status: cardRes.status,
          orderCode: order.order_code
        }
      };
    } catch (err: any) {
      return { status: 400, data: { error: err.message || 'Erro ao processar cartão no Asaas.' } };
    }
  }

  // 5. POST /api/payments/service-commission - Generate commission charge for Ótica, Manicure, Barbeiro after appointment
  if (method === 'POST' && path === '/api/payments/service-commission') {
    const { scheduleId, finalServiceAmount, notes } = body || {};
    if (!scheduleId || !finalServiceAmount) {
      return { status: 400, data: { error: 'ID do agendamento e valor final do serviço são obrigatórios.' } };
    }

    const schedule = await db.prepare(`
      SELECT ss.*, sp.business_name, sp.user_id as provider_user_id
      FROM service_schedules ss
      JOIN service_providers sp ON sp.id = ss.provider_id
      WHERE ss.id = ?
    `).bind(scheduleId).first<any>();

    if (!schedule) {
      return { status: 404, data: { error: 'Agendamento de serviço não encontrado.' } };
    }

    const config = await getAsaasConfig(db);
    const asaas = new AsaasService(config);

    const commissionPercent = config.defaultCommissionPercent;

    try {
      const result = await asaas.createServiceCommissionCharge({
        serviceScheduleId: schedule.id,
        customerName: schedule.client_name,
        customerPhone: schedule.client_phone,
        serviceName: schedule.service_name,
        finalAmount: Number(finalServiceAmount),
        commissionPercent,
        providerName: schedule.business_name
      });

      // Update schedule with confirmed final amount and commission
      await db.prepare(`
        UPDATE service_schedules
        SET total_price = ?, status = 'completed', notes = COALESCE(notes, '') || ?
        WHERE id = ?
      `).bind(
        Number(finalServiceAmount),
        ` [Valor final presencial: R$ ${Number(finalServiceAmount).toFixed(2)} - Comissão Asaas: R$ ${result.commissionAmount.toFixed(2)}]`,
        schedule.id
      ).run();

      return {
        status: 200,
        data: {
          success: true,
          chargeId: result.chargeId,
          commissionAmount: result.commissionAmount,
          commissionPercent,
          pixCode: result.pixCode,
          pixQrCodeUrl: result.pixQrCodeUrl,
          message: 'Cobrança de comissão de serviço gerada com sucesso.'
        }
      };
    } catch (err: any) {
      return { status: 400, data: { error: err.message || 'Erro ao gerar comissão de serviço.' } };
    }
  }

  // 6. POST /api/payments/webhook - Asaas Webhook receiver with token verification
  if (method === 'POST' && path === '/api/payments/webhook') {
    const config = await getAsaasConfig(db);
    const incomingToken = headers?.['asaas-access-token'] || headers?.['Asaas-Access-Token'] || headers?.['asaas_access_token'];

    // Enforce webhook authentication if token configured
    if (config.webhookToken && incomingToken !== config.webhookToken) {
      console.warn('[Asaas Webhook] Tentativa rejeitada: token de webhook inválido ou ausente.');
      return { status: 401, data: { error: 'Token de autenticação do webhook Asaas não autorizado.' } };
    }

    const event = body?.event;
    const payment = body?.payment;

    console.log(`[Asaas Webhook] Evento recebido autenticado: ${event}`, payment?.id, payment?.externalReference);

    if (!payment) {
      return { status: 200, data: { received: true } };
    }

    const externalRef = payment.externalReference; // e.g. "ORD-1234" or "svc_xxx"

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      if (externalRef && externalRef.startsWith('svc_')) {
        // Service schedule commission paid
        const scheduleId = externalRef.replace('svc_', '');
        await db.prepare(`
          UPDATE service_schedules
          SET status = 'completed', notes = COALESCE(notes, '') || ' [Comissão paga via Asaas]'
          WHERE id = ?
        `).bind(scheduleId).run();
      } else if (externalRef) {
        // Product order paid
        const order = await db.prepare('SELECT id FROM orders WHERE order_code = ? OR id = ?').bind(externalRef, externalRef).first<any>();
        if (order) {
          await db.prepare("UPDATE orders SET payment_status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(order.id).run();
          await db.prepare("UPDATE sub_orders SET status = 'preparing', updated_at = CURRENT_TIMESTAMP WHERE order_id = ?").bind(order.id).run();

          // Register in audit logs
          await db.prepare(`
            INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details_json, created_at)
            VALUES (?, 'Asaas Webhook', 'PAYMENT_CONFIRMED', 'order', ?, ?, CURRENT_TIMESTAMP)
          `).bind('log_' + crypto.randomUUID().slice(0, 8), order.id, JSON.stringify(payment)).run();
        }
      }
    } else if (event === 'PAYMENT_REFUNDED' || event === 'PAYMENT_OVERDUE') {
      if (externalRef && !externalRef.startsWith('svc_')) {
        await db.prepare("UPDATE orders SET payment_status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE order_code = ?").bind(externalRef).run();
      }
    }

    return { status: 200, data: { success: true, processedEvent: event } };
  }

  // 7. POST /api/payments/simulate-success - Restricted strictly to administrators for testing
  if (method === 'POST' && path === '/api/payments/simulate-success') {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return { status: 403, data: { error: 'Acesso negado. Apenas administradores podem simular pagamentos.' } };
    }

    const { orderCode } = body || {};
    if (!orderCode) return { status: 400, data: { error: 'orderCode obrigatório.' } };

    await db.prepare("UPDATE orders SET payment_status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE order_code = ?").bind(orderCode).run();
    await db.prepare("UPDATE sub_orders SET status = 'preparing', updated_at = CURRENT_TIMESTAMP WHERE order_id = (SELECT id FROM orders WHERE order_code = ?)").bind(orderCode).run();

    return { status: 200, data: { success: true, message: `Pagamento do pedido ${orderCode} simulado e confirmado!` } };
  }

  return null;
}
