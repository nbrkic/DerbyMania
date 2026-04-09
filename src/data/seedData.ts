import { Tournament, Team, Player, Match, Group } from '../types';

export const seedTeams: Team[] = [
{
  id: 't1',
  name: 'FK Radnički',
  shortName: 'RAD',
  city: 'Beograd',
  primaryColor: '#E74C3C',
  secondaryColor: '#FFFFFF',
  foundedYear: 1950,
  createdAt: new Date().toISOString()
},
{
  id: 't2',
  name: 'Spartak',
  shortName: 'SPA',
  city: 'Subotica',
  primaryColor: '#3498DB',
  secondaryColor: '#FFFFFF',
  foundedYear: 1945,
  createdAt: new Date().toISOString()
},
{
  id: 't3',
  name: 'Zemun',
  shortName: 'ZEM',
  city: 'Zemun',
  primaryColor: '#2ECC71',
  secondaryColor: '#000000',
  foundedYear: 1946,
  createdAt: new Date().toISOString()
},
{
  id: 't4',
  name: 'Vojvodina',
  shortName: 'VOJ',
  city: 'Novi Sad',
  primaryColor: '#E74C3C',
  secondaryColor: '#FFFFFF',
  foundedYear: 1914,
  createdAt: new Date().toISOString()
},
{
  id: 't5',
  name: 'Čukarički',
  shortName: 'CUK',
  city: 'Beograd',
  primaryColor: '#000000',
  secondaryColor: '#FFFFFF',
  foundedYear: 1926,
  createdAt: new Date().toISOString()
},
{
  id: 't6',
  name: 'Napredak',
  shortName: 'NAP',
  city: 'Kruševac',
  primaryColor: '#E74C3C',
  secondaryColor: '#F1C40F',
  foundedYear: 1946,
  createdAt: new Date().toISOString()
},
{
  id: 't7',
  name: 'Radnik',
  shortName: 'RDN',
  city: 'Surdulica',
  primaryColor: '#3498DB',
  secondaryColor: '#FFFFFF',
  foundedYear: 1926,
  createdAt: new Date().toISOString()
},
{
  id: 't8',
  name: 'Javor',
  shortName: 'JAV',
  city: 'Ivanjica',
  primaryColor: '#FFFFFF',
  secondaryColor: '#E74C3C',
  foundedYear: 1912,
  createdAt: new Date().toISOString()
}];


export const seedPlayers: Player[] = [
// FK Radnički
{
  id: 'p1',
  firstName: 'Marko',
  lastName: 'Jovanović',
  dateOfBirth: '1995-05-12',
  jerseyNumber: 10,
  position: 'CAM',
  teamId: 't1',
  isCaptain: true,
  createdAt: new Date().toISOString()
},
{
  id: 'p2',
  firstName: 'Nikola',
  lastName: 'Petrović',
  dateOfBirth: '1998-08-22',
  jerseyNumber: 9,
  position: 'ST',
  teamId: 't1',
  isCaptain: false,
  createdAt: new Date().toISOString()
},
{
  id: 'p3',
  firstName: 'Stefan',
  lastName: 'Ilić',
  dateOfBirth: '1993-11-05',
  jerseyNumber: 1,
  position: 'GK',
  teamId: 't1',
  isCaptain: false,
  createdAt: new Date().toISOString()
},
// Spartak
{
  id: 'p4',
  firstName: 'Luka',
  lastName: 'Đorđević',
  dateOfBirth: '1997-02-14',
  jerseyNumber: 7,
  position: 'RW',
  teamId: 't2',
  isCaptain: true,
  createdAt: new Date().toISOString()
},
{
  id: 'p5',
  firstName: 'Miloš',
  lastName: 'Stojanović',
  dateOfBirth: '1996-09-30',
  jerseyNumber: 4,
  position: 'CB',
  teamId: 't2',
  isCaptain: false,
  createdAt: new Date().toISOString()
},
{
  id: 'p6',
  firstName: 'Nemanja',
  lastName: 'Kovačević',
  dateOfBirth: '1999-04-18',
  jerseyNumber: 8,
  position: 'CM',
  teamId: 't2',
  isCaptain: false,
  createdAt: new Date().toISOString()
},
// Zemun
{
  id: 'p7',
  firstName: 'Aleksandar',
  lastName: 'Mitrović',
  dateOfBirth: '1994-07-07',
  jerseyNumber: 9,
  position: 'ST',
  teamId: 't3',
  isCaptain: true,
  createdAt: new Date().toISOString()
},
{
  id: 'p8',
  firstName: 'Filip',
  lastName: 'Kostić',
  dateOfBirth: '1992-12-01',
  jerseyNumber: 11,
  position: 'LW',
  teamId: 't3',
  isCaptain: false,
  createdAt: new Date().toISOString()
},
// Vojvodina
{
  id: 'p9',
  firstName: 'Dušan',
  lastName: 'Tadić',
  dateOfBirth: '1988-11-20',
  jerseyNumber: 10,
  position: 'CAM',
  teamId: 't4',
  isCaptain: true,
  createdAt: new Date().toISOString()
},
{
  id: 'p10',
  firstName: 'Sergej',
  lastName: 'Milinković-Savić',
  dateOfBirth: '1995-02-27',
  jerseyNumber: 20,
  position: 'CM',
  teamId: 't4',
  isCaptain: false,
  createdAt: new Date().toISOString()
}];


