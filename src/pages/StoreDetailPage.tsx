// Shop da Cidade - Individual Store Public Page with Custom Merchant Colors & Dedicated URL
import {
  ArrowLeft,
  Check,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  Instagram,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
  Plus,
  Share2,
  ShoppingBag,
  Star,
  Store as StoreIcon,
  Truck
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { apiRequest, formatBRL, formatDateBR } from '../services/api';
import { Product, Review, Store } from '../worker/types';

interface StoreDetailPageProps {
  storeSlug: string;
  onNavigate: (view: string, param?: string) => void;
}

export const StoreDetailPage: React.FC<StoreDetailPageProps> = ({ storeSlug, onNavigate }) => {
  const { addItem } = useCart();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadStore() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiRequest<{ store: Store; products: Product[]; reviews: Review[] }>(`/api/stores/${storeSlug}`);
        setStore(res.store);
        setProducts(res.products || []);
        setReviews(res.reviews || []);
      } catch (err: any) {
        setError(err?.message || 'Loja não encontrada.');
      } finally {
        setIsLoading(false);
      }
    }
    loadStore();
  }, [storeSlug]);

  const handleCopyStoreLink = () => {
    const storeUrl = typeof window !== 'undefined' ? `${window.location.origin}/loja/${storeSlug}` : '';
    if (storeUrl && navigator.clipboard) {
      navigator.clipboard.writeText(storeUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Carregando catálogo da loja...</span>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <StoreIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Loja não encontrada</h2>
        <p className="text-xs text-slate-500 mt-1">{error || 'O estabelecimento solicitado não está ativo ou o link expirou.'}</p>
        <button
          onClick={() => onNavigate('stores')}
          className="mt-5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md cursor-pointer hover:bg-slate-800 transition"
        >
          Voltar para Lojas
        </button>
      </div>
    );
  }

  const primaryColor = store.theme_color_primary || '#fdca04';
  const secondaryColor = store.theme_color_secondary || '#0f172a';

  return (
    <div className="pb-16 space-y-6">
      {/* Merchant Custom Announcement Banner (if configured by store owner) */}
      {store.custom_announcement && (
        <div
          style={{ backgroundColor: secondaryColor, color: primaryColor }}
          className="py-2.5 px-4 text-center text-xs font-bold border-b border-white/10 shadow-xs flex items-center justify-center gap-2"
        >
          <Megaphone className="w-4 h-4 shrink-0 animate-bounce" />
          <span>{store.custom_announcement}</span>
        </div>
      )}

      {/* Store Banner & Profile Header */}
      <div style={{ backgroundColor: secondaryColor }} className="relative text-white border-b border-white/10 shadow-sm">
        <div className="h-48 md:h-64 relative overflow-hidden bg-slate-950">
          <img
            src={store.banner_url || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=400&fit=crop&q=80'}
            alt={store.name}
            className="w-full h-full object-cover opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 -mt-16 sm:-mt-20 relative z-10 pb-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              onClick={() => onNavigate('stores')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-xs text-xs font-semibold text-slate-300 hover:text-white border border-slate-700/80 cursor-pointer transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para Lojas
            </button>

            {/* Share / Copy URL Button */}
            <button
              type="button"
              onClick={handleCopyStoreLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-xs text-xs font-bold text-white border border-white/20 cursor-pointer transition shadow-xs"
              title="Copiar URL exclusiva desta loja"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copiar Link da Loja</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-start gap-4">
              <img
                src={store.logo_url || 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=200&h=200&fit=crop&q=80'}
                alt={store.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-slate-900 shadow-xl bg-slate-800 shrink-0"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    style={{ backgroundColor: `${primaryColor}25`, color: primaryColor, borderColor: `${primaryColor}50` }}
                    className="px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider"
                  >
                    {store.category}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Oficial
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {store.name}
                </h1>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300 pt-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{store.street ? `${store.street}, ${store.number || 'S/N'} - ` : ''}Bairro {store.neighborhood}, Canaã dos Carajás</span>
                  </div>
                  {store.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{store.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {store.instagram && (
                <a
                  href={`https://instagram.com/${store.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </a>
              )}

              {store.whatsapp && (
                <a
                  href={`https://wa.me/55${store.whatsapp.replace(/\D/g, '')}?text=Olá,%20vi%20sua%20loja%20no%20Shop%20da%20Cidade!`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chamar no WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* Delivery & Operation highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Taxa de Entrega</span>
              <span style={{ color: primaryColor }} className="font-black text-sm">
                {store.delivery_fee_base > 0 ? formatBRL(store.delivery_fee_base) : 'Entrega Grátis'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tempo Médio</span>
              <span className="font-bold text-white text-sm">{store.delivery_time_min || '30-50 min'}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Frete Grátis acima de</span>
              <span className="font-bold text-white text-sm">
                {store.free_delivery_minimum ? formatBRL(store.free_delivery_minimum) : 'Consulte'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Atendimento</span>
              <span className="font-bold text-white text-sm">Entrega & Retirada</span>
            </div>
          </div>
        </div>
      </div>

      {/* Store Products Catalog */}
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Catálogo de Produtos</h2>
            <p className="text-xs text-slate-500">{products.length} itens disponíveis para pronta entrega ou encomenda em Canaã</p>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Link Exclusivo: <strong className="text-slate-700">/loja/{store.slug}</strong></span>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-white border border-slate-200 p-8">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Nenhum produto cadastrado no momento</h3>
            <p className="text-xs text-slate-500 mt-1">Este lojista está atualizando o catálogo da sua loja.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map(prod => {
              const hasPromo = prod.promotional_price && prod.promotional_price > 0 && prod.promotional_price < prod.price;
              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="relative aspect-square bg-slate-50 overflow-hidden">
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-full h-full object-cover hover:scale-105 transition duration-500"
                    />
                    {hasPromo && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow">
                        Oferta
                      </span>
                    )}
                    {prod.stock_quantity <= 0 && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold">
                        Esgotado
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug">
                        {prod.name}
                      </h3>
                      {prod.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {prod.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        {hasPromo ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base sm:text-lg font-black text-amber-600">
                              {formatBRL(prod.promotional_price)}
                            </span>
                            <span className="text-xs text-slate-400 line-through">
                              {formatBRL(prod.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-base sm:text-lg font-black text-slate-900">
                            {formatBRL(prod.price)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => addItem({ ...prod, store_name: store.name, delivery_fee_base: store.delivery_fee_base, free_delivery_minimum: store.free_delivery_minimum }, 1)}
                        disabled={prod.stock_quantity <= 0}
                        style={{
                          backgroundColor: primaryColor,
                          color: '#0f172a'
                        }}
                        className="w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs hover:brightness-105 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        Adicionar ao Carrinho
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Avaliações da Loja */}
        {reviews.length > 0 && (
          <div className="pt-8 border-t border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Avaliações de Clientes Verificados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map(rev => (
                <div key={rev.id} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{rev.user_name || 'Cliente de Canaã'}</span>
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 italic">"{rev.comment}"</p>
                  <span className="text-[10px] text-slate-400 block">{formatDateBR(rev.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
