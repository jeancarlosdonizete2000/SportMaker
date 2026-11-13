import React, { useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  CalendarClock,
  Crown,
  ArrowUpRight,
  Database,
  Building2,
} from 'lucide-react';

export default function OwnerEarningsTab({
  arenas = [],
  bookings = [],
  metrics = {},
  onGoToSchedule,
  onGoToArenas,
  onMarkBookingPaid,
}) {
  const {
    totalRevenue = 0,
    courtRevenue = 0,
    productsRevenue = 0,
    pendingRevenue = 0,
    totalBookingsCount = 0,
    paidBookingsCount = 0,
    averageTicket = 0,
  } = metrics;

  // Calcula ganhos por quadra a partir dos agendamentos salvos no MongoDB
  const revenueByCourt = useMemo(() => {
    const map = {};
    bookings
      .filter((b) => b.bookingStatus !== 'cancelled' && b.paymentStatus === 'paid')
      .forEach((b) => {
        const key = b.courtName || 'Quadra Principal';
        if (!map[key]) {
          map[key] = { courtName: key, count: 0, total: 0, surface: b.surface || '' };
        }
        map[key].count += 1;
        map[key].total += b.totalAmount || 0;
      });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [bookings]);

  return (
    <div className="space-y-8 pb-8">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-dark-900 to-dark-950 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
            <Database className="w-3.5 h-3.5" /> Painel Financeiro em Tempo Real • MongoDB Atlas
          </div>
          <h1 className="font-display font-black text-2xl sm:text-4xl text-white">
            Painel de Ganhos & Faturamento
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Acompanhe receitas de locação de quadras, vendas de produtos/bar no 3º tempo, repasses via Pix Split e ocupação de todas as suas arenas cadastradas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={onGoToSchedule}
            className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all"
          >
            <CalendarClock className="w-4 h-4 text-emerald-400" />
            Ver Quadro de Horários
          </button>
          <button
            onClick={onGoToArenas}
            className="px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-dark-950 font-display font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(52,211,153,0.4)] flex items-center gap-2 transition-all"
          >
            <Building2 className="w-4 h-4" />
            Configurar Minhas Arenas ({arenas.length})
          </button>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-3xl p-5 border border-emerald-400/30 bg-emerald-500/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Receita Confirmada (Pix/Cartão)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="font-display font-black text-3xl text-white">
              R$ {totalRevenue.toLocaleString('pt-BR')},00
            </span>
            <span className="block text-[11px] font-bold text-emerald-400 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> {paidBookingsCount} horários liquidados
            </span>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Locação de Quadras
            </span>
            <div className="w-9 h-9 rounded-xl bg-neon/15 text-neon flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="font-display font-black text-3xl text-white">
              R$ {courtRevenue.toLocaleString('pt-BR')},00
            </span>
            <span className="block text-[11px] text-slate-400 mt-1">
              Ticket médio total: <strong className="text-white">R$ {averageTicket},00</strong> / jogo
            </span>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ganhos Extras (Bar & Produtos)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="font-display font-black text-3xl text-amber-300">
              R$ {productsRevenue.toLocaleString('pt-BR')},00
            </span>
            <span className="block text-[11px] text-slate-400 mt-1">
              Kit Churrasco, Isotônicos & Locação
            </span>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              A Receber no Check-in
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-400/15 text-sky-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="font-display font-black text-3xl text-sky-300">
              R$ {pendingRevenue.toLocaleString('pt-BR')},00
            </span>
            <span className="block text-[11px] text-slate-400 mt-1">
              Total de reservas ativas: <strong className="text-white">{totalBookingsCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown by Court + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Ganhos por Quadra */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 border border-white/10 space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Desempenho por Espaço
            </span>
            <h3 className="font-display font-extrabold text-lg text-white">
              Faturamento por Quadra
            </h3>
          </div>

          {revenueByCourt.length === 0 ? (
            <p className="text-xs text-slate-400 py-6">
              Nenhum pagamento registrado ainda. Adicione ou confirme horários no quadro.
            </p>
          ) : (
            <div className="space-y-3">
              {revenueByCourt.map((item) => {
                const pct =
                  totalRevenue > 0 ? Math.min(100, Math.round((item.total / totalRevenue) * 100)) : 0;
                return (
                  <div
                    key={item.courtName}
                    className="p-4 rounded-2xl bg-dark-950/90 border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-white">{item.courtName}</p>
                        <span className="text-[11px] text-slate-400">
                          {item.surface} • {item.count} {item.count === 1 ? 'partida paga' : 'partidas pagas'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-display font-black text-base text-emerald-400">
                          R$ {item.total},00
                        </span>
                        <span className="block text-[10px] text-slate-400">{pct}% da receita</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-neon"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Extrato Detalhado de Recebimentos (MongoDB Bookings) */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neon">
                Extrato de Reservas & Produtos
              </span>
              <h3 className="font-display font-extrabold text-lg text-white">
                Últimas Movimentações Financeiras
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Sincronizado com MongoDB
            </span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {bookings.map((booking) => {
              const isPaid = booking.paymentStatus === 'paid';
              const isCancelled = booking.bookingStatus === 'cancelled';

              return (
                <div
                  key={booking._id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCancelled
                      ? 'bg-red-500/5 border-red-500/20 opacity-60'
                      : isPaid
                      ? 'bg-dark-950/90 border-white/10'
                      : 'bg-amber-400/5 border-amber-400/30'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[11px] font-bold">
                        {booking.dateLabel} • {booking.slotTime}
                      </span>
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        {booking.customerName}
                        {booking.isProCustomer && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-400 text-dark-950 text-[9px] font-black uppercase flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" /> PRO
                          </span>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {booking.arenaName} • <strong className="text-emerald-400">{booking.courtName}</strong>
                    </p>
                    {booking.productsList && booking.productsList.length > 0 && (
                      <p className="text-[11px] text-amber-300">
                        + Extras: {booking.productsList.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <div className="text-right">
                      <span className="font-display font-black text-lg text-white block">
                        R$ {booking.totalAmount},00
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Quadra R$ {booking.courtAmount} + Prod. R$ {booking.productsAmount || 0} ({booking.paymentMethod})
                      </span>
                    </div>

                    {isCancelled ? (
                      <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold">
                        Cancelado
                      </span>
                    ) : isPaid ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Pago ({booking.paymentMethod})
                      </span>
                    ) : (
                      <button
                        onClick={() => onMarkBookingPaid(booking._id)}
                        className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-dark-950 text-[11px] font-extrabold transition-all"
                      >
                        Confirmar Recebimento
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

