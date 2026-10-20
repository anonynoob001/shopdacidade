// Shop Carajás - Service Provider Dashboard
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  Phone,
  Send,
  User,
  Wrench,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, formatBRL, formatDateBR } from '../services/api';
import { QuoteRequest, ServiceProvider, ServiceSchedule } from '../worker/types';

interface ProviderDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [activeTab, setActiveTab] = useState<'quotes' | 'schedules' | 'profile'>('quotes');
  const [isLoading, setIsLoading] = useState(true);

  // Proposal modal
  const [activeQuote, setActiveQuote] = useState<QuoteRequest | null>(null);
  const [proposalText, setProposalText] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [materialsIncluded, setMaterialsIncluded] = useState(false);
  const [estimatedDays, setEstimatedDays] = useState('1');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [authRes, quotesRes, schedRes] = await Promise.all([
        apiRequest<{ provider: ServiceProvider }>('/api/auth/me'),
        apiRequest<{ quotes: QuoteRequest[] }>('/api/services/quotes/provider-inbox'),
        apiRequest<{ schedules: ServiceSchedule[] }>('/api/services/schedules/my-schedules')
      ]);

      setProvider(authRes.provider || null);
      setQuotes(quotesRes.quotes || []);
      setSchedules(schedRes.schedules || []);
    } catch (err) {
      console.error('Failed to load provider data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenProposal = (quote: QuoteRequest) => {
    setActiveQuote(quote);
    setProposalText('');
    setEstimatedPrice('');
    setMaterialsIncluded(false);
    setEstimatedDays('1');
  };

  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuote) return;
    setIsSubmittingProposal(true);
    try {
      await apiRequest(`/api/services/quotes/${activeQuote.id}/proposals`, {
        method: 'POST',
        body: JSON.stringify({
          proposal_text: proposalText,
          estimated_price: parseFloat(estimatedPrice),
          materials_included: materialsIncluded,
          estimated_days: parseInt(estimatedDays) || 1
        })
      });
      alert('Proposta de orçamento enviada ao cliente com sucesso!');
      setActiveQuote(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Falha ao enviar proposta.');
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const handleUpdateScheduleStatus = async (scheduleId: string, status: string) => {
    try {
      await apiRequest(`/api/services/schedules/${scheduleId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Falha ao atualizar agendamento.');
    }
  };

  if (!provider && !isLoading) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <Wrench className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Perfil de prestador não configurado</h2>
        <p className="text-xs text-slate-500">Cadastre seus serviços para receber pedidos de orçamento em Canaã.</p>
        <button
          onClick={() => onNavigate('partner-register')}
          className="px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs"
        >
          Cadastrar Meus Serviços
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={() => onNavigate('home')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Início
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Painel do Profissional: <span className="text-teal-700">{provider?.business_name}</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
              Ativo
            </span>
          </div>
          <p className="text-xs text-slate-500">{provider?.specialty}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold text-slate-600">
        <button
          onClick={() => setActiveTab('quotes')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'quotes' ? 'border-teal-600 text-teal-700' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Orçamentos Recebidos ({quotes.length})
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'schedules' ? 'border-teal-600 text-teal-700' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Agendamentos & Visitas ({schedules.length})
        </button>
      </div>

      {/* TAB: QUOTES */}
      {activeTab === 'quotes' && (
        <div className="space-y-4">
          {quotes.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Nenhuma solicitação de orçamento pendente</h3>
              <p className="text-xs text-slate-500">Quando clientes de Canaã pedirem orçamentos para sua especialidade, eles aparecerão aqui.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map(quote => (
                <div key={quote.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{quote.service_title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          quote.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                          quote.status === 'answered' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {quote.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span>Cliente: {quote.user_name || 'Morador'}</span>
                        <span>•</span>
                        <span>Bairro: {quote.neighborhood}</span>
                        <span>•</span>
                        <span>Urgência: {quote.urgency}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenProposal(quote)}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Responder com Proposta
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{quote.description}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: SCHEDULES */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          {schedules.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Nenhum agendamento marcado no momento</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{item.service_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'completed' ? 'bg-slate-200 text-slate-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-slate-600 font-semibold mt-0.5">Cliente: {item.client_name} ({item.client_phone})</div>
                    {item.notes && <p className="text-slate-500 mt-1 italic">"{item.notes}"</p>}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div>{item.scheduled_date}</div>
                      <div className="text-teal-700">{item.scheduled_time_slot}</div>
                    </div>

                    {item.status === 'requested' && (
                      <button
                        onClick={() => handleUpdateScheduleStatus(item.id, 'confirmed')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer"
                      >
                        Confirmar
                      </button>
                    )}
                    {item.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateScheduleStatus(item.id, 'completed')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold cursor-pointer"
                      >
                        Concluído
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROPOSAL MODAL */}
      {activeQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setActiveQuote(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-slate-900 mb-2">
              Elaborar Proposta Formal de Orçamento
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Serviço: <strong>{activeQuote.service_title}</strong> (Bairro {activeQuote.neighborhood})
            </p>

            <form onSubmit={handleSendProposal} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Valor Estimado Total (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={estimatedPrice}
                  onChange={e => setEstimatedPrice(e.target.value)}
                  placeholder="Ex: 250.00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prazo Estimado de Execução (dias)</label>
                <input
                  type="number"
                  min="1"
                  value={estimatedDays}
                  onChange={e => setEstimatedDays(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição Detalhada da Proposta *</label>
                <textarea
                  required
                  rows={3}
                  value={proposalText}
                  onChange={e => setProposalText(e.target.value)}
                  placeholder="Especifique o que está incluído no serviço, forma de execução, garantia e termos..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={materialsIncluded}
                    onChange={e => setMaterialsIncluded(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Materiais e peças inclusos no valor informado</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmittingProposal}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {isSubmittingProposal ? 'Enviando...' : 'Enviar Proposta ao Morador'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
