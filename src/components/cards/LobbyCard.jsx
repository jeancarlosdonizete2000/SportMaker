import React from 'react';
import { MapPin, Check, UserPlus } from 'lucide-react';

export default function LobbyCard({ lobby, hasJoined, isFriend, onToggleFriend, onToggleJoin }) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-white/10 hover:border-neon/40 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neon/15 text-neon">
              {lobby.time}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {lobby.distance}
            </span>
          </div>
          <h4 className="font-display font-bold text-lg text-white">{lobby.title}</h4>
          <p className="text-xs text-slate-400">{lobby.arena}</p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between">
          <span className="text-xs text-slate-400">Cota por pessoa</span>
          <span className="font-display font-black text-xl text-neon">
            R$ {lobby.pricePerPlayer},00
          </span>
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Host Info + Add Friend Button */}
        <div className="flex items-center gap-3">
          <img
            src={lobby.host.avatar}
            alt={lobby.host.name}
            className="w-10 h-10 rounded-full object-cover border border-neon"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                Org: {lobby.host.name}
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/10 text-neon">
                OVR {lobby.host.rating}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {lobby.neededPositions.map((pos) => (
                <span
                  key={pos}
                  className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold"
                >
                  Vaga: {pos}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions: Add Friend & Join Match */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFriend(lobby.id)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              isFriend
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-white/5 border-white/15 text-slate-200 hover:border-white/30'
            }`}
          >
            {isFriend ? (
              <>
                <Check className="w-3.5 h-3.5" /> Amigo Adicionado
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5 text-neon" /> + Amizade
              </>
            )}
          </button>

          <button
            onClick={() => onToggleJoin(lobby.id)}
            className={`px-4 py-2 rounded-xl text-xs font-display font-extrabold transition-all ${
              hasJoined
                ? 'bg-emerald-400 text-dark-950'
                : 'bg-neon text-dark-950 hover:bg-neon-400 shadow-neon'
            }`}
          >
            {hasJoined
              ? `Vaga Garantida (${lobby.filledSlots + 1}/${lobby.totalSlots})`
              : `Entrar (${lobby.filledSlots}/${lobby.totalSlots})`}
          </button>
        </div>
      </div>
    </div>
  );
}

