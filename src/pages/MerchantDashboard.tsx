// Shop da Cidade - Merchant Dashboard with Custom Store Colors & Dedicated URL Management
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Camera,
  Check,
  CheckCircle,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  Globe,
  Image as ImageIcon,
  Instagram,
  Key,
  Link as LinkIcon,
  MapPin,
  Megaphone,
  MessageCircle,
  Package,
  Palette,
  Phone,
  Plus,
  Printer,
  QrCode,
  Save,
  Share2,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Sparkles,
  Store as StoreIcon,
  Trash2,
  TrendingUp,
  Truck,
  Upload,
  Volume2,
  VolumeX,
  Calendar,
  X
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { useAuth } from '../context/AuthContext';
import { apiRequest, CANAA_NEIGHBORHOODS, formatBRL, formatDateBR, STORE_CATEGORIES } from '../services/api';
import { playNewOrderChime } from '../utils/audioAlert';
import { DAY_NAMES, DEFAULT_WEEKLY_SCHEDULE, parseStoreSchedule, WeeklySchedule } from '../utils/storeSchedule';
import { Product, Store, SubOrder } from '../worker/types';

interface MerchantDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

const COLOR_PRESETS = [
  { name: 'Ouro Shop da Cidade', primary: '#fdca04', secondary: '#0f172a' },
  { name: 'Verde Esmeralda', primary: '#10b981', secondary: '#064e3b' },
  { name: 'Azul Real', primary: '#2563eb', secondary: '#1e1b4b' },
  { name: 'Laranja Vibrante', primary: '#f97316', secondary: '#431407' },
  { name: 'Rubi Elegante', primary: '#e11d48', secondary: '#4c0519' },
  { name: 'Roxo Moderno', primary: '#8b5cf6', secondary: '#2e1065' },
  { name: 'Dark Grafite', primary: '#38bdf8', secondary: '#020617' }
];

