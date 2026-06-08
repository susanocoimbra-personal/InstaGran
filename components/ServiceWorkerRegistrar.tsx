'use client';

import { useEffect } from 'react';
// Importing this here (in a component that's always mounted) ensures the
// module's top-level `beforeinstallprompt` listener is registered early,
// before the user navigates to /instalar.
import '@/lib/installPrompt';

// Registers the service worker once on the client, enabling PWA install.
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* ignore registration errors (e.g. private mode) */
      });
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}
