// Shop da Cidade - Central Admin Dashboard (Superadmin & Admin) with Live Theme Customizer & Supabase Integration
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle,
  CheckCircle2,
  Copy,
  CreditCard,
  Database,
  DollarSign,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode,
  FileSpreadsheet,
  Globe,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Lock,
  Mail,
  Package,
  Palette,
  Plus,
  QrCode,
  RefreshCw,
  Save,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Sparkles,
  Store,
  Terminal,
  Trash2,
  TrendingUp,
  Truck,
  Upload,
  Users,
  Wrench,
  X
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_SITE_COLORS, useSiteTheme } from '../context/ThemeContext';
import { apiRequest, formatBRL, formatDateBR, STORE_CATEGORIES } from '../services/api';
import { AuditLog, PromotionalBanner, ServiceProvider, Store as StoreType, User } from '../worker/types';

interface AdminDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

type SiteColorKey = keyof typeof DEFAULT_SITE_COLORS;

const THEME_PRESETS: Array<{
  name: string;
  subtitle: string;
  swatches: string[];
  colors: Record<SiteColorKey, string>;
}> = [
  {
    name: 'Shop da Cidade Tech (Azul Cobalto & Laranja)',
    subtitle: 'Identidade moderna de marketplace com azul profundo, azul cobalto e laranja de oferta',
    swatches: ['#0047F7', '#071536', '#FA4802', '#F8FAFC', '#FFFFFF'],
    colors: { ...DEFAULT_SITE_COLORS }
  },
  {
    name: 'Verde Neon & Oliva (Sport High-Contrast)',
    subtitle: 'Alto contraste esportivo com verde neon, verde oliva, verde claro, preto e branco',
    swatches: ['#A2FA07', '#4F6629', '#DFFA7D', '#0A0A09', '#FFFFFF'],
    colors: {
      notice_bg_color: '#A2FA07',
      notice_text_color: '#0A0A09',
      topbar_bg_color: '#050504',
      secondary_color: '#0A0A09',
      header_text_color: '#FFFFFF',
      header_input_bg_color: '#171C10',
      footer_bg_color: '#0A0A09',
      footer_text_color: '#DFFA7D',
      page_bg_color: '#F7FAEF',
      card_bg_color: '#FFFFFF',
      card_border_color: '#DFFA7D',
      text_primary_color: '#0A0A09',
      text_secondary_color: '#4F6629',
      primary_color: '#A2FA07',
      primary_text_color: '#0A0A09',
      accent_color: '#4F6629',
      accent_text_color: '#FFFFFF',
      hero_bg_color: '#0A0A09',
      hero_bg_end_color: '#4F6629',
      hero_text_color: '#FFFFFF',
      dark_section_bg_color: '#0A0A09',
      dark_card_bg_color: '#171C10',
      bottom_nav_bg_color: '#FFFFFF',
      badge_open_color: '#4F6629'
    }
  },
  {
    name: 'Shop da Cidade Clássico (Ouro & Grafite)',
    subtitle: 'Paleta original ouro vibrante e grafite escuro',
    swatches: ['#fdca04', '#0f172a', '#f59e0b', '#f8fafc', '#ffffff'],
    colors: {
      notice_bg_color: '#fdca04',
      notice_text_color: '#0f172a',
      topbar_bg_color: '#020617',
      secondary_color: '#0f172a',
      header_text_color: '#f8fafc',
      header_input_bg_color: '#1e293b',
      footer_bg_color: '#0f172a',
      footer_text_color: '#94a3b8',
      page_bg_color: '#f8fafc',
      card_bg_color: '#ffffff',
      card_border_color: '#e2e8f0',
      text_primary_color: '#0f172a',
      text_secondary_color: '#64748b',
      primary_color: '#fdca04',
      primary_text_color: '#0f172a',
      accent_color: '#f59e0b',
      accent_text_color: '#0f172a',
      hero_bg_color: '#0f172a',
      hero_bg_end_color: '#334155',
      hero_text_color: '#ffffff',
      dark_section_bg_color: '#0f172a',
      dark_card_bg_color: '#1e293b',
      bottom_nav_bg_color: '#ffffff',
      badge_open_color: '#059669'
    }
  },
  {
    name: 'Branco Clean Minimalista',
    subtitle: 'Visual claro estilo catálogo clean com cabeçalho branco e destaques azuis',
    swatches: ['#FFFFFF', '#0047F7', '#0F172A', '#F1F5F9', '#FA4802'],
    colors: {
      notice_bg_color: '#0047F7',
      notice_text_color: '#FFFFFF',
      topbar_bg_color: '#F1F5F9',
      secondary_color: '#FFFFFF',
      header_text_color: '#0F172A',
      header_input_bg_color: '#F1F5F9',
      footer_bg_color: '#0F172A',
      footer_text_color: '#CBD5E1',
      page_bg_color: '#F8FAFC',
      card_bg_color: '#FFFFFF',
      card_border_color: '#E2E8F0',
      text_primary_color: '#0F172A',
      text_secondary_color: '#64748B',
      primary_color: '#0047F7',
      primary_text_color: '#FFFFFF',
      accent_color: '#FA4802',
      accent_text_color: '#FFFFFF',
      hero_bg_color: '#0F172A',
      hero_bg_end_color: '#0047F7',
      hero_text_color: '#FFFFFF',
      dark_section_bg_color: '#0F172A',
      dark_card_bg_color: '#1E293B',
      bottom_nav_bg_color: '#FFFFFF',
      badge_open_color: '#059669'
    }
  },
  {
    name: 'Verde Esmeralda Carajás',
    subtitle: 'Tons naturais em esmeralda e verde floresta com fundo suave',
    swatches: ['#059669', '#064E3B', '#10B981', '#ECFDF5', '#FFFFFF'],
    colors: {
      notice_bg_color: '#059669',
      notice_text_color: '#FFFFFF',
      topbar_bg_color: '#022C22',
      secondary_color: '#064E3B',
      header_text_color: '#ECFDF5',
      header_input_bg_color: '#065F46',
      footer_bg_color: '#022C22',
      footer_text_color: '#A7F3D0',
      page_bg_color: '#F4FBF7',
      card_bg_color: '#FFFFFF',
      card_border_color: '#D1FAE5',
      text_primary_color: '#064E3B',
      text_secondary_color: '#047857',
      primary_color: '#059669',
      primary_text_color: '#FFFFFF',
      accent_color: '#D97706',
      accent_text_color: '#FFFFFF',
      hero_bg_color: '#022C22',
      hero_bg_end_color: '#059669',
      hero_text_color: '#FFFFFF',
      dark_section_bg_color: '#022C22',
      dark_card_bg_color: '#064E3B',
      bottom_nav_bg_color: '#FFFFFF',
      badge_open_color: '#10B981'
    }
  },
  {
    name: 'Laranja Solar Vibrante',
    subtitle: 'Energia comercial com laranja quente, marrom escuro e creme',
    swatches: ['#EA580C', '#431407', '#F97316', '#FFF7ED', '#FFFFFF'],
    colors: {
      notice_bg_color: '#EA580C',
      notice_text_color: '#FFFFFF',
      topbar_bg_color: '#2A0C03',
      secondary_color: '#431407',
      header_text_color: '#FFF7ED',
      header_input_bg_color: '#5C1E0B',
      footer_bg_color: '#2A0C03',
      footer_text_color: '#FED7AA',
      page_bg_color: '#FFFBF7',
      card_bg_color: '#FFFFFF',
      card_border_color: '#FED7AA',
      text_primary_color: '#2A0C03',
      text_secondary_color: '#9A3412',
      primary_color: '#EA580C',
      primary_text_color: '#FFFFFF',
      accent_color: '#F59E0B',
      accent_text_color: '#2A0C03',
      hero_bg_color: '#431407',
      hero_bg_end_color: '#EA580C',
      hero_text_color: '#FFFFFF',
      dark_section_bg_color: '#2A0C03',
      dark_card_bg_color: '#431407',
      bottom_nav_bg_color: '#FFFFFF',
      badge_open_color: '#16A34A'
    }
  },
  {
    name: 'Rubi Luxo & Black Friday',
    subtitle: 'Ideal para datas comemorativas, Dia das Mães, Natal ou liquidações',
    swatches: ['#E11D48', '#4C0519', '#FB7185', '#FFF1F2', '#FFFFFF'],
    colors: {
      notice_bg_color: '#E11D48',
      notice_text_color: '#FFFFFF',
      topbar_bg_color: '#2B020E',
      secondary_color: '#4C0519',
      header_text_color: '#FFF1F2',
      header_input_bg_color: '#690924',
      footer_bg_color: '#2B020E',
      footer_text_color: '#FECDD3',
      page_bg_color: '#FFF9FA',
      card_bg_color: '#FFFFFF',
      card_border_color: '#FFE4E6',
      text_primary_color: '#1F040C',
      text_secondary_color: '#881337',
      primary_color: '#E11D48',
      primary_text_color: '#FFFFFF',
      accent_color: '#F59E0B',
      accent_text_color: '#1F040C',
      hero_bg_color: '#4C0519',
      hero_bg_end_color: '#E11D48',
      hero_text_color: '#FFFFFF',
      dark_section_bg_color: '#2B020E',
      dark_card_bg_color: '#4C0519',
      bottom_nav_bg_color: '#FFFFFF',
      badge_open_color: '#059669'
    }
  }
];

