import { useEffect } from 'react';

/**
 * Garante que QUALQUER modal ou drawer full-screen aberto no sistema trave
 * automaticamente a rolagem da página por baixo (html e body).
 */
export function useGlobalModalScrollLock() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const isModalOverlayPresent = () => {
      const candidates = document.querySelectorAll(
        '[data-modal-overlay="true"], .fixed.inset-0'
      );
      for (const el of candidates) {
        const cls = String(el.className || '');
        const isOverlay =
          el.getAttribute('data-modal-overlay') === 'true' ||
          /\bz-(50|\[50\]|\[60\]|\[100\]|60|100)\b/.test(cls);
        if (!isOverlay) continue;
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          return true;
        }
      }
      return false;
    };

    const syncScrollLock = () => {
      const locked = isModalOverlayPresent();
      if (locked) {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';
      } else {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.overscrollBehavior = '';
      }
    };

    syncScrollLock();

    const observer = new MutationObserver(() => {
      syncScrollLock();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-modal-overlay'],
    });

    return () => {
      observer.disconnect();
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    };
  }, []);
}
