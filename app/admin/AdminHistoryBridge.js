'use client';

import { useEffect, useRef } from 'react';

const forwardLabels = new Set(['Edit', '+ New book', '+ New chapter']);

export default function AdminHistoryBridge() {
  const handlingPop = useRef(false);

  useEffect(() => {
    function findButton(target) {
      return target?.closest?.('button');
    }

    function onClick(event) {
      const button = findButton(event.target);
      if (!button) return;
      const label = (button.textContent || '').trim();

      if (handlingPop.current) return;

      if (label.startsWith('←')) {
        if (history.state?.dwAdminLayer) {
          event.preventDefault();
          event.stopPropagation();
          history.back();
        }
        return;
      }

      if (forwardLabels.has(label)) {
        queueMicrotask(() => {
          history.pushState({ ...(history.state || {}), dwAdminLayer: true }, '', location.href);
        });
      }
    }

    function onPopState() {
      const backButton = [...document.querySelectorAll('button')].find(btn =>
        (btn.textContent || '').trim().startsWith('←')
      );
      if (!backButton) return;

      handlingPop.current = true;
      backButton.click();
      setTimeout(() => {
        handlingPop.current = false;
      }, 0);
    }

    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  return null;
}
