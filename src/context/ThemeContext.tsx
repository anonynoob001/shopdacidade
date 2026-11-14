// Shop da Cidade - Dynamic Theme & Site Settings Context
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../services/api';

export interface SiteSettings {
  platform_name: string;
  site_tagline: string;
  site_logo_url?: string;
  city_name: string;
  city_state: string;

  // Core & Granular Editable Theme Colors
  primary_color: string;
  primary_text_color?: string;
  secondary_color: string;
  accent_color: string;
  accent_text_color?: string;

  notice_bg_color?: string;
  notice_text_color?: string;

  topbar_bg_color?: string;
  header_text_color?: string;
  header_input_bg_color?: string;
  footer_bg_color?: string;
  footer_text_color?: string;

  page_bg_color?: string;
  card_bg_color?: string;
  card_border_color?: string;
  text_primary_color?: string;
  text_secondary_color?: string;

  hero_bg_color?: string;
  hero_bg_end_color?: string;
  hero_text_color?: string;

  dark_section_bg_color?: string;
  dark_card_bg_color?: string;

  bottom_nav_bg_color?: string;
  badge_open_color?: string;

  // Contacts & Operational Config
  official_whatsapp: string;
  official_email: string;
  banner_notice: string;
  banner_notice_active?: string;
  demo_mode_enabled?: string;
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

export const DEFAULT_SITE_COLORS = {
  notice_bg_color: '#0047F7',
  notice_text_color: '#FFFFFF',

  topbar_bg_color: '#050E24',
  secondary_color: '#071536',
  header_text_color: '#F8FAFC',
  header_input_bg_color: '#0F172A',

  footer_bg_color: '#071536',
  footer_text_color: '#94A3B8',

  page_bg_color: '#F8FAFC',
  card_bg_color: '#FFFFFF',
  card_border_color: '#E2E8F0',
  text_primary_color: '#0F172A',
  text_secondary_color: '#64748B',

  primary_color: '#0047F7',
  primary_text_color: '#FFFFFF',
  accent_color: '#FA4802',
  accent_text_color: '#FFFFFF',

  hero_bg_color: '#071536',
  hero_bg_end_color: '#0047F7',
  hero_text_color: '#FFFFFF',

  dark_section_bg_color: '#071536',
  dark_card_bg_color: '#0B1C44',

  bottom_nav_bg_color: '#FFFFFF',
  badge_open_color: '#059669'
};

const DEFAULT_SETTINGS: SiteSettings = {
  platform_name: 'Shop da Cidade',
  site_tagline: 'O Shopping Virtual da Sua Cidade',
  site_logo_url: '/shop-da-cidade-logo-transparente.png',
  city_name: 'Canaã dos Carajás',
  city_state: 'PA',
  ...DEFAULT_SITE_COLORS,
  official_whatsapp: '(94) 99123-4567',
  official_email: 'atendimento@shopdacidade.com.br',
  banner_notice: 'Bem-vindo ao Shop da Cidade! Conectando você às melhores lojas e prestadores de Canaã dos Carajás - PA.',
  banner_notice_active: '1',
  demo_mode_enabled: '0'
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

export function isLightColorHex(hex?: string): boolean {
  if (!hex || typeof hex !== 'string') return false;
  const clean = hex.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean) && !/^[0-9a-fA-F]{3}$/.test(clean)) return false;
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('shop_site_theme_settings');
        if (cached) {
          const parsed = JSON.parse(cached);
          return { ...DEFAULT_SETTINGS, ...parsed };
        }
      } catch {}
    }
    return DEFAULT_SETTINGS;
  });
  const [isLoading, setIsLoading] = useState(true);

  const applyThemeVariables = (s: SiteSettings) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    const primary = s.primary_color || DEFAULT_SITE_COLORS.primary_color;
    const secondary = s.secondary_color || DEFAULT_SITE_COLORS.secondary_color;
    const accent = s.accent_color || DEFAULT_SITE_COLORS.accent_color;

    const primaryText = s.primary_text_color || (isLightColorHex(primary) ? '#0A0A09' : '#FFFFFF');
    const accentText = s.accent_text_color || (isLightColorHex(accent) ? '#0A0A09' : '#FFFFFF');
    const noticeBg = s.notice_bg_color || primary;
    const noticeText = s.notice_text_color || (isLightColorHex(noticeBg) ? '#0A0A09' : '#FFFFFF');

    const topbarBg = s.topbar_bg_color || DEFAULT_SITE_COLORS.topbar_bg_color;
    const headerBg = secondary;
    const headerText = s.header_text_color || (isLightColorHex(headerBg) ? '#0F172A' : '#F8FAFC');
    const headerInputBg = s.header_input_bg_color || (isLightColorHex(headerBg) ? '#F1F5F9' : '#0F172A');

    const footerBg = s.footer_bg_color || secondary;
    const footerText = s.footer_text_color || (isLightColorHex(footerBg) ? '#334155' : '#94A3B8');

    const pageBg = s.page_bg_color || DEFAULT_SITE_COLORS.page_bg_color;
    const cardBg = s.card_bg_color || DEFAULT_SITE_COLORS.card_bg_color;
    const cardBorder = s.card_border_color || DEFAULT_SITE_COLORS.card_border_color;
    const textPrimary = s.text_primary_color || DEFAULT_SITE_COLORS.text_primary_color;
    const textSecondary = s.text_secondary_color || DEFAULT_SITE_COLORS.text_secondary_color;

    const heroBg = s.hero_bg_color || secondary;
    const heroBgEnd = s.hero_bg_end_color || primary;
    const heroText = s.hero_text_color || (isLightColorHex(heroBg) ? '#0F172A' : '#FFFFFF');

    const darkSectionBg = s.dark_section_bg_color || secondary;
    const darkCardBg = s.dark_card_bg_color || DEFAULT_SITE_COLORS.dark_card_bg_color;

    const bottomNavBg = s.bottom_nav_bg_color || DEFAULT_SITE_COLORS.bottom_nav_bg_color;
    const badgeOpen = s.badge_open_color || DEFAULT_SITE_COLORS.badge_open_color;

    // Backwards compatible variables
    root.style.setProperty('--color-theme-primary', primary);
    root.style.setProperty('--color-theme-secondary', secondary);
    root.style.setProperty('--color-theme-accent', accent);

    // Full-site granular variables
    root.style.setProperty('--theme-notice-bg', noticeBg);
    root.style.setProperty('--theme-notice-text', noticeText);

    root.style.setProperty('--theme-topbar-bg', topbarBg);
    root.style.setProperty('--theme-header-bg', headerBg);
    root.style.setProperty('--theme-header-text', headerText);
    root.style.setProperty('--theme-header-input-bg', headerInputBg);

    root.style.setProperty('--theme-footer-bg', footerBg);
    root.style.setProperty('--theme-footer-text', footerText);

    root.style.setProperty('--theme-page-bg', pageBg);
    root.style.setProperty('--theme-card-bg', cardBg);
    root.style.setProperty('--theme-card-border', cardBorder);
    root.style.setProperty('--theme-text-primary', textPrimary);
    root.style.setProperty('--theme-text-secondary', textSecondary);

    root.style.setProperty('--theme-primary', primary);
    root.style.setProperty('--theme-primary-text', primaryText);
    root.style.setProperty('--theme-accent', accent);
    root.style.setProperty('--theme-accent-text', accentText);

    root.style.setProperty('--theme-hero-bg', heroBg);
    root.style.setProperty('--theme-hero-bg-end', heroBgEnd);
    root.style.setProperty('--theme-hero-text', heroText);

    root.style.setProperty('--theme-dark-section-bg', darkSectionBg);
    root.style.setProperty('--theme-dark-card-bg', darkCardBg);

    root.style.setProperty('--theme-bottom-nav-bg', bottomNavBg);
    root.style.setProperty('--theme-badge-open', badgeOpen);
  };

  const loadSettings = async () => {
    try {
      const res = await apiRequest<{ settings: Record<string, string> }>('/api/public/settings');
      if (res && res.settings && Object.keys(res.settings).length > 0) {
        const merged: SiteSettings = {
          ...DEFAULT_SETTINGS,
          ...res.settings
        };
        setSettings(merged);
        applyThemeVariables(merged);
        try { localStorage.setItem('shop_site_theme_settings', JSON.stringify(merged)); } catch {}
      }
    } catch {
      try {
        const initRes = await apiRequest<{ settings: Record<string, string> }>('/api/public/initial-data');
        if (initRes && initRes.settings && Object.keys(initRes.settings).length > 0) {
          const merged: SiteSettings = {
            ...DEFAULT_SETTINGS,
            ...initRes.settings
          };
          setSettings(merged);
          applyThemeVariables(merged);
          try { localStorage.setItem('shop_site_theme_settings', JSON.stringify(merged)); } catch {}
        }
      } catch {
        applyThemeVariables(settings);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    applyThemeVariables(settings);
    loadSettings();
  }, []);

  const updateSettingsState = (newSettings: Partial<SiteSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      applyThemeVariables(updated);
      try { localStorage.setItem('shop_site_theme_settings', JSON.stringify(updated)); } catch {}
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
