'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (pin: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (changes: { name?: string; avatar_emoji?: string }) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  updateProfile: async () => ({ error: null }),
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

  const signIn = useCallback(async (pin: string): Promise<{ error: string | null }> => {
    // Use RPC to look up the user's email by PIN (bypasses RLS), then sign in.
    // The RPC is rate-limited server-side (see migration.sql) so a wrong PIN
    // and a throttled lookup both return no row — same generic error either way.
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
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const updateProfile = useCallback(
    async (changes: { name?: string; avatar_emoji?: string }): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Sessão terminada.' };
      const { data, error } = await supabase
        .from('users')
        .update(changes)
        .eq('id', user.id)
        .select('*')
        .single();
      if (error) return { error: error.message };
      if (data) setUser(data);
      return { error: null };
    },
    [user],
  );

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
