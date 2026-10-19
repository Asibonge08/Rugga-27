import {
  Player,
  PlayerAttributes,
  RugbyPosition,
  RugbyUnit,
  FORWARD_POSITIONS,
  BACK_POSITIONS,
  getRugbyUnit,
  isFrontRow,
  SeasonStats,
  RatingPerformanceBreakdown
} from '../types/rugby';
import { initPlayerMoraleState } from './playerMoraleService';

export interface PositionalEligibilityResult {
  eligible: boolean;
  isPrimary: boolean;
  isSecondary: boolean;
  isHybrid: boolean;
  suitabilityScore: number; // 0 to 100
  effectiveRating: number;   // 1 to 99
  penaltyPercent: number;    // e.g. 0, 6, 14
  reason?: string;
  isFrontRowWarning?: boolean;
}

/**
 * Position-weighted attribute weights for rugby union positions (1 to 15).
 * Weights sum to 1.0 for each position.
 */
export const POSITION_ATTRIBUTE_WEIGHTS: Record<RugbyPosition, Partial<Record<keyof PlayerAttributes, number>>> = {
  LH_PROP: {
    scrummaging: 0.35,
    strength: 0.22,
    tackling: 0.15,
    carrying: 0.12,
    fitness: 0.08,
    workRate: 0.08
  },
  HOOKER: {
    hooking: 0.30,
    scrummaging: 0.20,
    breakdown: 0.15,
    tackling: 0.15,
    passing: 0.10,
    strength: 0.10
  },
  TH_PROP: {
    scrummaging: 0.38,
    strength: 0.22,
    tackling: 0.14,
    carrying: 0.12,
    fitness: 0.07,
    workRate: 0.07
  },
  LOCK_4: {
    lineout: 0.30,
    strength: 0.20,
    scrummaging: 0.18,
    workRate: 0.14,
    tackling: 0.10,
    carrying: 0.08
  },
  LOCK_5: {
    lineout: 0.32,
    strength: 0.20,
    scrummaging: 0.16,
    workRate: 0.14,
    tackling: 0.10,
    carrying: 0.08
  },
  BLINDSIDE_FLANKER: {
    tackling: 0.25,
    breakdown: 0.22,
    carrying: 0.18,
    workRate: 0.15,
    strength: 0.10,
    speed: 0.10
  },
  OPENSIDE_FLANKER: {
    breakdown: 0.30,
    tackling: 0.25,
    speed: 0.15,
    workRate: 0.15,
    carrying: 0.08,
    fitness: 0.07
  },
  NUMBER_8: {
    carrying: 0.26,
    breakdown: 0.20,
    strength: 0.18,
    tackling: 0.14,
    tacticalAwareness: 0.12,
    offloading: 0.10
  },
  SCRUM_HALF: {
    passing: 0.32,
    speed: 0.20,
    tacticalAwareness: 0.18,
    kicking: 0.15,
    fitness: 0.08,
    consistency: 0.07
  },
  FLY_HALF: {
    passing: 0.24,
    kicking: 0.24,
    tacticalAwareness: 0.26,
    goalKicking: 0.16,
    speed: 0.10
  },
  LEFT_WING: {
    speed: 0.34,
    carrying: 0.20,
    tackling: 0.16,
    tacticalAwareness: 0.12,
    offloading: 0.10,
    fitness: 0.08
  },
  INSIDE_CENTRE: {
    tackling: 0.24,
    carrying: 0.22,
    passing: 0.20,
    strength: 0.14,
    tacticalAwareness: 0.12,
    speed: 0.08
  },
  OUTSIDE_CENTRE: {
    speed: 0.26,
    tackling: 0.22,
    passing: 0.18,
    carrying: 0.16,
    tacticalAwareness: 0.10,
    offloading: 0.08
  },
  RIGHT_WING: {
    speed: 0.34,
    carrying: 0.20,
    tackling: 0.16,
    tacticalAwareness: 0.12,
    offloading: 0.10,
    fitness: 0.08
  },
  FULLBACK: {
    tacticalAwareness: 0.24,
    speed: 0.22,
    kicking: 0.20,
    tackling: 0.18,
    carrying: 0.10,
    consistency: 0.06
  }
};

/**
 * Calculates a position-specific ability rating (1-99) for any player at a target position.
 */
