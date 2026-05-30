'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface Tab {
  href: string;
  label: string;
  emoji: string;
  parentOnly?: boolean;
}

const TABS: Tab[] = [
  { href: '/feed', label: 'Início', emoji: '🏠' },
  { href: '/albums', label: 'Álbuns', emoji: '📁' },
  { href: '/upload', label: 'Novo', emoji: '📸', parentOnly: true },
  { href: '/profile', label: 'Eu', emoji: '👤' },
];

export default function TabBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const tabs = TABS.filter((t) => !t.parentOnly || user?.role === 'parent');

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 safe-bottom">
      <div className="pointer-events-auto flex w-full max-w-md items-stretch justify-around rounded-xl border border-white/60 bg-white/95 px-2 py-2 shadow-lift backdrop-blur">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href || (tab.href !== '/feed' && pathname.startsWith(tab.href));
          const emoji = tab.href === '/profile' ? user?.avatar_emoji || '👤' : tab.emoji;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1"
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={`text-[22px] transition-transform duration-200 ${
                  active ? 'scale-100' : 'scale-90 opacity-50'
                }`}
              >
                {emoji}
              </span>
              <span
                className={`text-xs font-semibold ${
                  active ? 'text-primary-dark' : 'text-ink-secondary'
                }`}
              >
                {tab.label}
              </span>
              <span
                className={`mt-0.5 h-[5px] w-[5px] rounded-full bg-primary transition-opacity ${
                  active ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
