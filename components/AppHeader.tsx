'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AppHeaderProps {
  /** Serif section title shown on the left. */
  title?: string;
  /** Small letter-spaced eyebrow shown above/instead of the title. */
  eyebrow?: string;
  /** Back affordance on the left (drill-down screens). */
  back?: boolean;
  /** Show the current user's avatar on the right, linking to /profile. */
  avatar?: boolean;
}

// Slim editorial top bar. No wordmark — the section title (or eyebrow) sits on
// the left, and on top-level screens the user's avatar sits on the right as the
// way into their profile.
export default function AppHeader({ title, eyebrow, back = false, avatar = false }: AppHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <header
      style={{ ['--safe-pad-top' as string]: '16px' }}
      className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-paper/90 px-6 py-4 backdrop-blur safe-top"
    >
      {back && (
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl text-ink-soft active:bg-paper-dim"
        >
          ‹
        </button>
      )}

      <div className="min-w-0 flex-1">
        {eyebrow && <p className="label text-ink-muted">{eyebrow}</p>}
        {title && (
          <h1 className="font-serif text-[26px] leading-none tracking-wordmark text-ink">{title}</h1>
        )}
      </div>

      {avatar && (
        <Link
          href="/profile"
          aria-label="O teu perfil"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-paper-dim text-xl active:scale-95"
        >
          {user?.avatar_emoji || '👤'}
        </Link>
      )}
    </header>
  );
}
