// Shop Carajás - Frontend API Service & Formatting Utilities

export function getAuthToken(): string | null {
  return localStorage.getItem('shop_carajas_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('shop_carajas_token', token);
  } else {
    localStorage.removeItem('shop_carajas_token');
  }
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Erro na requisição: ${response.status}`);
  }

  return data as T;
}

// Format currency to Brazilian Real (R$)
export function formatBRL(value?: number | null): string {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Format dates according to Brazilian standards (America/Belem context)
export function formatDateBR(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Belem'
    }).format(d);
  } catch {
    return dateString;
  }
}

// Canaã dos Carajás Main Neighborhoods
export const CANAA_NEIGHBORHOODS = [
  'Centro',
  'Novo Horizonte',
  'Alto Bonito',
  'Bela Vista',
  'Parque dos Carajás',
  'Vale da Bênção',
  'Vale dos Sonhos',
  'Residencial Canaã',
  'São Ciro',
  'Jardim Europa',
  'Zona Rural'
];
