// Shop Carajás - Login & Registration Modal with 2FA Protection
import { CheckCircle2, Eye, EyeOff, KeyRound, Lock, Mail, Phone, ShieldCheck, ShoppingBag, Store, Truck, User as UserIcon, Wrench, X } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteTheme } from '../context/ThemeContext';
import { UserRole } from '../worker/types';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, login, login2FA, register } = useAuth();
  const { settings } = useSiteTheme();
  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('cliente');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2FA state
  const [isTwoFactorStep, setIsTwoFactorStep] = useState(false);
  const [temp2FAToken, setTemp2FAToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Sync mode when modal opens
  React.useEffect(() => {
    setMode(authModalMode);
    setError(null);
    setIsTwoFactorStep(false);
    setTemp2FAToken(null);
    setTwoFactorCode('');
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const result = await login(email, password);
        if (result?.twoFactorRequired && result.tempToken) {
          setIsTwoFactorStep(true);
          setTemp2FAToken(result.tempToken);
        }
      } else {
        await register({ name, email, password, phone, role });
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao autenticar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!temp2FAToken || !twoFactorCode.trim()) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await login2FA(temp2FAToken, twoFactorCode.trim());
    } catch (err: any) {
      setError(err?.message || 'Código de 2FA incorreto ou expirado.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
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
            src={settings.site_logo_url || '/shop-da-cidade-logo-transparente.png'}
            alt={settings.platform_name || 'Shop da Cidade'}
            className="h-11 w-auto max-w-[170px] object-contain"
          />
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {isTwoFactorStep
                ? 'Verificação em Duas Etapas'
                : mode === 'login'
                ? 'Acessar Shop da Cidade'
                : 'Criar Nova Conta'}
            </h3>
            <p className="text-xs text-slate-400">Canaã dos Carajás — PA</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
            <span>{error}</span>
          </div>
        )}

        {/* 2FA Verification View */}
        {isTwoFactorStep ? (
          <form onSubmit={handle2FASubmit} className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-emerald-500/30 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Conta Protegida por 2FA</h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Digite o código de <strong>6 dígitos</strong> gerado no seu aplicativo autenticador (Google Authenticator ou Authy) ou utilize um <strong>código reserva de emergência</strong>.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Código de Autenticação / Código Reserva</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={10}
                  value={twoFactorCode}
                  onChange={e => setTwoFactorCode(e.target.value)}
                  placeholder="Ex: 123456 ou XXXX-XXXX"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-center text-lg font-mono font-bold tracking-widest placeholder-slate-500 focus:outline-none focus:border-[#0047F7] focus:ring-1 focus:ring-[#0047F7] uppercase"
                />
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                O código numérico muda a cada 30 segundos no seu celular.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !twoFactorCode.trim()}
              style={{
                backgroundColor: 'var(--theme-accent)',
                color: 'var(--theme-accent-text)'
              }}
              className="w-full mt-2 py-3 rounded-xl hover:brightness-110 font-black text-sm shadow-lg transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Validando...' : 'Verificar e Entrar'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsTwoFactorStep(false);
                setTemp2FAToken(null);
                setTwoFactorCode('');
                setError(null);
              }}
              className="w-full py-2 text-center text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              &larr; Voltar e trocar de conta
            </button>
          </form>
        ) : (
          <>
            {/* Tab switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-800/80 rounded-xl mb-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                style={mode === 'login' ? { backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-text)' } : undefined}
                className={`py-2 rounded-lg transition cursor-pointer font-bold ${
                  mode === 'login' ? 'shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Já tenho conta
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(null); }}
                style={mode === 'register' ? { backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-text)' } : undefined}
                className={`py-2 rounded-lg transition cursor-pointer font-bold ${
                  mode === 'register' ? 'shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Quero me cadastrar
              </button>
            </div>

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
                                ? 'border-[#0047F7] bg-[#0047F7]/15 text-white ring-1 ring-[#0047F7]'
                                : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#FA4802]' : 'text-slate-400'}`} />
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
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#0047F7] focus:ring-1 focus:ring-[#0047F7]"
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
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#0047F7] focus:ring-1 focus:ring-[#0047F7]"
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
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#0047F7] focus:ring-1 focus:ring-[#0047F7]"
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
                    className="w-full pl-9 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#0047F7] focus:ring-1 focus:ring-[#0047F7]"
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
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  color: 'var(--theme-accent-text)'
                }}
                className="w-full mt-2 py-3 rounded-xl hover:brightness-110 font-black text-sm shadow-lg transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Processando...' : mode === 'login' ? 'Entrar no Shop da Cidade' : 'Concluir Cadastro'}
              </button>
            </form>

            <p className="mt-4 text-center text-[11px] text-slate-500">
              Ao prosseguir, você concorda com os Termos de Uso e Política de Privacidade de Canaã dos Carajás.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
