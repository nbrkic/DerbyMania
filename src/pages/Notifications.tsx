import { useEffect, useState } from 'react';
import { cleanupOldNotifications, useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { TextCardSkeletonList } from '../components/Skeleton';
import { Seo } from '../components/Seo';
import { SquadSelectionModal } from '../components/SquadSelectionModal';
import {
  checkOwnerConflict,
  loadEligibilityPool,
  requiredSquadSize,
  finalizeRoster,
  releaseRoster,
  type EligibilityPool,
} from '../lib/tournamentRoster';

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
  tournament_team_requests: { status: string; team_id: string; tournament_id: string } | null;
  organizer_request_id: string | null;
  tournament_organizer_requests: { status: string } | null;
};

type InviteSquadModal = {
  notification: NotificationRow;
  teamName: string;
  tournamentId: string;
  teamId: string;
  pool: EligibilityPool;
  requiredSize: number;
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
  const [confirmingDismissAll, setConfirmingDismissAll] = useState(false);
  const [dismissingAll, setDismissingAll] = useState(false);
  const [squadModal, setSquadModal] = useState<InviteSquadModal | null>(null);
  const [squadSubmitting, setSquadSubmitting] = useState(false);
  const [inviteFlowError, setInviteFlowError] = useState<string | null>(null);
  const [respondError, setRespondError] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    await cleanupOldNotifications(user.id);
    const { data } = await supabase
      .from('notifications')
      .select(
        'id, type, title, body, read, created_at, join_request_id, team_join_requests(status), tournament_request_id, tournament_team_requests(status, team_id, tournament_id), organizer_request_id, tournament_organizer_requests(status)'
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

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-page-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function respond(notification: NotificationRow, status: 'accepted' | 'rejected') {
    setRespondError(null);

    if (notification.organizer_request_id) {
      setRespondingId(notification.id);
      const { error } = await supabase
        .from('tournament_organizer_requests')
        .update({ status, responded_at: new Date().toISOString() })
        .eq('id', notification.organizer_request_id);
      setRespondingId(null);
      if (error) {
        setRespondError('Akcija nije uspela. Pokušaj ponovo.');
        return;
      }
      await load();
      return;
    }

    if (notification.join_request_id) {
      setRespondingId(notification.id);
      const { error } = await supabase
        .from('team_join_requests')
        .update({ status, responded_at: new Date().toISOString() })
        .eq('id', notification.join_request_id);
      setRespondingId(null);
      if (error) {
        setRespondError('Akcija nije uspela. Pokušaj ponovo.');
        return;
      }
      await load();
      return;
    }

    if (!notification.tournament_request_id) return;

    if (status === 'rejected') {
      setRespondingId(notification.id);
      const req = notification.tournament_team_requests;
      const { error } = await supabase
        .from('tournament_team_requests')
        .update({ status, responded_at: new Date().toISOString() })
        .eq('id', notification.tournament_request_id);
      if (error) {
        setRespondingId(null);
        setRespondError('Akcija nije uspela. Pokušaj ponovo.');
        return;
      }
      if (req?.tournament_id && req?.team_id) await releaseRoster(req.tournament_id, req.team_id);
      setRespondingId(null);
      await load();
      return;
    }

    // Prihvatanje poziva turnira (tournament_invite) je prvi trenutak kada se tim
    // zvanično izjašnjava da igra — tu se proverava sastav, baš kao pri slanju zahteva.
    if (notification.type === 'tournament_invite') {
      await openInviteSquadFlow(notification);
      return;
    }

    setRespondingId(notification.id);
    const { error } = await supabase
      .from('tournament_team_requests')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', notification.tournament_request_id);
    setRespondingId(null);
    if (error) {
      setRespondError('Akcija nije uspela. Pokušaj ponovo.');
      return;
    }
    await load();
  }

  async function openInviteSquadFlow(notification: NotificationRow) {
    const req = notification.tournament_team_requests;
    if (!req?.team_id || !req?.tournament_id) return;

    setRespondingId(notification.id);
    setInviteFlowError(null);

    const { data: tournamentRow } = await supabase
      .from('tournaments')
      .select('id, players_per_team, substitutions_allowed, min_birth_year, max_birth_year, max_teams, status, roster_locked')
      .eq('id', req.tournament_id)
      .single();

    if (!tournamentRow) {
      setRespondingId(null);
      setInviteFlowError('Turnir više ne postoji.');
      return;
    }
    if (tournamentRow.status === 'finished' || tournamentRow.roster_locked) {
      setRespondingId(null);
      setInviteFlowError('Prijave za ovaj turnir su u međuvremenu zatvorene.');
      return;
    }

    const { count } = await supabase
      .from('tournament_teams')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', req.tournament_id);
    if (tournamentRow.max_teams != null && (count ?? 0) >= tournamentRow.max_teams) {
      setRespondingId(null);
      setInviteFlowError('Turnir je u međuvremenu popunjen.');
      return;
    }

    const { data: teamRow } = await supabase.from('teams').select('id, name, owner_id').eq('id', req.team_id).single();
    if (!teamRow) {
      setRespondingId(null);
      return;
    }

    const conflict = await checkOwnerConflict(req.tournament_id, teamRow.owner_id, req.team_id);
    if (conflict.blocked) {
      setRespondingId(null);
      setInviteFlowError(`Osnivač već ima prijavljen tim „${conflict.teamName}“ na ovom turniru — može da prijavi samo jedan tim.`);
      return;
    }

    const pool = await loadEligibilityPool(req.tournament_id, req.team_id, tournamentRow);
    const required = requiredSquadSize(tournamentRow);
    setRespondingId(null);

    if (pool.eligible.length < required) {
      setInviteFlowError(`Tim nema dovoljno igrača koji ispunjavaju uslove turnira (potrebno ${required}, dostupno ${pool.eligible.length}).`);
      return;
    }

    if (pool.eligible.length === required) {
      await finishAcceptInvite(notification, req.tournament_id, req.team_id, pool.eligible.map((p) => p.id));
      return;
    }

    setSquadModal({
      notification,
      teamName: teamRow.name,
      tournamentId: req.tournament_id,
      teamId: req.team_id,
      pool,
      requiredSize: required,
    });
  }

  async function finishAcceptInvite(notification: NotificationRow, tournamentId: string, teamId: string, userIds: string[]) {
    setSquadSubmitting(true);
    const { error: rosterError } = await finalizeRoster(tournamentId, teamId, userIds);
    if (rosterError) {
      setSquadSubmitting(false);
      setInviteFlowError('Prihvatanje poziva nije uspelo. Pokušaj ponovo.');
      return;
    }
    const { error } = await supabase
      .from('tournament_team_requests')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', notification.tournament_request_id!);
    if (error) {
      await releaseRoster(tournamentId, teamId);
      setSquadSubmitting(false);
      setInviteFlowError('Prihvatanje poziva nije uspelo. Pokušaj ponovo.');
      return;
    }
    setSquadSubmitting(false);
    setSquadModal(null);
    await load();
  }

  async function dismiss(id: string) {
    const removed = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error && removed) {
      setNotifications((prev) => (prev.some((n) => n.id === id) ? prev : [...prev, removed].sort((a, b) => b.created_at.localeCompare(a.created_at))));
      setRespondError('Uklanjanje obaveštenja nije uspelo. Pokušaj ponovo.');
    }
  }

  async function dismissAll() {
    if (!user) return;
    setDismissingAll(true);
    const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);
    setDismissingAll(false);
    if (error) {
      setRespondError('Brisanje obaveštenja nije uspelo. Pokušaj ponovo.');
      return;
    }
    setNotifications([]);
    setConfirmingDismissAll(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-paper-100 overflow-x-hidden">
      <Seo title="Obaveštenja" description="Tvoja obaveštenja na DerbyManiji." path="/obavestenja" noindex />
      <div className="grain" />
      <SiteHeader />

      <main className="flex-1 pt-16 flex flex-col">
        <section className="flex-1 bg-ink-900 border-b border-ink-700">
          <div className="max-w-4xl mx-auto px-6 py-16 sm:py-20 w-full">
            <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
              <div>
                <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">Tvoj nalog</span>
                <h1 className="font-display text-4xl sm:text-5xl mt-4 leading-tight">Obaveštenja</h1>
              </div>

              {!loading && notifications.length > 0 && (
                confirmingDismissAll ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={dismissAll}
                      disabled={dismissingAll}
                      className="px-4 py-2.5 text-xs uppercase tracking-widest text-paper-100 bg-red-500 hover:bg-red-400 transition-colors disabled:opacity-50"
                    >
                      {dismissingAll ? 'Brisanje…' : 'Potvrdi'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDismissAll(false)}
                      disabled={dismissingAll}
                      className="text-xs uppercase tracking-widest text-paper-500 hover:text-paper-100 transition-colors"
                    >
                      Otkaži
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDismissAll(true)}
                    className="btn-line px-4 py-2.5 text-xs uppercase tracking-widest whitespace-nowrap"
                  >
                    Obriši sva obaveštenja
                  </button>
                )
              )}
            </div>

            {(inviteFlowError || respondError) && (
              <div className="bg-red-500/10 border border-red-500/30 px-5 py-3 mb-6">
                <p className="text-sm text-red-400">{inviteFlowError || respondError}</p>
              </div>
            )}

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
                      : n.type === 'tournament_request' || n.type === 'tournament_invite'
                        ? n.tournament_team_requests?.status
                        : n.type === 'tournament_organizer_invite'
                          ? n.tournament_organizer_requests?.status
                          : null;
                  const isPendingAction = requestStatus === 'pending';
                  const isAccepted =
                    n.type === 'join_accepted' ||
                    n.type === 'invite_accepted' ||
                    n.type === 'tournament_request_accepted' ||
                    n.type === 'tournament_invite_accepted' ||
                    n.type === 'tournament_organizer_accepted' ||
                    requestStatus === 'accepted';
                  const isRejected =
                    n.type === 'join_rejected' ||
                    n.type === 'invite_rejected' ||
                    n.type === 'tournament_request_rejected' ||
                    n.type === 'tournament_invite_rejected' ||
                    n.type === 'tournament_organizer_rejected' ||
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

      {squadModal && (
        <SquadSelectionModal
          teamName={squadModal.teamName}
          requiredSize={squadModal.requiredSize}
          pool={squadModal.pool}
          submitting={squadSubmitting}
          onCancel={() => setSquadModal(null)}
          onConfirm={(userIds) => finishAcceptInvite(squadModal.notification, squadModal.tournamentId, squadModal.teamId, userIds)}
        />
      )}

      <SiteFooter />
    </div>
  );
}
