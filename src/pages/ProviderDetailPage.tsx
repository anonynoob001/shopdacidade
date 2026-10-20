// Shop Carajás - Service Provider Detail Page with Quotes & Scheduling
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  Star,
  User,
  Wrench,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, CANAA_NEIGHBORHOODS, formatBRL, formatDateBR } from '../services/api';
import { Review, ServiceProvider } from '../worker/types';

interface ProviderDetailPageProps {
  providerSlug: string;
  onNavigate: (view: string, param?: string) => void;
}

export const ProviderDetailPage: React.FC<ProviderDetailPageProps> = ({ providerSlug, onNavigate }) => {
  const { user, openAuthModal } = useAuth();
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quote modal state
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteServiceTitle, setQuoteServiceTitle] = useState('');
  const [quoteDescription, setQuoteDescription] = useState('');
  const [quoteNeighborhood, setQuoteNeighborhood] = useState('Centro');
  const [quoteUrgency, setQuoteUrgency] = useState<'baixa' | 'media' | 'alta' | 'urgente'>('media');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState<string | null>(null);

  // Scheduling modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [schedService, setSchedService] = useState('');
  const [schedDate, setSchedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [schedSlot, setSchedSlot] = useState('09:00');
  const [schedPhone, setSchedPhone] = useState('');
  const [schedNotes, setSchedNotes] = useState('');
  const [schedSubmitting, setSchedSubmitting] = useState(false);
  const [schedSuccessMsg, setSchedSuccessMsg] = useState<string | null>(null);
  const [schedError, setSchedError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiRequest<{ provider: ServiceProvider; reviews: Review[] }>(`/api/services/providers/${providerSlug}`);
        setProvider(res.provider);
        setReviews(res.reviews || []);
      } catch (err: any) {
        setError(err?.message || 'Prestador não encontrado.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [providerSlug]);

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    setQuoteSubmitting(true);
    try {
      const res = await apiRequest<{ success: boolean; quoteCode: string }>('/api/services/quotes', {
        method: 'POST',
        body: JSON.stringify({
          provider_id: provider?.id,
          service_title: quoteServiceTitle,
          description: quoteDescription,
          neighborhood: quoteNeighborhood,
          urgency: quoteUrgency
        })
      });
      setQuoteSuccessMsg(`Orçamento solicitado com sucesso! Código: ${res.quoteCode}. O profissional responderá com uma proposta.`);
      setQuoteServiceTitle('');
      setQuoteDescription('');
    } catch (err: any) {
      alert(err?.message || 'Falha ao enviar solicitação.');
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    setSchedSubmitting(true);
    setSchedError(null);
    try {
      await apiRequest('/api/services/schedules', {
        method: 'POST',
        body: JSON.stringify({
          provider_id: provider?.id,
          service_name: schedService,
          scheduled_date: schedDate,
          scheduled_time_slot: schedSlot,
          client_phone: schedPhone,
          notes: schedNotes
        })
      });
      setSchedSuccessMsg(`Atendimento agendado para o dia ${schedDate} às ${schedSlot}! O profissional confirmará o horário.`);
      setSchedService('');
      setSchedNotes('');
    } catch (err: any) {
      setSchedError(err?.message || 'Falha ao agendar serviço.');
    } finally {
      setSchedSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center text-slate-400">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Prestador não encontrado</h2>
        <p className="text-xs text-slate-500 mt-1">{error || 'O profissional não está disponível no momento.'}</p>
        <button
          onClick={() => onNavigate('services')}
          className="mt-5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          Voltar para Serviços
        </button>
      </div>
    );
  }

  let coveredNeighborhoods: string[] = [];
  try {
    coveredNeighborhoods = JSON.parse(provider.neighborhoods_json || '[]');
  } catch {
    coveredNeighborhoods = ['Todos os bairros de Canaã dos Carajás'];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <button
        onClick={() => onNavigate('services')}
        className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar para Prestadores de Serviços
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <img
              src={provider.photo_url || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200&h=200&fit=crop&q=80'}
              alt={provider.business_name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-teal-500/30 shadow-md shrink-0"
            />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold uppercase tracking-wider">
                  {provider.category_name}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-teal-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Profissional Verificado
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {provider.business_name}
              </h1>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 mr-1" />
                  {provider.rating_average.toFixed(1)}
                  <span className="text-slate-400 font-normal ml-1">({provider.total_reviews} avaliações)</span>
                </div>
                <span>•</span>
                <span>Canaã dos Carajás, PA</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed pt-1">
                {provider.description || provider.specialty}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => { setIsQuoteOpen(true); setQuoteSuccessMsg(null); }}
              className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Solicitar Orçamento Grátis
            </button>
            <button
              onClick={() => { setIsScheduleOpen(true); setSchedSuccessMsg(null); setSchedError(null); }}
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              Agendar Visita / Serviço
            </button>
            {provider.whatsapp && (
              <a
                href={`https://wa.me/55${provider.whatsapp.replace(/\D/g, '')}?text=Olá,%20vi%20seu%20perfil%20no%20Shop%20Carajás!`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl border border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Direto
              </a>
            )}
          </div>
        </div>

        {/* Informações de Atendimento */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Preço Inicial</h4>
            <p className="text-base font-black text-teal-700">
              {provider.starting_price > 0 ? formatBRL(provider.starting_price) : 'Sob Consulta'}
            </p>
            <span className="text-[10px] text-slate-400">Varia conforme a complexidade e peças</span>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Bairros Atendidos em Canaã</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {coveredNeighborhoods.map((b, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                  {b}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Disponibilidade</h4>
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Disponível para novos atendimentos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Avaliações Verificadas */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Avaliações Verificadas ({reviews.length})</h3>
        {reviews.length === 0 ? (
          <p className="text-xs text-slate-500">Este prestador ainda não possui avaliações públicas registradas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map(r => (
              <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{r.user_name || 'Morador de Canaã'}</span>
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 italic">"{r.comment}"</p>
                <span className="text-[10px] text-slate-400 block">{formatDateBR(r.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Solicitar Orçamento */}
      {isQuoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setIsQuoteOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Solicitar Orçamento Formal</h3>
                <p className="text-xs text-slate-500">Para: {provider.business_name}</p>
              </div>
            </div>

            {quoteSuccessMsg ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  {quoteSuccessMsg}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIsQuoteOpen(false); onNavigate('my-quotes'); }}
                    className="flex-1 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs"
                  >
                    Ver Meus Orçamentos
                  </button>
                  <button
                    onClick={() => setIsQuoteOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuoteSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Qual o serviço desejado? *</label>
                  <input
                    type="text"
                    required
                    value={quoteServiceTitle}
                    onChange={e => setQuoteServiceTitle(e.target.value)}
                    placeholder="Ex: Instalação de Ar Split 12.000 BTUs ou Troca de Fiação"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bairro em Canaã dos Carajás *</label>
                  <select
                    value={quoteNeighborhood}
                    onChange={e => setQuoteNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-500"
                  >
                    {CANAA_NEIGHBORHOODS.map(b => (
                      <option key={b} value={b}>Bairro {b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Descreva o serviço ou problema com detalhes *</label>
                  <textarea
                    required
                    rows={3}
                    value={quoteDescription}
                    onChange={e => setQuoteDescription(e.target.value)}
                    placeholder="Descreva o local, se já tem ponto de energia, se você já possui as peças ou materiais, etc."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Urgência</label>
                    <select
                      value={quoteUrgency}
                      onChange={e => setQuoteUrgency(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-teal-500"
                    >
                      <option value="baixa">Baixa (para próximas semanas)</option>
                      <option value="media">Média (próximos 3 a 5 dias)</option>
                      <option value="alta">Alta (próximas 24-48h)</option>
                      <option value="urgente">Urgente (Hoje mesmo)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={quoteSubmitting}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {quoteSubmitting ? 'Enviando...' : 'Enviar Solicitação de Orçamento'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Agendar Horário */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setIsScheduleOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Calendar className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Agendar Atendimento Online</h3>
                <p className="text-xs text-slate-500">Com: {provider.business_name}</p>
              </div>
            </div>

            {schedError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {schedError}
              </div>
            )}

            {schedSuccessMsg ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  {schedSuccessMsg}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIsScheduleOpen(false); onNavigate('my-schedules'); }}
                    className="flex-1 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                  >
                    Ver Meus Agendamentos
                  </button>
                  <button
                    onClick={() => setIsScheduleOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Serviço a realizar *</label>
                  <input
                    type="text"
                    required
                    value={schedService}
                    onChange={e => setSchedService(e.target.value)}
                    placeholder="Ex: Visita técnica para avaliação de ar-condicionado"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Data preferida *</label>
                    <input
                      type="date"
                      required
                      value={schedDate}
                      onChange={e => setSchedDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Horário *</label>
                    <select
                      value={schedSlot}
                      onChange={e => setSchedSlot(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                    >
                      <option value="08:00">08:00 (Manhã)</option>
                      <option value="09:30">09:30 (Manhã)</option>
                      <option value="11:00">11:00 (Manhã)</option>
                      <option value="14:00">14:00 (Tarde)</option>
                      <option value="15:30">15:30 (Tarde)</option>
                      <option value="17:00">17:00 (Fim de tarde)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp para confirmação</label>
                  <input
                    type="text"
                    value={schedPhone}
                    onChange={e => setSchedPhone(e.target.value)}
                    placeholder="(94) 99123-4567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instruções / Endereço em Canaã</label>
                  <textarea
                    rows={2}
                    value={schedNotes}
                    onChange={e => setSchedNotes(e.target.value)}
                    placeholder="Rua, número, bairro e ponto de referência"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={schedSubmitting}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Calendar className="w-4 h-4 text-teal-400" />
                  {schedSubmitting ? 'Verificando e agendando...' : 'Confirmar Solicitação de Agendamento'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
