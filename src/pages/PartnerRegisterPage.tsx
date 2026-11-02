// Shop da Cidade - Partner Registration (Lojistas, Prestadores de Serviços & Entregadores)
import {
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  ShieldCheck,
  Store,
  Truck,
  UserCheck,
  Wrench
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, CANAA_NEIGHBORHOODS, STORE_CATEGORIES } from '../services/api';

interface PartnerRegisterPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const PartnerRegisterPage: React.FC<PartnerRegisterPageProps> = ({ onNavigate }) => {
  const { user, login } = useAuth();
  const [partnerType, setPartnerType] = useState<'store' | 'provider' | 'courier'>('store');

  // Account fields (if not logged in)
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');

  // Store fields
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState('Construção & Reforma');
  const [storeNeighborhood, setStoreNeighborhood] = useState('Centro');
  const [storeWhatsapp, setStoreWhatsapp] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [storeDeliveryFee, setStoreDeliveryFee] = useState('7.00');

  // Provider fields
  const [providerBusinessName, setProviderBusinessName] = useState('');
  const [providerCategoryId, setProviderCategoryId] = useState('cat_serv_reformas');
  const [providerHourlyRate, setProviderHourlyRate] = useState('80.00');
  const [providerDesc, setProviderDesc] = useState('');
  const [providerNeighborhood, setProviderNeighborhood] = useState('Centro');

