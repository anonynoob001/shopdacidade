// Shop Carajás - Login & Registration Modal
import { Eye, EyeOff, Lock, Mail, Phone, ShoppingBag, Store, Truck, User as UserIcon, Wrench, X } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../worker/types';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('cliente');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync mode when modal opens
  React.useEffect(() => {
    setMode(authModalMode);
    setError(null);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ name, email, password, phone, role });
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao autenticar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions: Array<{ id: UserRole; title: string; subtitle: string; icon: any }> = [
    { id: 'cliente', title: 'Comprador / Cliente', subtitle: 'Compre em lojas e contrate serviços', icon: UserIcon },
    { id: 'lojista', title: 'Comerciante / Lojista', subtitle: 'Tenha sua loja virtual em Canaã', icon: Store },
    { id: 'prestador', title: 'Prestador de Serviços', subtitle: 'Receba orçamentos e agendamentos', icon: Wrench },
    { id: 'entregador', title: 'Entregador Parceiro', subtitle: 'Faça entregas e coletas na cidade', icon: Truck }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white relative">
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand header */}
        <div className="flex items-center gap-3 mb-6">
          <img
            src="/shop-da-cidade-logo-transparente.png"
            alt="Shop da Cidade"
            className="h-11 w-auto max-w-[170px] object-contain"
          />
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {mode === 'login' ? 'Acessar Shop da Cidade' : 'Criar Nova Conta'}
            </h3>
            <p className="text-xs text-slate-400">Canaã dos Carajás — PA</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-800/80 rounded-xl mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`py-2 rounded-lg transition cursor-pointer font-bold ${
              mode === 'login' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Já tenho conta
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`py-2 rounded-lg transition cursor-pointer font-bold ${
              mode === 'register' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Quero me cadastrar
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Qual o seu objetivo?</label>
                <div className="grid grid-cols-2 gap-2">
                  {roleOptions.map(opt => {
                    const Icon = opt.icon;
                    const isSelected = role === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setRole(opt.id)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400/10 text-white ring-1 ring-amber-400'
                            : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                          <span className="font-bold text-[11px] truncate">{opt.title.split('/')[0]}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 leading-tight">{opt.subtitle}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Nome Completo / Razão Social</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome ou da sua empresa"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Telefone / WhatsApp (com DDD)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="(94) 99123-4567"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">E-mail</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'login' ? 'Digite sua senha' : 'Mínimo de 6 caracteres'}
                className="w-full pl-9 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 font-black text-slate-950 text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Processando...' : mode === 'login' ? 'Entrar no Shop da Cidade' : 'Concluir Cadastro'}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          Ao prosseguir, você concorda com os Termos de Uso e Política de Privacidade de Canaã dos Carajás.
        </p>
      </div>
    </div>
  );
};
