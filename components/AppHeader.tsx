'use client';

import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  title: string;
  brand?: boolean;
  back?: boolean;
}

// Sticky top header. `brand` renders the big terracotta "Vovo" wordmark.
export default function AppHeader({ title, brand = false, back = false }: AppHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-line/60 bg-background/90 px-4 py-3 backdrop-blur safe-top">
      {back && (
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-2xl text-ink-secondary active:bg-surface-alt"
        >
          ‹
        </button>
      )}
      <h1
        className={
          brand
            ? 'text-2xl font-extrabold tracking-tight text-primary'
            : 'text-lg font-semibold text-ink'
        }
      >
        {title}
      </h1>
    </header>
  );
}
