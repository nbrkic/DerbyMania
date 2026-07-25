import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { TextCardSkeletonList } from '../components/Skeleton';

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
  join_request_id: string | null;
  team_join_requests: { status: string } | null;
  tournament_request_id: string | null;
  tournament_team_requests: { status: string } | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('sr-Latn-RS', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function Notifications() {
  const { user, refreshUnreadNotificationCount } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select(
        'id, type, title, body, read, created_at, join_request_id, team_join_requests(status), tournament_request_id, tournament_team_requests(status)'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setNotifications((data as unknown as NotificationRow[]) ?? []);
    setLoading(false);

    const unreadIds = (data ?? []).filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length) {
      await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
      await refreshUnreadNotificationCount();
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function respond(notification: NotificationRow, status: 'accepted' | 'rejected') {
    if (notification.join_request_id) {
      setRespondingId(notification.id);
      await supabase
        .from('team_join_requests')
        .update({ status, responded_at: new Date().toISOString() })
        .eq('id', notification.join_request_id);
      setRespondingId(null);
      await load();
    } else if (notification.tournament_request_id) {
      setRespondingId(notification.id);
      await supabase
        .from('tournament_team_requests')
        .update({ status, responded_at: new Date().toISOString() })
        .eq('id', notification.tournament_request_id);
      setRespondingId(null);
      await load();
    }
  }

  async function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  }

  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
      <div className="grain" />
      <SiteHeader />

      <main className="flex-1 pt-16 flex flex-col">
        <section className="flex-1 bg-ink-900 border-b border-ink-700">
          <div className="max-w-4xl mx-auto px-6 py-16 sm:py-20 w-full">
            <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Tvoj nalog</span>
            <h1 className="font-display text-4xl sm:text-5xl mt-4 mb-10 leading-tight">Obaveštenja</h1>

            {loading ? (
              <TextCardSkeletonList count={4} />
            ) : notifications.length === 0 ? (
              <p className="text-paper-500">Nemaš još nijedno obaveštenje.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {notifications.map((n) => {
                  const requestStatus =
                    n.type === 'join_request' || n.type === 'team_invite'
                      ? n.team_join_requests?.status
                      : n.type === 'tournament_request'
                        ? n.tournament_team_requests?.status
                        : null;
                  const isPendingAction = requestStatus === 'pending';
                  const isAccepted =
                    n.type === 'join_accepted' ||
                    n.type === 'invite_accepted' ||
                    n.type === 'tournament_request_accepted' ||
                    requestStatus === 'accepted';
                  const isRejected =
                    n.type === 'join_rejected' ||
                    n.type === 'invite_rejected' ||
                    n.type === 'tournament_request_rejected' ||
                    requestStatus === 'rejected';
                  const isChampion = n.type === 'tournament_champion';
                  const accentClass = isChampion
                    ? 'border-t-red-400'
                    : isAccepted
                      ? 'border-t-green-500/60'
                      : isRejected
                        ? 'border-t-red-500/60'
                        : 'border-t-red-500/40';

                  return (
                    <div key={n.id} className={`relative bg-ink-800 border border-ink-700 border-t-2 ${accentClass} px-5 py-4`}>
                      <button
                        type="button"
                        onClick={() => dismiss(n.id)}
                        aria-label="Ukloni obaveštenje"
                        className="absolute top-3 right-3 text-paper-700 hover:text-paper-100 transition-colors"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>

                      <div className="pr-6">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="font-display text-lg leading-tight">{n.title}</p>
                          {isChampion && (
                            <span className="text-[10px] uppercase tracking-widest text-red-400 border border-red-500/30 px-2 py-0.5">
                              Pobednik
                            </span>
                          )}
                          {isAccepted && (
                            <span className="text-[10px] uppercase tracking-widest text-green-400 border border-green-500/30 px-2 py-0.5">
                              Prihvaćeno
                            </span>
                          )}
                          {isRejected && (
                            <span className="text-[10px] uppercase tracking-widest text-red-400 border border-red-500/30 px-2 py-0.5">
                              Odbijeno
                            </span>
                          )}
                        </div>
                        {n.body && <p className="text-sm text-paper-500 mt-1">{n.body}</p>}
                        <span className="text-xs text-paper-700 uppercase tracking-widest mt-2 inline-block">
                          {formatDate(n.created_at)}
                        </span>
                      </div>

                      {isPendingAction && (
                        <div className="flex gap-3 mt-4">
                          <button
                            type="button"
                            disabled={respondingId === n.id}
                            onClick={() => respond(n, 'accepted')}
                            className="ticket-submit px-5 py-2 text-xs uppercase tracking-widest"
                          >
                            Prihvati
                          </button>
                          <button
                            type="button"
                            disabled={respondingId === n.id}
                            onClick={() => respond(n, 'rejected')}
                            className="btn-line px-5 py-2 text-xs uppercase tracking-widest"
                          >
                            Odbij
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