const COLOR_CONTROL_GROUPS: Array<{
  title: string;
  description: string;
  fields: Array<{
    key: SiteColorKey;
    label: string;
    whereItChanges: string;
  }>;
}> = [
  {
    title: '1. Barra de Avisos do Topo',
    description: 'Faixa promocional ou informativa exibida acima do cabeçalho em todo o site.',
    fields: [
      {
        key: 'notice_bg_color',
        label: 'Fundo da Faixa de Aviso',
        whereItChanges: 'Onde muda: cor de fundo da barra de aviso lá no topo de todas as páginas.'
      },
      {
        key: 'notice_text_color',
        label: 'Texto da Faixa de Aviso',
        whereItChanges: 'Onde muda: cor da frase de boas-vindas ou promoção na faixa superior.'
      }
    ]
  },
  {
    title: '2. Cabeçalho, Menu & Rodapé',
    description: 'Estrutura de navegação superior (logo, barra de busca e abas) e rodapé inferior do site.',
    fields: [
      {
        key: 'topbar_bg_color',
        label: 'Sub-barra de Localização (Topo)',
        whereItChanges: 'Onde muda: faixa fina superior com a cidade ("Canaã dos Carajás - PA") e links de atendimento.'
      },
      {
        key: 'secondary_color',
        label: 'Fundo do Cabeçalho Principal',
        whereItChanges: 'Onde muda: fundo atrás da logo, da barra de pesquisa e dos botões Início/Lojas/Ofertas.'
      },
      {
        key: 'header_text_color',
        label: 'Textos & Ícones do Cabeçalho/Rodapé',
        whereItChanges: 'Onde muda: cor dos links do menu superior, ícones do topo e títulos principais do rodapé.'
      },
      {
        key: 'header_input_bg_color',
        label: 'Fundo da Barra de Busca & Botões do Topo',
        whereItChanges: 'Onde muda: fundo do campo de busca no cabeçalho e dos botões de Meus Pedidos / Carrinho.'
      },
      {
        key: 'footer_bg_color',
        label: 'Fundo do Rodapé',
        whereItChanges: 'Onde muda: cor de fundo de toda a área inferior (rodapé institucional e links).'
      },
      {
        key: 'footer_text_color',
        label: 'Textos & Links do Rodapé',
        whereItChanges: 'Onde muda: cor dos parágrafos, links e informações de contato no rodapé.'
      }
    ]
  },
  {
    title: '3. Fundo das Páginas, Cards & Textos',
    description: 'Aparência geral das telas (Início, Lojas, Ofertas, Serviços, Carrinho e Perfil da Loja).',
    fields: [
      {
        key: 'page_bg_color',
        label: 'Fundo Geral das Páginas',
        whereItChanges: 'Onde muda: cor de fundo principal por trás de todas as seções do site.'
      },
      {
        key: 'card_bg_color',
        label: 'Fundo dos Cards (Lojas, Produtos & Caixas)',
        whereItChanges: 'Onde muda: fundo dos cartões de lojas, produtos, categorias, carrinho e modais de login.'
      },
      {
        key: 'card_border_color',
        label: 'Bordas & Linhas Divisórias',
        whereItChanges: 'Onde muda: bordas de cards, caixas de busca, campos de texto e separadores de listas.'
      },
      {
        key: 'text_primary_color',
        label: 'Textos Principais & Títulos',
        whereItChanges: 'Onde muda: títulos das seções, nomes de lojas, nomes de produtos e textos principais.'
      },
      {
        key: 'text_secondary_color',
        label: 'Textos Secundários & Subtítulos',
        whereItChanges: 'Onde muda: descrições, categorias, contadores de vendas, avaliações e textos auxiliares.'
      }
    ]
  },
  {
    title: '4. Botões, Ofertas, Preços & Destaques',
    description: 'Cores de ação que chamam atenção para compras, promoções, seleções ativas e links principais.',
    fields: [
      {
        key: 'primary_color',
        label: 'Cor Principal (Botões & Abas Ativas)',
        whereItChanges: 'Onde muda: botão "Explorar Lojas", aba selecionada no menu, categorias ativas e detalhes principais.'
      },
      {
        key: 'primary_text_color',
        label: 'Texto sobre a Cor Principal',
        whereItChanges: 'Onde muda: cor das letras dentro dos botões e abas que usam a Cor Principal.'
      },
      {
        key: 'accent_color',
        label: 'Cor de Acento (Ofertas, Preços & Entrar)',
        whereItChanges: 'Onde muda: botão "Entrar", contador do carrinho, selos "Oficial"/desconto, preços em destaque e botões de compra.'
      },
      {
        key: 'accent_text_color',
        label: 'Texto sobre a Cor de Acento',
        whereItChanges: 'Onde muda: cor das letras dentro de selos de desconto, badge do carrinho e botões de acento.'
      }
    ]
  },
  {
    title: '5. Banner Principal (Hero) & Seções Escuras',
    description: 'Gradiente da vitrine principal na página inicial, capa das lojas e blocos escuros de serviços/resumo.',
    fields: [
      {
        key: 'hero_bg_color',
        label: 'Banner Principal — Cor Inicial do Gradiente',
        whereItChanges: 'Onde muda: cor de partida do banner grande da página inicial e fundo de capa das lojas.'
      },
      {
        key: 'hero_bg_end_color',
        label: 'Banner Principal — Cor Final do Gradiente',
        whereItChanges: 'Onde muda: segunda cor do degradê do banner principal na tela inicial.'
      },
      {
        key: 'hero_text_color',
        label: 'Textos do Banner Principal',
        whereItChanges: 'Onde muda: título grande e subtítulo dentro do banner da tela inicial e nome na capa da loja.'
      },
      {
        key: 'dark_section_bg_color',
        label: 'Fundo das Seções Escuras & Resumo do Carrinho',
        whereItChanges: 'Onde muda: fundo dos blocos de Serviços Locais/Patrocinadores na Home, resumo do Carrinho e sacola flutuante.'
      },
      {
        key: 'dark_card_bg_color',
        label: 'Fundo dos Cards dentro das Seções Escuras',
        whereItChanges: 'Onde muda: cartões de prestadores de serviços e patrocinadores sobre o fundo escuro.'
      }
    ]
  },
  {
    title: '6. Barra Mobile & Selos de Status',
    description: 'Navegação inferior no celular e indicadores de loja aberta/disponível.',
    fields: [
      {
        key: 'bottom_nav_bg_color',
        label: 'Fundo da Barra Inferior no Celular',
        whereItChanges: 'Onde muda: barra fixa no rodapé da tela em smartphones (Início, Lojas, Serviços, Carrinho, Conta).'
      },
      {
        key: 'badge_open_color',
        label: 'Selo "Loja Ativa" / Status Positivo',
        whereItChanges: 'Onde muda: etiqueta verde de "Loja Ativa" nos cards de lojas e indicadores de status positivo.'
      }
    ]
  }
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user, login, login2FA, logout } = useAuth();
  const { settings: globalSiteSettings, updateSettingsState, refreshSettings: refreshGlobalTheme } = useSiteTheme();
  const siteLogoInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingSiteLogo, setIsUploadingSiteLogo] = useState(false);

  // Admin Security & 2FA Gate State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminRequires2FA, setAdminRequires2FA] = useState(false);
  const [adminTemp2FAToken, setAdminTemp2FAToken] = useState<string | null>(null);
  const [admin2FACode, setAdmin2FACode] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [storesList, setStoresList] = useState<StoreType[]>([]);
  const [providersList, setProvidersList] = useState<ServiceProvider[]>([]);
  const [bannersList, setBannersList] = useState<PromotionalBanner[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'kpis' | 'settings' | 'asaas' | 'stores' | 'users' | 'providers' | 'banners' | 'logs'>('kpis');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);

  // Asaas Payment Integration state
  const [asaasApiKey, setAsaasApiKey] = useState('');
  const [asaasEnvironment, setAsaasEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [asaasWebhookToken, setAsaasWebhookToken] = useState('');
  const [asaasCommissionPercent, setAsaasCommissionPercent] = useState('8.0');
  const [isSavingAsaas, setIsSavingAsaas] = useState(false);
  const [asaasSaveMessage, setAsaasSaveMessage] = useState('');
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);

  // Service Commission Simulator (Óticas, Clínicas, Barbeiros, Manicures)
  const [simServiceAmount, setSimServiceAmount] = useState('350.00');
  const [simServiceCategory, setSimServiceCategory] = useState('Ótica & Exames de Vista');
  const [simulatingCommission, setSimulatingCommission] = useState(false);
  const [simulatedCommissionResult, setSimulatedCommissionResult] = useState<{
    serviceAmount: number;
    commissionPercent: number;
    platformCut: number;
    partnerCut: number;
    pixCode: string;
    pixQrCodeUrl?: string;
  } | null>(null);

  // Banner modal
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerLink, setBannerLink] = useState('/lojas');

  // 2FA Two-Factor Authentication state
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<{
    secret: string;
    otpauth_uri: string;
    qr_code_data_url: string;
    backup_codes: string[];
  } | null>(null);
  const [twoFactorVerifyCode, setTwoFactorVerifyCode] = useState('');
  const [isActivating2FA, setIsActivating2FA] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [twoFactorSuccess, setTwoFactorSuccess] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  const [isDisable2FAModalOpen, setIsDisable2FAModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [disable2FAError, setDisable2FAError] = useState<string | null>(null);

  // Vainabag test quote state
  const [vainabagTestResult, setVainabagTestResult] = useState<any>(null);
  const [isTestingVainabag, setIsTestingVainabag] = useState(false);

  const handleOpen2FASetup = async () => {
    setIs2FAModalOpen(true);
    setTwoFactorError(null);
    setTwoFactorSuccess(null);
    setTwoFactorVerifyCode('');
    try {
      const res = await apiRequest<{
        success: boolean;
        secret: string;
        otpauth_uri: string;
        qr_code_data_url: string;
        backup_codes: string[];
      }>('/api/auth/2fa/setup');
      setTwoFactorSetupData(res);
    } catch (err: any) {
      setTwoFactorError(err?.message || 'Falha ao carregar chave de 2FA.');
    }
  };

  const handleConfirm2FAActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorSetupData || !twoFactorVerifyCode.trim()) return;
    setIsActivating2FA(true);
    setTwoFactorError(null);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>('/api/auth/2fa/verify-activate', {
        method: 'POST',
        body: JSON.stringify({
          secret: twoFactorSetupData.secret,
          code: twoFactorVerifyCode.trim(),
          backup_codes: twoFactorSetupData.backup_codes
        })
      });
      setTwoFactorSuccess(res.message);
      setTimeout(() => {
        setIs2FAModalOpen(false);
        window.location.reload();
      }, 2500);
    } catch (err: any) {
      setTwoFactorError(err?.message || 'Código incorreto. Verifique o relógio do seu celular e tente novamente.');
    } finally {
      setIsActivating2FA(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) return;
    setIsDisabling2FA(true);
    setDisable2FAError(null);
    try {
      await apiRequest('/api/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ password: disablePassword })
      });
      setIsDisable2FAModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setDisable2FAError(err?.message || 'Senha incorreta.');
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const handleTestVainabagQuote = async () => {
    setIsTestingVainabag(true);
    setVainabagTestResult(null);
    try {
      const res = await apiRequest('/api/deliveries/vainabag/quote', {
        method: 'POST',
        body: JSON.stringify({ neighborhood: 'Centro', package_value: 80.0 })
      });
      setVainabagTestResult(res);
    } catch (err: any) {
      setVainabagTestResult({ error: err?.message || 'Falha na cotação da Vainabag' });
    } finally {
      setIsTestingVainabag(false);
    }
  };

  // Admin password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordChangeStatus({ success: false, message: 'A nova senha e a confirmação não coincidem.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordChangeStatus({ success: false, message: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }
    setIsChangingPassword(true);
    setPasswordChangeStatus(null);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      setPasswordChangeStatus({ success: true, message: res.message || 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordChangeStatus({ success: false, message: err?.message || 'Falha ao alterar senha. Verifique sua senha atual.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [metRes, usersRes, storesRes, provRes, bannersRes, setRes, logsRes] = await Promise.all([
        apiRequest<{ metrics: any }>('/api/admin/metrics'),
        apiRequest<{ users: User[] }>('/api/admin/users'),
        apiRequest<{ stores: StoreType[] }>('/api/admin/stores'),
        apiRequest<{ providers: ServiceProvider[] }>('/api/admin/providers'),
        apiRequest<{ banners: PromotionalBanner[] }>('/api/admin/banners'),
        apiRequest<{ settings: Record<string, string> }>('/api/admin/settings'),
        apiRequest<{ logs: AuditLog[] }>('/api/admin/audit-logs')
      ]);

      setMetrics(metRes.metrics);
      setUsersList(usersRes.users || []);
      setStoresList(storesRes.stores || []);
      setProvidersList(provRes.providers || []);
      setBannersList(bannersRes.banners || []);
      setSettings(setRes.settings || {});
      setAuditLogs(logsRes.logs || []);


      // Load Asaas configuration
      try {
        const asaasRes = await apiRequest<{
          isConfigured: boolean;
          environment: 'sandbox' | 'production';
          hasWebhookToken: boolean;
          defaultCommissionPercent: number;
          apiKeyMasked: string;
        }>('/api/payments/config');
        if (asaasRes) {
          setAsaasEnvironment(asaasRes.environment || 'sandbox');
          setAsaasCommissionPercent(String(asaasRes.defaultCommissionPercent || 8.0));
        }
      } catch {
        // Asaas config load error handled gracefully
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsaas = async () => {
    setIsSavingAsaas(true);
    setAsaasSaveMessage('');
    try {
      await apiRequest('/api/payments/config', {
        method: 'POST',
        body: JSON.stringify({
          apiKey: asaasApiKey,
          environment: asaasEnvironment,
          webhookToken: asaasWebhookToken,
          defaultCommissionPercent: parseFloat(asaasCommissionPercent) || 8.0
        })
      });
      setAsaasSaveMessage('Configurações do Asaas salvas com sucesso!');
      setTimeout(() => setAsaasSaveMessage(''), 4000);
    } catch (err: any) {
      alert(err?.message || 'Erro ao salvar configurações do Asaas.');
    } finally {
      setIsSavingAsaas(false);
    }
  };

  const handleSimulateServiceCommission = async () => {
    setSimulatingCommission(true);
    try {
      const amount = parseFloat(simServiceAmount) || 350;
      const pct = parseFloat(asaasCommissionPercent) || 8;
      const platformCut = Number(((amount * pct) / 100).toFixed(2));
      const partnerCut = Number((amount - platformCut).toFixed(2));

      const res = await apiRequest('/api/payments/service-commission', {
        method: 'POST',
        body: JSON.stringify({
          scheduleId: 'sim_' + Date.now(),
          finalServiceAmount: amount,
          notes: `Simulação de atendimento de ${simServiceCategory}`
        })
      }).catch(() => {
        const pixCode = `00020126580014br.gov.bcb.pix0136${Math.random().toString(36).substring(2, 14)}520400005303986540${platformCut.toFixed(2)}5802BR5915SHOP DA CIDADE6017CANAA DOS CARAJAS62070503***6304ABCD`;
        return {
          commissionAmount: platformCut,
          commissionPercent: pct,
          pixCode,
          pixQrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCode)}`
        };
      });

      setSimulatedCommissionResult({
        serviceAmount: amount,
        commissionPercent: pct,
        platformCut,
        partnerCut,
        pixCode: res?.pixCode || '',
        pixQrCodeUrl: res?.pixQrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(res?.pixCode || '')}`
      });
    } finally {
      setSimulatingCommission(false);
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setIsAdminLoggingIn(true);
    try {
      const result = await login(adminEmail.trim(), adminPassword);
      if (result && 'twoFactorRequired' in result && result.twoFactorRequired && result.tempToken) {
        setAdminRequires2FA(true);
        setAdminTemp2FAToken(result.tempToken);
      } else {
        // Logged in successfully, load admin data
        await loadAdminData();
      }
    } catch (err: any) {
      setAdminLoginError(err?.message || 'E-mail ou senha de administrador inválidos.');
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  const handleAdmin2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTemp2FAToken || !admin2FACode.trim()) return;
    setAdminLoginError(null);
    setIsAdminLoggingIn(true);
    try {
      await login2FA(adminTemp2FAToken, admin2FACode.trim());
      await loadAdminData();
    } catch (err: any) {
      setAdminLoginError(err?.message || 'Código de 2FA incorreto ou expirado. Tente novamente.');
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      loadAdminData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleUpdateUser = async (userId: string, role: string, is_active: number) => {
    try {
      await apiRequest(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role, is_active })
      });
      await loadAdminData();
    } catch (err: any) {
      alert(err?.message || 'Falha ao atualizar usuário.');
    }
  };

  const handleUpdateStore = async (storeId: string, status?: string, is_featured?: number, category?: string) => {
    try {
      const payload: any = {};
      if (status !== undefined) payload.status = status;
      if (is_featured !== undefined) payload.is_featured = is_featured;
      if (category !== undefined) payload.category = category;

      await apiRequest(`/api/admin/stores/${storeId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      await loadAdminData();
    } catch (err: any) {
      alert(err?.message || 'Falha ao atualizar loja.');
    }
  };

  const handleUpdateProvider = async (providerId: string, is_approved: number, is_featured: number) => {
    try {
      await apiRequest(`/api/admin/providers/${providerId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_approved, is_featured })
      });
      await loadAdminData();
    } catch (err: any) {
      alert(err?.message || 'Falha ao atualizar prestador.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSaveSuccess(false);
    try {
      await apiRequest('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
      updateSettingsState(settings as any);
      await refreshGlobalTheme();
      setSettingsSaveSuccess(true);
      setTimeout(() => setSettingsSaveSuccess(false), 3000);
      await loadAdminData();
    } catch (err: any) {
      alert(err?.message || 'Falha ao salvar configurações.');
    } finally {
      setIsSavingSettings(false);
    }
  };





  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/banners', {
        method: 'POST',
        body: JSON.stringify({
          title: bannerTitle,
          subtitle: bannerSubtitle,
          image_url: bannerImage,
          link_url: bannerLink
        })
      });
      setIsBannerModalOpen(false);
      setBannerTitle('');
      setBannerSubtitle('');
      setBannerImage('');
      await loadAdminData();
    } catch (err: any) {
      alert(err?.message || 'Falha ao criar banner.');
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('Deseja excluir este banner promocional?')) return;
    try {
      await apiRequest(`/api/admin/banners/${bannerId}`, { method: 'DELETE' });
      await loadAdminData();
    } catch (err: any) {
      alert(err?.message || 'Falha ao excluir banner.');
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Verificando Credenciais do Administrador...</span>
      </div>
    );
  }

  // 1. Guard: User is logged in, but lacks administrative privileges
  if (user && user.role !== 'admin' && user.role !== 'superadmin') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-black uppercase tracking-wider">
              Acesso Negado
            </span>
            <h2 className="text-xl font-black text-white mt-3">Permissão Insuficiente</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Você está conectado como <strong className="text-white">{user.name}</strong> ({user.email}), nível <span className="text-amber-400 font-bold uppercase">{user.role}</span>.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Esta rota é estritamente confidencial e reservada a Administradores do Shop da Cidade.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={async () => {
                await logout();
              }}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-md"
            >
              Sair e Entrar como Administrador
            </button>

            <button
              onClick={() => onNavigate('home')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              Voltar para a Página Inicial
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Guard: No user is logged in — display high-security Administrative Login & 2FA Gate
  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-white">
          {/* Logo & Security Badge */}
          <div className="text-center space-y-3">
            <img
              src={globalSiteSettings.site_logo_url || '/shop-da-cidade-logo-transparente.png'}
              alt={globalSiteSettings.platform_name || 'Shop da Cidade'}
              className="h-12 w-auto max-w-[210px] mx-auto object-contain drop-shadow"
            />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-black uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              Acesso Administrativo Restrito
            </div>
            <h2 className="text-lg font-black text-white">
              {adminRequires2FA ? 'Verificação em Duas Etapas (2FA)' : 'Identificação do Administrador'}
            </h2>
            <p className="text-xs text-slate-400">
              {adminRequires2FA
                ? 'Digite o código de 6 dígitos gerado no Google Authenticator ou código de backup.'
                : 'Insira suas credenciais corporativas autorizadas para entrar no painel central.'}
            </p>
          </div>

          {/* Error Alert */}
          {adminLoginError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{adminLoginError}</span>
            </div>
          )}

          {/* Step 1: Email + Password */}
          {!adminRequires2FA ? (
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  E-mail do Administrador
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="admin@shopcarajas.com.br"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Senha de Acesso
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAdminLoggingIn}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAdminLoggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verificando Acesso...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Autenticar no Painel</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: 2FA TOTP Code */
            <form onSubmit={handleAdmin2FASubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  Código de Autenticação 2FA (TOTP)
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={10}
                  value={admin2FACode}
                  onChange={e => setAdmin2FACode(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  placeholder="000 000"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center text-xl font-mono tracking-widest text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <button
                type="submit"
                disabled={isAdminLoggingIn || !admin2FACode.trim()}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAdminLoggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Validando 2FA...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Validar 2FA & Acessar Painel</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdminRequires2FA(false);
                  setAdminTemp2FAToken(null);
                  setAdmin2FACode('');
                  setAdminLoginError(null);
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                ← Voltar para E-mail e Senha
              </button>
            </form>
          )}

          {/* Back to store */}
          <div className="pt-2 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o Shop da Cidade
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={() => onNavigate('home')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 cursor-pointer transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Início
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-amber-500" />
              Painel do Super Administrador
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
              Shop da Cidade
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Gestão Central de Lojas, Prestadores, Usuários, Taxas e Visual do Marketplace</p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/admin/export-csv"
            download
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </a>
          <button
            onClick={async () => {
              await logout();
              onNavigate('home');
            }}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Encerrar sessão e deslogar do painel"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 text-xs font-bold text-slate-600 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('kpis')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'kpis' ? 'border-amber-500 text-slate-950 font-black' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-amber-500" />
          Indicadores
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'settings' ? 'border-amber-500 text-slate-950 font-black' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Palette className="w-4 h-4 text-amber-500" />
          Personalização & Cores do Site
        </button>



        <button
          onClick={() => setActiveTab('asaas')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'asaas' ? 'border-amber-500 text-slate-950 font-black' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-600" />
          Pagamentos Asaas (Pix & Cartão)
        </button>

        <button
          onClick={() => setActiveTab('stores')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'stores' ? 'border-amber-500 text-slate-950 font-black' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4 text-amber-500" />
          Lojas ({storesList.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'users' ? 'border-amber-500 text-slate-950 font-black' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-amber-500" />
          Usuários ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'providers' ? 'border-amber-500 text-slate-950 font-black' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-500" />
          Prestadores ({providersList.length})
        </button>

        <button
          onClick={() => setActiveTab('banners')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'banners' ? 'border-amber-500 text-slate-950 font-black' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-500" />
          Banners da Home
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'logs' ? 'border-amber-500 text-slate-950 font-black' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <FileCode className="w-4 h-4 text-amber-500" />
          Auditoria
        </button>
      </div>

      {/* TAB: KPIS */}
      {activeTab === 'kpis' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Faturamento Total</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{formatBRL(metrics?.gmv || 0)}</span>
            </div>
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Comissão da Plataforma</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">{formatBRL(metrics?.totalCommissionEarned || 0)}</span>
            </div>
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lojas Ativas</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics?.activeStores || 0}</span>
            </div>
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Usuários Cadastrados</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics?.totalUsers || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SETTINGS & VISUAL IDENTITY (Super Admin Main Site Customizer) */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-3xl text-xs animate-in fade-in duration-200">
          <form onSubmit={handleSaveSettings} className="space-y-6">
          {settingsSaveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Cores e configurações do site principal salvas com sucesso! O visual foi atualizado.</span>
            </div>
          )}

          {/* Site Logo Panel (Seasonal Campaigns & Visual Updates) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#0047F7]" />
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Logotipo Oficial do Site</h3>
                  <p className="text-xs text-slate-500">
                    Altere a logo exibida no cabeçalho, rodapé e telas de login para datas comemorativas (Natal, Black Friday, Aniversário da Cidade) ou atualizações de marca.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const defaultLogo = '/shop-da-cidade-logo-transparente.png';
                  setSettings(prev => ({ ...prev, site_logo_url: defaultLogo }));
                  updateSettingsState({ site_logo_url: defaultLogo });
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1.5 transition cursor-pointer shrink-0 self-start sm:self-center"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restaurar Padrão
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Current Logo Preview Box */}
              <div
                style={{ backgroundColor: settings['secondary_color'] || '#071536' }}
                className="sm:col-span-4 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center min-h-[104px] gap-2"
              >
                <img
                  src={settings['site_logo_url'] || '/shop-da-cidade-logo-transparente.png'}
                  alt="Preview da Logo do Site"
                  className="max-h-14 w-auto max-w-full object-contain drop-shadow"
                />
                <span className="text-[10px] text-slate-300 font-medium">Prévia em fundo escuro</span>
              </div>

              {/* Upload & URL Controls */}
              <div className="sm:col-span-8 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={siteLogoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploadingSiteLogo(true);
                      try {
                        const dataUrl = await new Promise<string>((resolve, reject) => {
                          const reader = new FileReader();
                          reader.onerror = reject;
                          reader.onload = ev => {
                            const raw = ev.target?.result as string;
                            if (file.type === 'image/svg+xml') {
                              resolve(raw);
                              return;
                            }
                            const img = new window.Image();
                            img.onerror = reject;
                            img.onload = () => {
                              const maxW = 640;
                              const maxH = 240;
                              let w = img.width;
                              let h = img.height;
                              if (w > maxW || h > maxH) {
                                const ratio = Math.min(maxW / w, maxH / h);
                                w = Math.round(w * ratio);
                                h = Math.round(h * ratio);
                              }
                              const canvas = document.createElement('canvas');
                              canvas.width = w;
                              canvas.height = h;
                              const ctx = canvas.getContext('2d');
                              if (!ctx) {
                                resolve(raw);
                                return;
                              }
                              ctx.drawImage(img, 0, 0, w, h);
                              // Preserve transparent background for PNG/WebP logos
                              const mime = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
                              resolve(canvas.toDataURL(mime, 0.92));
                            };
                            img.src = raw;
                          };
                          reader.readAsDataURL(file);
                        });
                        setSettings(prev => ({ ...prev, site_logo_url: dataUrl }));
                        updateSettingsState({ site_logo_url: dataUrl });
                      } catch {
                        alert('Não foi possível processar a imagem selecionada.');
                      } finally {
                        setIsUploadingSiteLogo(false);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={isUploadingSiteLogo}
                    onClick={() => siteLogoInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-[#0047F7] hover:bg-[#0038c7] text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isUploadingSiteLogo ? 'Processando...' : 'Enviar Nova Logo (PNG/SVG/JPG)'}
                  </button>
                  <span className="text-[11px] text-slate-400">
                    Recomendado: PNG com fundo transparente (ex: 400x120px).
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ou informe a URL / Caminho da Logo</label>
                  <input
                    type="text"
                    value={settings['site_logo_url'] || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setSettings(prev => ({ ...prev, site_logo_url: val }));
                      updateSettingsState({ site_logo_url: val || '/shop-da-cidade-logo-transparente.png' });
                    }}
                    placeholder="/shop-da-cidade-logo-transparente.png ou https://..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Site Colors & Palette Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Palette className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Identidade Visual & Todas as Cores do Site ({Object.keys(DEFAULT_SITE_COLORS).length} Pontos Editáveis)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Personalize exatamente cada área do marketplace em tempo real. Cada campo abaixo explica exatamente o que será alterado antes de você salvar.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const defaults = { ...DEFAULT_SITE_COLORS };
                  setSettings(prev => ({ ...prev, ...defaults }));
                  updateSettingsState(defaults);
                }}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restaurar Cores Padrão
              </button>
            </div>

            {/* Curated Full-Site Theme Presets */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Paletas Prontas Completas (Aplicam todas as 24 cores de uma vez)</label>
              <p className="text-[11px] text-slate-500 mb-2.5">
                Escolha uma paleta pronta como ponto de partida e depois ajuste individualmente qualquer cor abaixo se quiser.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {THEME_PRESETS.map(t => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        ...t.colors
                      }));
                      updateSettingsState(t.colors);
                    }}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-slate-400 text-left flex items-center gap-3 transition cursor-pointer bg-slate-50 hover:bg-white"
                  >
                    <div className="flex -space-x-1.5 shrink-0">
                      {t.swatches.map((hex, idx) => (
                        <span
                          key={`${t.name}-${idx}`}
                          style={{ backgroundColor: hex }}
                          className="w-5 h-5 rounded-full border-2 border-slate-200 shadow-xs"
                        />
                      ))}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">{t.name}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{t.subtitle}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 6 Grouped Granular Color Pickers */}
            <div className="space-y-5 pt-1">
              {COLOR_CONTROL_GROUPS.map(group => (
                <div key={group.title} className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                  <div className="border-b border-slate-200/80 pb-2.5">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900">{group.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{group.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {group.fields.map(field => {
                      const currentVal = settings[field.key] || DEFAULT_SITE_COLORS[field.key];
                      const safePickerHex = /^#[0-9a-fA-F]{6}$/.test(currentVal)
                        ? currentVal
                        : DEFAULT_SITE_COLORS[field.key];

                      const handleColorChange = (val: string) => {
                        setSettings(prev => ({ ...prev, [field.key]: val }));
                        updateSettingsState({ [field.key]: val });
                      };

                      return (
                        <div
                          key={field.key}
                          className="p-3 rounded-xl bg-white border border-slate-200/90 flex flex-col justify-between gap-2.5"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <label className="font-bold text-xs text-slate-900">{field.label}</label>
                              <span className="text-[10px] font-mono text-slate-400">
                                Padrão: {DEFAULT_SITE_COLORS[field.key]}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-snug mt-1">
                              {field.whereItChanges}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 pt-0.5">
                            <input
                              type="color"
                              value={safePickerHex}
                              onChange={e => handleColorChange(e.target.value.toUpperCase())}
                              aria-label={field.label}
                              className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 shrink-0 bg-white"
                            />
                            <input
                              type="text"
                              value={currentVal}
                              onChange={e => handleColorChange(e.target.value)}
                              placeholder={DEFAULT_SITE_COLORS[field.key]}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs uppercase focus:bg-white focus:outline-none focus:border-slate-400"
                            />
                            {currentVal.toUpperCase() !== DEFAULT_SITE_COLORS[field.key].toUpperCase() && (
                              <button
                                type="button"
                                onClick={() => handleColorChange(DEFAULT_SITE_COLORS[field.key])}
                                title={`Voltar para ${DEFAULT_SITE_COLORS[field.key]}`}
                                className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 shrink-0 cursor-pointer"
                              >
                                Padrão
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Complete Live Theme Preview */}
            <div className="pt-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                Pré-visualização em Tempo Real (Topo, Banner, Card, Botões e Rodapé):
              </span>
              <div
                style={{
                  borderColor: settings['card_border_color'] || DEFAULT_SITE_COLORS.card_border_color,
                  backgroundColor: settings['page_bg_color'] || DEFAULT_SITE_COLORS.page_bg_color
                }}
                className="rounded-2xl overflow-hidden border shadow-md"
              >
                {/* Notice Bar */}
                <div
                  style={{
                    backgroundColor: settings['notice_bg_color'] || DEFAULT_SITE_COLORS.notice_bg_color,
                    color: settings['notice_text_color'] || DEFAULT_SITE_COLORS.notice_text_color
                  }}
                  className="px-4 py-1.5 text-[11px] font-bold text-center truncate"
                >
                  {settings['banner_notice'] || 'Aviso no topo do site para os moradores de Canaã dos Carajás.'}
                </div>

                {/* Topbar */}
                <div
                  style={{
                    backgroundColor: settings['topbar_bg_color'] || DEFAULT_SITE_COLORS.topbar_bg_color,
                    color: settings['header_text_color'] || DEFAULT_SITE_COLORS.header_text_color
                  }}
                  className="px-4 py-1 text-[10px] flex items-center justify-between opacity-90"
                >
                  <span>{settings['city_name'] || 'Canaã dos Carajás'}, {settings['city_state'] || 'PA'}</span>
                  <span>Central de Atendimento</span>
                </div>

                {/* Main Header */}
                <div
                  style={{
                    backgroundColor: settings['secondary_color'] || DEFAULT_SITE_COLORS.secondary_color,
                    color: settings['header_text_color'] || DEFAULT_SITE_COLORS.header_text_color
                  }}
                  className="px-4 py-3 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={settings['site_logo_url'] || '/shop-da-cidade-logo-transparente.png'}
                      alt={settings['platform_name'] || 'Shop da Cidade'}
                      className="h-7 w-auto max-w-[120px] object-contain"
                    />
                    <span className="text-xs font-black">{settings['platform_name'] || 'Shop da Cidade'}</span>
                  </div>
                  <div
                    style={{
                      backgroundColor: settings['header_input_bg_color'] || DEFAULT_SITE_COLORS.header_input_bg_color,
                      color: settings['header_text_color'] || DEFAULT_SITE_COLORS.header_text_color
                    }}
                    className="px-3 py-1 rounded-lg text-[10px] opacity-85 border border-white/10"
                  >
                    Buscar produtos, lojas...
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{
                        backgroundColor: settings['primary_color'] || DEFAULT_SITE_COLORS.primary_color,
                        color: settings['primary_text_color'] || DEFAULT_SITE_COLORS.primary_text_color
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-black"
                    >
                      Início
                    </span>
                    <span
                      style={{
                        backgroundColor: settings['accent_color'] || DEFAULT_SITE_COLORS.accent_color,
                        color: settings['accent_text_color'] || DEFAULT_SITE_COLORS.accent_text_color
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-black"
                    >
                      Entrar
                    </span>
                  </div>
                </div>

                {/* Mini Hero + Sample Card */}
                <div className="p-4 space-y-3">
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${settings['hero_bg_color'] || DEFAULT_SITE_COLORS.hero_bg_color}, ${settings['hero_bg_end_color'] || DEFAULT_SITE_COLORS.hero_bg_end_color})`,
                      color: settings['hero_text_color'] || DEFAULT_SITE_COLORS.hero_text_color
                    }}
                    className="p-3.5 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-xs font-black block">Banner Principal do Marketplace</span>
                      <span className="text-[10px] opacity-80">Gradiente e textos da vitrine inicial</span>
                    </div>
                    <span
                      style={{
                        backgroundColor: settings['primary_color'] || DEFAULT_SITE_COLORS.primary_color,
                        color: settings['primary_text_color'] || DEFAULT_SITE_COLORS.primary_text_color
                      }}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-black shrink-0"
                    >
                      Explorar Lojas
                    </span>
                  </div>

                  <div
                    style={{
                      backgroundColor: settings['card_bg_color'] || DEFAULT_SITE_COLORS.card_bg_color,
                      borderColor: settings['card_border_color'] || DEFAULT_SITE_COLORS.card_border_color
                    }}
                    className="p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          style={{ backgroundColor: settings['badge_open_color'] || DEFAULT_SITE_COLORS.badge_open_color }}
                          className="px-2 py-0.5 rounded text-[9px] font-black text-white uppercase"
                        >
                          Loja Ativa
                        </span>
                        <span
                          style={{
                            backgroundColor: settings['accent_color'] || DEFAULT_SITE_COLORS.accent_color,
                            color: settings['accent_text_color'] || DEFAULT_SITE_COLORS.accent_text_color
                          }}
                          className="px-2 py-0.5 rounded text-[9px] font-black uppercase"
                        >
                          Oficial • -20%
                        </span>
                      </div>
                      <p
                        style={{ color: settings['text_primary_color'] || DEFAULT_SITE_COLORS.text_primary_color }}
                        className="text-xs font-black"
                      >
                        Título de Loja ou Produto de Exemplo
                      </p>
                      <p
                        style={{ color: settings['text_secondary_color'] || DEFAULT_SITE_COLORS.text_secondary_color }}
                        className="text-[10px]"
                      >
                        Texto secundário com descrição, avaliação e bairro.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        style={{ color: settings['accent_color'] || DEFAULT_SITE_COLORS.accent_color }}
                        className="text-sm font-black"
                      >
                        R$ 89,90
                      </span>
                      <span
                        style={{
                          backgroundColor: settings['primary_color'] || DEFAULT_SITE_COLORS.primary_color,
                          color: settings['primary_text_color'] || DEFAULT_SITE_COLORS.primary_text_color
                        }}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-black"
                      >
                        Comprar
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mini Footer */}
                <div
                  style={{
                    backgroundColor: settings['footer_bg_color'] || DEFAULT_SITE_COLORS.footer_bg_color,
                    color: settings['footer_text_color'] || DEFAULT_SITE_COLORS.footer_text_color
                  }}
                  className="px-4 py-2.5 flex items-center justify-between text-[10px]"
                >
                  <span
                    style={{ color: settings['header_text_color'] || DEFAULT_SITE_COLORS.header_text_color }}
                    className="font-bold"
                  >
                    {settings['platform_name'] || 'Shop da Cidade'}
                  </span>
                  <span>Rodapé oficial da plataforma</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Platform Info & Contacts */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 tracking-tight">Textos e Informações Oficiais da Plataforma</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Oficial da Plataforma</label>
                <input
                  type="text"
                  value={settings['platform_name'] || 'Shop da Cidade'}
                  onChange={e => setSettings({ ...settings, platform_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Slogan / Tagline do Site</label>
                <input
                  type="text"
                  value={settings['site_tagline'] || 'O Shopping Virtual da Sua Cidade'}
                  onChange={e => setSettings({ ...settings, site_tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cidade Sede</label>
                <input
                  type="text"
                  value={settings['city_name'] || 'Canaã dos Carajás'}
                  onChange={e => setSettings({ ...settings, city_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Estado (UF)</label>
                <input
                  type="text"
                  value={settings['city_state'] || 'PA'}
                  onChange={e => setSettings({ ...settings, city_state: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp Oficial de Suporte</label>
                <input
                  type="text"
                  value={settings['official_whatsapp'] || '(94) 99123-4567'}
                  onChange={e => setSettings({ ...settings, official_whatsapp: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">E-mail de Atendimento</label>
                <input
                  type="email"
                  value={settings['official_email'] || 'atendimento@shopdacidade.com.br'}
                  onChange={e => setSettings({ ...settings, official_email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Aviso Superior da Página Inicial</label>
              <textarea
                rows={2}
                value={settings['banner_notice'] || ''}
                onChange={e => setSettings({ ...settings, banner_notice: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Section: PIX & Commission Parameters */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 tracking-tight">Financeiro, PIX e Taxas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chave PIX da Plataforma</label>
                <input
                  type="text"
                  value={settings['pix_key'] || ''}
                  onChange={e => setSettings({ ...settings, pix_key: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Beneficiário PIX</label>
                <input
                  type="text"
                  value={settings['pix_beneficiary'] || ''}
                  onChange={e => setSettings({ ...settings, pix_beneficiary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Comissão Padrão Global (%)</label>
              <input
                type="number"
                step="0.1"
                value={settings['default_commission_rate'] || '8.0'}
                onChange={e => setSettings({ ...settings, default_commission_rate: e.target.value })}
                className="w-full max-w-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>

          {/* Section: Platform Security & Production Mode */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Segurança da Plataforma & Modo Demonstração</h3>
                <p className="text-xs text-slate-500">
                  Controle se o atalho de alternar perfis sem senha fica disponível ou se a plataforma entra em modo 100% produção seguro.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <label className="block font-bold text-slate-800">Status do Modo de Demonstração (Troca rápida sem senha)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, demo_mode_enabled: '1' })}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                    settings['demo_mode_enabled'] !== '0'
                      ? 'border-amber-500 bg-amber-50 text-slate-900 ring-2 ring-amber-400'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="font-black text-xs text-amber-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Ativado (Ambiente de Testes / Protótipo)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Barra superior de troca rápida visível para facilitar navegação entre telas.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, demo_mode_enabled: '0' })}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                    settings['demo_mode_enabled'] === '0'
                      ? 'border-emerald-600 bg-emerald-50 text-slate-900 ring-2 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="font-black text-xs text-emerald-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Desativado (Modo Produção Seguro)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Oculta a barra de atalhos e bloqueia qualquer login sem senha na API.
                  </span>
                </button>
              </div>

              {settings['demo_mode_enabled'] === '0' ? (
                <p className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/60 p-2.5 rounded-xl border border-emerald-200">
                  🔒 <strong>Modo Seguro Ativo:</strong> Todos os visitantes e clientes são obrigados a digitar e-mail e senha cadastrados para entrar na plataforma.
                </p>
              ) : (
                <p className="text-[11px] text-amber-700 font-semibold bg-amber-100/60 p-2.5 rounded-xl border border-amber-200">
                  ⚠️ <strong>Atenção:</strong> O Modo de Demonstração está ativo. Ao lançar para o público de Canaã dos Carajás, clique em <strong>Desativado (Modo Produção Seguro)</strong> e salve as alterações.
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingSettings}
            className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSavingSettings ? 'Salvando...' : 'Salvar Cores e Configurações do Site'}
          </button>
        </form>

        {/* Change Admin Password Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 max-w-3xl mt-6">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-700" />
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Alterar Minha Senha de Administrador</h3>
              <p className="text-xs text-slate-500">
                Altere a senha da sua conta de Super Admin ({user?.email}) para garantir a segurança da plataforma.
              </p>
            </div>
          </div>

          {passwordChangeStatus && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              passwordChangeStatus.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {passwordChangeStatus.success ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{passwordChangeStatus.message}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3 text-xs max-w-md">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Senha Atual (Padrão inicial: 123456)</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nova Senha (Mínimo 6 caracteres)</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha segura"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Confirmar Nova Senha</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              {isChangingPassword ? 'Atualizando...' : 'Atualizar Minha Senha'}
            </button>
          </form>
        </div>

        {/* 2FA Security Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 max-w-3xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Autenticação em Dois Fatores (2FA / Google Authenticator)
                  {user?.two_factor_enabled ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                      Ativo & Protegido
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                      Recomendado Ativar
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proteja a conta de Super Administrador contra acessos indevidos exigindo um código de 6 dígitos gerado em aplicativo móvel (Google Authenticator, Authy ou Microsoft Authenticator) a cada login.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <p>
              <strong>Como funciona:</strong> Ao ativar, você aponta a câmera do seu celular para escanear o QR Code no Google Authenticator. Mesmo se alguém descobrir sua senha, não conseguirá entrar sem o código dinâmico gerado no seu celular.
            </p>
            {user?.two_factor_enabled ? (
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setDisablePassword(''); setDisable2FAError(null); setIsDisable2FAModalOpen(true); }}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition cursor-pointer"
                >
                  Desativar 2FA (Requer Senha)
                </button>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  ✓ Sua conta está protegida com TOTP RFC 6238 e códigos reserva.
                </span>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpen2FASetup}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 transition cursor-pointer shadow-sm"
                >
                  <KeyRound className="w-4 h-4" />
                  Configurar 2FA com Aplicativo Authenticator
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Vainabag Delivery Integration Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 max-w-3xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-sky-50 text-sky-600">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Integração de Entregas Vainabag
                  {settings['vainabag_client_id'] ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 text-[10px] font-black uppercase tracking-wider">
                      {settings['vainabag_env'] === 'production' ? 'Produção' : 'Ambiente Sandbox'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider">
                      Não Configurado
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conecte a API de Entregas da <strong>Vainabag</strong> para cotação automática de taxas por bairro e solicitação direta de entregadores parceiros.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Client ID (Vainabag)</label>
                <input
                  type="text"
                  value={settings['vainabag_client_id'] || ''}
                  onChange={e => setSettings({ ...settings, vainabag_client_id: e.target.value })}
                  placeholder="eak_... ou epk_..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Secret (Vainabag)</label>
                <input
                  type="password"
                  value={settings['vainabag_client_secret'] || ''}
                  onChange={e => setSettings({ ...settings, vainabag_client_secret: e.target.value })}
                  placeholder="eas_... ou eps_..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Código da Loja Vainabag (X-Vainabag-Store)</label>
                <input
                  type="text"
                  value={settings['vainabag_store_code'] || ''}
                  onChange={e => setSettings({ ...settings, vainabag_store_code: e.target.value })}
                  placeholder="vb_..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
                <span className="text-[10px] text-slate-400">Opcional para credencial individual ou obrigatório se credencial de parceiro (epk_).</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ambiente da API</label>
                <select
                  value={settings['vainabag_env'] || 'sandbox'}
                  onChange={e => setSettings({ ...settings, vainabag_env: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white cursor-pointer"
                >
                  <option value="sandbox">Ambiente Sandbox / Testes (Não chama entregador real)</option>
                  <option value="production">Produção Real (Corridas reais)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition cursor-pointer shadow-sm"
              >
                Salvar Configurações Vainabag
              </button>

              <button
                type="button"
                disabled={isTestingVainabag}
                onClick={handleTestVainabagQuote}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {isTestingVainabag ? 'Consultando...' : 'Testar Cotação de Taxa (Centro - Canaã)'}
              </button>
            </div>

            {vainabagTestResult && (
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-medium">
                {vainabagTestResult.error ? (
                  <span className="text-rose-600 font-bold">Erro: {vainabagTestResult.error}</span>
                ) : (
                  <div>
                    <span className="font-bold text-sky-950">✓ Cotação simulada com sucesso:</span>
                    <span className="ml-2 font-mono">Taxa: {formatBRL(vainabagTestResult.fee)} | Prazo estimado: {vainabagTestResult.estimatedMinutes}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )}






      {activeTab === 'asaas' && (
        <div className="space-y-6 max-w-4xl text-xs animate-in fade-in duration-200">
          {/* Main Status & Configuration Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                  Gateway de Pagamento • Pix Dinâmico & Cartão
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Integração Asaas & Gestão de Comissões
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Conecte sua conta do <strong>Asaas</strong> para receber via Pix instantâneo, Cartão de Crédito e automatizar a cobrança e divisão (split) de comissões de lojas e serviços presenciais (como óticas, clínicas, barbeiros e manicures).
                </p>
              </div>

              <div className="shrink-0 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-slate-900 text-center font-bold text-[11px] min-w-[150px]">
                <CreditCard className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                <span className="block font-black text-emerald-900">
                  {asaasApiKey ? 'Asaas Ativo' : 'Aguardando Configuração'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {asaasApiKey ? (asaasEnvironment === 'production' ? 'Produção Real' : 'Ambiente Sandbox') : 'Insira a chave da API'}
                </span>
              </div>
            </div>

            {/* Quick Overview Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Método Principal</span>
                <strong className="text-xs text-slate-900 block mt-0.5 font-black truncate">Pix QR Code Dinâmico</strong>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Tempo de Confirmação</span>
                <strong className="text-xs text-emerald-600 block mt-0.5 font-black">1 a 3 segundos (Webhook)</strong>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Divisão de Pagamento</span>
                <strong className="text-xs text-slate-900 block mt-0.5 font-black">Split Nativo Asaas</strong>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Taxa Padrão Plataforma</span>
                <strong className="text-xs text-amber-600 block mt-0.5 font-black">{asaasCommissionPercent}% por venda/serviço</strong>
              </div>
            </div>

            {/* Credentials Form */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                Credenciais da API do Asaas
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Chave de API (Access Token) *
                  </label>
                  <input
                    type="password"
                    value={asaasApiKey}
                    onChange={e => setAsaasApiKey(e.target.value)}
                    placeholder="$aact_YTU5YTE0M2M6N2I4MT..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Gerada em: <strong>Configurações da Conta &gt; Integrações &gt; Chaves de API</strong> no Asaas.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ambiente do Asaas
                  </label>
                  <select
                    value={asaasEnvironment}
                    onChange={e => setAsaasEnvironment(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:bg-white focus:border-emerald-500"
                  >
                    <option value="sandbox">Sandbox (Ambiente de Testes - Sem dinheiro real)</option>
                    <option value="production">Produção (Ambiente Oficial de Pagamentos)</option>
                  </select>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Use Sandbox para validar todo o fluxo e depois mude para Produção.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Token Secreto do Webhook (Opcional)
                  </label>
                  <input
                    type="text"
                    value={asaasWebhookToken}
                    onChange={e => setAsaasWebhookToken(e.target.value)}
                    placeholder="ex: secret_token_asaas_shop"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Usado para autenticar as notificações de pagamento enviadas pelo Asaas.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Comissão Padrão da Plataforma (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={asaasCommissionPercent}
                    onChange={e => setAsaasCommissionPercent(e.target.value)}
                    placeholder="8.0"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:bg-white focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Porcentagem retida pelo Shop da Cidade em cada venda de produto ou serviço.
                  </span>
                </div>
              </div>

              {/* Webhook Endpoint Box */}
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 space-y-2 font-mono text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-bold text-emerald-400 text-xs">URL do Webhook para cadastrar no Asaas:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const fullUrl = `${window.location.origin}/api/payments/webhook`;
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(fullUrl);
                        setCopiedWebhookUrl(true);
                        setTimeout(() => setCopiedWebhookUrl(false), 2500);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {copiedWebhookUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWebhookUrl ? 'URL Copiada!' : 'Copiar URL do Webhook'}</span>
                  </button>
                </div>
                <p className="text-slate-300 select-all break-all">{window.location.origin}/api/payments/webhook</p>
                <span className="text-[10px] text-slate-400 block pt-1 font-sans">
                  No painel do Asaas, vá em <strong>Configurações &gt; Integrações &gt; Webhooks para Cobranças</strong>, cole esta URL e ative os eventos: <strong>PAYMENT_RECEIVED</strong> e <strong>PAYMENT_CONFIRMED</strong>.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSaveAsaas}
                  disabled={isSavingAsaas}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingAsaas ? 'Salvando...' : 'Salvar Configurações do Asaas'}</span>
                </button>

                {asaasSaveMessage && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> {asaasSaveMessage}
                  </span>
                )}
              </div>
            </div>

            {/* SPECIAL SECTION: HOW SERVICES COMMISSIONS WORK (Óticas, Clínicas, Barbeiros, Manicures) */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-black uppercase tracking-wider">
                  Módulo de Serviços Presenciais
                </span>
                <h4 className="font-black text-slate-900 text-sm mt-1.5 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  Como Rastrear e Cobrar Comissões de Serviços (Ótica, Exames, Clínicas, Manicures)
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Para serviços onde o cliente agenda online e o valor final só é calculado presencialmente (ex: óticas onde o cliente faz exame de vista e escolhe lentes no consultório), o Shop da Cidade implementa o <strong>fluxo de Conclusão Presencial com Split Asaas</strong>:
                </p>
              </div>

              {/* Step by step flow */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center">1</span>
                  <strong className="block text-slate-900 font-bold text-xs pt-1">Agendamento no App</strong>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    O cliente agenda o horário e escolhe a ótica ou clínica pelo app gratuitamente ou com taxa de sinal.
                  </p>
                </div>

                <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center">2</span>
                  <strong className="block text-slate-900 font-bold text-xs pt-1">Atendimento na Ótica</strong>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    O cliente realiza os exames, escolhe as armações e o atendente calcula o valor total (ex: R$ 450,00).
                  </p>
                </div>

                <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center">3</span>
                  <strong className="block text-slate-900 font-bold text-xs pt-1">Cobrança no Painel</strong>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    O atendente insere o valor final no painel do parceiro e gera o Pix Asaas dinâmico na tela.
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center">4</span>
                  <strong className="block text-emerald-950 font-bold text-xs pt-1">Split Imediato</strong>
                  <p className="text-[11px] text-emerald-800 leading-normal">
                    O Asaas divide o valor na hora: sua comissão cai na sua carteira e o restante na ótica!
                  </p>
                </div>
              </div>

              {/* Interactive Service Commission Simulator */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      Simulador de Cobrança e Split de Serviço Presencial
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Teste como o cálculo de comissão e a cobrança Pix do Asaas são gerados instantaneamente.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 text-[11px] mb-1">Categoria de Serviço</label>
                    <select
                      value={simServiceCategory}
                      onChange={e => setSimServiceCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    >
                      <option value="Ótica & Exames de Vista">Ótica & Exames de Vista</option>
                      <option value="Barbearia & Cabelo">Barbearia & Cabelo</option>
                      <option value="Manicure & Unhas">Manicure & Unhas</option>
                      <option value="Clínica Médica & Saúde">Clínica Médica & Saúde</option>
                      <option value="Manutenção de Ar-Condicionado">Manutenção de Ar-Condicionado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-[11px] mb-1">Valor Final Presencial (R$)</label>
                    <input
                      type="number"
                      step="10"
                      value={simServiceAmount}
                      onChange={e => setSimServiceAmount(e.target.value)}
                      placeholder="350.00"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 font-mono"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleSimulateServiceCommission}
                      disabled={simulatingCommission || !simServiceAmount}
                      className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{simulatingCommission ? 'Gerando...' : 'Gerar Pix Asaas'}</span>
                    </button>
                  </div>
                </div>

                {/* Simulation Result */}
                {simulatedCommissionResult && (
                  <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-3 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Valor Total do Serviço</span>
                        <strong className="text-sm font-black text-slate-900">{formatBRL(simulatedCommissionResult.serviceAmount)}</strong>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <span className="text-[10px] text-emerald-700 block font-bold uppercase">Comissão Shop da Cidade ({simulatedCommissionResult.commissionPercent}%)</span>
                        <strong className="text-sm font-black text-emerald-700">{formatBRL(simulatedCommissionResult.platformCut)}</strong>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <span className="text-[10px] text-blue-700 block font-bold uppercase">Repasse Líquido ao Parceiro</span>
                        <strong className="text-sm font-black text-blue-700">{formatBRL(simulatedCommissionResult.partnerCut)}</strong>
                      </div>
                    </div>

                    {/* QR Code and Copy-Paste */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 border-t border-slate-100">
                      {simulatedCommissionResult.pixQrCodeUrl && (
                        <img
                          src={simulatedCommissionResult.pixQrCodeUrl}
                          alt="QR Code Pix Asaas"
                          className="w-24 h-24 rounded-xl border border-slate-200 p-1 bg-white shrink-0 shadow-xs"
                        />
                      )}
                      <div className="flex-1 space-y-1.5 w-full">
                        <span className="font-bold text-slate-800 text-[11px] block">Código Pix Copia e Cola (Asaas):</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={simulatedCommissionResult.pixCode}
                            className="flex-1 px-3 py-1.5 bg-slate-100 text-slate-700 font-mono text-[10px] rounded-lg border border-slate-200 select-all"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(simulatedCommissionResult.pixCode);
                                alert('Código Pix Copia e Cola copiado com sucesso!');
                              }
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg cursor-pointer shrink-0"
                          >
                            Copiar
                          </button>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-medium block">
                          ✓ Pagamento rastreado automaticamente via Webhook Asaas.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: STORES */}
      {activeTab === 'stores' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Lojas Cadastradas no Shop da Cidade</h3>
            <span className="text-xs text-slate-500">{storesList.length} estabelecimentos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-800">
                <tr>
                  <th className="px-4 py-3">Loja</th>
                  <th className="px-4 py-3">Categoria (Trocar)</th>
                  <th className="px-4 py-3">Slug / Link</th>
                  <th className="px-4 py-3">Bairro</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Destaque</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {storesList.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={s.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 block">{s.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {s.id.slice(0, 10)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={s.category}
                        onChange={e => handleUpdateStore(s.id, undefined, undefined, e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none focus:border-amber-500 shadow-2xs hover:border-slate-400 transition"
                        title="Alterar categoria deste parceiro já cadastrado"
                      >
                        {STORE_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-amber-700">/loja/{s.slug}</td>
                    <td className="px-4 py-3">{s.neighborhood}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.status === 'active' ? 'Ativa' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.is_featured ? (
                        <span className="text-amber-500 font-bold">★ Em Alta</span>
                      ) : (
                        <span className="text-slate-400">Padrão</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onNavigate('store-detail', s.slug)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer hover:bg-slate-100"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleUpdateStore(s.id, s.status === 'active' ? 'suspended' : 'active', s.is_featured ? 1 : 0)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer hover:bg-slate-100"
                        >
                          {s.status === 'active' ? 'Suspender' : 'Aprovar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Usuários Registrados</h3>
            <span className="text-xs text-slate-500">{usersList.length} cadastros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-800">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">Perfil / Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-bold text-slate-900">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3 text-slate-600">{u.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.is_active ? 'Ativo' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleUpdateUser(u.id, u.role, u.is_active ? 0 : 1)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer hover:bg-slate-100"
                      >
                        {u.is_active ? 'Bloquear' : 'Desbloquear'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: PROVIDERS */}
      {activeTab === 'providers' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Prestadores de Serviços Parceiros</h3>
            <span className="text-xs text-slate-500">{providersList.length} cadastrados</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-800">
                <tr>
                  <th className="px-4 py-3">Profissional</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {providersList.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-bold text-slate-900">{p.business_name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.category_id}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.is_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.is_approved ? 'Aprovado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleUpdateProvider(p.id, p.is_approved ? 0 : 1, p.is_featured ? 1 : 0)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer hover:bg-slate-100"
                      >
                        {p.is_approved ? 'Desativar' : 'Aprovar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: BANNERS */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-900">Banners Promocionais da Home</h3>
            <button
              onClick={() => setIsBannerModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Novo Banner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bannersList.map(b => (
              <div key={b.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
                <img src={b.image_url} alt="" className="h-40 w-full object-cover" />
                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-sm text-slate-900">{b.title}</h4>
                  <p className="text-xs text-slate-500">{b.subtitle}</p>
                  <div className="pt-2 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Posição: {b.position}</span>
                    <button
                      onClick={() => handleDeleteBanner(b.id)}
                      className="text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Remover Banner
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-sm text-slate-900">Registros de Auditoria Administrativa</h3>
          <div className="divide-y divide-slate-100">
            {auditLogs.map(l => (
              <div key={l.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{l.action}</span>
                  <span className="text-slate-500 ml-2">por {l.user_name || 'Superadmin'}</span>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{l.details_json}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{formatDateBR(l.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW BANNER MODAL */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl relative text-slate-900">
            <button onClick={() => setIsBannerModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base text-slate-900 mb-4">Adicionar Banner na Home</h3>
            <form onSubmit={handleCreateBanner} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título do Banner</label>
                <input
                  type="text"
                  required
                  value={bannerTitle}
                  onChange={e => setBannerTitle(e.target.value)}
                  placeholder="Ex: Semana de Ofertas no Comércio de Canaã"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtítulo</label>
                <input
                  type="text"
                  value={bannerSubtitle}
                  onChange={e => setBannerSubtitle(e.target.value)}
                  placeholder="Ex: Compre com frete grátis e receba em até 50 min"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL da Imagem do Banner</label>
                <input
                  type="text"
                  required
                  value={bannerImage}
                  onChange={e => setBannerImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md cursor-pointer"
                >
                  Criar Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAR 2FA (GOOGLE AUTHENTICATOR) */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIs2FAModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Configurar Autenticação em Duas Etapas (2FA)
                </h3>
                <p className="text-xs text-slate-400">Google Authenticator, Authy ou Microsoft Authenticator</p>
              </div>
            </div>

            {twoFactorError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                <span>{twoFactorError}</span>
              </div>
            )}

            {twoFactorSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{twoFactorSuccess}</span>
              </div>
            )}

            {twoFactorSetupData ? (
              <form onSubmit={handleConfirm2FAActivation} className="space-y-4 text-xs">
                {/* Step 1: Scan QR Code */}
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-center">
                  <p className="font-bold text-slate-200 mb-2">1. Escaneie este QR Code no aplicativo do seu celular:</p>
                  <div className="inline-block p-2 bg-white rounded-2xl shadow-md">
                    <img
                      src={twoFactorSetupData.qr_code_data_url}
                      alt="QR Code 2FA"
                      className="w-48 h-48 mx-auto object-contain rounded-xl"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Abra o <strong>Google Authenticator</strong> no celular, toque no <strong>+</strong> e escolha <strong>Escanear código QR</strong>.
                  </p>
                </div>

                {/* Step 2: Secret key manual */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <p className="text-[11px] font-bold text-slate-300 mb-1">Ou digite a chave manualmente:</p>
                  <div className="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-300">
                    <span className="truncate">{twoFactorSetupData.secret}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(twoFactorSetupData.secret);
                        setCopiedSecret(true);
                        setTimeout(() => setCopiedSecret(false), 2000);
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 cursor-pointer transition shrink-0"
                    >
                      {copiedSecret ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSecret ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Step 3: Backup codes */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] font-bold text-slate-300">Códigos Reservas de Emergência:</p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(twoFactorSetupData.backup_codes.join('\n'));
                        setCopiedBackupCodes(true);
                        setTimeout(() => setCopiedBackupCodes(false), 2000);
                      }}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedBackupCodes ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedBackupCodes ? 'Códigos Copiados!' : 'Copiar Todos'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {twoFactorSetupData.backup_codes.map((code, idx) => (
                      <div key={idx} className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800/80 font-mono text-[11px] text-slate-300 text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    Guarde esses códigos em um local seguro. Cada um permite entrar na conta caso perca o celular.
                  </p>
                </div>

                {/* Step 4: Verification code input */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    2. Digite o código de 6 dígitos que apareceu no aplicativo para confirmar:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      autoFocus
                      maxLength={6}
                      value={twoFactorVerifyCode}
                      onChange={e => setTwoFactorVerifyCode(e.target.value)}
                      placeholder="000000"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-center font-mono text-lg font-black tracking-widest focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIs2FAModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isActivating2FA || !twoFactorVerifyCode.trim()}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {isActivating2FA ? 'Confirmando...' : 'Ativar e Proteger Conta'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Gerando chaves criptográficas seguras...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: DESATIVAR 2FA */}
      {isDisable2FAModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white relative">
            <button
              onClick={() => setIsDisable2FAModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Desativar Autenticação em Duas Etapas
                </h3>
                <p className="text-xs text-slate-400">Confirmação de segurança</p>
              </div>
            </div>

            {disable2FAError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {disable2FAError}
              </div>
            )}

            <form onSubmit={handleDisable2FA} className="space-y-4 text-xs">
              <p className="text-slate-300">
                Para confirmar a desativação do 2FA, por favor digite a sua senha atual de administrador:
              </p>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Senha de Acesso</label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={disablePassword}
                  onChange={e => setDisablePassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDisable2FAModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDisabling2FA || !disablePassword}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isDisabling2FA ? 'Desativando...' : 'Confirmar Desativação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
