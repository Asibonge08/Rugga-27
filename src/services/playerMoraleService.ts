// src/services/playerMoraleService.ts
// Dynamic Player Morale & In-Game Confidence System for Rugga 27
// Fluctuates realistically based on Match Performance, Rotation Status, and Team Results

import {
  Player,
  InMatchPlayerStats,
  MoraleTier,
  MoraleLogEntry,
  PlayerMoraleState
} from '../types/rugby';

export function getMoraleTier(score: number): MoraleTier {
  if (score >= 88) return 'ECSTATIC';
  if (score >= 74) return 'HIGH';
  if (score >= 56) return 'CONTENT';
  if (score >= 40) return 'DISCONTENT';
  return 'FRUSTRATED';
}

export function getMoraleVisuals(tier: MoraleTier): {
  label: string;
  badgeText: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  icon: string;
} {
  switch (tier) {
    case 'ECSTATIC':
      return {
        label: 'Ecstatic / Peak Confidence',
        badgeText: 'Ecstatic',
        textColor: 'text-emerald-300',
        bgColor: 'bg-emerald-950/70',
        borderColor: 'border-emerald-500/50',
        icon: '🔥'
      };
    case 'HIGH':
      return {
        label: 'High Confidence',
        badgeText: 'High',
        textColor: 'text-teal-300',
        bgColor: 'bg-teal-950/70',
        borderColor: 'border-teal-500/50',
        icon: '⭐'
      };
    case 'CONTENT':
      return {
        label: 'Content & Focused',
        badgeText: 'Content',
        textColor: 'text-blue-300',
        bgColor: 'bg-blue-950/70',
        borderColor: 'border-blue-500/50',
        icon: '👌'
      };
    case 'DISCONTENT':
      return {
        label: 'Discontent / Wavering',
        badgeText: 'Discontent',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-950/70',
        borderColor: 'border-amber-500/50',
        icon: '⚠️'
      };
    case 'FRUSTRATED':
    default:
      return {
        label: 'Frustrated / Low Morale',
        badgeText: 'Frustrated',
        textColor: 'text-rose-400',
        bgColor: 'bg-rose-950/70',
        borderColor: 'border-rose-500/50',
        icon: '⚡'
      };
  }
}

/**
 * Calculates in-game rating modifier from current morale score (-3 to +3 OVR)
 */
export function getConfidenceModifier(score: number): number {
  if (score >= 90) return 2.5;
  if (score >= 82) return 1.5;
  if (score >= 74) return 1.0;
  if (score >= 58) return 0;
  if (score >= 46) return -1.0;
  if (score >= 35) return -2.0;
  return -3.0;
}

/**
 * Initializes or ensures player morale state structure is populated
 */
export function initPlayerMoraleState(player: Player): PlayerMoraleState {
  const score = typeof player.morale === 'number' ? Math.max(10, Math.min(100, player.morale)) : 82;
  const tier = getMoraleTier(score);
  const confidenceModifier = getConfidenceModifier(score);

  if (player.moraleState) {
    player.moraleState.score = score;
    player.moraleState.tier = tier;
    player.moraleState.confidenceModifier = confidenceModifier;
    if (!player.moraleState.recentLogs) player.moraleState.recentLogs = [];
    return player.moraleState;
  }

  const initialLogs: MoraleLogEntry[] = [
    {
      category: 'ROLE_SATISFACTION',
      title: `Contracted as ${player.squadRole || 'First XV'}`,
      delta: 0,
      timestamp: 'Pre-Season Baseline'
    }
  ];

  const state: PlayerMoraleState = {
    score,
    tier,
    confidenceModifier,
    description: `${getMoraleVisuals(tier).label} (${score}%)`,
    recentLogs: initialLogs,
    consecutiveStarts: 1,
    consecutiveBenched: 0,
    consecutiveOmitted: 0
  };

  player.morale = score;
  player.moraleState = state;
  return state;
}

function addMoraleLog(state: PlayerMoraleState, entry: MoraleLogEntry) {
  if (!state.recentLogs) state.recentLogs = [];
  state.recentLogs.unshift(entry);
  if (state.recentLogs.length > 8) {
    state.recentLogs = state.recentLogs.slice(0, 8);
  }
}

