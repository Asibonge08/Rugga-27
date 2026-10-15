import React, { useState } from 'react';
import { LeagueTableRow, Club, Fixture } from '../types/rugby';
import { soundFx } from '../services/soundFx';
import { Trophy, Calendar, Shield, Award, ChevronLeft, ChevronRight } from 'lucide-react';

interface CompetitionsViewProps {
  table: LeagueTableRow[];
  clubs: Club[];
  fixtures: Fixture[];
  currentRound: number;
  userClubId: string;
}

export const CompetitionsView: React.FC<CompetitionsViewProps> = ({
  table,
  clubs,
  fixtures,
  currentRound,
  userClubId
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'fixtures' | 'shields'>('table');
  const [selectedRound, setSelectedRound] = useState<number>(currentRound);

  // Group shields
  const shields = {
    'South African Shield': ['stormers', 'bulls', 'sharks_urc', 'lions'],
    'Irish Shield': ['leinster', 'munster', 'ulster', 'connacht'],
    'Scottish & Italian Shield': ['glasgow', 'edinburgh', 'benetton', 'zebre'],
    'Welsh Shield': ['ospreys', 'cardiff', 'scarlets', 'dragons']
  };

  const roundFixtures = fixtures.filter(f => f.round === selectedRound);

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg text-white">United Rugby Championship</h2>
            <p className="text-xs text-neutral-400">16 Elite Clubs · 18 Regular Season Rounds · Top 8 Qualify for Playoffs</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('table');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'table' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            League Table
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('fixtures');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'fixtures' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Fixtures & Results
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('shields');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'shields' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Regional Shields
          </button>
        </div>
      </div>

      {/* LEAGUE TABLE VIEW */}
      {activeTab === 'table' && (
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] text-neutral-400 uppercase font-semibold border-b border-neutral-800 bg-neutral-950/70">
                  <th className="py-3 px-3">Pos</th>
                  <th className="py-3 px-3">Club</th>
                  <th className="py-3 px-2 text-center font-mono-numbers">P</th>
                  <th className="py-3 px-2 text-center font-mono-numbers">W</th>
                  <th className="py-3 px-2 text-center font-mono-numbers">D</th>
                  <th className="py-3 px-2 text-center font-mono-numbers">L</th>
                  <th className="py-3 px-2 text-center font-mono-numbers">PF</th>
                  <th className="py-3 px-2 text-center font-mono-numbers">PA</th>
                  <th className="py-3 px-2 text-center font-mono-numbers">Diff</th>
                  <th className="py-3 px-2 text-center font-mono-numbers text-amber-400" title="Try Bonus Point (4+ tries in match)">TBP</th>
                  <th className="py-3 px-2 text-center font-mono-numbers text-blue-400" title="Losing Bonus Point (loss by <=7 points)">LBP</th>
                  <th className="py-3 px-3 text-right font-mono-numbers text-emerald-400 font-bold">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/40">
                {table.map((row, idx) => {
                  const club = clubs.find(c => c.id === row.clubId);
                  const isUser = row.clubId === userClubId;
                  const isPlayoffSpot = idx < 8;

                  return (
                    <tr
                      key={row.clubId}
                      className={`hover:bg-neutral-800/40 transition-colors ${
                        isUser ? 'bg-emerald-950/40 font-semibold' : ''
                      } ${idx === 7 ? 'border-b-2 border-emerald-500/40' : ''}`}
                    >
                      <td className="py-2.5 px-3 font-mono-numbers text-neutral-400">
                        <span className={`inline-block w-5 text-center ${isPlayoffSpot ? 'text-emerald-400 font-bold' : ''}`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 flex items-center space-x-2.5">
                        <div
                          className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: club?.primaryColor || '#666' }}
                        />
                        <span className={`truncate ${isUser ? 'text-emerald-300 font-bold' : 'text-neutral-100'}`}>
                          {club?.name || row.clubId}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono-numbers text-neutral-400">{row.played}</td>
                      <td className="py-2.5 px-2 text-center font-mono-numbers text-neutral-300">{row.won}</td>
                      <td className="py-2.5 px-2 text-center font-mono-numbers text-neutral-400">{row.drawn}</td>
                      <td className="py-2.5 px-2 text-center font-mono-numbers text-neutral-400">{row.lost}</td>
                      <td className="py-2.5 px-2 text-center font-mono-numbers text-neutral-400">{row.pointsFor}</td>
                      <td className="py-2.5 px-2 text-center font-mono-numbers text-neutral-400">{row.pointsAgainst}</td>
                      <td className="py-2.5 px-2 text-center font-mono-numbers font-semibold text-neutral-200">
                        {row.pointsDiff > 0 ? `+${row.pointsDiff}` : row.pointsDiff}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono-numbers text-amber-400">{row.tryBonusPoints}</td>
                      <td className="py-2.5 px-2 text-center font-mono-numbers text-blue-400">{row.losingBonusPoints}</td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-white text-sm">
                        {row.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-neutral-950/80 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between font-mono-numbers">
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Positions 1–8: Qualify for URC Quarter-Finals & Champions Cup</span>
            </span>
            <span>Official Scoring: Win=4pts, Draw=2pts, 4+ Tries=+1pt, Loss &le; 7pts=+1pt</span>
          </div>
        </div>
      )}

      {/* FIXTURES & RESULTS VIEW */}
      {activeTab === 'fixtures' && (
        <div className="space-y-4">
          {/* Round Selector Bar */}
          <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 p-3 rounded-xl">
            <button
              onClick={() => setSelectedRound(Math.max(1, selectedRound - 1))}
              className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-heading font-bold text-sm text-neutral-100">
              URC Round {selectedRound} of 18
            </span>
            <button
              onClick={() => setSelectedRound(Math.min(18, selectedRound + 1))}
              className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roundFixtures.map(fix => {
              const home = clubs.find(c => c.id === fix.homeClubId);
              const away = clubs.find(c => c.id === fix.awayClubId);
              const isUserMatch = fix.homeClubId === userClubId || fix.awayClubId === userClubId;

              return (
                <div
                  key={fix.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    isUserMatch
                      ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40'
                      : 'bg-neutral-900 border-neutral-800'
                  }`}
                >
                  {/* Home */}
                  <div className="flex items-center space-x-2 w-5/12">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: home?.primaryColor }}
                    />
                    <span className="font-semibold text-xs text-neutral-100 truncate">
                      {home?.shortName}
                    </span>
                  </div>

                  {/* Score or VS */}
                  <div className="w-2/12 text-center font-mono-numbers">
                    {fix.played && fix.result ? (
                      <span className="font-black text-xs text-white">
                        {fix.result.homeScore} - {fix.result.awayScore}
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-500 uppercase">VS</span>
                    )}
                  </div>

                  {/* Away */}
                  <div className="flex items-center justify-end space-x-2 w-5/12 text-right">
                    <span className="font-semibold text-xs text-neutral-100 truncate">
                      {away?.shortName}
                    </span>
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: away?.primaryColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* REGIONAL SHIELDS TAB */}
      {activeTab === 'shields' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(shields).map(([shieldName, clubIds]) => {
            const shieldRows = table.filter(r => clubIds.includes(r.clubId));
            shieldRows.sort((a, b) => b.points - a.points);
            const leader = clubs.find(c => c.id === shieldRows[0]?.clubId);

            return (
              <div key={shieldName} className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-heading font-bold text-sm text-neutral-100">{shieldName}</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                    Leader: {leader?.shortName}
                  </span>
                </div>

                <div className="space-y-2">
                  {shieldRows.map((r, idx) => {
                    const c = clubs.find(cl => cl.id === r.clubId);
                    const isUser = r.clubId === userClubId;
                    return (
                      <div
                        key={r.clubId}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                          isUser ? 'bg-emerald-950/40 text-emerald-300 font-bold' : 'bg-neutral-950/60 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-mono-numbers text-neutral-500 w-3">{idx + 1}</span>
                          <span>{c?.shortName}</span>
                        </div>
                        <div className="font-mono-numbers space-x-3">
                          <span className="text-neutral-400">P{r.played}</span>
                          <span className="font-bold text-white">{r.points} pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
