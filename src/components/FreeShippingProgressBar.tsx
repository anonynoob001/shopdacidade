// Shop da Cidade - Dynamic Free Shipping Progress Bar Component
import { CheckCircle2, Sparkles, Truck } from 'lucide-react';
import React from 'react';
import { formatBRL } from '../services/api';

interface FreeShippingProgressBarProps {
  subtotal: number;
  freeDeliveryMinimum: number;
  storeName?: string;
}

export const FreeShippingProgressBar: React.FC<FreeShippingProgressBarProps> = ({
  subtotal,
  freeDeliveryMinimum,
  storeName
}) => {
  if (!freeDeliveryMinimum || freeDeliveryMinimum <= 0) {
    return null;
  }

  const percentage = Math.min(Math.round((subtotal / freeDeliveryMinimum) * 100), 100);
  const remaining = Number(Math.max(freeDeliveryMinimum - subtotal, 0).toFixed(2));
  const hasUnlocked = remaining <= 0;

  return (
    <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
      hasUnlocked
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950'
        : 'bg-blue-50/80 border-blue-200/80 text-slate-800'
    }`}>
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-1.5 font-bold">
          {hasUnlocked ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">
                Parabéns! Você ganhou <strong className="font-black">Frete Grátis</strong> {storeName ? `na ${storeName}` : ''}! 🎉
              </span>
            </>
          ) : (
            <>
              <Truck className="w-4 h-4 text-[#0047F7] animate-bounce" />
              <span>
                Faltam apenas <strong className="text-[#FA4802] font-black">{formatBRL(remaining)}</strong> para <strong className="text-[#0047F7] font-black">Frete Grátis</strong>!
              </span>
            </>
          )}
        </div>
        <span className="font-extrabold text-[11px] text-slate-600">
          {percentage}%
        </span>
      </div>

      {/* Progress track */}
      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden relative">
        <div
          style={{ width: `${percentage}%` }}
          className={`h-full rounded-full transition-all duration-500 ${
            hasUnlocked
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/30'
              : 'bg-gradient-to-r from-[#0047F7] to-[#FA4802]'
          }`}
        />
      </div>

      {!hasUnlocked && (
        <p className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-between">
          <span>Adicione mais itens desta loja para não pagar taxa de entrega em Canaã.</span>
          <span className="font-semibold text-slate-700">Mínimo: {formatBRL(freeDeliveryMinimum)}</span>
        </p>
      )}
    </div>
  );
};
