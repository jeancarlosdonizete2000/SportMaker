import React, { useMemo, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Clock,
  CheckCircle2,
  CalendarClock,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Building2,
  Plus,
  Trash2,
  X,
  BarChart3,
  Wrench,
  GraduationCap,
  Coffee,
  Package,
} from 'lucide-react';

const MONTHS_PT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const CATEGORY_META = {
  bar: { label: 'Venda no Bar', type: 'income', icon: Coffee, color: 'text-amber-300 bg-amber-400/15 border-amber-400/30' },
  escolinha: { label: 'Aula de Escolinha', type: 'income', icon: GraduationCap, color: 'text-sky-300 bg-sky-400/15 border-sky-400/30' },
  outros_ganhos: { label: 'Outros Ganhos', type: 'income', icon: TrendingUp, color: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30' },
  produtos: { label: 'Gastos com Produtos', type: 'expense', icon: Package, color: 'text-orange-300 bg-orange-500/15 border-orange-400/30' },
  manutencao: { label: 'Manutenção de Quadra', type: 'expense', icon: Wrench, color: 'text-red-300 bg-red-500/15 border-red-400/30' },
  outras_despesas: { label: 'Outras Despesas', type: 'expense', icon: TrendingDown, color: 'text-rose-300 bg-rose-500/15 border-rose-400/30' },
};

function getTodayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getMonthKeyFromBooking(booking) {
  const raw = String(booking?.dateLabel || '');
  const brFull = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (brFull) return `${brFull[3]}-${brFull[2]}`;
  const iso = raw.match(/(\d{4})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}`;
  const d = booking?.createdAt ? new Date(booking.createdAt) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthKeyFromEntry(entry) {
  if (entry?.dateIso && /^\d{4}-\d{2}/.test(entry.dateIso)) {
    return entry.dateIso.slice(0, 7);
  }
  const d = entry?.createdAt ? new Date(entry.createdAt) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(monthKey) {
  const [y, m] = String(monthKey || '').split('-').map(Number);
  if (!y || !m) return monthKey;
  return `${MONTHS_PT[m - 1] || m}/${y}`;
}

function formatMoney(val) {
  const num = Number(val) || 0;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isMaintenanceBooking(booking) {
  if (!booking) return false;
  const text = `${booking.eventTitle || ''} ${booking.customerName || ''} ${booking.notes || ''}`.toLowerCase();
  return booking.eventColor === 'red' || text.includes('manuten');
}

function isOwnerAddedBooking(booking) {
  if (!booking) return false;
  return (
    booking.bookingStatus === 'manual_block' ||
    String(booking.customerPhone || '').toLowerCase().includes('propriet')
  );
}

export default function OwnerEarningsTab({
  arenas = [],
  bookings = [],
  financeEntries = [],
  onGoToSchedule,
  onGoToArenas,
  onMarkBookingPaid,
  onCreateFinanceEntry,
  onDeleteFinanceEntry,
}) {
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [entryFilter, setEntryFilter] = useState('all'); // 'all' | 'income' | 'expense'

  // Modal Novo Lançamento Financeiro
  const [modalOpen, setModalOpen] = useState(false);
  const [entryType, setEntryType] = useState('income'); // 'income' | 'expense'
  const [category, setCategory] = useState('bar');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dateIso, setDateIso] = useState(getTodayIso);
  const [arenaId, setArenaId] = useState(arenas[0]?._id || '');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [notes, setNotes] = useState('');
  const [savingEntry, setSavingEntry] = useState(false);
  const [entryError, setEntryError] = useState('');

  const openModalWithPreset = (type, cat) => {
    setEntryType(type);
    setCategory(cat);
    setTitle('');
    setAmount('');
    setDateIso(getTodayIso());
    setArenaId(arenas[0]?._id || '');
    setPaymentMethod('Pix');
    setNotes('');
    setEntryError('');
    setModalOpen(true);
  };

  const handleSubmitEntry = async (e) => {
    e.preventDefault();
    const parsedAmount = Number(String(amount || '').replace(',', '.'));
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setEntryError('Informe um valor válido maior que zero.');
      return;
    }
    if (!title.trim()) {
      setEntryError('Informe uma descrição para o lançamento.');
      return;
    }

    setSavingEntry(true);
    setEntryError('');
    try {
      const selectedArena = arenas.find((a) => String(a._id) === String(arenaId));
      await onCreateFinanceEntry({
        arenaId: selectedArena?._id || '',
        arenaName: selectedArena?.name || '',
        type: entryType,
        category,
        title: title.trim(),
        amount: parsedAmount,
        dateIso,
        paymentMethod,
        notes: notes.trim(),
      });
      setModalOpen(false);
    } catch (err) {
      setEntryError(err.message || 'Erro ao salvar lançamento.');
    } finally {
      setSavingEntry(false);
    }
  };

  // Resumo Mensal consolidado (Reservas Pagas + Receitas Manuais - Despesas)
  const monthlySummary = useMemo(() => {
    const map = {};
    const ensureMonth = (key) => {
      if (!map[key]) {
        map[key] = {
          monthKey: key,
          label: formatMonthLabel(key),
          bookingsRevenue: 0,
          extraIncome: 0,
          expenses: 0,
        };
      }
      return map[key];
    };

    const currentMonthKey = getTodayIso().slice(0, 7);
    ensureMonth(currentMonthKey);

    bookings
      .filter(
        (b) =>
          !isMaintenanceBooking(b) &&
          b.bookingStatus !== 'cancelled' &&
          b.paymentStatus === 'paid'
      )
      .forEach((b) => {
        const key = getMonthKeyFromBooking(b);
        ensureMonth(key).bookingsRevenue += Number(b.totalAmount) || 0;
      });

    financeEntries.forEach((entry) => {
      const key = getMonthKeyFromEntry(entry);
      const bucket = ensureMonth(key);
      if (entry.type === 'income') {
        bucket.extraIncome += Number(entry.amount) || 0;
      } else {
        bucket.expenses += Number(entry.amount) || 0;
      }
    });

    return Object.values(map)
      .map((item) => {
        const totalRevenue = item.bookingsRevenue + item.extraIncome;
        return {
          ...item,
          totalRevenue,
          profit: totalRevenue - item.expenses,
        };
      })
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [bookings, financeEntries]);

  // Filtra reservas (excluindo manutenções de quadra) e lançamentos pelo mês selecionado
  const filteredBookings = useMemo(() => {
    const nonMaintenance = bookings.filter((b) => !isMaintenanceBooking(b));
    if (selectedMonth === 'all') return nonMaintenance;
    return nonMaintenance.filter((b) => getMonthKeyFromBooking(b) === selectedMonth);
  }, [bookings, selectedMonth]);

  const filteredEntries = useMemo(() => {
    return financeEntries.filter((e) => {
      const matchesMonth =
        selectedMonth === 'all' || getMonthKeyFromEntry(e) === selectedMonth;
      const matchesType = entryFilter === 'all' || e.type === entryFilter;
      return matchesMonth && matchesType;
    });
  }, [financeEntries, selectedMonth, entryFilter]);

  const periodStats = useMemo(() => {
    const active = filteredBookings.filter((b) => b.bookingStatus !== 'cancelled');
    const paid = active.filter((b) => b.paymentStatus === 'paid');
    const pending = active.filter((b) => b.paymentStatus === 'pending');

    const bookingsRevenue = paid.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
    const pendingRevenue = pending.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);

    const monthEntries =
      selectedMonth === 'all'
        ? financeEntries
        : financeEntries.filter((e) => getMonthKeyFromEntry(e) === selectedMonth);

    const extraIncome = monthEntries
      .filter((e) => e.type === 'income')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalExpenses = monthEntries
      .filter((e) => e.type === 'expense')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const grossRevenue = bookingsRevenue + extraIncome;
    const netProfit = grossRevenue - totalExpenses;

    return {
      bookingsRevenue,
      extraIncome,
      grossRevenue,
      totalExpenses,
      netProfit,
      pendingRevenue,
      paidCount: paid.length,
      activeCount: active.length,
    };
  }, [filteredBookings, financeEntries, selectedMonth]);

  // Calcula ganhos por quadra a partir dos agendamentos filtrados
  const revenueByCourt = useMemo(() => {
    const map = {};
    filteredBookings
      .filter((b) => b.bookingStatus !== 'cancelled' && b.paymentStatus === 'paid')
      .forEach((b) => {
        const key = b.courtName || 'Quadra Principal';
        if (!map[key]) {
          map[key] = { courtName: key, count: 0, total: 0, surface: b.surface || '' };
        }
        map[key].count += 1;
        map[key].total += Number(b.totalAmount) || 0;
      });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredBookings]);

  const maxMonthlyBar = useMemo(() => {
    return Math.max(
      1,
      ...monthlySummary.map((m) => Math.max(m.totalRevenue, m.expenses))
    );
  }, [monthlySummary]);

  return (
    <div className="space-y-8 pb-8">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-dark-900 to-dark-950 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
            <Database className="w-3.5 h-3.5" /> Gestão Financeira Completa • MongoDB Atlas
          </div>
          <h1 className="font-display font-black text-2xl sm:text-4xl text-white">
            Financeiro, Lucros & Despesas
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Controle receitas de quadras, vendas no bar, aulas de escolinha, gastos com produtos e manutenções de quadras com fechamento mensal automático.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => openModalWithPreset('income', 'bar')}
            className="px-4 py-3 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-black text-xs sm:text-sm shadow-neon flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Lançamento
          </button>
          <button
            type="button"
            onClick={onGoToSchedule}
            className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all"
          >
            <CalendarClock className="w-4 h-4 text-emerald-400" />
            Agenda
          </button>
          <button
            type="button"
            onClick={onGoToArenas}
            className="px-4 py-3 rounded-xl bg-emerald-400/15 hover:bg-emerald-400/25 border border-emerald-400/35 text-emerald-300 font-display font-bold text-xs sm:text-sm flex items-center gap-2 transition-all"
          >
            <Building2 className="w-4 h-4" />
            Arenas ({arenas.length})
          </button>
        </div>
      </div>

      {/* Atalhos Rápidos + Seletor de Mês */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openModalWithPreset('income', 'bar')}
            className="px-3 py-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Coffee className="w-3.5 h-3.5" /> + Venda no Bar
          </button>
          <button
            type="button"
            onClick={() => openModalWithPreset('income', 'escolinha')}
            className="px-3 py-2 rounded-xl bg-sky-400/10 hover:bg-sky-400/20 border border-sky-400/30 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <GraduationCap className="w-3.5 h-3.5" /> + Aula / Escolinha
          </button>
          <button
            type="button"
            onClick={() => openModalWithPreset('expense', 'produtos')}
            className="px-3 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Package className="w-3.5 h-3.5" /> - Gasto c/ Produtos
          </button>
          <button
            type="button"
            onClick={() => openModalWithPreset('expense', 'manutencao')}
            className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Wrench className="w-3.5 h-3.5" /> - Manutenção
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Período:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-dark-900 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-neon"
          >
            <option value="all">Todos os Meses</option>
            {monthlySummary.map((m) => (
              <option key={m.monthKey} value={m.monthKey}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`glass-card rounded-3xl p-5 border space-y-3 ${
            periodStats.netProfit >= 0
              ? 'border-emerald-400/40 bg-emerald-500/10'
              : 'border-red-500/40 bg-red-500/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Lucro Líquido
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                periodStats.netProfit >= 0
                  ? 'bg-emerald-400/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span
              className={`font-display font-black text-2xl sm:text-3xl ${
                periodStats.netProfit >= 0 ? 'text-emerald-300' : 'text-red-300'
              }`}
            >
              R$ {formatMoney(periodStats.netProfit)}
            </span>
            <span className="block text-[11px] text-slate-300 mt-1">
              Receita Total − Despesas
            </span>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Receita Total
            </span>
            <div className="w-9 h-9 rounded-xl bg-neon/15 text-neon flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="font-display font-black text-2xl sm:text-3xl text-white">
              R$ {formatMoney(periodStats.grossRevenue)}
            </span>
            <span className="block text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Quadras R$ {formatMoney(periodStats.bookingsRevenue)} + Extras R$ {formatMoney(periodStats.extraIncome)}
            </span>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-red-500/25 bg-red-500/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Despesas Totais
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="font-display font-black text-2xl sm:text-3xl text-red-300">
              R$ {formatMoney(periodStats.totalExpenses)}
            </span>
            <span className="block text-[11px] text-red-300/80 mt-1 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" /> Produtos, Manutenções & Custos
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
            <span className="font-display font-black text-2xl sm:text-3xl text-sky-300">
              R$ {formatMoney(periodStats.pendingRevenue)}
            </span>
            <span className="block text-[11px] text-slate-400 mt-1">
              Reservas ativas no período: <strong className="text-white">{periodStats.activeCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* VISÃO MENSAL DE LUCROS E DESPESAS */}
      <div className="glass-card rounded-3xl p-6 border border-white/15 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" /> Fechamento Mensal
            </span>
            <h3 className="font-display font-black text-xl text-white mt-0.5">
              Lucros & Despesas por Mês
            </h3>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold">
            <span className="flex items-center gap-1.5 text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Receitas
            </span>
            <span className="flex items-center gap-1.5 text-red-300">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Despesas
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthlySummary.map((m) => {
            const revPct = Math.round((m.totalRevenue / maxMonthlyBar) * 100);
            const expPct = Math.round((m.expenses / maxMonthlyBar) * 100);
            const isSelected = selectedMonth === m.monthKey;
            return (
              <button
                key={m.monthKey}
                type="button"
                onClick={() =>
                  setSelectedMonth(isSelected ? 'all' : m.monthKey)
                }
                className={`text-left p-4 rounded-2xl border transition-all space-y-3 ${
                  isSelected
                    ? 'bg-neon/10 border-neon'
                    : 'bg-dark-950/90 border-white/10 hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-black text-base text-white">
                    {m.label}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                      m.profit >= 0
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    Lucro: R$ {formatMoney(m.profit)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Receitas</span>
                      <span className="font-bold text-emerald-300">
                        R$ {formatMoney(m.totalRevenue)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{ width: `${Math.max(m.totalRevenue > 0 ? 4 : 0, revPct)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Despesas</span>
                      <span className="font-bold text-red-300">
                        R$ {formatMoney(m.expenses)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-400"
                        style={{ width: `${Math.max(m.expenses > 0 ? 4 : 0, expPct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* LANÇAMENTOS MANUAIS (BAR, ESCOLINHA, PRODUTOS E MANUTENÇÕES) */}
      <div className="glass-card rounded-3xl p-6 border border-white/15 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4" /> Bar, Escolinha, Produtos & Manutenções
            </span>
            <h3 className="font-display font-black text-xl text-white mt-0.5">
              Lançamentos Financeiros ({filteredEntries.length})
            </h3>
          </div>

          <div className="flex items-center gap-1.5 bg-dark-950 p-1 rounded-xl border border-white/10">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'income', label: 'Receitas' },
              { id: 'expense', label: 'Despesas' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setEntryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  entryFilter === tab.id
                    ? 'bg-neon text-dark-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-6 rounded-2xl bg-dark-950/70 border border-white/10 text-center space-y-2">
            <p className="text-sm font-bold text-white">
              Nenhum lançamento manual neste período.
            </p>
            <p className="text-xs text-slate-400">
              Clique em <strong>+ Novo Lançamento</strong> para registrar vendas no bar, aulas de escolinha, gastos com produtos ou manutenções.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredEntries.map((entry) => {
              const meta = CATEGORY_META[entry.category] || CATEGORY_META.outros_ganhos;
              const Icon = meta.icon;
              const isIncome = entry.type === 'income';
              return (
                <div
                  key={entry._id}
                  className="p-4 rounded-2xl bg-dark-950/90 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {entry.title}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {entry.dateIso?.split('-').reverse().join('/')}
                        {entry.arenaName ? ` • ${entry.arenaName}` : ''} • {entry.paymentMethod}
                        {entry.notes ? ` • ${entry.notes}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span
                      className={`font-display font-black text-lg ${
                        isIncome ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'} R$ {formatMoney(entry.amount)}
                    </span>
                    {onDeleteFinanceEntry && (
                      <button
                        type="button"
                        onClick={() => onDeleteFinanceEntry(entry._id)}
                        title="Excluir lançamento"
                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Breakdown by Court + Recent Bookings */}
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
              Nenhum pagamento de quadra registrado neste período.
            </p>
          ) : (
            <div className="space-y-3">
              {revenueByCourt.map((item) => {
                const pct =
                  periodStats.bookingsRevenue > 0
                    ? Math.min(100, Math.round((item.total / periodStats.bookingsRevenue) * 100))
                    : 0;
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
                          R$ {formatMoney(item.total)}
                        </span>
                        <span className="block text-[10px] text-slate-400">{pct}% das quadras</span>
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
                Extrato de Reservas
              </span>
              <h3 className="font-display font-extrabold text-lg text-white">
                Movimentações de Horários
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {filteredBookings.length} registros
            </span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {filteredBookings.map((booking) => {
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
                      <span className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                        {booking.customerName}
                        {isOwnerAddedBooking(booking) && (
                          <span className="px-2 py-0.5 rounded bg-sky-400/20 border border-sky-400/40 text-sky-300 text-[9px] font-black uppercase">
                            Adicionado pelo Proprietário
                          </span>
                        )}
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
                        R$ {formatMoney(booking.totalAmount)}
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

      {/* MODAL: NOVO LANÇAMENTO FINANCEIRO (RECEITA / DESPESA) */}
      {modalOpen && (
        <div
          data-modal-overlay="true"
          onClick={() => !savingEntry && setModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <form
            onSubmit={handleSubmitEntry}
            onClick={(e) => e.stopPropagation()}
            className="bg-dark-900 border border-white/15 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neon">
                  Sistema Financeiro
                </span>
                <h3 className="font-display font-black text-xl text-white">
                  Novo Lançamento
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alternador Receita vs Despesa */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-dark-950 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setEntryType('income');
                  setCategory('bar');
                }}
                className={`py-2.5 rounded-xl text-xs font-display font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                  entryType === 'income'
                    ? 'bg-emerald-400 text-dark-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" /> Receita (Ganho)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntryType('expense');
                  setCategory('produtos');
                }}
                className={`py-2.5 rounded-xl text-xs font-display font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                  entryType === 'expense'
                    ? 'bg-red-500 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <TrendingDown className="w-4 h-4" /> Despesa (Gasto)
              </button>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Categoria:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(CATEGORY_META)
                  .filter(([, meta]) => meta.type === entryType)
                  .map(([key, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCategory(key)}
                        className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 text-center transition-all ${
                          category === key
                            ? 'border-neon bg-neon/10 text-white'
                            : 'border-white/10 bg-dark-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="leading-tight">{meta.label}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Descrição:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  category === 'bar'
                    ? 'Ex: Vendas do Bar - Sábado'
                    : category === 'escolinha'
                      ? 'Ex: Mensalidade Escolinha Sub-13'
                      : category === 'manutencao'
                        ? 'Ex: Troca de refletores / Grama'
                        : 'Ex: Reposição de bebidas e gelo'
                }
                className="w-full bg-dark-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neon"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Valor (R$):
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-dark-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-neon"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Data:
                </label>
                <input
                  type="date"
                  required
                  value={dateIso}
                  onChange={(e) => setDateIso(e.target.value)}
                  className="w-full bg-dark-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neon"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Arena:
                </label>
                <select
                  value={arenaId}
                  onChange={(e) => setArenaId(e.target.value)}
                  className="w-full bg-dark-950 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-neon"
                >
                  <option value="">Geral</option>
                  {arenas.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Pagamento:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-dark-950 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-neon"
                >
                  <option value="Pix">Pix</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Observações (opcional):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhes adicionais..."
                className="w-full bg-dark-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon"
              />
            </div>

            {entryError && (
              <p className="text-xs font-bold text-red-400">{entryError}</p>
            )}

            <button
              type="submit"
              disabled={savingEntry}
              className={`w-full py-3 rounded-xl font-display font-black text-sm transition-all ${
                entryType === 'income'
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-dark-950'
                  : 'bg-red-500 hover:bg-red-400 text-white'
              }`}
            >
              {savingEntry
                ? 'Salvando...'
                : entryType === 'income'
                  ? 'Registrar Receita'
                  : 'Registrar Despesa'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
