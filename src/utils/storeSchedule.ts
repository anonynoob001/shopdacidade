// Shop Carajás - Store Operating Schedule Utilities
import { Store } from '../worker/types';

export interface DaySchedule {
  isOpen: boolean;
  from: string; // "08:00"
  to: string;   // "22:00"
}

export interface WeeklySchedule {
  segunda: DaySchedule;
  terca: DaySchedule;
  quarta: DaySchedule;
  quinta: DaySchedule;
  sexta: DaySchedule;
  sabado: DaySchedule;
  domingo: DaySchedule;
}

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  segunda: { isOpen: true, from: '08:00', to: '22:00' },
  terca: { isOpen: true, from: '08:00', to: '22:00' },
  quarta: { isOpen: true, from: '08:00', to: '22:00' },
  quinta: { isOpen: true, from: '08:00', to: '22:00' },
  sexta: { isOpen: true, from: '08:00', to: '22:00' },
  sabado: { isOpen: true, from: '08:00', to: '22:00' },
  domingo: { isOpen: false, from: '08:00', to: '14:00' }
};

export const DAY_NAMES: Record<keyof WeeklySchedule, string> = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado',
  domingo: 'Domingo'
};

const DAY_INDEX_MAP: Array<keyof WeeklySchedule> = [
  'domingo', // 0
  'segunda', // 1
  'terca',   // 2
  'quarta',  // 3
  'quinta',  // 4
  'sexta',   // 5
  'sabado'   // 6
];

export function parseStoreSchedule(scheduleJson?: string): WeeklySchedule {
  if (!scheduleJson) return DEFAULT_WEEKLY_SCHEDULE;
  try {
    const parsed = typeof scheduleJson === 'string' ? JSON.parse(scheduleJson) : scheduleJson;
    return { ...DEFAULT_WEEKLY_SCHEDULE, ...parsed };
  } catch {
    return DEFAULT_WEEKLY_SCHEDULE;
  }
}

export interface StoreStatusResult {
  isOpen: boolean;
  statusText: string;
  badgeColorClass: string;
  scheduleDetail: string;
}

export function getStoreStatus(store: Store): StoreStatusResult {
  // If merchant turned the manual master switch off
  if (store.is_open === 0) {
    return {
      isOpen: false,
      statusText: 'Fechado no momento',
      badgeColorClass: 'bg-rose-600 text-white',
      scheduleDetail: 'Estabelecimento pausado temporariamente'
    };
  }

  // If opening_hours_json is configured, calculate according to current local time (America/Belem GMT-3)
  if (store.opening_hours_json) {
    const schedule = parseStoreSchedule(store.opening_hours_json);
    const now = new Date();
    // Get time in Brazil/Pará timezone
    const nowStr = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Belem', hour12: false, hour: '2-digit', minute: '2-digit' });
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const todayKey = DAY_INDEX_MAP[dayOfWeek];
    const todaySchedule = schedule[todayKey];

    if (!todaySchedule || !todaySchedule.isOpen) {
      return {
        isOpen: false,
        statusText: 'Fechado hoje',
        badgeColorClass: 'bg-slate-700 text-slate-200',
        scheduleDetail: `Fechado aos domingos e feriados`
      };
    }

    if (nowStr >= todaySchedule.from && nowStr <= todaySchedule.to) {
      return {
        isOpen: true,
        statusText: 'Aberto Agora',
        badgeColorClass: 'bg-emerald-600 text-white',
        scheduleDetail: `Atendendo hoje até as ${todaySchedule.to}`
      };
    } else {
      return {
        isOpen: false,
        statusText: 'Fechado agora',
        badgeColorClass: 'bg-amber-600 text-white',
        scheduleDetail: `Hoje: ${todaySchedule.from} às ${todaySchedule.to}`
      };
    }
  }

  // Default: Open
  return {
    isOpen: true,
    statusText: 'Aberto Agora',
    badgeColorClass: 'bg-emerald-600 text-white',
    scheduleDetail: 'Aberto para pedidos'
  };
}
