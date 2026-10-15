import { Rivalry } from '../types/rugby';

export const RUGBY_RIVALRIES: Rivalry[] = [
  // --- SOUTH AFRICA DERBIES ---
  {
    id: 'north_south_derby',
    name: 'North-South Derby',
    teamA: 'stormers',
    teamB: 'bulls',
    trophyName: 'North-South Trophy',
    intensity: 'FIERCE',
    lore: 'The crown jewel of South African rugby. The coastal flair of the DHL Stormers in Cape Town against the relentless physical blue power of the Vodacom Bulls from Loftus Versfeld.',
    tensionModifier: 1.8,
    fanSatisfactionMultiplier: 2.5
  },
  {
    id: 'coastal_derby',
    name: 'Coastal Derby',
    teamA: 'sharks_urc',
    teamB: 'stormers',
    trophyName: 'Coastal Crown',
    intensity: 'HEATED',
    lore: 'Battle of the coastlines between Durban and Cape Town. Fierce breakdown battles and electric backline running under immense regional pride.',
    tensionModifier: 1.6,
    fanSatisfactionMultiplier: 2.0
  },
  {
    id: 'jukskei_derby',
    name: 'Jukskei Derby',
    teamA: 'bulls',
    teamB: 'lions',
    trophyName: 'Transvaal Trophy',
    intensity: 'FIERCE',
    lore: 'Separated only by the Jukskei River between Pretoria and Johannesburg. Pure physical warfare, high-altitude collisions, and generational rivalry.',
    tensionModifier: 1.7,
    fanSatisfactionMultiplier: 2.2
  },
  {
    id: 'sharks_bulls_clash',
    name: 'Highveld vs Coast Derby',
    teamA: 'sharks_urc',
    teamB: 'bulls',
    trophyName: 'Highveld-Coast Shield',
    intensity: 'HEATED',
    lore: 'A heavyweight clash packed with Springbok stars. Battle of the heavy packs with massive championship implications.',
    tensionModifier: 1.5,
    fanSatisfactionMultiplier: 1.8
  },

  // --- IRISH INTERPROVINCIAL DERBIES ---
  {
    id: 'leinster_munster_derby',
    name: 'Irish Interprovincial Derby',
    teamA: 'leinster',
    teamB: 'munster',
    trophyName: 'Interprovincial Crown',
    intensity: 'FIERCE',
    lore: 'One of the most storied and intense derbies in world rugby. Leinster’s Dublin precision against Munster’s legendary red-jersey warrior spirit at Croke Park or Thomond Park.',
    tensionModifier: 1.8,
    fanSatisfactionMultiplier: 2.5
  },
  {
    id: 'leinster_ulster_derby',
    name: 'North-South Interpro',
    teamA: 'leinster',
    teamB: 'ulster',
    trophyName: 'Irish Provincial Shield',
    intensity: 'HEATED',
    lore: 'High-stakes battle between Belfast and Dublin. Raucous atmospheres at Kingspan Stadium and the RDS Arena.',
    tensionModifier: 1.5,
    fanSatisfactionMultiplier: 1.9
  },
  {
    id: 'munster_ulster_derby',
    name: 'Munster-Ulster Interpro',
    teamA: 'munster',
    teamB: 'ulster',
    trophyName: 'Ulster-Munster Cup',
    intensity: 'HEATED',
    lore: 'Two rugby heartlands squaring off in brutal winter weather with zero quarter given in the tackle area.',
    tensionModifier: 1.4,
    fanSatisfactionMultiplier: 1.7
  },
  {
    id: 'connacht_leinster_derby',
    name: 'Western Uprising Derby',
    teamA: 'connacht',
    teamB: 'leinster',
    trophyName: 'Western Challenge',
    intensity: 'HEATED',
    lore: 'Galway pride against the capital giants. Connacht relish overturning the odds with breathless running rugby in the Galway wind.',
    tensionModifier: 1.5,
    fanSatisfactionMultiplier: 2.0
  },

  // --- SCOTTISH DERBY ---
  {
    id: '1872_cup',
    name: 'The 1872 Cup',
    teamA: 'glasgow',
    teamB: 'edinburgh',
    trophyName: '1872 Cup',
    intensity: 'FIERCE',
    lore: 'The oldest inter-district rugby clash in world history, contested since 1872. West against East Scotland for national pride and the silver trophy.',
    tensionModifier: 1.8,
    fanSatisfactionMultiplier: 2.4
  },

  // --- WELSH DERBIES ---
  {
    id: 'west_wales_derby',
    name: 'West Wales Derby',
    teamA: 'ospreys',
    teamB: 'scarlets',
    trophyName: 'West Wales Trophy',
    intensity: 'FIERCE',
    lore: 'The fiercest rivalry in Welsh rugby. Swansea against Llanelli, dividing families and lighting up the touchline with ferocious intensity.',
    tensionModifier: 1.8,
    fanSatisfactionMultiplier: 2.4
  },
  {
    id: 'east_wales_derby',
    name: 'East Wales Derby',
    teamA: 'cardiff',
    teamB: 'dragons',
    trophyName: 'East Wales Shield',
    intensity: 'HEATED',
    lore: 'Capital city Cardiff against the Gwent Dragons. Hostile collisions under the lights at Cardiff Arms Park and Rodney Parade.',
    tensionModifier: 1.6,
    fanSatisfactionMultiplier: 2.0
  },
  {
    id: 'south_wales_derby',
    name: 'South Wales Classic',
    teamA: 'cardiff',
    teamB: 'ospreys',
    trophyName: 'South Wales Cup',
    intensity: 'HEATED',
    lore: 'Urban capital bragging rights against the Ospreys championship heritage.',
    tensionModifier: 1.5,
    fanSatisfactionMultiplier: 1.8
  },

  // --- ITALIAN DERBY ---
  {
    id: 'italian_derby',
    name: 'Derby Italiano',
    teamA: 'benetton',
    teamB: 'zebre',
    trophyName: 'Coppa d’Italia URC',
    intensity: 'FIERCE',
    lore: 'The duel for Italian rugby supremacy. Treviso versus Parma, with national selection and regional bragging rights hanging on every scrum.',
    tensionModifier: 1.7,
    fanSatisfactionMultiplier: 2.3
  },

  // --- CROSS-HEMISPHERE TITANS ---
  {
    id: 'leinster_bulls_heavyweights',
    name: 'North vs South Titans',
    teamA: 'leinster',
    teamB: 'bulls',
    trophyName: 'Inter-Hemisphere Cup',
    intensity: 'FIERCE',
    lore: 'The two premier powerhouses of the URC. High-octane semi-final and playoff drama that has developed into a fiery cross-hemisphere rivalry.',
    tensionModifier: 1.7,
    fanSatisfactionMultiplier: 2.2
  },
  {
    id: 'stormers_munster_rematch',
    name: 'Grand Final Rematch',
    teamA: 'stormers',
    teamB: 'munster',
    trophyName: 'Champions Rematch Shield',
    intensity: 'HEATED',
    lore: 'Reliving the historic 2023 URC Grand Final in Cape Town. Tremendous mutual respect coupled with ferocious competitive fire.',
    tensionModifier: 1.6,
    fanSatisfactionMultiplier: 2.0
  },
  {
    id: 'glasgow_bulls_titans',
    name: 'Championship Rematch',
    teamA: 'glasgow',
    teamB: 'bulls',
    trophyName: 'Titans Challenge Cup',
    intensity: 'HEATED',
    lore: 'Replay of the dramatic 2024 URC Grand Final won by Glasgow Warriors in Pretoria.',
    tensionModifier: 1.6,
    fanSatisfactionMultiplier: 2.0
  }
];