export const seedTournaments: Tournament[] = [
{
  id: 'tr1',
  name: 'GoalStorm Cup 2025',
  description: 'Godišnji prolećni turnir za najbolje amaterske ekipe.',
  type: 'amateur',
  ageCategory: 'senior',
  city: 'Beograd',
  startDate: '2025-04-01',
  endDate: '2025-05-15',
  format: 'group_knockout',
  teamCount: 8,
  groupsCount: 2,
  advancingPerGroup: 2,
  settings: {
    matchDuration: 90,
    extraTime: true,
    penalties: true,
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0
  },
  status: 'active',
  teamIds: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'],
  createdAt: new Date().toISOString()
},
{
  id: 'tr2',
  name: 'Letnja Liga 2025',
  description: 'Letnja liga za održavanje forme.',
  type: 'semi-pro',
  ageCategory: 'senior',
  city: 'Novi Sad',
  startDate: '2025-06-01',
  endDate: '2025-08-30',
  format: 'league',
  teamCount: 10,
  settings: {
    matchDuration: 90,
    extraTime: false,
    penalties: false,
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0
  },
  status: 'upcoming',
  teamIds: ['t1', 't4', 't2'],
  createdAt: new Date().toISOString()
}];


export const seedGroups: Group[] = [
{
  id: 'g1',
  tournamentId: 'tr1',
  name: 'Grupa A',
  teamIds: ['t1', 't2', 't3', 't4']
},
{
  id: 'g2',
  tournamentId: 'tr1',
  name: 'Grupa B',
  teamIds: ['t5', 't6', 't7', 't8']
}];


export const seedMatches: Match[] = [
{
  id: 'm1',
  tournamentId: 'tr1',
  groupId: 'g1',
  round: 'Grupa A',
  homeTeamId: 't1',
  awayTeamId: 't2',
  homeScore: 2,
  awayScore: 1,
  status: 'completed',
  date: '2025-04-05',
  time: '18:00',
  events: [
  {
    id: 'e1',
    type: 'goal',
    playerId: 'p1',
    teamId: 't1',
    minute: 23,
    detail: 'regular'
  },
  {
    id: 'e2',
    type: 'goal',
    playerId: 'p4',
    teamId: 't2',
    minute: 45,
    detail: 'regular'
  },
  {
    id: 'e3',
    type: 'goal',
    playerId: 'p2',
    teamId: 't1',
    minute: 78,
    detail: 'regular'
  },
  {
    id: 'e4',
    type: 'yellow_card',
    playerId: 'p5',
    teamId: 't2',
    minute: 33
  }]

},
{
  id: 'm2',
  tournamentId: 'tr1',
  groupId: 'g1',
  round: 'Grupa A',
  homeTeamId: 't3',
  awayTeamId: 't4',
  homeScore: 0,
  awayScore: 0,
  status: 'completed',
  date: '2025-04-06',
  time: '16:00',
  events: []
},
{
  id: 'm3',
  tournamentId: 'tr1',
  groupId: 'g1',
  round: 'Grupa A',
  homeTeamId: 't1',
  awayTeamId: 't3',
  homeScore: null,
  awayScore: null,
  status: 'scheduled',
  date: '2025-04-12',
  time: '18:00',
  events: []
}];