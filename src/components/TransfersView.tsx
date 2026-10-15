import React, { useState } from 'react';
import { Player, Club, RugbyPosition, SeasonId } from '../types/rugby';
import { POSITIONS_ORDER, getPositionShort, getPositionName } from '../data/rugbyDatabase';
import { soundFx } from '../services/soundFx';
import { useCurrency } from '../services/currencyService';
import { urcRegistry } from '../services/urcRegistryService';
import { PlayerProfileModal } from './PlayerProfileModal';
import { PlayerEditorModal } from './PlayerEditorModal';
import { careerManager } from '../services/careerManager';
import { Search, DollarSign, ArrowRightLeft, Shield, Check, X, Filter, Database, Sparkles, ExternalLink, Calendar, Info, Sliders } from 'lucide-react';

interface TransfersViewProps {
  players: Player[];
  clubs: Club[];
  userClubId: string;
  onSignPlayer: (playerId: string, fee: number, wage: number, contractYears: number, role: Player['squadRole']) => { success: boolean; message: string };
  onSellPlayer: (playerId: string, fee: number) => { success: boolean; message: string };
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  players,
  clubs,
  userClubId,
  onSignPlayer,
  onSellPlayer
}) => {
  const userClub = clubs.find(c => c.id === userClubId) || clubs[0];
  const { formatMoney, effectiveCurrency } = useCurrency(userClub.country);
  const [activeTab, setActiveTab] = useState<'market' | 'discovery' | 'mysquad'>('market');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [negotiatingPlayer, setNegotiatingPlayer] = useState<Player | null>(null);
  const [sellingPlayer, setSellingPlayer] = useState<Player | null>(null);

  // Official URC Discovery state
  const [discoverySeason, setDiscoverySeason] = useState<SeasonId>('2025-26');
  const [discoveryClub, setDiscoveryClub] = useState<string>('ALL');
  const [discoveryPos, setDiscoveryPos] = useState<string>('ALL');
  const [discoveryQuery, setDiscoveryQuery] = useState<string>('');
  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Negotiation fields
  const [bidFee, setBidFee] = useState<number>(0);
  const [bidWage, setBidWage] = useState<number>(0);
  const [bidYears, setBidYears] = useState<number>(3);
  const [bidRole, setBidRole] = useState<Player['squadRole']>('First XV');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleOpenNegotiation = (p: Player) => {
    soundFx.playClick();
    setNegotiatingPlayer(p);
    setBidFee(p.marketValue);
    setBidWage(Math.round(p.weeklyWage * 1.15));
    setBidYears(3);
    setBidRole('First XV');
    setFeedbackMsg(null);
  };

  const handleConfirmBid = () => {
    if (!negotiatingPlayer) return;
    const res = onSignPlayer(negotiatingPlayer.id, bidFee, bidWage, bidYears, bidRole);
    if (res.success) {
      soundFx.playCrowdCheer();
      setFeedbackMsg({ text: res.message, isError: false });
      setTimeout(() => {
        setNegotiatingPlayer(null);
        setFeedbackMsg(null);
      }, 1200);
    } else {
      setFeedbackMsg({ text: res.message, isError: true });
    }
  };

  const handleConfirmSale = () => {
    if (!sellingPlayer) return;
    const res = onSellPlayer(sellingPlayer.id, sellingPlayer.marketValue);
    if (res.success) {
      soundFx.playWhistle('short');
      setSellingPlayer(null);
    }
  };

  // Filter market players (exclude user club players)
  const marketPlayers = players.filter(p => {
    if (p.clubId === userClubId) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (positionFilter !== 'ALL' && p.primaryPosition !== positionFilter) return false;
    if (countryFilter !== 'ALL' && p.nationality !== countryFilter) return false;
    return true;
  });

  const mySquadPlayers = players.filter(p => p.clubId === userClubId);

  const discoveryPlayers = urcRegistry.searchPlayers({
    searchTerm: discoveryQuery,
    clubId: discoveryClub,
    position: discoveryPos as any,
    season: discoverySeason
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Top Banner: Club Budget Glance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-xl">
        <div>
          <h2 className="font-heading font-bold text-lg text-white">Transfer Market & Contracts</h2>
          <p className="text-xs text-neutral-400">Scout, negotiate bids, and register elite rugby union players</p>
        </div>

        <div className="flex items-center space-x-4 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 text-xs">
          <div>
            <div className="text-[10px] text-neutral-400 uppercase font-semibold">Available Transfer Budget</div>
            <div className="font-heading font-bold text-sm text-emerald-400 font-mono-numbers">
              {formatMoney(userClub.transferBudget, { compact: true })}
            </div>
          </div>
          <div className="h-6 w-px bg-neutral-800" />
          <div>
            <div className="text-[10px] text-neutral-400 uppercase font-semibold">Wage Budget</div>
            <div className="font-heading font-bold text-sm text-white font-mono-numbers">
              {formatMoney(userClub.wageBudget, { perWeek: true })}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-neutral-800 pb-2 overflow-x-auto">
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('market');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            activeTab === 'market' ? 'bg-emerald-600 text-white shadow-md' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          Market Search ({marketPlayers.length})
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('discovery');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center space-x-1.5 ${
            activeTab === 'discovery' ? 'bg-emerald-600 text-white shadow-md' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>Official URC Discovery ({discoveryPlayers.length})</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('mysquad');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            activeTab === 'mysquad' ? 'bg-emerald-600 text-white shadow-md' : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          Squad Outgoing / Sell ({mySquadPlayers.length})
        </button>
      </div>

      {/* MARKET TAB */}
      {activeTab === 'market' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-900 border border-neutral-800 p-3 rounded-xl text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search player name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Position Filter */}
            <div>
              <select
                value={positionFilter}
                onChange={e => setPositionFilter(e.target.value)}
                className="w-full p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Positions</option>
                {POSITIONS_ORDER.map(pos => (
                  <option key={pos} value={pos}>{getPositionName(pos)}</option>
                ))}
              </select>
            </div>

            {/* Country Filter */}
            <div>
              <select
                value={countryFilter}
                onChange={e => setCountryFilter(e.target.value)}
                className="w-full p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Nationalities</option>
                <option value="South Africa">South Africa</option>
                <option value="Ireland">Ireland</option>
                <option value="Scotland">Scotland</option>
                <option value="Wales">Wales</option>
                <option value="Italy">Italy</option>
              </select>
            </div>
          </div>

          {/* Player Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {marketPlayers.slice(0, 30).map(p => {
              const currentClub = clubs.find(c => c.id === p.clubId);
              return (
                <div
                  key={p.id}
                  className="rounded-xl bg-neutral-900/90 border border-neutral-800 p-3.5 flex flex-col justify-between hover:border-neutral-700 transition-all shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-heading font-bold text-sm text-neutral-100">{p.name}</div>
                      <div className="text-[11px] text-neutral-400">
                        {currentClub?.shortName} · {p.nationality} · {p.age} y/o
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-heading font-black text-emerald-400 text-sm font-mono-numbers">
                        OVR {p.overall}
                      </div>
                      <div className="text-[10px] text-amber-400 font-mono-numbers">
                        POT {p.potential}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-numbers p-2 rounded-lg bg-neutral-950 mb-3">
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans uppercase">Position</span>
                      <span className="text-neutral-200">{getPositionShort(p.primaryPosition)}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[10px] block font-sans uppercase">Value</span>
                      <span className="text-neutral-200">{formatMoney(p.marketValue, { compact: true })}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenNegotiation(p)}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs tracking-wide flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Make Transfer Offer</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* OFFICIAL URC REGISTRY DISCOVERY TAB */}
      {activeTab === 'discovery' && (
        <div className="space-y-4">
          {/* Discovery Filter Controls */}
          <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl text-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search 1,091 verified URC players..."
                  value={discoveryQuery}
                  onChange={e => setDiscoveryQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Season Switcher */}
              <div className="flex items-center space-x-1 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800">
                <Calendar className="w-3.5 h-3.5 text-neutral-400 mr-1" />
                {(['2025-26', '2026-27'] as SeasonId[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setDiscoverySeason(s)}
                    className={`px-2.5 py-1 rounded text-[11px] font-heading font-bold cursor-pointer transition-all ${
                      discoverySeason === s ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Club Dropdown */}
              <select
                value={discoveryClub}
                onChange={e => setDiscoveryClub(e.target.value)}
                className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All 16 Clubs</option>
                {clubs.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Position Filter */}
              <select
                value={discoveryPos}
                onChange={e => setDiscoveryPos(e.target.value)}
                className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Positions</option>
                {POSITIONS_ORDER.map(pos => (
                  <option key={pos} value={pos}>{getPositionName(pos)}</option>
                ))}
              </select>
            </div>

            {/* Disclaimer on Real Contract vs Career Availability */}
            <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80 flex items-start space-x-2 text-[11px] text-neutral-400">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-300 font-sans">Official URC Registry Integration: </strong>
                Data sourced from official competition registrations (<a href="https://stats.unitedrugby.com/clubs" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">stats.unitedrugby.com</a>). Real-world club association is preserved. Making a bid simulates career-mode transfer negotiations subject to club acceptance and release compensation.
              </div>
            </div>
          </div>

          {/* Discovery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {discoveryPlayers.slice(0, 60).map(p => (
              <div
                key={p.id}
                className="rounded-xl bg-neutral-900 border border-neutral-800 p-3.5 flex flex-col justify-between shadow-md hover:border-emerald-500/50 transition-all group"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center font-heading font-black text-xs text-white shrink-0">
                        {getPositionShort(p.primaryPosition)}
                      </div>
                      <div>
                        <div className="font-heading font-bold text-sm text-neutral-100 group-hover:text-emerald-400 transition-colors">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono-numbers">
                          {p.clubName} · {p.nationality}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono-numbers text-emerald-400 font-bold block">
                        OVR {p.overall}
                      </span>
                      <span className="text-[9px] uppercase text-neutral-500 font-semibold font-sans">
                        Game Est.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono-numbers p-2 rounded-lg bg-neutral-950 mb-3 text-center">
                    <div>
                      <span className="text-neutral-500 text-[8px] block font-sans uppercase">Age</span>
                      <span className="text-neutral-200">{p.age} yrs</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[8px] block font-sans uppercase">Height</span>
                      <span className="text-neutral-200">{p.heightCm} cm</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[8px] block font-sans uppercase">Weight</span>
                      <span className="text-neutral-200">{p.weightKg} kg</span>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono-numbers text-neutral-300 mb-3 flex items-center justify-between">
                    <span>Val: {formatMoney(p.marketValue, { compact: true })}</span>
                    <span>Wage: {formatMoney(p.weeklyWage, { perWeek: true })}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setInspectedPlayer(p);
                    }}
                    className="py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs cursor-pointer transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => handleOpenNegotiation(p)}
                    className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs tracking-wide flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Inquire / Bid</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {discoveryPlayers.length > 60 && (
            <div className="text-center text-xs text-neutral-400 py-2 font-mono-numbers">
              Showing top 60 of {discoveryPlayers.length} verified real players. Use search filters to locate specific athletes.
            </div>
          )}
        </div>
      )}

      {/* SQUAD OUTGOING / SELL TAB */}
      {activeTab === 'mysquad' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {mySquadPlayers.map(p => (
            <div
              key={p.id}
              className="rounded-xl bg-neutral-900 border border-neutral-800 p-3.5 flex flex-col justify-between shadow-md"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-heading font-bold text-sm text-neutral-100">{p.name}</div>
                    <div className="text-[11px] text-neutral-400">{getPositionName(p.primaryPosition)} · {p.age} y/o</div>
                  </div>
                  <span className="text-xs font-mono-numbers text-emerald-400 font-bold">OVR {p.overall}</span>
                </div>
                <div className="text-xs font-mono-numbers text-neutral-300 mb-3">
                  Market Value: {formatMoney(p.marketValue, { compact: true })} · Wage: {formatMoney(p.weeklyWage, { perWeek: true })}
                </div>
              </div>

              <button
                onClick={() => setSellingPlayer(p)}
                className="w-full py-2 px-3 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-800/60 text-red-300 font-medium text-xs tracking-wide cursor-pointer"
              >
                List for Transfer ({formatMoney(p.marketValue, { compact: true })})
              </button>
            </div>
          ))}
        </div>
      )}

      {/* NEGOTIATION MODAL */}
      {negotiatingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 text-neutral-100 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div>
                <h3 className="font-heading font-bold text-base text-white">Transfer Negotiation</h3>
                <p className="text-xs text-neutral-400">{negotiatingPlayer.name} ({negotiatingPlayer.primaryPosition})</p>
              </div>
              <button
                onClick={() => setNegotiatingPlayer(null)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-5 text-xs">
              <div>
                <label className="block text-neutral-400 uppercase font-semibold text-[10px] mb-1">
                  Transfer Fee Offer ({effectiveCurrency.symbol} {effectiveCurrency.code})
                </label>
                <input
                  type="number"
                  step="50000"
                  value={bidFee}
                  onChange={e => setBidFee(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 font-mono-numbers focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-emerald-400 font-mono-numbers mt-0.5 block">
                  Equivalent: {formatMoney(bidFee, { compact: true })}
                </span>
              </div>

              <div>
                <label className="block text-neutral-400 uppercase font-semibold text-[10px] mb-1">
                  Weekly Wage Offer ({effectiveCurrency.symbol} {effectiveCurrency.code})
                </label>
                <input
                  type="number"
                  step="500"
                  value={bidWage}
                  onChange={e => setBidWage(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 font-mono-numbers focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-emerald-400 font-mono-numbers mt-0.5 block">
                  Equivalent: {formatMoney(bidWage, { perWeek: true })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 uppercase font-semibold text-[10px] mb-1">
                    Contract Length
                  </label>
                  <select
                    value={bidYears}
                    onChange={e => setBidYears(Number(e.target.value))}
                    className="w-full p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200"
                  >
                    <option value={1}>1 Year</option>
                    <option value={2}>2 Years</option>
                    <option value={3}>3 Years</option>
                    <option value={4}>4 Years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase font-semibold text-[10px] mb-1">
                    Squad Role Promise
                  </label>
                  <select
                    value={bidRole}
                    onChange={e => setBidRole(e.target.value as any)}
                    className="w-full p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200"
                  >
                    <option value="Key Player">Key Player</option>
                    <option value="First XV">First XV</option>
                    <option value="Squad Rotation">Squad Rotation</option>
                  </select>
                </div>
              </div>

              {feedbackMsg && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold ${
                  feedbackMsg.isError ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {feedbackMsg.text}
                </div>
              )}
            </div>

            <button
              onClick={handleConfirmBid}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-sm tracking-wide shadow-lg cursor-pointer"
            >
              SUBMIT BINDING OFFER
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM SALE MODAL */}
      {sellingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-neutral-100 shadow-2xl">
            <h3 className="font-heading font-bold text-base text-white mb-2">Sell Player</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Are you sure you want to sell {sellingPlayer.name}? A rival club has agreed to meet the asking price of {formatMoney(sellingPlayer.marketValue, { compact: true })}.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setSellingPlayer(null)}
                className="flex-1 py-2 px-3 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSale}
                className="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
              >
                Confirm Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT PLAYER MODAL */}
      {inspectedPlayer && (
        <PlayerProfileModal
          player={inspectedPlayer}
          clubCountry={inspectedPlayer.nationality}
          onEdit={(p) => {
            setEditingPlayer(p);
            setInspectedPlayer(null);
          }}
          onClose={() => setInspectedPlayer(null)}
        />
      )}

      {/* PLAYER EDITOR MODAL */}
      {editingPlayer && (
        <PlayerEditorModal
          player={editingPlayer}
          onSave={(updated) => {
            careerManager.updatePlayer(updated);
            setEditingPlayer(null);
          }}
          onClose={() => setEditingPlayer(null)}
        />
      )}
    </div>
  );
};
