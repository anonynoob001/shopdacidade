// Shop Carajás - Home Page Component
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Hammer,
  HeartPulse,
  Home as HomeIcon,
  MapPin,
  MessageSquare,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Store as StoreIcon,
  Truck,
  Wind,
  Wrench,
  Zap,
  X
} from 'lucide-react';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { CategoryBubbleItem, CategoryBubbles } from '../components/CategoryBubbles';
import { apiRequest, formatBRL, STORE_CATEGORIES } from '../services/api';
import { Product, PromotionalBanner, ServiceCategory, ServiceProvider, Store } from '../worker/types';

interface HomePageProps {
  onNavigate: (view: string, param?: string) => void;
  selectedNeighborhood: string;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, selectedNeighborhood }) => {
  const [data, setData] = useState<{
    banners: PromotionalBanner[];
    productCategories: any[];
    serviceCategories: ServiceCategory[];
    featuredStores: Store[];
    featuredProducts: Product[];
    featuredProviders: ServiceProvider[];
    localAds: any[];
    settings: Record<string, string>;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const storesSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadInitial() {
      try {
        const res = await apiRequest('/api/public/initial-data');
        setData(res);
      } catch (e) {
        console.error('Failed to load initial data:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitial();
  }, []);

  // Banner rotation timer
  useEffect(() => {
    if (!data?.banners || data.banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIndex(prev => (prev + 1) % data.banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [data?.banners]);

  // Safe stores list
  const allStores = data?.featuredStores || [];

  // Combine categories from backend and standard store categories so any chosen category appears immediately
  const categoryBubbles: CategoryBubbleItem[] = useMemo(() => {
    if (!data) return [];
    const list: CategoryBubbleItem[] = [];
    const seenNames = new Set<string>();

    // 1. Add categories from database
    (data.productCategories || []).forEach((cat: any) => {
      const lower = cat.name.toLowerCase();
      if (!seenNames.has(lower)) {
        seenNames.add(lower);
        const count = allStores.filter(s =>
          s.category?.toLowerCase() === lower || s.category?.toLowerCase() === cat.slug?.toLowerCase()
        ).length;
        list.push({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          storeCount: count
        });
      }
    });

    // 2. Add standard commerce categories if not yet in list
    STORE_CATEGORIES.forEach(catName => {
      const lower = catName.toLowerCase();
      if (!seenNames.has(lower)) {
        seenNames.add(lower);
        const count = allStores.filter(s => s.category?.toLowerCase() === lower).length;
        list.push({
          id: `cat_${catName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
          name: catName,
          slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          storeCount: count
        });
      }
    });

    // 3. Add any custom store category if not already in list
    allStores.forEach(s => {
      if (s.category && !seenNames.has(s.category.toLowerCase())) {
        seenNames.add(s.category.toLowerCase());
        const count = allStores.filter(st => st.category?.toLowerCase() === s.category.toLowerCase()).length;
        list.push({
          id: `cat_${s.category.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
          name: s.category,
          slug: s.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          storeCount: count
        });
      }
    });

    return list;
  }, [data?.productCategories, allStores]);

  // Filter stores according to selected category bubble & selected neighborhood
  const displayedStores = useMemo(() => {
    if (!data) return [];
    return allStores.filter(store => {
      // Neighborhood filter
      if (selectedNeighborhood && store.neighborhood?.toLowerCase() !== selectedNeighborhood.toLowerCase()) {
        return false;
      }
      // Category bubble filter
      if (selectedCategory) {
        const matchCat = categoryBubbles.find(
          c => c.name.toLowerCase() === selectedCategory.toLowerCase() || c.slug.toLowerCase() === selectedCategory.toLowerCase()
        );
        const isDirectMatch = store.category?.toLowerCase() === selectedCategory.toLowerCase();
        const isSlugMatch = matchCat && store.category?.toLowerCase() === matchCat.name.toLowerCase();
        return isDirectMatch || isSlugMatch;
      }
      return true;
    });
  }, [allStores, selectedNeighborhood, selectedCategory, categoryBubbles, data]);

  const handleSelectCategoryBubble = (cat: CategoryBubbleItem | null) => {
    const newCategory = cat ? cat.name : '';
    setSelectedCategory(newCategory);
    // Smooth scroll to stores section so customer immediately sees the active stores
    if (storesSectionRef.current) {
      storesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-slate-500">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Carregando o melhor de Canaã dos Carajás...</p>
      </div>
    );
  }

  const currentBanner = data.banners[activeBannerIndex] || data.banners[0];

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero Banner Carousel / Promo */}
      {currentBanner && (
        <section className="relative overflow-hidden bg-gradient-to-br from-[#071536] via-[#091f5a] to-[#0047F7] border-b border-blue-900/40 text-white">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-5 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FA4802]/20 border border-[#FA4802]/40 text-[#FA4802] text-xs font-black tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Marketplace Regional • Canaã dos Carajás, PA</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {currentBanner.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-xl font-normal">
                {currentBanner.subtitle || 'Tudo o que você precisa no comércio de Canaã dos Carajás: materiais, alimentos, peças e profissionais de confiança com agendamento online.'}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('stores')}
                  className="px-6 py-3.5 rounded-xl bg-[#FA4802] hover:bg-[#e03f00] text-white font-black text-sm shadow-xl shadow-orange-950/40 flex items-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <StoreIcon className="w-4 h-4" />
                  Ver Lojas em Canaã
                </button>
                <button
                  onClick={() => onNavigate('services')}
                  className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm flex items-center gap-2 transition cursor-pointer"
                >
                  <Wrench className="w-4 h-4 text-[#FA4802]" />
                  Contratar Serviços
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden aspect-16/10 shadow-2xl border border-white/15">
                <img
                  src={currentBanner.image_url}
                  alt={currentBanner.title}
                  className="w-full h-full object-cover transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071536]/90 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white text-xs">
                    <span className="font-extrabold text-[#FA4802] block text-sm">Entrega rápida em Canaã dos Carajás</span>
                    <p className="text-slate-200">Receba no Centro, Novo Horizonte, Alto Bonito e demais bairros.</p>
                  </div>
                </div>
              </div>

              {/* Carousel Indicators */}
              {data.banners.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {data.banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveBannerIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === activeBannerIndex ? 'w-7 bg-[#FA4802]' : 'w-2 bg-white/30 hover:bg-white/50'
                      }`}
                      aria-label={`Banner ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Neighborhood notice if selected */}
      {selectedNeighborhood && (
        <div className="max-w-7xl mx-auto px-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Você está navegando com foco nas lojas e prestadores que atendem o bairro <strong>{selectedNeighborhood}</strong> em Canaã dos Carajás.</span>
            </div>
            <button onClick={() => onNavigate('stores')} className="font-bold underline hover:text-emerald-200">
              Ver todos os bairros
            </button>
          </div>
        </div>
      )}

      {/* 2. Categorias do Shop da Cidade */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0047F7] animate-pulse" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Categorias
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0047F7] text-[10px] font-black uppercase tracking-wide border border-blue-100">
                  Segmentos
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Explore os estabelecimentos e produtos de Canaã dos Carajás por segmento:
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedCategory && (
                <button
                  onClick={() => handleSelectCategoryBubble(null)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 cursor-pointer transition"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpar ({selectedCategory})
                </button>
              )}
              <button
                onClick={() => onNavigate('stores', selectedCategory || undefined)}
                className="text-xs sm:text-sm font-bold text-[#0047F7] hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                Ver diretório de lojas <ArrowRight className="w-4 h-4 text-[#FA4802]" />
              </button>
            </div>
          </div>

          <CategoryBubbles
            categories={categoryBubbles}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategoryBubble}
            showAllOption={true}
          />
        </div>
      </section>

      {/* 3. Lojas Ativas sobre a Categoria Selecionada */}
      <section ref={storesSectionRef} className="max-w-7xl mx-auto px-4 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {selectedCategory ? `Lojas Ativas em ${selectedCategory}` : 'Lojas Parceiras em Canaã'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#0047F7] text-xs font-black flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0047F7] animate-ping" />
                {displayedStores.length} {displayedStores.length === 1 ? 'loja ativa' : 'lojas ativas'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {selectedCategory
                ? `Exibindo os comércios locais ativos e prontos para atender pedidos em Canaã dos Carajás na categoria "${selectedCategory}".`
                : 'Compre direto de estabelecimentos comerciais locais com entrega ou retirada no balcão.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedCategory && (
              <button
                onClick={() => handleSelectCategoryBubble(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Mostrar todas as lojas
              </button>
            )}
            <button
              onClick={() => onNavigate('stores', selectedCategory || undefined)}
              className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              Ver todas <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {displayedStores.length === 0 ? (
          <div className="py-14 text-center rounded-3xl bg-white border border-slate-200 p-8 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <StoreIcon className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Nenhuma loja ativa encontrada {selectedCategory ? `em "${selectedCategory}"` : ''}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
              {selectedNeighborhood
                ? `Não encontramos lojas ativas atendendo o bairro "${selectedNeighborhood}" nesta categoria no momento.`
                : 'Estamos cadastrando novos parceiros comerciais locais nesta categoria em Canaã dos Carajás.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setSelectedCategory('')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition"
              >
                Ver todas as lojas
              </button>
              <button
                onClick={() => onNavigate('partner-register')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition"
              >
                Cadastrar minha loja
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedStores.map(store => (
              <div
                key={store.id}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-lg transition duration-200 flex flex-col justify-between group"
              >
                <div className="relative h-38 bg-slate-100 overflow-hidden">
                  <img
                    src={store.banner_url || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=300&fit=crop&q=80'}
                    alt={store.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>Loja Ativa</span>
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    <span>{store.delivery_time_min || '30-50 min'}</span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start gap-3">
                      <img
                        src={store.logo_url || 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=100&h=100&fit=crop&q=80'}
                        alt={store.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow -mt-8 shrink-0 bg-white"
                      />
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-[#0047F7] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                          {store.category}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 group-hover:text-[#0047F7] transition leading-snug mt-1">
                          {store.name}
                        </h3>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {store.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Bairro {store.neighborhood}</span>
                    </div>
                    <div className="font-semibold text-slate-700">
                      Taxa: {store.delivery_fee_base > 0 ? formatBRL(store.delivery_fee_base) : 'Grátis'}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('store-detail', store.slug)}
                    className="w-full py-2.5 rounded-xl bg-[#0047F7] hover:bg-[#0038c7] text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 active:scale-98"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver Loja e Produtos
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Serviços Profissionais de Canaã dos Carajás */}
      <section className="bg-[#071536] py-12 text-white border-y border-[#0047F7]/20">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FA4802]/20 text-[#FA4802] text-xs font-bold mb-2">
                <Wrench className="w-3.5 h-3.5" />
                <span>Mão de Obra & Assistência Técnica</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Prestadores de Serviços em Canaã
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Ar-condicionado, eletricistas, encanadores, diaristas e reformas. Peça orçamento formal sem intermediários caros.
              </p>
            </div>
            <button
              onClick={() => onNavigate('services')}
              className="px-4 py-2 rounded-xl bg-[#0047F7] hover:bg-[#0038c7] text-white text-xs font-bold flex items-center gap-1.5 transition self-start md:self-auto cursor-pointer shadow-md shadow-blue-500/20"
            >
              Ver todos os prestadores <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.featuredProviders.map(prov => (
              <div
                key={prov.id}
                className="bg-[#0b1c44] rounded-2xl border border-slate-700/80 p-5 flex flex-col justify-between hover:border-[#0047F7] transition space-y-4"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <img
                      src={prov.photo_url || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=120&h=120&fit=crop&q=80'}
                      alt={prov.business_name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-[#0047F7]/40 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400 font-bold text-xs flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {prov.rating_average.toFixed(1)}
                        </span>
                        <span className="text-[11px] text-slate-400">({prov.total_reviews} avaliações)</span>
                      </div>
                      <h3 className="font-bold text-base text-white mt-0.5 leading-snug">
                        {prov.business_name}
                      </h3>
                      <p className="text-xs text-[#FA4802] font-semibold">{prov.category_name}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {prov.specialty}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-700/70 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Serviços a partir de</span>
                    <span className="text-sm font-bold text-white">
                      {prov.starting_price > 0 ? formatBRL(prov.starting_price) : 'Sob Consulta'}
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigate('provider-detail', prov.slug)}
                    className="px-3 py-2 rounded-xl bg-[#FA4802] hover:bg-[#e03f00] text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-orange-950/30"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Pedir Orçamento
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Empresas Patrocinadoras & Apoio Local */}
      {data.localAds && data.localAds.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#071536] to-[#0a1b42] text-white border border-[#0047F7]/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold text-[#FA4802] uppercase tracking-widest">Apoio ao Comércio Regional</span>
                <h3 className="text-base font-bold text-white">Empresas Patrocinadoras de Canaã dos Carajás</h3>
              </div>
              <span className="text-[10px] text-slate-400">Espaço Publicitário Local</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.localAds.map(ad => (
                <div key={ad.id} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-4">
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-white">{ad.advertiser_name}</h4>
                    <p className="text-xs text-slate-300 mt-0.5">{ad.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. Call To Action para Parceiros Locais */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-50/90 via-white to-blue-50/40 border border-blue-200/80 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0047F7] text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <StoreIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Você tem um comércio em Canaã dos Carajás?</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Cadastre sua loja no Shop da Cidade. Tenha catálogo online, receba pedidos com entrega própria ou por entregadores parceiros, e aumente seu faturamento.
              </p>
            </div>
            <button
              onClick={() => onNavigate('partner-register')}
              className="py-3 px-5 rounded-xl bg-[#0047F7] hover:bg-[#0038c7] text-white font-black text-xs sm:text-sm self-start transition cursor-pointer shadow-md shadow-blue-500/20"
            >
              Cadastrar Minha Loja Gratuitamente
            </button>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-br from-orange-50/90 via-white to-orange-50/40 border border-orange-200/80 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FA4802] text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Oferece serviços profissionais?</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Eletricistas, pedreiros, mecânicos, diaristas e técnicos. Crie seu perfil verificado e receba solicitações de orçamento de moradores de toda a cidade.
              </p>
            </div>
            <button
              onClick={() => onNavigate('partner-register')}
              className="py-3 px-5 rounded-xl bg-[#FA4802] hover:bg-[#e03f00] text-white font-black text-xs sm:text-sm self-start transition cursor-pointer shadow-md shadow-orange-500/20"
            >
              Anunciar Meus Serviços
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
