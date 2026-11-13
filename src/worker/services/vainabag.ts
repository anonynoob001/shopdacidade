// Shop da Cidade - Vainabag Delivery API Integration Service
// Spec: OpenAPI 3.0.3 API de Integração de Entregas Vainabag
import { DatabaseAdapter } from '../db';

export interface VainabagConfig {
  client_id?: string;
  client_secret?: string;
  store_code?: string;
  is_test_mode?: boolean;
}

export interface VainabagOrderPayload {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  pickup_address?: {
    store_name: string;
    phone?: string;
    street?: string;
    number?: string;
    neighborhood: string;
    city?: string;
    state?: string;
  };
  delivery_address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code?: string;
    complement?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total_amount: number;
  payment_method: string;
  is_test?: boolean;
}

const VAINABAG_API_BASE = 'https://api-pro.vainabag.com.br/integrations/v1';

// In-memory token cache scoped by client_id + environment
let cachedToken: { cacheKey: string; token: string; expiresAt: number } | null = null;

export class VainabagService {
  private clientId: string;
  private clientSecret: string;
  private storeCode?: string;
  private isTest: boolean;

  constructor(config: VainabagConfig) {
    this.clientId = (config.client_id || '').trim();
    this.clientSecret = (config.client_secret || '').trim();
    this.storeCode = (config.store_code || '').trim();
    this.isTest = config.is_test_mode !== false; // Default to safe test/sandbox
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  /**
   * Request OAuth2 Bearer token with client_credentials grant
   */
  async getAccessToken(): Promise<string> {
    const cacheKey = `${this.clientId}:${this.isTest ? 'test' : 'prod'}`;
    if (cachedToken && cachedToken.cacheKey === cacheKey && cachedToken.expiresAt > Date.now() + 60000) {
      return cachedToken.token;
    }

    if (!this.isConfigured()) {
      throw new Error('Credenciais da API Vainabag (client_id e client_secret) não configuradas.');
    }

    const response = await fetch(`${VAINABAG_API_BASE}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials'
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 403) {
        throw new Error('Credencial Vainabag ainda não aprovada pelo Owner da plataforma ou pausada.');
      }
      if (response.status === 401) {
        throw new Error('client_id ou client_secret inválidos para a Vainabag.');
      }
      throw new Error(`Erro de autenticação Vainabag: ${errData.error || response.statusText}`);
    }

    const data = await response.json() as { access_token: string; expires_in: number };
    cachedToken = {
      cacheKey,
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000
    };

    return cachedToken.token;
  }

  /**
   * Calculate delivery fee from Vainabag
   */
  async estimateDeliveryFee(params: { neighborhood: string; packageValue: number }): Promise<{ fee: number; estimatedMinutes: string }> {
    if (!this.isConfigured()) {
      // Standard local Canaã dos Carajás rate fallback
      const baseFee = 8.00;
      return { fee: baseFee, estimatedMinutes: '30-45 min' };
    }

    try {
      const token = await this.getAccessToken();
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      if (this.storeCode) {
        headers['X-Vainabag-Store'] = this.storeCode;
      }

      const res = await fetch(`${VAINABAG_API_BASE}/delivery-fee?neighborhood=${encodeURIComponent(params.neighborhood)}&value=${params.packageValue}`, {
        headers
      });

      if (res.ok) {
        const data = await res.json() as any;
        return {
          fee: Number(data.delivery_fee || data.fee || 8.00),
          estimatedMinutes: data.estimated_time || '35-50 min'
        };
      }
    } catch (e) {
      console.warn('[Vainabag] Fee estimation error:', e);
    }

    return { fee: 8.00, estimatedMinutes: '30-45 min' };
  }

  /**
   * Dispatch delivery order to Vainabag
   */
  async createDeliveryOrder(payload: VainabagOrderPayload): Promise<{
    success: boolean;
    tracking_id: string;
    status: string;
    estimated_delivery: string;
    is_simulation?: boolean;
  }> {
    if (!this.isConfigured()) {
      // Return simulated local courier dispatch
      return {
        success: true,
        tracking_id: 'vb_sim_' + payload.order_id,
        status: 'PENDENTE',
        estimated_delivery: '30-45 min',
        is_simulation: true
      };
    }

    const token = await this.getAccessToken();
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `vb_idem_${payload.order_id}`
    };

    if (this.storeCode) {
      headers['X-Vainabag-Store'] = this.storeCode;
    }

    const body: Record<string, any> = {
      external_order_id: payload.order_id,
      recipient: {
        name: payload.customer_name,
        phone: payload.customer_phone,
        street: payload.delivery_address.street,
        number: payload.delivery_address.number,
        neighborhood: payload.delivery_address.neighborhood,
        city: payload.delivery_address.city || 'Canaã dos Carajás',
        state: payload.delivery_address.state || 'PA',
        zip_code: payload.delivery_address.zip_code || '68537-000',
        complement: payload.delivery_address.complement || ''
      },
      items: payload.items,
      total_amount: payload.total_amount,
      payment_method: payload.payment_method,
      test: this.isTest
    };

    if (payload.pickup_address) {
      body.pickup = {
        store_name: payload.pickup_address.store_name,
        phone: payload.pickup_address.phone || '',
        street: payload.pickup_address.street || '',
        number: payload.pickup_address.number || 'S/N',
        neighborhood: payload.pickup_address.neighborhood,
        city: payload.pickup_address.city || 'Canaã dos Carajás',
        state: payload.pickup_address.state || 'PA'
      };
    }

    const response = await fetch(`${VAINABAG_API_BASE}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Falha ao despachar entrega na Vainabag: ${err.message || response.statusText}`);
    }

    const result = await response.json() as any;
    return {
      success: true,
      tracking_id: result.id || result.order_id || payload.order_id,
      status: result.status || 'PENDENTE',
      estimated_delivery: result.estimated_delivery || '30-45 min',
      is_simulation: this.isTest
    };
  }

  /**
   * Advance sandbox order simulation (ready, driver-accept, collect, deliver)
   */
  async simulateStep(orderId: string, step: 'ready' | 'driver-accept' | 'collect' | 'deliver' | 'cancel'): Promise<any> {
    if (!this.isConfigured()) {
      const statusMap: Record<string, string> = {
        'ready': 'PRONTO',
        'driver-accept': 'EM_PREPARO',
        'collect': 'EM_ROTA',
        'deliver': 'ENTREGUE',
        'cancel': 'CANCELADO'
      };
      return { success: true, simulated_status: statusMap[step] || step };
    }

    const token = await this.getAccessToken();
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    if (this.storeCode) {
      headers['X-Vainabag-Store'] = this.storeCode;
    }

    const res = await fetch(`${VAINABAG_API_BASE}/orders/${orderId}/simulate/${step}`, {
      method: 'POST',
      headers
    });

    return await res.json();
  }
}

/**
 * Load Vainabag configuration from platform_settings
 */
export async function getVainabagService(db: DatabaseAdapter): Promise<VainabagService> {
  const rows = await db.prepare("SELECT key, value FROM platform_settings WHERE key LIKE 'vainabag_%'").all<any>();
  const configMap: Record<string, string> = {};
  for (const r of rows?.results || []) {
    configMap[r.key] = r.value;
  }

  return new VainabagService({
    client_id: configMap['vainabag_client_id'] || '',
    client_secret: configMap['vainabag_client_secret'] || '',
    store_code: configMap['vainabag_store_code'] || '',
    is_test_mode: configMap['vainabag_env'] !== 'production'
  });
}
