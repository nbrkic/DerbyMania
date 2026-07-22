import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
  avatar_position_x: number;
  avatar_position_y: number;
  birth_date: string | null;
  phone: string | null;
  dominant_hand: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_positions: string[];
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  unreadNotificationCount: number;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    birthDate: string,
    phone: string
  ) => Promise<{ error: string | null; user: User | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshUnreadNotificationCount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const profileRequestId = useRef(0);

  async function loadUnreadNotificationCount(userId: string) {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    setUnreadNotificationCount(count ?? 0);
  }

  async function loadProfile(userId: string) {
    const requestId = ++profileRequestId.current;
    const { data } = await supabase
      .from('profiles')
      .select(
        'full_name, avatar_url, avatar_position_x, avatar_position_y, birth_date, phone, dominant_hand, height_cm, weight_kg, preferred_positions'
      )
      .eq('id', userId)
      .single();
    // Discard results from a fetch that a newer one has since superseded,
    // otherwise a slow, stale request can overwrite fresher profile data.
    if (requestId === profileRequestId.current) {
      setProfile(data ?? null);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) {
        loadProfile(data.session.user.id);
        loadUnreadNotificationCount(data.session.user.id);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
        loadUnreadNotificationCount(newSession.user.id);
      } else {
        setProfile(null);
        setUnreadNotificationCount(0);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, fullName: string, birthDate: string, phone: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, birth_date: birthDate, phone } },
    });
    return { error: error?.message ?? null, user: data.user };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) await loadProfile(data.session.user.id);
  }

  async function refreshUnreadNotificationCount() {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) await loadUnreadNotificationCount(data.session.user.id);
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        profile,
        loading,
        unreadNotificationCount,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        refreshUnreadNotificationCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
