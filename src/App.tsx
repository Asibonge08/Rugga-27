import React, { useState, useEffect } from 'react';
import { careerManager, CareerState } from './services/careerManager';
import { TitleScreen } from './components/TitleScreen';
import { DashboardView } from './components/DashboardView';
import { MatchdayView } from './components/MatchdayView';
import { SquadView } from './components/SquadView';
import { TacticsView } from './components/TacticsView';
import { TransfersView } from './components/TransfersView';
import { CompetitionsView } from './components/CompetitionsView';
import { TrainingView } from './components/TrainingView';
import { ClubFinancesView } from './components/ClubFinancesView';
import { YouthAcademyView } from './components/YouthAcademyView';
import { InboxView } from './components/InboxView';
import { UrcRegistryView } from './components/UrcRegistryView';
import { SettingsModal } from './components/SettingsModal';
import { CurrencySelector } from './components/CurrencySelector';
import { CoinStoreModal } from './components/CoinStoreModal';
import { soundFx } from './services/soundFx';
import { INITIAL_CLUBS } from './data/rugbyDatabase';
import { Fixture } from './types/rugby';
import {
  LayoutDashboard,
  Users,
  Zap,
  ArrowRightLeft,
  Trophy,
  Activity,
  Building2,
  Sparkles,
  Mail,
  Settings,
  Volume2,
  VolumeX,
  Play,
  Database,
  Coins
} from 'lucide-react';

