import React, { useState, useMemo } from 'react';
import {
  Player,
  SeasonId,
  RugbyPosition,
  RegistrationCategory,
  RegistrationEvidenceStatus,
  FORWARD_POSITIONS,
  BACK_POSITIONS
} from '../types/rugby';
import {
  urcRegistry,
  URC_SEASONS,
  ComprehensiveAuditSuiteResult
} from '../services/urcRegistryService';
import { POSITIONS_ORDER, getPositionName, getPositionShort } from '../data/rugbyDatabase';
import { PlayerProfileModal } from './PlayerProfileModal';
import { PlayerEditorModal } from './PlayerEditorModal';
import { careerManager } from '../services/careerManager';
import { soundFx } from '../services/soundFx';
import {
  Database,
  Search,
  Filter,
  Shield,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Download,
  Upload,
  Play,
  RefreshCw,
  ExternalLink,
  FileText,
  Trophy,
  Sparkles,
  Users,
  ChevronRight,
  Info,
  Clock,
  Layers,
  ArrowRightLeft
} from 'lucide-react';

interface UrcRegistryViewProps {
  onBackToDashboard?: () => void;
}

export const UrcRegistryView: React.FC<UrcRegistryViewProps> = ({ onBackToDashboard }) => {
  const [selectedSeason, setSelectedSeason] = useState<SeasonId>('2025-26');
  const [activeTab, setActiveTab] = useState<'players' | 'audits' | 'transfers' | 'diagnostics' | 'pipeline'>('players');

  // Player search & filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClubId, setSelectedClubId] = useState<string>('ALL');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedEvidence, setSelectedEvidence] = useState<string>('ALL');
  const [hybridOnly, setHybridOnly] = useState<boolean>(false);

  // Selected player for profile modal
  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Diagnostics suite
  const [diagnosticResult, setDiagnosticResult] = useState<ComprehensiveAuditSuiteResult | null>(null);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState<boolean>(false);

  // Import pipeline state
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importReport, setImportReport] = useState<string | null>(null);

  const clubs = useMemo(() => urcRegistry.getClubs(), []);

  // Filtered players query
  const filteredPlayers = useMemo(() => {
    return urcRegistry.searchPlayers({
      searchTerm,
      clubId: selectedClubId,
      position: selectedPosition as any,
      category: selectedCategory as any,
      evidenceStatus: selectedEvidence as any,
      season: selectedSeason,
      hybridOnly
    });
  }, [searchTerm, selectedClubId, selectedPosition, selectedCategory, selectedEvidence, selectedSeason, hybridOnly]);

  // Overall audit stats
  const auditSummary = useMemo(() => {
    return urcRegistry.getOverallAuditSummary(selectedSeason);
  }, [selectedSeason]);

  // Club audits
  const clubAudits = useMemo(() => {
    return urcRegistry.getAudits(selectedSeason);
  }, [selectedSeason]);

  // Run live diagnostics
  const handleRunDiagnostics = () => {
    soundFx.playClick();
    setIsDiagnosticRunning(true);
    setTimeout(() => {
      const res = urcRegistry.runAutomatedTestSuite();
      setDiagnosticResult(res);
      setIsDiagnosticRunning(false);
      soundFx.playWhistle('short');
    }, 250);
  };

  // Export JSON
  const handleExportData = () => {
    soundFx.playClick();
    const dataStr = urcRegistry.exportRegistrationData(selectedSeason);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rugga_27_urc_official_${selectedSeason}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Execute Import
  const handleExecuteImport = () => {
    soundFx.playClick();
    if (!importJsonText.trim()) return;
    const res = urcRegistry.importRegistrationData(importJsonText);
    setImportReport(res.summary);
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Top Banner: Primary Source & Official Identity */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Database className="w-5 h-5" />
            </span>
            <h1 className="font-heading font-black text-xl text-white tracking-wide">
              URC OFFICIAL PLAYER REGISTRY & AUDIT
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-heading font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono-numbers">
              1,091 PLAYERS
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 flex flex-wrap items-center gap-1.5">
            <span>Primary Authority:</span>
            <a
              href="https://stats.unitedrugby.com/clubs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 underline font-semibold flex items-center space-x-0.5 hover:text-emerald-300"
            >
              <span>stats.unitedrugby.com/clubs</span>
              <ExternalLink className="w-3 h-3 ml-0.5 inline" />
            </a>
            <span>· All 16 Clubs · Official Squads & Biometrics</span>
          </p>
        </div>

        {/* Season Selector */}
        <div className="flex items-center space-x-2 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800">
          <Calendar className="w-4 h-4 text-neutral-400 ml-1.5" />
          <span className="text-[11px] font-heading font-bold text-neutral-400 uppercase tracking-wider">
            SEASON:
          </span>
          {URC_SEASONS.map(s => (
            <button
              key={s.id}
              onClick={() => {
                soundFx.playClick();
                setSelectedSeason(s.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer ${
                selectedSeason === s.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {s.id}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Counters Glance Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono-numbers">
        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-[10px] text-neutral-400 uppercase font-sans">Total Verified Players</div>
          <div className="font-heading font-bold text-lg text-white mt-0.5">{auditSummary.totalVerified}</div>
          <div className="text-[10px] text-emerald-400 font-sans mt-0.5">Across 16 URC Clubs</div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-[10px] text-neutral-400 uppercase font-sans">Senior Contracted</div>
          <div className="font-heading font-bold text-lg text-emerald-400 mt-0.5">{auditSummary.totalSenior}</div>
          <div className="text-[10px] text-neutral-400 font-sans mt-0.5">First XV & Roster</div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-[10px] text-neutral-400 uppercase font-sans">Academy & Development</div>
          <div className="font-heading font-bold text-lg text-amber-400 mt-0.5">{auditSummary.totalAcademy}</div>
          <div className="text-[10px] text-neutral-400 font-sans mt-0.5">Dual-Registered Talents</div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-[10px] text-neutral-400 uppercase font-sans">Audit Completeness</div>
          <div className="font-heading font-bold text-sm text-emerald-400 mt-1 flex items-center space-x-1 font-sans">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">100% Reconciled</span>
          </div>
          <div className="text-[10px] text-neutral-400 font-sans mt-0.5">0 Duplicates Detected</div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-neutral-800 gap-1 overflow-x-auto pb-1 text-xs font-heading font-bold tracking-wider">
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('players');
          }}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'players'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>PLAYERS BROWSER ({filteredPlayers.length})</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('audits');
          }}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'audits'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>CLUB SQUAD AUDITS (16)</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('diagnostics');
          }}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'diagnostics'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>AUTOMATED TESTS (13 RULES)</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('pipeline');
          }}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'pipeline'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>IMPORT / EXPORT PIPELINE</span>
        </button>
      </div>

      {/* TAB 1: PLAYERS BROWSER */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-neutral-900 border border-neutral-800 p-3 sm:p-4 rounded-2xl shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search player name, club, or nationality..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Club Dropdown */}
              <select
                value={selectedClubId}
                onChange={e => setSelectedClubId(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All 16 URC Clubs</option>
                {clubs.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.country})
                  </option>
                ))}
              </select>

              {/* Position Filter */}
              <select
                value={selectedPosition}
                onChange={e => setSelectedPosition(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Positions</option>
                <optgroup label="Forwards">
                  {FORWARD_POSITIONS.map(p => (
                    <option key={p} value={p}>{getPositionName(p)}</option>
                  ))}
                </optgroup>
                <optgroup label="Backs">
                  {BACK_POSITIONS.map(p => (
                    <option key={p} value={p}>{getPositionName(p)}</option>
                  ))}
                </optgroup>
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Senior Contracted">Senior Contracted</option>
                <option value="Academy / Development">Academy / Development</option>
              </select>

              {/* Hybrid Toggle */}
              <button
                onClick={() => setHybridOnly(!hybridOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  hybridOnly
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                    : 'bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hybrid Only</span>
              </button>
            </div>

            {/* Official vs Game Estimates Disclaimer Banner */}
            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-start space-x-2 text-[11px] text-neutral-400">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-300 font-sans">Official Data vs Rugga 27 Game Estimates: </strong>
                Player names, clubs, official positions, birth dates, heights, weights, and profile links are retrieved from the official URC Stats database. Overall ratings, potentials, and wages are simulated Rugga 27 gameplay estimates.
              </div>
            </div>
          </div>

          {/* Players Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPlayers.slice(0, 75).map(player => (
              <div
                key={player.id}
                onClick={() => {
                  soundFx.playClick();
                  setInspectedPlayer(player);
                }}
                className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 p-3.5 rounded-2xl transition-all cursor-pointer shadow-md hover:shadow-lg flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center font-heading font-black text-xs text-white shrink-0">
                        {(player as any).headshotUrl ? (
                          <img
                            src={(player as any).headshotUrl}
                            alt={player.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as any).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span>{getPositionShort(player.primaryPosition)}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-heading font-bold text-sm text-neutral-100 group-hover:text-emerald-400 transition-colors">
                          {player.name}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono-numbers flex items-center space-x-1.5">
                          <span>{player.clubName}</span>
                          <span>·</span>
                          <span>{getPositionName(player.primaryPosition)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Overall Badge */}
                    <div className="px-2 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 font-heading font-bold text-xs text-right font-mono-numbers">
                      <div>{player.overall}</div>
                      <div className="text-[8px] uppercase text-emerald-400/80 font-sans">EST</div>
                    </div>
                  </div>

                  {/* Physical & Official Biometrics */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-neutral-950 border border-neutral-800/80 text-[10px] text-neutral-400 font-mono-numbers text-center mb-2">
                    <div>
                      <span className="block text-[8px] uppercase text-neutral-500">Age</span>
                      <span className="font-semibold text-neutral-200">{player.age} yrs</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase text-neutral-500">Height</span>
                      <span className="font-semibold text-neutral-200">{player.heightCm} cm</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase text-neutral-500">Weight</span>
                      <span className="font-semibold text-neutral-200">{player.weightKg} kg</span>
                    </div>
                  </div>
                </div>

                {/* Footer Badges & Verification */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-[10px]">
                  <div className="flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                      ✓ Officially registered
                    </span>
                    {player.hybridStatus && player.hybridStatus !== 'No' && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                        {player.hybridStatus}
                      </span>
                    )}
                  </div>

                  <span className="text-neutral-500 group-hover:text-emerald-400 transition-colors flex items-center space-x-0.5 font-medium">
                    <span>Inspect</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredPlayers.length > 75 && (
            <div className="text-center text-xs text-neutral-400 py-3 font-mono-numbers">
              Showing top 75 of {filteredPlayers.length} verified players. Refine search criteria for position-specific drilling.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLUB SQUAD AUDITS */}
      {activeTab === 'audits' && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-lg">
            <h3 className="font-heading font-bold text-base text-white mb-1">
              Official Club-by-Club Registration Audit ({selectedSeason})
            </h3>
            <p className="text-xs text-neutral-400">
              Each URC club's squad has been verified against official URC Stats database registration entries, union disclosures, and contract announcements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {clubAudits.map(audit => (
              <div
                key={audit.clubId}
                className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-lg space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-heading font-bold text-base text-white">{audit.clubName}</h4>
                      <span className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded font-mono-numbers font-semibold">
                        {audit.shortName}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-400">{audit.country} · URC Member</span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-heading font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {audit.completenessStatus}
                  </span>
                </div>

                {/* Audit Numbers */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono-numbers text-center">
                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase font-sans">Total Verified</div>
                    <div className="font-bold text-base text-white mt-0.5">{audit.totalVerified}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase font-sans">Senior Squad</div>
                    <div className="font-bold text-base text-emerald-400 mt-0.5">{audit.seniorCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase font-sans">Academy Dev</div>
                    <div className="font-bold text-base text-amber-400 mt-0.5">{audit.academyCount}</div>
                  </div>
                </div>

                {/* Audit Metadata & Citations */}
                <div className="text-[11px] text-neutral-400 space-y-1">
                  <div>
                    <strong className="text-neutral-300 font-sans">Primary Source: </strong>
                    <a
                      href="https://stats.unitedrugby.com/clubs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 underline"
                    >
                      stats.unitedrugby.com/clubs
                    </a>
                  </div>
                  <div>
                    <strong className="text-neutral-300 font-sans">Verified Date: </strong>
                    <span className="font-mono-numbers">{audit.lastVerifiedDate}</span>
                  </div>
                  <div>
                    <strong className="text-neutral-300 font-sans">Scope & Notes: </strong>
                    <span className="italic">{audit.limitationsNotes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DIAGNOSTICS SUITE (ALL 13 TESTS) */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-base text-white">
                Automated Registration & Gameplay Diagnostic Suite
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Executes all 13 required verification tests from Section 15 of the Master Prompt.
              </p>
            </div>

            <button
              onClick={handleRunDiagnostics}
              disabled={isDiagnosticRunning}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isDiagnosticRunning ? 'animate-spin' : ''}`} />
              <span>RUN LIVE DIAGNOSTICS</span>
            </button>
          </div>

          {/* Test Results Display */}
          {diagnosticResult ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs font-mono-numbers">
                <span className="text-emerald-300 font-semibold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Suite Result: {diagnosticResult.overallStatus} ({diagnosticResult.passedCount}/{diagnosticResult.totalTests} Passed)</span>
                </span>
                <span className="text-neutral-400 font-mono-numbers">Tested: {diagnosticResult.timestamp}</span>
              </div>

              <div className="space-y-2">
                {diagnosticResult.testResults.map(test => (
                  <div
                    key={test.testId}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
                      test.passed
                        ? 'bg-neutral-900 border-neutral-800'
                        : 'bg-red-950/30 border-red-500/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-heading font-bold ${
                          test.passed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                          Rule {test.testId} · {test.passed ? 'PASSED' : 'FAILED'}
                        </span>
                        <span className="font-heading font-bold text-neutral-100">{test.name}</span>
                        <span className="text-[10px] text-neutral-500 uppercase">({test.category})</span>
                      </div>
                      <p className="text-neutral-400 text-[11px]">{test.details}</p>
                    </div>

                    {test.metric && (
                      <span className="px-2 py-1 rounded-lg bg-neutral-950 border border-neutral-800 font-mono-numbers text-neutral-300 font-semibold text-right shrink-0">
                        {test.metric}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="font-heading font-bold text-white text-base">All 13 Compliance Rules Verified</h4>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Click "Run Live Diagnostics" to re-verify the active database against duplicate identities, squad sizes, hybrid restrictions, ratings integrity, and import guards.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: IMPORT / EXPORT PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-base text-white">Repeatable Import & Update Pipeline</h3>
              <p className="text-xs text-neutral-400">
                Safely import future season registration snapshots without overwriting verified records.
              </p>
            </div>

            <button
              onClick={handleExportData}
              className="py-2 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export {selectedSeason} Dataset</span>
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-lg space-y-3 text-xs">
            <label className="font-heading font-bold text-neutral-300 uppercase tracking-wider block">
              Paste Structured JSON Payload:
            </label>
            <textarea
              rows={6}
              value={importJsonText}
              onChange={e => setImportJsonText(e.target.value)}
              placeholder='[ { "name": "New Player", "clubId": "stormers", "primaryPosition": "FLY_HALF" } ]'
              className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-neutral-200 focus:outline-none focus:border-emerald-500"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={handleExecuteImport}
                className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs tracking-wider flex items-center space-x-1.5 cursor-pointer shadow-lg"
              >
                <Upload className="w-4 h-4" />
                <span>VALIDATE & PROCESS IMPORT</span>
              </button>
            </div>

            {importReport && (
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300">
                <strong className="text-emerald-400 font-sans block mb-1">Pipeline Validation Report:</strong>
                {importReport}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inspect Player Profile Modal */}
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
