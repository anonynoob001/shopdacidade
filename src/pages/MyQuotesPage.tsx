// Shop Carajás - Customer Quotes & Proposals Page
import { ArrowLeft, Check, CheckCircle2, Clock, MessageSquare, Phone, Send, Wrench, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, formatBRL, formatDateBR } from '../services/api';
import { QuoteRequest } from '../worker/types';

interface MyQuotesPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const MyQuotesPage: React.FC<MyQuotesPageProps> = ({ onNavigate }) => {
  const { user, openAuthModal } = useAuth();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const fetchQuotes = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await apiRequest<{ quotes: QuoteRequest[] }>('/api/services/quotes/my-requests');
      setQuotes(res.quotes || []);
    } catch (err) {
      console.error('Failed to load quotes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [user]);

  const handleRespond = async (proposalId: string, action: 'accept' | 'reject') => {
    setRespondingId(proposalId);
    try {
      await apiRequest(`/api/services/proposals/${proposalId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      await fetchQuotes();
    } catch (err: any) {
      alert(err?.message || 'Falha ao responder à proposta.');
    } finally {
      setRespondingId(null);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Acesse sua conta para ver seus orçamentos</h2>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow transition cursor-pointer"
        >
          Entrar na Conta
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <button
          onClick={() => onNavigate('home')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o início
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Minhas Solicitações de Orçamento
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Veja as propostas enviadas pelos prestadores de Canaã dos Carajás, compare valores e aprove a melhor proposta.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center text-slate-400">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : quotes.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-3">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Você ainda não solicitou nenhum orçamento</h3>
          <p className="text-xs text-slate-500">Escolha um profissional e envie uma solicitação sem compromisso.</p>
          <button
            onClick={() => onNavigate('services')}
            className="mt-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs"
          >
            Buscar Prestadores de Serviço
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {quotes.map(quote => (
            <div key={quote.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900">{quote.service_title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      quote.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                      quote.status === 'answered' ? 'bg-teal-100 text-teal-800' :
                      quote.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {quote.status === 'answered' ? 'Proposta Recebida' : quote.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                    <span>Código: {quote.quote_code}</span>
                    <span>•</span>
                    <span>Bairro: {quote.neighborhood}</span>
                    <span>•</span>
                    <span>{formatDateBR(quote.created_at)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-teal-700">{quote.provider_name}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                <span className="font-bold text-slate-700 block mb-1">Sua solicitação:</span>
                <p>{quote.description}</p>
              </div>

              {/* Proposals from provider */}
              {quote.proposals && quote.proposals.length > 0 ? (
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Proposta Enviada pelo Profissional:
                  </h4>
                  {quote.proposals.map(p => (
                    <div key={p.id} className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-teal-800">Valor Estimado</span>
                          <div className="text-xl font-black text-teal-900">{formatBRL(p.estimated_price)}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Prazo estimado</span>
                          <span className="font-bold text-slate-800">{p.estimated_days} dia(s)</span>
                        </div>
                      </div>

                      <p className="text-slate-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-teal-100">
                        {p.proposal_text}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-teal-200/60">
                        <span className="text-[11px] text-slate-600 font-medium">
                          {p.materials_included ? '✓ Materiais inclusos no valor' : '⚠ Não inclui peças ou materiais'}
                        </span>

                        {p.status === 'pending' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRespond(p.id, 'accept')}
                              disabled={respondingId === p.id}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Aceitar Proposta
                            </button>
                            <button
                              onClick={() => handleRespond(p.id, 'reject')}
                              disabled={respondingId === p.id}
                              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              Recusar
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                            p.status === 'accepted' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                          }`}>
                            Proposta {p.status === 'accepted' ? 'Aceita!' : 'Recusada'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Aguardando o prestador de serviços analisar os detalhes e elaborar a proposta formal.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
