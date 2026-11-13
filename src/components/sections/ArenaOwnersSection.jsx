import React, { useRef } from 'react';
import { Store, LogIn } from 'lucide-react';
import { ARENAS_DATA } from '../../data/mockData';
import VariableProximity from '../ui/VariableProximity';

export default function ArenaOwnersSection({ onSimulateCheckout, onOwnerLogin }) {
  const titleRef = useRef(null);
  return (
    <section id="proprietarios" className="py-16 sm:py-24 relative z-10 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-dark-800 via-dark-900 to-dark-950 border border-neon/30 p-6 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon/15 text-neon text-xs font-bold uppercase tracking-wider">
                <Store className="w-3.5 h-3.5" /> Painel para Proprietários de Arenas
              </div>
              <h2 ref={titleRef} className="font-display font-black text-3xl sm:text-4xl text-white leading-tight">
                <VariableProximity
                  label="Cadastre sua Arena, Zere a Ociosidade e Venda seus Produtos no Checkout."
                  fromFontVariationSettings="'wght' 700, 'opsz' 18"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={titleRef}
                  radius={100}
                  falloff="linear"
                  fromColor="#FFFFFF"
                  toColor="#CCFF00"
                />
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Muito além do aluguel de quadra: cadastre bebidas, churrasqueiras, bolas, raquetes e kits pós-jogo para que os atletas já incluam tudo no momento do agendamento.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-dark-950/70 border border-white/10">
                  <p className="font-display font-bold text-sm text-neon mb-1">
                    1. Gestão de Quadras & Horários
                  </p>
                  <p className="text-xs text-slate-400">
                    Agenda digital em tempo real com preços dinâmicos para horários nobres ou promoções.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-dark-950/70 border border-white/10">
                  <p className="font-display font-bold text-sm text-emerald-400 mb-1">
                    2. Catálogo de Produtos Integrado
                  </p>
                  <p className="text-xs text-slate-400">
                    Aumente o ticket médio em até 38% vendendo combos de bar, locação de raquetes e carvão antecipadamente.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={onOwnerLogin}
                  className="px-6 py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-dark-950 font-display font-extrabold text-sm shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Acessar Portal do Proprietário
                </button>
                <button
                  onClick={() => onSimulateCheckout(ARENAS_DATA[0])}
                  className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 font-display font-bold text-sm transition-all"
                >
                  Simular Checkout de Arena
                </button>
              </div>
            </div>

            {/* Owner Revenue Mockup Card */}
            <div className="lg:col-span-5">
              <div className="bg-dark-950/90 rounded-2xl p-5 border border-white/15 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Painel do Proprietário</span>
                    <h4 className="font-display font-bold text-base text-white">
                      Arena Prime Sports • Hoje
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                    94% Ocupação
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[11px] text-slate-400 block">Receita Quadras (Hoje)</span>
                    <span className="font-display font-black text-xl text-white">R$ 3.960</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neon/10 border border-neon/30">
                    <span className="text-[11px] text-neon block">Venda de Produtos/Bar</span>
                    <span className="font-display font-black text-xl text-neon">+ R$ 1.420</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">
                    Produtos Mais Vendidos no App Hoje:
                  </span>
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white/5">
                    <span className="text-slate-200">🔥 Kit Churrasco Pós-Jogo (12x)</span>
                    <span className="font-bold text-neon">R$ 780,00</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white/5">
                    <span className="text-slate-200">🎾 Locação Raquetes Carbono (9x)</span>
                    <span className="font-bold text-neon">R$ 315,00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
