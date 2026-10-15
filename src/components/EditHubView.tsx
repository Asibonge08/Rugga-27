import React, { useState } from 'react';
import { Club, Player, RugbyPosition, FORWARD_POSITIONS, BACK_POSITIONS } from '../types/rugby';
import { LEAGUES, getPositionName, getPositionShort } from '../data/rugbyDatabase';
import { customDbService } from '../services/customDbService';
import { careerManager } from '../services/careerManager';
import { soundFx } from '../services/soundFx';
import { PlayerEditModal } from './PlayerEditModal';
import {
  ChevronLeft,
  Shield,
  Building,
  Users,
  Save,
  RotateCcw,
  Sparkles,
  Sliders,
  CheckCircle2,
  Search,
  Filter,
  Flame,
  ChevronRight,
  UploadCloud,
  Layers,
  MapPin,
  CloudRain,
  Sun,
  Wind
} from 'lucide-react';

interface EditHubViewProps {
  onBack: () => void;
}

type EditTab = 'teams' | 'stadiums' | 'players';

export const EditHubView: React.FC<EditHubViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<EditTab>('teams');
  const [clubs, setClubs] = useState<Club[]>(customDbService.getClubs());
  const [selectedClubId, setSelectedClubId] = useState<string>(clubs[0]?.id || 'stormers');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('URC');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Edit Team state
  const selectedClub = clubs.find(c => c.id === selectedClubId) || clubs[0];
  const [teamForm, setTeamForm] = useState({
    name: selectedClub.name,
    shortName: selectedClub.shortName,
    stadiumName: selectedClub.stadiumName,
    pitchType: selectedClub.pitchType || 'Natural Hybrid Grass',
    primaryColor: selectedClub.primaryColor,
    secondaryColor: selectedClub.secondaryColor,
    accentColor: selectedClub.accentColor || '#FFFFFF'
  });

  // Edit Stadium state
  const [stadiumForm, setStadiumForm] = useState({
    name: selectedClub.stadiumName,
    capacity: selectedClub.stadiumCapacity,
    city: selectedClub.city || selectedClub.country,
    weatherProfile: (selectedClub.weatherProfile || 'Dry') as 'Dry' | 'Wet' | 'Windy',
    pitchType: selectedClub.pitchType || 'Natural Hybrid Grass'
  });

  // Player roster editor state
  const [playerFilter, setPlayerFilter] = useState<'ALL' | 'FORWARDS' | 'BACKS'>('ALL');
  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Fetch all players for current club from active save or generate
  const careerState = careerManager.getState();
  const clubPlayers = careerState.players.filter(p => p.clubId === selectedClubId);

  // When selected club changes, sync forms
  const handleSelectClub = (clubId: string) => {
    soundFx.playClick();
    setSelectedClubId(clubId);
    const c = clubs.find(item => item.id === clubId);
    if (c) {
      setTeamForm({
        name: c.name,
        shortName: c.shortName,
        stadiumName: c.stadiumName,
        pitchType: c.pitchType || 'Natural Hybrid Grass',
        primaryColor: c.primaryColor,
        secondaryColor: c.secondaryColor,
        accentColor: c.accentColor || '#FFFFFF'
      });
      setStadiumForm({
        name: c.stadiumName,
        capacity: c.stadiumCapacity,
        city: c.city || c.country,
        weatherProfile: (c.weatherProfile || 'Dry') as 'Dry' | 'Wet' | 'Windy',
        pitchType: c.pitchType || 'Natural Hybrid Grass'
      });
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleSaveTeam = () => {
    soundFx.playClick();
    const updated = customDbService.updateClub(selectedClubId, {
      name: teamForm.name.trim(),
      shortName: teamForm.shortName.trim().toUpperCase().slice(0, 4),
      stadiumName: teamForm.stadiumName.trim(),
      pitchType: teamForm.pitchType,
      primaryColor: teamForm.primaryColor,
      secondaryColor: teamForm.secondaryColor,
      accentColor: teamForm.accentColor
    });
    setClubs(customDbService.getClubs());
    showToast(`✓ Saved team updates for ${updated.name}`);
  };

  const handleSaveStadium = () => {
    soundFx.playClick();
    const updated = customDbService.updateClub(selectedClubId, {
      stadiumName: stadiumForm.name.trim(),
      stadiumCapacity: Number(stadiumForm.capacity) || 45000,
      city: stadiumForm.city.trim(),
      weatherProfile: stadiumForm.weatherProfile,
      pitchType: stadiumForm.pitchType
    });
    setClubs(customDbService.getClubs());
    showToast(`✓ Saved stadium profile: ${updated.stadiumName}`);
  };

  const handleSavePlayer = (updatedPlayer: Player) => {
    customDbService.updatePlayer(updatedPlayer);
    showToast(`✓ Saved ${updatedPlayer.name} (OVR ${updatedPlayer.overall})`);
  };

  const handlePushToActiveSave = () => {
    soundFx.playWhistle('short');
    const res = customDbService.pushAllToActiveSave();
    showToast(res.message);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all team, stadium, and player edits to default official values?')) {
      soundFx.playClick();
      customDbService.resetToDefaults();
      const freshClubs = customDbService.getClubs();
      setClubs(freshClubs);
      handleSelectClub(freshClubs[0]?.id || 'stormers');
      showToast('Database reset to official default data.');
    }
  };

  // Filtered players list
  const filteredPlayers = clubPlayers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
      getPositionShort(p.primaryPosition).toLowerCase().includes(playerSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (playerFilter === 'FORWARDS') return FORWARD_POSITIONS.includes(p.primaryPosition);
    if (playerFilter === 'BACKS') return BACK_POSITIONS.includes(p.primaryPosition);
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col select-none pb-12">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-400 font-semibold text-xs sm:text-sm flex items-center space-x-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-neutral-900/95 border-b border-neutral-800 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => {
              soundFx.playClick();
              onBack();
            }}
            className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white transition-all cursor-pointer"
            title="Back to Title Screen"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-heading font-black text-base sm:text-lg text-white">EDIT HUB</span>
              <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                DATABASE CUSTOMISE
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              Customise teams, stadiums, and squad rosters for new and ongoing saves
            </p>
          </div>
        </div>

        {/* Global DB Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePushToActiveSave}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-heading font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
            title="Push edits to active career"
          >
            <UploadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">Push to Save</span>
          </button>
          <button
            onClick={handleResetToDefaults}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-red-400 border border-neutral-700 transition-all cursor-pointer"
            title="Reset DB to Defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-4xl w-full mx-auto px-4 pt-4">
        <div className="grid grid-cols-3 gap-2 bg-neutral-900 p-1 rounded-2xl border border-neutral-800">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('teams');
            }}
            className={`py-2.5 px-3 rounded-xl font-heading font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'teams'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Edit Teams</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('stadiums');
            }}
            className={`py-2.5 px-3 rounded-xl font-heading font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'stadiums'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Edit Stadiums</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('players');
            }}
            className={`py-2.5 px-3 rounded-xl font-heading font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'players'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Edit Players</span>
          </button>
        </div>

        {/* Club Selector Bar */}
        <div className="mt-4 p-3 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-300">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Select Club:</span>
          </div>
          <div className="flex-1 max-w-sm">
            <select
              value={selectedClubId}
              onChange={(e) => handleSelectClub(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-heading font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {clubs.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.country})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: EDIT TEAMS */}
      {activeTab === 'teams' && (
        <div className="max-w-4xl w-full mx-auto px-4 mt-4 space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-heading font-bold text-base text-white">Team Details & Branding</h3>
                <p className="text-xs text-neutral-400">Customise official club name, short code, and colors</p>
              </div>
              <div
                className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center font-black text-xs shadow-inner"
                style={{ backgroundColor: teamForm.primaryColor, color: teamForm.secondaryColor }}
              >
                {teamForm.shortName}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Full Team Name</label>
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Short Name (3-Letter TRI Code)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={teamForm.shortName}
                  onChange={(e) => setTeamForm({ ...teamForm, shortName: e.target.value.toUpperCase() })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Home Stadium Name</label>
                <input
                  type="text"
                  value={teamForm.stadiumName}
                  onChange={(e) => setTeamForm({ ...teamForm, stadiumName: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Pitch Surface Type</label>
                <select
                  value={teamForm.pitchType}
                  onChange={(e) => setTeamForm({ ...teamForm, pitchType: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Natural Hybrid Grass">Natural Hybrid Grass (Desso GrassMaster)</option>
                  <option value="Synthetic Turf">Synthetic Turf 4G (Fast ball bounce)</option>
                  <option value="Standard Grass">Standard Natural Grass (Traditional)</option>
                </select>
              </div>
            </div>

            {/* Kit Colors */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-neutral-300 block mb-3">Kit & Jersey Colors</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Primary Color</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={teamForm.primaryColor}
                      onChange={(e) => setTeamForm({ ...teamForm, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-neutral-700"
                    />
                    <span className="text-[11px] font-mono text-neutral-300">{teamForm.primaryColor}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Secondary Color</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={teamForm.secondaryColor}
                      onChange={(e) => setTeamForm({ ...teamForm, secondaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-neutral-700"
                    />
                    <span className="text-[11px] font-mono text-neutral-300">{teamForm.secondaryColor}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Accent Trim</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={teamForm.accentColor}
                      onChange={(e) => setTeamForm({ ...teamForm, accentColor: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-neutral-700"
                    />
                    <span className="text-[11px] font-mono text-neutral-300">{teamForm.accentColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3 border-t border-neutral-800 flex justify-end">
              <button
                onClick={handleSaveTeam}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>SAVE TEAM EDITS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EDIT STADIUMS */}
      {activeTab === 'stadiums' && (
        <div className="max-w-4xl w-full mx-auto px-4 mt-4 space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-heading font-bold text-base text-white">Stadium & Venue Environment</h3>
                <p className="text-xs text-neutral-400">Configure capacity, regional location, and weather tendencies</p>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-800 text-emerald-400">
                <Building className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Stadium Venue Name</label>
                <input
                  type="text"
                  value={stadiumForm.name}
                  onChange={(e) => setStadiumForm({ ...stadiumForm, name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Seated Capacity</label>
                <input
                  type="number"
                  min="5000"
                  max="120000"
                  step="500"
                  value={stadiumForm.capacity}
                  onChange={(e) => setStadiumForm({ ...stadiumForm, capacity: Number(e.target.value) })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono-numbers focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">City / Region Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={stadiumForm.city}
                    onChange={(e) => setStadiumForm({ ...stadiumForm, city: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Predominant Weather Profile</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Dry', 'Wet', 'Windy'] as const).map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setStadiumForm({ ...stadiumForm, weatherProfile: w })}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                        stadiumForm.weatherProfile === w
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                      }`}
                    >
                      {w === 'Dry' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
                      {w === 'Wet' && <CloudRain className="w-3.5 h-3.5 text-blue-400" />}
                      {w === 'Windy' && <Wind className="w-3.5 h-3.5 text-teal-400" />}
                      <span>{w}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3 border-t border-neutral-800 flex justify-end">
              <button
                onClick={handleSaveStadium}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>SAVE STADIUM EDITS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EDIT PLAYERS (SQUAD ROSTER EDITOR) */}
      {activeTab === 'players' && (
        <div className="max-w-4xl w-full mx-auto px-4 mt-4 space-y-4">
          {/* Quick Filters & Search */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="font-heading font-bold text-sm text-white">
                  {selectedClub.name} Squad Roster
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono-numbers">
                  {filteredPlayers.length} Players
                </span>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-1.5">
                {(['ALL', 'FORWARDS', 'BACKS'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => {
                      soundFx.playClick();
                      setPlayerFilter(f);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      playerFilter === f
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {f === 'ALL' ? 'All Squad' : f === 'FORWARDS' ? 'Forwards Pack' : 'Backline'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search player name or position (e.g. Kolisi, Prop)..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Roster List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredPlayers.map(p => {
              const isFwd = FORWARD_POSITIONS.includes(p.primaryPosition);

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    soundFx.playClick();
                    setEditingPlayer(p);
                  }}
                  className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 flex items-center justify-between transition-all cursor-pointer group shadow-sm active:scale-[0.98]"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-heading font-black shrink-0 shadow-inner ${
                        p.overall >= 85
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : p.overall >= 78
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                      }`}
                    >
                      <span className="text-xs leading-none">{p.overall}</span>
                      <span className="text-[8px] font-sans text-neutral-400 uppercase tracking-tighter mt-0.5">OVR</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="font-heading font-bold text-xs text-white truncate group-hover:text-emerald-400 transition-colors">
                          {p.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] text-neutral-400 mt-0.5">
                        <span className="text-emerald-400 font-semibold">{getPositionShort(p.primaryPosition)}</span>
                        <span>·</span>
                        <span>{p.age} yrs</span>
                        <span>·</span>
                        <span className="text-amber-400 font-mono-numbers">POT {p.potential}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-neutral-800 group-hover:bg-emerald-600 text-neutral-300 group-hover:text-white flex items-center justify-center transition-all">
                      <Sliders className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PLAYER EDIT MODAL (Granular Rugby Attribute Editor + Sequential Navigation) */}
      {editingPlayer && (
        <PlayerEditModal
          player={editingPlayer}
          playerList={filteredPlayers}
          clubCountry={selectedClub.country}
          onSave={(updated) => {
            handleSavePlayer(updated);
            setEditingPlayer(null);
          }}
          onClose={() => setEditingPlayer(null)}
          onSelectPlayer={(next) => setEditingPlayer(next)}
        />
      )}
    </div>
  );
};
