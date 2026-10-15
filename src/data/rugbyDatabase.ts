import { Club, Player, RugbyPosition, LeagueId, PlayerAttributes } from '../types/rugby';
import { urcRegistry } from '../services/urcRegistryService';
import { INTERNATIONAL_RATINGS } from '../services/urcScraper';

export interface LeagueInfo {
  id: LeagueId;
  name: string;
  shortName: string;
  region: string;
  totalRounds: number;
  playoffCutoff: number;
  promotionRelegation: boolean;
  description: string;
}

// URC is the exclusive competition available
export const LEAGUES: LeagueInfo[] = [
  {
    id: 'URC',
    name: 'United Rugby Championship',
    shortName: 'URC',
    region: 'South Africa, Ireland, Scotland, Wales, Italy',
    totalRounds: 18,
    playoffCutoff: 8,
    promotionRelegation: false,
    description: 'The elite 16-club cross-hemisphere championship uniting South Africa, Ireland, Scotland, Wales, and Italy.'
  }
];

export const INITIAL_CLUBS: Club[] = [
  // --- SOUTH AFRICA SHIELD (4) ---
  {
    id: 'stormers',
    name: 'DHL Stormers',
    shortName: 'Stormers',
    leagueId: 'URC',
    country: 'South Africa',
    primaryColor: '#002F6C',
    secondaryColor: '#C8102E',
    accentColor: '#FFFFFF',
    stadiumName: 'DHL Stadium, Cape Town',
    stadiumCapacity: 55000,
    reputation: 91,
    transferBudget: 950000,
    wageBudget: 135000,
    facilities: { training: 5, medical: 4, academy: 5, stadium: 5, analytics: 4 },
    boardConfidence: 82,
    isUserControlled: true
  },
  {
    id: 'bulls',
    name: 'Vodacom Bulls',
    shortName: 'Bulls',
    leagueId: 'URC',
    country: 'South Africa',
    primaryColor: '#0072CE',
    secondaryColor: '#FFFFFF',
    accentColor: '#002244',
    stadiumName: 'Loftus Versfeld, Pretoria',
    stadiumCapacity: 51762,
    reputation: 90,
    transferBudget: 980000,
    wageBudget: 138000,
    facilities: { training: 5, medical: 4, academy: 5, stadium: 5, analytics: 4 },
    boardConfidence: 80
  },
  {
    id: 'sharks_urc',
    name: 'Hollywoodbets Sharks',
    shortName: 'Sharks',
    leagueId: 'URC',
    country: 'South Africa',
    primaryColor: '#1A1A1A',
    secondaryColor: '#FFFFFF',
    accentColor: '#2B2B2B',
    stadiumName: 'Kings Park Stadium, Durban',
    stadiumCapacity: 52000,
    reputation: 92,
    transferBudget: 1250000,
    wageBudget: 150000,
    facilities: { training: 5, medical: 5, academy: 4, stadium: 5, analytics: 4 },
    boardConfidence: 78
  },
  {
    id: 'lions',
    name: 'Fidelity Securedrive Lions',
    shortName: 'Lions',
    leagueId: 'URC',
    country: 'South Africa',
    primaryColor: '#C8102E',
    secondaryColor: '#FFFFFF',
    accentColor: '#1A1A1A',
    stadiumName: 'Emirates Airline Park, Johannesburg',
    stadiumCapacity: 62567,
    reputation: 84,
    transferBudget: 750000,
    wageBudget: 110000,
    facilities: { training: 4, medical: 4, academy: 4, stadium: 5, analytics: 3 },
    boardConfidence: 75
  },

  // --- IRISH SHIELD (4) ---
  {
    id: 'leinster',
    name: 'Leinster Rugby',
    shortName: 'Leinster',
    leagueId: 'URC',
    country: 'Ireland',
    primaryColor: '#002B49',
    secondaryColor: '#FFD700',
    accentColor: '#005596',
    stadiumName: 'RDS Arena / Aviva Stadium, Dublin',
    stadiumCapacity: 18500,
    reputation: 94,
    transferBudget: 1300000,
    wageBudget: 155000,
    facilities: { training: 5, medical: 5, academy: 5, stadium: 4, analytics: 5 },
    boardConfidence: 85
  },
  {
    id: 'munster',
    name: 'Munster Rugby',
    shortName: 'Munster',
    leagueId: 'URC',
    country: 'Ireland',
    primaryColor: '#C8102E',
    secondaryColor: '#CD9B1D',
    accentColor: '#000000',
    stadiumName: 'Thomond Park, Limerick',
    stadiumCapacity: 25600,
    reputation: 89,
    transferBudget: 900000,
    wageBudget: 128000,
    facilities: { training: 4, medical: 4, academy: 4, stadium: 4, analytics: 4 },
    boardConfidence: 79
  },
  {
    id: 'ulster',
    name: 'Ulster Rugby',
    shortName: 'Ulster',
    leagueId: 'URC',
    country: 'Ireland',
    primaryColor: '#FFFFFF',
    secondaryColor: '#C8102E',
    accentColor: '#000000',
    stadiumName: 'Kingspan Stadium, Belfast',
    stadiumCapacity: 18196,
    reputation: 85,
    transferBudget: 800000,
    wageBudget: 118000,
    facilities: { training: 4, medical: 4, academy: 4, stadium: 4, analytics: 4 },
    boardConfidence: 74
  },
  {
    id: 'connacht',
    name: 'Connacht Rugby',
    shortName: 'Connacht',
    leagueId: 'URC',
    country: 'Ireland',
    primaryColor: '#008751',
    secondaryColor: '#002B49',
    accentColor: '#FFFFFF',
    stadiumName: 'Dexcom Stadium, Galway',
    stadiumCapacity: 8129,
    reputation: 82,
    transferBudget: 650000,
    wageBudget: 102000,
    facilities: { training: 4, medical: 3, academy: 4, stadium: 3, analytics: 3 },
    boardConfidence: 76
  },

  // --- SCOTTISH & ITALIAN SHIELD (4) ---
  {
    id: 'glasgow',
    name: 'Glasgow Warriors',
    shortName: 'Glasgow',
    leagueId: 'URC',
    country: 'Scotland',
    primaryColor: '#000000',
    secondaryColor: '#00A3E0',
    accentColor: '#FFFFFF',
    stadiumName: 'Scotstoun Stadium, Glasgow',
    stadiumCapacity: 7351,
    reputation: 88,
    transferBudget: 850000,
    wageBudget: 125000,
    facilities: { training: 4, medical: 4, academy: 4, stadium: 3, analytics: 4 },
    boardConfidence: 81
  },
  {
    id: 'edinburgh',
    name: 'Edinburgh Rugby',
    shortName: 'Edinburgh',
    leagueId: 'URC',
    country: 'Scotland',
    primaryColor: '#002B49',
    secondaryColor: '#E65100',
    accentColor: '#FFFFFF',
    stadiumName: 'Hive Stadium, Edinburgh',
    stadiumCapacity: 7800,
    reputation: 84,
    transferBudget: 750000,
    wageBudget: 112000,
    facilities: { training: 4, medical: 4, academy: 4, stadium: 3, analytics: 3 },
    boardConfidence: 73
  },
  {
    id: 'benetton',
    name: 'Benetton Rugby',
    shortName: 'Benetton',
    leagueId: 'URC',
    country: 'Italy',
    primaryColor: '#008751',
    secondaryColor: '#FFFFFF',
    accentColor: '#000000',
    stadiumName: 'Stadio Comunale di Monigo, Treviso',
    stadiumCapacity: 6700,
    reputation: 83,
    transferBudget: 700000,
    wageBudget: 108000,
    facilities: { training: 4, medical: 4, academy: 3, stadium: 3, analytics: 3 },
    boardConfidence: 75
  },
  {
    id: 'zebre',
    name: 'Zebre Parma',
    shortName: 'Zebre',
    leagueId: 'URC',
    country: 'Italy',
    primaryColor: '#FFCC00',
    secondaryColor: '#000000',
    accentColor: '#0095C8',
    stadiumName: 'Stadio Sergio Lanfranchi, Parma',
    stadiumCapacity: 5000,
    reputation: 76,
    transferBudget: 500000,
    wageBudget: 85000,
    facilities: { training: 3, medical: 3, academy: 3, stadium: 2, analytics: 2 },
    boardConfidence: 72
  },

  // --- WELSH SHIELD (4) ---
  {
    id: 'ospreys',
    name: 'Ospreys Rugby',
    shortName: 'Ospreys',
    leagueId: 'URC',
    country: 'Wales',
    primaryColor: '#000000',
    secondaryColor: '#9CA3AF',
    accentColor: '#FFFFFF',
    stadiumName: 'Swansea.com Stadium, Swansea',
    stadiumCapacity: 21088,
    reputation: 83,
    transferBudget: 720000,
    wageBudget: 106000,
    facilities: { training: 4, medical: 4, academy: 4, stadium: 4, analytics: 3 },
    boardConfidence: 74
  },
  {
    id: 'cardiff',
    name: 'Cardiff Rugby',
    shortName: 'Cardiff',
    leagueId: 'URC',
    country: 'Wales',
    primaryColor: '#005596',
    secondaryColor: '#000000',
    accentColor: '#FFFFFF',
    stadiumName: 'Cardiff Arms Park, Cardiff',
    stadiumCapacity: 12125,
    reputation: 82,
    transferBudget: 700000,
    wageBudget: 104000,
    facilities: { training: 4, medical: 3, academy: 4, stadium: 3, analytics: 3 },
    boardConfidence: 73
  },
  {
    id: 'scarlets',
    name: 'Scarlets Rugby',
    shortName: 'Scarlets',
    leagueId: 'URC',
    country: 'Wales',
    primaryColor: '#C8102E',
    secondaryColor: '#FFFFFF',
    accentColor: '#000000',
    stadiumName: 'Parc y Scarlets, Llanelli',
    stadiumCapacity: 14870,
    reputation: 81,
    transferBudget: 680000,
    wageBudget: 100000,
    facilities: { training: 4, medical: 3, academy: 4, stadium: 3, analytics: 3 },
    boardConfidence: 72
  },
  {
    id: 'dragons',
    name: 'Dragons RFC',
    shortName: 'Dragons',
    leagueId: 'URC',
    country: 'Wales',
    primaryColor: '#1A1A1A',
    secondaryColor: '#FF6600',
    accentColor: '#005596',
    stadiumName: 'Rodney Parade, Newport',
    stadiumCapacity: 8700,
    reputation: 77,
    transferBudget: 550000,
    wageBudget: 88000,
    facilities: { training: 3, medical: 3, academy: 3, stadium: 3, analytics: 2 },
    boardConfidence: 70
  }
];

