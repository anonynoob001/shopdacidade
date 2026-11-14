// Shop da Cidade - Footer Component
import { Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import React from 'react';
import { useSiteTheme } from '../context/ThemeContext';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings } = useSiteTheme();
  return (
    <footer
      style={{
        backgroundColor: 'var(--theme-footer-bg)',
        color: 'var(--theme-footer-text)'
      }}
      className="border-t border-white/10 text-sm transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src={settings.site_logo_url || '/shop-da-cidade-logo-transparente.png'}
                alt={settings.platform_name || 'Shop da Cidade'}
                className="h-12 w-auto max-w-[210px] object-contain drop-shadow"
              />
            </div>
            <p className="text-xs opacity-90 leading-relaxed max-w-sm">
              {settings.site_tagline || 'O shopping virtual da sua cidade'}. Desenvolvido para conectar moradores, comércios locais, prestadores de serviços e entregadores autônomos de {settings.city_name || 'Canaã dos Carajás'} — {settings.city_state || 'PA'}.
            </p>
            <div className="flex items-center gap-2 text-xs">
              <MapPin style={{ color: 'var(--theme-primary)' }} className="w-4 h-4 shrink-0" />
              <span>{settings.city_name || 'Canaã dos Carajás'}, {settings.city_state || 'PA'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Phone style={{ color: 'var(--theme-primary)' }} className="w-4 h-4 shrink-0" />
              <span>WhatsApp Oficial: {settings.official_whatsapp || '(94) 99123-4567'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Mail style={{ color: 'var(--theme-primary)' }} className="w-4 h-4 shrink-0" />
              <span>{settings.official_email || 'atendimento@shopdacidade.com.br'}</span>
            </div>
          </div>

          {/* Compras & Lojas */}
          <div className="space-y-3">
            <h4 style={{ color: 'var(--theme-header-text)' }} className="text-xs font-bold uppercase tracking-wider">Comprar</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('stores')} className="hover:text-[var(--theme-accent)] transition cursor-pointer">
                  Lojas Locais
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products')} className="hover:text-[var(--theme-accent)] transition cursor-pointer">
                  Catálogo de Produtos
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('cart')} className="hover:text-[var(--theme-accent)] transition cursor-pointer">
                  Meu Carrinho
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('my-orders')} className="hover:text-[var(--theme-accent)] transition cursor-pointer">
                  Acompanhar Pedidos
                </button>
              </li>
            </ul>
          </div>

          {/* Serviços Locais */}
          <div className="space-y-3">
            <h4 style={{ color: 'var(--theme-header-text)' }} className="text-xs font-bold uppercase tracking-wider">Serviços</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-[var(--theme-accent)] transition cursor-pointer">
                  Todos os Prestadores
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-[var(--theme-accent)] transition cursor-pointer">
                  Climatização & Ar
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-[var(--theme-accent)] transition cursor-pointer">
                  Eletricistas & Padrão
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('my-quotes')} className="hover:text-[var(--theme-accent)] transition cursor-pointer">
                  Solicitar Orçamento
                </button>
              </li>
            </ul>
          </div>

          {/* Para Parceiros & Segurança */}
          <div className="space-y-3">
            <h4 style={{ color: 'var(--theme-header-text)' }} className="text-xs font-bold uppercase tracking-wider">Parceiros</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('partner-register')} style={{ color: 'var(--theme-accent)' }} className="hover:brightness-110 font-semibold transition cursor-pointer">
                  Cadastrar minha Loja
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('partner-register')} style={{ color: 'var(--theme-accent)' }} className="hover:brightness-110 font-semibold transition cursor-pointer">
                  Anunciar Meus Serviços
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('courier')} className="hover:text-[var(--theme-accent)] transition cursor-pointer">
                  Painel de Entregadores
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & LGPD Compliance Note */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs opacity-85">
          <div className="flex items-center gap-2">
            <ShieldCheck style={{ color: 'var(--theme-primary)' }} className="w-4 h-4" />
            <span>Plataforma em conformidade com a LGPD (Lei Geral de Proteção de Dados - Brasil).</span>
          </div>
          <div>
            © {new Date().getFullYear()} {settings.platform_name || 'Shop da Cidade'} — {settings.city_name || 'Canaã dos Carajás'}, {settings.city_state || 'PA'}. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
};