/**
 * 1. MATCH PERFORMANCE MORALE FACTOR
 * Individual match contributions, rating, tries, turnovers, and discipline
 */
export function applyMatchPerformanceMorale(
  player: Player,
  matchStat: InMatchPlayerStats,
  roundNumber?: number
): number {
  const mState = initPlayerMoraleState(player);
  let totalDelta = 0;
  const timeLabel = roundNumber ? `Round ${roundNumber} Match` : 'Recent Match';

  // A. Match Rating impact
  const rating = matchStat.rating || 6.5;
  if (rating >= 8.5) {
    const d = 6;
    totalDelta += d;
    addMoraleLog(mState, {
      category: 'PERFORMANCE',
      title: `Man of the Match display (Rating: ${rating.toFixed(1)})`,
      delta: d,
      timestamp: timeLabel
    });
  } else if (rating >= 7.6) {
    const d = 4;
    totalDelta += d;
    addMoraleLog(mState, {
      category: 'PERFORMANCE',
      title: `Excellent match performance (${rating.toFixed(1)})`,
      delta: d,
      timestamp: timeLabel
    });
  } else if (rating >= 6.8) {
    const d = 2;
    totalDelta += d;
    addMoraleLog(mState, {
      category: 'PERFORMANCE',
      title: `Solid shift in the jersey (${rating.toFixed(1)})`,
      delta: d,
      timestamp: timeLabel
    });
  } else if (rating <= 5.8) {
    const d = -4;
    totalDelta += d;
    addMoraleLog(mState, {
      category: 'PERFORMANCE',
      title: `Difficult match with unforced errors (${rating.toFixed(1)})`,
      delta: d,
      timestamp: timeLabel
    });
  } else if (rating <= 5.0) {
    const d = -7;
    totalDelta += d;
    addMoraleLog(mState, {
      category: 'PERFORMANCE',
      title: `Costly mistakes and subpar display (${rating.toFixed(1)})`,
      delta: d,
      timestamp: timeLabel
    });
  }

  // B. Try scoring bonus
  if (matchStat.tries > 0) {
    const d = Math.min(6, matchStat.tries * 3);
    totalDelta += d;
    addMoraleLog(mState, {
      category: 'PERFORMANCE',
      title: `Scored ${matchStat.tries} try${matchStat.tries > 1 ? 'ies' : ''} for the team!`,
      delta: d,
      timestamp: timeLabel
    });
  }

  // C. Turnover jackal bonus
  if (matchStat.turnoversWon >= 2) {
    const d = 3;
    totalDelta += d;
    addMoraleLog(mState, {
      category: 'PERFORMANCE',
      title: `Breakdown dominance: ${matchStat.turnoversWon} jackal turnovers won`,
      delta: d,
      timestamp: timeLabel
    });
  }

  // D. Disciplinary Penalties
  if (matchStat.redCard) {
    const d = -12;
    totalDelta += d;
    addMoraleLog(mState, {
      category: 'PERFORMANCE',
      title: 'Devastated by red card dismissal',
      delta: d,
      timestamp: timeLabel
    });
  } else if (matchStat.yellowCard) {
    const d = -5;
    totalDelta += d;
    addMoraleLog(mState, {
      category: 'PERFORMANCE',
      title: 'Guilty of sin bin yellow card offence',
      delta: d,
      timestamp: timeLabel
    });
  }

  // Update score
  player.morale = Math.max(15, Math.min(100, player.morale + totalDelta));
  mState.score = player.morale;
  mState.tier = getMoraleTier(player.morale);
  mState.confidenceModifier = getConfidenceModifier(player.morale);
  mState.description = `${getMoraleVisuals(mState.tier).label} (${player.morale}%)`;

  return totalDelta;
}

/**
 * 2. TEAM RESULTS MORALE FACTOR
 * Match outcomes (Win, Draw, Loss, Derby Rivalries, Blowout margins)
 */
