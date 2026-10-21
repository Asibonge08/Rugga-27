import React, { useState } from 'react';
import { OffSeasonSummaryData, RugbyPosition } from '../types/rugby';
import { getPositionShort, getPositionName } from '../data/rugbyDatabase';
import { useCurrency } from '../services/currencyService';
import { soundFx } from '../services/soundFx';
import {
  Trophy,
  Award,
  DollarSign,
  TrendingUp,
  UserX,
  Users,
  Sparkles,
  ChevronRight,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle2,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface OffSeasonSummaryModalProps {
  data: OffSeasonSummaryData;
  clubCountry: string;
  onProceedToPreSeason: () => void;
  onClose: () => void;
}

export const OffSeasonSummaryModal: React.FC<OffSeasonSummaryModalProps> = ({
  data,
  clubCountry,
  onProceedToPreSeason,
  onClose
}) => {
  const { formatMoney } = useCurrency(clubCountry);
  const [activeTab, setActiveTab] = useState<'awards' | 'finances' | 'squad'>('awards');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-neutral-900 border border-neutral-700/80 shadow-2xl overflow-hidden">
        {/* Header Hero */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-950/70 via-neutral-900 to-emerald-950/70 p-5 border-b border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Season {data.seasonYear} Concluded
                  </span>
                  <span className="text-xs text-neutral-400 font-mono-numbers">
                    Career Year {data.careerYear} of 20
                  </span>
                </div>
                <h2 className="font-heading font-black text-xl sm:text-2xl text-white tracking-wide mt-0.5">
                  Off-Season Review & Transition
                </h2>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] text-neutral-400">Finish Position</div>
              <div className="font-heading font-black text-xl sm:text-2xl text-emerald-400 font-mono-numbers">
                #{data.userFinishPosition} <span className="text-xs text-neutral-400 font-normal">/ 16</span>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center space-x-2 mt-4 pt-2 border-t border-neutral-800/80">
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('awards');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'awards'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-neutral-800/60 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Honours & Awards</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('finances');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'finances'
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-neutral-800/60 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Prize Money & Revenue</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('squad');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'squad'
                  ? 'bg-blue-500 text-neutral-950 font-bold shadow-md shadow-blue-500/20'
                  : 'bg-neutral-800/60 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Roster, Retirements & Aging</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-neutral-200 text-xs sm:text-sm">
          {activeTab === 'awards' && (
            <div className="space-y-4">
              {/* Champion Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-neutral-900 to-amber-950/20 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-lg">
                    👑
                  </div>
                  <div>
                    <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
                      URC League Champions
                    </div>
                    <div className="font-heading font-black text-base sm:text-lg text-white">
                      {data.awards.championClubName}
                    </div>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                  Title Winners
                </span>
              </div>

              {/* Individual Honours Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* MVP */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold">Season MVP</span>
                      <Award className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="font-heading font-bold text-sm text-white">
                      {data.awards.mvpPlayerName}
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">{data.awards.mvpClubName}</div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400">Average Rating</span>
                    <span className="font-heading font-bold text-amber-400 font-mono-numbers">
                      {data.awards.mvpRating.toFixed(1)} / 10
                    </span>
                  </div>
                </div>

                {/* Top Try Scorer */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold">Top Try Scorer</span>
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="font-heading font-bold text-sm text-white">
                      {data.awards.topTryScorerName}
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">{data.awards.topTryClubName}</div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400">Total Tries</span>
                    <span className="font-heading font-bold text-emerald-400 font-mono-numbers">
                      {data.awards.topTryCount} Tries
                    </span>
                  </div>
                </div>

                {/* Golden Boot */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold">Golden Boot</span>
                      <Trophy className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="font-heading font-bold text-sm text-white">
                      {data.awards.goldenBootName}
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">{data.awards.goldenBootClubName}</div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400">Points Scored</span>
                    <span className="font-heading font-bold text-blue-400 font-mono-numbers">
                      {data.awards.goldenBootPoints} Points
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'finances' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                    League Finish Prize Purse
                  </div>
                  <div className="font-heading font-black text-xl text-emerald-400 font-mono-numbers mt-1">
                    +{formatMoney(data.prizeMoney)}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    Rewarded for securing position #{data.userFinishPosition} in the final championship standings.
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                    Season Ticket Renewals
                  </div>
                  <div className="font-heading font-black text-xl text-emerald-400 font-mono-numbers mt-1">
                    +{formatMoney(data.seasonTicketRevenue)}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    Deposited from passionate supporters and seasonal stadium membership packages.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">Board Evaluation</div>
                  <div className="text-xs text-neutral-300 mt-0.5">
                    Directors are pleased with club trajectory and have updated executive confidence.
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono-numbers font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    {data.boardSatisfaction}% Trust
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'squad' && (
            <div className="space-y-4">
              {/* Retirements Section */}
              <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <UserX className="w-4 h-4 text-rose-400" />
                    <h3 className="font-heading font-bold text-sm text-white">
                      Player Retirements (Age 35+)
                    </h3>
                  </div>
                  <span className="text-xs text-neutral-400 font-mono-numbers">
                    {data.retiredPlayers.length} Retired
                  </span>
                </div>

                {data.retiredPlayers.length > 0 ? (
                  <div className="space-y-2">
                    {data.retiredPlayers.map(p => (
                      <div
                        key={p.id}
                        className={`p-3 rounded-lg flex items-center justify-between text-xs border ${
                          p.wasUserPlayer
                            ? 'bg-rose-950/20 border-rose-800/40 text-neutral-100'
                            : 'bg-neutral-900/60 border-neutral-800 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center font-bold text-[10px] text-neutral-300">
                            {getPositionShort(p.position)}
                          </span>
                          <div>
                            <div className="font-semibold text-white flex items-center space-x-1.5">
                              <span>{p.name}</span>
                              {p.wasUserPlayer && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Your Squad Legend
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400">
                              Age {p.age} · {p.clubName}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-emerald-400 font-semibold">
                            Freed: +{formatMoney(p.freedWage)}/yr
                          </div>
                          <div className="text-[10px] text-neutral-500">Wage space opened</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-neutral-400 italic py-2">
                    No veteran players retired this off-season.
                  </div>
                )}
              </div>

              {/* Expired Contracts to Free Agency */}
              <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <h3 className="font-heading font-bold text-sm text-white">
                      Contracts Expired ➔ Free Agency
                    </h3>
                  </div>
                  <span className="text-xs text-neutral-400 font-mono-numbers">
                    {data.expiredToFreeAgents.length} Expired
                  </span>
                </div>

                {data.expiredToFreeAgents.length > 0 ? (
                  <div className="space-y-2">
                    {data.expiredToFreeAgents.map(p => (
                      <div
                        key={p.id}
                        className={`p-3 rounded-lg flex items-center justify-between text-xs border ${
                          p.wasUserPlayer
                            ? 'bg-amber-950/20 border-amber-800/40 text-neutral-100'
                            : 'bg-neutral-900/60 border-neutral-800 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center font-bold text-[10px] text-neutral-300">
                            {getPositionShort(p.position)}
                          </span>
                          <div>
                            <div className="font-semibold text-white flex items-center space-x-1.5">
                              <span>{p.name}</span>
                              {p.wasUserPlayer && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  Departed Your Squad
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400">
                              Age {p.age} · OVR {p.overall}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                          Now Free Agent
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-neutral-400 italic py-2">
                    All player contracts were renewed before expiry.
                  </div>
                )}
              </div>

              {/* Breakout Stars (Exceeded Potential Ceiling via high Development Score) */}
              {data.breakoutPlayers.length > 0 && (
                <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-heading font-bold text-sm text-white">
                        Unexpected Breakthrough Stars
                      </h3>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      High Dev Scores (76+)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {data.breakoutPlayers.map(p => (
                      <div
                        key={p.id}
                        className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs ${
                          p.wasUserPlayer
                            ? 'bg-emerald-950/30 border-emerald-700/60'
                            : 'bg-emerald-950/15 border-emerald-800/30'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-white flex items-center space-x-2">
                            <span>{p.name}</span>
                            {p.developmentScore !== undefined && (
                              <span className="text-[10px] font-mono-numbers font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                Dev Score: {p.developmentScore}/100
                              </span>
                            )}
                            {p.wasUserPlayer && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-bold">
                                Your Squad
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-300 mt-0.5">
                            OVR {p.overall} · {p.reason || 'Shattered projected developmental ceiling on the pitch!'}
                          </div>
                        </div>
                        <div className="text-right font-mono-numbers shrink-0">
                          <span className="text-neutral-400 line-through mr-1.5">POT {p.oldPotential}</span>
                          <span className="text-emerald-400 font-black text-sm">➔ POT {p.newPotential}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Growth Stagnations (Development Plateaus via low Development Score) */}
              {data.stagnatedPlayers && data.stagnatedPlayers.length > 0 && (
                <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <h3 className="font-heading font-bold text-sm text-white">
                        Developmental Stagnations & Plateaus
                      </h3>
                    </div>
                    <span className="text-[11px] text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                      Low Dev Scores (&lt;45)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {data.stagnatedPlayers.map(p => (
                      <div
                        key={p.id}
                        className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs ${
                          p.wasUserPlayer
                            ? 'bg-amber-950/30 border-amber-700/60'
                            : 'bg-amber-950/15 border-amber-800/30'
                        }`}
                      >
                        <div className="flex items-start space-x-2.5">
                          <span className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center font-bold text-[10px] text-neutral-300 shrink-0 mt-0.5">
                            {getPositionShort(p.position)}
                          </span>
                          <div>
                            <div className="font-semibold text-white flex items-center space-x-2">
                              <span>{p.name}</span>
                              <span className="text-[10px] font-mono-numbers font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                Dev Score: {p.developmentScore}/100
                              </span>
                              {p.wasUserPlayer && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold">
                                  Your Squad
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-amber-200/80 mt-0.5">
                              {p.reason}
                            </div>
                            <div className="text-[10px] text-neutral-400 mt-0.5">
                              Age {p.age} · OVR {p.overall} (Stalled)
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono-numbers shrink-0">
                          <span className="text-neutral-400 line-through mr-1.5">POT {p.oldPotential}</span>
                          <span className="text-amber-400 font-bold">➔ POT {p.newPotential}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-4 sm:p-5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-3">
          <div className="text-xs text-neutral-400">
            Next: <span className="text-neutral-200 font-semibold">Pre-Season Window</span> opens with dynamic transfers & free agency!
          </div>

          <button
            onClick={() => {
              soundFx.playCrowdCheer();
              onProceedToPreSeason();
            }}
            className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-sm tracking-wide flex items-center space-x-2 shadow-lg shadow-emerald-950/80 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <span>PROCEED TO PRE-SEASON</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
