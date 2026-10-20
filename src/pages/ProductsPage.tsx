// Shop Carajás - Products Catalog Page
import { ArrowLeft, Filter, Plus, Search, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { apiRequest, formatBRL } from '../services/api';
import { Product } from '../worker/types';

interface ProductsPageProps {
  initialCategory?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ initialCategory, onNavigate }) => {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || '');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory) queryParams.set('category', selectedCategory);
        if (search) queryParams.set('search', search);
        if (sort) queryParams.set('sort', sort);
        if (minPrice) queryParams.set('minPrice', minPrice);
        if (maxPrice) queryParams.set('maxPrice', maxPrice);

        const [prodRes, initRes] = await Promise.all([
          apiRequest<{ products: Product[] }>(`/api/products?${queryParams.toString()}`),
          apiRequest('/api/public/initial-data')
        ]);
        setProducts(prodRes.products || []);
        setCategories(initRes.productCategories || []);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedCategory, search, sort, minPrice, maxPrice]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => onNavigate('home')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o início
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Catálogo Geral de Produtos
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Pesquise itens disponíveis nas lojas de Canaã dos Carajás com entrega rápida no seu endereço.
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome ou código..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Category */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">Todas as categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div className="relative">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="recent">Mais recentes e destaques</option>
              <option value="price_asc">Menor preço primeiro</option>
              <option value="price_desc">Maior preço primeiro</option>
              <option value="name">Ordem alfabética (A-Z)</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min R$"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="number"
              placeholder="Max R$"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Product List */}
      {isLoading ? (
        <div className="py-20 flex justify-center text-slate-400">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-slate-200 p-8">
          <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">Nenhum produto encontrado com os filtros aplicados</h3>
          <p className="text-xs text-slate-500 mt-1">Experimente alterar os termos de busca ou a faixa de preço.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map(product => {
            const hasPromo = product.promotional_price && product.promotional_price > 0 && product.promotional_price < product.price;
            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="relative aspect-square bg-slate-50 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition duration-500"
                  />
                  {hasPromo && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow">
                      Oferta
                    </span>
                  )}
                  {product.stock_quantity <= 0 && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold">
                      Esgotado
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <button
                      onClick={() => onNavigate('store-detail', product.store_slug)}
                      className="text-[10px] font-semibold text-emerald-700 hover:underline uppercase tracking-wider block text-left"
                    >
                      {product.store_name}
                    </button>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 mt-0.5 leading-snug">
                      {product.name}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      {hasPromo ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base sm:text-lg font-black text-emerald-700">
                            {formatBRL(product.promotional_price)}
                          </span>
                          <span className="text-xs text-slate-400 line-through">
                            {formatBRL(product.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-base sm:text-lg font-black text-slate-900">
                          {formatBRL(product.price)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => addItem(product, 1)}
                      disabled={product.stock_quantity <= 0}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
