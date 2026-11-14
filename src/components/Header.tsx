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
  const { user, openAuthModal, logout } = useAuth();
  const { totalItemCount } = useCart();
  const { settings } = useSiteTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  return (
    <header
      style={{
        backgroundColor: 'var(--theme-header-bg)',
        color: 'var(--theme-header-text)'
      }}
      className="relative z-40 border-b border-white/10 shadow-md transition-colors"
    >
      {/* Top Banner Notice (configured in Super Admin Panel) */}
      {settings.banner_notice && (
        <div
          style={{
            backgroundColor: 'var(--theme-notice-bg)',
            color: 'var(--theme-notice-text)'
          }}
          className="font-bold px-4 py-1.5 text-center text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <Megaphone className="w-3.5 h-3.5 shrink-0 opacity-90" />
          <span className="truncate">{settings.banner_notice}</span>
        </div>
      )}

      {/* Top micro bar with location and quick switcher */}
      <div
        style={{
          backgroundColor: 'var(--theme-topbar-bg)',
          color: 'var(--theme-header-text)'
        }}
        className="px-4 py-1.5 text-xs border-b border-white/10 transition-colors"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Location indicator */}
          <div className="flex items-center gap-1.5">
            <MapPin style={{ color: 'var(--theme-accent)' }} className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold opacity-90">
              {settings.city_name || 'Canaã dos Carajás'}, {settings.city_state || 'PA'}
            </span>
            <span className="opacity-35">|</span>
            <div className="relative inline-block">
              <select
                value={selectedNeighborhood}
                onChange={e => onSelectNeighborhood(e.target.value)}
                style={{ color: 'var(--theme-accent)' }}
                className="bg-transparent border-none font-semibold text-xs focus:ring-0 cursor-pointer pr-4 appearance-none hover:brightness-110 transition"
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

          {/* Quick Demo Switcher banner for evaluation (can be disabled in Admin Settings) */}
          <div className="flex items-center gap-3">
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
              src={settings.site_logo_url || '/shop-da-cidade-logo-transparente.png'}
              alt={settings.platform_name || 'Shop da Cidade'}
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
                style={{
                  backgroundColor: 'var(--theme-header-input-bg)',
                  color: 'var(--theme-header-text)'
                }}
                className="w-full pl-9 pr-24 py-2 border border-white/15 rounded-xl text-sm placeholder:opacity-55 focus:outline-none focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] transition"
              />
              <Search className="w-4 h-4 opacity-60 absolute left-3 top-2.5" />
              <button
                onClick={onSearchSubmit}
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  color: 'var(--theme-accent-text)'
                }}
                className="absolute right-1.5 top-1.5 px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer shadow-xs hover:brightness-110 active:scale-95"
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
                style={currentView === 'stores' ? { backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-text)' } : undefined}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-semibold ${
                  currentView === 'stores' ? 'shadow-xs' : 'opacity-85 hover:opacity-100 hover:bg-white/10'
                }`}
              >
                Lojas
              </button>
              <button
                onClick={() => onNavigate('services')}
                style={currentView === 'services' ? { backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-text)' } : undefined}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-semibold ${
                  currentView === 'services' ? 'shadow-xs' : 'opacity-85 hover:opacity-100 hover:bg-white/10'
                }`}
              >
                Serviços
              </button>
              <button
                onClick={() => onNavigate('products')}
                style={currentView === 'products' ? { backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-text)' } : undefined}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-semibold ${
                  currentView === 'products' ? 'shadow-xs' : 'opacity-85 hover:opacity-100 hover:bg-white/10'
                }`}
              >
                Produtos
              </button>
            </nav>

            {/* Cart Button with Count Badge */}
            <button
              onClick={() => onNavigate('cart')}
              style={{
                backgroundColor: 'var(--theme-header-input-bg)',
                color: 'var(--theme-header-text)'
              }}
              className="relative p-2 rounded-xl border border-white/15 hover:brightness-110 transition cursor-pointer"
              title="Ver meu carrinho"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItemCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--theme-accent)',
                    color: 'var(--theme-accent-text)'
                  }}
                  className="absolute -top-1 -right-1 text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow"
                >
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
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  color: 'var(--theme-accent-text)'
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-black shadow-md transition active:scale-95 cursor-pointer hover:brightness-110"
              >
                Entrar
              </button>
            )}

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ backgroundColor: 'var(--theme-header-input-bg)', color: 'var(--theme-header-text)' }}
              className="lg:hidden p-2 rounded-xl border border-white/15"
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
              style={{
                backgroundColor: 'var(--theme-header-input-bg)',
                color: 'var(--theme-header-text)'
              }}
              className="w-full pl-9 pr-20 py-2 border border-white/15 rounded-xl text-xs placeholder:opacity-55 focus:outline-none focus:border-[var(--theme-primary)]"
            />
            <Search className="w-4 h-4 opacity-60 absolute left-3 top-2.5" />
            <button
              onClick={onSearchSubmit}
              style={{
                backgroundColor: 'var(--theme-accent)',
                color: 'var(--theme-accent-text)'
              }}
              className="absolute right-1 top-1 px-3 py-1 rounded-lg text-xs font-black cursor-pointer shadow-xs hover:brightness-110"
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
