import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Upload } from 'lucide-react';

export default function PlayerCardGenerator() {
  const cardRef = useRef(null);
  const [name, setName] = useState('LAMINE YAMAL');
  const [rating, setRating] = useState(97);
  const [position, setPosition] = useState('RW');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    pac: 95,
    sho: 94,
    pas: 96,
    dri: 97,
    def: 32,
    phy: 80,
  });

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      setPhotoUrl(URL.createObjectURL(file));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatChange = (key, value) => {
    const clamped = Math.max(1, Math.min(99, Number(value) || 1));
    setStats((prev) => ({ ...prev, [key]: clamped }));
  };

  const handleDownload = async () => {
    if (!cardRef.current || isProcessing) return;
    setIsProcessing(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `${(name || 'player').toLowerCase().replace(/\s+/g, '-')}-card.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-6">
      {/* ÁREA DA CARTA (será exportada como PNG) */}
      <div
        ref={cardRef}
        className="relative w-[300px] h-[420px] select-none overflow-hidden rounded-2xl text-white shadow-2xl"
        style={{
          background: 'linear-gradient(145deg, #1b2448 0%, #0d1126 60%, #2a1f4d 100%)',
          border: '3px solid #d4af37',
        }}
      >
        {/* Rating e Posição (Topo Esquerdo) */}
        <div className="absolute top-8 left-6 z-20 flex flex-col items-center leading-none">
          <span className="text-4xl font-black tracking-tighter text-amber-300">
            {rating}
          </span>
          <span className="text-sm font-bold uppercase text-amber-100 mt-1">
            {position}
          </span>
        </div>

        {/* Foto do Jogador com Fade na base */}
        {photoUrl && (
          <img
            src={photoUrl}
            alt={name}
            crossOrigin="anonymous"
            className="absolute top-6 right-2 z-10 h-[250px] w-[220px] object-cover object-top"
            style={{
              WebkitMaskImage:
                'linear-gradient(to bottom, black 65%, transparent 100%)',
              maskImage:
                'linear-gradient(to bottom, black 65%, transparent 100%)',
            }}
          />
        )}

        {/* Nome e Atributos (Base da Carta) */}
        <div className="absolute bottom-6 left-0 right-0 z-20 px-6 text-center">
          <h2 className="text-xl font-extrabold uppercase tracking-wider border-b border-amber-400/40 pb-1 mb-2 truncate">
            {name}
          </h2>
          <div className="grid grid-cols-6 gap-1 text-xs font-bold">
            {Object.entries(stats).map(([key, val]) => (
              <div key={key} className="flex flex-col items-center">
                <span className="text-[10px] text-amber-200/80 uppercase">
                  {key}
                </span>
                <span className="text-sm font-black">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CONTROLES */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <label className="block text-sm font-medium text-slate-200">
          <span className="flex items-center gap-1.5 mb-1">
            <Upload className="w-4 h-4 text-amber-400" />
            Foto de Perfil:
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="mt-1 block w-full text-sm text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400"
          />
        </label>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do Jogador"
          className="border border-slate-700 bg-slate-900 rounded-lg px-3 py-2 text-white"
        />

        <div className="flex gap-2">
          <input
            type="number"
            value={rating}
            onChange={(e) => setRating(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
            min={1}
            max={99}
            className="border border-slate-700 bg-slate-900 rounded-lg px-3 py-2 w-1/2 text-white"
          />
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value.toUpperCase())}
            maxLength={3}
            className="border border-slate-700 bg-slate-900 rounded-lg px-3 py-2 w-1/2 text-white uppercase"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {Object.entries(stats).map(([key, val]) => (
            <label key={key} className="flex flex-col text-xs text-slate-300 uppercase">
              {key}
              <input
                type="number"
                min={1}
                max={99}
                value={val}
                onChange={(e) => handleStatChange(key, e.target.value)}
                className="mt-0.5 border border-slate-700 bg-slate-900 rounded px-2 py-1 text-white"
              />
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isProcessing}
          className="mt-2 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold py-2.5 px-4 rounded-lg transition"
        >
          <Download className="w-4 h-4" />
          {isProcessing ? 'Processando...' : 'Baixar Carta (PNG)'}
        </button>
      </div>
    </div>
  );
}