export function getRivalry(clubAId: string, clubBId: string): Rivalry | null {
  return RUGBY_RIVALRIES.find(
    r => (r.teamA === clubAId && r.teamB === clubBId) || (r.teamA === clubBId && r.teamB === clubAId)
  ) || null;
}

export function isRivalryMatch(clubAId: string, clubBId: string): boolean {
  return getRivalry(clubAId, clubBId) !== null;
}

export function getClubRivalries(clubId: string): Rivalry[] {
  return RUGBY_RIVALRIES.filter(r => r.teamA === clubId || r.teamB === clubId);
}

/**
 * Calculates fan satisfaction change from a match outcome
 */
export function calculateFanSatisfactionDelta(params: {
  userWon: boolean;
  isDraw: boolean;
  isRivalry: boolean;
  scoreDiff: number;
  isAway: boolean;
  triesScored: number;
}): { delta: number; sentimentText: string } {
  const { userWon, isDraw, isRivalry, scoreDiff, isAway, triesScored } = params;

  let delta = 0;
  let sentimentText = '';

  if (isRivalry) {
    if (userWon) {
      // Big win in derby
      delta = scoreDiff > 14 ? 22 : scoreDiff > 7 ? 18 : 15;
      if (isAway) delta += 3; // Away derby win is legendary
      if (triesScored >= 4) delta += 2;
      sentimentText = `ECSTATIC: Historic victory in the derby! Fans celebrating across the city!`;
    } else if (isDraw) {
      delta = isAway ? 4 : -2;
      sentimentText = isAway ? `RESPECTFUL: Gritty draw secured on hostile derby ground.` : `FRUSTRATED: Derby points dropped at home.`;
    } else {
      // Bitter defeat
      delta = scoreDiff > 14 ? -22 : scoreDiff > 7 ? -18 : -14;
      if (!isAway) delta -= 4; // Losing a derby at home is unforgivable to ultras
      sentimentText = `FURIOUS: Humiliation in the derby. Fans demanding accountability from coaching staff!`;
    }
  } else {
    // Normal match
    if (userWon) {
      delta = scoreDiff > 14 ? 6 : 4;
      if (isAway) delta += 1;
      if (triesScored >= 4) delta += 1;
      sentimentText = `SATISFIED: Solid league victory adds to momentum.`;
    } else if (isDraw) {
      delta = 0;
      sentimentText = `NEUTRAL: Shared points after a grueling contest.`;
    } else {
      delta = scoreDiff > 14 ? -6 : -4;
      if (!isAway) delta -= 2;
      sentimentText = `DISAPPOINTED: Tough defeat in regular league action.`;
    }
  }

  return { delta, sentimentText };
}

