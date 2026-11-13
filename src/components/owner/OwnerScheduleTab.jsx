import React, { useState } from 'react';
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
} from 'lucide-react';

export default function OwnerScheduleTab({
  arenas = [],
  bookings = [],
  onOpenNewBookingModal,
  onToggleSlotStatus,
  onUpdateBookingStatus,
}) {
  const [selectedArenaId, setSelectedArenaId] = useState(arenas[0]?._id || '');
  const [selectedDateFilter, setSelectedDateFilter] = useState('Todos');

  const currentArena =
    arenas.find((a) => String(a._id) === String(selectedArenaId)) || arenas[0];

  const filteredBookings = bookings.filter((b) => {
    const matchesArena = !currentArena || String(b.arenaId) === String(currentArena._id);
    const matchesDate =
      selectedDateFilter === 'Todos' || b.dateLabel === selectedDateFilter;
    return matchesArena && matchesDate;
  });

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/15 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <CalendarClock className="w-4 h-4" /> Gestão de Ocupação & Reservas
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Quadro de Horários Marcados
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Controle os horários disponíveis ou ocupados da sua arena, aprove pagamentos pendentes e lance reservas manuais (WhatsApp / Balcão).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {arenas.length > 1 && (
            <select
              value={currentArena?._id || ''}
              onChange={(e) => setSelectedArenaId(e.target.value)}
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
            Marcar Novo Horário
          </button>
        </div>
      </div>

      {/* Interactive Slot Grid for Current Arena */}
      {currentArena && (
        <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display font-extrabold text-lg text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-neon" />
                Grade Rápida de Horários • {currentArena.name}
              </h3>
              <p className="text-xs text-slate-400">
                Clique em qualquer horário abaixo para alternar entre <strong className="text-emerald-400">Disponível</strong> e <strong className="text-amber-300">Ocupado / Bloqueado</strong> no app dos atletas (salvo direto no MongoDB).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {(currentArena.slots || []).map((slot) => {
              const isBooked = slot.status === 'booked' || slot.status === 'blocked';
              return (
                <button
                  key={slot.time}
                  onClick={() => onToggleSlotStatus(currentArena, slot.time)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    isBooked
                      ? 'bg-amber-400/10 border-amber-400/40 text-amber-200 hover:bg-amber-400/20'
                      : 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-black text-base text-white">
                      {slot.time}
                    </span>
                    {isBooked ? (
                      <Lock className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Unlock className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                        isBooked ? 'text-amber-300' : 'text-emerald-400'
                      }`}
                    >
                      {isBooked ? 'Ocupado / Reservado' : 'Livre no App'}
                    </span>
                    {slot.discount && (
                      <span className="text-[10px] text-neon font-bold">
                        Promo: {slot.discount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Pills for Bookings List */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['Todos', 'Hoje', 'Amanhã', 'Sábado'].map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDateFilter(day)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                selectedDateFilter === day
                  ? 'bg-emerald-400 text-dark-950 border-emerald-400'
                  : 'bg-dark-900 text-slate-300 border-white/10 hover:border-white/30'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400">
          Exibindo <strong className="text-white">{filteredBookings.length}</strong> horários marcados
        </span>
      </div>

      {/* Scheduled Bookings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBookings.map((booking) => {
          const isPaid = booking.paymentStatus === 'paid';
          const isCancelled = booking.bookingStatus === 'cancelled';

          return (
            <div
              key={booking._id}
              className={`glass-card rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                isCancelled
                  ? 'border-red-500/20 opacity-60'
                  : 'border-white/10 hover:border-emerald-400/40'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-neon/15 border border-neon/30 text-neon text-xs font-black">
                      {booking.dateLabel} às {booking.slotTime}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {booking.sport}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      isCancelled
                        ? 'bg-red-500/20 text-red-300'
                        : isPaid
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-400/20 text-amber-300'
                    }`}
                  >
                    {isCancelled
                      ? 'Cancelada'
                      : isPaid
                      ? `Pago • ${booking.paymentMethod}`
                      : 'Pagamento Pendente'}
                  </span>
                </div>

                <div>
                  <h4 className="font-display font-bold text-lg text-white flex items-center gap-2">
                    <span>{booking.courtName}</span>
                  </h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" /> Piso: {booking.surface}
                  </p>
                </div>

                {/* Customer Info */}
                <div className="p-3.5 rounded-2xl bg-dark-950/90 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      Responsável: {booking.customerName}
                      {booking.isProCustomer && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-400 text-dark-950 text-[9px] font-black uppercase flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5" /> Assinante PRO
                        </span>
                      )}
                    </p>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-neon" /> {booking.customerPhone}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Total da Reserva</span>
                    <span className="font-display font-black text-lg text-emerald-400">
                      R$ {booking.totalAmount},00
                    </span>
                  </div>
                </div>

                {booking.productsList && booking.productsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {booking.productsList.map((prod, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/20"
                      >
                        + {prod}
                      </span>
                    ))}
                  </div>
                )}

                {booking.notes && (
                  <p className="text-[11px] text-slate-400 italic">
                    Obs: "{booking.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {!isCancelled && (
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  {!isPaid ? (
                    <button
                      onClick={() =>
                        onUpdateBookingStatus(booking._id, { paymentStatus: 'paid' })
                      }
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-dark-950 font-display font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmar Pagamento
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Horário Garantido
                    </span>
                  )}

                  <button
                    onClick={() =>
                      onUpdateBookingStatus(booking._id, { bookingStatus: 'cancelled' })
                    }
                    className="py-2 px-3 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    Liberar Horário
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

