// Shop Carajás - Customer Schedules Page
import { ArrowLeft, Calendar, CheckCircle2, Clock, Phone, Wrench, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { ServiceSchedule } from '../worker/types';

interface MySchedulesPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const MySchedulesPage: React.FC<MySchedulesPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSchedules() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await apiRequest<{ schedules: ServiceSchedule[] }>('/api/services/schedules/my-schedules');
        setSchedules(res.schedules || []);
      } catch (err) {
        console.error('Failed to load schedules:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSchedules();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <button
          onClick={() => onNavigate('home')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o início
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Meus Agendamentos de Serviços
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Visitas técnicas e serviços agendados com profissionais de Canaã dos Carajás.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center text-slate-400">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Nenhum agendamento ativo</h3>
          <p className="text-xs text-slate-500">Agende visitas de avaliação ou serviços elétricos e de climatização.</p>
          <button
            onClick={() => onNavigate('services')}
            className="mt-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs"
          >
            Ver Prestadores Disponíveis
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{item.service_name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                    item.status === 'completed' ? 'bg-slate-200 text-slate-800' :
                    item.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status === 'requested' ? 'Aguardando Confirmação' : item.status}
                  </span>
                </div>
                <div className="text-slate-600 font-semibold">{item.provider_name}</div>
                {item.notes && <p className="text-slate-500 italic mt-1">"{item.notes}"</p>}
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span>{item.scheduled_date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>{item.scheduled_time_slot}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
