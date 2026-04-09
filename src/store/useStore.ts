import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Tournament, Team, Player, Match, Group, GroupStanding } from '../types';
import {
  seedTournaments,
  seedTeams,
  seedPlayers,
  seedMatches,
  seedGroups } from
'../data/seedData';

interface StoreState {
  tournaments: Tournament[];
  teams: Team[];
  players: Player[];
  matches: Match[];
  groups: Group[];

  // Actions
  addTournament: (tournament: Tournament) => void;
  updateTournament: (id: string, data: Partial<Tournament>) => void;
  deleteTournament: (id: string) => void;

  addTeam: (team: Team) => void;
  updateTeam: (id: string, data: Partial<Team>) => void;
  deleteTeam: (id: string) => void;

  addPlayer: (player: Player) => void;
  updatePlayer: (id: string, data: Partial<Player>) => void;
  deletePlayer: (id: string) => void;

  addMatch: (match: Match) => void;
  updateMatch: (id: string, data: Partial<Match>) => void;

  addGroup: (group: Group) => void;

  // Computed helpers
  getGroupStandings: (groupId: string) => GroupStanding[];
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      tournaments: seedTournaments,
      teams: seedTeams,
      players: seedPlayers,
      matches: seedMatches,
      groups: seedGroups,

      addTournament: (tournament) =>
      set((state) => ({ tournaments: [...state.tournaments, tournament] })),
      updateTournament: (id, data) =>
      set((state) => ({
        tournaments: state.tournaments.map((t) =>
        t.id === id ? { ...t, ...data } : t
        )
      })),
      deleteTournament: (id) =>
      set((state) => ({
        tournaments: state.tournaments.filter((t) => t.id !== id)
      })),

      addTeam: (team) => set((state) => ({ teams: [...state.teams, team] })),
      updateTeam: (id, data) =>
      set((state) => ({
        teams: state.teams.map((t) => t.id === id ? { ...t, ...data } : t)
      })),
      deleteTeam: (id) =>
      set((state) => ({
        teams: state.teams.filter((t) => t.id !== id)
      })),

      addPlayer: (player) =>
      set((state) => ({ players: [...state.players, player] })),
      updatePlayer: (id, data) =>
      set((state) => ({
        players: state.players.map((p) =>
        p.id === id ? { ...p, ...data } : p
        )
      })),
      deletePlayer: (id) =>
      set((state) => ({
        players: state.players.filter((p) => p.id !== id)
      })),

      addMatch: (match) =>
      set((state) => ({ matches: [...state.matches, match] })),
      updateMatch: (id, data) =>
      set((state) => ({
        matches: state.matches.map((m) =>
        m.id === id ? { ...m, ...data } : m
        )
      })),

      addGroup: (group) =>
      set((state) => ({ groups: [...state.groups, group] })),

      getGroupStandings: (groupId: string) => {
        const { matches, groups } = get();
        const group = groups.find((g) => g.id === groupId);
        if (!group) return [];

        const standings: Record<string, GroupStanding> = {};

        // Initialize standings for all teams in group
        group.teamIds.forEach((teamId) => {
          standings[teamId] = {
            teamId,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0
          };
        });

        // Calculate based on completed matches
        const groupMatches = matches.filter(
          (m) => m.groupId === groupId && m.status === 'completed'
        );

        groupMatches.forEach((match) => {
          if (match.homeScore === null || match.awayScore === null) return;

          const home = standings[match.homeTeamId];
          const away = standings[match.awayTeamId];

          if (!home || !away) return;

          home.played++;
          away.played++;

          home.goalsFor += match.homeScore;
          home.goalsAgainst += match.awayScore;
          away.goalsFor += match.awayScore;
          away.goalsAgainst += match.homeScore;

          if (match.homeScore > match.awayScore) {
            home.won++;
            home.points += 3;
            away.lost++;
          } else if (match.homeScore < match.awayScore) {
            away.won++;
            away.points += 3;
            home.lost++;
          } else {
            home.drawn++;
            away.drawn++;
            home.points += 1;
            away.points += 1;
          }
        });

        // Calculate GD and sort
        return Object.values(standings).
        map((s) => {
          s.goalDifference = s.goalsFor - s.goalsAgainst;
          return s;
        }).
        sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference)
          return b.goalDifference - a.goalDifference;
          return b.goalsFor - a.goalsFor;
        });
      }
    }),
    {
      name: 'goalstorm-storage'
    }
  )
);