export const POSITIONS_ORDER: RugbyPosition[] = [
  'LH_PROP',          // 1
  'HOOKER',           // 2
  'TH_PROP',          // 3
  'LOCK_4',           // 4
  'LOCK_5',           // 5
  'BLINDSIDE_FLANKER',// 6
  'OPENSIDE_FLANKER', // 7
  'NUMBER_8',         // 8
  'SCRUM_HALF',       // 9
  'FLY_HALF',         // 10
  'LEFT_WING',        // 11
  'INSIDE_CENTRE',    // 12
  'OUTSIDE_CENTRE',   // 13
  'RIGHT_WING',       // 14
  'FULLBACK'          // 15
];

export function getPositionNumber(pos: RugbyPosition): number {
  return POSITIONS_ORDER.indexOf(pos) + 1;
}

export function getPositionName(pos: RugbyPosition): string {
  switch (pos) {
    case 'LH_PROP': return 'Loosehead Prop (1)';
    case 'HOOKER': return 'Hooker (2)';
    case 'TH_PROP': return 'Tighthead Prop (3)';
    case 'LOCK_4': return 'Lock / Second Row (4)';
    case 'LOCK_5': return 'Lock / Second Row (5)';
    case 'BLINDSIDE_FLANKER': return 'Blindside Flanker (6)';
    case 'OPENSIDE_FLANKER': return 'Openside Flanker (7)';
    case 'NUMBER_8': return 'Number 8 (8)';
    case 'SCRUM_HALF': return 'Scrum-Half (9)';
    case 'FLY_HALF': return 'Fly-Half (10)';
    case 'LEFT_WING': return 'Left Wing (11)';
    case 'INSIDE_CENTRE': return 'Inside Centre (12)';
    case 'OUTSIDE_CENTRE': return 'Outside Centre (13)';
    case 'RIGHT_WING': return 'Right Wing (14)';
    case 'FULLBACK': return 'Fullback (15)';
  }
}

