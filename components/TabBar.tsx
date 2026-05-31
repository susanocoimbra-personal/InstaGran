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
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-line bg-paper/95 px-3 py-2 backdrop-blur safe-bottom">
      {tabs.map((tab) => {
        const active =
          pathname === tab.href || (tab.href !== '/feed' && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={
              tab.cta
                ? 'label flex min-h-[44px] items-center rounded-full bg-ink px-5 text-paper'
                : `label flex min-h-[44px] items-center px-3 ${
                    active ? 'text-ink' : 'text-ink-muted'
                  }`
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