  // Courier fields
  const [courierVehicleType, setCourierVehicleType] = useState('moto');
  const [courierPlate, setCourierPlate] = useState('');
  const [courierNeighborhood, setCourierNeighborhood] = useState('Centro');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredRole, setRegisteredRole] = useState<'lojista' | 'prestador' | 'entregador'>('lojista');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!user) {
        // Direct unified registration: user + partner profile in one single call
        if (!password || password.length < 6) {
          throw new Error('A senha deve ter no mínimo 6 caracteres.');
        }

        const role = partnerType === 'store' ? 'lojista' : partnerType === 'provider' ? 'prestador' : 'entregador';
        const payload: any = {
          name,
          email,
          password,
          phone: phone || (partnerType === 'store' ? storeWhatsapp : ''),
          role
        };

        if (partnerType === 'store') {
          payload.store_name = storeName || name;
          payload.category = storeCategory;
          payload.neighborhood = storeNeighborhood;
          payload.whatsapp = storeWhatsapp || phone;
          payload.description = storeDesc;
          payload.delivery_fee_base = parseFloat(storeDeliveryFee) || 7.0;
        } else if (partnerType === 'provider') {
          payload.business_name = providerBusinessName || name;
          payload.category_id = providerCategoryId;
          payload.hourly_rate_estimate = parseFloat(providerHourlyRate) || 80.0;
          payload.description = providerDesc;
          payload.neighborhood = providerNeighborhood;
        } else if (partnerType === 'courier') {
          payload.vehicle_type = courierVehicleType;
          payload.vehicle_plate = courierPlate;
          payload.neighborhood = courierNeighborhood;
        }

        const registerRes = await apiRequest<{ token: string; user: any }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (registerRes.token) {
          login(registerRes.token, registerRes.user);
        }

        setRegisteredRole(role);
        setSuccess(true);
      } else {
        // User already logged in, create the specific partner profile
        if (partnerType === 'store') {
          await apiRequest('/api/merchant/store', {
            method: 'POST',
            body: JSON.stringify({
              name: storeName || user.name,
              category: storeCategory,
              neighborhood: storeNeighborhood,
              phone: phone || user.phone,
              whatsapp: storeWhatsapp || user.phone,
              description: storeDesc,
              delivery_fee_base: parseFloat(storeDeliveryFee) || 7.0
            })
          });
          setRegisteredRole('lojista');
        } else if (partnerType === 'provider') {
          await apiRequest('/api/services/providers/register', {
            method: 'POST',
            body: JSON.stringify({
              business_name: providerBusinessName || user.name,
              category_id: providerCategoryId,
              hourly_rate_estimate: parseFloat(providerHourlyRate) || 80.0,
              description: providerDesc,
              neighborhood: providerNeighborhood,
              phone: phone || user.phone,
              whatsapp: storeWhatsapp || user.phone
            })
          });
          setRegisteredRole('prestador');
        } else if (partnerType === 'courier') {
          await apiRequest('/api/deliveries/register-courier', {
            method: 'POST',
            body: JSON.stringify({
              vehicle_type: courierVehicleType,
              vehicle_plate: courierPlate,
              neighborhood: courierNeighborhood
            })
          });
          setRegisteredRole('entregador');
        }

        setSuccess(true);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err?.message || 'Falha ao processar cadastro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => onNavigate('home')}
        className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Início
      </button>

      {success ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cadastro Concluído com Sucesso!</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {registeredRole === 'lojista' && 'Sua loja já foi criada no Shop da Cidade! Você pode personalizar cores, logotipo, cadastrar produtos e começar a vender.'}
            {registeredRole === 'prestador' && 'Seu perfil profissional de prestador de serviços foi criado com sucesso! Você já pode receber pedidos de orçamento em Canaã.'}
            {registeredRole === 'entregador' && 'Seu cadastro de entregador parceiro foi aprovado! Você já pode aceitar entregas e acompanhar rotas.'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            {registeredRole === 'lojista' && (
              <button
                onClick={() => onNavigate('merchant')}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition"
              >
                Acessar Painel do Lojista
              </button>
            )}
            {registeredRole === 'prestador' && (
              <button
                onClick={() => onNavigate('provider')}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition"
              >
                Acessar Painel de Prestador
              </button>
            )}
            {registeredRole === 'entregador' && (
              <button
                onClick={() => onNavigate('courier')}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition"
              >
                Acessar Painel de Entregas
              </button>
            )}
            <button
              onClick={() => onNavigate('home')}
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Ir para a Página Inicial
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Parceiros Oficiais</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Cadastre seu Negócio no Shop da Cidade
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Conecte seu comércio ou serviço a milhares de moradores de Canaã dos Carajás - PA.
            </p>
          </div>

          {/* Type Switcher */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setPartnerType('store')}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                partnerType === 'store'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4 text-amber-500" />
              <span>Lojista / Loja</span>
            </button>
            <button
              type="button"
              onClick={() => setPartnerType('provider')}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                partnerType === 'provider'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-4 h-4 text-amber-500" />
              <span>Prestador</span>
            </button>
            <button
              type="button"
              onClick={() => setPartnerType('courier')}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                partnerType === 'courier'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Truck className="w-4 h-4 text-amber-500" />
              <span>Entregador</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* If not logged in, collect user credentials */}
            {!user && (
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <span>Dados de Acesso (Criação de Conta)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Seu Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nome do responsável"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Seu E-mail *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Senha de Acesso (mín. 6 dígitos) *</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Crie sua senha segura"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Telefone Celular / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="(94) 99123-4567"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: STORE FORM */}
            {partnerType === 'store' && (
              <>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome Fantasia da Loja *</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    placeholder="Ex: Comercial Carajás ou Panificadora Pão de Ouro"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Segmento / Categoria *</label>
                    <select
                      value={storeCategory}
                      onChange={e => setStoreCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      {STORE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bairro em Canaã dos Carajás *</label>
                    <select
                      value={storeNeighborhood}
                      onChange={e => setStoreNeighborhood(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      {CANAA_NEIGHBORHOODS.map(b => (
                        <option key={b} value={b}>Bairro {b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">WhatsApp Comercial da Loja *</label>
                    <input
                      type="text"
                      required
                      value={storeWhatsapp}
                      onChange={e => setStoreWhatsapp(e.target.value)}
                      placeholder="(94) 99123-4567"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Taxa de Entrega Base (R$)</label>
                    <input
                      type="number"
                      step="0.50"
                      value={storeDeliveryFee}
                      onChange={e => setStoreDeliveryFee(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Apresentação da Loja</label>
                  <textarea
                    rows={3}
                    value={storeDesc}
                    onChange={e => setStoreDesc(e.target.value)}
                    placeholder="Conte brevemente sobre o seu estabelecimento e produtos oferecidos..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </>
            )}

            {/* TAB: PROVIDER FORM */}
            {partnerType === 'provider' && (
              <>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome Profissional / Empresa de Serviços *</label>
                  <input
                    type="text"
                    required
                    value={providerBusinessName}
                    onChange={e => setProviderBusinessName(e.target.value)}
                    placeholder="Ex: Climatização Silva & Filhos ou Eletricista Canaã"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Especialidade / Categoria *</label>
                    <select
                      value={providerCategoryId}
                      onChange={e => setProviderCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="cat_serv_reformas">Climatização, Elétrica & Manutenção</option>
                      <option value="cat_serv_obras">Construção Civil & Reformas</option>
                      <option value="cat_serv_limpeza">Limpeza Residencial & Pós-obra</option>
                      <option value="cat_serv_mecanica">Mecânica & Auto Elétrica</option>
                      <option value="cat_serv_beleza">Beleza, Estética & Barbearia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Estimativa de Preço / Hora (R$)</label>
                    <input
                      type="number"
                      step="5"
                      value={providerHourlyRate}
                      onChange={e => setProviderHourlyRate(e.target.value)}
                      placeholder="80.00"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bairro Base de Atendimento em Canaã</label>
                  <select
                    value={providerNeighborhood}
                    onChange={e => setProviderNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    {CANAA_NEIGHBORHOODS.map(b => (
                      <option key={b} value={b}>Bairro {b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Descrição dos Serviços e Experiência</label>
                  <textarea
                    rows={3}
                    value={providerDesc}
                    onChange={e => setProviderDesc(e.target.value)}
                    placeholder="Descreva seus diferenciais, garantia de serviço e anos de atuação..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </>
            )}

            {/* TAB: COURIER FORM */}
            {partnerType === 'courier' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipo de Veículo *</label>
                    <select
                      value={courierVehicleType}
                      onChange={e => setCourierVehicleType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="moto">Motocicleta (Recomendado)</option>
                      <option value="bike">Bicicleta / Bike Elétrica</option>
                      <option value="carro">Carro de Passeio</option>
                      <option value="van">Fiorino / Utilitário</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Placa do Veículo (se aplicável)</label>
                    <input
                      type="text"
                      value={courierPlate}
                      onChange={e => setCourierPlate(e.target.value.toUpperCase())}
                      placeholder="ABC-1234 ou ABC1D23"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 uppercase focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bairro Preferencial de Espera / Partida</label>
                  <select
                    value={courierNeighborhood}
                    onChange={e => setCourierNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    {CANAA_NEIGHBORHOODS.map(b => (
                      <option key={b} value={b}>Bairro {b}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting
                ? 'Processando Cadastro...'
                : partnerType === 'store'
                ? 'Concluir Cadastro da Minha Loja'
                : partnerType === 'provider'
                ? 'Concluir Cadastro de Prestador'
                : 'Concluir Cadastro de Entregador'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
