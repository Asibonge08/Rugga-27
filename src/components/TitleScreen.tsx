import React, { useState } from 'react';
import { Club, LeagueId, TacticsConfig } from '../types/rugby';
import { LEAGUES, INITIAL_CLUBS } from '../data/rugbyDatabase';
import { soundFx } from '../services/soundFx';
import { useCurrency } from '../services/currencyService';
import { CurrencySelector } from './CurrencySelector';
import { getRivalry } from '../data/rugbyRivalries';
import { careerManager } from '../services/careerManager';
import { KickOffSquadModal } from './KickOffSquadModal';
import { Play, Shield, Trophy, Users, Sparkles, ChevronRight, Volume2, VolumeX, Dices, Swords, X, Flame, Database, Sliders } from 'lucide-react';

interface TitleScreenProps {
  onStartCareer: (clubId: string, managerName: string) => void;
  onResumeCareer?: () => void;
  onQuickMatch: (
    homeClubId: string,
    awayClubId: string,
    userClubId: string,
    customLineup?: { startingXV: Record<number, string>; bench: Record<number, string> },
    customTactics?: TacticsConfig
  ) => void;
  hasExistingSave: boolean;
  onOpenRegistry?: () => void;
  onOpenEditHub?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartCareer,
  onResumeCareer,
  onQuickMatch,
  hasExistingSave,
  onOpenRegistry,
  onOpenEditHub
}) => {
  const [selectedLeague, setSelectedLeague] = useState<LeagueId>('URC');
  const [selectedClubId, setSelectedClubId] = useState<string>('leinster');
  const [managerName, setManagerName] = useState<string>('Victor Matfield');
  const [showClubSelect, setShowClubSelect] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundFx.getMuted());

  // Exhibition match state
  const [showExhibitionModal, setShowExhibitionModal] = useState<boolean>(false);
  const [showKickOffSquadModal, setShowKickOffSquadModal] = useState<boolean>(false);
  const [exhibitionUserClubId, setExhibitionUserClubId] = useState<string>('stormers');
  const [exhibitionOpponentClubId, setExhibitionOpponentClubId] = useState<string>('bulls');
  const [isUserHome, setIsUserHome] = useState<boolean>(true);

  const leagueClubs = INITIAL_CLUBS.filter(c => c.leagueId === selectedLeague);
  const activeClub = INITIAL_CLUBS.find(c => c.id === selectedClubId) || leagueClubs[0] || INITIAL_CLUBS[0];
  const { formatMoney } = useCurrency(activeClub.country);

  const handleStart = () => {
    soundFx.playWhistle('short');
    onStartCareer(activeClub.id, managerName.trim() || 'Head Coach');
  };

  const handleToggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
    if (!muted) soundFx.playClick();
  };

  return (
    <div className="relative w-full min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between overflow-x-hidden select-none">
      {/* Live Atmospheric Background: Subtle Animated Rugby Pitch Markings & Lights */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(34,197,94,0.35),rgba(6,19,11,0))]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] border border-emerald-500/30 rounded-2xl rotate-3 scale-110">
          <div className="w-full h-full border-b border-emerald-500/20 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border border-emerald-500/30" />
          </div>
        </div>
      </div>

      {/* Top Bar / Quick Settings */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2 text-xs tracking-widest uppercase text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
          <span>SIMULATION ENGINE V2.4 · ANDROID READY</span>
        </div>
        <div className="flex items-center space-x-2">
          <CurrencySelector clubCountry={activeClub.country} />
          <button
            onClick={handleToggleSound}
            className="px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white hover:border-emerald-500/50 transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-mono"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Muted' : 'Audio ON'}</span>
          </button>
        </div>
      </header>

      {/* Hero Centerpiece & Bespoke Title Lockup inside Framed Glass Card */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-6 py-8 sm:py-10 flex flex-col items-center justify-center text-center rounded-3xl border border-neutral-900/90 bg-neutral-950/40 backdrop-blur-[2px] shadow-2xl my-auto">
        {/* Bespoke Rugga 27 Logo Lockup */}
        <div className="mb-4">
          <svg viewBox="0 0 520 110" className="w-80 sm:w-[420px] md:w-[480px] h-auto drop-shadow-[0_12px_30px_rgba(16,185,129,0.3)]">
            <defs>
              <linearGradient id="ruggaGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="45%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <linearGradient id="ruggaEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#c2410c" />
              </linearGradient>
            </defs>

            {/* Background rugby shield glow */}
            <path d="M260 5 L370 20 L350 78 Q260 105 260 105 Q170 105 150 78 L130 20 Z" fill="rgba(16,185,129,0.06)" stroke="url(#ruggaEmerald)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6"/>

            {/* Wireframe Rugby Ball rings behind lettering */}
            <ellipse cx="260" cy="50" rx="112" ry="38" fill="none" stroke="#10b981" strokeWidth="1.2" opacity="0.45" transform="rotate(-6 260 50)"/>
            <ellipse cx="260" cy="50" rx="88" ry="26" fill="none" stroke="#22c55e" strokeWidth="1.2" opacity="0.55" transform="rotate(-6 260 50)"/>
            <path d="M152 48 Q260 26 368 52" fill="none" stroke="#22c55e" strokeWidth="1.2" opacity="0.45"/>
            <path d="M152 52 Q260 74 368 48" fill="none" stroke="#22c55e" strokeWidth="1.2" opacity="0.45"/>

            {/* "RUGGA" Main Wordmark in classic bold italic serif font */}
            <text x="215" y="58" textAnchor="middle" fill="#ffffff" fontFamily="Georgia, 'Times New Roman', serif" fontSize="54" fontWeight="bold" fontStyle="italic" letterSpacing="2" filter="drop-shadow(0 2px 10px rgba(0,0,0,0.9))">
              RUGGA
            </text>

            {/* "27" Athletic Badge with curved rounded corners */}
            <g transform="translate(325, 13)">
              <rect x="0" y="0" width="80" height="52" rx="14" fill="url(#badgeGrad)" stroke="#ea580c" strokeWidth="1" />
              <text x="40" y="38" textAnchor="middle" fill="#ffffff" fontFamily="Inter, sans-serif" fontSize="36" fontWeight="900" fontStyle="italic">
                27
              </text>
            </g>

            {/* Subtitle */}
            <text x="260" y="96" textAnchor="middle" fill="#22c55e" fontFamily="Inter, monospace" fontSize="11" fontWeight="800" letterSpacing="6">
              OFFICIAL RUGBY UNION MANAGER
            </text>
          </svg>
        </div>

        <p className="text-neutral-400 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
          Take the helm of official URC rugby clubs. Master matchday substitutions, hybrid player versatility, tactical battles, set-piece dominance, and authentic rivalries in Rugga 27.
        </p>

        {/* Action Panel matching screenshot_1.png */}
        {!showClubSelect ? (
          <div className="w-full max-w-md flex flex-col space-y-3.5">
            {/* Resume Career Button with glowing outer container */}
            <div className="w-full p-1 rounded-2xl border-2 border-emerald-500/80 bg-[#063321] shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all transform hover:-translate-y-0.5">
              <button
                onClick={() => {
                  soundFx.playClick();
                  if (onResumeCareer) onResumeCareer();
                  else onStartCareer(selectedClubId, managerName);
                }}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-heading font-black text-sm tracking-widest flex items-center justify-center space-x-2.5 transition-all cursor-pointer shadow-inner"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                <span>RESUME CAREER</span>
              </button>
            </div>

            {/* Start New Career Button */}
            <button
              onClick={() => {
                soundFx.playClick();
                setShowClubSelect(true);
              }}
              className="w-full py-3.5 px-6 rounded-xl bg-[#121614] hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/60 text-white font-heading font-black text-sm tracking-wider flex items-center justify-center space-x-2.5 transition-all cursor-pointer shadow-md"
            >
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>START NEW CAREER</span>
            </button>

            {/* Edit Hub / Customise Button */}
            <button
              onClick={() => {
                soundFx.playClick();
                if (onOpenEditHub) onOpenEditHub();
              }}
              className="w-full py-3.5 px-6 rounded-xl bg-[#0d1f15] hover:bg-[#142e20] border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white font-heading font-black text-sm tracking-wider flex items-center justify-center space-x-2.5 transition-all cursor-pointer shadow-md"
            >
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>EDIT HUB / CUSTOMISE</span>
            </button>

            {/* Kick Off Button */}
            <button
              onClick={() => {
                soundFx.playClick();
                setShowExhibitionModal(true);
              }}
              className="w-full py-3.5 px-6 rounded-xl bg-[#201505] hover:bg-[#2c1d07] border border-amber-600/60 hover:border-amber-500 text-amber-400 font-heading font-black text-sm tracking-widest flex items-center justify-center space-x-2.5 transition-all cursor-pointer shadow-[0_0_20px_rgba(217,119,6,0.25)]"
            >
              <Play className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>KICK OFF</span>
            </button>
          </div>
        ) : (
          /* Club & Competition Selection Flow */
          <div className="w-full max-w-2xl bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 sm:p-6 text-left shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-5">
              <div>
                <h3 className="font-heading font-bold text-lg text-emerald-400">Select Starting Club</h3>
                <p className="text-xs text-neutral-400">Choose your competition and take the managerial helm</p>
              </div>
              <button
                onClick={() => setShowClubSelect(false)}
                className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg bg-neutral-800 cursor-pointer"
              >
                Back
              </button>
            </div>

            {/* URC Official Shield Filter Tabs */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-heading font-bold text-emerald-400 tracking-wider">
                UNITED RUGBY CHAMPIONSHIP (16 CLUBS)
              </span>
              <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/60 font-mono-numbers">
                Official 2026 Season
              </span>
            </div>

            {/* Club Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5 max-h-56 overflow-y-auto pr-1">
              {leagueClubs.map(c => {
                const isSelected = c.id === selectedClubId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedClubId(c.id);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                        : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0"
                        style={{ backgroundColor: c.primaryColor }}
                      />
                      <span className="font-heading font-bold text-xs truncate text-neutral-100">{c.shortName}</span>
                    </div>
                    <div className="text-[10px] text-neutral-400">Rep: {c.reputation} | {formatMoney(c.transferBudget, { compact: true, clubCountry: c.country })}</div>
                  </button>
                );
              })}
            </div>

            {/* Manager Name Input & Club Summary */}
            <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800 mb-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="w-full sm:w-1/2">
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  Manager Full Name
                </label>
                <input
                  type="text"
                  value={managerName}
                  onChange={e => setManagerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Victor Matfield"
                />
              </div>

              <div className="w-full sm:w-1/2 flex items-center justify-end space-x-3 text-right">
                <div>
                  <div className="font-heading font-bold text-sm text-white">{activeClub.name}</div>
                  <div className="text-xs text-neutral-400">{activeClub.stadiumName}</div>
                  <div className="text-xs text-emerald-400 font-mono-numbers">
                    Budget: {formatMoney(activeClub.transferBudget, { compact: true })}
                  </div>
                </div>
              </div>
            </div>

            {/* Launch CTA */}
            <button
              onClick={handleStart}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-base tracking-wide flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            >
              <span>ACCEPT APPOINTMENT & BEGIN</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>

      {/* EXHIBITION MATCH SETUP MODAL */}
      {showExhibitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 text-neutral-100 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Swords className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-white">Kick Off Match Setup</h3>
                  <p className="text-[11px] text-neutral-400">Pick your club and opposition to kick off an instant 2D match</p>
                </div>
              </div>
              <button
                onClick={() => setShowExhibitionModal(false)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Classic Derby Presets */}
            <div className="mb-4 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-2 flex items-center space-x-1">
                <Flame className="w-3 h-3 text-red-500 fill-current" />
                <span>Featured Classic URC Derbies</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'North-South Derby', teamA: 'stormers', teamB: 'bulls' },
                  { name: 'Irish Interpro', teamA: 'leinster', teamB: 'munster' },
                  { name: 'The 1872 Cup', teamA: 'glasgow', teamB: 'edinburgh' },
                  { name: 'West Wales Derby', teamA: 'ospreys', teamB: 'scarlets' },
                  { name: 'Derby Italiano', teamA: 'benetton', teamB: 'zebre' }
                ].map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      soundFx.playClick();
                      setExhibitionUserClubId(preset.teamA);
                      setExhibitionOpponentClubId(preset.teamB);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-500/60 text-xs text-neutral-200 hover:text-amber-300 font-medium transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <span>🔥</span>
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Team Selection Grid */}
            <div className="space-y-4 mb-5">
              {/* Pick Your Team */}
              <div>
                <label className="block text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">
                  1. Select Your Team (You Control)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                  {INITIAL_CLUBS.map(club => {
                    const isSelected = club.id === exhibitionUserClubId;
                    return (
                      <button
                        key={club.id}
                        onClick={() => {
                          soundFx.playClick();
                          setExhibitionUserClubId(club.id);
                          if (club.id === exhibitionOpponentClubId) {
                            // Automatically pick a different opponent
                            const other = INITIAL_CLUBS.find(c => c.id !== club.id);
                            if (other) setExhibitionOpponentClubId(other.id);
                          }
                        }}
                        className={`p-2 rounded-xl border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
                            : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                        }`}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: club.primaryColor }}
                        />
                        <div className="truncate">
                          <div className="font-heading font-bold text-xs truncate text-neutral-100">{club.shortName}</div>
                          <div className="text-[9px] text-neutral-400">{club.country}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pick Opponent Team */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                    2. Select Opponent Team (AI Controls)
                  </label>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      const available = INITIAL_CLUBS.filter(c => c.id !== exhibitionUserClubId);
                      const random = available[Math.floor(Math.random() * available.length)];
                      if (random) setExhibitionOpponentClubId(random.id);
                    }}
                    className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center space-x-1 cursor-pointer"
                  >
                    <Dices className="w-3 h-3" />
                    <span>Random Opponent</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                  {INITIAL_CLUBS.filter(c => c.id !== exhibitionUserClubId).map(club => {
                    const isSelected = club.id === exhibitionOpponentClubId;
                    return (
                      <button
                        key={club.id}
                        onClick={() => {
                          soundFx.playClick();
                          setExhibitionOpponentClubId(club.id);
                        }}
                        className={`p-2 rounded-xl border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500'
                            : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                        }`}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: club.primaryColor }}
                        />
                        <div className="truncate">
                          <div className="font-heading font-bold text-xs truncate text-neutral-100">{club.shortName}</div>
                          <div className="text-[9px] text-neutral-400">{club.country}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Venue Selection */}
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  3. Match Venue
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setIsUserHome(true);
                    }}
                    className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                      isUserHome
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                    }`}
                  >
                    Home Advantage (Your Stadium)
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setIsUserHome(false);
                    }}
                    className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                      !isUserHome
                        ? 'border-blue-500 bg-blue-950/40 text-blue-300 font-bold'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                    }`}
                  >
                    Away Fixture (Opponent Stadium)
                  </button>
                </div>
              </div>

              {/* Clash Preview Banner */}
              {(() => {
                const homeClub = isUserHome
                  ? INITIAL_CLUBS.find(c => c.id === exhibitionUserClubId) || INITIAL_CLUBS[0]
                  : INITIAL_CLUBS.find(c => c.id === exhibitionOpponentClubId) || INITIAL_CLUBS[1];
                const awayClub = isUserHome
                  ? INITIAL_CLUBS.find(c => c.id === exhibitionOpponentClubId) || INITIAL_CLUBS[1]
                  : INITIAL_CLUBS.find(c => c.id === exhibitionUserClubId) || INITIAL_CLUBS[0];
                const derby = getRivalry(homeClub.id, awayClub.id);

                return (
                  <div className="space-y-2">
                    {derby && (
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-red-950/80 via-amber-950/70 to-neutral-900 border border-amber-500/50 flex flex-wrap items-center justify-between text-xs px-3">
                        <div className="flex items-center space-x-2">
                          <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-bold text-[9px] uppercase flex items-center space-x-1">
                            <Flame className="w-2.5 h-2.5 fill-current animate-pulse" />
                            <span>OFFICIAL DERBY</span>
                          </span>
                          <span className="font-heading font-bold text-amber-300">{derby.name}</span>
                        </div>
                        {derby.trophyName && (
                          <span className="text-[10px] text-amber-200 font-medium flex items-center space-x-1">
                            <Trophy className="w-3 h-3 text-amber-400" />
                            <span>{derby.trophyName}</span>
                          </span>
                        )}
                      </div>
                    )}

                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-center">
                      <div className="flex-1 flex flex-col items-center">
                        <div
                          className="w-10 h-10 rounded-xl border-2 border-white/20 shadow-md flex items-center justify-center font-heading font-black text-sm text-white mb-1"
                          style={{ backgroundColor: homeClub.primaryColor }}
                        >
                          {homeClub.shortName.substring(0, 3).toUpperCase()}
                        </div>
                        <div className="font-heading font-bold text-xs text-white truncate max-w-[120px]">{homeClub.name}</div>
                        <div className="text-[10px] text-emerald-400 font-mono-numbers">Rep: {homeClub.reputation}</div>
                      </div>

                      <div className="px-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-heading font-bold text-[10px] mb-0.5 ${
                          derby ? 'bg-amber-600 text-white' : 'bg-neutral-800 border border-neutral-700 text-neutral-300'
                        }`}>
                          {derby ? '🔥' : 'VS'}
                        </div>
                        <div className="text-[9px] text-neutral-400 uppercase tracking-widest truncate max-w-[110px]">
                          {homeClub.stadiumName}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col items-center">
                        <div
                          className="w-10 h-10 rounded-xl border-2 border-white/20 shadow-md flex items-center justify-center font-heading font-black text-sm text-white mb-1"
                          style={{ backgroundColor: awayClub.primaryColor }}
                        >
                          {awayClub.shortName.substring(0, 3).toUpperCase()}
                        </div>
                        <div className="font-heading font-bold text-xs text-white truncate max-w-[120px]">{awayClub.name}</div>
                        <div className="text-[10px] text-blue-400 font-mono-numbers">Rep: {awayClub.reputation}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Launch Match Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => setShowExhibitionModal(false)}
                className="py-2.5 px-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowExhibitionModal(false);
                  setShowKickOffSquadModal(true);
                }}
                className="flex-1 py-2.5 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-heading font-bold text-xs tracking-wide flex items-center justify-center space-x-2 shadow-lg shadow-amber-950 transition-all cursor-pointer"
                title="Select Starting XV, Bench and Match Tactics before Kick Off"
              >
                <Users className="w-4 h-4" />
                <span>SELECT SQUAD & TACTICS</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playWhistle('short');
                  const homeId = isUserHome ? exhibitionUserClubId : exhibitionOpponentClubId;
                  const awayId = isUserHome ? exhibitionOpponentClubId : exhibitionUserClubId;
                  setShowExhibitionModal(false);
                  onQuickMatch(homeId, awayId, exhibitionUserClubId);
                }}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-xs tracking-wide flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                title="Quick Match with optimal lineup"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>QUICK KICK OFF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KICK OFF SQUAD SELECTION MODAL */}
      {showKickOffSquadModal && (
        <KickOffSquadModal
          isOpen={showKickOffSquadModal}
          onClose={() => setShowKickOffSquadModal(false)}
          homeClub={isUserHome
            ? INITIAL_CLUBS.find(c => c.id === exhibitionUserClubId) || INITIAL_CLUBS[0]
            : INITIAL_CLUBS.find(c => c.id === exhibitionOpponentClubId) || INITIAL_CLUBS[1]}
          awayClub={isUserHome
            ? INITIAL_CLUBS.find(c => c.id === exhibitionOpponentClubId) || INITIAL_CLUBS[1]
            : INITIAL_CLUBS.find(c => c.id === exhibitionUserClubId) || INITIAL_CLUBS[0]}
          userClubId={exhibitionUserClubId}
          allPlayers={careerManager.getState().players}
          onStartMatch={(lineup, tactics) => {
            setShowKickOffSquadModal(false);
            const homeId = isUserHome ? exhibitionUserClubId : exhibitionOpponentClubId;
            const awayId = isUserHome ? exhibitionOpponentClubId : exhibitionUserClubId;
            onQuickMatch(homeId, awayId, exhibitionUserClubId, lineup, tactics);
          }}
        />
      )}

      {/* Flat Control Hint Line (Anti-AI Slop constitution requirement) */}
      <footer className="relative z-10 w-full px-6 py-4 flex items-center justify-center border-t border-neutral-900 text-neutral-500 text-xs font-mono-numbers">
        <span>Touch / Click Navigate · Space Quick Action · 60fps Rugby Match Engine</span>
      </footer>
    </div>
  );
};
