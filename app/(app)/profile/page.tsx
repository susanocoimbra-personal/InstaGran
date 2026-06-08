'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/AppHeader';
import { enablePush, disablePush, isPushEnabled, pushSupported, pushConfigured } from '@/lib/push';
import type { User } from '@/types/database';

function roleLabel(role: string) {
  switch (role) {
    case 'parent':
      return 'Pai/Mãe';
    case 'grandfather':
      return 'Avô';
    default:
      return 'Avó';
  }
}

const PROFILE_EMOJIS = ['👨', '👩', '👵', '👴', '🧑', '👧', '👦', '🧓', '👶', '🐻', '🌷', '⭐'];

export default function ProfilePage() {
  const { user, signOut, updateProfile } = useAuth();
  const router = useRouter();
  const [family, setFamily] = useState<User[]>([]);

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftEmoji, setDraftEmoji] = useState('👤');
  const [saving, setSaving] = useState(false);

  // Push notifications state for this device.
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const canPush = pushSupported() && pushConfigured();

  useEffect(() => {
    if (canPush) isPushEnabled().then(setPushOn);
  }, [canPush]);

  const togglePush = async () => {
    if (!user || pushBusy) return;
    setPushBusy(true);
    if (pushOn) {
      await disablePush();
      setPushOn(false);
    } else {
      const { ok, error } = await enablePush(user.id);
      if (ok) setPushOn(true);
      else if (error) alert(error);
    }
    setPushBusy(false);
  };

  // Real family members from the DB (replaces the old hardcoded list).
  // `active` guards against a state write after unmount.
  useEffect(() => {
    let active = true;
    supabase
      .from('users')
      .select('id, name, role, avatar_emoji')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (active && data) setFamily(data as User[]);
      });
    return () => {
      active = false;
    };
  }, [user?.name, user?.avatar_emoji]); // refetch after the user edits their own profile

  const handleSignOut = async () => {
    if (!confirm('Tens a certeza que queres terminar sessão?')) return;
    await signOut();
    router.replace('/login');
  };

  const openEdit = () => {
    if (!user) return;
    setDraftName(user.name);
    setDraftEmoji(user.avatar_emoji);
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!draftName.trim()) return;
    setSaving(true);
    const { error } = await updateProfile({ name: draftName.trim(), avatar_emoji: draftEmoji });
    setSaving(false);
    if (error) alert(error);
    else setEditing(false);
  };

  if (!user) return null;

  return (
    <>
      <AppHeader title="Perfil" back />

      <div className="w-full px-6 sm:px-8 lg:px-12">
        {/* Identity */}
        <div className="flex flex-col items-center border-b border-line py-10">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-line bg-paper-dim">
            <span className="text-5xl">{user.avatar_emoji}</span>
          </div>
          <h2 className="mt-5 font-serif text-[32px] leading-none text-ink">{user.name}</h2>
          <span className="label mt-3 text-ink-muted">{roleLabel(user.role)}</span>
          <button
            type="button"
            onClick={openEdit}
            className="label mt-4 flex min-h-[44px] items-center text-ink active:text-clay"
          >
            Editar perfil
          </button>
        </div>

        {/* Family roll */}
        <div className="border-b border-line py-7">
          <p className="label mb-4 text-ink-muted">A nossa família</p>
          <ul>
            {family.map((member) => (
              <li key={member.id} className="flex items-center gap-3 py-2.5">
                <span className="text-2xl">{member.avatar_emoji}</span>
                <span className="flex-1 font-serif text-[19px] text-ink">{member.name}</span>
                <span className="label text-ink-faint">{roleLabel(member.role)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* About — set as an editorial colophon */}
        <div className="py-8">
          <p className="font-serif text-[20px] italic leading-snug text-ink">
            Um diário privado para a família guardar os momentos da nossa pequenina a crescer.
          </p>
          <p className="label mt-4 text-ink-muted">Só a nossa família vê o que é partilhado aqui.</p>
        </div>

        {/* Install the app */}
        <Link
          href="/instalar"
          className="flex items-center justify-between gap-4 border-t border-line py-6 active:opacity-70"
        >
          <div className="min-w-0">
            <p className="font-serif text-[18px] text-ink">Instalar a app</p>
            <p className="label mt-1 text-ink-muted">Pôr a InstaGran no ecrã do telemóvel</p>
          </div>
          <span className="label shrink-0 text-ink-muted">Abrir →</span>
        </Link>

        {/* Notifications (this device) */}
        {canPush && (
          <div className="flex items-center justify-between gap-4 border-t border-line py-6">
            <div className="min-w-0">
              <p className="font-serif text-[18px] text-ink">Notificações</p>
              <p className="label mt-1 text-ink-muted">
                {pushOn ? 'Avisamos-te quando há fotos novas' : 'Recebe um aviso quando há fotos novas'}
              </p>
            </div>
            <button
              type="button"
              onClick={togglePush}
              disabled={pushBusy}
              aria-pressed={pushOn}
              aria-label={pushOn ? 'Desligar notificações' : 'Ligar notificações'}
              className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
                pushOn ? 'bg-ink' : 'bg-line'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-paper shadow-print transition-all ${
                  pushOn ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        )}

        {/* Sign out */}
        <div className="border-t border-line py-6">
          <button
            type="button"
            onClick={handleSignOut}
            className="label flex min-h-[44px] items-center text-ink-muted active:text-danger"
          >
            Terminar sessão
          </button>
        </div>
      </div>

      {/* Edit profile modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center"
          onClick={() => setEditing(false)}
        >
          <div
            style={{ ['--safe-pad-bottom' as string]: '32px' }}
            className="w-full max-w-[440px] bg-paper p-6 pb-8 shadow-lift safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="label mb-5 text-ink-muted">Editar perfil</p>

            <div className="mb-5 flex flex-wrap gap-2">
              {PROFILE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setDraftEmoji(emoji)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border text-2xl ${
                    draftEmoji === emoji ? 'border-ink bg-ink/[0.04]' : 'border-line'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="O teu nome…"
              maxLength={30}
              autoFocus
              aria-label="O teu nome"
              className="mb-6 w-full border-b border-line bg-transparent pb-2 font-serif text-[22px] italic text-ink outline-none placeholder:text-ink-faint focus:border-ink"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="label px-4 py-3 text-ink-muted active:text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={!draftName.trim() || saving}
                className="label flex min-h-[44px] items-center rounded-full bg-ink px-6 text-paper disabled:opacity-40"
              >
                {saving ? '…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