export function calculatePositionRating(attrs: PlayerAttributes, targetPosition: RugbyPosition): number {
  const weights = POSITION_ATTRIBUTE_WEIGHTS[targetPosition];
  if (!weights) return 65;

  let totalWeight = 0;
  let weightedScore = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const attrKey = key as keyof PlayerAttributes;
    const value = attrs[attrKey] ?? 60;
    if (typeof weight === 'number') {
      weightedScore += value * weight;
      totalWeight += weight;
    }
  }

  const raw = totalWeight > 0 ? weightedScore / totalWeight : 65;
  return Math.max(30, Math.min(99, Math.round(raw)));
}

/**
 * Evaluates whether a player can legally and tactically cover a position.
 * Strictly enforces forward/back unit separation unless player has Hybrid status.
 */
export function checkPositionalEligibility(player: Player, targetPosition: RugbyPosition): PositionalEligibilityResult {
  const isPrimary = player.primaryPosition === targetPosition;
  const isSecondary = (player.secondaryPositions || []).includes(targetPosition);
  const playerUnit = getRugbyUnit(player.primaryPosition);
  const targetUnit = getRugbyUnit(targetPosition);
  const crossesUnit = playerUnit !== targetUnit;

  const nativeRating = calculatePositionRating(player.attributes, targetPosition);

  // 1. Primary position check
  if (isPrimary) {
    return {
      eligible: true,
      isPrimary: true,
      isSecondary: false,
      isHybrid: false,
      suitabilityScore: 100,
      effectiveRating: nativeRating,
      penaltyPercent: 0
    };
  }

  // 2. Cross-Unit Boundary (Forward <-> Back)
  if (crossesUnit) {
    const hybridLevel = player.hybridLevel || 'NONE';
    const approvedPositions = player.approvedCrossUnitPositions || [];
    const isApproved = approvedPositions.includes(targetPosition);

    if (hybridLevel === 'NONE' || !isApproved) {
      return {
        eligible: false,
        isPrimary: false,
        isSecondary: false,
        isHybrid: false,
        suitabilityScore: 0,
        effectiveRating: Math.max(30, nativeRating - 35),
        penaltyPercent: 50,
        reason: `Strict Rugby Rule: Ordinary ${playerUnit.toLowerCase()} cannot cross into the ${targetUnit.toLowerCase()} unit without verified Hybrid status.`
      };
    }

    // Approved Hybrid Player
    let penalty = 0;
    let suitability = 90;

    if (hybridLevel === 'LEVEL_3_SPECIALIST') {
      penalty = 0;
      suitability = 95;
    } else if (hybridLevel === 'LEVEL_2_CAPABLE') {
      penalty = 6;
      suitability = 85;
    } else {
      // LEVEL_1_LIMITED
      penalty = 14;
      suitability = 72;
    }

    const effective = Math.max(35, Math.round(nativeRating * (1 - penalty / 100)));

    return {
      eligible: true,
      isPrimary: false,
      isSecondary: false,
      isHybrid: true,
      suitabilityScore: suitability,
      effectiveRating: effective,
      penaltyPercent: penalty,
      reason: penalty > 0 ? `Hybrid player covering cross-unit role (${penalty}% versatility adjustment)` : 'Specialist dual-unit versatility (no penalty)'
    };
  }

  // 3. Same-Unit secondary position (e.g. Flanker playing Number 8, Wing playing Fullback)
  if (isSecondary) {
    return {
      eligible: true,
      isPrimary: false,
      isSecondary: true,
      isHybrid: false,
      suitabilityScore: 92,
      effectiveRating: Math.max(40, Math.round(nativeRating * 0.96)),
      penaltyPercent: 4,
      reason: 'Approved secondary position'
    };
  }

  // 4. Same unit but unlisted position (e.g. Flanker covering Lock)
  // Check if player is attempting Front Row without credentials
  if (isFrontRow(targetPosition) && !isFrontRow(player.primaryPosition)) {
    return {
      eligible: false,
      isPrimary: false,
      isSecondary: false,
      isHybrid: false,
      suitabilityScore: 20,
      effectiveRating: Math.max(30, nativeRating - 30),
      penaltyPercent: 40,
      isFrontRowWarning: true,
      reason: 'World Rugby Safety Law: Non-specialist front row players cannot pack down at Prop or Hooker.'
    };
  }

  // Emergency cover within same unit
  const sameUnitPenalty = 12;
  return {
    eligible: true,
    isPrimary: false,
    isSecondary: false,
    isHybrid: false,
    suitabilityScore: 70,
    effectiveRating: Math.max(35, Math.round(nativeRating * (1 - sameUnitPenalty / 100))),
    penaltyPercent: sameUnitPenalty,
    reason: `Emergency cover within ${playerUnit.toLowerCase()} (-${sameUnitPenalty}% tactical unfamiliarity penalty)`
  };
}

