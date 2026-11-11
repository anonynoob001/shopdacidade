// Shop da Cidade - Real-Time Visual Order Tracking Timeline Component
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Store,
  Truck
} from 'lucide-react';
import React from 'react';
import { SubOrder } from '../worker/types';

interface OrderTrackingTimelineProps {
  status: string; // 'pending' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled'
  deliveryType?: 'delivery' | 'pickup';
  estimatedTime?: string;
  storeName?: string;
  subOrderCode?: string;
}

export const OrderTrackingTimeline: React.FC<OrderTrackingTimelineProps> = ({
  status,
  deliveryType = 'delivery',
  estimatedTime = '25-45 min',
  storeName,
  subOrderCode
}) => {
  // Map raw status to step index 0..3
  const getStepIndex = (st: string) => {
    switch (st.toLowerCase()) {
      case 'pending':
        return 0;
      case 'preparing':
      case 'ready_for_pickup':
        return 1;
      case 'out_for_delivery':
        return 2;
      case 'delivered':
        return 3;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(status);
  const isCancelled = status.toLowerCase() === 'cancelled';

  const steps = [
    {
      label: 'Pedido Recebido',
      desc: 'Confirmado no sistema',
      icon: CheckCircle2
    },
    {
      label: 'Em Preparação',
      desc: 'Separando seus itens',
      icon: Store
    },
    {
      label: deliveryType === 'pickup' ? 'Pronto p/ Retirada' : 'Saiu para Entrega',
      desc: deliveryType === 'pickup' ? 'Disponível no balcão' : 'A caminho com entregador',
      icon: deliveryType === 'pickup' ? PackageCheck : Truck
    },
    {
      label: 'Pedido Concluído',
      desc: deliveryType === 'pickup' ? 'Retirado com sucesso' : 'Entregue no endereço',
      icon: CheckCircle2
    }
  ];

  if (isCancelled) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-xs">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <div>
          <span className="font-bold block">Pedido Cancelado</span>
          <span className="text-[11px] text-rose-600">Este subpedido foi cancelado. Para dúvidas, contate o suporte.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-bold text-[#FA4802] uppercase tracking-wider block">
            Rastreamento em Tempo Real
          </span>
          <h4 className="font-bold text-sm text-white">
            {storeName ? `Progresso do Pedido • ${storeName}` : 'Status da Entrega em Canaã'}
          </h4>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 text-[#FA4802]" />
          <span>Previsão: {estimatedTime}</span>
        </div>
      </div>

      {/* Progress Line & Steps */}
      <div className="relative pt-2 pb-1">
        {/* Background connecting track */}
        <div className="absolute top-7 left-6 right-6 h-1 bg-slate-800 -translate-y-1/2 z-0 hidden sm:block" />

        {/* Active progress fill */}
        <div
          style={{ width: `${(Math.min(currentStep, 3) / 3) * 100}%` }}
          className="absolute top-7 left-6 h-1 bg-gradient-to-r from-[#0047F7] to-[#FA4802] -translate-y-1/2 z-0 transition-all duration-700 hidden sm:block"
        />

        {/* Step Circles */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 relative z-10">
          {steps.map((st, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            const Icon = st.icon;

            return (
              <div key={st.label} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-[#0047F7] text-white shadow-md shadow-blue-500/20'
                      : isCurrent
                      ? 'bg-[#FA4802] text-white shadow-lg shadow-orange-500/40 ring-4 ring-[#FA4802]/30 scale-105'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 sm:flex-none">
                  <span
                    className={`font-bold text-xs block leading-tight ${
                      isCurrent ? 'text-[#FA4802]' : isCompleted ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {st.label}
                  </span>
                  <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                    {st.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time status badge */}
      <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-300">
            {currentStep === 0 && 'Aguardando confirmação e separação pela loja'}
            {currentStep === 1 && 'Loja separando e embalando seus produtos em Canaã'}
            {currentStep === 2 && 'Entregador em trânsito para o seu endereço'}
            {currentStep === 3 && 'Pedido concluído e entregue com sucesso!'}
          </span>
        </div>
        {subOrderCode && (
          <span className="font-mono text-[11px] text-slate-400 font-bold">
            Ref: {subOrderCode}
          </span>
        )}
      </div>
    </div>
  );
};
