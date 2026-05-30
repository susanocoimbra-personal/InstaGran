'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (pin: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // `active` guards against stale async resolutions after unmount. React
    // Strict Mode (dev) mounts effects twice; without this guard the first
    // mount's getSession/fetchProfile can land after cleanup and commit a
    // stale render, leaving consumers disagreeing on `user` (e.g. the tab bar
    // sees the profile while the feed still sees null).
    let active = true;

    async function fetchProfile(userId: string) {
      const { data } = await supabase.from('users').select('*').eq('id', userId).single();
      if (!active) return;
      setUser(data);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(pin: string): Promise<{ error: string | null }> {
    // Use RPC to look up the user's email by PIN (bypasses RLS), then sign in.
    const { data: profile, error: lookupError } = await supabase
      .rpc('get_user_by_pin', { pin })
      .single<{ email: string }>();

    if (lookupError || !profile) {
      return { error: 'PIN inválido' };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: pin,
    });

    if (error) return { error: error.message };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
