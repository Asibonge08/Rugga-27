import React, { useState } from 'react';
import { Player, HybridStatus, RugbyPosition, InjuryRecord } from '../types/rugby';
import { getPositionName, getPositionShort } from '../data/rugbyDatabase';
import { useCurrency } from '../services/currencyService';
import {
  X,
  Shield,
  Activity,
  Heart,
  Award,
  Zap,
  Sparkles,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  Flame,
  FileText,
  Clock,
  Target,
  Sliders,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart2,
  Star,
  Gauge
} from 'lucide-react';
import { PlayerEditModal } from './PlayerEditModal';
import { careerManager } from '../services/careerManager';
import { soundFx } from '../services/soundFx';
import {
  deriveLastSeasonStats,
  calculatePerformanceRating,
  recalculatePlayerRating,
  getRatingTier
} from '../services/playerRatingService';

interface PlayerProfileModalProps {
  player: Player | null;
  clubCountry?: string;
  playerList?: Player[];
  onSavePlayer?: (updated: Player) => void;
  onEdit?: (player: Player) => void;
  onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  player: initialPlayer,
  clubCountry,
  playerList,
  onSavePlayer,
  onEdit,
  onClose
}) => {
  const { formatMoney } = useCurrency(clubCountry);
  const [activeTab, setActiveTab] = useState<'attributes' | 'stats' | 'injuries' | 'hybrid'>('attributes');
  const [activePlayer, setActivePlayer] = useState<Player | null>(initialPlayer);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [recalcNotice, setRecalcNotice] = useState<string | null>(null);

  React.useEffect(() => {
    setActivePlayer(initialPlayer);
  }, [initialPlayer]);

  if (!activePlayer) return null;
  const player = activePlayer;

  // Fallback career stats if not pre-seeded
  const careerStats = player.careerStats || {
    totalCaps: Math.max(player.stats.matchesPlayed, (player.age - 19) * 11 + Math.floor(player.overall / 4)),
    triesScored: Math.max(player.stats.tries, Math.round(((player.age - 19) * 11 + Math.floor(player.overall / 4)) * (player.primaryPosition.includes('WING') ? 0.35 : player.primaryPosition.includes('FLANKER') ? 0.16 : 0.08))),
    conversionsAttempted: player.stats.conversions > 0 ? player.stats.conversions + 2 : player.primaryPosition === 'FLY_HALF' ? 45 : 0,
    conversionsMade: player.stats.conversions > 0 ? player.stats.conversions : player.primaryPosition === 'FLY_HALF' ? 37 : 0,
    conversionSuccessRate: player.primaryPosition === 'FLY_HALF' ? 82.2 : player.stats.conversions > 0 ? 80.0 : 0,
    penaltiesAttempted: player.primaryPosition === 'FLY_HALF' ? 32 : 0,
    penaltiesMade: player.primaryPosition === 'FLY_HALF' ? 26 : 0,
    penaltySuccessRate: player.primaryPosition === 'FLY_HALF' ? 81.3 : 0,
    totalPoints: Math.max(player.stats.points, player.primaryPosition === 'FLY_HALF' ? 245 : 45),
    tacklesMade: Math.max(player.stats.tacklesMade, (player.age - 19) * 95 + 140),
    turnoversWon: Math.max(player.stats.turnoversWon, (player.age - 19) * 14 + 18)
  };

  // Default seasonal injury history if empty
  const injuryHistory: InjuryRecord[] = player.injuryHistory && player.injuryHistory.length > 0
    ? player.injuryHistory
    : player.injury
    ? [
        {
          id: `inj_${player.id}_active`,
          name: player.injury.name,
          type: player.injury.type || 'Soft Tissue Strain',
          sustainedDate: 'Season 2025-26, Recent Match',
          durationWeeks: player.injury.weeksRemaining,
          severity: player.injury.weeksRemaining >= 4 ? 'SEVERE' : player.injury.weeksRemaining >= 2 ? 'MODERATE' : 'MINOR',
          recovered: false,
          notes: 'Currently undergoing active medical rehabilitation with club physiotherapists.'
        }
      ]
    : [
        {
          id: `inj_${player.id}_prev`,
          name: 'Hamstring Strain (Grade 1)',
          type: 'Soft Tissue',
          sustainedDate: 'Season 2024-25, Round 6',
          durationWeeks: 2,
          severity: 'MINOR',
          recovered: true,
          notes: 'Successfully recovered following progressive rehabilitation and return-to-play protocol.'
        }
      ];

  const hybridStatus: HybridStatus = player.hybridStatus || (
    player.hybridLevel === 'LEVEL_3_SPECIALIST' ? 'Level 3' :
    player.hybridLevel === 'LEVEL_2_CAPABLE' ? 'Level 2' :
    player.hybridLevel === 'LEVEL_1_LIMITED' ? 'Level 1' : 'No'
  );

  const approvedPositions = player.approvedPositions || player.approvedCrossUnitPositions || [];

  const lastSeason = deriveLastSeasonStats(player);
  const ratingData = calculatePerformanceRating(player);
  const ratingTier = getRatingTier(player.overall);
  const perfBreakdown = player.ratingBreakdown || ratingData.breakdown;
  const ratingDelta = perfBreakdown.overallDelta;

  const handleRecalculateRating = () => {
    soundFx.playWhistle('short');
    const updated = recalculatePlayerRating({ ...player });
    setActivePlayer(updated);
    careerManager.batchUpdatePlayers([updated.id], {
      potential: updated.potential
    });
    if (onSavePlayer) {
      onSavePlayer(updated);
    }
    const d = updated.ratingBreakdown?.overallDelta ?? 0;
    const dStr = d >= 0 ? `+${d}` : `${d}`;
    setRecalcNotice(`⚡ Recalculated: ${updated.overall} OVR (${dStr} from current season stats, last season stats & potential)`);
    setTimeout(() => setRecalcNotice(null), 4500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 text-neutral-100 shadow-2xl animate-in fade-in max-h-[92vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-800 mb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border-2 border-emerald-500/50 flex flex-col items-center justify-center font-heading font-black text-emerald-400 shrink-0 shadow-lg">
              <span className="text-xl leading-none">{player.overall}</span>
              <span className="text-[9px] uppercase tracking-wider text-emerald-300 font-semibold mt-0.5">OVR</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading font-bold text-lg sm:text-xl text-white tracking-wide">
                  {player.name}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-heading font-bold tracking-wider uppercase border ${ratingTier.badgeBg} ${ratingTier.color}`}>
                  {ratingTier.label}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-numbers font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                  POT {player.potential}
                </span>
                {ratingDelta !== 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-numbers font-bold flex items-center space-x-1 ${ratingDelta > 0 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60' : 'bg-red-950/80 text-red-300 border border-red-700/60'}`}>
                    {ratingDelta > 0 ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
                    <span>{ratingDelta > 0 ? `+${ratingDelta}` : ratingDelta} OVR</span>
                  </span>
                )}
                {hybridStatus !== 'No' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-heading font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 fill-current text-amber-400" />
                    <span>Hybrid {hybridStatus}</span>
                  </span>
                )}
                {player.injury && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/80 text-red-300 border border-red-800/60 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span>{player.injury.name} ({player.injury.weeksRemaining}w)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-1 flex flex-wrap items-center gap-1.5 font-mono-numbers">
                <span className="text-neutral-200 font-semibold">{getPositionName(player.primaryPosition)}</span>
                <span>·</span>
                <span>{player.nationality}</span>
                <span>·</span>
                <span>{player.age} yrs</span>
                <span>·</span>
                <span>{player.heightCm} cm</span>
                <span>·</span>
                <span>{player.weightKg} kg</span>
                {player.registrationCategory && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-400">{player.registrationCategory}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (onEdit) {
                  onEdit(player);
                } else {
                  setIsEditing(true);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/50 text-emerald-300 hover:text-white text-xs font-heading font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
              title="Edit Player Name, Positions & Stats"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit Player</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex border-b border-neutral-800 mb-4 gap-1 overflow-x-auto pb-1 text-xs font-heading font-bold tracking-wider">
          <button
            onClick={() => setActiveTab('attributes')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'attributes'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>ATTRIBUTES</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'stats'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>STATS & RATING ENGINE</span>
          </button>

          <button
            onClick={() => setActiveTab('injuries')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'injuries'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>INJURY HISTORY ({injuryHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('hybrid')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'hybrid'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>HYBRID & REGISTRY</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* TAB 1: ATTRIBUTES */}
          {activeTab === 'attributes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono-numbers">
                {Object.entries(player.attributes).map(([attr, val]) => (
                  <div key={attr} className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                    <div className="text-neutral-400 text-[10px] uppercase font-sans capitalize mb-1 truncate">
                      {attr.replace(/([A-Z])/g, ' $1')}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-neutral-100">{val}</span>
                      <div className="w-12 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, (val / 99) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Physical & Financial Profile */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <div>
                  <span className="text-neutral-400 text-[10px] uppercase block">Contract Expiry</span>
                  <span className="font-semibold text-neutral-200">{player.contractYearsLeft} Years Left</span>
                </div>
                <div>
                  <span className="text-neutral-400 text-[10px] uppercase block">Weekly Wage</span>
                  <span className="font-semibold text-emerald-400">{formatMoney(player.weeklyWage, { perWeek: true })}</span>
                </div>
                <div>
                  <span className="text-neutral-400 text-[10px] uppercase block">Market Value</span>
                  <span className="font-semibold text-neutral-200">{formatMoney(player.marketValue, { compact: true })}</span>
                </div>
                <div>
                  <span className="text-neutral-400 text-[10px] uppercase block">Squad Role</span>
                  <span className="font-semibold text-neutral-200">{player.squadRole}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STATS & RATING ENGINE */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              {/* Recalculate Toast Alert */}
              {recalcNotice && (
                <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-semibold flex items-center space-x-2 animate-in fade-in shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{recalcNotice}</span>
                </div>
              )}

              {/* Performance Rating Engine Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-emerald-500/30 shadow-xl space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-neutral-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="font-heading font-bold text-sm text-white tracking-wide uppercase">
                        Dynamic Performance Rating Engine
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Ratings adapt to current season match form, last season baseline pedigree, and potential ceiling.
                    </p>
                  </div>

                  <button
                    onClick={handleRecalculateRating}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs tracking-wider cursor-pointer shadow-md transition-all flex items-center space-x-1.5 shrink-0 self-start sm:self-auto"
                    title="Recalculate player rating now based on current stats, last season stats, and potential"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Recalculate Rating</span>
                  </button>
                </div>

                {/* 3 Pillars Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {/* Pillar 1: Current Season */}
                  <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1">
                        <Flame className="w-3 h-3 text-emerald-400" />
                        <span>This Season (25/26)</span>
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono-numbers font-bold ${
                        perfBreakdown.currentSeasonDelta >= 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'bg-red-950 text-red-300 border border-red-800/60'
                      }`}>
                        {perfBreakdown.currentSeasonDelta >= 0 ? `+${perfBreakdown.currentSeasonDelta}` : perfBreakdown.currentSeasonDelta} OVR
                      </span>
                    </div>
                    <div className="text-neutral-300 font-mono-numbers">
                      Avg Rating: <span className="text-emerald-400 font-bold">{player.stats.avgRating || '7.0'}</span> / 10
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono-numbers leading-relaxed">
                      {player.stats.matchesPlayed} matches · {player.stats.tries} tries · {player.stats.tacklesMade} tackles · {player.stats.turnoversWon} turnovers
                    </div>
                  </div>

                  {/* Pillar 2: Last Season */}
                  <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-blue-400 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-blue-400" />
                        <span>Last Season (24/25)</span>
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono-numbers font-bold ${
                        perfBreakdown.lastSeasonDelta >= 0 ? 'bg-blue-950 text-blue-300 border border-blue-800/60' : 'bg-neutral-800 text-neutral-300'
                      }`}>
                        {perfBreakdown.lastSeasonDelta >= 0 ? `+${perfBreakdown.lastSeasonDelta}` : perfBreakdown.lastSeasonDelta} OVR
                      </span>
                    </div>
                    <div className="text-neutral-300 font-mono-numbers">
                      Pedigree Form: <span className="text-blue-400 font-bold">{lastSeason.avgRating}</span> / 10
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono-numbers leading-relaxed">
                      {lastSeason.matchesPlayed} appearances · {lastSeason.tries} tries · {lastSeason.tacklesMade} tackles · {lastSeason.turnoversWon} turnovers
                    </div>
                  </div>

                  {/* Pillar 3: Potential Vector */}
                  <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
                        <Star className="w-3 h-3 text-amber-400" />
                        <span>Potential Vector</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-numbers font-bold bg-amber-950 text-amber-300 border border-amber-800/60">
                        {perfBreakdown.potentialFactor >= 0 ? `+${perfBreakdown.potentialFactor}` : perfBreakdown.potentialFactor} OVR
                      </span>
                    </div>
                    <div className="text-neutral-300 font-mono-numbers">
                      Ceiling: <span className="text-amber-400 font-bold">{player.potential} POT</span> ({Math.max(0, player.potential - perfBreakdown.baseRating)} pts headroom)
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono-numbers leading-relaxed">
                      Age {player.age} · {player.age <= 22 ? 'Accelerated Youth Prodigy' : player.age <= 26 ? 'Prime Development Window' : 'Established Veteran Master'}
                    </div>
                  </div>
                </div>

                {/* Rating Equalizer Formula Bar */}
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono-numbers">
                  <div className="flex flex-wrap items-center gap-1.5 text-neutral-300">
                    <span className="text-neutral-400">Base Caliber:</span>
                    <span className="font-bold text-white">{perfBreakdown.baseRating}</span>
                    <span className="text-neutral-500">+</span>
                    <span className="text-neutral-400">This Season:</span>
                    <span className="font-bold text-emerald-400">{perfBreakdown.currentSeasonDelta >= 0 ? `+${perfBreakdown.currentSeasonDelta}` : perfBreakdown.currentSeasonDelta}</span>
                    <span className="text-neutral-500">+</span>
                    <span className="text-neutral-400">Last Season:</span>
                    <span className="font-bold text-blue-400">{perfBreakdown.lastSeasonDelta >= 0 ? `+${perfBreakdown.lastSeasonDelta}` : perfBreakdown.lastSeasonDelta}</span>
                    <span className="text-neutral-500">+</span>
                    <span className="text-neutral-400">Potential Vector:</span>
                    <span className="font-bold text-amber-400">{perfBreakdown.potentialFactor >= 0 ? `+${perfBreakdown.potentialFactor}` : perfBreakdown.potentialFactor}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-neutral-400">=</span>
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-600/30 border border-emerald-500 text-emerald-300 font-black text-sm">
                      {player.overall} OVR
                    </div>
                  </div>
                </div>

                {/* Stat Factor Highlights */}
                {perfBreakdown.statHighlights && perfBreakdown.statHighlights.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-neutral-400 block">
                      Active Performance Contributors:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {perfBreakdown.statHighlights.map((hl, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 flex items-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{hl}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-Season Performance Matrix Table */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-neutral-200 flex items-center space-x-1.5">
                    <BarChart2 className="w-4 h-4 text-emerald-400" />
                    <span>Multi-Season Statistical Matrix</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono-numbers">
                    Current (25/26) vs Last (24/25) vs Career
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono-numbers">
                    <thead>
                      <tr className="border-b border-neutral-800 text-[10px] uppercase font-sans text-neutral-400">
                        <th className="py-2 px-2.5">Performance Metric</th>
                        <th className="py-2 px-2.5 text-center text-emerald-400">Current (2025–26)</th>
                        <th className="py-2 px-2.5 text-center text-blue-400">Last Season (2024–25)</th>
                        <th className="py-2 px-2.5 text-center text-amber-400">Career Record</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900 text-neutral-300">
                      <tr>
                        <td className="py-2 px-2.5 font-sans font-medium text-neutral-200">Matches Played / Caps</td>
                        <td className="py-2 px-2.5 text-center font-bold text-white">{player.stats.matchesPlayed}</td>
                        <td className="py-2 px-2.5 text-center text-neutral-300">{lastSeason.matchesPlayed}</td>
                        <td className="py-2 px-2.5 text-center text-amber-300 font-bold">{careerStats.totalCaps}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 font-sans font-medium text-neutral-200">Tries Scored</td>
                        <td className="py-2 px-2.5 text-center font-bold text-emerald-400">{player.stats.tries}</td>
                        <td className="py-2 px-2.5 text-center text-neutral-300">{lastSeason.tries}</td>
                        <td className="py-2 px-2.5 text-center text-amber-300 font-bold">{careerStats.triesScored}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 font-sans font-medium text-neutral-200">Tackles Completed</td>
                        <td className="py-2 px-2.5 text-center font-bold text-emerald-400">{player.stats.tacklesMade}</td>
                        <td className="py-2 px-2.5 text-center text-neutral-300">{lastSeason.tacklesMade}</td>
                        <td className="py-2 px-2.5 text-center text-amber-300 font-bold">{careerStats.tacklesMade}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 font-sans font-medium text-neutral-200">Turnovers Won</td>
                        <td className="py-2 px-2.5 text-center font-bold text-emerald-400">{player.stats.turnoversWon}</td>
                        <td className="py-2 px-2.5 text-center text-neutral-300">{lastSeason.turnoversWon}</td>
                        <td className="py-2 px-2.5 text-center text-amber-300 font-bold">{careerStats.turnoversWon}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 font-sans font-medium text-neutral-200">Metres Carried</td>
                        <td className="py-2 px-2.5 text-center font-bold text-white">{player.stats.metresCarried}m</td>
                        <td className="py-2 px-2.5 text-center text-neutral-300">{lastSeason.metresCarried}m</td>
                        <td className="py-2 px-2.5 text-center text-neutral-400">—</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 font-sans font-medium text-neutral-200">Total Points Scored</td>
                        <td className="py-2 px-2.5 text-center font-bold text-white">{player.stats.points}</td>
                        <td className="py-2 px-2.5 text-center text-neutral-300">{lastSeason.points}</td>
                        <td className="py-2 px-2.5 text-center text-amber-300 font-bold">{careerStats.totalPoints}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 font-sans font-medium text-neutral-200">Avg Match Rating / Form</td>
                        <td className="py-2 px-2.5 text-center font-bold text-emerald-400">{player.stats.avgRating || '7.0'}</td>
                        <td className="py-2 px-2.5 text-center text-blue-400 font-bold">{lastSeason.avgRating}</td>
                        <td className="py-2 px-2.5 text-center text-neutral-400">—</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 font-sans font-medium text-neutral-200">Discipline Record</td>
                        <td className="py-2 px-2.5 text-center text-amber-400">{player.stats.yellowCards}Y · {player.stats.redCards}R</td>
                        <td className="py-2 px-2.5 text-center text-neutral-400">{lastSeason.yellowCards}Y · {lastSeason.redCards}R</td>
                        <td className="py-2 px-2.5 text-center text-neutral-400">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Key Career Milestones Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono-numbers">
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                  <div className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider mb-0.5">Total Caps</div>
                  <div className="font-heading font-black text-xl text-emerald-400 font-mono-numbers">
                    {careerStats.totalCaps}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Club & Test</div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                  <div className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider mb-0.5">Tries Scored</div>
                  <div className="font-heading font-black text-xl text-amber-400 font-mono-numbers">
                    {careerStats.triesScored}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Career Finishes</div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                  <div className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider mb-0.5">Kicking Accuracy</div>
                  <div className="font-heading font-black text-xl text-blue-400 font-mono-numbers">
                    {careerStats.conversionsAttempted > 0 ? `${careerStats.conversionSuccessRate}%` : 'N/A'}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    {careerStats.conversionsAttempted > 0 ? `${careerStats.conversionsMade}/${careerStats.conversionsAttempted}` : 'Non-kicker'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                  <div className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider mb-0.5">Turnovers Won</div>
                  <div className="font-heading font-black text-xl text-purple-400 font-mono-numbers">
                    {careerStats.turnoversWon}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Breakdown Wins</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INJURY HISTORY PANEL */}
          {activeTab === 'injuries' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 flex items-start justify-between">
                <div>
                  <div className="text-xs font-heading font-bold uppercase tracking-wider text-red-400 flex items-center space-x-1.5">
                    <Activity className="w-4 h-4 text-red-400" />
                    <span>Medical Profile & Injury Surveillance</span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1">
                    Records all trauma, soft tissue injuries, HIA concussions, and time lost during regular and tournament play.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-neutral-400 uppercase">Current Medical Status</div>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    player.injury
                      ? 'bg-red-950 text-red-300 border border-red-700'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {player.injury ? `Injured (${player.injury.weeksRemaining}w left)` : '✓ Fit & Available'}
                  </span>
                </div>
              </div>

              {/* Injury Log Table */}
              <div className="space-y-2">
                <span className="text-[11px] font-heading font-bold text-neutral-400 uppercase tracking-wider block">
                  Logged Injury Incidents ({injuryHistory.length})
                </span>

                {injuryHistory.map(inj => (
                  <div
                    key={inj.id}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-heading font-bold text-neutral-100">{inj.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          inj.severity === 'SEVERE'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : inj.severity === 'MODERATE'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}>
                          {inj.severity}
                        </span>
                        {inj.recovered ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/60 font-medium">
                            ✓ Recovered
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-900/60 font-medium animate-pulse">
                            Active Rehab
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center space-x-2 font-mono-numbers">
                        <span>Classification: <strong className="text-neutral-300 font-sans">{inj.type}</strong></span>
                        <span>·</span>
                        <span>Sustained: {inj.sustainedDate}</span>
                      </div>
                      {inj.notes && (
                        <p className="text-[11px] text-neutral-400 italic">"{inj.notes}"</p>
                      )}
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="text-[10px] text-neutral-400 uppercase font-sans">Duration</div>
                      <div className="font-heading font-bold text-sm text-amber-400 font-mono-numbers">
                        {inj.durationWeeks} {inj.durationWeeks === 1 ? 'Week' : 'Weeks'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HYBRID & URC REGISTRATION METADATA */}
          {activeTab === 'hybrid' && (
            <div className="space-y-4 text-xs">
              {/* Hybrid Status Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-neutral-950 to-neutral-950 border border-amber-500/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-amber-400 font-heading font-bold text-sm">
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span>Hybrid Versatility Classification</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-heading font-bold uppercase ${
                    hybridStatus !== 'No'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                  }`}>
                    {hybridStatus !== 'No' ? `Hybrid: ${hybridStatus}` : 'Specialist (No Hybrid)'}
                  </span>
                </div>

                <p className="text-neutral-300 leading-relaxed mb-3">
                  {hybridStatus !== 'No'
                    ? `This athlete is verified as possessing legitimate cross-unit versatility between forwards and backs under Rugga 27's strict rugby research constitution.`
                    : `This player is a natural specialist. Under World Rugby rules, ordinary forwards cannot play in the backline, and ordinary backs cannot pack down in the scrum.`}
                </p>

                {/* Approved Positions Badges */}
                <div>
                  <span className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1.5">
                    Certified Eligible Positions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                      Primary: {getPositionName(player.primaryPosition)}
                    </span>
                    {player.secondaryPositions && player.secondaryPositions.map(sec => (
                      <span key={sec} className="px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 border border-blue-800 font-medium">
                        Secondary: {getPositionName(sec)}
                      </span>
                    ))}
                    {approvedPositions.map(app => (
                      <span key={app} className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 font-medium flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Hybrid Cover: {getPositionName(app)}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hybrid Evidence Metadata */}
                <div className="mt-3 pt-3 border-t border-neutral-800">
                  <span className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">
                    Researched Real-World Evidence
                  </span>
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 leading-relaxed italic">
                    {player.hybridEvidence || 'Standard squad member. Subject to standard World Rugby forward-back unit boundaries.'}
                  </div>
                </div>
              </div>

              {/* Official URC Registration Details */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-emerald-400">
                    Official Competition Registration
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono-numbers">Season 2025–26 & 2026–27</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase block">Category</span>
                    <span className="font-semibold text-neutral-200">{player.registrationCategory || 'Senior Contracted'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase block">Verification Status</span>
                    <span className="font-semibold text-emerald-400">{player.evidenceStatus || 'Officially registered'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase block">Source Verification</span>
                    <span className="font-semibold text-neutral-300">{player.sourceUrl ? 'Official Club / URC' : 'URC Official Competition Records'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between text-xs mt-3">
          <span className="text-neutral-500 font-mono-numbers">
            ID: {player.id} · Official URC Player Database
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Integrated PlayerEditModal */}
      {isEditing && (
        <PlayerEditModal
          player={player}
          playerList={playerList}
          clubCountry={clubCountry}
          onSave={(updated) => {
            careerManager.updatePlayer(updated);
            setActivePlayer(updated);
            if (onSavePlayer) {
              onSavePlayer(updated);
            }
          }}
          onSelectPlayer={(next) => setActivePlayer(next)}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
};
