// Shop Carajás - Footer Component
import { Heart, Mail, MapPin, Phone, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import React from 'react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src="/shop-da-cidade-logo-transparente.png"
                alt="Shop da Cidade"
                className="h-12 w-auto max-w-[210px] object-contain drop-shadow"
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              O marketplace regional desenvolvido para conectar moradores, comércios locais,
              prestadores de serviços e entregadores autônomos de Canaã dos Carajás — Pará.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Canaã dos Carajás, Pará • Fuso America/Belem</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>WhatsApp Oficial: (94) 99123-4567</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>atendimento@shopdacidade.com.br</span>
            </div>
          </div>

          {/* Compras & Lojas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Comprar</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('stores')} className="hover:text-emerald-400 transition cursor-pointer">
                  Lojas Locais
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products')} className="hover:text-emerald-400 transition cursor-pointer">
                  Catálogo de Produtos
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('cart')} className="hover:text-emerald-400 transition cursor-pointer">
                  Meu Carrinho
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('my-orders')} className="hover:text-emerald-400 transition cursor-pointer">
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
                <button onClick={() => onNavigate('services')} className="hover:text-emerald-400 transition cursor-pointer">
                  Todos os Prestadores
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-emerald-400 transition cursor-pointer">
                  Climatização & Ar
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-emerald-400 transition cursor-pointer">
                  Eletricistas & Padrão
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('my-quotes')} className="hover:text-emerald-400 transition cursor-pointer">
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
                <button onClick={() => onNavigate('partner-register')} className="text-emerald-400 hover:text-emerald-300 font-semibold transition cursor-pointer">
                  Cadastrar minha Loja
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('partner-register')} className="text-emerald-400 hover:text-emerald-300 font-semibold transition cursor-pointer">
                  Anunciar Meus Serviços
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('courier')} className="hover:text-emerald-400 transition cursor-pointer">
                  Painel de Entregadores
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin')} className="text-slate-400 hover:text-white transition cursor-pointer">
                  Área Administrativa
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & LGPD Compliance Note */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
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
