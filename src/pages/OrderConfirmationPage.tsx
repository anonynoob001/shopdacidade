import {
  ArrowLeft,
  CheckCircle,
  Copy,
  ExternalLink,
  Package,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, formatBRL, formatDateBR } from '../services/api';
import { Order } from '../worker/types';
import { OrderTrackingTimeline } from '../components/OrderTrackingTimeline';

interface OrderConfirmationPageProps {
  orderCode: string;
  onNavigate: (view: string, param?: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({ orderCode, onNavigate }) => {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [confirmingPix, setConfirmingPix] = useState(false);
  const [pixConfirmed, setPixConfirmed] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await apiRequest<{ order: Order }>(`/api/orders/${orderCode}`);
      setOrder(res.order);
      if (res.order.payment_status === 'confirmed') {
        setPixConfirmed(true);
      }
    } catch (e) {
      console.error('Failed to load order:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Auto-poll order payment status every 4 seconds until confirmed
    const interval = setInterval(() => {
      if (!pixConfirmed) {
        fetchOrder();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [orderCode, pixConfirmed]);

  const handleCopyPix = () => {
    if (order?.pix_code) {
      navigator.clipboard.writeText(order.pix_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleSimulatePixConfirm = async () => {
    setConfirmingPix(true);
    try {
      await apiRequest(`/api/orders/${orderCode}/confirm-pix`, { method: 'POST' });
      setPixConfirmed(true);
      await fetchOrder();
    } catch (err: any) {
      alert(err?.message || 'Falha ao confirmar pagamento.');
    } finally {
      setConfirmingPix(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center text-slate-400">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Pedido não encontrado</h2>
        <button onClick={() => onNavigate('home')} className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs">
          Voltar para Início
        </button>
      </div>
    );
  }

  const isPix = order.payment_method === 'pix';
  const isPaid = order.payment_status === 'confirmed' || pixConfirmed;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Success banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Pedido Registrado com Sucesso</span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Código do Pedido: <span className="text-emerald-700">{order.order_code}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Recebemos seu pedido para entrega em Canaã dos Carajás, PA.
          </p>
        </div>

        {/* PIX Payment Section */}
        {isPix && !isPaid && (
          <div className="mt-6 p-6 rounded-2xl bg-slate-900 text-white text-left space-y-4 shadow-xl border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">Pagamento via PIX • Copia e Cola</span>
              </div>
              <span className="text-xs text-amber-400 font-bold">Aguardando Pagamento</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Copie o código PIX abaixo e abra o aplicativo do seu banco na opção <strong>PIX Copia e Cola</strong>.
              O beneficiário é <strong>SHOP CARAJAS LTDA</strong> no valor de <strong className="text-emerald-400">{formatBRL(order.total_amount)}</strong>.
            </p>

            <div className="relative">
              <textarea
                readOnly
                rows={3}
                value={order.pix_code || ''}
                className="w-full p-3 bg-slate-950 font-mono text-[11px] text-emerald-300 rounded-xl border border-slate-800 focus:outline-none select-all"
              />
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCopyPix}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition active:scale-95 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Código PIX Copiado!' : 'Copiar Código PIX'}
                </button>

                {user && (user.role === 'admin' || user.role === 'superadmin') && (
                  <button
                    onClick={handleSimulatePixConfirm}
                    disabled={confirmingPix}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition cursor-pointer"
                    title="Ação restrita a administradores do Shop da Cidade"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    {confirmingPix ? 'Confirmando...' : 'Admin: Confirmar Pagamento'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 text-[11px] text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span>Detecção bancária ativa em tempo real. Esta tela atualiza automaticamente assim que o pagamento for concluído.</span>
              </div>
            </div>
          </div>
        )}

        {isPaid && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Pagamento Confirmado! As lojas já foram notificadas e estão preparando seus itens.</span>
          </div>
        )}
      </div>

      {/* Real-Time Live Order Tracking Timeline */}
      <OrderTrackingTimeline
        status={isPaid ? (order.sub_orders?.[0]?.status || 'preparing') : 'pending'}
        deliveryType={order.delivery_type as any}
        estimatedTime="25-45 min"
        subOrderCode={order.order_code}
      />

      {/* Sub-Orders Breakdown by Store */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 tracking-tight">
          Lojas e Itens do Pedido ({order.sub_orders?.length || 1} subpedidos independentes)
        </h3>

        <div className="space-y-4">
          {order.sub_orders?.map(sub => (
            <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#0047F7]" />
                  <span className="font-bold text-xs sm:text-sm text-slate-900">{sub.store_name}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0047F7] text-[10px] font-bold uppercase tracking-wider">
                  Status: {sub.status}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {sub.items?.map(it => (
                  <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img src={it.product_image || ''} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      <span className="text-slate-800 font-medium">
                        {it.quantity}x {it.product_name}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900">{formatBRL(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-500 block text-[11px]">Taxa de entrega: {sub.delivery_fee > 0 ? formatBRL(sub.delivery_fee) : 'Grátis'}</span>
                  <span className="text-slate-900 font-extrabold text-sm block">Total na Loja: {formatBRL(sub.store_subtotal + sub.delivery_fee)}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                  <Truck className="w-3.5 h-3.5 text-[#0047F7]" />
                  <span>Entrega em Canaã dos Carajás</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            onClick={() => onNavigate('my-orders')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0047F7] hover:bg-[#0038c7] text-white font-bold text-xs transition cursor-pointer shadow-md shadow-blue-500/20"
          >
            Acompanhar Todos os Meus Pedidos
          </button>

          <button
            onClick={() => onNavigate('home')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
          >
            Voltar para o Início
          </button>
        </div>
      </div>
    </div>
  );
};
