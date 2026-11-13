import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  CheckCircle,
  Clock,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Share2,
  ShoppingBag,
  Star,
  Store as StoreIcon,
  Tag,
  Truck,
  X
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { apiRequest, formatBRL, formatDateBR } from '../services/api';
import { getStoreStatus } from '../utils/storeSchedule';
import { Product, Review, Store } from '../worker/types';

interface StoreDetailPageProps {
  storeSlug: string;
  onNavigate: (view: string, param?: string) => void;
}

type StoreTab = 'shop' | 'products' | 'categories';
type SortMode = 'popular' | 'recent' | 'promo' | 'price_asc' | 'price_desc';

export const StoreDetailPage: React.FC<StoreDetailPageProps> = ({ storeSlug, onNavigate }) => {
  const { addItem, totalItemCount, grandTotal } = useCart();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Shopee-inspired navigation, search, category & sort state
  const [activeTab, setActiveTab] = useState<StoreTab>('products');
  const [sortMode, setSortMode] = useState<SortMode>('popular');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Share feedback
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

  // Unique product categories with counts
  const categorySummaries = useMemo(() => {
    const counts = new Map<string, { name: string; count: number; coverImage: string }>();
    products.forEach(p => {
      const catName = p.category_name || 'Outros';
      const existing = counts.get(catName);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(catName, { name: catName, count: 1, coverImage: p.image_url });
      }
    });
    return Array.from(counts.values());
  }, [products]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return '5.0';
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  // Filtered and sorted products
  const displayedProducts = useMemo(() => {
    const base = products.filter(p => {
      const matchesSearch =
        !searchFilter.trim() ||
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchFilter.toLowerCase()));
      const matchesCat = selectedCategory === 'all' || (p.category_name || 'Outros') === selectedCategory;
      const matchesTab =
        activeTab === 'shop'
          ? Boolean(p.is_featured) || Boolean(p.promotional_price && p.promotional_price < p.price)
          : true;
      return matchesSearch && matchesCat && matchesTab;
    });

    const list = activeTab === 'shop' && base.length === 0 ? products : base;

    return [...list].sort((a, b) => {
      const priceA = a.promotional_price && a.promotional_price > 0 ? a.promotional_price : a.price;
      const priceB = b.promotional_price && b.promotional_price > 0 ? b.promotional_price : b.price;

      if (sortMode === 'price_asc') return priceA - priceB;
      if (sortMode === 'price_desc') return priceB - priceA;
      if (sortMode === 'recent') return (b.created_at || '').localeCompare(a.created_at || '');
      if (sortMode === 'promo') {
        const discA = a.promotional_price && a.promotional_price < a.price ? (a.price - a.promotional_price) / a.price : 0;
        const discB = b.promotional_price && b.promotional_price < b.price ? (b.price - b.promotional_price) / b.price : 0;
        return discB - discA;
      }
      return (b.is_featured || 0) - (a.is_featured || 0);
    });
  }, [products, searchFilter, selectedCategory, activeTab, sortMode]);

  const handlePriceSortToggle = () => {
    setSortMode(prev => (prev === 'price_asc' ? 'price_desc' : 'price_asc'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-[#0047F7] border-t-transparent rounded-full animate-spin" />
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
            className="mt-6 w-full py-3 rounded-xl bg-[#071536] text-white text-xs font-bold shadow-md cursor-pointer hover:bg-[#0c2154] transition"
          >
            Ver outras lojas de Canaã dos Carajás
          </button>
        </div>
      </div>
    );
  }

  const storeStatus = getStoreStatus(store);
  const isOpen = storeStatus.isOpen;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans selection:bg-[#0047F7] selection:text-white">
      {/* 1. COMPACT INTEGRATED COVER HERO (SHOPEE-INSPIRED + LOCAL DELIVERY DETAILS) */}
      <section className="relative bg-[#071536] text-white overflow-hidden">
        {/* Background Cover Image with Dark Readability Scrim */}
        <img
          src={store.banner_url || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=450&fit=crop&q=80'}
          alt={`Capa ${store.name}`}
          className="absolute inset-0 w-full h-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#071536]/80 via-[#071536]/55 to-[#071536]/95" />

        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-4 space-y-4">
          {/* Top Integrated Search & Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onNavigate('stores')}
              className="p-2 rounded-full bg-black/35 hover:bg-black/55 text-white backdrop-blur-xs transition cursor-pointer shrink-0"
              title="Voltar para todas as lojas"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-white/80 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => {
                  setSearchFilter(e.target.value);
                  if (activeTab === 'categories') setActiveTab('products');
                }}
                placeholder={`Buscar na ${store.name}...`}
                className="w-full bg-black/35 hover:bg-black/45 focus:bg-white focus:text-slate-900 text-white placeholder-white/75 focus:placeholder-slate-400 pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm outline-none border border-white/15 focus:border-white backdrop-blur-xs transition"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleNativeShare}
              className="p-2 rounded-full bg-black/35 hover:bg-black/55 text-white backdrop-blur-xs transition cursor-pointer shrink-0"
              title="Compartilhar loja"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('cart')}
              className="relative px-3 py-2 rounded-xl bg-[#FA4802] hover:bg-[#e04000] text-white font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Sacola</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#071536] text-white text-[10px] font-black leading-none">
                {totalItemCount}
              </span>
            </button>
          </div>

          {/* Store Identity Row (Logo + Official Badge + Name/Rating/Delivery + Actions) */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {/* Circular Avatar with Official Pill Anchored Below */}
              <div className="relative shrink-0 pb-2">
                <img
                  src={store.logo_url || 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=200&h=200&fit=crop&q=80'}
                  alt={store.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white shadow-xl bg-white"
                />
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-[#FA4802] text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                  Loja Oficial
                </span>
              </div>

              <div className="min-w-0 space-y-1">
                <h1 className="text-base sm:text-2xl font-black text-white truncate tracking-tight">
                  {store.name}
                </h1>

                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs text-slate-200">
                  <span className="inline-flex items-center gap-1 font-bold text-amber-300">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {averageRating}
                  </span>
                  <span className="text-white/30">|</span>
                  <span
                    className={`inline-flex items-center gap-1 font-bold ${
                      isOpen ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    {storeStatus.statusText}
                  </span>
                  <span className="text-white/30">|</span>
                  <span className="inline-flex items-center gap-1 text-slate-200">
                    <Clock className="w-3 h-3 text-blue-300" />
                    {store.delivery_time_min || '30-50 min'}
                  </span>
                  <span className="hidden md:inline text-white/30">|</span>
                  <span className="hidden md:inline-flex items-center gap-1 text-slate-200">
                    <MapPin className="w-3 h-3 text-[#FA4802]" />
                    Bairro {store.neighborhood}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Compact Stacked Action Buttons */}
            <div className="flex flex-col gap-1.5 shrink-0">
              {store.whatsapp && (
                <a
                  href={`https://wa.me/55${store.whatsapp.replace(/\D/g, '')}?text=Olá,%20vi%20sua%20loja%20no%20Shop%20da%20Cidade%20e%20gostaria%20de%20atendimento.`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#FA4802] hover:bg-[#e04000] text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleCopyStoreLink}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/35 font-semibold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 backdrop-blur-xs transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiado!' : 'Compartilhar'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Optional Announcement Strip */}
      {store.custom_announcement && (
        <div className="bg-[#0047F7] text-white py-2 px-4 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-xs">
          <Megaphone className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{store.custom_announcement}</span>
        </div>
      )}

      {/* Compact Local Delivery & Free Shipping Strip */}
      <div className="bg-[#071536]/95 border-t border-white/10 text-slate-200 px-3 sm:px-6 py-2 text-[11px] sm:text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Truck className="w-3.5 h-3.5 text-[#FA4802]" />
              Entrega:{' '}
              <strong className="text-white">
                {store.delivery_fee_base > 0 ? formatBRL(store.delivery_fee_base) : 'Grátis'}
              </strong>
            </span>
            {store.free_delivery_minimum && store.free_delivery_minimum > 0 && (
              <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                • Frete grátis acima de {formatBRL(store.free_delivery_minimum)}
              </span>
            )}
          </div>
          <span className="text-slate-400 hidden sm:inline">
            {store.accepts_pickup ? 'Entrega local & Retirada na loja' : 'Entrega local em Canaã dos Carajás'}
          </span>
        </div>
      </div>

      {/* 2. SHOPEE-STYLE CLEAN WHITE NAVIGATION TABS */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 text-center text-xs sm:text-sm font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('shop');
                setSelectedCategory('all');
              }}
              className={`py-3 border-b-2 transition cursor-pointer ${
                activeTab === 'shop'
                  ? 'border-[#FA4802] text-[#FA4802]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Destaques
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`py-3 border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'products'
                  ? 'border-[#FA4802] text-[#FA4802]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Produtos</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                {products.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`py-3 border-b-2 transition cursor-pointer ${
                activeTab === 'categories'
                  ? 'border-[#FA4802] text-[#FA4802]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Categorias
            </button>
          </div>

          {/* Sub-bar: Sort Strip (Visible on Produtos & Destaques) */}
          {activeTab !== 'categories' && (
            <div className="border-t border-slate-100 px-3 sm:px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none bg-white">
              <div className="flex items-center divide-x divide-slate-200 text-xs whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setSortMode('popular')}
                  className={`pr-3 font-semibold cursor-pointer transition ${
                    sortMode === 'popular' ? 'text-[#FA4802] font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Popular
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode('recent')}
                  className={`px-3 font-semibold cursor-pointer transition ${
                    sortMode === 'recent' ? 'text-[#FA4802] font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mais Recente
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode('promo')}
                  className={`px-3 font-semibold cursor-pointer transition ${
                    sortMode === 'promo' ? 'text-[#FA4802] font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ofertas
                </button>
                <button
                  type="button"
                  onClick={handlePriceSortToggle}
                  className={`pl-3 font-semibold cursor-pointer inline-flex items-center gap-1 transition ${
                    sortMode === 'price_asc' || sortMode === 'price_desc'
                      ? 'text-[#FA4802] font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>
                    Preço {sortMode === 'price_asc' ? '↑' : sortMode === 'price_desc' ? '↓' : ''}
                  </span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </div>

              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-[#0047F7] border border-blue-200 text-[11px] font-bold shrink-0 cursor-pointer"
                >
                  <span>{selectedCategory}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Category Chips on Desktop/Products Tab */}
        {activeTab === 'products' && categorySummaries.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-[#0047F7] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Todos os itens
            </button>
            {categorySummaries.map(cat => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.name
                    ? 'bg-[#0047F7] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        )}

        {/* CATEGORIES TAB VIEW */}
        {activeTab === 'categories' ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setActiveTab('products');
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#0047F7]/10 text-[#0047F7] flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">Todos os Produtos da Loja</span>
                    <span className="text-xs text-slate-500">{products.length} itens disponíveis</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0047F7]">Ver tudo →</span>
              </button>

              {categorySummaries.map(cat => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setActiveTab('products');
                  }}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={cat.coverImage}
                      alt={cat.name}
                      className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">{cat.name}</span>
                      <span className="text-xs text-slate-500">
                        {cat.count} {cat.count === 1 ? 'produto' : 'produtos'}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#FA4802]">Abrir →</span>
                </button>
              ))}
            </div>

            {/* Store About Summary inside Categories/Info */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-2 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Sobre a {store.name}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">{store.description}</p>
              <div className="pt-2 text-xs text-slate-500 flex flex-wrap gap-4">
                <span>
                  <strong className="text-slate-800">Endereço:</strong>{' '}
                  {store.street ? `${store.street}, ${store.number || 'S/N'} - ` : ''}Bairro {store.neighborhood}, Canaã dos Carajás
                </span>
                {store.phone && (
                  <span>
                    <strong className="text-slate-800">Telefone:</strong> {store.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-white border border-slate-200/80 p-8 shadow-xs">
            <ShoppingBag className="w-11 h-11 text-slate-300 mx-auto mb-3" />
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
                className="mt-4 px-4 py-2 rounded-xl bg-[#0047F7] text-white text-xs font-bold hover:bg-[#0038c7] transition cursor-pointer"
              >
                Limpar Busca
              </button>
            )}
          </div>
        ) : (
          /* 4. COMPACT HIGH-CONVERSION 2-COLUMN MOBILE / 4-COLUMN DESKTOP PRODUCT GRID */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {displayedProducts.map(prod => {
              const hasPromo = Boolean(prod.promotional_price && prod.promotional_price > 0 && prod.promotional_price < prod.price);
              const activePrice = hasPromo && prod.promotional_price ? prod.promotional_price : prod.price;
              const discountPct = hasPromo && prod.promotional_price
                ? Math.round(((prod.price - prod.promotional_price) / prod.price) * 100)
                : 0;
              const isOutOfStock = prod.stock_quantity <= 0;

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                >
                  {/* Square Product Image */}
                  <div className="relative aspect-square bg-slate-50 overflow-hidden">
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    {hasPromo && discountPct > 0 && (
                      <span className="absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg bg-[#FA4802] text-white text-[10px] font-black shadow-xs">
                        -{discountPct}%
                      </span>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-[#071536]/75 backdrop-blur-xs flex items-center justify-center text-white text-xs font-black uppercase tracking-wider">
                        Esgotado
                      </div>
                    )}
                  </div>

                  {/* Card Details (Clean Shopee-style Density) */}
                  <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-medium text-slate-800 line-clamp-2 leading-snug">
                      <span className="inline-block align-middle mr-1.5 px-1 py-0.5 rounded bg-[#FA4802] text-white text-[9px] font-black uppercase tracking-tight leading-none">
                        Oficial
                      </span>
                      <span className="align-middle group-hover:text-[#0047F7] transition">{prod.name}</span>
                    </h3>

                    <div className="space-y-2 pt-1">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <span className="text-sm sm:text-base font-black text-[#FA4802]">
                          {formatBRL(activePrice)}
                        </span>
                        {hasPromo && (
                          <span className="text-[10px] sm:text-xs text-slate-400 line-through">
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
                        className="w-full py-2 rounded-lg sm:rounded-xl bg-[#0047F7] hover:bg-[#0038c7] text-white font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Adicionar</span>
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
          <div className="pt-6 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Avaliações dos Clientes ({reviews.length})</h3>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {averageRating} de 5.0
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reviews.map(rev => (
                <div key={rev.id} className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{rev.user_name || 'Cliente de Canaã'}</span>
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
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
        <div className="sticky bottom-3 inset-x-0 px-3 z-40 max-w-lg mx-auto sm:hidden">
          <button
            type="button"
            onClick={() => onNavigate('cart')}
            className="w-full py-3 px-4 rounded-2xl bg-[#071536] text-white shadow-2xl flex items-center justify-between border border-white/15 active:scale-98 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#0047F7] text-white flex items-center justify-center font-black text-xs">
                {totalItemCount}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold block">Ver Sacola</span>
                <span className="text-[11px] text-slate-300">Total: {formatBRL(grandTotal)}</span>
              </div>
            </div>
            <span className="px-3.5 py-1.5 rounded-xl bg-[#FA4802] text-white font-black text-xs">
              Finalizar Pedido →
            </span>
          </button>
        </div>
      )}

      {/* 7. DEDICATED STORE FOOTER */}
      <footer className="mt-12 bg-[#071536] text-slate-300 border-t border-white/10 text-xs py-8">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-5 border-b border-white/10 text-center md:text-left">
            <div className="flex items-center gap-3">
              <img
                src={store.logo_url || 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=120&h=120&fit=crop&q=80'}
                alt={store.name}
                className="w-11 h-11 rounded-full object-cover bg-white shadow-md border-2 border-white/30"
              />
              <div>
                <h3 className="font-extrabold text-white text-sm sm:text-base">{store.name}</h3>
                <p className="text-[11px] text-slate-400">
                  {store.street ? `${store.street}, ${store.number || 'S/N'} - ` : ''}Bairro {store.neighborhood}, Canaã dos Carajás - PA
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              {store.phone && (
                <span className="inline-flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-[#FA4802]" />
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

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px] text-center sm:text-left">
            <p>© {new Date().getFullYear()} {store.name}. Entregas em Canaã dos Carajás.</p>
            <div className="flex items-center gap-2">
              <span>Tecnologia por</span>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="text-blue-400 font-bold hover:underline cursor-pointer"
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
    </div>
  );
};
