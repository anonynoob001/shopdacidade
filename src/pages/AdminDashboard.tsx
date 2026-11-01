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
  FileCode,
  FileSpreadsheet,
  Globe,
  KeyRound,
  Layers,
  Lock,
  Package,
  Palette,
  Plus,
  QrCode,
  RefreshCw,
  Save,
  Search,
  Server,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Sparkles,
  Store,
  Terminal,
  Trash2,
  TrendingUp,
  Truck,
  Users,
  Wrench,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteTheme } from '../context/ThemeContext';
import { apiRequest, formatBRL, formatDateBR } from '../services/api';
import {
  CloudflareConfig,
  DatabaseStatsResponse,
  executeD1Query,
  fetchDatabaseStats,
  getCloudflareD1SchemaSQL,
  getCloudflareWranglerCommands,
  getSavedCloudflareConfig,
  saveCloudflareConfig
} from '../services/cloudflare';
import {
  getSavedSupabaseConfig,
  getSupabaseSchemaSQL,
  saveSupabaseConfig,
  testSupabaseConnection
} from '../services/supabase';
import { AuditLog, PromotionalBanner, ServiceProvider, Store as StoreType, User } from '../worker/types';

interface AdminDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

const THEME_PRESETS = [
  {
    name: 'Shop da Cidade Oficial (Ouro & Grafite)',
    primary: '#fdca04',
    secondary: '#0f172a',
    accent: '#f59e0b'
  },
  {
    name: 'Verde Esmeralda Carajás',
    primary: '#059669',
    secondary: '#064e3b',
    accent: '#10b981'
  },
  {
    name: 'Azul Real Tecnológico',
    primary: '#2563eb',
    secondary: '#1e1b4b',
    accent: '#3b82f6'
  },
  {
    name: 'Laranja Solar Vibrante',
    primary: '#ea580c',
    secondary: '#431407',
    accent: '#f97316'
  },
  {
    name: 'Rubi Luxo',
    primary: '#e11d48',
    secondary: '#4c0519',
    accent: '#fb7185'
  }
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { updateSettingsState, refreshSettings: refreshGlobalTheme } = useSiteTheme();

  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [storesList, setStoresList] = useState<StoreType[]>([]);
  const [providersList, setProvidersList] = useState<ServiceProvider[]>([]);
  const [bannersList, setBannersList] = useState<PromotionalBanner[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'kpis' | 'users' | 'stores' | 'providers' | 'settings' | 'cloudflare' | 'supabase' | 'banners' | 'logs' | 'asaas'>('kpis');
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

  // Cloudflare D1 Integration state
  const savedCf = getSavedCloudflareConfig();
  const [cfDatabaseId, setCfDatabaseId] = useState(savedCf.databaseId);
  const [cfDatabaseName, setCfDatabaseName] = useState(savedCf.databaseName);
  const [cfAccountId, setCfAccountId] = useState(savedCf.accountId);
  const [cfR2Bucket, setCfR2Bucket] = useState(savedCf.r2Bucket);
  const [cfStats, setCfStats] = useState<DatabaseStatsResponse | null>(null);
  const [isLoadingCfStats, setIsLoadingCfStats] = useState(false);
  const [cfQuery, setCfQuery] = useState('SELECT id, name, slug, status, theme_color_primary, is_open FROM stores LIMIT 5;');
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [queryResult, setQueryResult] = useState<{ columns: string[]; rows: any[]; rowCount: number; latencyMs: number; error?: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedCommands, setCopiedCommands] = useState(false);
  const [isSettingUpD1, setIsSettingUpD1] = useState(false);

  // Supabase Integration state
  const savedSb = getSavedSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(savedSb.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(savedSb.anonKey);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [copiedSupabaseSql, setCopiedSupabaseSql] = useState(false);

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

      if (setRes.settings?.cloudflare_database_id && !cfDatabaseId) {
        setCfDatabaseId(setRes.settings.cloudflare_database_id);
      }
      if (setRes.settings?.cloudflare_database_name && !cfDatabaseName) {
        setCfDatabaseName(setRes.settings.cloudflare_database_name);
      }
      if (setRes.settings?.cloudflare_account_id && !cfAccountId) {
        setCfAccountId(setRes.settings.cloudflare_account_id);
      }
      if (setRes.settings?.cloudflare_r2_bucket && !cfR2Bucket) {
        setCfR2Bucket(setRes.settings.cloudflare_r2_bucket);
      }

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

  useEffect(() => {
    loadAdminData();
  }, []);

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

  const handleUpdateStore = async (storeId: string, status: string, is_featured: number) => {
    try {
      await apiRequest(`/api/admin/stores/${storeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, is_featured })
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

  const loadCloudflareStats = async () => {
    setIsLoadingCfStats(true);
    try {
      const stats = await fetchDatabaseStats();
      setCfStats(stats);
    } catch (err: any) {
      console.error('Failed to fetch D1 stats:', err);
    } finally {
      setIsLoadingCfStats(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'cloudflare') {
      loadCloudflareStats();
    }
  }, [activeTab]);

  const handleSaveCloudflareConfig = async () => {
    saveCloudflareConfig({
      databaseId: cfDatabaseId.trim(),
      databaseName: cfDatabaseName.trim(),
      accountId: cfAccountId.trim(),
      r2Bucket: cfR2Bucket.trim()
    });

    try {
      await apiRequest('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          cloudflare_database_id: cfDatabaseId.trim(),
          cloudflare_database_name: cfDatabaseName.trim(),
          cloudflare_account_id: cfAccountId.trim(),
          cloudflare_r2_bucket: cfR2Bucket.trim()
        })
      });
      alert('Configurações do Cloudflare D1 e R2 salvas com sucesso!');
      await loadCloudflareStats();
    } catch {
      alert('Configurações salvas localmente no navegador!');
    }
  };

  const handleSetupD1 = async () => {
    if (!confirm('Deseja inicializar todas as 25 tabelas e carregar os dados padrão (lojas, produtos, prestadores e configurações) no Cloudflare D1?')) return;
    setIsSettingUpD1(true);
    try {
      const res = await apiRequest<{ message?: string }>('/api/public/setup-db', { method: 'POST' });
      alert(res.message || 'Banco D1 inicializado com sucesso!');
      await loadCloudflareStats();
      await loadAdminData();
    } catch (err: any) {
      alert(err?.message || 'Falha ao inicializar banco D1.');
    } finally {
      setIsSettingUpD1(false);
    }
  };

  const handleSaveSupabase = async () => {
    saveSupabaseConfig(supabaseUrl.trim(), supabaseAnonKey.trim());
    alert('Configurações do Supabase salvas com sucesso!');
    handleTestSupabase();
  };

  const handleTestSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      alert('Preencha a URL e a Anon Key do Supabase primeiro.');
      return;
    }
    setIsTestingSupabase(true);
    try {
      const res = await testSupabaseConnection(supabaseUrl.trim(), supabaseAnonKey.trim());
      setSupabaseTestResult(res);
    } catch (err: any) {
      setSupabaseTestResult({
        success: false,
        message: err?.message || 'Falha ao testar conexão com o Supabase'
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleCopySupabaseSQL = () => {
    const sql = getSupabaseSchemaSQL();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sql);
      setCopiedSupabaseSql(true);
      setTimeout(() => setCopiedSupabaseSql(false), 2500);
    }
  };

  const handleExecuteQuery = async () => {
    if (!cfQuery.trim()) return;
    setIsExecutingQuery(true);
    try {
      const res = await executeD1Query(cfQuery.trim());
      setQueryResult(res);
      if (res.success) {
        // Refresh stats if non-select mutation occurred
        if (!/^SELECT\b/i.test(cfQuery.trim())) {
          await loadCloudflareStats();
        }
      }
    } catch (err: any) {
      setQueryResult({
        columns: ['error'],
        rows: [],
        rowCount: 0,
        latencyMs: 0,
        error: err?.message || 'Falha ao executar query'
      });
    } finally {
      setIsExecutingQuery(false);
    }
  };

  const handleCopyCommands = () => {
    const cmds = getCloudflareWranglerCommands({
      databaseId: cfDatabaseId,
      databaseName: cfDatabaseName,
      accountId: cfAccountId,
      r2Bucket: cfR2Bucket,
      apiToken: '',
      environment: 'production'
    });

    const fullText = `# Comandos Cloudflare Wrangler - Shop da Cidade\n# 1. Criar banco D1 no Cloudflare\n${cmds.createDb}\n\n# 2. Criar bucket R2 para fotos e mídias\n${cmds.r2Create}\n\n# 3. Aplicar migrações D1 remotas\n${cmds.applyMigrations}\n\n# 4. Testar query remota no D1\n${cmds.testQuery}\n\n# 5. Build e Deploy na Cloudflare Edge\n${cmds.deploy}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullText);
      setCopiedCommands(true);
      setTimeout(() => setCopiedCommands(false), 2500);
    }
  };

  const handleCopyD1SQL = () => {
    const ddl = getCloudflareD1SchemaSQL();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ddl);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
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
        <span className="text-xs font-semibold text-slate-500">Carregando Painel Central de Controle...</span>
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
          <p className="text-xs text-slate-500 mt-0.5">Gestão de Lojas, Usuários, Cores do Site e Banco de Dados Cloudflare D1</p>
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
          onClick={() => setActiveTab('cloudflare')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'cloudflare' ? 'border-amber-500 text-slate-950 font-black' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-amber-500" />
          Banco Cloudflare (D1 & R2)
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'supabase' ? 'border-emerald-500 text-slate-950 font-black' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" />
          Banco Supabase (PostgreSQL & 2FA)
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

          {/* Site Colors & Palette Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Identidade Visual & Cores do Site Principal</h3>
                <p className="text-xs text-slate-500">
                  Aqui o Super Admin define as cores e textos oficiais aplicados em todo o marketplace (cabeçalho, rodapé, botões principais e destaques).
                </p>
              </div>
            </div>

            {/* Curated Theme Presets */}
            <div>
              <label className="block font-bold text-slate-700 mb-2">Paletas de Cores Oficiais Recomendadas</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {THEME_PRESETS.map(t => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        primary_color: t.primary,
                        secondary_color: t.secondary,
                        accent_color: t.accent
                      });
                    }}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-slate-400 text-left flex items-center gap-3 transition cursor-pointer bg-slate-50"
                  >
                    <div className="flex -space-x-1.5 shrink-0">
                      <span style={{ backgroundColor: t.primary }} className="w-5 h-5 rounded-full border-2 border-white shadow-xs" />
                      <span style={{ backgroundColor: t.secondary }} className="w-5 h-5 rounded-full border-2 border-white shadow-xs" />
                      <span style={{ backgroundColor: t.accent }} className="w-5 h-5 rounded-full border-2 border-white shadow-xs" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cor Primária (Ouro/Marca)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings['primary_color'] || '#fdca04'}
                    onChange={e => setSettings({ ...settings, primary_color: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={settings['primary_color'] || '#fdca04'}
                    onChange={e => setSettings({ ...settings, primary_color: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cor Secundária (Fundo Escuro)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings['secondary_color'] || '#0f172a'}
                    onChange={e => setSettings({ ...settings, secondary_color: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={settings['secondary_color'] || '#0f172a'}
                    onChange={e => setSettings({ ...settings, secondary_color: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cor de Acento (Âmbar/Realce)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings['accent_color'] || '#f59e0b'}
                    onChange={e => setSettings({ ...settings, accent_color: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={settings['accent_color'] || '#f59e0b'}
                    onChange={e => setSettings({ ...settings, accent_color: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Live Theme Preview */}
            <div className="pt-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                Pré-visualização da Paleta no Site:
              </span>
              <div
                style={{ backgroundColor: settings['secondary_color'] || '#0f172a' }}
                className="p-4 rounded-2xl text-white shadow-md space-y-3 transition-colors border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/shop-da-cidade-logo-transparente.png" alt="" className="h-7 w-auto object-contain" />
                    <span className="text-xs font-black">{settings['platform_name'] || 'Shop da Cidade'}</span>
                  </div>
                  <span
                    style={{ backgroundColor: settings['primary_color'] || '#fdca04', color: '#0f172a' }}
                    className="px-3 py-1 rounded-lg text-xs font-black shadow-xs"
                  >
                    Botão Principal
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {settings['banner_notice'] || 'Aviso no topo do site para os moradores de Canaã.'}
                </p>
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

      {/* TAB: CLOUDFLARE D1 INTEGRATION */}
      {activeTab === 'cloudflare' && (
        <div className="space-y-6 max-w-4xl text-xs animate-in fade-in duration-200">
          {/* Main Status & Configuration Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                  Cloudflare D1 • Edge SQL Database
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-500" />
                  Banco de Dados Cloudflare (D1 & R2)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  O Shop da Cidade foi projetado nativamente para a infraestrutura da <strong>Cloudflare</strong>. O <strong>Cloudflare D1</strong> é um banco de dados SQL relacional distribuído mundialmente na borda (edge), sem custos de egress e com performance instantânea.
                </p>
              </div>

              <div className="shrink-0 p-3 bg-amber-50 rounded-2xl border border-amber-200 text-slate-900 text-center font-bold text-[11px] min-w-[140px]">
                <Server className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                <span className="block font-black text-amber-900">
                  {cfStats ? 'D1 Conectado' : 'Carregando...'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {cfStats ? `${cfStats.latencyMs}ms de latência` : 'Binding DB'}
                </span>
              </div>
            </div>

            {/* Live Database Status Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Motor do Banco</span>
                <strong className="text-xs text-slate-900 block mt-0.5 font-black truncate">Cloudflare D1 / SQLite</strong>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Binding no Worker</span>
                <strong className="text-xs text-slate-900 block mt-0.5 font-black font-mono">env.DB</strong>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Total de Registros</span>
                <strong className="text-xs text-amber-600 block mt-0.5 font-black">
                  {cfStats ? cfStats.totalRecords.toLocaleString() : '...'} linhas
                </strong>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Tabelas Ativas</span>
                <strong className="text-xs text-emerald-600 block mt-0.5 font-black">
                  {cfStats ? `${cfStats.tables.length} tabelas` : '18 tabelas'}
                </strong>
              </div>
            </div>

            {/* Live Tables Count Badge Grid */}
            {cfStats && cfStats.tables.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700 text-xs">Tabelas no Cloudflare D1:</span>
                  <button
                    type="button"
                    onClick={loadCloudflareStats}
                    disabled={isLoadingCfStats}
                    className="text-[11px] text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingCfStats ? 'animate-spin' : ''}`} />
                    Atualizar contagens
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {cfStats.tables.map(tbl => (
                    <div
                      key={tbl.name}
                      onClick={() => setCfQuery(`SELECT * FROM ${tbl.name} LIMIT 10;`)}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400 cursor-pointer transition flex items-center justify-between"
                      title={`Clique para inspecionar SELECT * FROM ${tbl.name}`}
                    >
                      <span className="font-mono text-[11px] text-slate-700 truncate">{tbl.name}</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 font-bold text-[10px] text-slate-600 shrink-0 ml-1">
                        {tbl.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Configuration Inputs */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                Configurações do Cloudflare D1 e R2
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nome do Banco D1 (database_name)
                  </label>
                  <input
                    type="text"
                    value={cfDatabaseName}
                    onChange={e => setCfDatabaseName(e.target.value)}
                    placeholder="shop_cidade_db"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:border-amber-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Nome definido em <strong>wrangler.jsonc</strong>.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ID do Banco D1 (database_id)
                  </label>
                  <input
                    type="text"
                    value={cfDatabaseId}
                    onChange={e => setCfDatabaseId(e.target.value)}
                    placeholder="ex: 4a2b919d-7f55-4428-b8ce-e55502a3562a"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:border-amber-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Gerado pelo comando <code>wrangler d1 create</code>.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cloudflare Account ID (Opcional)
                  </label>
                  <input
                    type="text"
                    value={cfAccountId}
                    onChange={e => setCfAccountId(e.target.value)}
                    placeholder="ex: 8f0293da2780e9812bc879a9"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:border-amber-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Encontrado no painel do Cloudflare (lado direito do Dashboard).
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Bucket R2 para Fotos e Mídias (r2_buckets)
                  </label>
                  <input
                    type="text"
                    value={cfR2Bucket}
                    onChange={e => setCfR2Bucket(e.target.value)}
                    placeholder="shop-cidade-media"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:border-amber-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Armazenamento de logos, fotos de produtos e banners sem custo de saída.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveCloudflareConfig}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Configurações do Cloudflare</span>
                </button>

                <button
                  type="button"
                  onClick={loadCloudflareStats}
                  disabled={isLoadingCfStats}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCfStats ? 'animate-spin' : ''}`} />
                  <span>{isLoadingCfStats ? 'Verificando...' : 'Testar Conexão D1'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSetupD1}
                  disabled={isSettingUpD1}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Database className={`w-3.5 h-3.5 ${isSettingUpD1 ? 'animate-spin' : ''}`} />
                  <span>{isSettingUpD1 ? 'Criando tabelas no D1...' : 'Inicializar Tabelas & Lojas no D1'}</span>
                </button>
              </div>
            </div>

            {/* Interactive SQL Console (Cloudflare D1 Query Runner) */}
            <div className="pt-6 border-t border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-500" />
                    Console SQL Interativo do Cloudflare D1
                  </h4>
                  <p className="text-xs text-slate-500">
                    Execute consultas SQL diretamente no banco de dados para inspecionar lojas, pedidos e tabelas.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCfQuery('SELECT id, name, slug, status, theme_color_primary FROM stores;')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] cursor-pointer"
                  >
                    Ver Lojas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCfQuery('SELECT * FROM platform_settings;')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] cursor-pointer"
                  >
                    Ver Configs
                  </button>
                  <button
                    type="button"
                    onClick={() => setCfQuery('SELECT id, name, email, role FROM users LIMIT 10;')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] cursor-pointer"
                  >
                    Ver Usuários
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={cfQuery}
                  onChange={e => setCfQuery(e.target.value)}
                  placeholder="Ex: SELECT * FROM stores LIMIT 5;"
                  className="w-full px-3.5 py-2.5 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Dica: Suporta queries SELECT, INSERT, UPDATE e comandos SQLite D1.
                  </span>
                  <button
                    type="button"
                    onClick={handleExecuteQuery}
                    disabled={isExecutingQuery || !cfQuery.trim()}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Terminal className={`w-3.5 h-3.5 ${isExecutingQuery ? 'animate-pulse' : ''}`} />
                    <span>{isExecutingQuery ? 'Executando...' : 'Executar no D1'}</span>
                  </button>
                </div>
              </div>

              {/* Query Result Viewer */}
              {queryResult && (
                <div className="mt-3 p-3 bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 space-y-2 font-mono text-xs overflow-hidden">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                    <span>
                      Resultado: <strong className="text-white">{queryResult.rowCount}</strong> linha(s)
                    </span>
                    <span className="text-emerald-400">{queryResult.latencyMs}ms</span>
                  </div>

                  {queryResult.error ? (
                    <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300">
                      <strong>Erro:</strong> {queryResult.error}
                    </div>
                  ) : queryResult.rows.length === 0 ? (
                    <div className="py-4 text-center text-slate-500 text-xs">
                      Nenhum registro retornado.
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-x-auto overflow-y-auto no-scrollbar">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-800 text-amber-400">
                            {queryResult.columns.map(col => (
                              <th key={col} className="p-2 whitespace-nowrap font-bold">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.rows.map((row, idx) => (
                            <tr key={idx} className="border-b border-slate-900 hover:bg-slate-900/60">
                              {queryResult.columns.map(col => (
                                <td key={col} className="p-2 whitespace-nowrap text-slate-300 max-w-xs truncate">
                                  {typeof row[col] === 'object'
                                    ? JSON.stringify(row[col])
                                    : String(row[col] ?? 'null')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cloudflare Wrangler CLI Deployment Box */}
            <div className="pt-6 border-t border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Server className="w-4 h-4 text-amber-500" />
                    Comandos Prontos do Cloudflare Wrangler CLI
                  </h4>
                  <p className="text-xs text-slate-500">
                    Use o terminal para criar o banco D1, aplicar migrações e publicar em produção na Cloudflare.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCommands}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                  >
                    {copiedCommands ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCommands ? 'Comandos Copiados!' : 'Copiar Comandos'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyD1SQL}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                  >
                    {copiedSql ? <Check className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                    <span>{copiedSql ? 'SQL Completo Copiado!' : 'Copiar SQL Completo (Tabelas + Lojas)'}</span>
                  </button>
                </div>
              </div>

              {/* Special Guide for Cloudflare Pages */}
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 space-y-2">
                <strong className="text-blue-900 block font-black text-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-ping" />
                  Passo a Passo para o Cloudflare Pages (shopdacidade.pages.dev):
                </strong>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                  <li>
                    <strong>Vincular o Banco no Pages:</strong> No painel da Cloudflare, acesse <strong>Workers & Pages</strong> &rarr; clique no seu projeto (<strong>shopdacidade</strong>) &rarr; aba <strong>Settings</strong> &rarr; menu lateral <strong>Functions</strong> &rarr; role até <strong>D1 Database Bindings</strong>.
                  </li>
                  <li>
                    <strong>Adicionar Binding:</strong> Clique em <strong>Add binding</strong> com Nome da variável: <code className="bg-blue-100 px-1 py-0.5 rounded font-bold font-mono">DB</code> (em maiúsculo) e selecione seu banco D1 (<code className="bg-blue-100 px-1 py-0.5 rounded font-mono">shop_cidade_db</code>). Clique em <strong>Save</strong>.
                  </li>
                  <li>
                    <strong>Executar o SQL Completo:</strong> Acesse <strong>Workers & Pages</strong> &rarr; <strong>D1</strong> &rarr; clique em <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">shop_cidade_db</code> &rarr; aba <strong>Console</strong> &rarr; cole o script gerado pelo botão <strong>"Copiar SQL Completo"</strong> acima e clique em <strong>Execute</strong>.
                  </li>
                  <li>
                    <strong>Reimplantar:</strong> Na aba <strong>Deployments</strong> do Cloudflare Pages, clique em <strong>Retry deployment</strong> no último build para o vínculo do banco entrar em vigor.
                  </li>
                </ol>
              </div>

              {/* Code snippet display */}
              <div className="p-4 rounded-2xl bg-slate-950 text-slate-300 font-mono text-[11px] max-h-56 overflow-y-auto border border-slate-800 space-y-1.5">
                <span className="text-amber-400 font-bold block"># 1. Criar o Banco D1 na sua conta Cloudflare:</span>
                <p className="text-emerald-400 pl-2">npx wrangler d1 create {cfDatabaseName || 'shop_cidade_db'}</p>
                <span className="text-slate-500 text-[10px] pl-2 block">↳ ID configurado: {cfDatabaseId || '0eb867f7-6f43-4f77-8a60-0867fbd7cbc0'}</span>

                <span className="text-amber-400 font-bold block pt-1"># 2. Criar o Bucket R2 para fotos e mídias:</span>
                <p className="text-emerald-400 pl-2">npx wrangler r2 bucket create {cfR2Bucket || 'shop-cidade-media'}</p>

                <span className="text-amber-400 font-bold block pt-1"># 3. Aplicar as migrações (tabelas e dados iniciais) no Cloudflare D1 remoto:</span>
                <p className="text-emerald-400 pl-2">npx wrangler d1 migrations apply {cfDatabaseName || 'shop_cidade_db'} --remote</p>

                <span className="text-amber-400 font-bold block pt-1"># 4. Publicar a aplicação na borda da Cloudflare:</span>
                <p className="text-emerald-400 pl-2">npm run build && npx wrangler deploy</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SUPABASE INTEGRATION */}
      {activeTab === 'supabase' && (
        <div className="space-y-6 max-w-4xl text-xs animate-in fade-in duration-200">
          {/* Main Status & Configuration Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                  Supabase • PostgreSQL Cloud Database & 2FA
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  Banco de Dados Supabase (PostgreSQL & 2FA)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Conecte seu projeto do <strong>Supabase</strong> para ter um banco de dados relacional <strong>PostgreSQL</strong> completo com painel visual estilo planilha, suporte nativo a <strong>Autenticação com 2FA (Google Authenticator)</strong> e 1 GB de armazenamento grátis para fotos de produtos e lojas.
                </p>
              </div>

              <div className="shrink-0 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-900 text-center font-bold text-[11px] min-w-[150px]">
                <Database className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                <span className="block font-black text-slate-900">
                  {supabaseUrl ? 'Supabase Configurado' : 'Pendente'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {supabaseTestResult?.success ? 'Conexão Ativa' : 'Aguardando Teste'}
                </span>
              </div>
            </div>

            {/* Live Status Feedback */}
            {supabaseTestResult && (
              <div
                className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 ${
                  supabaseTestResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {supabaseTestResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <div>
                  <p>{supabaseTestResult.message}</p>
                  {supabaseTestResult.latencyMs && (
                    <span className="text-[10px] opacity-75 font-mono">
                      Tempo de resposta: {supabaseTestResult.latencyMs}ms
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Inputs: URL and Anon Key */}
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Project URL do Supabase (VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={e => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzproject.supabase.co"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Encontrado em: <strong>Project Settings &rarr; API &rarr; Project URL</strong>.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Anon Public Key (VITE_SUPABASE_ANON_KEY)
                  </label>
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={e => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Chave pública segura para acesso no navegador (chave <code>anon public</code>).
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveSupabase}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Credenciais do Supabase</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={isTestingSupabase || !supabaseUrl.trim()}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                  <span>{isTestingSupabase ? 'Testando Conexão...' : 'Testar Conexão com Supabase'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySupabaseSQL}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xs cursor-pointer ml-auto"
                >
                  {copiedSupabaseSql ? <Check className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />}
                  <span>{copiedSupabaseSql ? 'SQL Copiado com Sucesso!' : 'Copiar Script SQL do Supabase'}</span>
                </button>
              </div>
            </div>

            {/* Step by step guide card */}
            <div className="pt-6 border-t border-slate-200 space-y-3">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                Guia Rápido: Como Configurar o Supabase e o 2FA (Authenticator)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono text-[10px]">1</span>
                    Criar o Projeto no Supabase
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Acesse <strong>supabase.com</strong>, crie uma conta grátis e crie um novo projeto (ex: <code>shop-da-cidade</code>). Defina uma senha forte para o banco de dados.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono text-[10px]">2</span>
                    Executar o Script SQL
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Clique no botão <strong>"Copiar Script SQL do Supabase"</strong> acima. No painel do Supabase, clique no menu <strong>SQL Editor</strong> &rarr; <strong>New Query</strong>, cole o código e clique em <strong>Run</strong>. Todas as 15 tabelas, RLS e dados de Canaã serão criados!
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono text-[10px]">3</span>
                    Copiar as Chaves de API
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    No Supabase, vá em <strong>Project Settings &rarr; API</strong>. Copie o <strong>Project URL</strong> e a chave <strong>anon public</strong> e cole nos campos acima.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1.5">
                  <span className="font-black text-emerald-950 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center font-mono text-[10px]">4</span>
                    Ativar o 2FA (Authenticator App)
                  </span>
                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    No painel do Supabase, vá em <strong>Authentication &rarr; Multi-Factor (MFA)</strong> e ative <strong>TOTP (Authenticator apps)</strong>. Os usuários poderão ativar o Google Authenticator ou Authy diretamente no perfil!
                  </p>
                </div>
              </div>
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
                          <span className="text-[10px] text-slate-400">{s.category}</span>
                        </div>
                      </div>
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
