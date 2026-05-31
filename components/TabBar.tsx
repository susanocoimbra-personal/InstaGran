'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface Tab {
  href: string;
  label: string;
  parentOnly?: boolean;
  cta?: boolean;
}

const TABS: Tab[] = [
  { href: '/feed', label: 'Diário' },
  { href: '/albums', label: 'Álbuns' },
  { href: '/upload', label: 'Adicionar', parentOnly: true, cta: true },
  { href: '/profile', label: 'Perfil' },
];

// Editorial bottom nav: typographic, letter-spaced caps, one ink-pill CTA.
// Each item keeps a >=44px hit area for older users.
export default function TabBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const tabs = TABS.filter((t) => !t.parentOnly || user?.role === 'parent');

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around gap-2 border-t border-line bg-paper/95 px-6 py-3 backdrop-blur safe-bottom">
      {tabs.map((tab) => {
        const active =
          pathname === tab.href || (tab.href !== '/feed' && pathname.startsWith(tab.href));

        // The add action is a round ink "+" button, sized and centred to read
        // as the primary affordance without crowding the text tabs.
        if (tab.cta) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-2xl font-light leading-none text-paper transition active:scale-95"
            >
              +
            </Link>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`label flex min-h-[44px] flex-1 items-center justify-center ${
              active ? 'text-ink' : 'text-ink-muted'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
