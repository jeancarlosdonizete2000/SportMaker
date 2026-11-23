import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  User,
  Mail,
  Bell,
  Shield,
  CheckCircle2,
  CreditCard,
  Crown,
  Lock,
  LogOut,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

export default function AccountSettingsTab() {
  const { user, isPro, token, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [pixKey, setPixKey] = useState(user?.pixKey || user?.email || '');
  const [radiusKm, setRadiusKm] = useState(10);
  const [notifyLobbies, setNotifyLobbies] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Alterar Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Gerenciar Assinatura
  const [cancellingPro, setCancellingPro] = useState(false);

  // Modal de Apagar Conta (Passo 1: Confirmação -> Passo 2: Senha)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const showSuccess = (msg) => {
    setErrorMsg('');
    setSavedSuccess(msg);
    setTimeout(() => setSavedSuccess(''), 4000);
  };

  const handleSaveProfileAndEmail = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await updateUserProfile({
        name: name.trim(),
        email: email.trim(),
        pixKey: pixKey.trim(),
      });
      showSuccess('Dados da conta e e-mail atualizados com sucesso!');
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao atualizar dados da conta.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!currentPassword || !newPassword) {
      setErrorMsg('Preencha a senha atual e a nova senha.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('A nova senha deve possuir no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('A confirmação da nova senha não confere.');
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword({ currentPassword, newPassword }, token);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showSuccess('Senha alterada com sucesso!');
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao alterar a senha.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancelProSubscription = async () => {
    setCancellingPro(true);
    setErrorMsg('');
    try {
      await authService.cancelProSubscription(token);
      await updateUserProfile({ isPro: false, proStatus: 'inactive', proPlan: null });
      showSuccess('Sua assinatura Sport Maker PRO foi cancelada.');
    } catch (err) {
      setErrorMsg(err.message || 'Não foi possível cancelar a assinatura.');
    } finally {
      setCancellingPro(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openDeleteAccountModal = () => {
    setDeleteStep(1);
    setDeletePassword('');
    setDeleteError('');
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      setDeleteError('Digite sua senha para confirmar a exclusão.');
      return;
    }
    setDeletingAccount(true);
    setDeleteError('');
    try {
      await authService.deleteAccount(deletePassword, token);
      setDeleteModalOpen(false);
      logout();
      navigate('/');
    } catch (err) {
      setDeleteError(err.message || 'Senha incorreta ou erro ao apagar conta.');
    } finally {
      setDeletingAccount(false);
    }
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
          Gerencie sua assinatura, e-mail, senha, notificações e segurança da conta.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs sm:text-sm font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Gerenciar Assinatura */}
      <div className="glass-card rounded-3xl p-6 border border-white/15 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Crown className="w-4 h-4" /> Gerenciar Assinatura
            </span>
            <h3 className="font-display font-extrabold text-lg text-white">
              {isPro
                ? `Sport Maker PRO Ativo (${user?.proPlan === 'annual' ? 'Plano Anual' : 'Plano Mensal'})`
                : 'Plano Gratuito'}
            </h3>
            <p className="text-xs text-slate-400">
              {isPro
                ? 'Você possui acesso às cartas PRO exclusivas, prioridade em lobbies e benefícios VIP.'
                : 'Assine o Sport Maker PRO para desbloquear cartas especiais e prioridade nas partidas.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/app/seja-pro')}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-dark-950 font-display font-extrabold text-xs transition-all flex items-center gap-1.5"
            >
              <Crown className="w-4 h-4" />
              <span>{isPro ? 'Ver Detalhes do Plano' : 'Assinar Sport Maker PRO'}</span>
            </button>

            {isPro && (
              <button
                type="button"
                disabled={cancellingPro}
                onClick={handleCancelProSubscription}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 text-xs font-bold transition-all"
              >
                {cancellingPro ? 'Cancelando...' : 'Cancelar Assinatura'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Alterar E-mail, Nome e Preferências */}
      <form
        onSubmit={handleSaveProfileAndEmail}
        className="glass-card rounded-3xl p-6 border border-white/15 space-y-5"
      >
        <h3 className="font-display font-extrabold text-lg text-white flex items-center gap-2">
          <Mail className="w-4 h-4 text-neon" /> Dados da Conta & Alterar E-mail
        </h3>

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
              Alterar E-mail da Conta
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

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs sm:text-sm shadow-neon transition-all"
          >
            Salvar Dados e E-mail
          </button>
        </div>
      </form>

      {/* 3. Alterar Senha */}
      <form
        onSubmit={handleChangePassword}
        className="glass-card rounded-3xl p-6 border border-white/15 space-y-4"
      >
        <h3 className="font-display font-extrabold text-lg text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-neon" /> Alterar Senha
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Senha Atual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neon"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Nova Senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neon"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neon"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={changingPassword}
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-neon hover:text-dark-950 text-white font-display font-extrabold text-xs sm:text-sm border border-white/15 transition-all"
          >
            {changingPassword ? 'Atualizando...' : 'Atualizar Senha'}
          </button>
        </div>
      </form>

      {/* 4. Sair da Conta & Apagar Conta */}
      <div className="glass-card rounded-3xl p-6 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-display font-extrabold text-base text-white">
            Sessão e Exclusão de Conta
          </h3>
          <p className="text-xs text-slate-400">
            Encerre sua sessão atual ou exclua permanentemente seus dados e assinatura.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 text-xs font-display font-extrabold flex items-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>

          <button
            type="button"
            onClick={openDeleteAccountModal}
            className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/35 text-xs font-display font-extrabold flex items-center gap-2 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Apagar Conta</span>
          </button>
        </div>
      </div>

      {/* Modal de Confirmação em 2 Etapas para Apagar Conta */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 max-w-md w-full border border-red-500/40 space-y-5 relative">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-white">
                  Apagar Conta Permanentemente
                </h3>
                <p className="text-xs text-slate-400">
                  Esta ação não poderá ser desfeita.
                </p>
              </div>
            </div>

            {deleteStep === 1 ? (
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Tem certeza que deseja apagar sua conta? Todos os seus dados, estatísticas e histórico serão removidos.
                </p>
                {isPro && (
                  <div className="p-3 rounded-xl bg-amber-400/15 border border-amber-400/35 text-amber-300 text-xs font-bold">
                    ⚠️ Sua assinatura Sport Maker PRO ativa será cancelada automaticamente ao apagar a conta.
                  </div>
                )}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep(2)}
                    className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-display font-extrabold text-xs"
                  >
                    Sim, tenho certeza
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmDeleteAccount} className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-300">
                  Para confirmar a exclusão definitiva{isPro ? ' e o cancelamento da sua assinatura PRO' : ''}, digite sua senha atual:
                </p>

                {deleteError && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold">
                    {deleteError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Sua Senha
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                    autoFocus
                    className="w-full bg-dark-950 border border-red-500/40 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteStep(1)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={deletingAccount}
                    className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-display font-extrabold text-xs flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {deletingAccount ? 'Apagando...' : 'Confirmar e Apagar Conta'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
