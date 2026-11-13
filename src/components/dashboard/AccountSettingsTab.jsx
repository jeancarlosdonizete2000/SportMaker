import React, { useState } from 'react';
import {
  Settings,
  User,
  Mail,
  Bell,
  Shield,
  Database,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MONGO_CONFIG } from '../../services/mongoClient';

export default function AccountSettingsTab() {
  const { user, updateUserProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [pixKey, setPixKey] = useState(user?.pixKey || user?.email || '');
  const [radiusKm, setRadiusKm] = useState(10);
  const [notifyLobbies, setNotifyLobbies] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateUserProfile({ name, email, pixKey });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="glass-card rounded-3xl p-6 border border-white/15">
        <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
          <Settings className="w-4 h-4" /> Preferências & Segurança
        </span>
        <h2 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
          Configurações da Conta
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Gerencie seus dados sincronizados com o MongoDB, chave Pix para divisão de partidas e notificações de lobbies.
        </p>
      </div>

      <form onSubmit={handleSave} className="glass-card rounded-3xl p-6 border border-white/15 space-y-5">
        {savedSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Dados da conta atualizados com sucesso!
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Nome de Exibição
            </label>
            <div className="flex items-center gap-2.5 bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5">
              <User className="w-4 h-4 text-neon" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              E-mail Cadastrado
            </label>
            <div className="flex items-center gap-2.5 bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5">
              <Mail className="w-4 h-4 text-neon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Chave Pix Padrão (Para receber cotas de partidas)
            </label>
            <div className="flex items-center gap-2.5 bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, E-mail ou Celular"
                className="w-full bg-transparent text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Raio de Alerta de Partidas Públicas ({radiusKm} km)
            </label>
            <input
              type="range"
              min={2}
              max={30}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-lime-400 mt-3 cursor-pointer"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-dark-950/70 border border-white/10">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-neon" />
              <div>
                <p className="text-xs font-bold text-white">
                  Alertas de Vagas em Lobbies Próximos
                </p>
                <p className="text-[11px] text-slate-400">
                  Receber aviso quando faltar 1 ou 2 jogadores em partidas do seu esporte
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotifyLobbies(!notifyLobbies)}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                notifyLobbies ? 'bg-neon text-dark-950' : 'bg-white/10 text-slate-400'
              }`}
            >
              {notifyLobbies ? 'Ativo' : 'Desativado'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-dark-950/70 border border-white/10">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-white">
                  Perfil Visível para Sugestões de Amizade
                </p>
                <p className="text-[11px] text-slate-400">
                  Permitir que atletas da mesma região vejam seu Player Card e OVR
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPublicProfile(!publicProfile)}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                publicProfile ? 'bg-emerald-400 text-dark-950' : 'bg-white/10 text-slate-400'
              }`}
            >
              {publicProfile ? 'Público' : 'Privado'}
            </button>
          </div>
        </div>

        {/* MongoDB Technical Metadata Info */}
        <div className="p-4 rounded-2xl bg-dark-950 border border-neon/25 space-y-2 text-xs text-slate-400">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4 text-neon" />
              ID da Conta: <code className="text-slate-200">{user?._id}</code>
            </span>
            <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-neon/15 text-neon">
              Perfil: {user?.role === 'owner' ? 'Proprietário' : 'Atleta'} • Autenticado via JWT
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs sm:text-sm shadow-neon transition-all"
          >
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
}

