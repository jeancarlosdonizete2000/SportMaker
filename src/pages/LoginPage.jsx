import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Store,
  Mail,
  Lock,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Building2,
  FileText,
  Trophy,
  AlertCircle,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SPORTS_CATEGORIES } from '../data/mockData';

export default function LoginPage({
  initialRole = 'player',
  redirectReason = '',
  onSuccess,
  onBack,
}) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 'player' (Atleta / Usuário) | 'owner' (Proprietário de Arena)
  const [role, setRole] = useState(initialRole);

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    navigate(newRole === 'owner' ? '/login/proprietario' : '/login/atleta', { replace: true });
  };
  // 'login' | 'register'
  const [mode, setMode] = useState(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );

  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setMode('register');
    }
  }, [searchParams]);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [arenaName, setArenaName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [favoriteSport, setFavoriteSport] = useState('society');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    }
  }, [initialRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Preencha seu e-mail e senha para continuar.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setError('Informe seu nome completo.');
      return;
    }

    if (mode === 'register' && role === 'owner' && !arenaName.trim()) {
      setError('Informe o nome da sua Arena.');
      return;
    }

    setSubmitting(true);
    try {
      let resultUser;
      if (mode === 'login') {
        resultUser = await login({ email, password, role });
      } else {
        resultUser = await register({
          name,
          email,
          password,
          role,
          arenaName: role === 'owner' ? arenaName : undefined,
          cnpj: role === 'owner' ? cnpj : undefined,
          favoriteSport: role === 'player' ? favoriteSport : undefined,
        });
      }
      if (onSuccess) onSuccess(resultUser);
    } catch (err) {
      setError(err.message || 'Falha na autenticação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 relative flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto relative z-10 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm font-semibold text-slate-200 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-neon" />
          Voltar para o Início
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neon flex items-center justify-center text-dark-950 font-display font-black text-base shadow-neon">
            SM
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight text-white">
            SPORT<span className="text-neon">MAKER</span>
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-5xl w-full mx-auto my-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Pitch Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon/10 border border-neon/30 text-neon text-xs font-bold">
            <Database className="w-3.5 h-3.5" />
            <span>MongoDB Auth Ready • JWT Session</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl text-white leading-tight">
            {role === 'player' ? (
              <>
                Entre em Quadra, Crie Partidas e{' '}
                <span className="text-neon">Evolua seu Card.</span>
              </>
            ) : (
              <>
                Gerencie sua Arena, Horários e{' '}
                <span className="text-emerald-400">Catálogo de Produtos.</span>
              </>
            )}
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            {role === 'player'
              ? 'A criação de partidas abertas, reserva de horários vagos e votação de MVP são exclusivas para atletas autenticados na plataforma.'
              : 'Acesse o painel B2B para cadastrar quadras, configurar preços dinâmicos e vender kits de churrasco, bebidas e locação de materiais no checkout.'}
          </p>

          <div className="space-y-3 pt-2">
            {role === 'player' ? (
              <>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-neon shrink-0" />
                  <span>Crie partidas públicas ou privadas e divida o Pix automaticamente</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-neon shrink-0" />
                  <span>Histórico salvo no banco com evolução de OVR e Fair Play</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-neon shrink-0" />
                  <span>Adicione amigos e convide jogadores próximos por GPS</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Controle de ocupação em tempo real e fim dos horários ociosos</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Venda antecipada de produtos do bar e aluguel de equipamentos</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Selo de Arena Verificada com repasse automático via Pix</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-7">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl space-y-6">
            {/* Redirect Alert Banner (When redirected from Create Match / Booking) */}
            {redirectReason && (
              <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-amber-300">Autenticação Necessária</p>
                  <p className="text-slate-300 mt-0.5">{redirectReason}</p>
                </div>
              </div>
            )}

            {/* Role Selector Tabs: Usuário/Atleta vs Proprietário de Arena */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Selecione seu Tipo de Acesso:
              </label>
              <div className="grid grid-cols-2 gap-2.5 p-1.5 rounded-2xl bg-dark-950 border border-white/10">
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('player')}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-display font-bold flex items-center justify-center gap-2 transition-all ${
                    role === 'player'
                      ? 'bg-neon text-dark-950 shadow-neon'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Sou Atleta / Jogador</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSwitch('owner')}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-display font-bold flex items-center justify-center gap-2 transition-all ${
                    role === 'owner'
                      ? 'bg-emerald-400 text-dark-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Sou Dono de Arena</span>
                </button>
              </div>
            </div>

            {/* Login vs Register Toggle */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                  {mode === 'login'
                    ? role === 'player'
                      ? 'Login do Atleta'
                      : 'Portal do Proprietário'
                    : role === 'player'
                      ? 'Criar Conta de Atleta'
                      : 'Cadastrar Nova Arena'}
                </h2>
                <p className="text-xs text-slate-400">
                  {mode === 'login'
                    ? 'Insira suas credenciais cadastradas no banco de dados'
                    : 'Seus dados serão salvos na coleção de usuários do MongoDB'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
                className="text-xs font-bold text-neon hover:underline"
              >
                {mode === 'login' ? 'Criar nova conta →' : 'Já tenho conta →'}
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 font-semibold">
                {error}
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {role === 'player' ? 'Seu Nome ou Apelido de Quadra' : 'Nome do Responsável'}
                  </label>
                  <div className="flex items-center gap-2.5 bg-dark-950 border border-white/10 rounded-xl px-3.5 py-3 focus-within:border-neon">
                    <User className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={
                        role === 'player' ? 'Ex: Gabriel "Flash" Silva' : 'Ex: Carlos Eduardo'
                      }
                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {mode === 'register' && role === 'owner' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nome da Arena / Complexo
                    </label>
                    <div className="flex items-center gap-2.5 bg-dark-950 border border-white/10 rounded-xl px-3.5 py-3 focus-within:border-emerald-400">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <input
                        type="text"
                        value={arenaName}
                        onChange={(e) => setArenaName(e.target.value)}
                        placeholder="Arena Prime Sports"
                        className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      CNPJ (Opcional no Beta)
                    </label>
                    <div className="flex items-center gap-2.5 bg-dark-950 border border-white/10 rounded-xl px-3.5 py-3 focus-within:border-emerald-400">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <input
                        type="text"
                        value={cnpj}
                        onChange={(e) => setCnpj(e.target.value)}
                        placeholder="00.000.000/0001-00"
                        className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {mode === 'register' && role === 'player' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Esporte Principal no seu Player Card
                  </label>
                  <div className="flex items-center gap-2.5 bg-dark-950 border border-white/10 rounded-xl px-3.5 py-3">
                    <Trophy className="w-4 h-4 text-neon" />
                    <select
                      value={favoriteSport}
                      onChange={(e) => setFavoriteSport(e.target.value)}
                      className="w-full bg-transparent text-sm text-white focus:outline-none"
                    >
                      {SPORTS_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-dark-900 text-white">
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  E-mail de Acesso
                </label>
                <div className="flex items-center gap-2.5 bg-dark-950 border border-white/10 rounded-xl px-3.5 py-3 focus-within:border-neon">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      role === 'player' ? 'voce@email.com' : 'contato@suaarena.com.br'
                    }
                    className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Senha
                </label>
                <div className="flex items-center gap-2.5 bg-dark-950 border border-white/10 rounded-xl px-3.5 py-3 focus-within:border-neon">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3.5 rounded-xl font-display font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
                  role === 'player'
                    ? 'bg-neon hover:bg-neon-400 text-dark-950 shadow-neon'
                    : 'bg-emerald-400 hover:bg-emerald-300 text-dark-950 shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {submitting
                    ? 'Autenticando...'
                    : mode === 'login'
                      ? role === 'player'
                        ? 'Entrar como Atleta e Criar Partidas'
                        : 'Entrar no Painel da Arena'
                      : role === 'player'
                        ? 'Finalizar Cadastro de Atleta'
                        : 'Finalizar Cadastro da Arena'}
                </span>
              </button>
            </form>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-neon" /> Senhas criptografadas (bcrypt + JWT)
              </span>
              <span>Coleção: `users` (MongoDB)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 relative z-10">
        SPORT MAKER © 2026 • Autenticação Unificada para Atletas e Arenas Parceiras
      </div>
    </div>
  );
}

