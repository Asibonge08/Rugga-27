import {
  Player,
  PlayerAttributes,
  RugbyPosition,
  RugbyUnit,
  FORWARD_POSITIONS,
  BACK_POSITIONS,
  getRugbyUnit,
  isFrontRow
} from '../types/rugby';

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
