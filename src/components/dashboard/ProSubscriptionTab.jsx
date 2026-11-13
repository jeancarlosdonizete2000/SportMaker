import React, { useState } from 'react';
import {
  Crown,
  Zap,
  Trophy,
  Percent,
  CircleDot,
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  CreditCard,
  QrCode,
  ShieldCheck,
  GitBranch,
  Plus,
  Shuffle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PRO_BENEFITS = [
  {
    icon: Zap,
    title: 'Prioridade Máxima de Fila',
    description:
      'Suas solicitações de entrada em Lobbies Públicos ficam no topo da fila e você recebe alerta 15 minutos antes de abrir horários nobres.',
    tag: 'Fura-Fila Oficial',
  },
  {
    icon: Award,
    title: 'Emblemas & Molduras Exclusivas PRO',
    description:
      'Desbloqueie a tag "👑 Lenda PRO Oficial", moldura dourada no Player Card e destaque visual em todas as listas de partidas.',
    tag: 'Status VIP',
  },
  {
    icon: GitBranch,
    title: 'Montar Campeonato & Chaveamento no App',
    description:
      'Crie torneios de 4, 8 ou 16 equipes/duplas com geração automática de chaves (Quartas, Semifinal e Final) e placar ao vivo.',
    tag: 'Exclusivo PRO',
  },
  {
    icon: Percent,
    title: 'Preços Reduzidos na Criação de Partidas',
    description:
      'Taxa de serviço ZERO e até 15% de desconto direto na criação de partidas e reservas de quadras em arenas parceiras.',
    tag: 'Economia Real',
  },
  {
    icon: CircleDot,
    title: 'Bola Oficial Grátis em Todas as Reservas',
    description:
      'Em qualquer partida agendada pelo app, a locação da Bola Oficial (Penalty S11, Mikasa FT-5 ou Tubo ITF) sai 100% grátis.',
    tag: 'Benefício Físico',
  },
];

const PLANS = [
  {
    id: 'monthly',
    name: 'Plano PRO Mensal',
    price: '24,90',
    period: '/mês',
    billingNote: 'Cobrado mensalmente • Cancele quando quiser',
    badge: 'Flexível',
    highlight: false,
  },
  {
    id: 'annual',
    name: 'Plano PRO Anual',
    price: '199,90',
    period: '/ano',
    equivalentMonthly: 'Equivalente a R$ 16,65/mês (Economize R$ 98,90)',
    billingNote: 'Pagamento único anual • 4 meses grátis',
    badge: 'Mais Assinado • 33% OFF',
    highlight: true,
  },
];

export default function ProSubscriptionTab() {
  const { user, isPro, activateProSubscription } = useAuth();

  // Checkout Modal & Payment Verification State
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pix'); // 'pix' | 'card'
  const [paymentStage, setPaymentStage] = useState('awaiting_payment'); // 'awaiting_payment' | 'verifying' | 'confirmed'
  const [errorMsg, setErrorMsg] = useState('');

  // Championship & Bracket Builder State (Unlocked only after payment confirmation: isPro === true)
  const [tournamentName, setTournamentName] = useState('Copa Sport Maker Society');
  const [teams, setTeams] = useState([
    'Real Vila Olímpia FC',
    'Unidos da Resenha',
    ' Galácticos de Moema',
    'Pinheiros Padel / FC',
  ]);
  const [newTeamInput, setNewTeamInput] = useState('');
  const [semiWinners, setSemiWinners] = useState({ semi1: null, semi2: null });
  const [champion, setChampion] = useState(null);

  const currentPlanObj = PLANS.find((p) => p.id === selectedPlan) || PLANS[1];

  const handleOpenCheckout = (planId) => {
    setSelectedPlan(planId);
    setPaymentStage('awaiting_payment');
    setErrorMsg('');
    setCheckoutOpen(true);
  };

  const handleVerifyAndConfirmPayment = async () => {
    setErrorMsg('');
    setPaymentStage('verifying');

    try {
      // Simula validação junto ao gateway e envia confirmação de pagamento ao backend MongoDB
      await new Promise((r) => setTimeout(r, 1400));
      const txCode = `TX_PRO_${selectedPlan.toUpperCase()}_${Date.now()}`;

      await activateProSubscription({
        planId: selectedPlan,
        paymentMethod,
        transactionCode: txCode,
      });

      setPaymentStage('confirmed');
    } catch (err) {
      setPaymentStage('awaiting_payment');
      setErrorMsg(err.message || 'Pagamento ainda não confirmado.');
    }
  };

  const handleAddTeam = (e) => {
    e.preventDefault();
    if (!newTeamInput.trim() || teams.length >= 4) return;
    setTeams((prev) => [...prev, newTeamInput.trim()]);
    setNewTeamInput('');
  };

  const handleShuffleBracket = () => {
    setTeams((prev) => [...prev].sort(() => Math.random() - 0.5));
    setSemiWinners({ semi1: null, semi2: null });
    setChampion(null);
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Banner Seja PRO */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-500/20 via-dark-900 to-dark-950 border-2 border-amber-400/50 p-6 sm:p-10 shadow-[0_0_40px_-10px_rgba(251,191,36,0.3)] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Sport Maker PRO • Clube de Assinantes</span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-5xl text-white leading-tight">
              Jogue como Profissional.{' '}
              <span className="text-amber-400">Crie Copas, Fure a Fila e Ganhe Bola Grátis.</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Assine o passaporte definitivo do atleta: descontos automáticos na criação de partidas, locação de bola oficial grátis em todas as reservas, emblemas dourados e gerador de campeonatos com chaveamento no app.
            </p>
          </div>

          {/* Current Subscription Status Card */}
          <div className="shrink-0 p-5 rounded-2xl bg-dark-950/90 border border-white/15 min-w-[260px] space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Status da Sua Conta:
            </span>
            {isPro ? (
              <>
                <div className="flex items-center gap-2 text-amber-400 font-display font-black text-lg">
                  <Crown className="w-5 h-5 fill-amber-400" />
                  <span>ASSINANTE PRO ATIVO</span>
                </div>
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Pagamento Confirmado ({user?.proPlan === 'annual' ? 'Plano Anual' : 'Plano Mensal'})
                </p>
                <p className="text-[11px] text-slate-400">
                  Todos os benefícios, descontos e o Criador de Campeonatos estão liberados!
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-slate-200 font-display font-bold text-base">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Plano Gratuito Padrão</span>
                </div>
                <p className="text-xs text-slate-400">
                  Os benefícios PRO são liberados automaticamente após a confirmação do pagamento.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="space-y-4">
        <h2 className="font-display font-black text-2xl text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" /> Benefícios Inclusos na Assinatura PRO
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRO_BENEFITS.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <div
                key={idx}
                className="glass-card rounded-2xl p-5 border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/5 text-amber-300 border border-amber-400/20">
                      {benefit.tag}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base text-white">
                    {benefit.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Disponibilidade:</span>
                  <span className={isPro ? 'text-emerald-400 font-bold' : 'text-amber-400 font-semibold'}>
                    {isPro ? '✓ Liberado na sua conta' : '🔒 Requer Assinatura PRO'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pricing Plans: Mensal R$ 24,90 & Anual R$ 199,90 */}
      <div className="space-y-5">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-1">
            Escolha seu Plano
          </span>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-white">
            Dois Planos Simples. <span className="text-neon">Retorno já no 1º Jogo.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Só com a Bola Oficial grátis e o desconto na criação de partidas, sua assinatura já se paga no primeiro mês.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {PLANS.map((plan) => {
            const isCurrentActive = isPro && user?.proPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 sm:p-8 border-2 transition-all flex flex-col justify-between relative ${
                  plan.highlight
                    ? 'bg-gradient-to-b from-amber-500/15 via-dark-900 to-dark-950 border-amber-400 shadow-[0_0_30px_-5px_rgba(251,191,36,0.3)]'
                    : 'glass-card border-white/15'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full ${
                        plan.highlight
                          ? 'bg-amber-400 text-dark-950'
                          : 'bg-white/10 text-slate-200'
                      }`}
                    >
                      {plan.badge}
                    </span>
                    {isCurrentActive && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Seu Plano Atual
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-black text-2xl text-white">
                    {plan.name}
                  </h3>

                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-slate-400">R$</span>
                    <span className="font-display font-black text-4xl sm:text-5xl text-white">
                      {plan.price}
                    </span>
                    <span className="text-sm text-slate-400 font-semibold">{plan.period}</span>
                  </div>

                  {plan.equivalentMonthly && (
                    <p className="text-xs font-bold text-emerald-400">
                      {plan.equivalentMonthly}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">{plan.billingNote}</p>

                  <ul className="space-y-2.5 pt-4 border-t border-white/10 text-xs text-slate-200">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-neon shrink-0" />
                      <span>Prioridade de fila nos Lobbies Públicos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-neon shrink-0" />
                      <span>Bola Oficial 100% Grátis nas reservas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-neon shrink-0" />
                      <span>15% de desconto na criação de partidas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-neon shrink-0" />
                      <span>Criador de Campeonatos & Chaveamento liberado</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-neon shrink-0" />
                      <span>Emblemas e Moldura PRO Exclusiva no Perfil</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleOpenCheckout(plan.id)}
                  disabled={isCurrentActive}
                  className={`mt-6 w-full py-3.5 rounded-xl font-display font-black text-sm transition-all flex items-center justify-center gap-2 ${
                    isCurrentActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 cursor-default'
                      : plan.highlight
                        ? 'bg-amber-400 hover:bg-amber-300 text-dark-950 shadow-[0_0_25px_rgba(251,191,36,0.4)]'
                        : 'bg-neon hover:bg-neon-400 text-dark-950 shadow-neon'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  <span>
                    {isCurrentActive
                      ? 'Assinatura Ativa'
                      : `Assinar ${plan.name} (R$ ${plan.price})`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* PRO FEATURE: TOURNAMENT & BRACKET BUILDER (Montar Campeonato e Chaveamento Direto no App) */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/15 space-y-6 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4" /> Ferramenta Oficial PRO
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white mt-0.5">
              Montar Campeonato & Chaveamento no App
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Organize copas entre amigos, sorteie os confrontos das semifinais e defina o grande campeão.
            </p>
          </div>

          {isPro ? (
            <button
              onClick={handleShuffleBracket}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-neon flex items-center gap-1.5 border border-neon/30"
            >
              <Shuffle className="w-4 h-4" /> Sortear Chaveamento
            </button>
          ) : (
            <span className="px-3.5 py-2 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
              <Lock className="w-4 h-4" /> Exclusivo para Assinantes com Pagamento Confirmado
            </span>
          )}
        </div>

        {!isPro ? (
          /* Locked Overlay before Payment Confirmation */
          <div className="p-8 rounded-2xl bg-dark-950/90 border border-amber-400/30 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/40 text-amber-400 mx-auto flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="font-display font-black text-xl text-white">
              Gerador de Campeonatos & Chaveamento Bloqueado
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              Assine o plano Mensal (R$ 24,90) ou Anual (R$ 199,90) acima. Assim que o pagamento for confirmado, esta ferramenta será desbloqueada imediatamente!
            </p>
            <button
              onClick={() => handleOpenCheckout('annual')}
              className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-dark-950 font-display font-extrabold text-xs sm:text-sm inline-flex items-center gap-2"
            >
              <Crown className="w-4 h-4" /> Liberar Agora com o Plano PRO
            </button>
          </div>
        ) : (
          /* Unlocked Interactive Bracket Builder for Confirmed Subscribers */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nome do Campeonato / Copa:
                </label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  className="w-full bg-dark-950 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neon"
                />
              </div>

              <form onSubmit={handleAddTeam} className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Editar / Substituir Equipe ({teams.length}/4):
                  </label>
                  <input
                    type="text"
                    value={newTeamInput}
                    onChange={(e) => setNewTeamInput(e.target.value)}
                    placeholder="Digite o nome de um time..."
                    className="w-full bg-dark-950 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neon"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newTeamInput.trim()) return;
                    setTeams((prev) => [newTeamInput.trim(), ...prev.slice(0, 3)]);
                    setNewTeamInput('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-neon text-dark-950 font-bold text-xs flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Atualizar Time
                </button>
              </form>
            </div>

            {/* Visual Bracket Diagram */}
            <div className="p-5 rounded-2xl bg-dark-950 border border-white/10">
              <h4 className="font-display font-black text-base text-amber-400 mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Chaveamento Oficial: {tournamentName}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Semifinals Column */}
                <div className="space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Semifinais (Clique no vencedor)
                  </span>

                  {/* Semifinal 1 */}
                  <div className="p-3.5 rounded-xl bg-dark-900 border border-white/10 space-y-2">
                    <span className="text-[10px] text-neon font-bold uppercase">Semifinal 1</span>
                    {[teams[0], teams[1]].map((team) => (
                      <button
                        key={team}
                        onClick={() => setSemiWinners((prev) => ({ ...prev, semi1: team }))}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${
                          semiWinners.semi1 === team
                            ? 'bg-neon text-dark-950'
                            : 'bg-dark-950 text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        <span>{team}</span>
                        {semiWinners.semi1 === team && <span>Classificado →</span>}
                      </button>
                    ))}
                  </div>

                  {/* Semifinal 2 */}
                  <div className="p-3.5 rounded-xl bg-dark-900 border border-white/10 space-y-2">
                    <span className="text-[10px] text-neon font-bold uppercase">Semifinal 2</span>
                    {[teams[2], teams[3]].map((team) => (
                      <button
                        key={team}
                        onClick={() => setSemiWinners((prev) => ({ ...prev, semi2: team }))}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${
                          semiWinners.semi2 === team
                            ? 'bg-neon text-dark-950'
                            : 'bg-dark-950 text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        <span>{team}</span>
                        {semiWinners.semi2 === team && <span>Classificado →</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grand Final Column */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                    Grande Final
                  </span>
                  <div className="p-4 rounded-2xl bg-dark-900 border-2 border-amber-400/40 space-y-2.5">
                    {[semiWinners.semi1, semiWinners.semi2].map((finalist, idx) => (
                      <button
                        key={idx}
                        disabled={!finalist}
                        onClick={() => finalist && setChampion(finalist)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                          !finalist
                            ? 'bg-dark-950/50 text-slate-500 cursor-not-allowed'
                            : champion === finalist
                              ? 'bg-amber-400 text-dark-950'
                              : 'bg-dark-950 text-white hover:border-amber-400 border border-white/10'
                        }`}
                      >
                        <span>{finalist || `Aguardando Vencedor Semi ${idx + 1}`}</span>
                        {champion === finalist && finalist && <span>🏆</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Champion Podium Column */}
                <div className="text-center p-5 rounded-2xl bg-gradient-to-b from-amber-500/20 to-dark-900 border border-amber-400/50 space-y-2">
                  <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
                    Campeão Oficial da Copa
                  </span>
                  <p className="font-display font-black text-lg text-white">
                    {champion || 'Defina os vencedores ao lado'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PAYMENT CHECKOUT & CONFIRMATION MODAL */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-dark-900 border border-amber-400/40 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" /> Checkout Seguro • Liberação Pós-Confirmação
                </span>
                <h3 className="font-display font-black text-xl text-white mt-0.5">
                  {currentPlanObj.name} — R$ {currentPlanObj.price}
                </h3>
              </div>
              <button
                onClick={() => setCheckoutOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 hover:text-white text-xs font-bold"
              >
                Fechar
              </button>
            </div>

            {paymentStage === 'confirmed' ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h4 className="font-display font-black text-2xl text-white">
                  Pagamento Confirmado! Você agora é PRO 👑
                </h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Sua assinatura <strong className="text-amber-400">{currentPlanObj.name}</strong> foi validada no banco de dados. Todos os seus benefícios (Prioridade de Fila, Bola Grátis, Desconto em Partidas, Emblemas e Criador de Campeonatos) já estão liberados!
                </p>
                <button
                  onClick={() => setCheckoutOpen(false)}
                  className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-dark-950 font-display font-black text-xs sm:text-sm"
                >
                  Aproveitar Benefícios PRO
                </button>
              </div>
            ) : (
              <>
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 font-semibold">
                    {errorMsg}
                  </div>
                )}

                {/* Payment Method Selector */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'pix'
                        ? 'bg-neon/15 border-neon text-neon'
                        : 'bg-dark-950 border-white/10 text-slate-300'
                    }`}
                  >
                    <QrCode className="w-4 h-4" /> Pix (Liberação Imediata)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-neon/15 border-neon text-neon'
                        : 'bg-dark-950 border-white/10 text-slate-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> Cartão de Crédito
                  </button>
                </div>

                {paymentMethod === 'pix' ? (
                  <div className="p-4 rounded-2xl bg-dark-950 border border-white/10 text-center space-y-2">
                    <QrCode className="w-16 h-16 text-neon mx-auto" />
                    <p className="text-xs font-bold text-white">
                      QR Code Pix Oficial • R$ {currentPlanObj.price}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Após realizar o pagamento, clique no botão abaixo para o servidor verificar a confirmação bancária e liberar seus benefícios PRO.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 rounded-2xl bg-dark-950 border border-white/10">
                    <input
                      type="text"
                      placeholder="Número do Cartão •••• •••• •••• 4242"
                      className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Validade (MM/AA)"
                        className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center gap-2.5 text-[11px] text-amber-200">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Garantia de Segurança: Os benefícios de assinante só são ativados na sua conta após o retorno de confirmação do pagamento.
                  </span>
                </div>

                <button
                  type="button"
                  disabled={paymentStage === 'verifying'}
                  onClick={handleVerifyAndConfirmPayment}
                  className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-dark-950 font-display font-black text-sm shadow-[0_0_25px_rgba(251,191,36,0.4)] transition-all"
                >
                  {paymentStage === 'verifying'
                    ? 'Verificando Confirmação de Pagamento...'
                    : `Confirmar Pagamento de R$ ${currentPlanObj.price} e Liberar PRO`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

