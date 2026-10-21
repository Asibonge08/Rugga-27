import React, { useState } from 'react';
import { CareerState, careerManager, createDefaultMilestones } from '../services/careerManager';
import { soundFx } from '../services/soundFx';
import { useCurrency } from '../services/currencyService';
import { getRivalry, getClubRivalries, getFanReactionQuote } from '../data/rugbyRivalries';
import {
  Trophy,
  Calendar,
  Users,
  DollarSign,
  Activity,
  AlertCircle,
  ChevronRight,
  Play,
  Award,
  Zap,
  Flame,
  Heart,
  Swords,
  ShieldAlert,
  Sparkles,
  Shield,
  Target,
  Crown,
  Coins,
  Building2,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface DashboardViewProps {
  state: CareerState;
  onOpenMatchday: (fixtureId: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenOffSeasonSummary?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onOpenMatchday,
  onNavigateTab,
  onOpenOffSeasonSummary
}) => {
  const userClub = state.clubs.find(c => c.id === state.userClubId) || state.clubs[0];
  const { formatMoney } = useCurrency(userClub.country);
  const urcTable = state.leagueTables.URC || [];
  const userTableRow = urcTable.find(r => r.clubId === userClub.id);
  const userTableIndex = urcTable.findIndex(r => r.clubId === userClub.id);

  const fanSatisfaction = userClub.fanSatisfaction ?? 82;
  const userRivalries = getClubRivalries(userClub.id);

  // Career Milestones & Badges
  const [milestoneFilter, setMilestoneFilter] = useState<'ALL' | 'UNLOCKED' | 'IN_PROGRESS'>('ALL');
  const milestones = state.milestones && state.milestones.length > 0 ? state.milestones : createDefaultMilestones();
  const unlockedCount = milestones.filter(m => m.unlocked).length;
  const inProgressCount = milestones.length - unlockedCount;
  const totalCoinsEarned = milestones.filter(m => m.unlocked).reduce((sum, m) => sum + m.rewardCoins, 0);

  const filteredMilestones = milestones.filter(m => {
    if (milestoneFilter === 'UNLOCKED') return m.unlocked;
    if (milestoneFilter === 'IN_PROGRESS') return !m.unlocked;
    return true;
  });

  // Find next unplayed fixture for user club
  const nextFixture = state.fixtures.find(
    f => !f.played && (f.homeClubId === userClub.id || f.awayClubId === userClub.id)
  );

  const opponentClub = nextFixture
    ? state.clubs.find(c => c.id === (nextFixture.homeClubId === userClub.id ? nextFixture.awayClubId : nextFixture.homeClubId))
    : null;

  const isHomeMatch = nextFixture?.homeClubId === userClub.id;
  const nextRivalry = opponentClub ? getRivalry(userClub.id, opponentClub.id) : null;

  // Squad health glance
  const clubPlayers = state.players.filter(p => p.clubId === userClub.id);
  const injuredPlayers = clubPlayers.filter(p => p.injury !== null);
  const avgFitness = Math.round(clubPlayers.reduce((sum, p) => sum + p.fitness, 0) / (clubPlayers.length || 1));
  const unreadMessages = state.inbox.filter(m => !m.read);

  return (
    <div className="space-y-5 pb-12">
      {/* Club Identity Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 p-5 sm:p-6 shadow-xl">
        <div
          className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundColor: userClub.primaryColor }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div
              className="w-14 h-14 rounded-2xl border-2 border-white/20 shadow-lg flex items-center justify-center font-heading font-black text-xl text-white shrink-0"
              style={{ backgroundColor: userClub.primaryColor }}
            >
              {userClub.shortName.substring(0, 3).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading font-bold text-xl sm:text-2xl text-white tracking-wide">
                  {userClub.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono-numbers">
                  Season {state.seasonYear} · Year {state.careerYear ?? 1} of 20
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  state.seasonPhase === 'PRE_SEASON'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : state.seasonPhase === 'OFF_SEASON'
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {state.seasonPhase === 'PRE_SEASON' ? 'Pre-Season' : state.seasonPhase === 'OFF_SEASON' ? 'Off-Season' : `Round ${state.currentRound}`}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Head Coach: <span className="text-neutral-200 font-medium">{state.managerName}</span> · {userClub.stadiumName}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar with Fan Satisfaction */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80">
            <div>
              <div className="text-neutral-400 text-[10px] uppercase font-semibold">League Pos</div>
              <div className="font-heading font-bold text-base text-emerald-400 font-mono-numbers">
                {userTableIndex !== -1 ? `#${userTableIndex + 1}` : '-'}
                <span className="text-[10px] text-neutral-400 font-normal"> / 16</span>
              </div>
            </div>
            <div className="h-7 w-px bg-neutral-800" />
            <div>
              <div className="text-neutral-400 text-[10px] uppercase font-semibold">Transfer Budget</div>
              <div className="font-heading font-bold text-base text-white font-mono-numbers">
                {formatMoney(userClub.transferBudget, { compact: true })}
              </div>
            </div>
            <div className="h-7 w-px bg-neutral-800" />
            <div>
              <div className="text-neutral-400 text-[10px] uppercase font-semibold">Board Trust</div>
              <div className="font-heading font-bold text-base text-amber-400 font-mono-numbers">
                {userClub.boardConfidence}%
              </div>
            </div>
            <div className="h-7 w-px bg-neutral-800" />
            <div>
              <div className="text-neutral-400 text-[10px] uppercase font-semibold flex items-center space-x-1">
                <Heart className="w-2.5 h-2.5 text-rose-400" />
                <span>Fan Mood</span>
              </div>
              <div className="font-heading font-bold text-base text-rose-400 font-mono-numbers flex items-center space-x-1.5">
                <span>{fanSatisfaction}%</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-normal bg-rose-950/60 text-rose-300 border border-rose-900/40">
                  {fanSatisfaction >= 85 ? 'Ecstatic 🔥' : fanSatisfaction >= 70 ? 'Passionate' : fanSatisfaction >= 50 ? 'Neutral' : 'Unhappy ⚠️'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Fixture Hero Card */}
      {nextFixture && opponentClub ? (
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 p-5 sm:p-6 shadow-xl ${
          nextRivalry ? 'border-2 border-amber-500/50 shadow-amber-950/20' : 'border border-emerald-950/60'
        }`}>
          {/* Rivalry Special Banner if next match is a Derby */}
          {nextRivalry && (
            <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-red-950/80 via-amber-950/60 to-neutral-900 border border-amber-500/40 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-heading font-black tracking-wider uppercase bg-red-600 text-white flex items-center space-x-1 shadow-sm">
                    <Flame className="w-3 h-3 fill-current animate-pulse" />
                    <span>OFFICIAL DERBY</span>
                  </span>
                  <span className="font-heading font-bold text-sm sm:text-base text-amber-300">
                    {nextRivalry.name}
                  </span>
                </div>
                {nextRivalry.trophyName && (
                  <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-medium bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-600/30">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>{nextRivalry.trophyName}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {nextRivalry.lore}
              </p>
              <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-numbers">
                <span className="text-amber-200 flex items-center space-x-1">
                  <span>⚡ Match Tension: MAXIMUM (+{Math.round((nextRivalry.tensionModifier - 1) * 100)}%)</span>
                </span>
                <span className="text-emerald-300 font-semibold">
                  Fan Stakes: Win +20% / Loss -20% Fan Satisfaction
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80 mb-5">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <Calendar className="w-4 h-4" />
              <span>Next Match · URC Round {nextFixture.round}</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-neutral-800/80 text-neutral-300 font-medium">
              {isHomeMatch ? 'Home Fixture' : 'Away Fixture'}
            </span>
          </div>

          <div className="grid grid-cols-3 items-center text-center gap-2 mb-6">
            {/* User Club */}
            <div className="flex flex-col items-center">
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl border-2 border-white/20 shadow-md flex items-center justify-center font-heading font-black text-lg sm:text-xl text-white mb-2"
                style={{ backgroundColor: userClub.primaryColor }}
              >
                {userClub.shortName.substring(0, 3).toUpperCase()}
              </div>
              <span className="font-heading font-bold text-sm sm:text-base text-neutral-100">{userClub.name}</span>
              <span className="text-[11px] text-emerald-400 font-mono-numbers">Rep: {userClub.reputation}</span>
            </div>

            {/* VS Badge */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-xs shadow-inner mb-1 ${
                nextRivalry ? 'bg-amber-600 text-white ring-2 ring-amber-400' : 'bg-neutral-800 border border-neutral-700 text-neutral-300'
              }`}>
                {nextRivalry ? '🔥' : 'VS'}
              </div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest text-center">
                {isHomeMatch ? userClub.stadiumName : opponentClub.stadiumName}
              </span>
            </div>

            {/* Opponent Club */}
            <div className="flex flex-col items-center">
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl border-2 border-white/20 shadow-md flex items-center justify-center font-heading font-black text-lg sm:text-xl text-white mb-2"
                style={{ backgroundColor: opponentClub.primaryColor }}
              >
                {opponentClub.shortName.substring(0, 3).toUpperCase()}
              </div>
              <span className="font-heading font-bold text-sm sm:text-base text-neutral-100">{opponentClub.name}</span>
              <span className="text-[11px] text-neutral-400 font-mono-numbers">Rep: {opponentClub.reputation}</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenMatchday(nextFixture.id);
              }}
              className="flex-1 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-sm tracking-wide flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/80 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>PLAY 2D MATCHDAY</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onNavigateTab('tactics');
              }}
              className="py-3 px-5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-medium text-xs tracking-wide flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Tactical Setup</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onNavigateTab('squad');
              }}
              className="py-3 px-5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-medium text-xs tracking-wide flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Team Selection</span>
            </button>
          </div>
        </div>
      ) : state.seasonPhase === 'OFF_SEASON' ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/60 via-neutral-900 to-purple-950/50 border border-amber-500/40 p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Off-Season Phase
                  </span>
                  <span className="text-xs text-neutral-400 font-mono-numbers">
                    Season {state.seasonYear} Complete
                  </span>
                </div>
                <h3 className="font-heading font-black text-lg sm:text-xl text-white mt-1">
                  Championship Concluded: Review Awards & Finances
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5 max-w-xl">
                  Prize money and ticket packages have been credited. Review Season MVP, Retirements (35+), Expiring Contracts, and Youth Draft.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              {onOpenOffSeasonSummary && (
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onOpenOffSeasonSummary();
                  }}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-heading font-bold text-xs tracking-wide flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-950/40 cursor-pointer transition-all"
                >
                  <Award className="w-4 h-4" />
                  <span>Review Honours & Squad</span>
                </button>
              )}
              <button
                onClick={() => {
                  soundFx.playCrowdCheer();
                  careerManager.proceedToPreSeason();
                }}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs tracking-wide flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-950/60 cursor-pointer transition-all"
              >
                <span>Enter Pre-Season</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : state.seasonPhase === 'PRE_SEASON' ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-neutral-900 to-amber-950/40 border border-emerald-500/40 p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Pre-Season Transfer Window Open
                  </span>
                  <span className="text-xs text-neutral-400 font-mono-numbers">
                    Preparing Season {state.seasonYear + 1}
                  </span>
                </div>
                <h3 className="font-heading font-black text-lg sm:text-xl text-white mt-1">
                  Dynamic Signings, Rival Buyouts & Free Agency Active
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5 max-w-xl">
                  The transfer market is open! Sign unattached free agents, bid on rival superstars, and renew expiring player contracts before kickoff.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                onClick={() => {
                  soundFx.playClick();
                  onNavigateTab('transfers');
                }}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-heading font-bold text-xs tracking-wide flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
              >
                <span>Transfer Market</span>
              </button>
              <button
                onClick={() => {
                  soundFx.playWhistle('long');
                  careerManager.startNewSeason();
                }}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs tracking-wide flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-950/60 cursor-pointer transition-all transform hover:-translate-y-0.5"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Kick Off Season {state.seasonYear + 1}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div>
            <h3 className="font-heading font-bold text-base text-white">All 18 Regular Season Rounds Finished</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Fixtures for the current campaign are complete. Proceed to finalize standings and generate the Off-Season honours report.
            </p>
          </div>
          <button
            onClick={() => {
              soundFx.playCrowdCheer();
              careerManager.processEndOfSeason();
            }}
            className="py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-heading font-bold text-xs tracking-wide flex items-center space-x-2 shadow-lg cursor-pointer transition-all"
          >
            <Trophy className="w-4 h-4" />
            <span>Process End-of-Season</span>
          </button>
        </div>
      )}

      {/* Mid Section: League Table Snippet & Squad Condition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* URC Standings Snippet */}
        <div className="lg:col-span-2 rounded-2xl bg-neutral-900/90 border border-neutral-800 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <h3 className="font-heading font-bold text-sm text-neutral-100 uppercase tracking-wider">
                URC Standings (Top 8 Qualify)
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('competitions')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <span>Full Table</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] text-neutral-400 uppercase font-semibold border-b border-neutral-800/60 pb-2">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Club</th>
                  <th className="py-2 px-1 text-center font-mono-numbers">P</th>
                  <th className="py-2 px-1 text-center font-mono-numbers">W</th>
                  <th className="py-2 px-1 text-center font-mono-numbers">D</th>
                  <th className="py-2 px-1 text-center font-mono-numbers">L</th>
                  <th className="py-2 px-1 text-center font-mono-numbers">Diff</th>
                  <th className="py-2 px-1 text-center font-mono-numbers text-amber-400">TBP</th>
                  <th className="py-2 px-2 text-right font-mono-numbers text-emerald-400 font-bold">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/40">
                {urcTable.slice(0, 8).map((row, idx) => {
                  const club = state.clubs.find(c => c.id === row.clubId);
                  const isUser = row.clubId === userClub.id;
                  return (
                    <tr
                      key={row.clubId}
                      className={`hover:bg-neutral-800/40 transition-colors ${
                        isUser ? 'bg-emerald-950/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2 px-2 font-mono-numbers text-neutral-400">
                        <span className={`inline-block w-4 text-center ${idx < 4 ? 'text-emerald-400 font-bold' : ''}`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2 px-2 flex items-center space-x-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: club?.primaryColor || '#666' }}
                        />
                        <span className={`truncate ${isUser ? 'text-emerald-300 font-bold' : 'text-neutral-200'}`}>
                          {club?.shortName || row.clubId}
                        </span>
                      </td>
                      <td className="py-2 px-1 text-center font-mono-numbers text-neutral-400">{row.played}</td>
                      <td className="py-2 px-1 text-center font-mono-numbers text-neutral-300">{row.won}</td>
                      <td className="py-2 px-1 text-center font-mono-numbers text-neutral-400">{row.drawn}</td>
                      <td className="py-2 px-1 text-center font-mono-numbers text-neutral-400">{row.lost}</td>
                      <td className="py-2 px-1 text-center font-mono-numbers text-neutral-300">
                        {row.pointsDiff > 0 ? `+${row.pointsDiff}` : row.pointsDiff}
                      </td>
                      <td className="py-2 px-1 text-center font-mono-numbers text-amber-400">{row.tryBonusPoints}</td>
                      <td className="py-2 px-2 text-right font-mono-numbers font-bold text-white text-sm">
                        {row.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Squad Readiness & Injury Bulletin */}
        <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="font-heading font-bold text-sm text-neutral-100 uppercase tracking-wider">
                  Squad Readiness
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('training')}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Training
              </button>
            </div>

            {/* Average Fitness Gauge */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-neutral-400">Squad Average Fitness</span>
                <span className="font-mono-numbers font-bold text-emerald-400">{avgFitness}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${avgFitness}%` }}
                />
              </div>
            </div>

            {/* Injuries List */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                Medical & Injury List ({injuredPlayers.length})
              </span>
              {injuredPlayers.length === 0 ? (
                <div className="text-xs text-emerald-400/90 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-xl">
                  ✓ Full squad fit and available for selection
                </div>
              ) : (
                injuredPlayers.slice(0, 3).map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/70 border border-neutral-800 text-xs"
                  >
                    <div>
                      <div className="font-medium text-neutral-200">{p.name}</div>
                      <div className="text-[10px] text-red-400">{p.injury?.name}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-950/50 text-red-300 border border-red-800/40 font-mono-numbers">
                      {p.injury?.weeksRemaining}w left
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Inbox teaser */}
          <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-neutral-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>{unreadMessages.length} Unread Messages</span>
            </div>
            <button
              onClick={() => onNavigateTab('inbox')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
            >
              Open Inbox
            </button>
          </div>
        </div>
      </div>

      {/* Fan Satisfaction & Rivalry Command Center */}
      <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-neutral-800 mb-5 gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-rose-400 fill-current" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-neutral-100 uppercase tracking-wider flex items-center space-x-2">
                <span>Fan Satisfaction & Derby Honours</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono-numbers">
                  {userRivalries.length} Key Rivalries
                </span>
              </h3>
            </div>
          </div>
          <span className="text-xs text-neutral-400 font-mono-numbers">
            Updated live after every fixture
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fan Mood Gauge & Feedback */}
          <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Supporter Trust Gauge
                </span>
                <span className="font-heading font-black text-lg text-rose-400 font-mono-numbers">
                  {fanSatisfaction}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-neutral-800 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${fanSatisfaction}%`,
                    backgroundColor: fanSatisfaction >= 80 ? '#f43f5e' : fanSatisfaction >= 60 ? '#f59e0b' : '#ef4444'
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-neutral-400 font-mono-numbers mb-4">
                <span>0% Revolt</span>
                <span>50% Neutral</span>
                <span>100% Passionate Ultras</span>
              </div>

              {/* Dynamic Fan Feedback Voice Quote */}
              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 italic relative">
                <div className="text-[10px] not-italic uppercase font-bold text-rose-400 mb-1 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Fan Trust Sentiment</span>
                </div>
                {fanSatisfaction >= 85 ? (
                  `"Total euphoria in the stands! The passion and commitment on derby day has the whole stadium roaring. Keep this momentum rolling!"`
                ) : fanSatisfaction >= 70 ? (
                  `"The fans are firmly behind the squad. Good discipline and solid rugby has supporters optimistic for playoff glory."`
                ) : fanSatisfaction >= 50 ? (
                  `"Supporters are restless. We expect greater intensity and pride, especially when we face our historic rivals."`
                ) : (
                  `"Furious protests brewing among the fanbase! Humiliation against our rivals and sloppy performances are unacceptable."`
                )}
              </div>
            </div>

            {/* Attendance & Matchday Revenue Boost */}
            <div className="pt-3 border-t border-neutral-800/80 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400">Stadium Attendance Rate:</span>
                <span className="font-mono-numbers font-semibold text-emerald-400">
                  {Math.round(60 + (fanSatisfaction * 0.4))}% capacity
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Ticket Revenue Modifier:</span>
                <span className="font-mono-numbers font-semibold text-white">
                  {(0.6 + ((fanSatisfaction / 100) * 0.4)).toFixed(2)}x
                </span>
              </div>
            </div>
          </div>

          {/* Club Rivalries & Derby Honours List */}
          <div className="lg:col-span-2 space-y-3">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Derby Matches & Trophies</span>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {userRivalries.length === 0 ? (
                <div className="text-xs text-neutral-400 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
                  No registered geographic derbies for this club.
                </div>
              ) : (
                userRivalries.map(rivalry => {
                  const rivalClubId = rivalry.teamA === userClub.id ? rivalry.teamB : rivalry.teamA;
                  const rivalClub = state.clubs.find(c => c.id === rivalClubId);
                  const h2h = userClub.rivalryH2H?.[rivalClubId] || { played: 0, won: 0, drawn: 0, lost: 0 };
                  const trophyHeld = h2h.trophyHeld ?? false;

                  return (
                    <div
                      key={rivalry.id}
                      className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 hover:border-amber-500/40 transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center space-x-2.5">
                          {rivalClub && (
                            <div
                              className="w-7 h-7 rounded-lg border border-white/20 flex items-center justify-center font-heading font-black text-xs text-white shrink-0"
                              style={{ backgroundColor: rivalClub.primaryColor }}
                            >
                              {rivalClub.shortName.substring(0, 3).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-heading font-bold text-xs sm:text-sm text-neutral-100">
                                {rivalry.name}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                rivalry.intensity === 'FIERCE'
                                  ? 'bg-red-950 text-red-400 border border-red-800/40'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                              }`}>
                                {rivalry.intensity} 🔥
                              </span>
                            </div>
                            <div className="text-[10px] text-neutral-400">
                              vs {rivalClub?.name || rivalClubId} · {rivalClub?.stadiumName}
                            </div>
                          </div>
                        </div>

                        {/* Trophy Status */}
                        {rivalry.trophyName && (
                          <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ${
                            trophyHeld
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-500/50'
                              : h2h.played > 0
                              ? 'bg-neutral-900 text-neutral-400 border border-neutral-700'
                              : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                          }`}>
                            <Trophy className={`w-3.5 h-3.5 ${trophyHeld ? 'text-amber-400' : 'text-neutral-500'}`} />
                            <span className="text-[11px]">{rivalry.trophyName}</span>
                            <span className="text-[10px] font-normal text-neutral-400">
                              ({trophyHeld ? 'Held 🏆' : 'Contested ⚔️'})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Derby Lore snippet */}
                      <p className="text-[11px] text-neutral-400 leading-relaxed mb-2.5">
                        {rivalry.lore}
                      </p>

                      {/* Head-to-Head record bar */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] pt-2 border-t border-neutral-800/60 font-mono-numbers">
                        <div className="flex items-center space-x-3 text-neutral-300">
                          <span>Played: <strong className="text-white">{h2h.played}</strong></span>
                          <span>Won: <strong className="text-emerald-400">{h2h.won}</strong></span>
                          <span>Drawn: <strong className="text-neutral-400">{h2h.drawn}</strong></span>
                          <span>Lost: <strong className="text-rose-400">{h2h.lost}</strong></span>
                        </div>
                        <div className="text-neutral-400 text-[10px]">
                          Last Result: <span className="font-semibold text-neutral-200">{h2h.lastResult || 'No meetings this season'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Career Milestones & Hall of Fame Visual Badges Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-neutral-950 shadow-lg shadow-amber-500/20 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-heading font-bold text-lg text-white">
                  Career Milestones & Hall of Fame
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono-numbers">
                  {unlockedCount} / {milestones.length} Badges Claimed
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Visual achievements awarded for historic runs, academy debuts, silverware, and club milestones
              </p>
            </div>
          </div>

          {/* Quick Metrics & Filter Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs flex items-center space-x-2">
              <span className="text-neutral-400">Coins Won:</span>
              <span className="font-heading font-black text-amber-400 font-mono-numbers">
                +{totalCoinsEarned.toLocaleString()} 🪙
              </span>
            </div>

            <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setMilestoneFilter('ALL');
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  milestoneFilter === 'ALL' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                All ({milestones.length})
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setMilestoneFilter('UNLOCKED');
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  milestoneFilter === 'UNLOCKED' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Claimed ({unlockedCount})
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setMilestoneFilter('IN_PROGRESS');
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  milestoneFilter === 'IN_PROGRESS' ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                In Progress ({inProgressCount})
              </button>
            </div>
          </div>
        </div>

        {/* Milestone Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMilestones.map(m => {
            const isUnlocked = m.unlocked;
            const pct = isUnlocked
              ? 100
              : Math.min(100, Math.max(0, Math.round(((m.progress || 0) / m.target) * 100)));

            const isPlatinum = m.tier === 'PLATINUM';
            const isGold = m.tier === 'GOLD';
            const isSilver = m.tier === 'SILVER';

            return (
              <div
                key={m.id}
                className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 border flex flex-col justify-between ${
                  isUnlocked
                    ? isPlatinum
                      ? 'border-cyan-400/50 bg-gradient-to-br from-cyan-950/40 via-neutral-900 to-indigo-950/40 shadow-lg shadow-cyan-950/20'
                      : isGold
                      ? 'border-amber-400/50 bg-gradient-to-br from-amber-950/40 via-neutral-900 to-yellow-950/30 shadow-lg shadow-amber-950/20'
                      : isSilver
                      ? 'border-slate-400/40 bg-gradient-to-br from-slate-900/40 via-neutral-900 to-neutral-950 shadow-md'
                      : 'border-orange-700/40 bg-gradient-to-br from-orange-950/30 via-neutral-900 to-neutral-950 shadow-md'
                    : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700'
                }`}
              >
                {/* Visual badge top row */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-3">
                      {/* Visual Emblem Badge */}
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                          isUnlocked
                            ? isPlatinum
                              ? 'bg-gradient-to-br from-cyan-400 to-indigo-600 border-cyan-300/60 shadow-lg shadow-cyan-500/30 text-white'
                              : isGold
                              ? 'bg-gradient-to-br from-amber-400 to-yellow-600 border-amber-300/60 shadow-lg shadow-amber-500/30 text-neutral-950'
                              : isSilver
                              ? 'bg-gradient-to-br from-slate-200 to-neutral-400 border-white/60 shadow-md text-neutral-950'
                              : 'bg-gradient-to-br from-orange-600 to-amber-800 border-orange-400/50 text-white shadow-md'
                            : 'bg-neutral-800/90 border-neutral-700 text-neutral-500'
                        }`}
                      >
                        {m.icon === 'Flame' && <Flame className="w-5 h-5 fill-current" />}
                        {m.icon === 'Sparkles' && <Sparkles className="w-5 h-5 fill-current" />}
                        {m.icon === 'Trophy' && <Trophy className="w-5 h-5 fill-current" />}
                        {m.icon === 'Swords' && <Swords className="w-5 h-5" />}
                        {m.icon === 'Target' && <Target className="w-5 h-5" />}
                        {m.icon === 'Shield' && <Shield className="w-5 h-5 fill-current" />}
                        {m.icon === 'Building2' && <Building2 className="w-5 h-5" />}
                        {m.icon === 'Users' && <Users className="w-5 h-5" />}
                        {m.icon === 'Coins' && <Coins className="w-5 h-5 fill-current" />}
                        {!['Flame', 'Sparkles', 'Trophy', 'Swords', 'Target', 'Shield', 'Building2', 'Users', 'Coins'].includes(m.icon) && (
                          <Award className="w-5 h-5 fill-current" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-1.5 mb-0.5">
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono-numbers uppercase tracking-wider font-bold border ${
                              isPlatinum
                                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                : isGold
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : isSilver
                                ? 'bg-slate-400/15 text-slate-300 border-slate-400/30'
                                : 'bg-orange-600/15 text-orange-300 border-orange-600/30'
                            }`}
                          >
                            {m.tier}
                          </span>
                          <span className="text-[9px] text-neutral-400 font-semibold uppercase tracking-wider">
                            {m.category}
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-sm text-white leading-tight">
                          {m.title}
                        </h4>
                      </div>
                    </div>

                    {/* Unlock Status Stamp */}
                    {isUnlocked ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>CLAIMED</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800/80 text-neutral-400 border border-neutral-700/80 flex items-center space-x-1 shrink-0">
                        <Lock className="w-2.5 h-2.5 text-neutral-400" />
                        <span>LOCKED</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed mb-3">
                    {m.description}
                  </p>
                </div>

                {/* Progress bar & Reward details */}
                <div className="pt-3 border-t border-neutral-800/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono-numbers">
                    <span className="text-neutral-400">
                      {isUnlocked ? 'Status: Unlocked' : 'Progress'}
                    </span>
                    <span className={isUnlocked ? 'text-emerald-400 font-bold' : 'text-neutral-200 font-semibold'}>
                      {isUnlocked ? (
                        m.unlockedDate || 'Completed 🏅'
                      ) : m.id === 'financial_titan' ? (
                        `${formatMoney(m.progress, { compact: true })} / ${formatMoney(m.target, { compact: true })}`
                      ) : (
                        `${m.progress} / ${m.target} (${pct}%)`
                      )}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlocked
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : isGold
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-500'
                          : isPlatinum
                          ? 'bg-gradient-to-r from-cyan-600 to-indigo-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-neutral-400 flex items-center space-x-1">
                      <span>Reward Purse:</span>
                    </span>
                    <span className="font-heading font-black text-amber-400 font-mono-numbers bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-600/30">
                      +{m.rewardCoins} Rugby Coins 🪙
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