export function getPositionShort(pos: RugbyPosition): string {
  switch (pos) {
    case 'LH_PROP': return 'LHP';
    case 'HOOKER': return 'HK';
    case 'TH_PROP': return 'THP';
    case 'LOCK_4': return 'L4';
    case 'LOCK_5': return 'L5';
    case 'BLINDSIDE_FLANKER': return 'BF';
    case 'OPENSIDE_FLANKER': return 'OF';
    case 'NUMBER_8': return 'N8';
    case 'SCRUM_HALF': return 'SH';
    case 'FLY_HALF': return 'FH';
    case 'LEFT_WING': return 'LW';
    case 'INSIDE_CENTRE': return 'IC';
    case 'OUTSIDE_CENTRE': return 'OC';
    case 'RIGHT_WING': return 'RW';
    case 'FULLBACK': return 'FB';
  }
}

export function calculatePlayerOverall(pos: RugbyPosition, attrs: PlayerAttributes): number {
  let score = 0;
  switch (pos) {
    case 'LH_PROP':
    case 'TH_PROP':
      score = attrs.scrummaging * 0.35 + attrs.strength * 0.25 + attrs.tackling * 0.15 + attrs.carrying * 0.15 + attrs.fitness * 0.10;
      break;
    case 'HOOKER':
      score = attrs.hooking * 0.30 + attrs.scrummaging * 0.20 + attrs.tackling * 0.15 + attrs.breakdown * 0.15 + attrs.carrying * 0.10 + attrs.fitness * 0.10;
      break;
    case 'LOCK_4':
    case 'LOCK_5':
      score = attrs.lineout * 0.30 + attrs.strength * 0.20 + attrs.scrummaging * 0.20 + attrs.tackling * 0.15 + attrs.workRate * 0.15;
      break;
    case 'BLINDSIDE_FLANKER':
    case 'OPENSIDE_FLANKER':
      score = attrs.breakdown * 0.25 + attrs.tackling * 0.25 + attrs.workRate * 0.20 + attrs.carrying * 0.15 + attrs.fitness * 0.15;
      break;
    case 'NUMBER_8':
      score = attrs.carrying * 0.25 + attrs.breakdown * 0.20 + attrs.strength * 0.20 + attrs.offloading * 0.15 + attrs.tackling * 0.10 + attrs.tacticalAwareness * 0.10;
      break;
    case 'SCRUM_HALF':
      score = attrs.passing * 0.30 + attrs.speed * 0.20 + attrs.tacticalAwareness * 0.20 + attrs.kicking * 0.15 + attrs.tackling * 0.15;
      break;
    case 'FLY_HALF':
      score = attrs.tacticalAwareness * 0.25 + attrs.kicking * 0.25 + attrs.passing * 0.20 + attrs.goalKicking * 0.15 + attrs.speed * 0.15;
      break;
    case 'INSIDE_CENTRE':
    case 'OUTSIDE_CENTRE':
      score = attrs.tackling * 0.20 + attrs.carrying * 0.20 + attrs.passing * 0.20 + attrs.speed * 0.20 + attrs.tacticalAwareness * 0.20;
      break;
    case 'LEFT_WING':
    case 'RIGHT_WING':
      score = attrs.speed * 0.35 + attrs.carrying * 0.20 + attrs.tacticalAwareness * 0.15 + attrs.tackling * 0.15 + attrs.offloading * 0.15;
      break;
    case 'FULLBACK':
      score = attrs.kicking * 0.25 + attrs.tacticalAwareness * 0.25 + attrs.speed * 0.20 + attrs.tackling * 0.15 + attrs.goalKicking * 0.15;
      break;
  }
  return Math.min(99, Math.max(50, Math.round(score)));
}

