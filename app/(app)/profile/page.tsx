'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/AppHeader';
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
      <AppHeader title="Perfil" />

      {/* Header gradient */}
      <div className="relative">
        <div
          className="absolute inset-x-0 top-0 h-56"
          style={{
            background: 'linear-gradient(180deg, #D9A899 0%, #EDD4A0 55%, #FAF7F4 100%)',
          }}
        />

        <div className="relative flex flex-col items-center pt-12">
          <div
            className="flex h-[118px] w-[118px] items-center justify-center rounded-full shadow-card"
            style={{ background: 'linear-gradient(135deg, #D9A899, #EDD4A0)' }}
          >
            <div className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-surface">
              <span className="text-6xl">{user.avatar_emoji}</span>
            </div>
          </div>

          <h2 className="mt-4 text-2xl font-bold text-ink">{user.name}</h2>
          <span className="mt-2 rounded-full border border-line bg-surface-alt px-4 py-1.5 text-sm font-medium text-ink-secondary">
            {roleLabel(user.role)}
          </span>
          <button
            type="button"
            onClick={openEdit}
            className="mt-3 min-h-[44px] rounded-full px-5 py-2 text-sm font-semibold text-primary-dark active:bg-surface-alt"
          >
            ✎ Editar perfil
          </button>
        </div>
      </div>

      {/* Family */}
      <div className="px-6 pt-6">
        <h3 className="mb-4 text-lg font-semibold text-ink">A nossa família</h3>
        <div className="flex flex-wrap justify-around gap-y-4">
          {family.map((member) => (
            <div key={member.id} className="flex w-16 flex-col items-center">
              <div
                className="flex h-[58px] w-[58px] items-center justify-center rounded-full"
                style={{ background: 'linear-gradient(135deg, #D9A899, #EDD4A0)' }}
              >
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-surface">
                  <span className="text-2xl">{member.avatar_emoji}</span>
                </div>
              </div>
              <span className="mt-1 truncate text-center text-xs font-medium text-ink-secondary">
                {member.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="mx-6 mt-6 rounded-2xl border border-line bg-surface p-5 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xl">🏠</span>
          <h3 className="text-lg font-semibold text-ink">Sobre o Vovo</h3>
        </div>
        <p className="text-base leading-relaxed text-ink-secondary">
          Um espaço privado para a nossa família partilhar os momentos preciosos da nossa pequenina
          a crescer.
        </p>
        <div className="my-4 h-px bg-line" />
        <div className="flex items-start gap-2">
          <span className="text-xl">🔒</span>
          <p className="flex-1 text-sm leading-relaxed text-ink-secondary">
            Só a nossa família pode ver o que é partilhado aqui.
          </p>
        </div>
      </div>

      {/* Sign out */}
      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="min-h-[44px] px-6 py-2 text-sm font-medium text-ink-secondary active:text-ink"
        >
          Terminar sessão
        </button>
      </div>

      {/* Edit profile modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6"
          onClick={() => setEditing(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex flex-col items-center">
              <div className="mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-surface-alt text-4xl">
                {draftEmoji}
              </div>
              <h3 className="text-xl font-extrabold text-ink">Editar perfil</h3>
            </div>

            <div className="mb-5 flex flex-wrap justify-center gap-2">
              {PROFILE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setDraftEmoji(emoji)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-2xl ${
                    draftEmoji === emoji ? 'border-primary bg-primary/10' : 'border-transparent bg-background'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="O teu nome..."
              maxLength={30}
              autoFocus
              aria-label="O teu nome"
              className="mb-6 w-full rounded-2xl border border-line bg-background p-4 text-base text-ink outline-none placeholder:text-ink-secondary focus:border-primary focus:ring-2 focus:ring-primary/30"
            />

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 rounded-full bg-surface-alt py-3 font-semibold text-ink-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={!draftName.trim() || saving}
                className="flex flex-1 items-center justify-center rounded-full bg-primary py-3 font-bold text-white disabled:bg-ink-light disabled:text-surface"
              >
                {saving ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
