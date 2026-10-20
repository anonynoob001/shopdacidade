// Shop da Cidade - Asaas Payment Gateway Integration Service
import { DatabaseAdapter } from '../db';

export interface AsaasConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
  webhookToken?: string;
  defaultCommissionPercent: number;
}

export interface AsaasCustomerInput {
  name: string;
  email: string;
  phone?: string;
  cpfCnpj?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
}

export interface AsaasSplitRule {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
  description?: string;
}

export interface CreatePixChargeParams {
  orderId: string;
  amount: number;
  description: string;
  customer: AsaasCustomerInput;
  dueDate?: string;
  split?: AsaasSplitRule[];
}

export interface CreateCardChargeParams {
  orderId: string;
  amount: number;
  description: string;
  customer: AsaasCustomerInput;
  card: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  installments?: number;
  split?: AsaasSplitRule[];
}

export async function getAsaasConfig(db: DatabaseAdapter): Promise<AsaasConfig> {
  const apiKeyRow = await db.prepare("SELECT value FROM platform_settings WHERE key = 'asaas_api_key'").first<{ value: string }>();
  const envRow = await db.prepare("SELECT value FROM platform_settings WHERE key = 'asaas_environment'").first<{ value: string }>();
  const webhookTokenRow = await db.prepare("SELECT value FROM platform_settings WHERE key = 'asaas_webhook_token'").first<{ value: string }>();
  const commissionRow = await db.prepare("SELECT value FROM platform_settings WHERE key = 'default_commission_rate'").first<{ value: string }>();

  return {
    apiKey: apiKeyRow?.value || '',
    environment: (envRow?.value === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production',
    webhookToken: webhookTokenRow?.value || '',
    defaultCommissionPercent: commissionRow ? parseFloat(commissionRow.value) : 8.0
  };
}

export class AsaasService {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: AsaasConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Chave de API do Asaas não configurada. Configure no painel Super Admin.');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'access_token': this.apiKey,
      ...((options.headers as any) || {})
    };

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.errors?.[0]?.description || data?.message || `Erro Asaas HTTP ${res.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  }

  // Find or create customer in Asaas
  async getOrCreateCustomer(customer: AsaasCustomerInput): Promise<string> {
    // If test mode or mock, return simulated customer ID
    if (!this.apiKey || this.apiKey.includes('test_simulated')) {
      return 'cus_simulated_' + Math.random().toString(36).substring(2, 9);
    }

    try {
      if (customer.email) {
        const search = await this.request<{ data: any[] }>(`/customers?email=${encodeURIComponent(customer.email)}`);
        if (search.data && search.data.length > 0) {
          return search.data[0].id;
        }
      }
    } catch {
      // Continue to create customer
    }

    const created = await this.request<{ id: string }>('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        mobilePhone: customer.phone,
        cpfCnpj: customer.cpfCnpj ? customer.cpfCnpj.replace(/\D/g, '') : undefined,
        postalCode: customer.postalCode ? customer.postalCode.replace(/\D/g, '') : undefined,
        address: customer.address,
        addressNumber: customer.addressNumber,
        notificationDisabled: false
      })
    });

    return created.id;
  }

  // Create PIX Charge with immediate QR Code
  async createPixCharge(params: CreatePixChargeParams): Promise<{
    chargeId: string;
    status: string;
    value: number;
    pixCode: string;
    pixQrCodeUrl?: string;
    pixQrBase64?: string;
    invoiceUrl?: string;
    dueDate: string;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const dueDate = params.dueDate || today;

    // Simulation fallback if API key is not yet set
    if (!this.apiKey || this.apiKey.includes('test_simulated')) {
      const simulatedPixCode = `00020126580014br.gov.bcb.pix0136${Math.random().toString(36).substring(2, 14)}520400005303986540${params.amount.toFixed(2)}5802BR5915SHOP DA CIDADE6017CANAA DOS CARAJAS62070503***6304ABCD`;
      return {
        chargeId: 'pay_sim_' + Math.random().toString(36).substring(2, 10),
        status: 'PENDING',
        value: params.amount,
        pixCode: simulatedPixCode,
        pixQrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(simulatedPixCode)}`,
        dueDate
      };
    }

    const customerId = await this.getOrCreateCustomer(params.customer);

    const payload: any = {
      customer: customerId,
      billingType: 'PIX',
      value: params.amount,
      dueDate,
      description: params.description,
      externalReference: params.orderId,
      postalService: false
    };

    if (params.split && params.split.length > 0) {
      payload.split = params.split;
    }

    const charge = await this.request<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Fetch Pix QR Code and copy-paste string
    let pixCode = '';
    let pixQrBase64 = '';

    try {
      const qrRes = await this.request<{
        encodedImage: string;
        payload: string;
        expirationDate: string;
      }>(`/payments/${charge.id}/pixQrCode`);

      pixCode = qrRes.payload;
      pixQrBase64 = qrRes.encodedImage;
    } catch (e) {
      console.warn('Failed to fetch Asaas Pix QR Code:', e);
    }

    return {
      chargeId: charge.id,
      status: charge.status,
      value: charge.value,
      pixCode,
      pixQrBase64,
      pixQrCodeUrl: pixCode ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCode)}` : undefined,
      invoiceUrl: charge.invoiceUrl,
      dueDate: charge.dueDate
    };
  }

  // Create Credit Card Charge
  async createCardCharge(params: CreateCardChargeParams): Promise<{
    chargeId: string;
    status: string;
    value: number;
    invoiceUrl?: string;
  }> {
    const today = new Date().toISOString().split('T')[0];

    if (!this.apiKey || this.apiKey.includes('test_simulated')) {
      return {
        chargeId: 'pay_card_sim_' + Math.random().toString(36).substring(2, 10),
        status: 'CONFIRMED',
        value: params.amount
      };
    }

    const customerId = await this.getOrCreateCustomer(params.customer);

    const payload: any = {
      customer: customerId,
      billingType: 'CREDIT_CARD',
      value: params.amount,
      dueDate: today,
      description: params.description,
      externalReference: params.orderId,
      creditCard: {
        holderName: params.card.holderName,
        number: params.card.number.replace(/\s+/g, ''),
        expiryMonth: params.card.expiryMonth,
        expiryYear: params.card.expiryYear,
        ccv: params.card.ccv
      },
      creditCardHolderInfo: {
        name: params.customer.name,
        email: params.customer.email,
        cpfCnpj: params.customer.cpfCnpj ? params.customer.cpfCnpj.replace(/\D/g, '') : '00000000000',
        postalCode: params.customer.postalCode ? params.customer.postalCode.replace(/\D/g, '') : '68537000',
        addressNumber: params.customer.addressNumber || 'S/N',
        phone: params.customer.phone ? params.customer.phone.replace(/\D/g, '') : '94991234567'
      }
    };

    if (params.installments && params.installments > 1) {
      payload.installmentCount = params.installments;
      payload.installmentValue = Number((params.amount / params.installments).toFixed(2));
    }

    if (params.split && params.split.length > 0) {
      payload.split = params.split;
    }

    const charge = await this.request<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return {
      chargeId: charge.id,
      status: charge.status,
      value: charge.value,
      invoiceUrl: charge.invoiceUrl
    };
  }

  // Create Service Commission Link (For Ótica, Manicure, Barbeiro after appointment)
  async createServiceCommissionCharge(params: {
    serviceScheduleId: string;
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    serviceName: string;
    finalAmount: number;
    commissionPercent: number;
    providerName: string;
  }): Promise<{
    chargeId: string;
    commissionAmount: number;
    pixCode: string;
    pixQrCodeUrl?: string;
  }> {
    const commissionAmount = Number(((params.finalAmount * params.commissionPercent) / 100).toFixed(2));
    const description = `Comissão de Serviço (${params.commissionPercent}%) - ${params.serviceName} em ${params.providerName}`;

    const res = await this.createPixCharge({
      orderId: `svc_${params.serviceScheduleId}`,
      amount: commissionAmount,
      description,
      customer: {
        name: params.customerName,
        email: params.customerEmail || 'cliente@shopdacidade.com.br',
        phone: params.customerPhone
      }
    });

    return {
      chargeId: res.chargeId,
      commissionAmount,
      pixCode: res.pixCode,
      pixQrCodeUrl: res.pixQrCodeUrl
    };
  }

  // Get charge status from Asaas
  async getCharge(chargeId: string): Promise<any> {
    if (!this.apiKey || this.apiKey.includes('test_simulated')) {
      return { id: chargeId, status: 'CONFIRMED', value: 100 };
    }
    return await this.request(`/payments/${chargeId}`);
  }
}
