// Shop da Cidade - Main App Component with Dynamic Theming & Direct Store URLs
import React, { useEffect, useState } from 'react';
import { BottomNavigation } from './components/BottomNavigation';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider, useSiteTheme } from './context/ThemeContext';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthModal } from './pages/AuthModal';
import { CartPage } from './pages/CartPage';
import { CourierDashboard } from './pages/CourierDashboard';
import { HomePage } from './pages/HomePage';
import { MerchantDashboard } from './pages/MerchantDashboard';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { MyQuotesPage } from './pages/MyQuotesPage';
import { MySchedulesPage } from './pages/MySchedulesPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { PartnerRegisterPage } from './pages/PartnerRegisterPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProviderDashboard } from './pages/ProviderDashboard';
import { ProviderDetailPage } from './pages/ProviderDetailPage';
import { ServicesPage } from './pages/ServicesPage';
import { StoreDetailPage } from './pages/StoreDetailPage';
import { StoresPage } from './pages/StoresPage';

function parseLocationToRoute(): { view: string; param?: string } {
  if (typeof window === 'undefined') return { view: 'home' };

  const pathname = window.location.pathname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.toLowerCase();

  // 1. Direct Store URL: /loja/:slug or /store/:slug
  const storePathMatch = pathname.match(/^\/(?:loja|store)\/([a-z0-9-_]+)/i);
  if (storePathMatch) {
    return { view: 'store-detail', param: storePathMatch[1] };
  }

  // 2. Hash store url: #/loja/:slug
  const storeHashMatch = hash.match(/^#\/?(?:loja|store)\/([a-z0-9-_]+)/i);
  if (storeHashMatch) {
    return { view: 'store-detail', param: storeHashMatch[1] };
  }

  // 3. Query param: ?loja=slug or ?store=slug
  const storeQuery = searchParams.get('loja') || searchParams.get('store');
  if (storeQuery) {
    return { view: 'store-detail', param: storeQuery };
  }

  // 4. Provider direct URL: /prestador/:slug
  const providerMatch = pathname.match(/^\/(?:prestador|provider)\/([a-z0-9-_]+)/i);
  if (providerMatch) {
    return { view: 'provider-detail', param: providerMatch[1] };
  }

  // 5. Hidden Admin / Painel route
  if (
    pathname.includes('/painel') ||
    pathname.includes('/admin') ||
    hash.includes('painel') ||
    hash.includes('admin') ||
    searchParams.has('painel') ||
    searchParams.has('admin')
  ) {
    return { view: 'admin' };
  }
  if (pathname.includes('/merchant') || pathname.includes('/lojista')) return { view: 'merchant' };
  if (pathname.includes('/prestador') || pathname.includes('/provider')) return { view: 'provider' };
  if (pathname.includes('/entregador') || pathname.includes('/courier')) return { view: 'courier' };
  if (pathname.includes('/parceiro') || pathname.includes('/cadastro')) return { view: 'partner-register' };
  if (pathname.includes('/lojas') || pathname.includes('/stores')) return { view: 'stores' };
  if (pathname.includes('/produtos') || pathname.includes('/products')) return { view: 'products' };
  if (pathname.includes('/servicos') || pathname.includes('/services')) return { view: 'services' };
  if (pathname.includes('/carrinho') || pathname.includes('/cart')) return { view: 'cart' };
  if (pathname.includes('/pedidos') || pathname.includes('/meus-pedidos')) return { view: 'my-orders' };

  return { view: 'home' };
}

function ShopCidadeApp() {
  const { settings } = useSiteTheme();
  const initialRoute = parseLocationToRoute();
  const [currentView, setCurrentView] = useState<string>(initialRoute.view);
  const [viewParam, setViewParam] = useState<string | undefined>(initialRoute.param);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Connectivity listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Browser navigation popstate listener
  useEffect(() => {
    const handlePopState = () => {
      const route = parseLocationToRoute();
      setCurrentView(route.view);
      setViewParam(route.param);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    setCurrentView(view);
    setViewParam(param);

    // Sync browser address bar with friendly URLs
    let newPath = '/';
    if (view === 'store-detail' && param) {
      newPath = `/loja/${param}`;
    } else if (view === 'provider-detail' && param) {
      newPath = `/prestador/${param}`;
    } else if (view === 'stores') {
      newPath = param ? `/lojas?categoria=${encodeURIComponent(param)}` : '/lojas';
    } else if (view === 'products') {
      newPath = param ? `/produtos?busca=${encodeURIComponent(param)}` : '/produtos';
    } else if (view === 'services') {
      newPath = '/servicos';
    } else if (view === 'cart') {
      newPath = '/carrinho';
    } else if (view === 'my-orders') {
      newPath = '/pedidos';
    } else if (view === 'merchant') {
      newPath = '/merchant';
    } else if (view === 'provider') {
      newPath = '/prestador';
    } else if (view === 'courier') {
      newPath = '/entregador';
    } else if (view === 'admin') {
      newPath = '/painel';
    } else if (view === 'partner-register') {
      newPath = '/parceiro';
    }

    try {
      if (window.location.pathname !== newPath) {
        window.history.pushState({ view, param }, '', newPath);
      }
    } catch {
      // Safe fallback if history API is restricted in sandboxes
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      handleNavigate('products', searchQuery);
    }
  };

  const isStoreDetailPage = currentView === 'store-detail';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {!isStoreDetailPage && (
        <Header
          currentView={currentView}
          onNavigate={handleNavigate}
          selectedNeighborhood={selectedNeighborhood}
          onSelectNeighborhood={setSelectedNeighborhood}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
        />
      )}

      <main className="flex-1 pb-16 md:pb-0">
        {currentView === 'home' && (
          <HomePage onNavigate={handleNavigate} selectedNeighborhood={selectedNeighborhood} />
        )}

        {currentView === 'stores' && (
          <StoresPage
            initialCategory={viewParam}
            onNavigate={handleNavigate}
            selectedNeighborhood={selectedNeighborhood}
          />
        )}

        {currentView === 'store-detail' && viewParam && (
          <StoreDetailPage storeSlug={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'products' && (
          <ProductsPage initialCategory={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'services' && (
          <ServicesPage onNavigate={handleNavigate} selectedNeighborhood={selectedNeighborhood} />
        )}

        {currentView === 'provider-detail' && viewParam && (
          <ProviderDetailPage providerSlug={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'cart' && (
          <CartPage onNavigate={handleNavigate} />
        )}

        {currentView === 'order-confirmation' && viewParam && (
          <OrderConfirmationPage orderCode={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'my-orders' && (
          <MyOrdersPage onNavigate={handleNavigate} />
        )}

        {currentView === 'my-quotes' && (
          <MyQuotesPage onNavigate={handleNavigate} />
        )}

        {currentView === 'my-schedules' && (
          <MySchedulesPage onNavigate={handleNavigate} />
        )}

        {currentView === 'merchant' && (
          <MerchantDashboard onNavigate={handleNavigate} />
        )}

        {currentView === 'provider' && (
          <ProviderDashboard onNavigate={handleNavigate} />
        )}

        {currentView === 'courier' && (
          <CourierDashboard onNavigate={handleNavigate} />
        )}

        {currentView === 'admin' && (
          <AdminDashboard onNavigate={handleNavigate} />
        )}

        {currentView === 'partner-register' && (
          <PartnerRegisterPage onNavigate={handleNavigate} />
        )}
      </main>

      {!isStoreDetailPage && <Footer onNavigate={handleNavigate} />}

      {currentView !== 'admin' && (
        <BottomNavigation currentView={currentView} onNavigate={handleNavigate} />
      )}

      <AuthModal />

      {/* Offline Mode Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-xl">
          <span className="h-2 w-2 rounded-full bg-white animate-ping" />
          Modo Offline — Navegando em dados locais de {settings.city_name || 'Canaã dos Carajás'}.
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <ShopCidadeApp />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
