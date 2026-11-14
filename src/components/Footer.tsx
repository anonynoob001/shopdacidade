// Shop da Cidade - Footer Component
import { Heart, Mail, MapPin, Phone, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import React from 'react';
import { useSiteTheme } from '../context/ThemeContext';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings } = useSiteTheme();
  return (
    <footer 
      style={{ backgroundColor: settings.secondary_color || '#0f172a' }}
      className="text-slate-400 border-t border-slate-800 text-sm transition-colors"
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
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {settings.site_tagline || 'O shopping virtual da sua cidade'}. Desenvolvido para conectar moradores, comércios locais, prestadores de serviços e entregadores autônomos de {settings.city_name || 'Canaã dos Carajás'} — {settings.city_state || 'PA'}.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <MapPin style={{ color: settings.primary_color || '#0047F7' }} className="w-4 h-4 shrink-0" />
              <span>{settings.city_name || 'Canaã dos Carajás'}, {settings.city_state || 'PA'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Phone style={{ color: settings.primary_color || '#0047F7' }} className="w-4 h-4 shrink-0" />
              <span>WhatsApp Oficial: {settings.official_whatsapp || '(94) 99123-4567'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Mail style={{ color: settings.primary_color || '#0047F7' }} className="w-4 h-4 shrink-0" />
              <span>{settings.official_email || 'atendimento@shopdacidade.com.br'}</span>
            </div>
          </div>

          {/* Compras & Lojas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Comprar</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('stores')} className="hover:text-[#FA4802] transition cursor-pointer">
                  Lojas Locais
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products')} className="hover:text-[#FA4802] transition cursor-pointer">
                  Catálogo de Produtos
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('cart')} className="hover:text-[#FA4802] transition cursor-pointer">
                  Meu Carrinho
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('my-orders')} className="hover:text-[#FA4802] transition cursor-pointer">
                  Acompanhar Pedidos
                </button>
              </li>
            </ul>
          </div>

          {/* Serviços Locais */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Serviços</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-[#FA4802] transition cursor-pointer">
                  Todos os Prestadores
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-[#FA4802] transition cursor-pointer">
                  Climatização & Ar
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-[#FA4802] transition cursor-pointer">
                  Eletricistas & Padrão
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('my-quotes')} className="hover:text-[#FA4802] transition cursor-pointer">
                  Solicitar Orçamento
                </button>
              </li>
            </ul>
          </div>

          {/* Para Parceiros & Segurança */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Parceiros</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('partner-register')} className="text-[#FA4802] hover:text-orange-400 font-semibold transition cursor-pointer">
                  Cadastrar minha Loja
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('partner-register')} className="text-[#FA4802] hover:text-orange-400 font-semibold transition cursor-pointer">
                  Anunciar Meus Serviços
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('courier')} className="hover:text-[#FA4802] transition cursor-pointer">
                  Painel de Entregadores
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & LGPD Compliance Note */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0047F7]" />
            <span>Plataforma em conformidade com a LGPD (Lei Geral de Proteção de Dados - Brasil).</span>
          </div>
          <div>
            © {new Date().getFullYear()} Shop da Cidade — Canaã dos Carajás, PA. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
};
