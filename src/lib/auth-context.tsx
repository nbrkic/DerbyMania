import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

function translateAuthError(message: string): string {
  const known: Record<string, string> = {
    'Invalid login credentials': 'Pogrešan email ili lozinka.',
    'Email not confirmed': 'Nalog nije potvrđen. Proveri email za link za potvrdu.',
    'User already registered': 'Nalog sa ovim emailom već postoji.',
  };
  return known[message] ?? message;
}

type Profile = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  avatar_position_x: number;
  avatar_position_y: number;
  birth_date: string | null;
  phone: string | null;
  city: string | null;
  dominant_hand: string | null;
  dominant_leg: string | null;
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
  signInWithUsername: (username: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    birthDate: string,
    phone: string,
    username: string
  ) => Promise<{ error: string | null; user: User | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshUnreadNotificationCount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const NOTIFICATION_RETENTION_DAYS = 7;

// Notification types that still need a Prihvati/Odbij response — their underlying
// request row can outlive the retention window, and the Notifications page is the
// only place a user can act on it, so purging the notification would strand it.
const ACTIONABLE_NOTIFICATION_TYPES = new Set(['join_request', 'team_invite', 'tournament_request', 'tournament_invite']);

type PendingCheckRow = {
  id: string;
  type: string;
  join_request_id: string | null;
  team_join_requests: { status: string } | null;
  tournament_request_id: string | null;
  tournament_team_requests: { status: string } | null;
};

// Notifications the user never dismisses would otherwise pile up forever, so anything
// older than the retention window is purged on every session load — except a still-pending
// join/invite/request notification, which stays until it's answered or manually dismissed.
export async function cleanupOldNotifications(userId: string) {
  const cutoff = new Date(Date.now() - NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('notifications')
    .select(
      'id, type, join_request_id, team_join_requests(status), tournament_request_id, tournament_team_requests(status)'
    )
    .eq('user_id', userId)
    .lt('created_at', cutoff);

  const oldRows = (data as unknown as PendingCheckRow[]) ?? [];
  if (!oldRows.length) return;

  const deletableIds = oldRows
    .filter((n) => {
      if (!ACTIONABLE_NOTIFICATION_TYPES.has(n.type)) return true;
      const status = n.join_request_id ? n.team_join_requests?.status : n.tournament_team_requests?.status;
      return status !== 'pending';
    })
    .map((n) => n.id);

  if (deletableIds.length) {
    await supabase.from('notifications').delete().in('id', deletableIds);
  }
}

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
        'full_name, username, avatar_url, avatar_position_x, avatar_position_y, birth_date, phone, city, dominant_hand, dominant_leg, height_cm, weight_kg, preferred_positions'
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
        cleanupOldNotifications(data.session.user.id).then(() => loadUnreadNotificationCount(data.session.user.id));
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
        cleanupOldNotifications(newSession.user.id).then(() => loadUnreadNotificationCount(newSession.user.id));
      } else {
        setProfile(null);
        setUnreadNotificationCount(0);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => {
          loadUnreadNotificationCount(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? translateAuthError(error.message) : null };
  }

  async function signInWithUsername(username: string, password: string) {
    const { data: email, error: lookupError } = await supabase.rpc('email_for_username', {
      p_username: username,
    });
    if (lookupError || !email) {
      return { error: 'Pogrešno korisničko ime ili lozinka.' };
    }
    const { error } = await signIn(email, password);
    if (error) {
      return { error: 'Pogrešno korisničko ime ili lozinka.' };
    }
    return { error: null };
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
    birthDate: string,
    phone: string,
    username: string
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, birth_date: birthDate, phone, username } },
    });
    if (error || !data.user) return { error: error?.message ?? null, user: data.user };

    const { error: usernameError } = await supabase.from('profiles').update({ username }).eq('id', data.user.id);
    if (usernameError) {
      const message =
        usernameError.code === '23505'
          ? 'Ovo korisničko ime je u međuvremenu zauzeto.'
          : usernameError.message;
      return { error: message, user: data.user };
    }

    // onAuthStateChange already loaded the profile before this update finished,
    // so the cached profile is missing the username — reload it now.
    await loadProfile(data.user.id);

    return { error: null, user: data.user };
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
        signInWithUsername,
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
