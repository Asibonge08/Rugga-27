// src/calculations.ts
// Deterministic Rating, Positional Engine & Authentic Name Generator for Rugga 27

import { RugbyPosition, Player } from './types/rugby';
import { PlayerAttributes } from './types/types';
import { PROTECTED_STAR_NAMES } from './types/types';

export const FIRST_NAMES_BY_COUNTRY: Record<string, string[]> = {
  'South Africa': [
    'Ruan', 'Cobus', 'Duan', 'Tiaan', 'Kobus', 'Morné', 'Corné', 'Francois', 'Jaco', 'Luan', 'Willem', 'Boeta', 'Eben', 'Handré', 'Pieter', 'Steven', 'Jesse', 'Grant', 'Marco', 'Franco', 'Evan', 'Ruben', 'Manie', 'Lukhanyo', 'Ethan', 'Nick', 'Brenden', 'Jordan', 'Devon', 'Nolan', 'Marnus', 'Stravino', 'Nico', 'Henco', 'Gideon', 'Stefan', 'Andries', 'Carel', 'Dirk', 'Gerhard', 'Henrik', 'Jacques', 'Jan', 'Johan', 'Louis', 'Marthinus', 'Petrus', 'Schalk', 'Tiernan', 'Werner',
    'Sikhumbuzo', 'Wandisile', 'Sazi', 'Thabang', 'Ntuthuko', 'Kagiso', 'Siphosethu', 'Tshepo', 'Siphesihle', 'Lizo', 'Thabo', 'Sibusiso', 'Sanele', 'Bandise', 'Asenathi', 'Khwezi', 'Sithembiso', 'Nkosana', 'Banele', 'Lwandle', 'Muzi', 'Simphiwe', 'Thandolwethu', 'Mandla', 'Lethabo', 'Tebogo', 'Ayanda', 'Bongani', 'Dumisani', 'Jabulani', 'Lungelo', 'Mthokozisi', 'Njabulo', 'Nkosinathi', 'Siyabonga', 'Thabani', 'Vusimuzi', 'Xolani', 'Zola', 'Zubair',
    'Zaheer', 'Tariq', 'Ameer', 'Hashim', 'Imraan', 'Keanu', 'Chesney', 'Ebrahim', 'Zubayr', 'Rashied', 'Kareem', 'Moegamat', 'Yaseen'
  ],
  'Ireland': [
    'Conor', 'Jack', 'Ronan', 'Finlay', 'Craig', 'Cian', 'Robbie', 'Jordan', 'Caelan', 'Peter', 'Ryan', 'Tommy', 'Ross', 'Dan', 'Sam', 'Jimmy', 'Tadhg', 'Garry', 'Hugo', 'Cillain', 'Fiachra', 'Oisín', 'Cormac', 'Cathal', 'Eoin', 'Caoimhín', 'Darragh', 'Jamison', 'Jeremy', 'Milton', 'Joey', 'Antoine', 'Kieran', 'Jason', 'Calvin', 'Ethan', 'Ciarán', 'Dave'
  ],
  'Scotland': [
    'Zander', 'Rory', 'Matt', 'Huw', 'Ali', 'Ben', 'Jamie', 'Pierre', 'George', 'Kyle', 'Darcy', 'Finn', 'Hamish', 'Blair', 'Ewan', 'Callum', 'Greig', 'Fraser', 'Duncan', 'Archie', 'Magnus', 'Angus', 'Alastair', 'Stafford', 'Ollie', 'Arron', 'Glen', 'Murphy'
  ],
  'Wales': [
    'Ellis', 'Dewi', 'Jac', 'Mason', 'Keelan', 'Ioan', 'Gareth', 'Dillon', 'Taine', 'Rhys', 'Sam', 'Callum', 'Iestyn', 'Alun', 'Wyn', 'George', 'Liam', 'Tomos', 'Dafydd', 'Gethin', 'Harri', 'Aled', 'Rhodri', 'Lydiate', 'Leon', 'Rio', 'Aaron'
  ],
  'Italy': [
    'Paolo', 'Tommaso', 'Michele', 'Danilo', 'Sebastian', 'Ignacio', 'Giacomo', 'Lorenzo', 'Federico', 'Matteo', 'Pietro', 'Gianmarco', 'Alessandro', 'Niccolò', 'Marco', 'Andrea', 'Edoardo', 'Luca', 'Giovanni', 'Davide', 'Riccardo', 'Simone', 'Ivan', 'Monty', 'Martin'
  ]
};