// Generate realistic squad for any club
export function generateClubSquad(club: Club): Player[] {
  // Use official verified URC player database when available (1,091 real players)
  const officialPlayers = urcRegistry.searchPlayers({ clubId: club.id, season: '2025-26' });
  if (officialPlayers && officialPlayers.length >= 25) {
    return JSON.parse(JSON.stringify(officialPlayers));
  }

  const players: Player[] = [];
  const baseRating = Math.round(club.reputation * 0.95);

  const starDefinitions: Record<string, Partial<Player>[]> = {
    sharks_urc: [
      { name: 'Eben Etzebeth', primaryPosition: 'LOCK_4', secondaryPositions: ['LOCK_5'], nationality: 'South Africa', age: 32, potential: 97 },
      { name: 'Lukhanyo Am', primaryPosition: 'OUTSIDE_CENTRE', secondaryPositions: ['INSIDE_CENTRE', 'RIGHT_WING'], nationality: 'South Africa', age: 30, potential: 94 },
      { name: 'Makazole Mapimpi', primaryPosition: 'LEFT_WING', secondaryPositions: ['RIGHT_WING'], nationality: 'South Africa', age: 33, potential: 91 },
      { name: 'Ox Nche', primaryPosition: 'LH_PROP', secondaryPositions: ['TH_PROP'], nationality: 'South Africa', age: 29, potential: 95 },
      { name: 'Bongi Mbonambi', primaryPosition: 'HOOKER', secondaryPositions: [], nationality: 'South Africa', age: 33, potential: 92 },
      { name: 'Grant Williams', primaryPosition: 'SCRUM_HALF', secondaryPositions: ['RIGHT_WING'], nationality: 'South Africa', age: 27, potential: 93 },
      {
        name: 'Andre Esterhuizen',
        primaryPosition: 'INSIDE_CENTRE',
        secondaryPositions: ['OUTSIDE_CENTRE'],
        hybridLevel: 'LEVEL_1_LIMITED',
        approvedCrossUnitPositions: ['BLINDSIDE_FLANKER'],
        nationality: 'South Africa',
        age: 30,
        potential: 93
      },
      { name: 'Aphelele Fassi', primaryPosition: 'FULLBACK', secondaryPositions: ['LEFT_WING'], nationality: 'South Africa', age: 26, potential: 93 },
      { name: 'Jordan Hendrikse', primaryPosition: 'FLY_HALF', secondaryPositions: ['FULLBACK', 'INSIDE_CENTRE'], nationality: 'South Africa', age: 23, potential: 89 },
      { name: 'Vincent Koch', primaryPosition: 'TH_PROP', secondaryPositions: ['LH_PROP'], nationality: 'South Africa', age: 34, potential: 92 },
      { name: 'Phepsi Buthelezi', primaryPosition: 'NUMBER_8', secondaryPositions: ['BLINDSIDE_FLANKER'], nationality: 'South Africa', age: 25, potential: 88 },
      { name: 'Gianni Lombard', primaryPosition: 'FLY_HALF', secondaryPositions: ['FULLBACK'], nationality: 'South Africa', age: 26, potential: 87 }
    ],
    stormers: [
      { name: 'Damian Willemse', primaryPosition: 'FULLBACK', secondaryPositions: ['FLY_HALF', 'INSIDE_CENTRE'], nationality: 'South Africa', age: 26, potential: 95 },
      { name: 'Frans Malherbe', primaryPosition: 'TH_PROP', secondaryPositions: ['LH_PROP'], nationality: 'South Africa', age: 33, potential: 95 },
      { name: 'Manie Libbok', primaryPosition: 'FLY_HALF', secondaryPositions: ['FULLBACK'], nationality: 'South Africa', age: 27, potential: 91 },
      {
        name: 'Deon Fourie',
        primaryPosition: 'OPENSIDE_FLANKER',
        secondaryPositions: ['HOOKER', 'BLINDSIDE_FLANKER'],
        hybridLevel: 'LEVEL_2_CAPABLE',
        approvedCrossUnitPositions: ['HOOKER'],
        nationality: 'South Africa',
        age: 37,
        potential: 89
      },
      { name: 'Evan Roos', primaryPosition: 'NUMBER_8', secondaryPositions: ['OPENSIDE_FLANKER'], nationality: 'South Africa', age: 24, potential: 92 },
      { name: 'Salmaan Moerat', primaryPosition: 'LOCK_5', secondaryPositions: ['LOCK_4'], nationality: 'South Africa', age: 26, potential: 89 },
      { name: 'Herschel Jantjies', primaryPosition: 'SCRUM_HALF', secondaryPositions: [], nationality: 'South Africa', age: 28, potential: 87 },
      { name: 'Dan du Plessis', primaryPosition: 'INSIDE_CENTRE', secondaryPositions: ['OUTSIDE_CENTRE'], nationality: 'South Africa', age: 29, potential: 88 },
      { name: 'Warrick Gelant', primaryPosition: 'RIGHT_WING', secondaryPositions: ['FULLBACK'], nationality: 'South Africa', age: 29, potential: 88 }
    ],
    bulls: [
      { name: 'Handre Pollard', primaryPosition: 'FLY_HALF', nationality: 'South Africa', age: 30, potential: 95 },
      { name: 'Kurt-Lee Arendse', primaryPosition: 'RIGHT_WING', nationality: 'South Africa', age: 28, potential: 94 },
      { name: 'Canan Moodie', primaryPosition: 'OUTSIDE_CENTRE', nationality: 'South Africa', age: 21, potential: 94 },
      { name: 'Elrigh Louw', primaryPosition: 'NUMBER_8', nationality: 'South Africa', age: 24, potential: 92 },
      { name: 'Gerhard Steenekamp', primaryPosition: 'LH_PROP', nationality: 'South Africa', age: 27, potential: 90 },
      { name: 'Johan Grobbelaar', primaryPosition: 'HOOKER', nationality: 'South Africa', age: 26, potential: 90 },
      { name: 'Marco van Staden', primaryPosition: 'BLINDSIDE_FLANKER', nationality: 'South Africa', age: 28, potential: 91 },
      { name: 'Wilco Louw', primaryPosition: 'TH_PROP', nationality: 'South Africa', age: 30, potential: 91 },
      { name: 'Cameron Hanekom', primaryPosition: 'OPENSIDE_FLANKER', nationality: 'South Africa', age: 22, potential: 91 },
      { name: 'Johan Goosen', primaryPosition: 'FULLBACK', nationality: 'South Africa', age: 32, potential: 88 }
    ],
    lions: [
      { name: 'Francke Horn', primaryPosition: 'NUMBER_8', nationality: 'South Africa', age: 25, potential: 88 },
      { name: 'Sanele Nohamba', primaryPosition: 'SCRUM_HALF', nationality: 'South Africa', age: 25, potential: 89 },
      { name: 'Quan Horn', primaryPosition: 'FULLBACK', nationality: 'South Africa', age: 23, potential: 87 },
      { name: 'Henco van Wyk', primaryPosition: 'OUTSIDE_CENTRE', nationality: 'South Africa', age: 23, potential: 88 },
      { name: 'PJ Botha', primaryPosition: 'HOOKER', nationality: 'South Africa', age: 26, potential: 86 },
      { name: 'Asenathi Ntlabakanye', primaryPosition: 'TH_PROP', nationality: 'South Africa', age: 25, potential: 87 }
    ],
    leinster: [
      { name: 'Caelan Doris', primaryPosition: 'NUMBER_8', nationality: 'Ireland', age: 26, potential: 96 },
      { name: 'Dan Sheehan', primaryPosition: 'HOOKER', nationality: 'Ireland', age: 25, potential: 96 },
      { name: 'Andrew Porter', primaryPosition: 'LH_PROP', nationality: 'Ireland', age: 28, potential: 94 },
      { name: 'James Ryan', primaryPosition: 'LOCK_4', nationality: 'Ireland', age: 28, potential: 92 },
      { name: 'Josh van der Flier', primaryPosition: 'OPENSIDE_FLANKER', nationality: 'Ireland', age: 31, potential: 94 },
      { name: 'Jamison Gibson-Park', primaryPosition: 'SCRUM_HALF', nationality: 'Ireland', age: 32, potential: 93 },
      { name: 'Garry Ringrose', primaryPosition: 'OUTSIDE_CENTRE', nationality: 'Ireland', age: 29, potential: 93 },
      { name: 'Hugo Keenan', primaryPosition: 'FULLBACK', nationality: 'Ireland', age: 28, potential: 94 },
      { name: 'James Lowe', primaryPosition: 'LEFT_WING', nationality: 'Ireland', age: 32, potential: 93 },
      { name: 'Tadhg Furlong', primaryPosition: 'TH_PROP', nationality: 'Ireland', age: 31, potential: 94 },
      { name: 'Sam Prendergast', primaryPosition: 'FLY_HALF', nationality: 'Ireland', age: 21, potential: 92 }
    ],
    munster: [
      { name: 'Tadhg Beirne', primaryPosition: 'LOCK_4', nationality: 'Ireland', age: 32, potential: 94 },
      { name: 'Jack Crowley', primaryPosition: 'FLY_HALF', nationality: 'Ireland', age: 24, potential: 93 },
      { name: 'Peter O’Mahony', primaryPosition: 'BLINDSIDE_FLANKER', nationality: 'Ireland', age: 34, potential: 90 },
      { name: 'Craig Casey', primaryPosition: 'SCRUM_HALF', nationality: 'Ireland', age: 25, potential: 90 },
      { name: 'Gavin Coombes', primaryPosition: 'NUMBER_8', nationality: 'Ireland', age: 26, potential: 90 },
      { name: 'Calvin Nash', primaryPosition: 'RIGHT_WING', nationality: 'Ireland', age: 27, potential: 89 },
      { name: 'Mike Haley', primaryPosition: 'FULLBACK', nationality: 'Ireland', age: 30, potential: 87 }
    ],
    ulster: [
      { name: 'Iain Henderson', primaryPosition: 'LOCK_4', nationality: 'Ireland', age: 32, potential: 90 },
      { name: 'Stuart McCloskey', primaryPosition: 'INSIDE_CENTRE', nationality: 'Ireland', age: 32, potential: 90 },
      { name: 'Jacob Stockdale', primaryPosition: 'LEFT_WING', nationality: 'Ireland', age: 28, potential: 89 },
      { name: 'John Cooney', primaryPosition: 'SCRUM_HALF', nationality: 'Ireland', age: 34, potential: 88 },
      { name: 'Nick Timoney', primaryPosition: 'NUMBER_8', nationality: 'Ireland', age: 28, potential: 89 },
      { name: 'Tom Stewart', primaryPosition: 'HOOKER', nationality: 'Ireland', age: 23, potential: 88 }
    ],
    connacht: [
      { name: 'Bundee Aki', primaryPosition: 'INSIDE_CENTRE', nationality: 'Ireland', age: 34, potential: 95 },
      { name: 'Mack Hansen', primaryPosition: 'RIGHT_WING', nationality: 'Ireland', age: 26, potential: 93 },
      { name: 'Finlay Bealham', primaryPosition: 'TH_PROP', nationality: 'Ireland', age: 32, potential: 89 },
      { name: 'Caolin Blade', primaryPosition: 'SCRUM_HALF', nationality: 'Ireland', age: 30, potential: 87 },
      { name: 'Cian Prendergast', primaryPosition: 'BLINDSIDE_FLANKER', nationality: 'Ireland', age: 24, potential: 88 }
    ],
    glasgow: [
      { name: 'Sione Tuipulotu', primaryPosition: 'INSIDE_CENTRE', nationality: 'Scotland', age: 27, potential: 93 },
      { name: 'Huw Jones', primaryPosition: 'OUTSIDE_CENTRE', nationality: 'Scotland', age: 30, potential: 92 },
      { name: 'Zander Fagerson', primaryPosition: 'TH_PROP', nationality: 'Scotland', age: 28, potential: 92 },
      { name: 'Matt Fagerson', primaryPosition: 'NUMBER_8', nationality: 'Scotland', age: 26, potential: 90 },
      { name: 'Rory Darge', primaryPosition: 'OPENSIDE_FLANKER', nationality: 'Scotland', age: 24, potential: 91 },
      { name: 'George Horne', primaryPosition: 'SCRUM_HALF', nationality: 'Scotland', age: 29, potential: 89 },
      { name: 'Kyle Steyn', primaryPosition: 'LEFT_WING', nationality: 'Scotland', age: 30, potential: 89 },
      { name: 'Scott Cummings', primaryPosition: 'LOCK_5', nationality: 'Scotland', age: 27, potential: 89 }
    ],
    edinburgh: [
      { name: 'Duhan van der Merwe', primaryPosition: 'LEFT_WING', nationality: 'Scotland', age: 29, potential: 94 },
      { name: 'Darcy Graham', primaryPosition: 'RIGHT_WING', nationality: 'Scotland', age: 27, potential: 92 },
      { name: 'Pierre Schoeman', primaryPosition: 'LH_PROP', nationality: 'Scotland', age: 30, potential: 92 },
      { name: 'Hamish Watson', primaryPosition: 'OPENSIDE_FLANKER', nationality: 'Scotland', age: 32, potential: 89 },
      { name: 'Ben Healy', primaryPosition: 'FLY_HALF', nationality: 'Scotland', age: 25, potential: 88 },
      { name: 'Grant Gilchrist', primaryPosition: 'LOCK_4', nationality: 'Scotland', age: 34, potential: 87 },
      { name: 'Ali Price', primaryPosition: 'SCRUM_HALF', nationality: 'Scotland', age: 31, potential: 88 }
    ],
    benetton: [
      { name: 'Michele Lamaro', primaryPosition: 'OPENSIDE_FLANKER', nationality: 'Italy', age: 26, potential: 91 },
      { name: 'Tommaso Menoncello', primaryPosition: 'OUTSIDE_CENTRE', nationality: 'Italy', age: 22, potential: 94 },
      { name: 'Ignacio Brex', primaryPosition: 'INSIDE_CENTRE', nationality: 'Italy', age: 32, potential: 89 },
      { name: 'Sebastian Negri', primaryPosition: 'BLINDSIDE_FLANKER', nationality: 'Italy', age: 30, potential: 88 },
      { name: 'Rhyno Smith', primaryPosition: 'FULLBACK', nationality: 'South Africa', age: 31, potential: 88 },
      { name: 'Federico Ruzza', primaryPosition: 'LOCK_5', nationality: 'Italy', age: 30, potential: 89 }
    ],
    zebre: [
      { name: 'Alessandro Fusco', primaryPosition: 'SCRUM_HALF', nationality: 'Italy', age: 24, potential: 85 },
      { name: 'Simone Gesi', primaryPosition: 'LEFT_WING', nationality: 'Italy', age: 23, potential: 86 },
      { name: 'Luca Morisi', primaryPosition: 'INSIDE_CENTRE', nationality: 'Italy', age: 33, potential: 84 },
      { name: 'Danilo Fischetti', primaryPosition: 'LH_PROP', nationality: 'Italy', age: 26, potential: 88 },
      { name: 'Andrea Zambonin', primaryPosition: 'LOCK_4', nationality: 'Italy', age: 24, potential: 86 }
    ],
    ospreys: [
      { name: 'Jac Morgan', primaryPosition: 'OPENSIDE_FLANKER', nationality: 'Wales', age: 24, potential: 93 },
      { name: 'Dewi Lake', primaryPosition: 'HOOKER', nationality: 'Wales', age: 25, potential: 91 },
      { name: 'Justin Tipuric', primaryPosition: 'BLINDSIDE_FLANKER', nationality: 'Wales', age: 34, potential: 88 },
      { name: 'Keelan Giles', primaryPosition: 'LEFT_WING', nationality: 'Wales', age: 26, potential: 87 },
      { name: 'Owen Watkin', primaryPosition: 'INSIDE_CENTRE', nationality: 'Wales', age: 27, potential: 87 },
      { name: 'Gareth Thomas', primaryPosition: 'LH_PROP', nationality: 'Wales', age: 30, potential: 87 }
    ],
    cardiff: [
      { name: 'Taulupe Faletau', primaryPosition: 'NUMBER_8', nationality: 'Wales', age: 33, potential: 92 },
      { name: 'Josh Adams', primaryPosition: 'RIGHT_WING', nationality: 'Wales', age: 29, potential: 90 },
      { name: 'Mason Grady', primaryPosition: 'OUTSIDE_CENTRE', nationality: 'Wales', age: 22, potential: 89 },
      { name: 'Ellis Bevan', primaryPosition: 'SCRUM_HALF', nationality: 'Wales', age: 24, potential: 87 },
      { name: 'Corey Domachowski', primaryPosition: 'LH_PROP', nationality: 'Wales', age: 27, potential: 87 }
    ],
    scarlets: [
      { name: 'Vaea Fifita', primaryPosition: 'LOCK_4', nationality: 'New Zealand', age: 32, potential: 89 },
      { name: 'Gareth Davies', primaryPosition: 'SCRUM_HALF', nationality: 'Wales', age: 33, potential: 89 },
      { name: 'Johnny Williams', primaryPosition: 'INSIDE_CENTRE', nationality: 'Wales', age: 27, potential: 87 },
      { name: 'Ryan Conbeer', primaryPosition: 'LEFT_WING', nationality: 'Wales', age: 25, potential: 86 },
      { name: 'Sam Lousi', primaryPosition: 'LOCK_5', nationality: 'New Zealand', age: 34, potential: 87 }
    ],
    dragons: [
      { name: 'Aaron Wainwright', primaryPosition: 'NUMBER_8', nationality: 'Wales', age: 26, potential: 91 },
      { name: 'Taine Basham', primaryPosition: 'OPENSIDE_FLANKER', nationality: 'Wales', age: 24, potential: 88 },
      { name: 'Rio Dyer', primaryPosition: 'RIGHT_WING', nationality: 'Wales', age: 24, potential: 89 },
      { name: 'Rhodri Williams', primaryPosition: 'SCRUM_HALF', nationality: 'Wales', age: 31, potential: 86 },
      { name: 'Elliot Dee', primaryPosition: 'HOOKER', nationality: 'Wales', age: 30, potential: 87 }
    ]
  };

  const genericFirstNamesByCountry: Record<string, string[]> = {
    'South Africa': ['Ruan', 'Cobus', 'Duan', 'Tiaan', 'Kobus', 'Sikhumbuzo', 'Sbu', 'Wandisile', 'Morné', 'Corne', 'Francois', 'Jaco', 'Luan', 'Sazi', 'Willem', 'Boeta'],
    'Ireland': ['Conor', 'Jack', 'Ronan', 'Finlay', 'Craig', 'Cian', 'Robbie', 'Jordan', 'Caelan', 'Peter', 'Ryan', 'Tommy', 'Ross', 'Dan', 'Sam', 'Jimmy'],
    'Scotland': ['Duhan', 'Zander', 'Rory', 'Matt', 'Huw', 'Ali', 'Ben', 'Jamie', 'Pierre', 'George', 'Kyle', 'Darcy'],
    'Wales': ['Ellis', 'Dewi', 'Jac', 'Mason', 'Keelan', 'Ioan', 'Gareth', 'Dillon', 'Taine', 'Rhys', 'Sam', 'Callum'],
    'Italy': ['Paolo', 'Ange', 'Tommaso', 'Michele', 'Danilo', 'Sebastian', 'Ignacio', 'Giacomo', 'Lorenzo', 'Federico']
  };

  const genericLastNamesByCountry: Record<string, string[]> = {
    'South Africa': ['van der Merwe', 'du Plessis', 'Botha', 'Coetzee', 'Pretorius', 'Venter', 'Steyn', 'Schoeman', 'Kruger', 'Fourie', 'Potgieter', 'le Roux', 'Erasmus', 'Bester'],
    'Ireland': ['O’Mahony', 'Murray', 'Henshaw', 'Aki', 'Beirne', 'Henderson', 'Larmour', 'Kelleher', 'Ringrose', 'Baird', 'Prendergast', 'Coombes', 'Casey'],
    'Scotland': ['van der Merwe', 'Russell', 'Tuipulotu', 'Jones', 'Fagerson', 'Ritchie', 'Darge', 'Dobie', 'White', 'Kinghorn'],
    'Wales': ['Williams', 'Davies', 'Jones', 'Evans', 'Thomas', 'Roberts', 'Lewis', 'Hughes', 'Morgan', 'Griffiths'],
    'Italy': ['Garbisi', 'Capuozzo', 'Menoncello', 'Brex', 'Negri', 'Lamaro', 'Ferrari', 'Lucchesi', 'Ruzza', 'Fischetti']
  };

  const clubStarList = starDefinitions[club.id] || [];

  // Every club gets 30 players: 2 for each of 15 positions
  let playerIdx = 0;
  for (let pos of POSITIONS_ORDER) {
    for (let slot = 0; slot < 2; slot++) {
      playerIdx++;
      const id = `${club.id}_p${playerIdx}`;
      const star = clubStarList.find(s => s.primaryPosition === pos && !players.some(p => p.name === s.name));

      let name = '';
      let nat = club.country;
      let age = 21 + Math.floor(Math.random() * 12);
      let pot = Math.min(99, baseRating + Math.floor(Math.random() * 12) - 4);

      if (star && slot === 0) {
        name = star.name!;
        nat = star.nationality || club.country;
        age = star.age || 26;
        pot = star.potential || 90;
      } else {
        const firstNames = genericFirstNamesByCountry[club.country] || genericFirstNamesByCountry['South Africa'];
        const lastNames = genericLastNamesByCountry[club.country] || genericLastNamesByCountry['South Africa'];
        name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      }

      let height = 184;
      let weight = 95;
      if (pos.includes('PROP') || pos.includes('HOOKER')) {
        height = 183 + Math.floor(Math.random() * 8);
        weight = 112 + Math.floor(Math.random() * 15);
      } else if (pos.includes('LOCK')) {
        height = 198 + Math.floor(Math.random() * 8);
        weight = 115 + Math.floor(Math.random() * 10);
      } else if (pos.includes('FLANKER') || pos.includes('NUMBER_8')) {
        height = 190 + Math.floor(Math.random() * 6);
        weight = 105 + Math.floor(Math.random() * 10);
      } else if (pos.includes('SCRUM_HALF')) {
        height = 172 + Math.floor(Math.random() * 8);
        weight = 80 + Math.floor(Math.random() * 8);
      } else if (pos.includes('FLY_HALF') || pos.includes('CENTRE')) {
        height = 183 + Math.floor(Math.random() * 8);
        weight = 90 + Math.floor(Math.random() * 10);
      } else {
        height = 182 + Math.floor(Math.random() * 10);
        weight = 87 + Math.floor(Math.random() * 9);
      }

      const intlMatch = INTERNATIONAL_RATINGS[name.toLowerCase().trim()];
      const effectiveBaseRating = intlMatch?.overall || (star ? Math.max(baseRating, (star.potential || 90) - 2) : baseRating);
      if (intlMatch) {
        pot = Math.max(pot, intlMatch.potential);
      }

      const variance = (factor: number = 1.0) => Math.min(99, Math.max(45, Math.round(effectiveBaseRating * factor + (Math.random() * 8 - 4))));

      const attributes: PlayerAttributes = {
        scrummaging: pos.includes('PROP') ? variance(1.08) : pos.includes('LOCK') || pos.includes('HOOKER') ? variance(0.95) : variance(0.55),
        hooking: pos === 'HOOKER' ? variance(1.10) : variance(0.50),
        lineout: pos.includes('LOCK') ? variance(1.10) : pos.includes('FLANKER') || pos.includes('NUMBER_8') ? variance(0.92) : variance(0.50),
        breakdown: pos.includes('FLANKER') || pos.includes('NUMBER_8') || pos.includes('HOOKER') ? variance(1.08) : variance(0.80),
        tackling: variance(0.95),
        carrying: pos.includes('NUMBER_8') || pos.includes('PROP') || pos.includes('CENTRE') ? variance(1.06) : variance(0.85),
        offloading: variance(0.88),
        passing: pos === 'SCRUM_HALF' ? variance(1.12) : pos === 'FLY_HALF' || pos.includes('CENTRE') ? variance(1.02) : variance(0.70),
        kicking: pos === 'FLY_HALF' || pos === 'FULLBACK' || pos === 'SCRUM_HALF' ? variance(1.10) : variance(0.60),
        goalKicking: pos === 'FLY_HALF' ? variance(1.08) : pos === 'FULLBACK' ? variance(0.90) : variance(0.45),
        speed: pos.includes('WING') || pos === 'FULLBACK' || pos === 'SCRUM_HALF' ? variance(1.12) : pos.includes('PROP') ? variance(0.65) : variance(0.82),
        strength: pos.includes('PROP') || pos.includes('LOCK') || pos.includes('NUMBER_8') ? variance(1.10) : variance(0.80),
        fitness: variance(0.95),
        tacticalAwareness: pos === 'FLY_HALF' || pos === 'SCRUM_HALF' || pos === 'NUMBER_8' ? variance(1.06) : variance(0.88),
        workRate: variance(0.94),
        consistency: variance(0.92)
      };

      let overall = calculatePlayerOverall(pos, attributes);
      if (intlMatch) {
        overall = Math.max(overall, intlMatch.overall);
      }
      const marketValue = Math.round(Math.pow(overall / 10, 3.8) * 85);
      const weeklyWage = Math.round((marketValue / 100) * 1.6);

      const defaultSecondaries: Partial<Record<RugbyPosition, RugbyPosition[]>> = {
        LH_PROP: ['TH_PROP'],
        TH_PROP: ['LH_PROP'],
        HOOKER: [],
        LOCK_4: ['LOCK_5'],
        LOCK_5: ['LOCK_4'],
        BLINDSIDE_FLANKER: ['NUMBER_8', 'OPENSIDE_FLANKER'],
        OPENSIDE_FLANKER: ['BLINDSIDE_FLANKER', 'NUMBER_8'],
        NUMBER_8: ['BLINDSIDE_FLANKER'],
        SCRUM_HALF: [],
        FLY_HALF: ['INSIDE_CENTRE'],
        LEFT_WING: ['RIGHT_WING', 'FULLBACK'],
        RIGHT_WING: ['LEFT_WING', 'FULLBACK'],
        INSIDE_CENTRE: ['OUTSIDE_CENTRE'],
        OUTSIDE_CENTRE: ['INSIDE_CENTRE', 'RIGHT_WING'],
        FULLBACK: ['LEFT_WING', 'RIGHT_WING']
      };

      players.push({
        id,
        name,
        nationality: nat,
        age,
        clubId: club.id,
        primaryPosition: pos,
        secondaryPositions: star?.secondaryPositions || defaultSecondaries[pos] || [],
        hybridLevel: star?.hybridLevel || 'NONE',
        approvedCrossUnitPositions: star?.approvedCrossUnitPositions || [],
        heightCm: height,
        weightKg: weight,
        attributes,
        potential: Math.max(overall, pot),
        overall,
        marketValue,
        weeklyWage,
        contractYearsLeft: 1 + Math.floor(Math.random() * 3),
        squadRole: slot === 0 ? 'First XV' : 'Squad Rotation',
        fitness: 90 + Math.floor(Math.random() * 10),
        fatigue: Math.floor(Math.random() * 15),
        morale: 80 + Math.floor(Math.random() * 15),
        form: 7 + Math.floor(Math.random() * 3),
        injury: null,
        stats: {
          matchesPlayed: 0,
          tries: 0,
          conversions: 0,
          penalties: 0,
          dropGoals: 0,
          points: 0,
          tacklesMade: 0,
          tacklesMissed: 0,
          turnoversWon: 0,
          metresCarried: 0,
          yellowCards: 0,
          redCards: 0,
          avgRating: 7.2
        }
      });
    }
  }

  return players;
}

