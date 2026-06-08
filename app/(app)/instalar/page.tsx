'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/AppHeader';
import { useInstallPrompt, detectPlatform, type Platform } from '@/lib/installPrompt';
import {
  enablePush,
  isPushEnabled,
  notificationPermission,
  pushSupported,
  pushConfigured,
} from '@/lib/push';

export default function InstalarPage() {
  const { user } = useAuth();
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();
  const [platform, setPlatform] = useState<Platform>('unknown');

  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState<string | null>(null);
  const canPush = pushSupported() && pushConfigured();

  useEffect(() => {
    setPlatform(detectPlatform());
    if (canPush) isPushEnabled().then(setPushOn);
  }, [canPush]);

  const handleInstall = async () => {
    const outcome = await promptInstall();
    // If unavailable (iOS, or already installed), the instructions below cover it.
    if (outcome === 'accepted') {
      // appinstalled event will flip isInstalled.
    }
  };

  const handleEnablePush = async () => {
    if (!user || pushBusy) return;
    setPushBusy(true);
    setPushMsg(null);
    const { ok, error } = await enablePush(user.id);
    setPushBusy(false);
    if (ok) {
      setPushOn(true);
      setPushMsg('Notificações ativadas! Vais ser avisada quando houver fotos novas.');
    } else {
      setPushMsg(error || 'Não foi possível ativar as notificações.');
    }
  };

  const perm = canPush ? notificationPermission() : 'unsupported';

  return (
    <>
      <AppHeader title="Instalar" back />

      <div className="mx-auto max-w-md px-6 sm:px-8">
        <p className="pt-4 font-serif text-[22px] italic leading-snug text-ink">
          Põe a InstaGran no teu telemóvel e recebe um aviso quando houver fotos novas.
        </p>

        {/* STEP 1 — Install */}
        <section className="mt-8 border-t border-line pt-6">
          <p className="label text-ink-muted">Passo 1</p>
          <h2 className="mt-1 font-serif text-[26px] text-ink">Instalar a app</h2>

          {isInstalled ? (
            <p className="mt-3 flex items-center gap-2 text-[16px] text-success">
              <span aria-hidden>✓</span> A app já está instalada neste telemóvel.
            </p>
          ) : canInstall ? (
            <>
              <p className="mt-2 text-[16px] leading-relaxed text-ink-soft">
                Toca no botão e confirma “Instalar”. Fica um ícone no teu telemóvel,
                como qualquer outra app.
              </p>
              <button
                type="button"
                onClick={handleInstall}
                className="label mt-4 flex min-h-[52px] w-full items-center justify-center rounded-full bg-ink px-6 text-paper active:scale-[0.99]"
              >
                Instalar a InstaGran
              </button>
            </>
          ) : platform === 'ios' ? (
            <ol className="mt-3 flex flex-col gap-3 text-[16px] leading-relaxed text-ink-soft">
              <li>
                1. Toca no botão <strong>Partilhar</strong> <span aria-hidden>􀈂</span> (o quadrado
                com a seta para cima), em baixo no Safari.
              </li>
              <li>
                2. Desce e toca em <strong>“Adicionar ao ecrã principal”</strong>.
              </li>
              <li>3. Toca em <strong>Adicionar</strong>. Pronto!</li>
            </ol>
          ) : platform === 'android' ? (
            <ol className="mt-3 flex flex-col gap-3 text-[16px] leading-relaxed text-ink-soft">
              <li>
                1. Toca no menu <strong>⋮</strong> (três pontos), no canto do Chrome.
              </li>
              <li>
                2. Toca em <strong>“Instalar app”</strong> ou{' '}
                <strong>“Adicionar ao ecrã principal”</strong>.
              </li>
              <li>3. Confirma. Fica um ícone no teu telemóvel!</li>
            </ol>
          ) : (
            <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
              No teu telemóvel, abre este link no navegador e usa a opção{' '}
              <strong>“Adicionar ao ecrã principal”</strong> / <strong>“Instalar app”</strong>.
            </p>
          )}
        </section>

        {/* STEP 2 — Notifications */}
        <section className="mt-8 border-t border-line pt-6">
          <p className="label text-ink-muted">Passo 2</p>
          <h2 className="mt-1 font-serif text-[26px] text-ink">Ativar notificações</h2>

          {!canPush ? (
            <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
              Para receberes avisos no iPhone, instala primeiro a app (Passo 1) e abre-a a
              partir do ícone no ecrã principal. Depois volta aqui.
            </p>
          ) : pushOn || perm === 'granted' ? (
            <p className="mt-3 flex items-center gap-2 text-[16px] text-success">
              <span aria-hidden>✓</span> Notificações ativadas neste telemóvel.
            </p>
          ) : perm === 'denied' ? (
            <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
              As notificações estão bloqueadas. Vai às definições do navegador para este site
              e permite as notificações, depois volta aqui.
            </p>
          ) : (
            <>
              <p className="mt-2 text-[16px] leading-relaxed text-ink-soft">
                Toca no botão e aceita, para seres avisada sempre que houver uma foto nova.
              </p>
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={pushBusy}
                className="label mt-4 flex min-h-[52px] w-full items-center justify-center rounded-full bg-ink px-6 text-paper active:scale-[0.99] disabled:opacity-50"
              >
                {pushBusy ? 'A ativar…' : 'Ativar notificações'}
              </button>
            </>
          )}

          {pushMsg && <p className="mt-3 text-[15px] text-ink-soft">{pushMsg}</p>}
        </section>

        <p className="mt-10 text-center font-serif text-[16px] italic text-ink-muted">
          Qualquer dúvida, fala com o Diogo. 💛
        </p>
      </div>
    </>
  );
}