export const LAST_NAMES_BY_COUNTRY: Record<string, string[]> = {
  'South Africa': [
    'van der Merwe', 'du Plessis', 'Botha', 'Coetzee', 'Pretorius', 'Venter', 'Steyn', 'Schoeman', 'Kruger', 'Fourie', 'Potgieter', 'le Roux', 'Erasmus', 'Bester', 'de Klerk', 'Mostert', 'Wiese', 'van Staden', 'Cronjé', 'Kriel', 'Willemse', 'Hendrikse', 'Reinach', 'Arendse', 'Davids', 'Geldenhuys', 'van Wyk', 'Grové', 'Louw', 'Meyer', 'Snyman', 'Nortjé', 'Hanekom', 'Mynhardt', 'van den Berg', 'Horn', 'Alberts', 'Barnard', 'Bezuidenhout', 'Botes', 'Cloete', 'Duvenhage', 'Engelbrecht', 'Grobler', 'Hattingh', 'Jordaan', 'Lombard', 'Nel', 'Oosthuizen', 'Pienaar', 'Swart', 'Viljoen', 'Vorster',
    'Nzekeni', 'Nyakane', 'Tshituka', 'Macingwane', 'Molefe', 'Mahlangu', 'Nkosi', 'Sithole', 'Dlamini', 'Xaba', 'Khedam', 'Cele', 'Bhengu', 'Zuma', 'Khumalo', 'Ndlovu', 'Sishi', 'Mkhize', 'Ngcobo', 'Mokoena', 'Masuku', 'Buthelezi', 'Gwala', 'Khuzwayo', 'Makhanya', 'Mdlalose', 'Mthembu', 'Ndaba', 'Ntshalintshali', 'Shabalala', 'Sibiya', 'Zungu',
    'Patel', 'Adams', 'Abrahams', 'Sultana', 'Solomons', 'Pillay', 'Khan', 'Ismail', 'Hendricks', 'September'
  ],
  'Ireland': [
    'O’Mahony', 'Murray', 'Henshaw', 'Beirne', 'Henderson', 'Larmour', 'Kelleher', 'Ringrose', 'Baird', 'Prendergast', 'Coombes', 'Casey', 'Sexton', 'O’Brien', 'McCarthy', 'Furlong', 'McCloskey', 'Healy', 'Herring', 'Timoney', 'Crowley', 'Nash'
  ],
  'Scotland': [
    'Russell', 'Jones', 'Fagerson', 'Ritchie', 'Darge', 'Dobie', 'White', 'Kinghorn', 'Graham', 'Hogg', 'Maitland', 'Schoeman', 'McDowall', 'Dempsey', 'Ramsay', 'MacDonald', 'Stewart', 'Hamilton', 'Paterson', 'Morrison'
  ],
  'Wales': [
    'Williams', 'Davies', 'Jones', 'Evans', 'Thomas', 'Roberts', 'Lewis', 'Hughes', 'Morgan', 'Griffiths', 'Jenkins', 'Reffell', 'Rowlands', 'Domachowski', 'Assiratti', 'Beard', 'Wainwright', 'Costelow', 'Llewellyn', 'Adams'
  ],
  'Italy': [
    'Garbisi', 'Capuozzo', 'Menoncello', 'Brex', 'Negri', 'Lamaro', 'Ferrari', 'Lucchesi', 'Ruzza', 'Fischetti', 'Varney', 'Zambonin', 'Cannone', 'Nicotera', 'Zuliani', 'Ceccarelli', 'Mori', 'Pani'
  ]
};

/**
 * Generate a randomized authentic player name excluding protected star names
 */
export function generateAuthenticPlayerName(country: string = 'South Africa'): string {
  const firsts = FIRST_NAMES_BY_COUNTRY[country] || FIRST_NAMES_BY_COUNTRY['South Africa'];
  const lasts = LAST_NAMES_BY_COUNTRY[country] || LAST_NAMES_BY_COUNTRY['South Africa'];

  let attempts = 0;
  while (attempts < 50) {
    attempts++;
    const first = firsts[Math.floor(Math.random() * firsts.length)];
    const last = lasts[Math.floor(Math.random() * lasts.length)];
    const fullName = `${first} ${last}`;
    const lower = fullName.toLowerCase().trim();

    if (!PROTECTED_STAR_NAMES.has(first.toLowerCase()) && !PROTECTED_STAR_NAMES.has(lower)) {
      return fullName;
    }
  }

  return `${firsts[0]} ${lasts[0]}`;
}

