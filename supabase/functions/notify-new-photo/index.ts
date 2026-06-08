// Supabase Edge Function — send a Web Push notification when a new photo lands.
//
// Setup (see supabase/PUSH_SETUP.md):
//   1. Generate a VAPID key pair.
//   2. supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
//   3. supabase functions deploy notify-new-photo
//   4. Dashboard → Database → Webhooks: on INSERT into `photos`, call this function.
//
// One push per family member who has notifications enabled (any device),
// except the uploader. Photos uploaded together (same group_id) collapse into
// a single notification via the de-dupe tag in the service worker.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:family@instagran.app';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

interface PhotoPayload {
  type: string;
  table: string;
  record: {
    id: string;
    uploaded_by: string;
    caption: string | null;
    group_id: string | null;
  };
}

Deno.serve(async (req) => {
  try {
    const payload: PhotoPayload = await req.json();
    if (payload.table !== 'photos' || payload.type !== 'INSERT') {
      return new Response('Ignored', { status: 200 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { uploaded_by, caption, group_id } = payload.record;

    // For a multi-photo batch, only notify on the FIRST photo of the group so
    // the family gets one notification, not five.
    if (group_id) {
      const { data: groupRows } = await supabase
        .from('photos')
        .select('id')
        .eq('group_id', group_id)
        .order('created_at', { ascending: true })
        .limit(1);
      if (groupRows && groupRows[0] && groupRows[0].id !== payload.record.id) {
        return new Response('Not the group anchor; skipping', { status: 200 });
      }
    }

    // Uploader's name for the message.
    const { data: uploader } = await supabase
      .from('users')
      .select('name')
      .eq('id', uploaded_by)
      .single();

    // All subscriptions belonging to everyone EXCEPT the uploader.
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')
      .neq('user_id', uploaded_by);

    if (!subs || subs.length === 0) {
      return new Response('No subscriptions', { status: 200 });
    }

    const title = uploader?.name ? `${uploader.name} partilhou uma foto` : 'Nova foto na InstaGran';
    const body = caption || 'Toca para ver no diário da família 📸';
    const notification = JSON.stringify({ title, body, url: '/feed', tag: group_id || payload.record.id });

    // Send all, removing any subscriptions the push service reports as gone (410/404).
    const results = await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          notification,
        ),
      ),
    );

    const dead: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const code = (r.reason && (r.reason.statusCode || r.reason.status)) as number | undefined;
        if (code === 404 || code === 410) dead.push(subs[i].endpoint);
      }
    });
    if (dead.length) {
      await supabase.from('push_subscriptions').delete().in('endpoint', dead);
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return new Response(`Sent ${sent}/${subs.length} (pruned ${dead.length})`, { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
