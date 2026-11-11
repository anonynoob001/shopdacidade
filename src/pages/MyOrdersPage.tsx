// Shop Carajás - Customer Orders & Tracking History Page
import { ArrowLeft, Clock, Eye, Package, ShoppingBag, Store, Truck } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, formatBRL, formatDateBR } from '../services/api';
import { Order } from '../worker/types';
import { OrderTrackingTimeline } from '../components/OrderTrackingTimeline';

interface MyOrdersPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const MyOrdersPage: React.FC<MyOrdersPageProps> = ({ onNavigate }) => {
  const { user, openAuthModal } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await apiRequest<{ orders: Order[] }>('/api/orders/my-orders');
        setOrders(res.orders || []);
      } catch (err) {
        console.error('Failed to load my orders:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <Package className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Acesse sua conta para ver seus pedidos</h2>
        <p className="text-xs text-slate-500">Faça login para acompanhar o status e entregas em Canaã.</p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition cursor-pointer"
        >
          Entrar na Conta
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <button
          onClick={() => onNavigate('home')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o início
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Meus Pedidos de Compra
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Acompanhe o andamento de cada loja e entrega em Canaã dos Carajás.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center text-slate-400">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Você ainda não realizou nenhum pedido</h3>
          <p className="text-xs text-slate-500">Compre nas lojas parceiras de Canaã e receba com rapidez.</p>
          <button
            onClick={() => onNavigate('stores')}
            className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
          >
            Ver Lojas
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900">{order.order_code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      order.payment_status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.payment_status === 'confirmed' ? 'Pago' : 'Aguardando Pagamento'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{formatDateBR(order.created_at)}</span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Total do Pedido:</span>
                  <span className="font-black text-lg text-[#0047F7]">{formatBRL(order.total_amount)}</span>
                </div>
              </div>

              {/* Real-Time Live Order Tracking Timeline */}
              <OrderTrackingTimeline
                status={order.payment_status === 'confirmed' ? (order.sub_orders?.[0]?.status || 'preparing') : 'pending'}
                deliveryType={order.delivery_type as any}
                estimatedTime="25-45 min"
                subOrderCode={order.order_code}
              />

              {/* Sub-orders */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Lojas e Entregas deste pedido:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {order.sub_orders?.map(sub => (
                    <div key={sub.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Store className="w-3.5 h-3.5 text-[#0047F7]" />
                          <span>{sub.store_name}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-[#0047F7] text-[10px] font-semibold uppercase">
                          {sub.status}
                        </span>
                      </div>

                      <div className="space-y-1 text-slate-600">
                        {sub.items?.map(it => (
                          <div key={it.id} className="flex justify-between text-[11px]">
                            <span>{it.quantity}x {it.product_name}</span>
                            <span className="font-semibold text-slate-800">{formatBRL(it.subtotal)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
                        <span>Taxa de entrega: {sub.delivery_fee > 0 ? formatBRL(sub.delivery_fee) : 'Grátis'}</span>
                        <span className="font-bold text-slate-900">Subtotal: {formatBRL(sub.store_subtotal + sub.delivery_fee)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onNavigate('order-confirmation', order.order_code)}
                  className="px-4 py-2 rounded-xl bg-[#0047F7] hover:bg-[#0038c7] text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-500/20"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver Detalhes do Pedido
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