/**
 * Out-of-Position Suitability Modifier:
 * - Natural Position (Primary / Secondary): 100% OVR efficiency (1.0)
 * - Same Line (Wing at Fullback, Flanker at No. 8, Prop at Hooker): 85%–90% OVR efficiency
 * - Cross Line (Prop at Flyhalf, Lock at Wing): 45% OVR efficiency
 */
export function calculatePositionalEfficiency(
  playedPosition: RugbyPosition,
  primaryPosition: RugbyPosition,
  secondaryPositions: RugbyPosition[] = []
): { efficiency: number; tier: 'NATURAL' | 'SAME_LINE' | 'CROSS_LINE'; effectiveOVR: (baseOVR: number) => number } {
  // 1. Natural Position check
  if (playedPosition === primaryPosition || secondaryPositions.includes(playedPosition)) {
    return {
      efficiency: 1.0,
      tier: 'NATURAL',
      effectiveOVR: (baseOVR: number) => baseOVR
    };
  }

  // Define forward vs back lines
  const FRONT_ROW: RugbyPosition[] = ['LH_PROP', 'HOOKER', 'TH_PROP'];
  const SECOND_ROW: RugbyPosition[] = ['LOCK_4', 'LOCK_5'];
  const BACK_ROW: RugbyPosition[] = ['BLINDSIDE_FLANKER', 'OPENSIDE_FLANKER', 'NUMBER_8'];
  const HALF_BACKS: RugbyPosition[] = ['SCRUM_HALF', 'FLY_HALF'];
  const CENTRES: RugbyPosition[] = ['INSIDE_CENTRE', 'OUTSIDE_CENTRE'];
  const BACK_THREE: RugbyPosition[] = ['LEFT_WING', 'RIGHT_WING', 'FULLBACK'];

  const TIGHT_FIVE = [...FRONT_ROW, ...SECOND_ROW];
  const LOOSE_FORWARD_UNIT = [...SECOND_ROW, ...BACK_ROW];
  const BACKLINE_UNIT = [...HALF_BACKS, ...CENTRES, ...BACK_THREE];

  // Same specific unit (e.g. Wing at Fullback, Flanker at No. 8)
  const isSameTightFive = TIGHT_FIVE.includes(playedPosition) && TIGHT_FIVE.includes(primaryPosition);
  const isSameLooseForwards = LOOSE_FORWARD_UNIT.includes(playedPosition) && LOOSE_FORWARD_UNIT.includes(primaryPosition);
  const isSameCentresOrWings = (CENTRES.includes(playedPosition) || BACK_THREE.includes(playedPosition)) &&
                               (CENTRES.includes(primaryPosition) || BACK_THREE.includes(primaryPosition));
  const isHalfBackShift = HALF_BACKS.includes(playedPosition) && (HALF_BACKS.includes(primaryPosition) || primaryPosition === 'FULLBACK');

  if (isSameTightFive || isSameLooseForwards || isSameCentresOrWings || isHalfBackShift) {
    const factor = 0.88; // 88% efficiency
    return {
      efficiency: factor,
      tier: 'SAME_LINE',
      effectiveOVR: (baseOVR: number) => Math.round(baseOVR * factor)
    };
  }

  // Cross-line / Safety violation penalty (e.g. Prop at Flyhalf)
  const crossFactor = 0.45;
  return {
    efficiency: crossFactor,
    tier: 'CROSS_LINE',
    effectiveOVR: (baseOVR: number) => Math.round(baseOVR * crossFactor)
  };
}

/**
 * Deterministic overall calculation based on weighted attributes by position
 */