/**
 * Returns user-friendly descriptive rating band
 */
export function getRatingTier(rating: number): { label: string; color: string; badgeBg: string } {
  if (rating >= 90) {
    return { label: 'World Class', color: 'text-amber-400', badgeBg: 'bg-amber-950/60 border-amber-500/40' };
  }
  if (rating >= 80) {
    return { label: 'Elite Pro', color: 'text-emerald-400', badgeBg: 'bg-emerald-950/60 border-emerald-500/40' };
  }
  if (rating >= 70) {
    return { label: 'Strong Pro', color: 'text-blue-400', badgeBg: 'bg-blue-950/60 border-blue-500/40' };
  }
  if (rating >= 60) {
    return { label: 'Squad Player', color: 'text-neutral-300', badgeBg: 'bg-neutral-900 border-neutral-700' };
  }
  return { label: 'Developing', color: 'text-neutral-400', badgeBg: 'bg-neutral-950 border-neutral-800' };
}

/**
 * Derives or retrieves structured 2024–25 season statistics for a player.
 * Anchors the player's multi-season track record, consistency, and veteran pedigree.
 */
export function deriveLastSeasonStats(player: Player): SeasonStats {
  if (player.lastSeasonStats) {
    return player.lastSeasonStats;
  }

  const isBack = BACK_POSITIONS.includes(player.primaryPosition);
  const isKicker = player.primaryPosition === 'FLY_HALF' || player.primaryPosition === 'FULLBACK';
  const age = player.age || 25;
  const overall = player.overall || 78;

  // Estimate last season appearances based on age, caliber & career caps
  let lastSeasonMatches = 16;
  if (age <= 21) {
    lastSeasonMatches = 7 + Math.floor(Math.random() * 5); // Young player break-in
  } else if (age >= 33) {
    lastSeasonMatches = 11 + Math.floor(Math.random() * 6); // Managed veteran load
  } else {
    lastSeasonMatches = 15 + Math.floor(Math.random() * 7); // Prime starter (15-22 matches)
  }

  if (player.careerStats?.totalCaps && player.careerStats.totalCaps < lastSeasonMatches) {
    lastSeasonMatches = Math.max(1, player.careerStats.totalCaps);
  }

  // Tries last season
  let tries = 0;
  if (player.primaryPosition.includes('WING')) {
    tries = Math.round(lastSeasonMatches * (0.35 + (overall / 250)));
  } else if (player.primaryPosition.includes('CENTRE') || player.primaryPosition === 'FULLBACK') {
    tries = Math.round(lastSeasonMatches * (0.22 + (overall / 350)));
  } else if (player.primaryPosition.includes('FLANKER') || player.primaryPosition === 'NUMBER_8') {
    tries = Math.round(lastSeasonMatches * (0.16 + (overall / 400)));
  } else if (player.primaryPosition === 'HOOKER') {
    tries = Math.round(lastSeasonMatches * (0.14 + (overall / 450))); // Maul finishes
  } else {
    tries = Math.round(lastSeasonMatches * 0.05);
  }

  // Tackles last season
  const tacklesPerMatch = isBack ? (overall >= 85 ? 7.2 : 5.4) : (overall >= 85 ? 11.5 : 9.0);
  const tacklesMade = Math.round(lastSeasonMatches * tacklesPerMatch);
  const tacklesMissed = Math.round(tacklesMade * 0.08);

  // Turnovers won last season
  const turnoversPerMatch = (!isBack && (player.primaryPosition.includes('FLANKER') || player.primaryPosition === 'HOOKER'))
    ? 1.1
    : !isBack ? 0.7 : 0.35;
  const turnoversWon = Math.round(lastSeasonMatches * turnoversPerMatch);

  // Metres carried last season
  const metresPerMatch = isBack ? (overall * 0.6) : (overall * 0.35);
  const metresCarried = Math.round(lastSeasonMatches * metresPerMatch);

  // Kicking stats last season
  let conversions = 0;
  let penalties = 0;
  let points = tries * 5;
  if (isKicker && overall >= 78) {
    conversions = Math.round(lastSeasonMatches * 2.2);
    penalties = Math.round(lastSeasonMatches * 1.5);
    points += (conversions * 2) + (penalties * 3);
  }

  // Last season average match rating (6.7 to 8.2 range)
  const ratingBaseline = 6.6 + ((overall - 65) / 25) * 1.2;
  const avgRating = Number(Math.max(6.2, Math.min(8.6, ratingBaseline)).toFixed(1));

  return {
    seasonId: '2024-25',
    seasonName: '2024–25 Season Record',
    matchesPlayed: lastSeasonMatches,
    tries,
    conversions,
    penalties,
    dropGoals: 0,
    points,
    tacklesMade,
    tacklesMissed,
    turnoversWon,
    metresCarried,
    yellowCards: overall >= 88 ? 0 : Math.floor(Math.random() * 2),
    redCards: 0,
    avgRating
  };
}

