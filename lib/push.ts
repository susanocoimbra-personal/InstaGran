'use client';

import { supabase } from '@/lib/supabase';

// The public VAPID key is safe to ship to the browser (the private one stays
// in the edge function). Set NEXT_PUBLIC_VAPID_PUBLIC_KEY in the environment.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function pushConfigured(): boolean {
  return VAPID_PUBLIC_KEY.length > 0;
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!pushSupported()) return 'unsupported';
  return Notification.permission;
}

// VAPID keys are base64url; the subscribe API needs raw bytes. Return an
// ArrayBuffer (a valid BufferSource) to satisfy applicationServerKey's type.
function urlBase64ToBytes(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out.buffer;
}

/**
 * Ask permission, subscribe via the service worker, and store the subscription
 * for the current user. Returns { ok } or { ok:false, error }.
 */
export async function enablePush(userId: string): Promise<{ ok: boolean; error?: string }> {
  if (!pushSupported()) return { ok: false, error: 'O teu navegador não suporta notificações.' };
  if (!pushConfigured()) return { ok: false, error: 'As notificações ainda não estão configuradas.' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, error: 'Permissão de notificações recusada.' };
  }

  const reg = await navigator.serviceWorker.ready;

  // Reuse an existing subscription if there is one, else create a new one.
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToBytes(VAPID_PUBLIC_KEY),
    });
  }

  const json = sub.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return { ok: false, error: 'Não foi possível criar a subscrição.' };
  }

  // Upsert by endpoint so re-enabling on the same device doesn't duplicate.
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ user_id: userId, endpoint, p256dh, auth }, { onConflict: 'endpoint' });

  if (error) return { ok: false, error: 'Não foi possível guardar a subscrição.' };
  return { ok: true };
}

/** Unsubscribe this device and remove it from the DB. */
export async function disablePush(): Promise<{ ok: boolean; error?: string }> {
  if (!pushSupported()) return { ok: true };
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return { ok: true };
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => undefined);
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  return { ok: true };
}

/** Is this device currently subscribed? */
export async function isPushEnabled(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}
