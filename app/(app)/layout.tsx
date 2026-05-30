'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import TabBar from '@/components/TabBar';
import Spinner from '@/components/Spinner';

// Authenticated shell: gates access and renders the floating tab bar.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace('/login');
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Bottom padding leaves room for the floating tab bar. */}
      <div className="pb-28">{children}</div>
      <TabBar />
    </div>
  );
}
