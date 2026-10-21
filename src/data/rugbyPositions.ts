import { RugbyPosition } from '../types/rugby';

export const NATURAL_SECONDARY_POSITIONS: Record<RugbyPosition, RugbyPosition[]> = {
  LH_PROP: ['TH_PROP', 'HOOKER'],
  HOOKER: ['LH_PROP', 'TH_PROP'],
  TH_PROP: ['LH_PROP', 'HOOKER'],
  LOCK_4: ['LOCK_5', 'BLINDSIDE_FLANKER'],
  LOCK_5: ['LOCK_4', 'BLINDSIDE_FLANKER'],
  BLINDSIDE_FLANKER: ['NUMBER_8', 'OPENSIDE_FLANKER'],
  OPENSIDE_FLANKER: ['BLINDSIDE_FLANKER', 'NUMBER_8'],
  NUMBER_8: ['BLINDSIDE_FLANKER', 'OPENSIDE_FLANKER'],
  SCRUM_HALF: ['FLY_HALF', 'RIGHT_WING'],
  FLY_HALF: ['INSIDE_CENTRE', 'FULLBACK'],
  LEFT_WING: ['RIGHT_WING', 'FULLBACK'],
  INSIDE_CENTRE: ['OUTSIDE_CENTRE', 'FLY_HALF'],
  OUTSIDE_CENTRE: ['INSIDE_CENTRE', 'RIGHT_WING'],
  RIGHT_WING: ['LEFT_WING', 'FULLBACK'],
  FULLBACK: ['LEFT_WING', 'RIGHT_WING']
};

export function getNaturalSecondaryPositions(pos: RugbyPosition): RugbyPosition[] {
  return NATURAL_SECONDARY_POSITIONS[pos] ? [...NATURAL_SECONDARY_POSITIONS[pos]] : ['FULLBACK'];
}

export function ensurePlayerHasMinimumPositions<T extends { primaryPosition: RugbyPosition; secondaryPositions: RugbyPosition[] }>(player: T): T {
  const natural = getNaturalSecondaryPositions(player.primaryPosition);
  if (!player.secondaryPositions || player.secondaryPositions.length === 0) {
    player.secondaryPositions = [...natural];
    return player;
  }
  // Remove any position that matches primary
  player.secondaryPositions = player.secondaryPositions.filter(p => p !== player.primaryPosition);
  if (player.secondaryPositions.length === 0) {
    player.secondaryPositions = [...natural];
  }
  return player;
}
