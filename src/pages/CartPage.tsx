// Shop Carajás - Multi-Store Shopping Cart & Checkout Page
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  MapPin,
  Minus,
  Plus,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  Truck
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { apiRequest, CANAA_NEIGHBORHOODS, formatBRL } from '../services/api';

interface CartPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const { user, openAuthModal } = useAuth();
  const { items, groups, totalItemCount, totalProductsAmount, totalDeliveryAmount, grandTotal, updateQuantity, removeItem, clearCart } = useCart();

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'delivery_cash' | 'delivery_card' | 'credit_card'>('pix');

  // Customer info
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');

  // Shipping address
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('Centro');
  const [complement, setComplement] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync user info if user logs in
  React.useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerEmail) setCustomerEmail(user.email);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Seu carrinho está vazio</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Explore os comércios locais de Canaã dos Carajás e adicione produtos ao seu carrinho.
        </p>
        <div className="pt-2">
          <button
            onClick={() => onNavigate('stores')}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            Explorar Lojas em Canaã
          </button>
        </div>
      </div>
    );
  }

  const effectiveDeliveryTotal = deliveryType === 'pickup' ? 0 : totalDeliveryAmount;
  const finalTotal = totalProductsAmount + effectiveDeliveryTotal;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName || !customerEmail || !customerPhone) {
      setError('Por favor preencha nome, e-mail e telefone para contato.');
      return;
    }

    if (deliveryType === 'delivery' && (!street || !neighborhood)) {
      setError('Por favor preencha o endereço completo com rua e bairro em Canaã dos Carajás.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        delivery_type: deliveryType,
        shipping_address: deliveryType === 'delivery' ? {
          street,
          number: number || 'S/N',
          neighborhood,
          complement,
          reference_point: reference,
          city: 'Canaã dos Carajás',
          state: 'PA'
        } : null,
        payment_method: paymentMethod,
        items: items.map(it => ({
          product_id: it.product_id,
          quantity: it.quantity,
          selected_variation: it.selected_variation
        })),
        notes
      };

      const res = await apiRequest<{ success: boolean; orderCode: string; orderId: string }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      clearCart();
      onNavigate('order-confirmation', res.orderCode);
    } catch (err: any) {
      setError(err?.message || 'Falha ao processar o pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <button
          onClick={() => onNavigate('home')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Continuar Comprando
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Meu Carrinho ({totalItemCount} {totalItemCount === 1 ? 'item' : 'itens'})
        </h1>
        {groups.length > 1 && (
          <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2 max-w-2xl">
            <strong>Aviso de Multi-Lojas:</strong> Seu carrinho contém itens de {groups.length} lojas diferentes. Cada loja receberá seu subpedido separadamente para preparação e entrega.
          </p>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart items grouped by store + Delivery details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Store Groups */}
          <div className="space-y-4">
            {groups.map(group => (
              <div key={group.store_id} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
                {/* Store header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{group.store_name}</h3>
                      <span className="text-[10px] text-slate-400">Subpedido exclusivo desta loja</span>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-slate-500">Taxa entrega: </span>
                    <span className="font-bold text-slate-800">
                      {deliveryType === 'pickup' ? 'Retirada (R$ 0)' : group.delivery_fee > 0 ? formatBRL(group.delivery_fee) : 'Grátis'}
                    </span>
                  </div>
                </div>

                {/* Items in this store */}
                <div className="divide-y divide-slate-100">
                  {group.items.map(item => (
                    <div key={item.product_id} className="py-3 flex items-center gap-3">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{item.name}</h4>
                        <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                          {formatBRL(item.price)}
                        </div>
                      </div>

                      {/* Quantity selector */}
                      <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg p-1 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.selected_variation)}
                          className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-slate-800 w-4 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.selected_variation)}
                          className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right w-20">
                        <span className="font-black text-xs text-slate-900">
                          {formatBRL(item.price * item.quantity)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.product_id, item.selected_variation)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Subtotal da Loja:</span>
                  <span className="font-extrabold text-slate-900">{formatBRL(group.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery & Shipping Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              Tipo de Recebimento
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setDeliveryType('delivery')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                  deliveryType === 'delivery'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-950 font-bold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <span>Entrega no Endereço</span>
                <span className="text-[11px] font-normal text-slate-500">Motoboy ou entrega própria em Canaã</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('pickup')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                  deliveryType === 'pickup'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-950 font-bold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <span>Retirada no Estabelecimento</span>
                <span className="text-[11px] font-normal text-slate-500">Buscar direto no balcão da loja</span>
              </button>
            </div>

            {/* Address fields if delivery */}
            {deliveryType === 'delivery' && (
              <div className="space-y-3 pt-2 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Rua / Logradouro *</label>
                    <input
                      type="text"
                      required={deliveryType === 'delivery'}
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                      placeholder="Ex: Av. Weyne Cavalcante"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Número</label>
                    <input
                      type="text"
                      value={number}
                      onChange={e => setNumber(e.target.value)}
                      placeholder="123 ou S/N"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bairro em Canaã dos Carajás *</label>
                    <select
                      value={neighborhood}
                      onChange={e => setNeighborhood(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
                    >
                      {CANAA_NEIGHBORHOODS.map(b => (
                        <option key={b} value={b}>Bairro {b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Complemento</label>
                    <input
                      type="text"
                      value={complement}
                      onChange={e => setComplement(e.target.value)}
                      placeholder="Apto, Sala, Bloco"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ponto de Referência</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    placeholder="Próximo à padaria, igreja, praça, etc."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Info, Payment method & Order summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* Customer identification */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-xs text-xs">
            <h3 className="font-bold text-sm text-slate-900">Dados do Comprador</h3>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Seu nome"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">WhatsApp / Telefone *</label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="(94) 99123-4567"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-xs text-xs">
            <h3 className="font-bold text-sm text-slate-900">Forma de Pagamento</h3>
            <div className="space-y-2">
              <label
                onClick={() => setPaymentMethod('pix')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  paymentMethod === 'pix' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-slate-900 block">PIX (Recomendado)</span>
                    <span className="text-[10px] text-slate-500">Aprovação imediata e preparo mais rápido</span>
                  </div>
                </div>
                <input type="radio" checked={paymentMethod === 'pix'} readOnly className="accent-emerald-600" />
              </label>

              <label
                onClick={() => setPaymentMethod('delivery_card')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  paymentMethod === 'delivery_card' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-slate-700" />
                  <div>
                    <span className="font-bold text-slate-900 block">Cartão na Entrega / Retirada</span>
                    <span className="text-[10px] text-slate-500">Pague na maquininha do entregador ou balcão</span>
                  </div>
                </div>
                <input type="radio" checked={paymentMethod === 'delivery_card'} readOnly className="accent-emerald-600" />
              </label>

              <label
                onClick={() => setPaymentMethod('delivery_cash')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  paymentMethod === 'delivery_cash' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-black text-emerald-700 text-sm">R$</span>
                  <div>
                    <span className="font-bold text-slate-900 block">Dinheiro na Entrega</span>
                    <span className="text-[10px] text-slate-500">Pague em espécie ao receber o pedido</span>
                  </div>
                </div>
                <input type="radio" checked={paymentMethod === 'delivery_cash'} readOnly className="accent-emerald-600" />
              </label>
            </div>
          </div>

          {/* Order Summary & Submit */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 text-white shadow-xl">
            <h3 className="font-bold text-base tracking-tight">Resumo do Pedido</h3>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal dos produtos</span>
                <span className="font-bold text-white">{formatBRL(totalProductsAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxas de entrega somadas</span>
                <span className="font-bold text-white">
                  {deliveryType === 'pickup' ? 'R$ 0,00 (Retirada)' : formatBRL(effectiveDeliveryTotal)}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Total a pagar:</span>
                <span className="text-xl font-black text-emerald-400">{formatBRL(finalTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-extrabold text-slate-950 text-sm tracking-wide shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Gerando Pedido...' : 'Confirmar e Fechar Pedido'}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Compra 100% segura pelo Shop da Cidade — Canaã dos Carajás</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
