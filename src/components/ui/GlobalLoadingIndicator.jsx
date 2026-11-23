import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Exibe um símbolo de loading discreto sempre que qualquer requisição (fetch)
 * ultrapassar 1 segundo (1000ms) de carregamento.
 */
export default function GlobalLoadingIndicator() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;

    const originalFetch = window.fetch.bind(window);
    let activeCount = 0;
    let delayTimer = null;

    const startTracking = () => {
      activeCount += 1;
      if (activeCount === 1 && !delayTimer) {
        delayTimer = setTimeout(() => {
          if (activeCount > 0) {
            setVisible(true);
          }
        }, 1000);
      }
    };

    const stopTracking = () => {
      activeCount = Math.max(0, activeCount - 1);
      if (activeCount === 0) {
        if (delayTimer) {
          clearTimeout(delayTimer);
          delayTimer = null;
        }
        setVisible(false);
      }
    };

    window.fetch = async (...args) => {
      startTracking();
      try {
        return await originalFetch(...args);
      } finally {
        stopTracking();
      }
    };

    return () => {
      window.fetch = originalFetch;
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[120] pointer-events-none"
    >
      <div className="px-4 py-2 rounded-full bg-dark-900/95 border border-neon/40 shadow-[0_0_25px_rgba(204,255,0,0.25)] backdrop-blur-xl flex items-center gap-2.5">
        <Loader2 className="w-4 h-4 text-neon animate-spin" />
        <span className="text-xs font-display font-extrabold text-white tracking-wide">
          Carregando...
        </span>
      </div>
    </div>
  );
}
