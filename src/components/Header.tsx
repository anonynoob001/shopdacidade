// Shop da Cidade - Header Component
import {
  Briefcase,
  ChevronDown,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Package,
  Search,
  Shield,
  ShoppingBag,
  Store,
  Truck,
  User as UserIcon,
  Wrench,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSiteTheme } from '../context/ThemeContext';
import { CANAA_NEIGHBORHOODS } from '../services/api';
import { UserRole } from '../worker/types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  selectedNeighborhood: string;
  onSelectNeighborhood: (bairro: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  selectedNeighborhood,
  onSelectNeighborhood,
  searchQuery,
  onSearchChange,
  onSearchSubmit
}) => {
  const { user, openAuthModal, logout, quickSwitch } = useAuth();
  const { totalItemCount } = useCart();
  const { settings } = useSiteTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  const demoRoles: Array<{ role: UserRole; label: string; desc: string; icon: any }> = [
    { role: 'superadmin', label: 'Super Admin', desc: 'Controle total da plataforma', icon: Shield },
    { role: 'lojista', label: 'Lojista', desc: 'Gerenciar loja e produtos', icon: Store },
    { role: 'prestador', label: 'Prestador', desc: 'Orçamentos e agenda', icon: Wrench },
    { role: 'entregador', label: 'Entregador', desc: 'Painel de coletas e corridas', icon: Truck },
    { role: 'cliente', label: 'Cliente', desc: 'Comprador de Canaã', icon: UserIcon }
  ];

  return (
    <header className="relative z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Banner Notice (configured in Super Admin Panel) */}
      {settings.banner_notice && (
        <div className="bg-amber-400 text-slate-950 font-bold px-4 py-1.5 text-center text-xs border-b border-amber-500/30 flex items-center justify-center gap-2 shadow-xs">
          <Megaphone className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{settings.banner_notice}</span>
        </div>
      )}

      {/* Top micro bar with location and quick switcher */}
      <div className="bg-slate-950/80 px-4 py-1.5 text-xs text-slate-300 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Location indicator */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-slate-200">
              {settings.city_name || 'Canaã dos Carajás'}, {settings.city_state || 'PA'}
            </span>
            <span className="text-slate-600">|</span>
            <div className="relative inline-block">
              <select
                value={selectedNeighborhood}
                onChange={e => onSelectNeighborhood(e.target.value)}
                className="bg-transparent border-none text-amber-400 font-medium text-xs focus:ring-0 cursor-pointer pr-4 appearance-none hover:text-amber-300 transition"
              >
                <option value="" className="bg-slate-900 text-slate-200">Todos os bairros</option>
                {CANAA_NEIGHBORHOODS.map(b => (
                  <option key={b} value={b} className="bg-slate-900 text-slate-200">
                    Bairro {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Demo Switcher banner for seamless evaluation */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setIsDemoMenuOpen(!isDemoMenuOpen)}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-[11px] font-medium transition cursor-pointer"
                title="Trocar perfil de teste instantaneamente"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Perfil Atual: <strong className="text-emerald-400 capitalize">{user?.role || 'Visitante'}</strong></span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              {isDemoMenuOpen && (
                <div className="absolute right-0 mt-1 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 border-b border-slate-800/80 mb-1">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Alternar Modo Demonstração</p>
                    <p className="text-[10px] text-slate-500">Teste qualquer função da plataforma com 1 clique</p>
                  </div>
                  {demoRoles.map(item => {
                    const Icon = item.icon;
                    const isActive = user?.role === item.role;
                    return (
                      <button
                        key={item.role}
                        onClick={() => {
                          quickSwitch(item.role);
                          setIsDemoMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-xs hover:bg-slate-800 transition ${
                          isActive ? 'bg-emerald-500/10 text-emerald-400 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <div>
                          <div>{item.label}</div>
                          <div className="text-[10px] text-slate-500">{item.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <PWAInstallButton />
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo Oficial Shop da Cidade */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-left group cursor-pointer shrink-0 py-0.5"
            title="Ir para a página inicial do Shop da Cidade"
          >
            <img
              src="/shop-da-cidade-logo-transparente.png"
              alt="Shop da Cidade"
              className="h-10 sm:h-12 w-auto max-w-[180px] sm:max-w-[220px] object-contain transition-transform group-hover:scale-105"
            />
          </button>

          {/* Desktop Search input */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar lojas, produtos ou serviços em Canaã..."
                className="w-full pl-9 pr-24 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <button
                onClick={onSearchSubmit}
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-black transition cursor-pointer shadow-xs"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Actions: Navigation links, Cart & Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium mr-2">
              <button
                onClick={() => onNavigate('stores')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  currentView === 'stores' ? 'text-emerald-400 bg-slate-800' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Lojas
              </button>
              <button
                onClick={() => onNavigate('services')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  currentView === 'services' ? 'text-emerald-400 bg-slate-800' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Serviços
              </button>
              <button
                onClick={() => onNavigate('products')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  currentView === 'products' ? 'text-emerald-400 bg-slate-800' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Produtos
              </button>
            </nav>

            {/* Cart Button with Count Badge */}
            <button
              onClick={() => onNavigate('cart')}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/80 transition cursor-pointer"
              title="Ver meu carrinho"
            >
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow">
                  {totalItemCount > 9 ? '9+' : totalItemCount}
                </span>
              )}
            </button>

            {/* User Account Button or Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-sm font-medium transition cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate text-slate-200">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-800 mb-1">
                      <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400">
                        {user.role}
                      </span>
                    </div>

                    {/* Dynamic dashboard link based on role */}
                    {['superadmin', 'admin'].includes(user.role) && (
                      <button
                        onClick={() => { onNavigate('admin'); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 text-amber-400 hover:bg-slate-800 font-semibold"
                      >
                        <Shield className="w-4 h-4" />
                        Painel Central Admin
                      </button>
                    )}

                    {['lojista', 'superadmin', 'admin'].includes(user.role) && (
                      <button
                        onClick={() => { onNavigate('merchant'); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 text-slate-200 hover:bg-slate-800"
                      >
                        <Store className="w-4 h-4 text-emerald-400" />
                        Painel do Lojista
                      </button>
                    )}

                    {['prestador', 'superadmin', 'admin'].includes(user.role) && (
                      <button
                        onClick={() => { onNavigate('provider'); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 text-slate-200 hover:bg-slate-800"
                      >
                        <Wrench className="w-4 h-4 text-teal-400" />
                        Painel do Prestador
                      </button>
                    )}

                    {['entregador', 'superadmin', 'admin'].includes(user.role) && (
                      <button
                        onClick={() => { onNavigate('courier'); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 text-slate-200 hover:bg-slate-800"
                      >
                        <Truck className="w-4 h-4 text-cyan-400" />
                        Painel do Entregador
                      </button>
                    )}

                    <div className="border-t border-slate-800 my-1"></div>

                    <button
                      onClick={() => { onNavigate('my-orders'); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 text-slate-300 hover:bg-slate-800"
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      Meus Pedidos
                    </button>
                    <button
                      onClick={() => { onNavigate('my-quotes'); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 text-slate-300 hover:bg-slate-800"
                    >
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      Meus Orçamentos
                    </button>

                    <div className="border-t border-slate-800 my-1"></div>

                    <button
                      onClick={() => { logout(); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 text-rose-400 hover:bg-slate-800"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair da Conta
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
              >
                Entrar
              </button>
            )}

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="md:hidden mt-3">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar em Canaã dos Carajás..."
              className="w-full pl-9 pr-20 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <button
              onClick={onSearchSubmit}
              className="absolute right-1 top-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium cursor-pointer"
            >
              Ir
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-3 gap-2 pb-3 border-b border-slate-800 text-center text-xs">
            <button
              onClick={() => { onNavigate('stores'); setIsMobileMenuOpen(false); }}
              className="p-2 rounded-lg bg-slate-800 font-medium text-slate-200"
            >
              Lojas
            </button>
            <button
              onClick={() => { onNavigate('services'); setIsMobileMenuOpen(false); }}
              className="p-2 rounded-lg bg-slate-800 font-medium text-slate-200"
            >
              Serviços
            </button>
            <button
              onClick={() => { onNavigate('products'); setIsMobileMenuOpen(false); }}
              className="p-2 rounded-lg bg-slate-800 font-medium text-slate-200"
            >
              Produtos
            </button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => { onNavigate('partner-register'); setIsMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs rounded-lg text-emerald-400 hover:bg-slate-800 font-semibold"
            >
              + Cadastrar Loja ou Serviço em Canaã
            </button>
            <button
              onClick={() => { onNavigate('my-orders'); setIsMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Meus Pedidos & Rastreio
            </button>
            <button
              onClick={() => { onNavigate('my-quotes'); setIsMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Meus Orçamentos de Serviços
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
