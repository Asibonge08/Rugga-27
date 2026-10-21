// src/types/types.ts
// Master Data Models & REAL_PLAYER_DATABASE for Rugga 27

import { RugbyPosition, MoraleTier, Club } from './rugby';

export interface PlayerAttributes {
  speed: number;
  strength: number;
  stamina: number;
  passing: number;
  tackling: number;
  kicking: number;
  handling: number;
  gameAwareness: number;
  rucking: number;
  lineout: number;
  scrummaging: number;
  defense: number;
  discipline: number;
  fitness: number;
}

export interface PlayerStats {
  matchesPlayed: number;
  tries: number;
  conversions: number;
  penalties: number;
  dropGoals: number;
  points: number;
  tacklesMade: number;
  tacklesMissed: number;
  turnoversWon: number;
  metresCarried: number;
  yellowCards: number;
  redCards: number;
  avgRating: number;
}

export interface PlayerModel {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  primaryPosition: RugbyPosition;
  secondaryPositions: RugbyPosition[];
  clubId: string;
  nationality: string;
  age: number;
  heightCm: number;
  weightKg: number;
  overall: number;
  potential: number;
  attributes: PlayerAttributes;
  stats: PlayerStats;
  morale: number;              // 0 to 100
  moraleTier: MoraleTier;
  confidenceModifier: number;  // -5 to +3 OVR
  fatigue: number;             // 0 to 100
  fitness: number;             // 0 to 100
  consecutiveMatchesWithoutRest: number;
  isRestedThisWeek?: boolean;
  marketValue: number;
  weeklyWage: number;
  contractYears: number;
  isInternational?: boolean;
  isStarPlayer?: boolean;
  isAcademyGraduate?: boolean;
  injury?: {
    type: string;
    weeksRemaining: number;
    severity: 'MINOR' | 'MODERATE' | 'SEVERE';
  } | null;
}

export interface RealPlayerStarProfile {
  name: string;
  clubId: string;
  nationality: string;
  age: number;
  primaryPosition: RugbyPosition;
  secondaryPositions: RugbyPosition[];
  overall: number;
  potential: number;
  lore: string;
}

/**
 * Hardcoded real-life Springbok & Junior Springbok stars with protected elite ratings
 */
export const REAL_PLAYER_DATABASE: Record<string, RealPlayerStarProfile> = {
  'ox nche': {
    name: 'Ox Nché',
    clubId: 'sharks_urc',
    nationality: 'South Africa',
    age: 29,
    primaryPosition: 'LH_PROP',
    secondaryPositions: ['TH_PROP'],
    overall: 93,
    potential: 95,
    lore: 'World-class loosehead prop renowned for scrum destruction and explosive work around the park.'
  },
  'sacha feinberg-mngomezulu': {
    name: 'Sacha Feinberg-Mngomezulu',
    clubId: 'stormers',
    nationality: 'South Africa',
    age: 22,
    primaryPosition: 'FLY_HALF',
    secondaryPositions: ['INSIDE_CENTRE', 'FULLBACK'],
    overall: 90,
    potential: 97,
    lore: 'Generational Springbok playmaker boasting pinpoint touch kicking, devastating acceleration, and visionary distribution.'
  },
  'ethan hooker': {
    name: 'Ethan Hooker',
    clubId: 'sharks_urc',
    nationality: 'South Africa',
    age: 21,
    primaryPosition: 'OUTSIDE_CENTRE',
    secondaryPositions: ['INSIDE_CENTRE', 'LEFT_WING'],
    overall: 88,
    potential: 95,
    lore: 'Lethal Junior Springbok standout with electric pace and elite defensive read in the midfield channel.'
  },
  'jurenzo julius': {
    name: 'Jurenzo Julius',
    clubId: 'sharks_urc',
    nationality: 'South Africa',
    age: 20,
    primaryPosition: 'INSIDE_CENTRE',
    secondaryPositions: ['OUTSIDE_CENTRE', 'LEFT_WING'],
    overall: 87,
    potential: 94,
    lore: 'Dynamic Junior Springbok sensation combining explosive line breaks with thunderous tackle impact.'
  },
  'nick hatton': {
    name: 'Nick Hatton',
    clubId: 'sharks_urc',
    nationality: 'South Africa',
    age: 21,
    primaryPosition: 'NUMBER_8',
    secondaryPositions: ['BLINDSIDE_FLANKER', 'OPENSIDE_FLANKER'],
    overall: 86,
    potential: 93,
    lore: 'Top Junior Springbok loose forward renowned for relentless work-rate, aerial supremacy, and breakdown turnovers.'
  }
};

/**
 * Names strictly excluded from random generation pools
 */
export const PROTECTED_STAR_NAMES = new Set([
  'ox', 'ox nche', 'ox nché',
  'sacha', 'sacha feinberg-mngomezulu',
  'bongi', 'bongi mbonambi',
  'kwagga', 'kwagga smith',
  'eben', 'eben etzebeth',
  'ethan hooker',
  'jurenzo julius',
  'nick hatton',
  'cheslin', 'cheslin kolbe',
  'handre', 'handré pollard',
  'siya', 'siya kolisi',
  'fassi', 'aphelele fassi',
  'lukhanyo am'
]);
