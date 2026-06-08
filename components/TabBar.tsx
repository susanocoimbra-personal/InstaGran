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
  { href: '/feed', label: 'Feed' },
  { href: '/albums', label: 'Álbuns' },
  { href: '/upload', label: 'Adicionar', parentOnly: true, cta: true },
];

// Editorial bottom nav: typographic, letter-spaced caps, one ink-pill CTA.
// Each item keeps a >=44px hit area for older users.
export default function TabBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // The photo detail screen has its own fixed footer (the comment bar), so the
  // nav would sit on top of it. Hide the nav there — that screen uses the
  // header's back button to return.
  if (pathname.startsWith('/photo/')) return null;

  const tabs = TABS.filter((t) => !t.parentOnly || user?.role === 'parent');

  return (
    <nav
      style={{ ['--safe-pad-bottom' as string]: '12px' }}
      className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-6 border-t border-line bg-paper/95 px-6 py-3 backdrop-blur sm:px-8 lg:px-12 safe-bottom"
    >
      {tabs.map((tab) => {
        const active =
          pathname === tab.href || (tab.href !== '/feed' && pathname.startsWith(tab.href));

        // The add action is a round ink "+" button, pushed to the right as the
        // primary affordance; the text tabs stay grouped on the left.
        if (tab.cta) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              className="ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-2xl font-light leading-none text-paper transition active:scale-95"
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
            className={`label flex min-h-[44px] items-center ${
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
