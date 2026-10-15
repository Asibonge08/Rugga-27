import React from 'react';
import { CareerState } from '../services/careerManager';
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
  Sparkles
} from 'lucide-react';

interface DashboardViewProps {
  state: CareerState;
  onOpenMatchday: (fixtureId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onOpenMatchday,
  onNavigateTab
}) => {
  const userClub = state.clubs.find(c => c.id === state.userClubId) || state.clubs[0];
  const { formatMoney } = useCurrency(userClub.country);
  const urcTable = state.leagueTables.URC || [];
  const userTableRow = urcTable.find(r => r.clubId === userClub.id);
  const userTableIndex = urcTable.findIndex(r => r.clubId === userClub.id);

  const fanSatisfaction = userClub.fanSatisfaction ?? 82;
  const userRivalries = getClubRivalries(userClub.id);

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
              <div className="flex items-center space-x-2">
                <h1 className="font-heading font-bold text-xl sm:text-2xl text-white tracking-wide">
                  {userClub.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono-numbers">
                  URC Round {state.currentRound}
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
      ) : (
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-center text-neutral-400 text-sm">
          Regular season concluded! Check the competition standings for playoff fixtures.
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
    </div>
  );
};
