'use client';

import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  title: string;
  /** Renders the masthead: big serif "Vovo" wordmark + label subtitle. */
  brand?: boolean;
  /** Optional label shown under the wordmark when brand is true. */
  subtitle?: string;
  back?: boolean;
}

// Editorial header. As a masthead (brand) it's a magazine cover line; otherwise
// a quiet serif title with an optional back affordance.
export default function AppHeader({ title, brand = false, subtitle, back = false }: AppHeaderProps) {
  const router = useRouter();

  if (brand) {
    return (
      <header className="border-b border-line bg-paper px-6 pb-5 pt-8 safe-top">
        <h1 className="font-serif text-[40px] leading-none tracking-wordmark text-ink">{title}</h1>
        {subtitle && <p className="label mt-2 text-ink-muted">{subtitle}</p>}
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-1 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur safe-top">
      {back && (
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="-ml-1 flex h-11 w-11 items-center justify-center rounded-full text-2xl text-ink-soft active:bg-paper-dim"
        >
          ‹
        </button>
      )}
      <h1 className="font-serif text-2xl text-ink">{title}</h1>
    </header>
  );
}
