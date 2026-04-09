export type TournamentStatus = 'draft' | 'upcoming' | 'active' | 'completed';
export type TournamentType = 'amateur' | 'semi-pro' | 'pro' | 'youth' | 'womens';
export type AgeCategory = 'senior' | 'u21' | 'u19' | 'u17' | 'u15' | 'u13';
export type TournamentFormat =
'group_knockout' |
'league' |
'knockout' |
'group_playoff';

export interface TournamentSettings {
  matchDuration: number;
  extraTime: boolean;
  penalties: boolean;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  type: TournamentType;
  ageCategory: AgeCategory;
  country?: string;
  city?: string;
  location?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  format: TournamentFormat;
  teamCount: number;
  groupsCount?: number;
  advancingPerGroup?: number;
  settings: TournamentSettings;
  prizePool?: string;
  specialRules?: string;
  status: TournamentStatus;
  teamIds: string[];
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  city: string;
  country?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  stadium?: string;
  foundedYear?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  description?: string;
  createdAt: string;
}

export type PlayerPosition =
'GK' |
'CB' |
'LB' |
'RB' |
'LWB' |
'RWB' |
'CDM' |
'CM' |
'CAM' |
'LM' |
'RM' |
'LW' |
'RW' |
'CF' |
'ST';

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality?: string;
  photo?: string;
  jerseyNumber: number;
  position: PlayerPosition;
  dominantFoot?: 'left' | 'right' | 'both';
  height?: number;
  weight?: number;
  teamId: string;
  isCaptain: boolean;
  email?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
}

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed';

export interface MatchEvent {
  id: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'second_yellow';
  playerId: string;
  teamId: string;
  minute: number;
  detail?: 'regular' | 'own_goal' | 'penalty' | 'free_kick'; // For goals
}

export interface Match {
  id: string;
  tournamentId: string;
  groupId?: string;
  round?: string; // e.g., 'Group 1', 'Quarter-final', 'Final'
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties?: number | null;
  awayPenalties?: number | null;
  status: MatchStatus;
  date?: string;
  time?: string;
  referee?: string;
  events: MatchEvent[];
}

export interface GroupStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface Group {
  id: string;
  tournamentId: string;
  name: string;
  teamIds: string[];
}