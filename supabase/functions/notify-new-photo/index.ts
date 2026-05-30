// Supabase Edge Function - Send push notification when a new photo is uploaded
// Deploy with: supabase functions deploy notify-new-photo
//
// Set up a Database Webhook in Supabase Dashboard:
//   Table: photos, Event: INSERT, Function: notify-new-photo

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface PhotoPayload {
  type: 'INSERT';
  table: string;
  record: {
    id: string;
    uploaded_by: string;
    caption: string | null;
  };
}

Deno.serve(async (req) => {
  try {
    const payload: PhotoPayload = await req.json();

    if (payload.table !== 'photos' || payload.type !== 'INSERT') {
      return new Response('Ignored', { status: 200 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get uploader name
    const { data: uploader } = await supabase
      .from('users')
      .select('name')
      .eq('id', payload.record.uploaded_by)
      .single();

    // Get all OTHER users' push tokens
    const { data: users } = await supabase
      .from('users')
      .select('expo_push_token')
      .neq('id', payload.record.uploaded_by)
      .not('expo_push_token', 'is', null);

    if (!users || users.length === 0) {
      return new Response('No tokens', { status: 200 });
    }

    // Send via Expo Push API
    const messages = users
      .filter((u) => u.expo_push_token)
      .map((u) => ({
        to: u.expo_push_token,
        sound: 'default',
        title: `${uploader?.name || 'Someone'} shared a new photo!`,
        body: payload.record.caption || 'Check it out! 📸',
        data: { photoId: payload.record.id },
      }));

    if (messages.length > 0) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
    });
  }
});
