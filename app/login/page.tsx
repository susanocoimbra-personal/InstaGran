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
    <main
      className="flex min-h-screen flex-col items-center justify-center px-8"
      style={{
        background: 'linear-gradient(160deg, #FAF7F4 0%, #F3EDE7 50%, #FAF7F4 100%)',
      }}
    >
      <div className="flex w-full max-w-sm animate-fade-up flex-col items-center">
        {/* Icon with glow */}
        <div className="relative mb-6 flex h-28 w-28 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-primary/10" />
          <span className="text-6xl">👶</span>
        </div>

        <h1 className="mb-1 text-5xl font-extrabold tracking-wide text-primary">Vovo</h1>
        <p className="mb-2 text-center text-base text-ink-secondary">
          Fotos de família, partilhadas com amor
        </p>
        <p className="mb-8 text-lg opacity-60">❤️</p>

        {/* PIN dots */}
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          className={`mb-2 flex gap-5 p-4 ${shake ? 'animate-shake' : ''}`}
          aria-label={`Campo PIN. ${pin.length} de ${PIN_LENGTH} dígitos introduzidos`}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <span
              key={i}
              className={`h-[18px] w-[18px] rounded-full border-[2.5px] transition-all duration-150 ${
                pin.length > i
                  ? 'scale-100 border-primary bg-primary'
                  : 'scale-90 border-primary/35 bg-transparent'
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
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={() => submit()}
          disabled={loading}
          className="mb-6 flex min-h-[56px] min-w-[200px] items-center justify-center rounded-full bg-gradient-to-br from-primary-light via-primary to-primary-dark px-12 py-3.5 text-lg font-bold text-white shadow-lift transition active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            'Entrar'
          )}
        </button>

        <p className="text-xs tracking-wide text-ink-light">Pede o teu PIN ao Diogo</p>
      </div>
    </main>
  );
}