const STORE_LOGO_PRESETS = [
  { name: 'Mercado & Alimentos', url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&h=300&fit=crop&q=80' },
  { name: 'Hambúrguer & Lanches', url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=300&fit=crop&q=80' },
  { name: 'Farmácia & Saúde', url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=300&fit=crop&q=80' },
  { name: 'Construção & Tintas', url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=300&h=300&fit=crop&q=80' },
  { name: 'Moda & Boutique', url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=300&h=300&fit=crop&q=80' },
  { name: 'Eletrônicos & Games', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=300&fit=crop&q=80' },
  { name: 'Ótica & Óculos', url: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=300&h=300&fit=crop&q=80' },
  { name: 'Móveis & Casa', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop&q=80' },
  { name: 'Pizzaria & Delivery', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop&q=80' },
  { name: 'Açougue & Carnes', url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&h=300&fit=crop&q=80' }
];

const STORE_BANNER_PRESETS = [
  { name: 'Supermercado Fresco', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=450&fit=crop&q=80' },
  { name: 'Materiais & Construção', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=450&fit=crop&q=80' },
  { name: 'Gastronomia & Lanches', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=450&fit=crop&q=80' },
  { name: 'Tecnologia & Informática', url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1200&h=450&fit=crop&q=80' },
  { name: 'Moda & Vitrine', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=450&fit=crop&q=80' },
  { name: 'Móveis & Decoração', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=450&fit=crop&q=80' },
  { name: 'Farmácia & Beleza', url: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1200&h=450&fit=crop&q=80' },
  { name: 'Padaria & Confeitaria', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&h=450&fit=crop&q=80' }
];

function compressAndResizeImage(file: File, maxWidth: number, maxHeight: number, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ onNavigate }) => {
  const { user, openAuthModal } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SubOrder[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'store-url' | 'analytics' | 'settings' | 'security'>('orders');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sound alerts
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('merchant_sound_enabled') !== 'false' : true;
  });
  const prevPendingOrdersCount = useRef<number>(-1);

  // Weekly Schedule & Neighborhood Delivery Fees
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(DEFAULT_WEEKLY_SCHEDULE);
  const [neighborhoodFees, setNeighborhoodFees] = useState<Record<string, string>>({});

  // 2FA state for Merchant
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

  // Disable 2FA modal
  const [isDisable2FAModalOpen, setIsDisable2FAModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [disable2FAError, setDisable2FAError] = useState<string | null>(null);

  // Product modal
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('cat_construcao');
  const [prodPrice, setProdPrice] = useState('');
  const [prodPromoPrice, setProdPromoPrice] = useState('');
  const [prodStock, setProdStock] = useState('10');
  const [prodSku, setProdSku] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [isSavingProd, setIsSavingProd] = useState(false);

  // Store settings & personalization form
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    slug: '',
    category: 'Restaurantes & Lanches',
    description: '',
    whatsapp: '',
    phone: '',
    instagram: '',
    neighborhood: 'Centro',
    street: '',
    number: '',
    delivery_fee_base: '7.00',
    free_delivery_minimum: '150.00',
    delivery_time_min: '30-50 min',
    is_open: true,
    theme_color_primary: '#fdca04',
    theme_color_secondary: '#0f172a',
    custom_announcement: '',
    logo_url: '',
    banner_url: ''
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Logo & Banner editing state
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [logoMode, setLogoMode] = useState<'upload' | 'presets' | 'url'>('upload');
  const [bannerMode, setBannerMode] = useState<'upload' | 'presets' | 'url'>('upload');

  const loadMerchantData = async () => {
    setIsLoading(true);
    try {
      const storeRes = await apiRequest<{ store: Store | null }>('/api/merchant/store');
      setStore(storeRes.store || null);

      if (storeRes.store) {
        setSettingsForm({
          name: storeRes.store.name,
          slug: storeRes.store.slug,
          category: storeRes.store.category || 'Restaurantes & Lanches',
          description: storeRes.store.description,
          whatsapp: storeRes.store.whatsapp || '',
          phone: storeRes.store.phone || '',
          instagram: storeRes.store.instagram || '',
          neighborhood: storeRes.store.neighborhood,
          street: storeRes.store.street || '',
          number: storeRes.store.number || '',
          delivery_fee_base: storeRes.store.delivery_fee_base?.toString() || '7.00',
          free_delivery_minimum: storeRes.store.free_delivery_minimum?.toString() || '150.00',
          delivery_time_min: storeRes.store.delivery_time_min || '30-50 min',
          is_open: !!storeRes.store.is_open,
          theme_color_primary: storeRes.store.theme_color_primary || '#fdca04',
          theme_color_secondary: storeRes.store.theme_color_secondary || '#0f172a',
          custom_announcement: storeRes.store.custom_announcement || '',
          logo_url: storeRes.store.logo_url || '',
          banner_url: storeRes.store.banner_url || ''
        });

        if (storeRes.store.opening_hours_json) {
          setWeeklySchedule(parseStoreSchedule(storeRes.store.opening_hours_json));
        }
        if (storeRes.store.neighborhood_fees_json) {
          try {
            const parsed = typeof storeRes.store.neighborhood_fees_json === 'string'
              ? JSON.parse(storeRes.store.neighborhood_fees_json)
              : storeRes.store.neighborhood_fees_json;
            setNeighborhoodFees(parsed || {});
          } catch {}
        }

        const [prodsRes, ordersRes, analRes] = await Promise.all([
          apiRequest<{ products: Product[] }>('/api/merchant/products'),
          apiRequest<{ orders: SubOrder[] }>('/api/merchant/orders'),
          apiRequest<{ analytics: any }>('/api/merchant/analytics')
        ]);

        setProducts(prodsRes.products || []);
        const loadedOrders = ordersRes.orders || [];
        const pendingCount = loadedOrders.filter(o => o.status === 'pending').length;
        if (prevPendingOrdersCount.current !== -1 && pendingCount > prevPendingOrdersCount.current && soundEnabled) {
          playNewOrderChime();
        }
        prevPendingOrdersCount.current = pendingCount;
        setOrders(loadedOrders);
        setAnalytics(analRes.analytics || null);
      } else {
        setProducts([]);
        setOrders([]);
        setAnalytics(null);
      }
    } catch (err) {
      console.error('Failed to load merchant data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMerchantData();
  }, []);

  // Real-time polling for new incoming orders every 20 seconds with audio chime
  useEffect(() => {
    if (!store?.id) return;
    const interval = setInterval(() => {
      apiRequest<{ orders: SubOrder[] }>('/api/merchant/orders')
        .then(res => {
          if (res && res.orders) {
            const pendingCount = res.orders.filter(o => o.status === 'pending').length;
            if (prevPendingOrdersCount.current !== -1 && pendingCount > prevPendingOrdersCount.current && soundEnabled) {
              playNewOrderChime();
            }
            prevPendingOrdersCount.current = pendingCount;
            setOrders(res.orders);
          }
        })
        .catch(() => {});
    }, 20000);
    return () => clearInterval(interval);
  }, [store?.id, soundEnabled]);

  const handleUpdateOrderStatus = async (subOrderId: string, status: string) => {
    try {
      await apiRequest(`/api/merchant/orders/${subOrderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      await loadMerchantData();
    } catch (err: any) {
      alert(err?.message || 'Falha ao atualizar status.');
    }
  };

  const handlePrintOrder = (order: any) => {
    const printWindow = window.open('', '_blank', 'width=450,height=600');
    if (!printWindow) return;
    const storeName = store?.name || 'Shop da Cidade';
    const orderCode = order.sub_order_code || order.id;
    const dateFormatted = new Date(order.created_at).toLocaleString('pt-BR');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comanda #${orderCode}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { font-family: monospace; font-size: 12px; margin: 8px; color: #000; width: 72mm; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .dashed { border-top: 1px dashed #000; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 14px;">${storeName}</div>
          <div class="center">Shop da Cidade • Canaã dos Carajás - PA</div>
          <div class="dashed"></div>
          <div><strong>PEDIDO: #${orderCode}</strong></div>
          <div>Data/Hora: ${dateFormatted}</div>
          <div>Status: ${order.status.toUpperCase()}</div>
          <div class="dashed"></div>
          <div class="bold">VALORES:</div>
          <div style="display:flex; justify-content:space-between; margin-top: 4px;">
            <span>Subtotal Produtos:</span>
            <span>R$ ${(order.store_subtotal || 0).toFixed(2)}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>Taxa de Entrega:</span>
            <span>R$ ${(order.delivery_fee || 0).toFixed(2)}</span>
          </div>
          <div class="dashed"></div>
          <div style="display:flex; justify-content:space-between; font-size: 13px; font-weight: bold;">
            <span>TOTAL:</span>
            <span>R$ ${((order.store_subtotal || 0) + (order.delivery_fee || 0)).toFixed(2)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size: 11px; margin-top: 4px;">
            <span>Líquido Loja:</span>
            <span>R$ ${(order.store_net_amount || 0).toFixed(2)}</span>
          </div>
          <div class="dashed"></div>
          <div class="center" style="font-size: 10px; margin-top: 10px;">
            Agradecemos a sua preferência!<br/>
            Shop da Cidade • Canaã dos Carajás
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleNotifyWhatsApp = (order: any) => {
    const storeName = store?.name || 'Shop da Cidade';
    const orderCode = order.sub_order_code || order.id;
    const total = formatBRL((order.store_subtotal || 0) + (order.delivery_fee || 0));
    const statusLabel = order.status === 'preparing' ? 'Em Preparo' : order.status === 'out_for_delivery' ? 'Saiu para Entrega' : 'Recebido';
    const text = encodeURIComponent(
      `Olá! Aqui é da loja *${storeName}* pelo Shop da Cidade (Canaã dos Carajás).\n` +
      `Seu pedido *#${orderCode}* no valor total de *${total}* foi atualizado!\n` +
      `Status atual: *${statusLabel}*.\n` +
      `Estamos cuidando de tudo com carinho para você!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCallVainabag = async (orderId: string) => {
    try {
      const res = await apiRequest<{ success: boolean; message: string; dispatch?: any }>('/api/deliveries/vainabag/dispatch', {
        method: 'POST',
        body: JSON.stringify({ sub_order_id: orderId })
      });
      alert(res.message || 'Entrega solicitada à Vainabag com sucesso!');
      await loadMerchantData();
    } catch (err: any) {
      alert(err?.message || 'Falha ao solicitar entregador Vainabag.');
    }
  };

  const handleOpenProdModal = (prod?: Product) => {
    if (prod) {
      setEditingProd(prod);
      setProdName(prod.name);
      setProdCategory(prod.category_id);
      setProdPrice(prod.price.toString());
      setProdPromoPrice(prod.promotional_price ? prod.promotional_price.toString() : '');
      setProdStock(prod.stock_quantity.toString());
      setProdSku(prod.sku || '');
      setProdDesc(prod.description || '');
      setProdImage(prod.image_url || '');
    } else {
      setEditingProd(null);
      setProdName('');
      setProdCategory('cat_construcao');
      setProdPrice('');
      setProdPromoPrice('');
      setProdStock('15');
      setProdSku('PRD-' + Math.floor(1000 + Math.random() * 9000));
      setProdDesc('');
      setProdImage('https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&h=600&fit=crop&q=80');
    }
    setIsProdModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProd(true);
    try {
      const payload = {
        name: prodName,
        category_id: prodCategory,
        price: parseFloat(prodPrice),
        promotional_price: prodPromoPrice ? parseFloat(prodPromoPrice) : null,
        stock_quantity: parseInt(prodStock),
        sku: prodSku,
        description: prodDesc,
        image_url: prodImage
      };

      if (editingProd) {
        await apiRequest(`/api/merchant/products/${editingProd.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiRequest('/api/merchant/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      setIsProdModalOpen(false);
      await loadMerchantData();
    } catch (err: any) {
      alert(err?.message || 'Falha ao salvar produto.');
    } finally {
      setIsSavingProd(false);
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!confirm('Deseja realmente desativar este produto do seu catálogo?')) return;
    try {
      await apiRequest(`/api/merchant/products/${prodId}`, { method: 'DELETE' });
      await loadMerchantData();
    } catch (err: any) {
      alert(err?.message || 'Falha ao excluir produto.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSaveSuccessNotice(false);
    try {
      const res = await apiRequest<{ store: Store }>('/api/merchant/store', {
        method: 'PUT',
        body: JSON.stringify({
          ...settingsForm,
          delivery_fee_base: parseFloat(settingsForm.delivery_fee_base),
          free_delivery_minimum: parseFloat(settingsForm.free_delivery_minimum),
          is_open: settingsForm.is_open ? 1 : 0,
          opening_hours_json: JSON.stringify(weeklySchedule),
          neighborhood_fees_json: JSON.stringify(neighborhoodFees)
        })
      });
      if (res && res.store) {
        setStore(res.store);
      }
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
      await loadMerchantData();
    } catch (err: any) {
      alert(err?.message || 'Falha ao atualizar dados da loja.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // 2FA Handlers for Merchant
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
      setTwoFactorError(err?.message || 'Falha ao gerar credencial 2FA.');
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
      setTwoFactorSuccess(res.message || 'Verificação em Duas Etapas ativada com sucesso!');
      setTimeout(() => {
        setIs2FAModalOpen(false);
        window.location.reload();
      }, 2000);
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

  const storeFullUrl = typeof window !== 'undefined' && store ? `${window.location.origin}/loja/${store.slug}` : '';

  const handleCopyStoreLink = () => {
    if (storeFullUrl && navigator.clipboard) {
      navigator.clipboard.writeText(storeFullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Carregando painel do lojista...</span>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
          <StoreIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Acesso ao Painel do Lojista</h2>
        <p className="text-xs text-slate-500">
          Você precisa estar conectado com uma conta de comerciante parceiro para gerenciar seus produtos, pedidos e loja virtual.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition"
          >
            Fazer Login como Lojista
          </button>
          <button
            onClick={() => onNavigate('partner-register')}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Quero Cadastrar Minha Loja
          </button>
        </div>
      </div>
    );
  }

  // Logged in but without a registered store
  if (!store) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
          <StoreIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Você ainda não possui uma loja</h2>
        <p className="text-xs text-slate-500">
          Cadastre seu estabelecimento comercial no Shop da Cidade para ter seu catálogo de produtos, pedidos online e entregas em Canaã dos Carajás.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => onNavigate('partner-register')}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
          >
            Cadastrar Minha Loja Agora
          </button>
          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Já tenho uma loja cadastrada (Fazer Login)
          </button>
        </div>
      </div>
    );
  }

  const primaryTheme = store.theme_color_primary || '#fdca04';
  const secondaryTheme = store.theme_color_secondary || '#0f172a';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={() => onNavigate('home')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 cursor-pointer transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Início
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Painel do Lojista: <span style={{ color: primaryTheme === '#fdca04' ? '#d97706' : primaryTheme }}>{store.name}</span>
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              store.is_open ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {store.is_open ? 'Aberto para Pedidos' : 'Fechado no Momento'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Canaã dos Carajás - PA • Bairro {store.neighborhood}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Direct link to store */}
          <button
            type="button"
            onClick={() => onNavigate('store-detail', store.slug)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver Minha Loja</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenProdModal()}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Store Cover and Profile Badge Card */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900">
        <div className="h-32 sm:h-44 relative overflow-hidden bg-slate-950">
          <img
            src={store.banner_url || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=400&fit=crop&q=80'}
            alt="Capa da Loja"
            className="w-full h-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        </div>
        <div className="p-4 sm:px-6 -mt-10 sm:-mt-12 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-slate-900/95 backdrop-blur-xs border-t border-white/5">
          <div className="flex items-center gap-3.5">
            <img
              src={store.logo_url || 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=200&h=200&fit=crop&q=80'}
              alt={store.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-slate-900 shadow-xl bg-slate-800 shrink-0"
            />
            <div className="text-white space-y-0.5">
              <span
                style={{ backgroundColor: `${primaryTheme}25`, color: primaryTheme, borderColor: `${primaryTheme}50` }}
                className="px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider inline-block mb-0.5"
              >
                Loja Oficial
              </span>
              <h3 className="font-black text-base sm:text-lg leading-tight">{store.name}</h3>
              <p className="text-xs text-slate-300">Foto de Perfil & Imagem de Capa Atuais</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <Camera className="w-4 h-4" />
            <span>Editar Fotos & Capa</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 text-xs font-bold text-slate-600 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'orders' ? 'border-amber-500 text-slate-950 font-black' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4 text-amber-500" />
          Pedidos ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'products' ? 'border-amber-500 text-slate-950 font-black' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-amber-500" />
          Produtos & Estoque ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('store-url')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'store-url' ? 'border-amber-500 text-slate-950 font-black' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Globe className="w-4 h-4 text-amber-500" />
          URL & Divulgação da Loja
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'analytics' ? 'border-amber-500 text-slate-950 font-black' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-amber-500" />
          Métricas de Vendas
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'settings' ? 'border-amber-500 text-slate-950 font-black' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Camera className="w-4 h-4 text-amber-500" />
          Perfil, Fotos & Cores
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'security' ? 'border-amber-500 text-slate-950 font-black' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Segurança & 2FA
          {user?.two_factor_enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" title="2FA Ativo" />
          )}
        </button>
      </div>

      {/* TAB: STORE URL & DIVULGAÇÃO (Dedicated link for each merchant) */}
      {activeTab === 'store-url' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-slate-800 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  Link Exclusivo da Sua Loja
                </span>
                <h2 className="text-2xl font-black tracking-tight mt-2">
                  Cada comerciante possui uma URL própria no Shop da Cidade
                </h2>
                <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
                  Seus clientes entram diretamente no seu catálogo com suas cores personalizadas, logotipo e produtos exclusivos. Você pode enviar pelo WhatsApp ou imprimir o QR Code para colocar no balcão e embalagens!
                </p>
              </div>

              {/* QR Code Quick Display */}
              <div className="shrink-0 flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <QRCodeDisplay value={storeFullUrl} size={130} />
                <span className="text-[10px] text-slate-400 mt-2 font-mono">/loja/{store.slug}</span>
              </div>
            </div>

            {/* Direct URL input bar with Copy & Open */}
            <div className="p-3 bg-white/10 rounded-2xl border border-white/15 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full flex items-center gap-2 px-3 py-2 bg-black/40 rounded-xl font-mono text-xs text-amber-300 break-all select-all">
                <LinkIcon className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{storeFullUrl}</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={handleCopyStoreLink}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('store-detail', store.slug)}
                  className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir Loja</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Share Button */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Olá! Conheça o catálogo virtual da ${store.name} no Shop da Cidade: ${storeFullUrl}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-md transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Compartilhar Catálogo no WhatsApp dos Clientes</span>
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Folha com QR Code da Loja</span>
              </button>
            </div>
          </div>

          {/* Architecture Explanation Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-500" />
              Como funciona o link exclusivo e domínios próprios?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="font-bold text-slate-900 block">1. URL Permanente da Loja (/loja/slug)</span>
                <p>
                  Cada lojista define seu slug amigável (por exemplo: <code className="text-amber-700 font-bold">padaria-central</code>). Quando qualquer pessoa clica nesse link, a plataforma abre direto a sua vitrine com o seu logotipo, horário, banners e as cores que você escolheu.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="font-bold text-slate-900 block">2. Subdomínio e Domínio Próprio (.com.br)</span>
                <p>
                  Se você tiver um domínio registrado (ex: <code className="text-amber-700 font-bold">minhaloja.com.br</code>) ou quiser usar <code className="text-amber-700 font-bold">minhaloja.shopdacidade.com.br</code>, basta criar um apontamento <strong>CNAME</strong> no seu provedor DNS para o Shop da Cidade. O sistema mapeia o endereço automaticamente!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>Gerenciador de Pedidos</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Conectado em tempo real" />
              </h3>
              <p className="text-xs text-slate-500">Monitorado e atualizado automaticamente a cada 20 segundos</p>
            </div>

            {/* Audio Alert Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('merchant_sound_enabled', String(next));
                  }
                  if (next) playNewOrderChime();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                  soundEnabled
                    ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
                title={soundEnabled ? 'Alarme sonoro ativado para novos pedidos' : 'Som desativado'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-amber-600 animate-pulse" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <span>Alerta Sonoro: {soundEnabled ? 'Ativado' : 'Silenciado'}</span>
              </button>

              <button
                type="button"
                onClick={() => playNewOrderChime()}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Tocar som de teste da campainha"
              >
                <Bell className="w-3.5 h-3.5 text-slate-500" />
                <span>Testar Alarme</span>
              </button>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white border border-slate-200 p-8 shadow-xs">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">Nenhum pedido recebido ainda</h4>
              <p className="text-xs text-slate-500 mt-1">Divulgue o link da sua loja para receber seus primeiros pedidos em Canaã.</p>
              <button
                type="button"
                onClick={() => setActiveTab('store-url')}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
              >
                Ver Link e Divulgar
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              {orders.map(order => (
                <div key={order.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-slate-900">{order.sub_order_code || order.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {order.status === 'pending' ? 'Novo Pedido' :
                         order.status === 'preparing' ? 'Em Preparo' :
                         order.status === 'ready_for_pickup' ? 'Pronto para Retirada' :
                         order.status === 'out_for_delivery' ? 'Saiu para Entrega' :
                         order.status === 'delivered' ? 'Entregue' : order.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Valor: <strong className="text-slate-900">{formatBRL(order.store_subtotal + (order.delivery_fee || 0))}</strong></span>
                      <span>• Repasse Loja: <strong className="text-emerald-700">{formatBRL(order.store_net_amount)}</strong></span>
                      <span>• {formatDateBR(order.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Thermal Receipt Print Button */}
                    <button
                      type="button"
                      onClick={() => handlePrintOrder(order)}
                      title="Imprimir Comanda Térmica (58mm/80mm)"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* WhatsApp notification button */}
                    <button
                      type="button"
                      onClick={() => handleNotifyWhatsApp(order)}
                      title="Notificar Cliente via WhatsApp"
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>

                    {/* Call Vainabag delivery partner button */}
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => handleCallVainabag(order.id)}
                        title="Solicitar Entregador Vainabag"
                        className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Vainabag</span>
                      </button>
                    )}

                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Aceitar & Preparar
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'out_for_delivery')}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Despachar Entrega
                      </button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Confirmar Entrega
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-900">Catálogo de Produtos Cadastrados</h3>
            <button
              onClick={() => handleOpenProdModal()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Novo Produto
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(prod => (
              <div key={prod.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex gap-3">
                <img src={prod.image_url} alt="" className="w-20 h-20 rounded-xl object-cover bg-slate-100 shrink-0" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{prod.name}</h4>
                    <span className="text-xs font-black text-emerald-700 block mt-0.5">{formatBRL(prod.price)}</span>
                    <span className="text-[10px] text-slate-400">Estoque: {prod.stock_quantity} un</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleOpenProdModal(prod)}
                      className="text-slate-600 hover:text-slate-900 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="text-rose-600 hover:text-rose-700 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total de Pedidos</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{analytics?.totalOrders || 0}</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Faturamento Bruto</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">{formatBRL(analytics?.grossSales || 0)}</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Ticket Médio</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {formatBRL(analytics?.totalOrders ? analytics.grossSales / analytics.totalOrders : 0)}
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Comissão da Plataforma</span>
              <span className="text-2xl font-black text-slate-500 mt-1 block">8%</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SETTINGS & VISUAL PERSONALIZATION (Merchant Custom Colors & Identity) */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl animate-in fade-in duration-200">
          {saveSuccessNotice && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Configurações e cores da loja salvas com sucesso!</span>
            </div>
          )}

          {/* Section: Store Profile & Cover Images */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Imagens da Loja: Foto de Perfil & Capa Superior</h3>
                <p className="text-xs text-slate-500">
                  Envie fotos do seu celular/computador, selecione modelos prontos de alta qualidade ou cole links para o logotipo e a fachada da sua loja.
                </p>
              </div>
            </div>

            {/* Hidden file inputs for Logo & Banner */}
            <input
              type="file"
              ref={logoInputRef}
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploadingLogo(true);
                try {
                  const resized = await compressAndResizeImage(file, 400, 400, 0.88);
                  setSettingsForm(prev => ({ ...prev, logo_url: resized }));
                } catch (err: any) {
                  alert('Falha ao processar foto de perfil: ' + (err?.message || 'Erro'));
                } finally {
                  setIsUploadingLogo(false);
                  if (e.target) e.target.value = '';
                }
              }}
            />

            <input
              type="file"
              ref={bannerInputRef}
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploadingBanner(true);
                try {
                  const resized = await compressAndResizeImage(file, 1200, 480, 0.85);
                  setSettingsForm(prev => ({ ...prev, banner_url: resized }));
                } catch (err: any) {
                  alert('Falha ao processar imagem de capa: ' + (err?.message || 'Erro'));
                } finally {
                  setIsUploadingBanner(false);
                  if (e.target) e.target.value = '';
                }
              }}
            />

            {/* 1. FOTO DE PERFIL / LOGOTIPO */}
            <div className="border border-slate-100 bg-slate-50/70 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 font-black text-xs flex items-center justify-center">1</span>
                  <label className="text-sm font-bold text-slate-900">Foto de Perfil / Logotipo da Loja</label>
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 self-start sm:self-auto text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setLogoMode('upload')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${logoMode === 'upload' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Enviar Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoMode('presets')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${logoMode === 'presets' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Modelos Prontos
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoMode('url')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${logoMode === 'url' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Link (URL)
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Logo Preview Avatar */}
                <div className="relative group shrink-0">
                  <img
                    src={settingsForm.logo_url || 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=300&h=300&fit=crop&q=80'}
                    alt="Logo Preview"
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer backdrop-blur-xs text-[10px] font-bold"
                  >
                    <Camera className="w-5 h-5 mb-1 text-amber-300" />
                    <span>Alterar</span>
                  </button>
                </div>

                <div className="flex-1 w-full space-y-2">
                  {logoMode === 'upload' && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="w-full py-2.5 px-4 rounded-xl bg-white border border-dashed border-amber-400 hover:border-amber-500 hover:bg-amber-50/50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4 text-amber-500" />
                        <span>{isUploadingLogo ? 'Processando foto...' : 'Escolher Foto do Celular ou Computador'}</span>
                      </button>
                      <p className="text-[11px] text-slate-500 text-center sm:text-left">
                        Recomendado: imagem quadrada (ex: 500x500px). JPG, PNG ou WebP.
                      </p>
                    </div>
                  )}

                  {logoMode === 'presets' && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-600 mb-1.5">Clique em um modelo comercial para sua loja:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {STORE_LOGO_PRESETS.map((p) => (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => setSettingsForm({ ...settingsForm, logo_url: p.url })}
                            className={`p-1.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer bg-white ${
                              settingsForm.logo_url === p.url ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <img src={p.url} alt={p.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                            <span className="text-[10px] font-bold text-slate-800 truncate">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {logoMode === 'url' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Link direto da imagem (URL da internet):</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={settingsForm.logo_url}
                          onChange={e => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
                          placeholder="https://exemplo.com/minha-logo.png"
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                        />
                        {settingsForm.logo_url && (
                          <button
                            type="button"
                            onClick={() => setSettingsForm({ ...settingsForm, logo_url: '' })}
                            className="p-2 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                            title="Limpar link"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. IMAGEM DE CAPA / BANNER SUPERIOR */}
            <div className="border border-slate-100 bg-slate-50/70 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 font-black text-xs flex items-center justify-center">2</span>
                  <label className="text-sm font-bold text-slate-900">Imagem de Capa Superior da Loja (Banner)</label>
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 self-start sm:self-auto text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setBannerMode('upload')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${bannerMode === 'upload' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Enviar Capa
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerMode('presets')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${bannerMode === 'presets' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Capas Prontas
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerMode('url')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${bannerMode === 'url' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Link (URL)
                  </button>
                </div>
              </div>

              {/* Banner Preview Frame */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-slate-900 group">
                <div className="h-32 sm:h-44 relative overflow-hidden bg-slate-950">
                  <img
                    src={settingsForm.banner_url || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=400&fit=crop&q=80'}
                    alt="Banner Preview"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={isUploadingBanner}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs transition cursor-pointer border border-white/20 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isUploadingBanner ? 'Carregando...' : 'Trocar Imagem de Capa'}</span>
                  </button>
                </div>

                <div className="absolute bottom-3 left-3 text-white text-xs font-bold flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                    Capa Ativa
                  </span>
                  <span className="text-[11px] text-slate-200 hidden sm:inline">Exibida no topo da sua página oficial</span>
                </div>
              </div>

              {bannerMode === 'upload' && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={isUploadingBanner}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-white border border-dashed border-amber-400 hover:border-amber-500 hover:bg-amber-50/50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 text-amber-500" />
                    <span>{isUploadingBanner ? 'Processando imagem...' : 'Escolher Capa do Celular ou Computador'}</span>
                  </button>
                  <p className="text-[11px] text-slate-500">
                    Recomendado: imagem panorâmica retangular (ex: 1200x450px).
                  </p>
                </div>
              )}

              {bannerMode === 'presets' && (
                <div>
                  <p className="text-[11px] font-bold text-slate-600 mb-2">Selecione uma imagem de alta qualidade para a fachada da sua loja:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {STORE_BANNER_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, banner_url: p.url })}
                        className={`rounded-xl overflow-hidden border text-left transition cursor-pointer group relative ${
                          settingsForm.banner_url === p.url ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="h-16 relative overflow-hidden bg-slate-100">
                          <img src={p.url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        </div>
                        <div className="p-1.5 bg-white">
                          <span className="text-[10px] font-bold text-slate-800 block truncate">{p.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {bannerMode === 'url' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Link direto da capa (URL da internet):</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={settingsForm.banner_url}
                      onChange={e => setSettingsForm({ ...settingsForm, banner_url: e.target.value })}
                      placeholder="https://exemplo.com/banner-loja.jpg"
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    {settingsForm.banner_url && (
                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, banner_url: '' })}
                        className="p-2 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        title="Limpar link"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. PRÉ-VISUALIZAÇÃO COMPLETA AO VIVO */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                Como os clientes em Canaã dos Carajás verão sua loja:
              </span>
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-950 relative">
                <div className="h-28 sm:h-36 relative overflow-hidden">
                  <img
                    src={settingsForm.banner_url || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=400&fit=crop&q=80'}
                    alt="Preview Final Banner"
                    className="w-full h-full object-cover opacity-75"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                </div>
                <div className="p-4 sm:px-6 -mt-10 sm:-mt-12 relative z-10 flex items-end gap-3.5 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
                  <img
                    src={settingsForm.logo_url || 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=200&h=200&fit=crop&q=80'}
                    alt="Preview Final Logo"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-3 border-slate-900 shadow-xl bg-slate-800 shrink-0"
                  />
                  <div className="text-white space-y-0.5">
                    <span
                      style={{ backgroundColor: `${settingsForm.theme_color_primary}30`, color: settingsForm.theme_color_primary }}
                      className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-white/10"
                    >
                      Loja Oficial
                    </span>
                    <h4 className="font-extrabold text-sm sm:text-base leading-tight">
                      {settingsForm.name || 'Nome da Sua Loja'}
                    </h4>
                    <p className="text-[10px] text-slate-300">
                      Bairro {settingsForm.neighborhood} • Canaã dos Carajás, PA
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Visual Customizer */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Personalização Visual da Sua Loja</h3>
                <p className="text-xs text-slate-500">
                  Defina a identidade visual única que seus clientes verão na página da sua loja (<code className="font-mono text-amber-700">/loja/{settingsForm.slug}</code>).
                </p>
              </div>
            </div>

            {/* Quick Color Presets */}
            <div>
              <label className="block font-bold text-slate-700 mb-2">Paletas de Cores Prontas para a Loja</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COLOR_PRESETS.map(p => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setSettingsForm({
                      ...settingsForm,
                      theme_color_primary: p.primary,
                      theme_color_secondary: p.secondary
                    })}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 text-left flex items-center gap-2 transition cursor-pointer bg-slate-50"
                  >
                    <div className="flex -space-x-1">
                      <span style={{ backgroundColor: p.primary }} className="w-4 h-4 rounded-full border border-white shadow-xs" />
                      <span style={{ backgroundColor: p.secondary }} className="w-4 h-4 rounded-full border border-white shadow-xs" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cor Primária da Loja (Botões, Destaques)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settingsForm.theme_color_primary}
                    onChange={e => setSettingsForm({ ...settingsForm, theme_color_primary: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={settingsForm.theme_color_primary}
                    onChange={e => setSettingsForm({ ...settingsForm, theme_color_primary: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cor Secundária da Loja (Fundo do Cabeçalho)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settingsForm.theme_color_secondary}
                    onChange={e => setSettingsForm({ ...settingsForm, theme_color_secondary: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={settingsForm.theme_color_secondary}
                    onChange={e => setSettingsForm({ ...settingsForm, theme_color_secondary: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Custom Announcement Banner */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Aviso Promocional no Topo da Sua Loja (Opcional)
              </label>
              <input
                type="text"
                value={settingsForm.custom_announcement}
                onChange={e => setSettingsForm({ ...settingsForm, custom_announcement: e.target.value })}
                placeholder="Ex: Entregas grátis acima de R$ 50 para o Centro ou Promoção de Fim de Semana!"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            {/* Live Store Banner Preview */}
            <div className="pt-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                Pré-visualização do Topo da Sua Loja com Suas Cores:
              </span>
              <div
                style={{ backgroundColor: settingsForm.theme_color_secondary }}
                className="p-4 rounded-2xl text-white shadow-md space-y-3 transition-colors"
              >
                {settingsForm.custom_announcement && (
                  <div
                    style={{ backgroundColor: settingsForm.theme_color_secondary, color: settingsForm.theme_color_primary }}
                    className="text-[11px] font-bold py-1 px-2 text-center rounded-lg border border-white/10"
                  >
                    📢 {settingsForm.custom_announcement}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {settingsForm.logo_url ? (
                    <img
                      src={settingsForm.logo_url}
                      alt={settingsForm.name}
                      className="w-12 h-12 rounded-xl object-cover border border-white/30 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/20 border-2 border-white/30 flex items-center justify-center font-black text-lg">
                      {settingsForm.name ? settingsForm.name[0] : 'L'}
                    </div>
                  )}
                  <div>
                    <h4 className="font-extrabold text-sm">{settingsForm.name || 'Nome da Sua Loja'}</h4>
                    <span className="text-[10px] text-slate-300">Canaã dos Carajás, PA</span>
                  </div>
                  <div className="ml-auto">
                    <button
                      type="button"
                      style={{ backgroundColor: settingsForm.theme_color_primary, color: '#0f172a' }}
                      className="px-3 py-1.5 rounded-lg text-xs font-black shadow-xs"
                    >
                      Botão na Loja
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: General Store Information */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 tracking-tight">Informações Cadastrais da Loja</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Fantasia da Loja *</label>
                <input
                  type="text"
                  required
                  value={settingsForm.name}
                  onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Categoria da Loja no Portal *</label>
                <select
                  required
                  value={settingsForm.category}
                  onChange={e => setSettingsForm({ ...settingsForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  {STORE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Define em qual categoria sua loja aparece na vitrine e filtros de Canaã.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Slug Amigável (/loja/seu-slug) *</label>
                <input
                  type="text"
                  required
                  value={settingsForm.slug}
                  onChange={e => setSettingsForm({ ...settingsForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-') })}
                  placeholder="ex: padaria-central"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp Comercial *</label>
                <input
                  type="text"
                  required
                  value={settingsForm.whatsapp}
                  onChange={e => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Telefone Fixo / Adicional</label>
                <input
                  type="text"
                  value={settingsForm.phone}
                  onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instagram (@usuario)</label>
                <input
                  type="text"
                  value={settingsForm.instagram}
                  onChange={e => setSettingsForm({ ...settingsForm, instagram: e.target.value })}
                  placeholder="@sualoja"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bairro em Canaã dos Carajás *</label>
                <select
                  value={settingsForm.neighborhood}
                  onChange={e => setSettingsForm({ ...settingsForm, neighborhood: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  {CANAA_NEIGHBORHOODS.map(b => (
                    <option key={b} value={b}>Bairro {b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rua / Avenida</label>
                <input
                  type="text"
                  value={settingsForm.street}
                  onChange={e => setSettingsForm({ ...settingsForm, street: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Número</label>
                <input
                  type="text"
                  value={settingsForm.number}
                  onChange={e => setSettingsForm({ ...settingsForm, number: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Taxa de Entrega Base (R$)</label>
                <input
                  type="number"
                  step="0.50"
                  value={settingsForm.delivery_fee_base}
                  onChange={e => setSettingsForm({ ...settingsForm, delivery_fee_base: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Frete Grátis Acima de (R$)</label>
                <input
                  type="number"
                  value={settingsForm.free_delivery_minimum}
                  onChange={e => setSettingsForm({ ...settingsForm, free_delivery_minimum: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tempo Médio Estimado</label>
                <input
                  type="text"
                  value={settingsForm.delivery_time_min}
                  onChange={e => setSettingsForm({ ...settingsForm, delivery_time_min: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Apresentação da Loja</label>
              <textarea
                rows={3}
                value={settingsForm.description}
                onChange={e => setSettingsForm({ ...settingsForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={settingsForm.is_open}
                  onChange={e => setSettingsForm({ ...settingsForm, is_open: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <span>Estabelecimento Aberto para Receber Pedidos Agora (Chave Geral)</span>
              </label>
            </div>
          </div>

          {/* Section: Weekly Operating Schedule (Horário de Funcionamento Automático) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Horário de Funcionamento Semanal</h3>
                  <p className="text-xs text-slate-500">
                    O sistema identifica automaticamente se a loja está aberta ou fechada com base na hora e dia da semana.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setWeeklySchedule({
                    segunda: { isOpen: true, from: '08:00', to: '22:00' },
                    terca: { isOpen: true, from: '08:00', to: '22:00' },
                    quarta: { isOpen: true, from: '08:00', to: '22:00' },
                    quinta: { isOpen: true, from: '08:00', to: '22:00' },
                    sexta: { isOpen: true, from: '08:00', to: '22:00' },
                    sabado: { isOpen: true, from: '08:00', to: '22:00' },
                    domingo: { isOpen: false, from: '08:00', to: '14:00' }
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer self-start sm:self-auto"
              >
                Preencher Padrão (Seg a Sáb 08h-22h)
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {(Object.keys(DAY_NAMES) as Array<keyof WeeklySchedule>).map(dayKey => {
                const day = weeklySchedule[dayKey];
                return (
                  <div key={dayKey} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 w-40">
                      <input
                        type="checkbox"
                        checked={day.isOpen}
                        onChange={e => {
                          setWeeklySchedule({
                            ...weeklySchedule,
                            [dayKey]: { ...day, isOpen: e.target.checked }
                          });
                        }}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                        id={`check_${dayKey}`}
                      />
                      <label htmlFor={`check_${dayKey}`} className="font-bold text-slate-800 cursor-pointer">
                        {DAY_NAMES[dayKey]}
                      </label>
                    </div>

                    {day.isOpen ? (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Das</span>
                        <input
                          type="time"
                          value={day.from}
                          onChange={e => {
                            setWeeklySchedule({
                              ...weeklySchedule,
                              [dayKey]: { ...day, from: e.target.value }
                            });
                          }}
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs"
                        />
                        <span className="text-slate-500">às</span>
                        <input
                          type="time"
                          value={day.to}
                          onChange={e => {
                            setWeeklySchedule({
                              ...weeklySchedule,
                              [dayKey]: { ...day, to: e.target.value }
                            });
                          }}
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs"
                        />
                      </div>
                    ) : (
                      <span className="text-slate-400 font-semibold italic">Fechado o dia todo</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Canaã dos Carajás Neighborhood Delivery Fees */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Tabela de Taxa de Entrega por Bairro em Canaã dos Carajás
                </h3>
                <p className="text-xs text-slate-500">
                  Defina valores diferenciados por bairro (ex: Centro R$ 5,00, Vale Canaã R$ 12,00). Deixe em branco para usar a Taxa Base padrão de {formatBRL(parseFloat(settingsForm.delivery_fee_base) || 7)}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {CANAA_NEIGHBORHOODS.map(nh => (
                <div key={nh} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="block font-bold text-xs text-slate-800">Bairro {nh}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      placeholder={settingsForm.delivery_fee_base}
                      value={neighborhoodFees[nh] || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setNeighborhoodFees(prev => {
                          const updated = { ...prev };
                          if (val === '') {
                            delete updated[nh];
                          } else {
                            updated[nh] = val;
                          }
                          return updated;
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingSettings}
            className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSavingSettings ? 'Salvando...' : 'Salvar Personalização e Dados da Loja'}
          </button>
        </form>
      )}

      {/* TAB: SECURITY & 2FA */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-3xl animate-in fade-in duration-200">
          {/* 2FA Protection Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${user?.two_factor_enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Autenticação em Duas Etapas (2FA TOTP)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Padrão bancário internacional compatível com Google Authenticator, Authy e Microsoft Authenticator.
                  </p>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                user?.two_factor_enabled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {user?.two_factor_enabled ? 'Protegido com 2FA' : 'Não Ativado'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-slate-800">
                {user?.two_factor_enabled
                  ? 'Sua conta de lojista está blindada. Mesmo que alguém descubra a sua senha, não conseguirá acessar seu painel sem o código temporário de 6 dígitos gerado no seu celular.'
                  : 'Ative o 2FA para proteger seus produtos, preços, pedidos e dados bancários da loja em Canaã dos Carajás. Ao fazer login, será solicitado um código dinâmico gerado no seu smartphone.'}
              </p>
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bloqueio anti-força-bruta automático após 5 tentativas incorretas (15 minutos).</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>8 códigos de emergência descartáveis caso você fique sem celular.</span>
              </div>
            </div>

            <div>
              {user?.two_factor_enabled ? (
                <button
                  type="button"
                  onClick={() => {
                    setDisablePassword('');
                    setDisable2FAError(null);
                    setIsDisable2FAModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Desativar Verificação em Duas Etapas</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpen2FASetup}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-md active:scale-95"
                >
                  <Key className="w-4 h-4" />
                  <span>Configurar 2FA no Celular (Escanear QR Code)</span>
                </button>
              )}
            </div>
          </div>

          {/* Cryptography & Session Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h4 className="font-bold text-sm text-slate-900">Camadas Ativas de Segurança no Painel</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-800 block">Hash PBKDF2</span>
                <p className="text-slate-500 text-[11px]">Sua senha nunca é armazenada em texto plano; usa salt exclusivo.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-800 block">Anti-Brute Force</span>
                <p className="text-slate-500 text-[11px]">Limite rígido de requisições por IP e conta de lojista.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-800 block">Sessão Segura</span>
                <p className="text-slate-500 text-[11px]">Tokens criptográficos efêmeros com renovação transparente.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA SETUP MODAL FOR MERCHANT */}
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
                  Configurar 2FA da Loja: {store.name}
                </h3>
                <p className="text-xs text-slate-400">Google Authenticator, Authy ou Apple Passwords</p>
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
                    Abra o <strong>Google Authenticator</strong> no seu celular, toque em <strong>+</strong> e escolha <strong>Escanear código QR</strong>.
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
                      onChange={e => setTwoFactorVerifyCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center font-mono text-xl tracking-[0.35em] text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIs2FAModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isActivating2FA || twoFactorVerifyCode.length !== 6}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black cursor-pointer transition shadow-md flex items-center gap-1.5"
                  >
                    {isActivating2FA ? 'Verificando...' : 'Ativar Proteção 2FA'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-8 text-center text-slate-400">
                <span className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin inline-block mb-2" />
                <p>Gerando chave criptográfica de segurança...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DISABLE 2FA MODAL FOR MERCHANT */}
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
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Desativar 2FA</h3>
                <p className="text-xs text-slate-400">Confirme sua senha de acesso</p>
              </div>
            </div>

            {disable2FAError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {disable2FAError}
              </div>
            )}

            <form onSubmit={handleDisable2FA} className="space-y-4 text-xs">
              <p className="text-slate-300">
                Para desativar a autenticação em duas etapas, confirme a sua senha cadastrada:
              </p>
              <div>
                <label className="block text-slate-400 mb-1">Senha atual:</label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={disablePassword}
                  onChange={e => setDisablePassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDisable2FAModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDisabling2FA || !disablePassword}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold cursor-pointer transition"
                >
                  {isDisabling2FA ? 'Desativando...' : 'Confirmar e Desativar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT MODAL */}
      {isProdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setIsProdModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-slate-900 mb-4">
              {editingProd ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={e => setProdName(e.target.value)}
                  placeholder="Ex: Cimento CP-II 50kg ou Fone Bluetooth"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preço Normal (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodPrice}
                    onChange={e => setProdPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preço Promocional (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodPromoPrice}
                    onChange={e => setProdPromoPrice(e.target.value)}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estoque Disponível *</label>
                  <input
                    type="number"
                    required
                    value={prodStock}
                    onChange={e => setProdStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código / SKU</label>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={e => setProdSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL da Imagem do Produto</label>
                <input
                  type="text"
                  value={prodImage}
                  onChange={e => setProdImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={prodDesc}
                  onChange={e => setProdDesc(e.target.value)}
                  placeholder="Detalhes técnicos, medidas e garantia..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProdModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingProd}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSavingProd ? 'Salvando...' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