export function applyTeamResultMorale(
  player: Player,
  context: {
    userWon: boolean;
    isDraw: boolean;
    scoreDiff: number;
    isRivalry: boolean;
    participated: boolean;
    roundNumber?: number;
    winStreak?: number;
    lossStreak?: number;
  }
): number {
  const mState = initPlayerMoraleState(player);
  let delta = 0;
  const timeLabel = context.roundNumber ? `Round ${context.roundNumber}` : 'Matchday';

  if (context.userWon) {
    // Win
    const baseWin = context.participated ? 4 : 2;
    delta += baseWin;

    let winText = context.participated ? 'Victory celebrated on pitch' : 'Team spirit lifted by squad victory';

    if (context.isRivalry) {
      delta += 3;
      winText = 'Historic derby victory over arch-rivals!';
    } else if (context.scoreDiff >= 15) {
      delta += 2;
      winText = 'Dominant bonus-point blowout triumph';
    }

    if (context.winStreak && context.winStreak >= 3) {
      delta += 2;
      winText += ` (${context.winStreak}-game win streak!)`;
    }

    addMoraleLog(mState, {
      category: 'TEAM_RESULT',
      title: winText,
      delta,
      timestamp: timeLabel
    });
  } else if (context.isDraw) {
    delta += context.participated ? 1 : 0;
    addMoraleLog(mState, {
      category: 'TEAM_RESULT',
      title: 'Hard-fought draw on matchday',
      delta,
      timestamp: timeLabel
    });
  } else {
    // Loss
    const baseLoss = context.participated ? -4 : -2;
    delta += baseLoss;

    let lossText = context.participated ? 'Stung by tough match defeat' : 'Disappointed by team loss';

    if (context.isRivalry) {
      delta -= 3;
      lossText = 'Painful derby defeat against arch-rivals';
    } else if (context.scoreDiff >= 18) {
      delta -= 2;
      lossText = 'Heavy blowout defeat hurts morale';
    }

    if (context.lossStreak && context.lossStreak >= 3) {
      delta -= 2;
      lossText += ` (Frustration during ${context.lossStreak}-game slide)`;
    }

    addMoraleLog(mState, {
      category: 'TEAM_RESULT',
      title: lossText,
      delta,
      timestamp: timeLabel
    });
  }

  player.morale = Math.max(15, Math.min(100, player.morale + delta));
  mState.score = player.morale;
  mState.tier = getMoraleTier(player.morale);
  mState.confidenceModifier = getConfidenceModifier(player.morale);
  mState.description = `${getMoraleVisuals(mState.tier).label} (${player.morale}%)`;

  return delta;
}

/**
 * 3. ROTATION STATUS & SQUAD ROLE MORALE FACTOR
 * Weekly playing time, consecutive omissions, rest management, and contract role expectations
 */
