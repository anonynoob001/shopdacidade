// Shop Carajás - Courier Panel (Mobile-First for Delivery Riders)
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  Navigation,
  Phone,
  Power,
  RefreshCw,
  ShoppingBag,
  Store,
  Truck
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, formatBRL, formatDateBR } from '../services/api';
import { Courier, Delivery } from '../worker/types';

interface CourierDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CourierDashboard: React.FC<CourierDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [courier, setCourier] = useState<Courier | null>(null);
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [historyDeliveries, setHistoryDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history'>('available');
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const [profRes, availRes, actRes, histRes] = await Promise.all([
        apiRequest<{ courier: Courier }>('/api/couriers/profile'),
        apiRequest<{ deliveries: Delivery[] }>('/api/deliveries/available'),
        apiRequest<{ deliveries: Delivery[] }>('/api/deliveries/my-active'),
        apiRequest<{ deliveries: Delivery[] }>('/api/deliveries/my-history')
      ]);

      setCourier(profRes.courier);
      setAvailableDeliveries(availRes.deliveries || []);
      setActiveDeliveries(actRes.deliveries || []);
      setHistoryDeliveries(histRes.deliveries || []);

      if (actRes.deliveries && actRes.deliveries.length > 0) {
        setActiveTab('active');
      }
    } catch (err: any) {
      console.error('Failed to load courier data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleOnline = async () => {
    if (!courier) return;
    try {
      const newStatus = !courier.is_available;
      await apiRequest('/api/couriers/availability', {
        method: 'POST',
        body: JSON.stringify({ is_available: newStatus })
      });
      setCourier({ ...courier, is_available: newStatus ? 1 : 0 });
    } catch (err: any) {
      alert(err?.message || 'Falha ao alterar disponibilidade.');
    }
  };

  const handleAcceptDelivery = async (deliveryId: string) => {
    setActionError(null);
    try {
      await apiRequest(`/api/deliveries/${deliveryId}/accept`, { method: 'POST' });
      await loadData();
      setActiveTab('active');
    } catch (err: any) {
      setActionError(err?.message || 'Não foi possível assumir esta entrega.');
    }
  };

  const handleAdvanceStatus = async (deliveryId: string, nextStatus: string) => {
    setActionError(null);
    try {
      await apiRequest(`/api/deliveries/${deliveryId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: nextStatus })
      });
      await loadData();
    } catch (err: any) {
      setActionError(err?.message || 'Falha ao atualizar status.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Mobile-first Header */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Início
          </button>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            title="Atualizar corridas"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight">{courier?.user_name || 'Entregador de Canaã'}</h1>
            <p className="text-xs text-slate-400">Veículo: {courier?.vehicle_type === 'moto' ? 'Motocicleta' : 'Bicicleta'} • Canaã dos Carajás</p>
          </div>

          <button
            onClick={handleToggleOnline}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              courier?.is_available ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            <Power className="w-4 h-4" />
            {courier?.is_available ? 'Online (Disponível)' : 'Offline (Pausa)'}
          </button>
        </div>

        {/* Courier Balance & Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Saldo Acumulado</span>
            <span className="text-lg font-black text-emerald-400">{formatBRL(courier?.balance || 0)}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Entregas Concluídas</span>
            <span className="text-lg font-black text-white">{courier?.total_deliveries || 0}</span>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-3 p-1 bg-slate-200/80 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('active')}
          className={`py-2.5 rounded-xl transition cursor-pointer relative ${
            activeTab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          <span>Em Andamento</span>
          {activeDeliveries.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px]">
              {activeDeliveries.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`py-2.5 rounded-xl transition cursor-pointer relative ${
            activeTab === 'available' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          <span>Disponíveis</span>
          {availableDeliveries.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px]">
              {availableDeliveries.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          Histórico
        </button>
      </div>

      {/* TAB: ACTIVE DELIVERIES */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeDeliveries.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-white border border-slate-200 p-6 space-y-2">
              <Truck className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Nenhuma entrega em andamento</h3>
              <p className="text-xs text-slate-500">Veja a aba de entregas disponíveis para assumir coletas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeDeliveries.map(deliv => (
                <div key={deliv.id} className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-extrabold text-sm text-slate-900">{deliv.sub_order_code}</span>
                    <span className="font-black text-sm text-emerald-700">Ganho: {formatBRL(deliv.courier_earnings)}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Ponto de Coleta</span>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-emerald-600" />
                        {deliv.store_name}
                      </div>
                      <p className="text-slate-600">{deliv.pickup_address}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Endereço de Entrega</span>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {deliv.delivery_address}
                      </div>
                      <p className="text-slate-600">{deliv.customer_contact}</p>
                    </div>
                  </div>

                  {/* Flow Action Buttons */}
                  <div className="pt-2 flex flex-col gap-2">
                    {deliv.status === 'accepted' && (
                      <button
                        onClick={() => handleAdvanceStatus(deliv.id, 'heading_to_store')}
                        className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Navigation className="w-4 h-4" />
                        A Caminho da Loja
                      </button>
                    )}

                    {deliv.status === 'heading_to_store' && (
                      <button
                        onClick={() => handleAdvanceStatus(deliv.id, 'picked_up')}
                        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Pedido Coletado na Loja
                      </button>
                    )}

                    {deliv.status === 'picked_up' && (
                      <button
                        onClick={() => handleAdvanceStatus(deliv.id, 'in_transit')}
                        className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Truck className="w-4 h-4" />
                        Em Trânsito para o Cliente
                      </button>
                    )}

                    {deliv.status === 'in_transit' && (
                      <button
                        onClick={() => handleAdvanceStatus(deliv.id, 'delivered')}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirmar Entrega Concluída
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: AVAILABLE DELIVERIES */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {!courier?.is_available ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              Você está Offline. Ative seu status para poder assumir entregas.
            </div>
          ) : availableDeliveries.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-white border border-slate-200 p-6 space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Nenhuma entrega aguardando no momento</h3>
              <p className="text-xs text-slate-500">Aguarde novos pedidos saírem das lojas de Canaã dos Carajás.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableDeliveries.map(deliv => (
                <div key={deliv.id} className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-extrabold text-sm text-slate-900">{deliv.store_name}</span>
                    <span className="text-emerald-700 font-black text-sm">Remuneração: {formatBRL(deliv.courier_earnings)}</span>
                  </div>

                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      <span>Coleta: {deliv.pickup_address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Entrega: {deliv.delivery_address}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcceptDelivery(deliv.id)}
                    className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Truck className="w-4 h-4" />
                    Aceitar esta Entrega
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs text-xs">
          <h3 className="font-bold text-sm text-slate-900">Histórico de Corridas Concluídas</h3>
          {historyDeliveries.length === 0 ? (
            <p className="text-slate-500 py-4">Nenhuma entrega concluída no histórico recente.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {historyDeliveries.map(h => (
                <div key={h.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">{h.sub_order_code}</span>
                    <span className="text-[10px] text-slate-400">{formatDateBR(h.delivered_time || h.updated_at)}</span>
                  </div>
                  <span className="font-black text-emerald-700">{formatBRL(h.courier_earnings)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