/**
 * Procedural fan reaction quote generator
 */
export function getFanReactionQuote(
  clubShortName: string,
  opponentShortName: string,
  isRivalry: boolean,
  userWon: boolean,
  isDraw: boolean,
  rivalryName?: string
): string {
  if (isRivalry && rivalryName) {
    if (userWon) {
      const quotes = [
        `"Beating ${opponentShortName} in the ${rivalryName} is what rugby dreams are made of. Unbelievable character!"`,
        `"Total dominance in the derby! The whole stadium was shaking with pride tonight."`,
        `"Bragging rights secured! ${opponentShortName} won't hear the end of this until next season!"`,
        `"Our forward pack showed them who runs this fixture. Pure courage and heart!"`
      ];
      return quotes[Math.floor(Math.random() * quotes.length)];
    } else if (isDraw) {
      return `"What a war! A breathless finish in the ${rivalryName}. Blood, sweat and pure rugby drama."`;
    } else {
      const quotes = [
        `"Unacceptable to lose the ${rivalryName} like that. Our discipline fell apart when the pressure mounted."`,
        `"Gutted. You can lose any game of the season, but NEVER to ${opponentShortName}!"`,
        `"The boys looked shell-shocked by their physicality. Back to the drawing board before the supporters lose patience."`
      ];
      return quotes[Math.floor(Math.random() * quotes.length)];
    }
  }

  if (userWon) {
    return `"Solid performance against ${opponentShortName}. Keep building for the playoff spots!"`;
  } else if (isDraw) {
    return `"Shared spoils against ${opponentShortName}. We'll take the two championship points and move on."`;
  } else {
    return `"Frustrating evening against ${opponentShortName}. Need better execution in the red zone next week."`;
  }
}
