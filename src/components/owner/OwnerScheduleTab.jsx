import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Layers,
  Lock,
  Unlock,
  Crown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Wrench,
  Palette,
  X,
} from 'lucide-react';

const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const EVENT_COLORS = [
  {
    id: 'red',
    label: 'Vermelho (Manutenção)',
    dot: 'bg-red-500',
    card: 'bg-red-500/15 border-red-500/50 text-red-200',
    badge: 'bg-red-500/25 text-red-300',
  },
  {
    id: 'amber',
    label: 'Âmbar (Evento / Torneio)',
    dot: 'bg-amber-400',
    card: 'bg-amber-400/15 border-amber-400/50 text-amber-200',
    badge: 'bg-amber-400/25 text-amber-300',
  },
  {
    id: 'blue',
    label: 'Azul (Aula / Escolinha)',
    dot: 'bg-blue-400',
    card: 'bg-blue-500/15 border-blue-400/50 text-blue-200',
    badge: 'bg-blue-500/25 text-blue-300',
  },
  {
    id: 'purple',
    label: 'Roxo (Reserva Privada)',
    dot: 'bg-purple-400',
    card: 'bg-purple-500/15 border-purple-400/50 text-purple-200',
    badge: 'bg-purple-500/25 text-purple-300',
  },
  {
    id: 'cyan',
    label: 'Ciano (Mensalista)',
    dot: 'bg-cyan-400',
    card: 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200',
    badge: 'bg-cyan-500/25 text-cyan-300',
  },
  {
    id: 'emerald',
    label: 'Verde (Reserva Atleta)',
    dot: 'bg-emerald-400',
    card: 'bg-emerald-500/15 border-emerald-400/50 text-emerald-200',
    badge: 'bg-emerald-500/25 text-emerald-300',
  },
];

const QUICK_COMMITMENTS = [
  { title: 'Manutenção da Quadra', color: 'red' },
  { title: 'Torneio / Campeonato', color: 'amber' },
  { title: 'Aula / Escolinha', color: 'blue' },
  { title: 'Mensalista Fixo', color: 'cyan' },
  { title: 'Evento Privado', color: 'purple' },
];

function getColorStyle(colorId) {
  return EVENT_COLORS.find((c) => c.id === colorId) || EVENT_COLORS[5];
}

