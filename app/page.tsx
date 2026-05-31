'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';

// Root route: bounce to /feed or /login depending on session.
export default function Home() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(session ? '/feed' : '/login');
  }, [session, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <Spinner />
    </div>
  );
}