/**
 * Calculates a player's performance-based rating going by:
 * 1. Current season stats (2025-26): Matches played, avg match rating, tries, tackles, turnovers, metres, cards.
 * 2. Last season stats (2024-25): Established baseline pedigree, appearances, try rate, tackle volume, kicking accuracy.
 * 3. Potential rating: The upward growth vector/ceiling, pulling young and developing talent upward when performing.
 */
export function calculatePerformanceRating(player: Player): {
  overall: number;
  attributes: PlayerAttributes;
  breakdown: RatingPerformanceBreakdown;
} {
  const previousOverall = player.overall;
  const baseRating = player.ratingBreakdown?.baseRating || player.overall;
  const potential = player.potential || player.overall;
  const age = player.age || 25;
  const position = player.primaryPosition;
  const isBack = BACK_POSITIONS.includes(position);
  const isForward = FORWARD_POSITIONS.includes(position);

  const currentStats = player.stats;
  const lastSeason = deriveLastSeasonStats(player);

  const highlights: string[] = [];

  // ==========================================
  // PILLAR 1: CURRENT SEASON STATS (2025–26)
  // ==========================================
  let currentSeasonScore = 0;

  if (currentStats && currentStats.matchesPlayed > 0) {
    const matches = currentStats.matchesPlayed;
    const avgRating = currentStats.avgRating || 7.0;

    // A. Match Rating Impact (Baseline is 7.0)
    // Ratings >= 7.8 indicate world-class in-form displays
    const ratingDiff = avgRating - 7.0;
    const sampleConfidence = Math.min(1.0, matches / 4); // Full confidence after 4 matches
    const matchRatingDelta = ratingDiff * 2.2 * sampleConfidence;
    currentSeasonScore += matchRatingDelta;

    if (avgRating >= 7.6 && matches >= 2) {
      highlights.push(`Current Season: High-caliber ${avgRating} avg match rating across ${matches} games (+${matchRatingDelta.toFixed(1)} OVR)`);
    } else if (avgRating < 6.4 && matches >= 2) {
      highlights.push(`Current Season: Dipping match form with ${avgRating} avg rating (${matchRatingDelta.toFixed(1)} OVR)`);
    }

    // B. Try Scoring Output
    const triesPerGame = currentStats.tries / matches;
    if (isBack && triesPerGame >= 0.4) {
      const tryBonus = Math.min(1.8, (triesPerGame - 0.2) * 2.0);
      currentSeasonScore += tryBonus;
      highlights.push(`Current Season: Strike weapon with ${currentStats.tries} tries in ${matches} matches (+${tryBonus.toFixed(1)} OVR)`);
    } else if (isForward && currentStats.tries >= 2) {
      const fwdTryBonus = Math.min(1.5, currentStats.tries * 0.5);
      currentSeasonScore += fwdTryBonus;
      highlights.push(`Current Season: Exceptional forward scoring with ${currentStats.tries} tries (+${fwdTryBonus.toFixed(1)} OVR)`);
    }

    // C. Defensive & Breakdown Workload
    const tacklesPerGame = currentStats.tacklesMade / matches;
    const turnoversPerGame = currentStats.turnoversWon / matches;

    if (isForward) {
      if (tacklesPerGame >= 9.5) {
        const tackBonus = Math.min(1.5, (tacklesPerGame - 7.5) * 0.4);
        currentSeasonScore += tackBonus;
      }
      if (turnoversPerGame >= 0.8) {
        const toBonus = Math.min(1.6, turnoversPerGame * 0.9);
        currentSeasonScore += toBonus;
        highlights.push(`Current Season: Breakdown powerhouse with ${currentStats.turnoversWon} turnovers won (+${toBonus.toFixed(1)} OVR)`);
      }
    } else {
      if (tacklesPerGame >= 6.0) {
        currentSeasonScore += 0.8;
      }
    }

    // D. Meters Carried
    const metresPerGame = currentStats.metresCarried / matches;
    if (metresPerGame >= 45) {
      const carryBonus = Math.min(1.4, (metresPerGame - 30) * 0.03);
      currentSeasonScore += carryBonus;
    }

    // E. Disciplinary Deductions
    if (currentStats.yellowCards > 0) {
      const yPenalty = currentStats.yellowCards * 0.4;
      currentSeasonScore -= yPenalty;
    }
    if (currentStats.redCards > 0) {
      const rPenalty = currentStats.redCards * 1.2;
      currentSeasonScore -= rPenalty;
      highlights.push(`Current Season: Disciplinary card penalties applied (-${rPenalty.toFixed(1)} OVR)`);
    }
  } else {
    // Zero current matches played yet - form provides minor baseline momentum
    const formFactor = ((player.form || 7) - 7) * 0.3;
    currentSeasonScore += formFactor;
    highlights.push(`Current Season: Pre-season form rating ${player.form || 7}/10 awaiting competitive minutes`);
  }

  // Bound current season delta between -4 and +4
  const currentSeasonDelta = Number(Math.max(-4.0, Math.min(4.0, currentSeasonScore)).toFixed(1));

  // ==========================================
  // PILLAR 2: LAST SEASON STATS (2024–25)
  // ==========================================
  let lastSeasonScore = 0;

  // A. Durability & Regular First-Team Exposure
  if (lastSeason.matchesPlayed >= 16) {
    lastSeasonScore += 0.8; // Proven starter endurance
  } else if (lastSeason.matchesPlayed < 6 && age > 22) {
    lastSeasonScore -= 0.6; // Lack of regular game-time last campaign
  }

  // B. Last Season Average Rating Anchor
  const lastRatingDiff = (lastSeason.avgRating || 7.0) - 7.0;
  lastSeasonScore += lastRatingDiff * 1.1;

  // C. Last Season Try & Turnover Milestones
  if (lastSeason.tries >= 7) {
    lastSeasonScore += 0.9;
    highlights.push(`Last Season: Prolific finisher with ${lastSeason.tries} tries in 2024-25 (+0.9 OVR)`);
  }
  if (lastSeason.turnoversWon >= 14) {
    lastSeasonScore += 0.8;
  }
  if (lastSeason.tacklesMade >= 140) {
    lastSeasonScore += 0.8;
    highlights.push(`Last Season: Workhorse tackling engine with ${lastSeason.tacklesMade} completed tackles (+0.8 OVR)`);
  }

  // Bound last season delta between -2.5 and +3.0
  const lastSeasonDelta = Number(Math.max(-2.5, Math.min(3.0, lastSeasonScore)).toFixed(1));

  // ==========================================
  // PILLAR 3: POTENTIAL FACTOR & GROWTH VECTOR
  // ==========================================
  let potentialFactorScore = 0;
  const potentialGap = Math.max(0, potential - baseRating);

  if (age <= 22) {
    // Youth Prodigy (Accelerated development if performing well)
    if (currentSeasonDelta >= -0.5) {
      potentialFactorScore = Math.min(3.5, potentialGap * 0.22);
      if (potentialFactorScore >= 1.5) {
        highlights.push(`Potential Vector: High-ceiling prospect (POT ${potential}) developing rapidly (+${potentialFactorScore.toFixed(1)} OVR)`);
      }
    }
  } else if (age <= 26) {
    // Prime Development Window
    if (currentSeasonDelta >= 0) {
      potentialFactorScore = Math.min(2.5, potentialGap * 0.15);
      if (potentialFactorScore >= 1.0) {
        highlights.push(`Potential Vector: Entering athletic prime towards POT ${potential} (+${potentialFactorScore.toFixed(1)} OVR)`);
      }
    }
  } else if (age >= 32) {
    // Veteran Stabilization
    potentialFactorScore = 0;
  }

  const potentialFactor = Number(potentialFactorScore.toFixed(1));

  // ==========================================
  // PILLAR 4: MORALE & IN-GAME CONFIDENCE
  // ==========================================
  const moraleState = initPlayerMoraleState(player);
  const moraleFactor = Number(moraleState.confidenceModifier.toFixed(1));

  if (moraleFactor >= 1.5) {
    highlights.push(`Morale Factor: Peak confidence (${moraleState.score}%) boosting performance (+${moraleFactor.toFixed(1)} OVR)`);
  } else if (moraleFactor <= -1.0) {
    highlights.push(`Morale Factor: Lower morale (${moraleState.score}%) dampening form (${moraleFactor.toFixed(1)} OVR)`);
  }

  // ==========================================
  // FINAL COMPUTED OVERALL & ATTRIBUTE SCALING
  // ==========================================
  const rawCalculated = baseRating + currentSeasonDelta + lastSeasonDelta + potentialFactor + moraleFactor;
  // Bounded by [50, potential]
  const calculatedOverall = Math.min(potential, Math.max(50, Math.round(rawCalculated)));
  const overallDelta = calculatedOverall - previousOverall;

  // Scale attributes to correspond with newly adjusted overall rating
  const oldOverall = Math.max(40, previousOverall);
  const scaleRatio = calculatedOverall / oldOverall;

  const newAttributes: PlayerAttributes = { ...player.attributes };
  for (const attrKey of Object.keys(newAttributes) as (keyof PlayerAttributes)[]) {
    const originalVal = newAttributes[attrKey];
    if (typeof originalVal === 'number') {
      const adjusted = Math.round(originalVal * scaleRatio);
      newAttributes[attrKey] = Math.min(99, Math.max(35, adjusted));
    }
  }

  const breakdown: RatingPerformanceBreakdown = {
    baseRating,
    currentSeasonDelta,
    lastSeasonDelta,
    potentialFactor,
    moraleFactor,
    calculatedOverall,
    previousOverall,
    overallDelta,
    statHighlights: highlights.slice(0, 4),
    recalculatedDate: new Date().toISOString()
  };

  return {
    overall: calculatedOverall,
    attributes: newAttributes,
    breakdown
  };
}