export function calculateDeterministicOverall(
  attributes: Partial<PlayerAttributes>,
  position: RugbyPosition
): number {
  const a = {
    speed: attributes.speed ?? 75,
    strength: attributes.strength ?? 75,
    stamina: attributes.stamina ?? 75,
    passing: attributes.passing ?? 75,
    tackling: attributes.tackling ?? 75,
    kicking: attributes.kicking ?? 75,
    handling: attributes.handling ?? 75,
    gameAwareness: attributes.gameAwareness ?? 75,
    rucking: attributes.rucking ?? 75,
    lineout: attributes.lineout ?? 75,
    scrummaging: attributes.scrummaging ?? 75,
    defense: attributes.defense ?? 75,
    discipline: attributes.discipline ?? 75,
    fitness: attributes.fitness ?? 75
  };

  let rating = 75;
  switch (position) {
    case 'LH_PROP':
    case 'TH_PROP':
      rating = (a.scrummaging * 0.30) + (a.strength * 0.25) + (a.tackling * 0.15) + (a.rucking * 0.15) + (a.stamina * 0.15);
      break;
    case 'HOOKER':
      rating = (a.lineout * 0.25) + (a.scrummaging * 0.25) + (a.tackling * 0.20) + (a.rucking * 0.15) + (a.strength * 0.15);
      break;
    case 'LOCK_4':
    case 'LOCK_5':
      rating = (a.lineout * 0.30) + (a.strength * 0.20) + (a.scrummaging * 0.20) + (a.tackling * 0.15) + (a.rucking * 0.15);
      break;
    case 'BLINDSIDE_FLANKER':
    case 'OPENSIDE_FLANKER':
      rating = (a.rucking * 0.30) + (a.tackling * 0.25) + (a.stamina * 0.20) + (a.strength * 0.15) + (a.speed * 0.10);
      break;
    case 'NUMBER_8':
      rating = (a.strength * 0.25) + (a.rucking * 0.20) + (a.tackling * 0.20) + (a.speed * 0.15) + (a.handling * 0.20);
      break;
    case 'SCRUM_HALF':
      rating = (a.passing * 0.35) + (a.speed * 0.20) + (a.gameAwareness * 0.20) + (a.kicking * 0.15) + (a.tackling * 0.10);
      break;
    case 'FLY_HALF':
      rating = (a.kicking * 0.30) + (a.passing * 0.30) + (a.gameAwareness * 0.25) + (a.speed * 0.10) + (a.handling * 0.05);
      break;
    case 'INSIDE_CENTRE':
    case 'OUTSIDE_CENTRE':
      rating = (a.tackling * 0.25) + (a.speed * 0.25) + (a.passing * 0.20) + (a.strength * 0.15) + (a.handling * 0.15);
      break;
    case 'LEFT_WING':
    case 'RIGHT_WING':
      rating = (a.speed * 0.40) + (a.handling * 0.20) + (a.gameAwareness * 0.15) + (a.kicking * 0.15) + (a.tackling * 0.10);
      break;
    case 'FULLBACK':
      rating = (a.kicking * 0.25) + (a.speed * 0.25) + (a.gameAwareness * 0.25) + (a.handling * 0.15) + (a.tackling * 0.10);
      break;
  }

  return Math.min(99, Math.max(50, Math.round(rating)));
}

/**
 * Rating Floor & Benched Decay Rule:
 * Ratings MUST NOT drop randomly.
 * A small decay (-1 stamina/OVR) applies ONLY if a player fails to play at least 2 matches in an active 4-match period.
 */
export function applyBenchedDecayCheck(
  player: Player,
  matchesPlayedInPeriod: number,
  periodLengthMatches: number = 4
): { decayed: boolean; previousOVR: number; newOVR: number; reason?: string } {
  const previousOVR = player.overall;

  // Rating Floor check: never drop below 60
  if (previousOVR <= 60) {
    return { decayed: false, previousOVR, newOVR: previousOVR };
  }

  // Decay rule applies strictly only if player failed to play at least 2 matches in the active period
  if (matchesPlayedInPeriod < 2 && periodLengthMatches >= 4) {
    player.overall = Math.max(60, player.overall - 1);
    if (player.attributes?.stamina) {
      player.attributes.stamina = Math.max(50, player.attributes.stamina - 1);
    }
    return {
      decayed: true,
      previousOVR,
      newOVR: player.overall,
      reason: `Match fitness rust: played only ${matchesPlayedInPeriod} matches in the last ${periodLengthMatches} rounds (-1 OVR decay).`
    };
  }

  return { decayed: false, previousOVR, newOVR: previousOVR };
}