function toIsoDate(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getTodayIso() {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDateLabelForStorage(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const todayIso = getTodayIso();
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  const tomorrowIso = toIsoDate(tmr.getFullYear(), tmr.getMonth(), tmr.getDate());
  const ddMm = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
  if (isoDate === todayIso) return `Hoje (${ddMm})`;
  if (isoDate === tomorrowIso) return `Amanhã (${ddMm})`;
  return `${ddMm}/${y}`;
}

function bookingMatchesIsoDate(booking, isoDate) {
  if (!booking || booking.bookingStatus === 'cancelled') return false;
  const label = String(booking.dateLabel || '').trim();
  const [y, m, d] = isoDate.split('-');
  const ddMm = `${d}/${m}`;
  const ddMmYyyy = `${d}/${m}/${y}`;
  const todayIso = getTodayIso();
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  const tomorrowIso = toIsoDate(tmr.getFullYear(), tmr.getMonth(), tmr.getDate());

  if (label === isoDate || label.includes(ddMmYyyy) || label.includes(ddMm)) return true;
  if (isoDate === todayIso && label.startsWith('Hoje')) return true;
  if (isoDate === tomorrowIso && label.startsWith('Amanhã')) return true;
  return false;
}

export default function OwnerScheduleTab({
  arenas = [],
  bookings = [],
  onOpenNewBookingModal,
  onUpdateBookingStatus,
  onCreateBooking,
}) {
  const [selectedArenaId, setSelectedArenaId] = useState(arenas[0]?._id || '');
  const currentArena =
    arenas.find((a) => String(a._id) === String(selectedArenaId)) || arenas[0];

  const [selectedCourtId, setSelectedCourtId] = useState(
    currentArena?.courts?.[0]?.id || 'c1'
  );

  const activeCourt =
    currentArena?.courts?.find((c) => c.id === selectedCourtId) ||
    currentArena?.courts?.[0] || { id: 'c1', name: 'Quadra Principal', surface: 'Grama Sintética', sport: 'Futebol Society' };

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDateIso, setSelectedDateIso] = useState(getTodayIso);

  // Modal de edição de horário clicado na agenda
  const [slotModal, setSlotModal] = useState(null); // { time, existingBooking }
  const [slotMode, setSlotMode] = useState('free'); // 'free' | 'commitment'
  const [eventTitle, setEventTitle] = useState('Manutenção da Quadra');
  const [eventColor, setEventColor] = useState('red');
  const [eventNotes, setEventNotes] = useState('');
  const [savingSlot, setSavingSlot] = useState(false);

  const arenaBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          (!currentArena || String(b.arenaId) === String(currentArena._id)) &&
          b.bookingStatus !== 'cancelled'
      ),
    [bookings, currentArena]
  );

  // Dias do calendário mensal
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toIsoDate(viewYear, viewMonth, d);
      const dayEvents = arenaBookings.filter((b) => bookingMatchesIsoDate(b, iso));
      cells.push({ day: d, iso, events: dayEvents });
    }
    return cells;
  }, [viewYear, viewMonth, arenaBookings]);

  const selectedDayBookings = useMemo(
    () =>
      arenaBookings.filter(
        (b) =>
          bookingMatchesIsoDate(b, selectedDateIso) &&
          ((b.courtId && b.courtId === activeCourt.id) ||
            (b.courtName && b.courtName === activeCourt.name) ||
            !currentArena?.courts?.length ||
            currentArena.courts.length === 1)
      ),
    [arenaBookings, selectedDateIso, activeCourt, currentArena]
  );

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleOpenSlotModal = (slotTime) => {
    const existing = selectedDayBookings.find((b) => b.slotTime === slotTime) || null;
    setSlotModal({ time: slotTime, existingBooking: existing });
    if (existing) {
      setSlotMode('commitment');
      setEventTitle(existing.eventTitle || existing.customerName || 'Compromisso');
      setEventColor(
        existing.eventColor ||
          (existing.bookingStatus === 'manual_block' ? 'red' : 'emerald')
      );
      setEventNotes(existing.notes || '');
    } else {
      setSlotMode('commitment');
      setEventTitle('Manutenção da Quadra');
      setEventColor('red');
      setEventNotes('');
    }
  };

  const handleSaveSlotAction = async (e) => {
    e.preventDefault();
    if (!slotModal || !currentArena) return;
    setSavingSlot(true);
    try {
      const { time, existingBooking } = slotModal;

      if (slotMode === 'free') {
        if (existingBooking && onUpdateBookingStatus) {
          await onUpdateBookingStatus(existingBooking._id, {
            bookingStatus: 'cancelled',
          });
        }
        setSlotModal(null);
        return;
      }

      // Se já existia um compromisso anterior neste horário, atualiza diretamente (mantendo o registro e aplicando a nova cor/título)
      if (existingBooking && onUpdateBookingStatus) {
        await onUpdateBookingStatus(existingBooking._id, {
          bookingStatus: existingBooking.bookingStatus === 'cancelled' ? 'manual_block' : existingBooking.bookingStatus,
          eventTitle: eventTitle.trim() || 'Compromisso / Manutenção',
          eventColor,
          notes: eventNotes.trim(),
        });
        setSlotModal(null);
        return;
      }

      if (onCreateBooking) {
        await onCreateBooking({
          arenaId: currentArena._id,
          courtId: activeCourt.id,
          courtName: activeCourt.name,
          surface: activeCourt.surface || 'Grama Sintética',
          sport: activeCourt.sport || currentArena.sportLabel || 'Futebol Society',
          dateLabel: formatDateLabelForStorage(selectedDateIso),
          slotTime: time,
          customerName: eventTitle.trim() || 'Compromisso / Manutenção',
          customerPhone: 'Agenda do Proprietário',
          courtAmount: 0,
          productsAmount: 0,
          paymentMethod: 'Presencial',
          paymentStatus: 'paid',
          bookingStatus: 'manual_block',
          eventTitle: eventTitle.trim() || 'Compromisso / Manutenção',
          eventColor,
          notes: eventNotes.trim(),
        });
      }
      setSlotModal(null);
    } finally {
      setSavingSlot(false);
    }
  };

  const selectedDateDisplay = formatDateLabelForStorage(selectedDateIso);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/15 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <CalendarClock className="w-4 h-4" /> Agenda Completa da Arena
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Quadro de Horários & Compromissos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Navegue pelos meses e dias, marque manutenções ou compromissos com cores personalizadas e sincronize em tempo real com o app dos atletas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {arenas.length > 1 && (
            <select
              value={currentArena?._id || ''}
              onChange={(e) => {
                setSelectedArenaId(e.target.value);
                const next = arenas.find((a) => String(a._id) === e.target.value);
                if (next?.courts?.[0]?.id) setSelectedCourtId(next.courts[0].id);
              }}
              className="bg-dark-900 border border-white/15 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-emerald-400"
            >
              {arenas.map((arena) => (
                <option key={arena._id} value={arena._id} className="bg-dark-900">
                  {arena.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => onOpenNewBookingModal(currentArena)}
            className="px-5 py-3 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs sm:text-sm shadow-neon flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nova Reserva de Cliente
          </button>
        </div>
      </div>

      {/* AGENDA MENSAL + GRADE DE HORÁRIOS DO DIA */}
      {currentArena && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda: Calendário Mensal Interativo */}
          <div className="lg:col-span-5 glass-card rounded-3xl p-5 sm:p-6 border border-white/15 space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center">
                <h3 className="font-display font-black text-lg text-white">
                  {MONTHS_PT[viewMonth]} {viewYear}
                </h3>
                <span className="text-[11px] text-slate-400">
                  Selecione um dia para gerenciar os horários
                </span>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS_PT.map((wd) => (
                <span
                  key={wd}
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-400 py-1"
                >
                  {wd}
                </span>
              ))}
            </div>

            {/* Grade do mês */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((cell, idx) => {
                if (!cell) return <div key={`empty-${idx}`} />;
                const isSelected = cell.iso === selectedDateIso;
                const isToday = cell.iso === getTodayIso();
                const uniqueColors = Array.from(
                  new Set(
                    cell.events.map(
                      (ev) =>
                        ev.eventColor ||
                        (ev.bookingStatus === 'manual_block' ? 'red' : 'emerald')
                    )
                  )
                ).slice(0, 3);

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => setSelectedDateIso(cell.iso)}
                    className={`relative h-11 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-neon text-dark-950 border-neon shadow-neon'
                        : isToday
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
                          : 'bg-dark-950/70 text-slate-200 border-white/5 hover:border-white/25'
                    }`}
                  >
                    <span>{cell.day}</span>
                    {uniqueColors.length > 0 && (
                      <span className="flex items-center gap-0.5 mt-0.5">
                        {uniqueColors.map((cId) => (
                          <span
                            key={cId}
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-dark-950' : getColorStyle(cId).dot
                            }`}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legenda de Cores */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2">
              {EVENT_COLORS.map((c) => (
                <span
                  key={c.id}
                  className="text-[10px] text-slate-300 flex items-center gap-1"
                >
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  {c.label.split(' ')[0]}
                </span>
              ))}
            </div>
          </div>

          {/* Coluna Direita: Horários do Dia Selecionado */}
          <div className="lg:col-span-7 glass-card rounded-3xl p-5 sm:p-6 border border-white/15 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Agenda de {selectedDateDisplay}
                </span>
                <h3 className="font-display font-extrabold text-xl text-white mt-0.5">
                  {currentArena.name} • {activeCourt.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Clique em qualquer horário para deixar <strong>Livre</strong> ou marcar um <strong>Compromisso / Manutenção</strong> (atualiza na hora para os atletas).
                </p>
              </div>

              {currentArena.courts?.length > 1 && (
                <select
                  value={activeCourt.id}
                  onChange={(e) => setSelectedCourtId(e.target.value)}
                  className="bg-dark-950 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-neon"
                >
                  {currentArena.courts.map((c) => (
                    <option key={c.id} value={c.id} className="bg-dark-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(currentArena.slots || []).map((slot) => {
                const booking = selectedDayBookings.find((b) => b.slotTime === slot.time);
                const colorStyle = booking
                  ? getColorStyle(
                      booking.eventColor ||
                        (booking.bookingStatus === 'manual_block' ? 'red' : 'emerald')
                    )
                  : null;

                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => handleOpenSlotModal(slot.time)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 min-h-[104px] ${
                      booking
                        ? `${colorStyle.card} hover:brightness-110`
                        : 'bg-dark-950/70 border-white/10 text-slate-200 hover:border-neon/50 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-black text-lg text-white">
                        {slot.time}
                      </span>
                      {booking ? (
                        <Lock className="w-4 h-4 shrink-0" />
                      ) : (
                        <Unlock className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>

                    <div>
                      {booking ? (
                        <>
                          <span
                            className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md mb-1 ${colorStyle.badge}`}
                          >
                            {booking.bookingStatus === 'manual_block'
                              ? 'Bloqueado / Compromisso'
                              : 'Reservado'}
                          </span>
                          <p className="text-xs font-bold text-white truncate">
                            {booking.eventTitle || booking.customerName}
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                            Livre (Padrão)
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Disponível p/ atletas
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reservas & Compromissos do Dia Selecionado */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-neon" />
            Detalhes de {selectedDateDisplay} ({selectedDayBookings.length})
          </h3>
        </div>

        {selectedDayBookings.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 border border-white/10 text-center text-xs sm:text-sm text-slate-400">
            Nenhum compromisso ou reserva marcada para {selectedDateDisplay}. Todos os horários estão livres para os atletas!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedDayBookings.map((booking) => {
              const isPaid = booking.paymentStatus === 'paid';
              const isManual = booking.bookingStatus === 'manual_block';
              const colorStyle = getColorStyle(
                booking.eventColor || (isManual ? 'red' : 'emerald')
              );

              return (
                <div
                  key={booking._id}
                  className={`glass-card rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 ${colorStyle.card}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full bg-dark-950/80 border border-white/15 text-white text-xs font-black flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${colorStyle.dot}`} />
                        {booking.dateLabel} às {booking.slotTime}
                      </span>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${colorStyle.badge}`}>
                        {isManual
                          ? 'Compromisso / Bloqueio'
                          : isPaid
                            ? `Pago • ${booking.paymentMethod}`
                            : 'Pagamento Pendente'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-display font-bold text-lg text-white">
                        {booking.eventTitle || booking.customerName}
                      </h4>
                      <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                        <Layers className="w-3.5 h-3.5 text-neon" /> {booking.courtName} •{' '}
                        {booking.surface}
                      </p>
                      {booking.notes && (
                        <p className="text-xs text-slate-300 mt-1.5 bg-dark-950/50 rounded-xl p-2.5 border border-white/10">
                          {booking.notes}
                        </p>
                      )}
                    </div>

                    {!isManual && (
                      <div className="p-3 rounded-2xl bg-dark-950/80 border border-white/10 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            Atleta: {booking.customerName}
                            {booking.isProCustomer && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-dark-950 text-[9px] font-black uppercase flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5" /> PRO
                              </span>
                            )}
                          </p>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-neon" /> {booking.customerPhone}
                          </span>
                        </div>
                        <span className="font-display font-black text-lg text-emerald-400">
                          R$ {booking.totalAmount},00
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                    {!isManual && !isPaid && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateBookingStatus(booking._id, { paymentStatus: 'paid' })
                        }
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 text-xs font-extrabold flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Pagamento
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateBookingStatus(booking._id, { bookingStatus: 'cancelled' })
                      }
                      className="px-3.5 py-2 rounded-xl bg-dark-950/70 hover:bg-red-500/20 text-slate-200 hover:text-red-300 border border-white/15 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {isManual ? 'Liberar Horário' : 'Cancelar & Reembolsar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: CONFIGURAR HORÁRIO CLICADO (LIVRE vs COMPROMISSO COM COR) */}
      {slotModal && (
        <div
          onClick={() => setSlotModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSaveSlotAction}
            onClick={(e) => e.stopPropagation()}
            className="bg-dark-900 border border-white/15 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neon">
                  {selectedDateDisplay} • {slotModal.time}
                </span>
                <h3 className="font-display font-black text-xl text-white mt-0.5">
                  Configurar Horário na Agenda
                </h3>
                <p className="text-xs text-slate-400">{activeCourt.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSlotModal(null)}
                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alternador: Livre vs Marcar Compromisso */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-dark-950 border border-white/10">
              <button
                type="button"
                onClick={() => setSlotMode('free')}
                className={`py-2.5 px-3 rounded-xl text-xs font-display font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                  slotMode === 'free'
                    ? 'bg-emerald-400 text-dark-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Unlock className="w-4 h-4" /> Livre (Padrão)
              </button>
              <button
                type="button"
                onClick={() => setSlotMode('commitment')}
                className={`py-2.5 px-3 rounded-xl text-xs font-display font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                  slotMode === 'commitment'
                    ? 'bg-neon text-dark-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Wrench className="w-4 h-4" /> Compromisso
              </button>
            </div>

            {slotMode === 'free' ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-xs text-emerald-200 leading-relaxed">
                O horário <strong>{slotModal.time}</strong> em <strong>{selectedDateDisplay}</strong> ficará <strong>Livre</strong> e disponível imediatamente para reserva no aplicativo dos atletas.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Atalhos rápidos */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_COMMITMENTS.map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => {
                        setEventTitle(preset.title);
                        setEventColor(preset.color);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-slate-200"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nome do Compromisso / Motivo do Bloqueio:
                  </label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Ex: Manutenção da grama, Torneio, Aula..."
                    className="w-full bg-dark-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neon"
                  />
                </div>

                {/* Seletor de Cor do Compromisso */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-neon" /> Cor na Agenda:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {EVENT_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setEventColor(c.id)}
                        className={`px-2.5 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                          eventColor === c.id
                            ? 'border-neon bg-neon/10 text-white'
                            : 'border-white/10 bg-dark-950 text-slate-300 hover:border-white/30'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full shrink-0 ${c.dot}`} />
                        <span className="truncate">{c.label.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Observações (opcional):
                  </label>
                  <input
                    type="text"
                    value={eventNotes}
                    onChange={(e) => setEventNotes(e.target.value)}
                    placeholder="Detalhes adicionais para sua equipe..."
                    className="w-full bg-dark-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-neon"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSlotModal(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingSlot}
                className="px-5 py-2.5 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-xs shadow-neon"
              >
                {savingSlot
                  ? 'Salvando...'
                  : slotMode === 'free'
                    ? 'Confirmar Horário Livre'
                    : 'Salvar na Agenda'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