/**
 * Updates a single player in-place with newly calculated ratings from performance and potential.
 */
export function recalculatePlayerRating(player: Player): Player {
  const result = calculatePerformanceRating(player);
  
  player.lastSeasonStats = deriveLastSeasonStats(player);
  player.overall = result.overall;
  player.attributes = result.attributes;
  player.ratingBreakdown = result.breakdown;

  // Recalculate market value and weekly wages with realistic rugby curve
  player.marketValue = Math.round(Math.pow(player.overall / 10, 3.8) * 88);
  player.weeklyWage = Math.round((player.marketValue / 100) * 1.55);

  return player;
}

/**
 * Batch recalculates ratings for a group of players (e.g. club squad or entire league).
 */
export function recalculateBatchRatings(players: Player[]): {
  players: Player[];
  summary: {
    totalProcessed: number;
    gainedRatingCount: number;
    droppedRatingCount: number;
    unchangedCount: number;
    netRatingChange: number;
  };
} {
  let gained = 0;
  let dropped = 0;
  let unchanged = 0;
  let netChange = 0;

  players.forEach(p => {
    const prev = p.overall;
    recalculatePlayerRating(p);
    const diff = p.overall - prev;
    netChange += diff;
    if (diff > 0) gained++;
    else if (diff < 0) dropped++;
    else unchanged++;
  });

  return {
    players,
    summary: {
      totalProcessed: players.length,
      gainedRatingCount: gained,
      droppedRatingCount: dropped,
      unchangedCount: unchanged,
      netRatingChange: netChange
    }
  };
}