export function applyWeeklyRotationMorale(
  player: Player,
  context: {
    wasStarted: boolean;
    wasBenched: boolean;
    wasOmitted: boolean;
    isInjured: boolean;
    isFatigued: boolean;
    isRested: boolean;
    roundNumber?: number;
  }
): number {
  const mState = initPlayerMoraleState(player);
  let delta = 0;
  const timeLabel = context.roundNumber ? `Week ${context.roundNumber}` : 'Weekly Rotation';
  const role = player.squadRole || 'First XV';

  // Update consecutive tracking
  if (context.wasStarted) {
    mState.consecutiveStarts = (mState.consecutiveStarts || 0) + 1;
    mState.consecutiveBenched = 0;
    mState.consecutiveOmitted = 0;
  } else if (context.wasBenched) {
    mState.consecutiveStarts = 0;
    mState.consecutiveBenched = (mState.consecutiveBenched || 0) + 1;
    mState.consecutiveOmitted = 0;
  } else {
    mState.consecutiveStarts = 0;
    mState.consecutiveBenched = 0;
    mState.consecutiveOmitted = (mState.consecutiveOmitted || 0) + 1;
  }

  // A. Rest & Recovery Satisfaction
  if (context.isRested) {
    delta += 3;
    addMoraleLog(mState, {
      category: 'REST',
      title: 'Grateful for tactical recovery rest',
      delta: 3,
      timestamp: timeLabel
    });
  } else if (context.isInjured) {
    // Injured players understand being sidelined
    delta += 0;
  } else if (context.isFatigued && context.wasOmitted) {
    // Omitted due to high fatigue (>60)
    delta += 1;
    addMoraleLog(mState, {
      category: 'REST',
      title: 'Appreciates workload rotation while fatigued',
      delta: 1,
      timestamp: timeLabel
    });
  } else {
    // Normal healthy rotation check based on Squad Role
    switch (role) {
      case 'Key Player':
        if (context.wasStarted) {
          delta += 1;
          // Started regularly
        } else if (context.wasBenched) {
          delta -= 3;
          addMoraleLog(mState, {
            category: 'ROTATION',
            title: 'Frustrated being named on bench as Key Player',
            delta: -3,
            timestamp: timeLabel
          });
        } else if (context.wasOmitted) {
          const penalty = mState.consecutiveOmitted > 1 ? -6 : -4;
          delta += penalty;
          addMoraleLog(mState, {
            category: 'ROTATION',
            title: `Unhappy to be completely omitted from matchday 23 (${mState.consecutiveOmitted} wk)`,
            delta: penalty,
            timestamp: timeLabel
          });
        }
        break;

      case 'First XV':
        if (context.wasStarted) {
          delta += 1;
        } else if (context.wasBenched) {
          if (mState.consecutiveBenched >= 2) {
            delta -= 2;
            addMoraleLog(mState, {
              category: 'ROTATION',
              title: 'Wants to reclaim starting spot after bench spells',
              delta: -2,
              timestamp: timeLabel
            });
          }
        } else if (context.wasOmitted) {
          delta -= 4;
          addMoraleLog(mState, {
            category: 'ROTATION',
            title: 'Disappointed to miss out on matchday squad',
            delta: -4,
            timestamp: timeLabel
          });
        }
        break;

      case 'Squad Rotation':
        if (context.wasStarted) {
          delta += 4;
          addMoraleLog(mState, {
            category: 'ROTATION',
            title: 'Delighted with Starting XV selection',
            delta: 4,
            timestamp: timeLabel
          });
        } else if (context.wasBenched) {
          delta += 1;
        } else if (context.wasOmitted && mState.consecutiveOmitted >= 3) {
          delta -= 3;
          addMoraleLog(mState, {
            category: 'ROTATION',
            title: `Seeking more matchday involvement (${mState.consecutiveOmitted} wks out)`,
            delta: -3,
            timestamp: timeLabel
          });
        }
        break;

      case 'Reserve':
      case 'Youth Prospect':
      default:
        if (context.wasStarted) {
          delta += 6;
          addMoraleLog(mState, {
            category: 'ROTATION',
            title: 'Thrilled to receive start in First Team!',
            delta: 6,
            timestamp: timeLabel
          });
        } else if (context.wasBenched) {
          delta += 4;
          addMoraleLog(mState, {
            category: 'ROTATION',
            title: 'Excited by inclusion in matchday 23',
            delta: 4,
            timestamp: timeLabel
          });
        }
        break;
    }
  }

  // Update score
  player.morale = Math.max(15, Math.min(100, player.morale + delta));
  mState.score = player.morale;
  mState.tier = getMoraleTier(player.morale);
  mState.confidenceModifier = getConfidenceModifier(player.morale);
  mState.description = `${getMoraleVisuals(mState.tier).label} (${player.morale}%)`;

  return delta;
}

/**
 * Returns full diagnostic breakdown of player's morale status
 */
export function getPlayerMoraleSummary(player: Player): {
  score: number;
  tier: MoraleTier;
  confidenceModifier: number;
  label: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  icon: string;
  recentLogs: MoraleLogEntry[];
} {
  const mState = initPlayerMoraleState(player);
  const visuals = getMoraleVisuals(mState.tier);

  return {
    score: mState.score,
    tier: mState.tier,
    confidenceModifier: mState.confidenceModifier,
    label: visuals.label,
    badgeBg: visuals.bgColor,
    badgeBorder: visuals.borderColor,
    textColor: visuals.textColor,
    icon: visuals.icon,
    recentLogs: mState.recentLogs || []
  };
}
