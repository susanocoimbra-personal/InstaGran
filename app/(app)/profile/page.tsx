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

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [family, setFamily] = useState<User[]>([]);

  // Real family members from the DB (replaces the old hardcoded list).
  useEffect(() => {
    supabase
      .from('users')
      .select('id, name, role, avatar_emoji')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setFamily(data as User[]);
      });
  }, []);

  const handleSignOut = async () => {
    if (!confirm('Tens a certeza que queres terminar sessão?')) return;
    await signOut();
    router.replace('/login');
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
          className="px-6 py-2 text-sm font-medium text-ink-light active:text-ink-secondary"
        >
          Terminar sessão
        </button>
      </div>
    </>
  );
}
