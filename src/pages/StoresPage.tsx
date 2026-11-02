import { ArrowLeft, CheckCircle2, Clock, Filter, MapPin, Search, Store as StoreIcon, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { CategoryBubbleItem, CategoryBubbles } from '../components/CategoryBubbles';
import { apiRequest, CANAA_NEIGHBORHOODS, formatBRL, STORE_CATEGORIES } from '../services/api';
import { Store } from '../worker/types';

interface StoresPageProps {
  onNavigate: (view: string, param?: string) => void;
  selectedNeighborhood: string;
  initialCategory?: string;
}

export const StoresPage: React.FC<StoresPageProps> = ({
  onNavigate,
  selectedNeighborhood: initialNeighborhood,
  initialCategory = ''
}) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<CategoryBubbleItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || '');
  const [neighborhood, setNeighborhood] = useState<string>(initialNeighborhood || '');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // If initialCategory changes from parent, sync it
  useEffect(() => {
    if (initialCategory !== undefined) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory) queryParams.set('category', selectedCategory);
        if (neighborhood) queryParams.set('neighborhood', neighborhood);
        if (search) queryParams.set('search', search);

        const [storesRes, initRes] = await Promise.all([
          apiRequest<{ stores: Store[] }>(`/api/stores?${queryParams.toString()}`),
          apiRequest('/api/public/initial-data')
        ]);
        setStores(storesRes.stores || []);

        const rawCats = initRes.productCategories || [];
        const allStores = initRes.featuredStores || [];
        const seen = new Set<string>();
        const enrichedCats: CategoryBubbleItem[] = [];

        rawCats.forEach((c: any) => {
          const lower = c.name.toLowerCase();
          if (!seen.has(lower)) {
            seen.add(lower);
            const count = allStores.filter((s: Store) => 
              s.category?.toLowerCase() === lower || s.category?.toLowerCase() === c.slug?.toLowerCase()
            ).length;
            enrichedCats.push({
              id: c.id,
              name: c.name,
              slug: c.slug,
              icon: c.icon,
              storeCount: count
            });
          }
        });

        STORE_CATEGORIES.forEach(catName => {
          const lower = catName.toLowerCase();
          if (!seen.has(lower)) {
            seen.add(lower);
            const count = allStores.filter((s: Store) => s.category?.toLowerCase() === lower).length;
            enrichedCats.push({
              id: `cat_${catName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
              name: catName,
              slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              storeCount: count
            });
          }
        });

        setCategories(enrichedCats);
      } catch (err) {
        console.error('Failed to load stores:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedCategory, neighborhood, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('home')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o início
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Lojas e Comércios de Canaã dos Carajás
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Selecione uma categoria abaixo para ver instantaneamente as lojas ativas em cada segmento.
          </p>
        </div>
      </div>

      {/* Category Selection Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Categorias • Toque para filtrar lojas
          </span>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory('')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Limpar filtro de categoria
            </button>
          )}
        </div>

        <CategoryBubbles
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat ? cat.name : '')}
          showAllOption={true}
        />
      </div>

      {/* Active Category Status Banner */}
      {selectedCategory && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Exibindo <strong>{stores.length}</strong> {stores.length === 1 ? 'loja ativa' : 'lojas ativas'} na categoria <strong>{selectedCategory}</strong>
            </span>
          </div>
          <button
            onClick={() => setSelectedCategory('')}
            className="font-bold underline text-emerald-800 hover:text-emerald-950 cursor-pointer"
          >
            Ver todas as categorias
          </button>
        </div>
      )}

      {/* Search & Secondary Filters */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome da loja ou produto..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Neighborhood filter */}
          <div className="relative">
            <select
              value={neighborhood}
              onChange={e => setNeighborhood(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">Todos os bairros de Canaã</option>
              {CANAA_NEIGHBORHOODS.map(b => (
                <option key={b} value={b}>Bairro {b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stores Grid */}
      {isLoading ? (
        <div className="py-20 flex justify-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : stores.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-slate-200 p-8">
          <StoreIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhuma loja encontrada com esses filtros</h3>
          <p className="text-xs text-slate-500 mt-1">Tente selecionar outro bairro ou limpar a busca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map(store => (
            <div
              key={store.id}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-lg transition flex flex-col justify-between group"
            >
              <div className="relative h-40 bg-slate-100 overflow-hidden">
                <img
                  src={store.banner_url || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=300&fit=crop&q=80'}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
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
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{store.category}</span>
                      <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition leading-snug">
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
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  Ver Loja e Catálogo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
