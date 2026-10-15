import {
  Player,
  RugbyPosition,
  isFrontRow,
  MatchSelection
} from '../types/rugby';
import { checkPositionalEligibility, PositionalEligibilityResult } from './playerRatingService';

export interface SubstitutionCandidate {
  player: Player;
  eligibility: PositionalEligibilityResult;
  fitnessScore: number;
  overallScore: number;
  isBestRecommendation: boolean;
  isLegalFrontRowCover: boolean;
}

export interface SubstitutionValidationResult {
  valid: boolean;
  reason?: string;
  isFrontRowIssue?: boolean;
  isCrossUnitHybrid?: boolean;
  suggestedAction?: string;
}

export const MAX_MATCH_SUBSTITUTIONS = 8;

export class SubstitutionService {
  /**
   * Evaluates if a substitution from on-pitch player to bench replacement is valid under World Rugby laws.
   */
  public static validateSubstitution(params: {
    offPlayer: Player;
    onPlayer: Player;
    targetPosition: RugbyPosition;
    currentSubstitutionsUsed: number;
    alreadySubstitutedOffIds: string[];
    activeOnPitchPlayerIds: string[];
    isFrontRowPosition?: boolean;
  }): SubstitutionValidationResult {
    const {
      offPlayer,
      onPlayer,
      targetPosition,
      currentSubstitutionsUsed,
      alreadySubstitutedOffIds,
      activeOnPitchPlayerIds
    } = params;

    // 1. Substitution count limit (Max 8 in official rugby union)
    if (currentSubstitutionsUsed >= MAX_MATCH_SUBSTITUTIONS) {
      return {
        valid: false,
        reason: `Maximum match substitutions reached (${MAX_MATCH_SUBSTITUTIONS}/8 used). World Rugby laws prohibit further tactical replacements.`
      };
    }

    // 2. Check if onPlayer is already on the pitch
    if (activeOnPitchPlayerIds.includes(onPlayer.id)) {
      return {
        valid: false,
        reason: `${onPlayer.name} is already active on the pitch. A player cannot occupy two positions simultaneously.`
      };
    }

    // 3. Check if onPlayer was previously substituted off (cannot return under standard tactical laws)
    if (alreadySubstitutedOffIds.includes(onPlayer.id)) {
      return {
        valid: false,
        reason: `${onPlayer.name} was previously replaced and cannot legally return to the field.`
      };
    }

    // 4. Check if onPlayer is injured or suspended
    if (onPlayer.injury) {
      return {
        valid: false,
        reason: `${onPlayer.name} is unavailable due to medical injury (${onPlayer.injury.name}).`
      };
    }

    // 5. Strict Positional & Front-Row Safety Check
    const eligibility = checkPositionalEligibility(onPlayer, targetPosition);
    if (!eligibility.eligible) {
      return {
        valid: false,
        reason: eligibility.reason || `Illegal position: ${onPlayer.name} cannot legally play as ${targetPosition}.`,
        isFrontRowIssue: eligibility.isFrontRowWarning
      };
    }

    // 6. Check Front-Row World Rugby Law 3: If target is Prop/Hooker, replacement must have certified front-row ability
    if (isFrontRow(targetPosition)) {
      const isCertified = isFrontRow(onPlayer.primaryPosition) ||
        (onPlayer.secondaryPositions && onPlayer.secondaryPositions.some(p => isFrontRow(p)));

      if (!isCertified) {
        return {
          valid: false,
          isFrontRowIssue: true,
          reason: `World Rugby Safety Law: ${targetPosition.replace('_', ' ')} requires a certified specialist front-row forward.`
        };
      }
    }

    return {
      valid: true,
      isCrossUnitHybrid: eligibility.isHybrid
    };
  }

