// Shop da Cidade - Dynamic Theme & Site Settings Context
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../services/api';

export interface SiteSettings {
  platform_name: string;
  site_tagline: string;
  city_name: string;
  city_state: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  official_whatsapp: string;
  official_email: string;
  banner_notice: string;
  banner_notice_active?: string;
  pix_key?: string;
  pix_beneficiary?: string;
  default_commission_rate?: string;
  cloudflare_database_id?: string;
  cloudflare_database_name?: string;
  cloudflare_account_id?: string;
  cloudflare_r2_bucket?: string;
  supabase_url?: string;
  supabase_anon_key?: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  platform_name: 'Shop da Cidade',
  site_tagline: 'O Shopping Virtual da Sua Cidade',
  city_name: 'Canaã dos Carajás',
  city_state: 'PA',
  primary_color: '#fdca04', // Vibrant Gold/Yellow extracted from logo
  secondary_color: '#0f172a', // Rich Dark Slate from logo
  accent_color: '#f59e0b',
  official_whatsapp: '(94) 99123-4567',
  official_email: 'atendimento@shopdacidade.com.br',
  banner_notice: 'Bem-vindo ao Shop da Cidade! Conectando você às melhores lojas e prestadores de Canaã dos Carajás - PA.',
  banner_notice_active: '1'
};

interface ThemeContextType {
  settings: SiteSettings;
  isLoading: boolean;
  updateSettingsState: (newSettings: Partial<SiteSettings>) => void;
  refreshSettings: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  updateSettingsState: () => {},
  refreshSettings: async () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const applyThemeVariables = (s: SiteSettings) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const primary = s.primary_color || '#fdca04';
    const secondary = s.secondary_color || '#0f172a';
    const accent = s.accent_color || '#f59e0b';

    root.style.setProperty('--color-theme-primary', primary);
    root.style.setProperty('--color-theme-secondary', secondary);
    root.style.setProperty('--color-theme-accent', accent);
  };

  const loadSettings = async () => {
    try {
      const res = await apiRequest<{ settings: Record<string, string> }>('/api/public/settings');
      if (res && res.settings) {
        const merged: SiteSettings = {
          ...DEFAULT_SETTINGS,
          ...res.settings
        };
        setSettings(merged);
        applyThemeVariables(merged);
      }
    } catch {
      // Fallback to defaults or try initial-data
      try {
        const initRes = await apiRequest<{ settings: Record<string, string> }>('/api/public/initial-data');
        if (initRes && initRes.settings) {
          const merged: SiteSettings = {
            ...DEFAULT_SETTINGS,
            ...initRes.settings
          };
          setSettings(merged);
          applyThemeVariables(merged);
        }
      } catch {
        applyThemeVariables(DEFAULT_SETTINGS);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSettingsState = (newSettings: Partial<SiteSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      applyThemeVariables(updated);
      return updated;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        settings,
        isLoading,
        updateSettingsState,
        refreshSettings: loadSettings
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useSiteTheme = () => useContext(ThemeContext);
