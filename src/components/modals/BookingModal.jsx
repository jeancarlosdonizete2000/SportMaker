import React from 'react';
import { X, Check, CheckCircle2, Crown, Sparkles } from 'lucide-react';
import { isOfficialBallProduct } from '../../hooks/useBooking';

export default function BookingModal({
  arena,
  selectedSlot,
  selectedProducts,
  splitWithFriends,
  bookingConfirmed,
  totalAmount,
  isPro = false,
  onClose,
  onToggleProduct,
  onToggleSplit,
  onConfirm,
}) {
  if (!arena) return null;

  const discountedCourtPrice = isPro
    ? Math.round(arena.pricePerHour * 0.85)
    : arena.pricePerHour;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-dark-900 border border-white/15 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neon flex items-center gap-1.5">
              Reserva Instantânea + Produtos da Arena
              {isPro && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Benefícios PRO Ativos
                </span>
              )}
            </span>
            <h3 className="font-display font-black text-xl text-white">
              {arena.name}
            </h3>
            <p className="text-xs text-slate-400">
              {arena.neighborhood} • Horário selecionado:{' '}
              <strong className="text-white">
                Hoje às {selectedSlot || '19:00'}
              </strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!bookingConfirmed ? (
          <>
            {isPro && (
              <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between gap-2 text-xs text-amber-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Desconto Assinante PRO (-15%)</strong> na quadra +{' '}
                    <strong>Bola Oficial Grátis</strong> liberados!
                  </span>
                </div>
                <span className="font-black text-amber-300 shrink-0">
                  Quadra: R$ {discountedCourtPrice},00
                </span>
              </div>
            )}

            {/* Choose Arena Products */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
                Adicione Produtos Cadastrados pela Arena:
              </label>
              <div className="space-y-2">
                {arena.products.map((prod) => {
                  const isChecked = selectedProducts.includes(prod.id);
                  const isFreeBall = isPro && isOfficialBallProduct(prod);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => onToggleProduct(prod.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-neon/10 border-neon text-white'
                          : 'bg-dark-950/70 border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isChecked
                              ? 'bg-neon border-neon text-dark-950'
                              : 'border-white/25'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold flex items-center gap-1.5">
                            {prod.name}
                            {isFreeBall && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-dark-950 text-[9px] font-black uppercase">
                                Bola Grátis PRO
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-slate-400">{prod.tag}</span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-neon">
                        {isFreeBall
                          ? 'Grátis (PRO)'
                          : prod.price === 0
                          ? 'Grátis'
                          : `+ R$ ${prod.price},00`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Split Payment Option */}
            <div className="p-3.5 rounded-2xl bg-dark-950 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Dividir Link Pix com os Amigos?</p>
                <p className="text-[11px] text-slate-400">
                  Cada jogador paga sua fração pelo app e já entra na lista da partida
                </p>
              </div>
              <button
                onClick={onToggleSplit}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  splitWithFriends
                    ? 'bg-emerald-400 text-dark-950'
                    : 'bg-white/10 text-slate-300'
                }`}
              >
                {splitWithFriends ? 'Ativado' : 'Individual'}
              </button>
            </div>

            {/* Total Summary */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">
                  Total (Quadra + {selectedProducts.length} produtos)
                </span>
                <span className="font-display font-black text-2xl text-white">
                  R$ {totalAmount},00
                </span>
                {splitWithFriends && (
                  <span className="block text-xs text-neon font-bold">
                    ou R$ {Math.round(totalAmount / 10)},00 por atleta (10x)
                  </span>
                )}
              </div>

              <button
                onClick={onConfirm}
                className="px-6 py-3.5 rounded-xl bg-neon hover:bg-neon-400 text-dark-950 font-display font-extrabold text-sm shadow-neon transition-all"
              >
                Confirmar Reserva
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-neon/20 border border-neon text-neon mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-display font-black text-2xl text-white">
              Quadra & Produtos Reservados!
            </h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Seu horário às{' '}
              <strong className="text-neon">
                {selectedSlot || '19:00'}
              </strong>{' '}
              em <strong>{arena.name}</strong> está garantido. O link de convocação foi gerado para seus amigos!
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
            >
              Voltar para a Página
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

