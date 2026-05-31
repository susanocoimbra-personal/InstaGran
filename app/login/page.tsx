'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const PIN_LENGTH = 6;

export default function LoginPage() {
  const { signIn, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Synchronous guard: state updates are async, so a ref is what actually
  // prevents the auto-submit and a manual tap from both firing signIn.
  const submittingRef = useRef(false);

  // Already signed in → go to feed.
  useEffect(() => {
    if (!authLoading && session) router.replace('/feed');
  }, [authLoading, session, router]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  // Single submit path, guarded against concurrent calls. `value` defaults to
  // current pin (manual button press) but is passed explicitly on auto-submit.
  const submit = async (value: string = pin) => {
    if (submittingRef.current) return;
    if (value.length < PIN_LENGTH) {
      setError('Introduz o teu PIN de 6 dígitos');
      triggerShake();
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    setError('');
    const { error: signInError } = await signIn(value);
    if (signInError) {
      setError('PIN errado. Tenta outra vez!');
      setPin('');
      triggerShake();
      inputRef.current?.focus();
      submittingRef.current = false;
      setLoading(false);
    } else {
      router.replace('/feed');
      // leave loading true through navigation; ref stays set to block re-entry
    }
  };

  const handleChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, PIN_LENGTH);
    setPin(cleaned);
    setError('');
    if (cleaned.length === PIN_LENGTH) {
      setTimeout(() => submit(cleaned), 120); // auto-submit when the last digit lands
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-8">
      <div className="flex w-full max-w-sm animate-rise-in flex-col items-center">
        {/* Masthead */}
        <p className="label mb-5 text-ink-muted">O diário da família</p>
        <h1 className="font-serif text-[64px] leading-none tracking-wordmark text-ink">Vovo</h1>

        {/* Hairline rule with the prompt, like a title page */}
        <div className="mb-10 mt-7 flex w-full items-center gap-4">
          <span className="h-px flex-1 bg-line" />
          <span className="label text-ink-muted">Introduz o teu PIN</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        {/* PIN dots */}
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          className={`mb-2 flex gap-5 p-3 ${shake ? 'animate-shake' : ''}`}
          aria-label={`Campo PIN. ${pin.length} de ${PIN_LENGTH} dígitos introduzidos`}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
                pin.length > i ? 'scale-100 bg-ink' : 'scale-90 bg-line'
              }`}
            />
          ))}
        </button>

        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={pin}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          maxLength={PIN_LENGTH}
          className="absolute h-px w-px opacity-0"
          aria-label="Introduzir PIN"
        />

        {/* Error / placeholder */}
        <div className="flex h-8 items-center">
          {error ? (
            <p className="text-[15px] italic text-danger" role="alert" style={{ fontFamily: 'var(--font-serif)' }}>
              {error}
            </p>
          ) : null}
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={() => submit()}
          disabled={loading}
          className="label mb-8 mt-2 flex min-h-[52px] min-w-[180px] items-center justify-center rounded-full bg-ink px-10 text-paper transition active:scale-[0.98] disabled:opacity-40"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
          ) : (
            'Entrar'
          )}
        </button>

        <p className="label text-ink-faint">Pede o teu PIN ao Diogo</p>
      </div>
    </main>
  );
}
