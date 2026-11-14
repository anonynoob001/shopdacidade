// Shop Carajás - Service Providers Directory
import { ArrowLeft, CheckCircle2, MapPin, MessageSquare, Search, Star, Wrench } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { apiRequest, CANAA_NEIGHBORHOODS, formatBRL } from '../services/api';
import { ServiceCategory, ServiceProvider } from '../worker/types';

interface ServicesPageProps {
  onNavigate: (view: string, param?: string) => void;
  selectedNeighborhood: string;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onNavigate, selectedNeighborhood: initialNeighborhood }) => {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [neighborhood, setNeighborhood] = useState(initialNeighborhood || '');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory) queryParams.set('category', selectedCategory);
        if (neighborhood) queryParams.set('neighborhood', neighborhood);
        if (search) queryParams.set('search', search);

        const [provRes, initRes] = await Promise.all([
          apiRequest<{ providers: ServiceProvider[] }>(`/api/services/providers?${queryParams.toString()}`),
          apiRequest('/api/public/initial-data')
        ]);
        setProviders(provRes.providers || []);
        setCategories(initRes.serviceCategories || []);
      } catch (err) {
        console.error('Failed to load service providers:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedCategory, neighborhood, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => onNavigate('home')}
          className="text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] flex items-center gap-1 mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o início
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--theme-text-primary)] tracking-tight">
          Prestadores de Serviços em Canaã dos Carajás
        </h1>
        <p className="text-xs sm:text-sm text-[var(--theme-text-secondary)] mt-1">
          Encontre eletricistas, técnicos de ar-condicionado, encanadores, diaristas e reformas. Peça orçamentos e agende atendimento online.
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          backgroundColor: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-card-border)'
        }}
        className="p-4 rounded-2xl border shadow-xs space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por especialidade ou profissional..."
              style={{
                backgroundColor: 'var(--theme-page-bg)',
                borderColor: 'var(--theme-card-border)',
                color: 'var(--theme-text-primary)'
              }}
              className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-[var(--theme-primary)]"
            />
            <Search className="w-4 h-4 text-[var(--theme-text-secondary)] absolute left-3 top-2.5" />
          </div>

          <div className="relative">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{
                backgroundColor: 'var(--theme-page-bg)',
                borderColor: 'var(--theme-card-border)',
                color: 'var(--theme-text-primary)'
              }}
              className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-[var(--theme-primary)] cursor-pointer"
            >
              <option value="">Todas as categorias de serviço</option>
              {categories.map(c => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={neighborhood}
              onChange={e => setNeighborhood(e.target.value)}
              style={{
                backgroundColor: 'var(--theme-page-bg)',
                borderColor: 'var(--theme-card-border)',
                color: 'var(--theme-text-primary)'
              }}
              className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-[var(--theme-primary)] cursor-pointer"
            >
              <option value="">Todos os bairros atendidos</option>
              {CANAA_NEIGHBORHOODS.map(b => (
                <option key={b} value={b}>Bairro {b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Providers Grid */}
      {isLoading ? (
        <div className="py-20 flex justify-center text-[var(--theme-text-secondary)]">
          <div
            style={{ borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }}
            className="w-8 h-8 border-3 rounded-full animate-spin"
          />
        </div>
      ) : providers.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-card-border)'
          }}
          className="py-16 text-center rounded-2xl border p-8"
        >
          <Wrench className="w-12 h-12 text-[var(--theme-text-secondary)] opacity-40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[var(--theme-text-primary)]">Nenhum prestador encontrado com estes filtros</h3>
          <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Experimente buscar por outros termos ou limpar a categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map(prov => (
            <div
              key={prov.id}
              style={{
                backgroundColor: 'var(--theme-card-bg)',
                borderColor: 'var(--theme-card-border)'
              }}
              className="rounded-2xl border p-5 flex flex-col justify-between hover:shadow-lg hover:border-[var(--theme-primary)] transition duration-200 space-y-4"
            >
              <div>
                <div className="flex items-start gap-3.5">
                  <img
                    src={prov.photo_url || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=120&h=120&fit=crop&q=80'}
                    alt={prov.business_name}
                    style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 35%, transparent)' }}
                    className="w-16 h-16 rounded-2xl object-cover border-2 shrink-0 shadow-xs"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500 font-bold text-xs flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {prov.rating_average.toFixed(1)}
                      </span>
                      <span className="text-[11px] text-[var(--theme-text-secondary)]">({prov.total_reviews} avaliações)</span>
                      {prov.is_approved === 1 && (
                        <span style={{ color: 'var(--theme-badge-open)' }} className="text-[10px] font-bold flex items-center gap-0.5 ml-auto">
                          <CheckCircle2 className="w-3 h-3" /> Verificado
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-[var(--theme-text-primary)] mt-1 leading-snug">
                      {prov.business_name}
                    </h3>
                    <p style={{ color: 'var(--theme-accent)' }} className="text-xs font-semibold">{prov.category_name}</p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-[var(--theme-text-secondary)] line-clamp-3 leading-relaxed">
                  {prov.specialty}
                </p>
              </div>

              <div style={{ borderColor: 'var(--theme-card-border)' }} className="pt-3 border-t flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider block">Serviços a partir de</span>
                  <span className="text-sm font-bold text-[var(--theme-text-primary)]">
                    {prov.starting_price > 0 ? formatBRL(prov.starting_price) : 'Sob Consulta'}
                  </span>
                </div>
                <button
                  onClick={() => onNavigate('provider-detail', prov.slug)}
                  style={{
                    backgroundColor: 'var(--theme-accent)',
                    color: 'var(--theme-accent-text)'
                  }}
                  className="px-3.5 py-2 rounded-xl hover:brightness-110 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Ver Perfil & Orçar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