  /**
   * Ranks available bench players for an outgoing player's position, highlighting the best choice.
   */
  public static getRankedReplacements(params: {
    targetPosition: RugbyPosition;
    benchPlayers: Player[];
    activeOnPitchPlayerIds: string[];
    alreadySubstitutedOffIds: string[];
  }): SubstitutionCandidate[] {
    const { targetPosition, benchPlayers, activeOnPitchPlayerIds, alreadySubstitutedOffIds } = params;

    const available = benchPlayers.filter(
      p => !activeOnPitchPlayerIds.includes(p.id) &&
           !alreadySubstitutedOffIds.includes(p.id) &&
           !p.injury
    );

    const candidates: SubstitutionCandidate[] = available.map(player => {
      const eligibility = checkPositionalEligibility(player, targetPosition);
      const isLegalFrontRow = isFrontRow(targetPosition)
        ? (isFrontRow(player.primaryPosition) || (player.secondaryPositions || []).some(p => isFrontRow(p)))
        : true;

      // Overall composite score combining positional suitability, fitness, and ability
      const fitnessMultiplier = player.fitness / 100;
      const compositeScore = eligibility.eligible && isLegalFrontRow
        ? (eligibility.effectiveRating * 0.55) + (eligibility.suitabilityScore * 0.25) + (player.fitness * 0.20)
        : 0;

      return {
        player,
        eligibility,
        fitnessScore: player.fitness,
        overallScore: Math.round(compositeScore),
        isBestRecommendation: false,
        isLegalFrontRowCover: isLegalFrontRow
      };
    });

    // Sort by eligible descending, then overall score descending
    candidates.sort((a, b) => {
      if (a.eligibility.eligible !== b.eligibility.eligible) {
        return a.eligibility.eligible ? -1 : 1;
      }
      return b.overallScore - a.overallScore;
    });

    // Mark the top eligible candidate as best recommendation
    const firstEligible = candidates.find(c => c.eligibility.eligible && c.isLegalFrontRowCover);
    if (firstEligible) {
      firstEligible.isBestRecommendation = true;
    }

    return candidates;
  }

  /**
   * Validates a complete Starting XV and Bench selection according to official rugby regulations.
   */
  public static validateTeamSheet(
    lineup: MatchSelection,
    allClubPlayers: Player[]
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const playerMap = new Map(allClubPlayers.map(p => [p.id, p]));

    // Check all 15 starting positions are filled
    const startingIds = new Set<string>();
    for (let jersey = 1; jersey <= 15; jersey++) {
      const pid = lineup.startingXV[jersey];
      if (!pid) {
        errors.push(`Starting jersey #${jersey} is unassigned.`);
      } else {
        if (startingIds.has(pid)) {
          const p = playerMap.get(pid);
          errors.push(`Duplicate player: ${p?.name || pid} is selected in multiple positions.`);
        }
        startingIds.add(pid);
      }
    }

    // Check bench players (16 to 23)
    const benchIds = new Set<string>();
    for (let jersey = 16; jersey <= 23; jersey++) {
      const pid = lineup.bench[jersey];
      if (pid) {
        if (startingIds.has(pid)) {
          const p = playerMap.get(pid);
          errors.push(`Player ${p?.name || pid} is in both starting XV and bench.`);
        }
        if (benchIds.has(pid)) {
          const p = playerMap.get(pid);
          errors.push(`Duplicate player on bench: ${p?.name || pid}.`);
        }
        benchIds.add(pid);
      }
    }

    // World Rugby Law 3: Front-row cover verification
    // Bench must include prop and hooker cover
    const benchProps = Array.from(benchIds)
      .map(id => playerMap.get(id))
      .filter(p => p && (p.primaryPosition === 'LH_PROP' || p.primaryPosition === 'TH_PROP' || (p.secondaryPositions || []).includes('LH_PROP') || (p.secondaryPositions || []).includes('TH_PROP')));

    const benchHookers = Array.from(benchIds)
      .map(id => playerMap.get(id))
      .filter(p => p && (p.primaryPosition === 'HOOKER' || (p.secondaryPositions || []).includes('HOOKER')));

    if (benchProps.length < 2) {
      warnings.push('Front-row cover: Regulation squad requires at least 2 replacement props on the bench.');
    }
    if (benchHookers.length < 1) {
      warnings.push('Hooker cover: Regulation squad requires at least 1 replacement hooker on the bench.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
