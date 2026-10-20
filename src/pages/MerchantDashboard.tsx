// Shop da Cidade - Merchant Dashboard with Custom Store Colors & Dedicated URL Management
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle,
  Clock,
  Copy,
  DollarSign,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  Globe,
  Instagram,
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
  ShoppingBag,
  Sliders,
  Store as StoreIcon,
  Trash2,
  TrendingUp,
  Truck,
  Upload,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { useAuth } from '../context/AuthContext';
import { apiRequest, CANAA_NEIGHBORHOODS, formatBRL, formatDateBR } from '../services/api';
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

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ onNavigate }) => {
  const { user, openAuthModal, quickSwitch } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SubOrder[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'store-url' | 'analytics' | 'settings'>('orders');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

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

  const loadMerchantData = async () => {
    setIsLoading(true);
    try {
      const storeRes = await apiRequest<{ store: Store | null }>('/api/merchant/store');
      setStore(storeRes.store || null);

      if (storeRes.store) {
        setSettingsForm({
          name: storeRes.store.name,
          slug: storeRes.store.slug,
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

        const [prodsRes, ordersRes, analRes] = await Promise.all([
          apiRequest<{ products: Product[] }>('/api/merchant/products'),
          apiRequest<{ orders: SubOrder[] }>('/api/merchant/orders'),
          apiRequest<{ analytics: any }>('/api/merchant/analytics')
        ]);

        setProducts(prodsRes.products || []);
        setOrders(ordersRes.orders || []);
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
          is_open: settingsForm.is_open ? 1 : 0
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
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition"
          >
            Cadastrar Minha Loja Agora
          </button>
          <button
            onClick={() => quickSwitch('lojista')}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Alternar para Loja de Demonstração
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
          <Palette className="w-4 h-4 text-amber-500" />
          Personalização & Cores da Loja
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
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-900">Histórico de Pedidos Recebidos</h3>
            <span className="text-xs text-slate-500">Atualizado em tempo real</span>
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
                  <div className="flex items-center gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs"
                      >
                        Aceitar & Preparar
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'out_for_delivery')}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs"
                      >
                        Despachar Entrega
                      </button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
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
                  <div className="w-12 h-12 rounded-xl bg-white/20 border-2 border-white/30 flex items-center justify-center font-black text-lg">
                    {settingsForm.name ? settingsForm.name[0] : 'L'}
                  </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <span>Estabelecimento Aberto para Receber Pedidos Agora</span>
              </label>
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
