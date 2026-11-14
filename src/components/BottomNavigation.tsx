// Shop da Cidade - Mobile Native-Style Bottom Navigation Bar
import { Home, Package, ShoppingBag, Store, User, Wrench } from 'lucide-react';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface BottomNavigationProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentView, onNavigate }) => {
  const { user, openAuthModal } = useAuth();
  const { totalItemCount } = useCart();

  const handleProfileClick = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (user.role === 'superadmin' || user.role === 'admin') {
      onNavigate('admin');
    } else if (user.role === 'lojista') {
      onNavigate('merchant');
    } else if (user.role === 'prestador') {
      onNavigate('provider');
    } else if (user.role === 'entregador') {
      onNavigate('courier');
    } else {
      onNavigate('my-orders');
    }
  };

  const isProfileActive =
    currentView === 'my-orders' ||
    currentView === 'merchant' ||
    currentView === 'provider' ||
    currentView === 'courier' ||
    currentView === 'admin';

  return (
    <nav
      style={{
        backgroundColor: 'var(--theme-bottom-nav-bg)',
        borderColor: 'var(--theme-card-border)'
      }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t px-2 py-1.5 shadow-[0_-4px_25px_rgba(0,0,0,0.07)] transition-colors"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Início */}
        <button
          onClick={() => onNavigate('home')}
          style={{ color: currentView === 'home' ? 'var(--theme-primary)' : 'var(--theme-text-secondary)' }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
            currentView === 'home' ? 'font-black scale-105' : 'hover:opacity-80'
          }`}
        >
          <Home className={`w-5 h-5 ${currentView === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Início</span>
        </button>

        {/* 2. Lojas */}
        <button
          onClick={() => onNavigate('stores')}
          style={{
            color:
              currentView === 'stores' || currentView === 'store-detail'
                ? 'var(--theme-primary)'
                : 'var(--theme-text-secondary)'
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
            currentView === 'stores' || currentView === 'store-detail' ? 'font-black scale-105' : 'hover:opacity-80'
          }`}
        >
          <Store
            className={`w-5 h-5 ${
              currentView === 'stores' || currentView === 'store-detail' ? 'stroke-[2.5]' : 'stroke-[1.8]'
            }`}
          />
          <span className="text-[10px] mt-0.5 tracking-tight">Lojas</span>
        </button>

        {/* 3. Serviços */}
        <button
          onClick={() => onNavigate('services')}
          style={{
            color:
              currentView === 'services' || currentView === 'provider-detail'
                ? 'var(--theme-primary)'
                : 'var(--theme-text-secondary)'
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
            currentView === 'services' || currentView === 'provider-detail'
              ? 'font-black scale-105'
              : 'hover:opacity-80'
          }`}
        >
          <Wrench
            className={`w-5 h-5 ${
              currentView === 'services' || currentView === 'provider-detail' ? 'stroke-[2.5]' : 'stroke-[1.8]'
            }`}
          />
          <span className="text-[10px] mt-0.5 tracking-tight">Serviços</span>
        </button>

        {/* 4. Carrinho */}
        <button
          onClick={() => onNavigate('cart')}
          style={{ color: currentView === 'cart' ? 'var(--theme-primary)' : 'var(--theme-text-secondary)' }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer relative ${
            currentView === 'cart' ? 'font-black scale-105' : 'hover:opacity-80'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 ${currentView === 'cart' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {totalItemCount > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  color: 'var(--theme-accent-text)'
                }}
                className="absolute -top-1.5 -right-2 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-in zoom-in"
              >
                {totalItemCount > 9 ? '9+' : totalItemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Carrinho</span>
        </button>

        {/* 5. Perfil / Pedidos / Painel */}
        <button
          onClick={handleProfileClick}
          style={{ color: isProfileActive ? 'var(--theme-primary)' : 'var(--theme-text-secondary)' }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
            isProfileActive ? 'font-black scale-105' : 'hover:opacity-80'
          }`}
        >
          {user?.role === 'lojista' || user?.role === 'admin' || user?.role === 'superadmin' ? (
            <Package className={`w-5 h-5 ${isProfileActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          ) : (
            <User className={`w-5 h-5 ${isProfileActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          )}
          <span className="text-[10px] mt-0.5 tracking-tight">
            {user ? (user.role === 'lojista' ? 'Minha Loja' : user.role === 'admin' || user.role === 'superadmin' ? 'Painel' : 'Pedidos') : 'Entrar'}
          </span>
        </button>
      </div>
    </nav>
  );
};