// Generate round-robin fixtures for a competition (18 rounds for URC)
export function generateFixturesForLeague(clubs: Club[], leagueId: LeagueId): { fixtures: import('../types/rugby').Fixture[]; table: import('../types/rugby').LeagueTableRow[] } {
  const leagueClubs = clubs.filter(c => c.leagueId === leagueId);
  const fixtures: import('../types/rugby').Fixture[] = [];
  const n = leagueClubs.length;

  if (n < 2) return { fixtures: [], table: [] };

  const totalRounds = 18; // URC regular season
  let fixtureIdCounter = 1;

  for (let round = 1; round <= totalRounds; round++) {
    for (let i = 0; i < n / 2; i++) {
      const homeIdx = (round + i) % (n - 1);
      let awayIdx = (n - 1 - i + round) % (n - 1);
      if (i === 0) awayIdx = n - 1;

      const homeClub = round % 2 === 0 ? leagueClubs[homeIdx] : leagueClubs[awayIdx];
      const awayClub = round % 2 === 0 ? leagueClubs[awayIdx] : leagueClubs[homeIdx];

      if (homeClub && awayClub && homeClub.id !== awayClub.id) {
        fixtures.push({
          id: `fix_${leagueId}_r${round}_${fixtureIdCounter++}`,
          round,
          leagueId,
          homeClubId: homeClub.id,
          awayClubId: awayClub.id,
          played: false
        });
      }
    }
  }

  const table: import('../types/rugby').LeagueTableRow[] = leagueClubs.map(c => ({
    clubId: c.id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointsDiff: 0,
    tryBonusPoints: 0,
    losingBonusPoints: 0,
    points: 0
  }));

  return { fixtures, table };
}
