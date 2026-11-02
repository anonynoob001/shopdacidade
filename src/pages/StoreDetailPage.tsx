// Shop da Cidade - White-Label Dedicated Storefront for Individual Merchants
import {
  ArrowLeft,
  Check,
  CheckCircle,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Instagram,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
  Plus,
  QrCode,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store as StoreIcon,
  Truck,
  X
} from 'lucide-react';
import QRCode from 'qrcode';
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { apiRequest, formatBRL, formatDateBR } from '../services/api';
import { Product, Review, Store } from '../worker/types';

interface StoreDetailPageProps {
  storeSlug: string;
  onNavigate: (view: string, param?: string) => void;
}

export const StoreDetailPage: React.FC<StoreDetailPageProps> = ({ storeSlug, onNavigate }) => {
  const { addItem, totalItemCount, grandTotal } = useCart();
  const { openAuthModal, user } = useAuth();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter within store
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Share & QR Code states
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

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

  // Generate QR Code for store sharing
  useEffect(() => {
    if (typeof window !== 'undefined' && storeSlug) {
      const storeUrl = `${window.location.origin}/loja/${storeSlug}`;
      QRCode.toDataURL(storeUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: store?.theme_color_secondary || '#0f172a',
          light: '#ffffff'
        }
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(() => {});
    }
  }, [storeSlug, store?.theme_color_secondary]);

  const handleCopyStoreLink = () => {
    const storeUrl = typeof window !== 'undefined' ? `${window.location.origin}/loja/${storeSlug}` : '';
    if (storeUrl && navigator.clipboard) {
      navigator.clipboard.writeText(storeUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    const storeUrl = typeof window !== 'undefined' ? `${window.location.origin}/loja/${storeSlug}` : '';
    if (navigator.share && store) {
      try {
        await navigator.share({
          title: store.name,
          text: `Confira os produtos e faça seu pedido direto na ${store.name}!`,
          url: storeUrl
        });
      } catch {
        handleCopyStoreLink();
      }
    } else {
      handleCopyStoreLink();
    }
  };

  // Extract unique categories from products
  const productCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category_name) cats.add(p.category_name);
    });
    return Array.from(cats);
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        !searchFilter.trim() ||
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchFilter.toLowerCase()));
      const matchesCat = selectedCategory === 'all' || p.category_name === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchFilter, selectedCategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-600">Abrindo a loja...</span>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <StoreIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-800">Loja não encontrada</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {error || 'O estabelecimento solicitado não está ativo ou o link expirou.'}
          </p>
          <button
            onClick={() => onNavigate('stores')}
            className="mt-6 w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md cursor-pointer hover:bg-slate-800 transition"
          >
            Ver outras lojas de Canaã dos Carajás
          </button>
        </div>
      </div>
    );
  }

  const primaryColor = store.theme_color_primary || '#fdca04';
  const secondaryColor = store.theme_color_secondary || '#0f172a';
  const isOpen = store.is_open === 1;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* 1. DEDICATED STORE STICKY HEADER (REPLACES GLOBAL MARKETPLACE HEADER) */}
      <header
        style={{ backgroundColor: secondaryColor }}
        className="sticky top-0 z-40 text-white border-b border-white/10 shadow-md transition-colors"
      >
        {/* Top Mini Navigation Bar: Discreet Portal Return + WhatsApp Contact */}
        <div className="bg-black/25 px-4 py-1.5 text-xs border-b border-white/5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <button
              onClick={() => onNavigate('stores')}
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition cursor-pointer text-[11px] font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ver todas as lojas de Canaã</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-slate-300">
                <MapPin className="w-3 h-3 text-amber-400" />
                Bairro {store.neighborhood}, Canaã dos Carajás
              </span>

              {store.whatsapp && (
                <a
                  href={`https://wa.me/55${store.whatsapp.replace(/\D/g, '')}?text=Olá,%20vi%20sua%20loja%20online%20e%20gostaria%20de%20fazer%20um%20pedido.`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>WhatsApp da Loja</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Main Store Navbar */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 sm:gap-6">
          {/* Store Brand Identity: Logo + Name */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={store.logo_url || 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=120&h=120&fit=crop&q=80'}
              alt={store.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover bg-white shadow-md border-2 border-white/20 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-extrabold text-white truncate tracking-tight">
                  {store.name}
                </h1>
                <span
                  className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    isOpen ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {isOpen ? 'Aberto' : 'Fechado'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate font-medium">
                {store.category} • {store.delivery_time_min || '30-50 min'}
              </p>
            </div>
          </div>

          {/* Real-Time Product Search Bar (In-store search only) */}
          <div className="hidden lg:flex flex-1 max-w-md relative">
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder={`Buscar no catálogo da ${store.name}...`}
              className="w-full bg-white/10 hover:bg-white/15 focus:bg-white focus:text-slate-900 text-white placeholder-slate-300 focus:placeholder-slate-400 pl-10 pr-9 py-2 rounded-xl text-xs outline-none border border-white/15 focus:border-white focus:ring-2 focus:ring-amber-400/50 transition shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-300 absolute left-3.5 top-2.5 pointer-events-none" />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-3 top-2.5 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Store Actions: Share/QR & Dedicated Cart */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Share / QR Modal Button */}
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 border border-white/15 transition cursor-pointer shadow-xs"
              title="Compartilhar ou Ver QR Code da Loja"
            >
              <QrCode className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">QR Code / Link</span>
            </button>

            {/* Store Dedicated Cart Button */}
            <button
              type="button"
              onClick={() => onNavigate('cart')}
              style={{
                backgroundColor: primaryColor,
                color: '#0f172a'
              }}
              className="px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Sacola</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-white text-[10px] font-black">
                {totalItemCount}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="lg:hidden px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder={`Buscar itens da ${store.name}...`}
              className="w-full bg-white/10 text-white placeholder-slate-300 pl-9 pr-8 py-2 rounded-xl text-xs outline-none border border-white/15 focus:bg-white focus:text-slate-900 transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-2.5" />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-2.5 text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. CUSTOM ANNOUNCEMENT BAR (Configured in Merchant Dashboard) */}
      {store.custom_announcement && (
        <div
          style={{ backgroundColor: secondaryColor, color: primaryColor }}
          className="py-2.5 px-4 text-center text-xs font-bold border-b border-white/10 shadow-xs flex items-center justify-center gap-2"
        >
          <Megaphone className="w-4 h-4 shrink-0 animate-bounce" />
          <span>{store.custom_announcement}</span>
        </div>
      )}

      {/* 3. HERO BANNER & STORE PROFILE SHOWCASE */}
      <div style={{ backgroundColor: secondaryColor }} className="relative text-white border-b border-white/10 shadow-sm">
        {/* Banner Cover Image */}
        <div className="h-44 sm:h-60 relative overflow-hidden bg-slate-950">
          <img
            src={store.banner_url || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=400&fit=crop&q=80'}
            alt={store.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
        </div>

        {/* Profile Card Overlay */}
        <div className="max-w-7xl mx-auto px-4 -mt-16 sm:-mt-20 relative z-10 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-start gap-4">
              <img
                src={store.logo_url || 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=200&h=200&fit=crop&q=80'}
                alt={store.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-slate-900 shadow-2xl bg-white shrink-0"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    style={{ backgroundColor: `${primaryColor}30`, color: primaryColor, borderColor: `${primaryColor}50` }}
                    className="px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider"
                  >
                    {store.category}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Oficial Canaã
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    {isOpen ? 'Aberto Hoje' : 'Fechado no momento'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {store.name}
                </h1>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300 pt-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {store.street ? `${store.street}, ${store.number || 'S/N'} - ` : ''}Bairro {store.neighborhood}, Canaã dos Carajás - PA
                    </span>
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
              {store.whatsapp && (
                <a
                  href={`https://wa.me/55${store.whatsapp.replace(/\D/g, '')}?text=Olá,%20vi%20o%20catálogo%20da%20${encodeURIComponent(store.name)}%20e%20gostaria%20de%20atendimento.`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chamar no WhatsApp</span>
                </a>
              )}

              {store.instagram && (
                <a
                  href={`https://instagram.com/${store.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleNativeShare}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-xs text-xs font-bold text-white border border-white/20 cursor-pointer transition shadow-xs flex items-center gap-1.5"
                title="Compartilhar link desta loja"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-amber-300" />
                    <span>Compartilhar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Delivery & Operation highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Taxa de Entrega</span>
              <span style={{ color: primaryColor }} className="font-black text-sm">
                {store.delivery_fee_base > 0 ? formatBRL(store.delivery_fee_base) : 'Entrega Grátis'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Tempo Médio</span>
              <span className="font-bold text-white text-sm">{store.delivery_time_min || '30-50 min'}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Frete Grátis a partir de</span>
              <span className="font-bold text-white text-sm">
                {store.free_delivery_minimum ? formatBRL(store.free_delivery_minimum) : 'Consulte'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Atendimento</span>
              <span className="font-bold text-emerald-400 text-sm">Entrega & Retirada</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PRODUCT CATALOG & FILTERS */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Category Tabs & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Catálogo de Produtos & Cardápio
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {filteredProducts.length} itens disponíveis para pronta entrega ou encomenda em Canaã
            </p>
          </div>

          {/* Category Filter Pills (if store has categories) */}
          {productCategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                style={{
                  backgroundColor: selectedCategory === 'all' ? secondaryColor : undefined,
                  color: selectedCategory === 'all' ? '#ffffff' : undefined
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedCategory === 'all' ? 'shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Todos
              </button>
              {productCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    backgroundColor: selectedCategory === cat ? secondaryColor : undefined,
                    color: selectedCategory === cat ? '#ffffff' : undefined
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat ? 'shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-white border border-slate-200/80 p-8 shadow-xs">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              {searchFilter ? 'Nenhum produto encontrado com essa busca' : 'Nenhum produto cadastrado no momento'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchFilter
                ? 'Tente buscar por outro termo ou limpe o filtro.'
                : 'Este lojista está atualizando o catálogo da loja. Volte em breve!'}
            </p>
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Limpar Busca
              </button>
            )}
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map(prod => {
              const hasPromo = prod.promotional_price && prod.promotional_price > 0 && prod.promotional_price < prod.price;
              const isOutOfStock = prod.stock_quantity <= 0;

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="relative aspect-square bg-slate-100 overflow-hidden">
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    {hasPromo && (
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                        Oferta
                      </span>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center text-white text-xs font-black uppercase tracking-wider">
                        Esgotado
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {prod.category_name && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          {prod.category_name}
                        </span>
                      )}
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-amber-600 transition">
                        {prod.name}
                      </h3>
                      {prod.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {prod.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 pt-2">
                      <div>
                        {hasPromo ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base sm:text-lg font-black text-rose-600">
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
                        onClick={() =>
                          addItem(
                            {
                              ...prod,
                              store_name: store.name,
                              delivery_fee_base: store.delivery_fee_base,
                              free_delivery_minimum: store.free_delivery_minimum
                            },
                            1
                          )
                        }
                        disabled={isOutOfStock}
                        style={{
                          backgroundColor: primaryColor,
                          color: '#0f172a'
                        }}
                        className="w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. STORE REVIEWS */}
        {reviews.length > 0 && (
          <div className="pt-10 border-t border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Avaliações de Clientes Verificados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map(rev => (
                <div key={rev.id} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
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
      </main>

      {/* 6. FLOATING BOTTOM BAR FOR MOBILE CHECKOUT */}
      {totalItemCount > 0 && (
        <div className="sticky bottom-3 inset-x-0 px-4 z-40 max-w-lg mx-auto sm:hidden">
          <button
            type="button"
            onClick={() => onNavigate('cart')}
            style={{ backgroundColor: secondaryColor }}
            className="w-full py-3.5 px-5 rounded-2xl text-white shadow-2xl flex items-center justify-between border border-white/15 active:scale-98 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div
                style={{ backgroundColor: primaryColor }}
                className="w-7 h-7 rounded-xl text-slate-950 flex items-center justify-center font-black text-xs"
              >
                {totalItemCount}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold block">Ver Sacola</span>
                <span className="text-[11px] text-slate-300">Total: {formatBRL(grandTotal)}</span>
              </div>
            </div>
            <span
              style={{ backgroundColor: primaryColor, color: '#0f172a' }}
              className="px-3.5 py-1.5 rounded-xl font-black text-xs"
            >
              Finalizar Pedido →
            </span>
          </button>
        </div>
      )}

      {/* 7. DEDICATED STORE FOOTER (STORE-BRANDED INSTEAD OF GLOBAL MARKETPLACE FOOTER) */}
      <footer
        style={{ backgroundColor: secondaryColor }}
        className="mt-16 text-slate-300 border-t border-white/10 text-xs py-10 transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10 text-center md:text-left">
            <div className="flex items-center gap-3">
              <img
                src={store.logo_url || 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=120&h=120&fit=crop&q=80'}
                alt={store.name}
                className="w-12 h-12 rounded-xl object-cover bg-white shadow-md border-2 border-white/20"
              />
              <div>
                <h3 className="font-extrabold text-white text-base">{store.name}</h3>
                <p className="text-[11px] text-slate-400">
                  {store.street ? `${store.street}, ${store.number || 'S/N'} - ` : ''}Bairro {store.neighborhood}, Canaã dos Carajás - PA
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              {store.phone && (
                <span className="inline-flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  {store.phone}
                </span>
              )}
              {store.whatsapp && (
                <a
                  href={`https://wa.me/55${store.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-400 font-bold hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Atendimento WhatsApp
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px] text-center sm:text-left">
            <p>
              © {new Date().getFullYear()} {store.name}. Todos os direitos reservados. Entregas em Canaã dos Carajás.
            </p>
            <div className="flex items-center gap-2">
              <span>Tecnologia por</span>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Shop da Cidade
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onNavigate('partner-register')}
                className="text-slate-300 hover:text-white underline cursor-pointer"
              >
                Crie sua loja grátis
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 8. QR CODE MODAL FOR IN-PERSON / FLYER SHARING */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 relative space-y-4">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span
                style={{ backgroundColor: `${primaryColor}30`, color: secondaryColor }}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block"
              >
                QR Code Oficial
              </span>
              <h3 className="text-lg font-black text-slate-900">{store.name}</h3>
              <p className="text-xs text-slate-500">
                Aponte a câmera do celular para abrir o catálogo digital desta loja
              </p>
            </div>

            {qrCodeDataUrl ? (
              <div className="p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-inner inline-block">
                <img src={qrCodeDataUrl} alt={`QR Code de ${store.name}`} className="w-56 h-56 mx-auto" />
              </div>
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-2xl mx-auto">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCopyStoreLink}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800 transition cursor-pointer shadow-xs"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Link Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-300" />
                    <span>Copiar Link da Loja</span>
                  </>
                )}
              </button>

              {qrCodeDataUrl && (
                <a
                  href={qrCodeDataUrl}
                  download={`qrcode-${store.slug}.png`}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Imagem do QR Code</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