export function App() {
  const [careerState, setCareerState] = useState<CareerState>(careerManager.getState());
  const [currentScreen, setCurrentScreen] = useState<'title' | 'career' | 'matchday'>('title');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeMatchdayFixtureId, setActiveMatchdayFixtureId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCoinStoreOpen, setIsCoinStoreOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundFx.getMuted());
  const [quickMatchSetup, setQuickMatchSetup] = useState<{ homeClubId: string; awayClubId: string; userClubId: string } | null>(null);
  const [isRegistryModalOpen, setIsRegistryModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsub = careerManager.subscribe(newState => {
      setCareerState(newState);
    });
    return unsub;
  }, []);

  const handleStartCareer = (clubId: string, managerName: string) => {
    careerManager.createNewCareer(clubId, managerName);
    setCurrentScreen('career');
    setActiveTab('dashboard');
  };

  const handleResumeCareer = () => {
    setCurrentScreen('career');
  };

  const handleQuickMatch = (homeClubId: string, awayClubId: string, userClubId: string) => {
    setQuickMatchSetup({ homeClubId, awayClubId, userClubId });
    const mockFixture: Fixture = {
      id: `quick_${Date.now()}`,
      round: 1,
      leagueId: 'URC',
      homeClubId,
      awayClubId,
      played: false
    };
    setActiveMatchdayFixtureId(mockFixture.id);
    setCurrentScreen('matchday');
  };

  const handleOpenMatchday = (fixtureId: string) => {
    setQuickMatchSetup(null);
    setActiveMatchdayFixtureId(fixtureId);
    setCurrentScreen('matchday');
  };

  const handleFinishMatch = (result: Fixture['result']) => {
    if (activeMatchdayFixtureId && activeMatchdayFixtureId.startsWith('quick_')) {
      setCurrentScreen('title');
      setActiveMatchdayFixtureId(null);
      setQuickMatchSetup(null);
      return;
    }

    if (activeMatchdayFixtureId && result) {
      careerManager.applyMatchResultAndSimulateRound(activeMatchdayFixtureId, result);
    }
    setCurrentScreen('career');
    setActiveMatchdayFixtureId(null);
    setQuickMatchSetup(null);
  };

  const handleToggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
    if (!muted) soundFx.playClick();
  };

  // User Club and Opponent for Matchday
  const userClub = quickMatchSetup
    ? careerState.clubs.find(c => c.id === quickMatchSetup.userClubId) || careerState.clubs[0]
    : careerState.clubs.find(c => c.id === careerState.userClubId) || careerState.clubs[0];

  const activeFixture = activeMatchdayFixtureId?.startsWith('quick_') && quickMatchSetup
    ? {
        id: activeMatchdayFixtureId,
        round: 1,
        leagueId: 'URC' as const,
        homeClubId: quickMatchSetup.homeClubId,
        awayClubId: quickMatchSetup.awayClubId,
        played: false
      }
    : careerState.fixtures.find(f => f.id === activeMatchdayFixtureId);

  const homeClub = careerState.clubs.find(c => c.id === activeFixture?.homeClubId) || userClub;
  const awayClub = careerState.clubs.find(c => c.id === activeFixture?.awayClubId) || careerState.clubs[1];
  const homeSquad = careerState.players.filter(p => p.clubId === homeClub.id);
  const awaySquad = careerState.players.filter(p => p.clubId === awayClub.id);

  const unreadCount = careerState.inbox.filter(m => !m.read).length;

  // Title Screen
  if (currentScreen === 'title') {
    return (
      <>
        <TitleScreen
          onStartCareer={handleStartCareer}
          onResumeCareer={careerState ? handleResumeCareer : undefined}
          onQuickMatch={handleQuickMatch}
          hasExistingSave={true}
          onOpenRegistry={() => setIsRegistryModalOpen(true)}
        />
        {isRegistryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-6xl bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 text-neutral-100 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
                <span className="font-heading font-bold text-sm text-emerald-400">
                  URC Official Registry & Audit Inspector
                </span>
                <button
                  onClick={() => setIsRegistryModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold cursor-pointer"
                >
                  ✕ Close Registry
                </button>
              </div>
              <UrcRegistryView />
            </div>
          </div>
        )}
      </>
    );
  }

  // Active Matchday Screen
  if (currentScreen === 'matchday' && activeFixture) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 p-3 sm:p-6 select-none max-w-7xl mx-auto">
        <MatchdayView
          fixture={activeFixture}
          homeClub={homeClub}
          awayClub={awayClub}
          homeSquad={homeSquad}
          awaySquad={awaySquad}
          userClubId={userClub.id}
          userTactics={careerState.userTactics}
          userLineup={careerState.userLineup}
          onFinishMatch={handleFinishMatch}
          onExit={() => {
            if (activeMatchdayFixtureId?.startsWith('quick_')) {
              setCurrentScreen('title');
              setActiveMatchdayFixtureId(null);
              setQuickMatchSetup(null);
            } else {
              setCurrentScreen('career');
            }
          }}
        />
      </div>
    );
  }

  // Career Management Hub Shell
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'squad', label: 'Squad', icon: Users },
    { id: 'tactics', label: 'Tactics', icon: Zap },
    { id: 'competitions', label: 'URC Table', icon: Trophy },
    { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
    { id: 'registry', label: 'URC Registry', icon: Database, badge: '1,091' },
    { id: 'training', label: 'Training', icon: Activity },
    { id: 'finances', label: 'Club', icon: Building2 },
    { id: 'academy', label: 'Academy', icon: Sparkles },
    { id: 'inbox', label: 'Inbox', icon: Mail, badge: unreadCount > 0 ? unreadCount : undefined }
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col select-none">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 w-full bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div
            className="w-8 h-8 rounded-xl border border-white/20 flex items-center justify-center font-heading font-black text-xs text-white"
            style={{ backgroundColor: userClub.primaryColor }}
          >
            {userClub.shortName.substring(0, 3).toUpperCase()}
          </div>
          <div>
            <span className="font-heading font-bold text-sm text-white tracking-wide block">
              {userClub.shortName}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono-numbers">
              URC Round {careerState.currentRound} · Week {careerState.weekNumber}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab(item.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-neutral-950 font-bold text-[9px] flex items-center justify-center font-mono-numbers">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Settings & Audio Controls */}
        <div className="flex items-center space-x-2">
          {/* Rugby Nations Coin Store Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              setIsCoinStoreOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900/90 border border-amber-500/50 text-amber-300 flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm group"
            title="Rugby Nations Coin Store: Exchange Coins for In-Game Money"
          >
            <span className="text-sm group-hover:scale-110 transition-transform">🪙</span>
            <span className="font-heading font-black text-xs font-mono-numbers text-amber-400">
              {(careerState.coins || 0).toLocaleString()}
            </span>
            <span className="text-[10px] font-bold text-amber-300/80 hidden sm:inline">Coins</span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded uppercase font-bold hidden md:inline">
              Store
            </span>
          </button>

          <CurrencySelector clubCountry={userClub.country} />
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 transition-all cursor-pointer"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setIsSettingsOpen(true);
            }}
            className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 transition-all cursor-pointer"
            title="Settings & Saves"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 pb-20 lg:pb-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            state={careerState}
            onOpenMatchday={handleOpenMatchday}
            onNavigateTab={(tab) => {
              soundFx.playClick();
              setActiveTab(tab);
            }}
          />
        )}

        {activeTab === 'squad' && (
          <SquadView
            players={careerState.players}
            userClubId={userClub.id}
            startingXV={careerState.userLineup.startingXV}
            bench={careerState.userLineup.bench}
            onUpdateLineup={(sx, b) => careerManager.updateLineup(sx, b)}
          />
        )}

        {activeTab === 'tactics' && (
          <TacticsView
            tactics={careerState.userTactics}
            clubPlayers={careerState.players.filter(p => p.clubId === userClub.id)}
            onUpdateTactics={(t) => careerManager.updateTactics(t)}
          />
        )}

        {activeTab === 'competitions' && (
          <CompetitionsView
            table={careerState.leagueTables.URC || []}
            clubs={careerState.clubs}
            fixtures={careerState.fixtures}
            currentRound={careerState.currentRound}
            userClubId={userClub.id}
          />
        )}

        {activeTab === 'transfers' && (
          <TransfersView
            players={careerState.players}
            clubs={careerState.clubs}
            userClubId={userClub.id}
            onSignPlayer={(pid, fee, wage, yrs, role) => careerManager.signPlayer(pid, fee, wage, yrs, role)}
            onSellPlayer={(pid, fee) => careerManager.sellPlayer(pid, fee)}
          />
        )}

        {activeTab === 'registry' && (
          <UrcRegistryView onBackToDashboard={() => setActiveTab('dashboard')} />
        )}

        {activeTab === 'training' && (
          <TrainingView
            state={careerState}
            onUpdateTraining={(f, i) => careerManager.updateTraining(f, i)}
          />
        )}

        {activeTab === 'finances' && (
          <ClubFinancesView
            club={userClub}
            clubPlayers={careerState.players.filter(p => p.clubId === userClub.id)}
            onUpgradeFacility={(key) => careerManager.upgradeFacility(key)}
            onOpenCoinStore={() => setIsCoinStoreOpen(true)}
            coins={careerState.coins || 0}
          />
        )}

        {activeTab === 'academy' && (
          <YouthAcademyView
            prospects={careerState.youthProspects}
            onPromotePlayer={(pid) => careerManager.promoteYouthPlayer(pid)}
          />
        )}

        {activeTab === 'inbox' && (
          <InboxView
            messages={careerState.inbox}
            onMarkAsRead={(id) => careerManager.markMessageAsRead(id)}
          />
        )}
      </main>

      {/* Mobile Touch Bottom Navigation Bar (Tailored for Android devices) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {[
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'squad', label: 'Squad', icon: Users },
          { id: 'tactics', label: 'Tactics', icon: Zap },
          { id: 'transfers', label: 'Market', icon: ArrowRightLeft },
          { id: 'registry', label: 'Registry', icon: Database },
          { id: 'inbox', label: 'Inbox', icon: Mail, badge: unreadCount > 0 ? unreadCount : undefined }
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                soundFx.playClick();
                setActiveTab(item.id);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer relative ${
                isActive ? 'text-emerald-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-neutral-950 font-bold text-[8px] flex items-center justify-center font-mono-numbers">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onExportSave={() => careerManager.exportSaveJSON()}
        onImportSave={(json) => careerManager.importSaveJSON(json)}
        onRestartCareer={() => setCurrentScreen('title')}
        clubCountry={userClub.country}
      />

      {/* Rugby Nations Coin Store & Cash Exchange Modal */}
      {isCoinStoreOpen && (
        <CoinStoreModal
          userClub={userClub}
          coins={careerState.coins || 0}
          onClose={() => setIsCoinStoreOpen(false)}
        />
      )}
    </div>
  );
}
export default App;
