import React, { useState } from 'react';
import { X, CalendarClock, User, Phone, DollarSign, CheckCircle2 } from 'lucide-react';

export default function OwnerNewBookingModal({
  isOpen,
  arena,
  onClose,
  onConfirmBooking,
}) {
  const [courtId, setCourtId] = useState(arena?.courts?.[0]?.id || 'c1');
  const [dateLabel, setDateLabel] = useState('Hoje');
  const [slotTime, setSlotTime] = useState('20:00');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('(11) 9');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !arena) return null;

  const selectedCourt =
    arena.courts?.find((c) => c.id === courtId) || arena.courts?.[0];

  const courtPrice = selectedCourt?.pricePerHour || arena.pricePerHour || 200;
  const chosenProducts = (arena.products || []).filter((p) =>
    selectedProductIds.includes(p.id)
  );
  const productsSum = chosenProducts.reduce((acc, p) => acc + (p.price || 0), 0);
  const total = courtPrice + productsSum;

  const toggleProduct = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    setSubmitting(true);
    try {
      await onConfirmBooking({
        arenaId: arena._id,
        courtId: selectedCourt?.id || 'c1',
        courtName: selectedCourt?.name || 'Quadra Principal',
        surface: selectedCourt?.surface || 'Grama Sintética',
        sport: selectedCourt?.sport || 'Futebol Society',
        dateLabel,
        slotTime,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        courtAmount: courtPrice,
        productsAmount: productsSum,
        productsList: chosenProducts.map((p) => p.name),
        paymentMethod,
        paymentStatus,
        notes: notes.trim(),
      });
      setCustomerName('');
      setNotes('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-dark-900 border border-white/15 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CalendarClock className="w-4 h-4" /> Agendamento no Quadro • {arena.name}
            </span>
            <h3 className="font-display font-black text-xl text-white mt-0.5">
              Marcar Horário & Registrar Receita
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nome do Cliente / Atleta
              </label>
              <div className="flex items-center gap-2 bg-dark-950 border border-white/10 rounded-xl px-3 py-2.5">
                <User className="w-4 h-4 text-emerald-400 shrink-0" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Marcos Oliveira"
                  className="w-full bg-transparent text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                WhatsApp / Telefone
              </label>
              <div className="flex items-center gap-2 bg-dark-950 border border-white/10 rounded-xl px-3 py-2.5">
                <Phone className="w-4 h-4 text-neon shrink-0" />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-transparent text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Dia
              </label>
              <select
                value={dateLabel}
                onChange={(e) => setDateLabel(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                <option value="Hoje" className="bg-dark-900">Hoje</option>
                <option value="Amanhã" className="bg-dark-900">Amanhã</option>
                <option value="Sábado" className="bg-dark-900">Sábado</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Horário
              </label>
              <select
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                {(arena.slots || []).map((s) => (
                  <option key={s.time} value={s.time} className="bg-dark-900">
                    {s.time} ({s.status === 'booked' ? 'Ocupado' : 'Livre'})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Quadra
              </label>
              <select
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                {(arena.courts || []).map((c) => (
                  <option key={c.id} value={c.id} className="bg-dark-900">
                    {c.name} (R$ {c.pricePerHour})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Extras / Products */}
          {(arena.products || []).length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Incluir Consumo / Produtos da Arena:
              </label>
              <div className="grid grid-cols-1 gap-2">
                {arena.products.map((prod) => {
                  const checked = selectedProductIds.includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => toggleProduct(prod.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs ${
                        checked
                          ? 'bg-emerald-500/15 border-emerald-400 text-white'
                          : 'bg-dark-950 border-white/10 text-slate-300'
                      }`}
                    >
                      <span className="font-bold">{prod.name}</span>
                      <span className="font-extrabold text-neon">+ R$ {prod.price},00</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                <option value="Pix" className="bg-dark-900">Pix</option>
                <option value="Cartão" className="bg-dark-900">Cartão</option>
                <option value="Presencial" className="bg-dark-900">No Balcão</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Status Financeiro
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                <option value="paid" className="bg-dark-900">Já Pago (Confirmado)</option>
                <option value="pending" className="bg-dark-900">A Receber no Check-in</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Total do Horário</span>
              <span className="font-display font-black text-2xl text-emerald-400">
                R$ {total},00
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-dark-950 font-display font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(52,211,153,0.4)] flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Salvando...' : 'Confirmar no Quadro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

