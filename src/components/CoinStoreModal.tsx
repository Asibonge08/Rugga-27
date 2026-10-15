import React, { useState } from 'react';
import { Club } from '../types/rugby';
import { careerManager } from '../services/careerManager';
import { soundFx } from '../services/soundFx';
import { useCurrency } from '../services/currencyService';
import {
  Coins,
  DollarSign,
  Gift,
  Zap,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Trophy,
  ArrowRight,
  Flame,
  Award
} from 'lucide-react';

interface CoinStoreModalProps {
  userClub: Club;
  coins: number;
  onClose: () => void;
}

interface CashPack {
  id: string;
  title: string;
  tier: string;
  coinCost: number;
  transferCash: number;
  wageCash: number;
  highlight?: boolean;
  badge?: string;
}

const CASH_PACKS: CashPack[] = [
  {
    id: 'pack_matchday',
    title: 'Matchday Purse',
    tier: 'Starter Injection',
    coinCost: 250,
    transferCash: 150000,
    wageCash: 15000,
    badge: 'Popular'
  },
  {
    id: 'pack_sponsor',
    title: 'Club Sponsor Stash',
    tier: 'Commercial Grant',
    coinCost: 500,
    transferCash: 450000,
    wageCash: 40000
  },
  {
    id: 'pack_director',
    title: "Director's Gold Vault",
    tier: 'Executive Funding',
    coinCost: 1000,
    transferCash: 1200000,
    wageCash: 90000,
    highlight: true,
    badge: 'Best Value'
  },
  {
    id: 'pack_championship',
    title: 'Championship Treasury',
    tier: 'Marquee Investment',
    coinCost: 2500,
    transferCash: 3500000,
    wageCash: 250000,
    badge: 'Pro Elite'
  },
  {
    id: 'pack_takeover',
    title: 'Mega Franchise Takeover',
    tier: 'Billionaire Syndicate',
    coinCost: 5000,
    transferCash: 8500000,
    wageCash: 600000,
    badge: 'Unlimited Power'
  }
];

const COIN_BUNDLES = [
  {
    id: 'bundle_rookie',
    title: 'Rookie Coin Drop',
    amount: 500,
    desc: 'Quick reserve for immediate matchday emergencies.',
    tag: 'Quick Top-Up'
  },
  {
    id: 'bundle_pro',
    title: 'Pro Manager Stash',
    amount: 1500,
    desc: 'Sufficient coins to fund high-impact player contracts.',
    tag: 'Most Popular',
    featured: true
  },
  {
    id: 'bundle_captain',
    title: "Captain's Gold Chest",
    amount: 3500,
    desc: 'Significant vault for multiple treasury conversions.',
    tag: 'High Roller'
  },
  {
    id: 'bundle_grandslam',
    title: 'Grand Slam Mega Vault',
    amount: 10000,
    desc: 'Ultimate coin reserve for dominating the transfer market.',
    tag: 'Legendary'
  }
];

export const CoinStoreModal: React.FC<CoinStoreModalProps> = ({
  userClub,
  coins,
  onClose
}) => {
  const { formatMoney } = useCurrency(userClub.country);
  const [activeTab, setActiveTab] = useState<'cash' | 'bundles' | 'perks'>('cash');
  const [notification, setNotification] = useState<{ text: string; isError: boolean } | null>(null);
  const [dailyClaimed, setDailyClaimed] = useState<boolean>(false);

  const handleExchange = (pack: CashPack) => {
    soundFx.playClick();
    const res = careerManager.exchangeCoinsForCash(
      pack.coinCost,
      pack.transferCash,
      pack.wageCash,
      pack.title
    );

    if (res.success) {
      soundFx.playCrowdCheer();
      setNotification({ text: res.message, isError: false });
    } else {
      soundFx.playWhistle('short');
      setNotification({ text: res.message, isError: true });
    }
  };

  const handleClaimDaily = () => {
    soundFx.playClick();
    const res = careerManager.claimDailyCoinReward();
    if (res.success) {
      soundFx.playCrowdCheer();
      setDailyClaimed(true);
      setNotification({ text: res.message, isError: false });
    }
  };

  const handleTopUpCoins = (amount: number, title: string) => {
    soundFx.playClick();
    careerManager.addCoins(amount, title);
    soundFx.playCrowdCheer();
    setNotification({
      text: `+${amount.toLocaleString()} Rugby Coins added to your treasury from ${title}!`,
      isError: false
    });
  };

  const handleBuyFitness = () => {
    soundFx.playClick();
    const res = careerManager.buyInstantFitnessPack();
    if (res.success) {
      soundFx.playCrowdCheer();
      setNotification({ text: res.message, isError: false });
    } else {
      soundFx.playWhistle('short');
      setNotification({ text: res.message, isError: true });
    }
  };

  const handleBuyMorale = () => {
    soundFx.playClick();
    const res = careerManager.buyMoraleBoostPack();
    if (res.success) {
      soundFx.playCrowdCheer();
      setNotification({ text: res.message, isError: false });
    } else {
      soundFx.playWhistle('short');
      setNotification({ text: res.message, isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 text-neutral-100 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-5 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300 flex items-center justify-center text-neutral-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.35)] shrink-0">
              <Coins className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-heading font-black text-lg sm:text-xl text-white tracking-wide">
                  RUGBY NATIONS COIN STORE
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                  Exchange & Perks
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Convert Rugby Coins into in-game club cash, recruit marquee stars, or claim instant team boosters
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Live Coin Wallet Badge */}
            <div className="bg-amber-950/70 border border-amber-500/50 rounded-2xl px-4 py-2 flex items-center space-x-2.5 shadow-inner">
              <span className="text-xl">🪙</span>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-300/80 block leading-none">
                  Your Balance
                </span>
                <span className="font-heading font-black text-lg text-amber-400 font-mono-numbers">
                  {coins.toLocaleString()} <span className="text-xs font-semibold">Coins</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Club Budget Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5 shrink-0">
          <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Transfer Budget</span>
              <span className="font-heading font-black text-base text-emerald-400 font-mono-numbers">
                {formatMoney(userClub.transferBudget, { compact: true })}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Weekly Wage Cap</span>
              <span className="font-heading font-black text-base text-cyan-400 font-mono-numbers">
                {formatMoney(userClub.wageBudget, { perWeek: true })}
              </span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-amber-950/30 border border-amber-600/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-amber-300 uppercase font-bold block">Daily Free Reward</span>
              <span className="text-xs text-neutral-300">Free +250 Coins every game day</span>
            </div>
            <button
              onClick={handleClaimDaily}
              disabled={dailyClaimed}
              className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer shadow-md ${
                dailyClaimed
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 border border-amber-400 animate-pulse'
              }`}
            >
              {dailyClaimed ? 'Claimed ✓' : 'Claim +250 🪙'}
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {notification && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center justify-between shrink-0 ${
              notification.isError
                ? 'bg-red-950/90 border border-red-800 text-red-200'
                : 'bg-emerald-950/90 border border-emerald-800 text-emerald-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {notification.isError ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{notification.text}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-neutral-400 hover:text-white text-xs ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3 mb-4 shrink-0">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('cash');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'cash'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>BUY IN-GAME MONEY (CASH PACKS)</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('bundles');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'bundles'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
                : 'bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>TOP UP RUGBY COINS</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('perks');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'perks'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>CLUB BOOSTERS & PERKS</span>
          </button>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* TAB 1: BUY IN-GAME MONEY */}
          {activeTab === 'cash' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-950/60 via-neutral-900 to-neutral-900 p-4 rounded-2xl border border-emerald-800/40 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-black text-sm text-emerald-400">
                    EXCHANGE COINS FOR IN-GAME MONEY
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Modeled after Rugby Nations: Instantly credit your club's transfer chest and expand your weekly wage cap
                  </p>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-bold">
                  Instant Board Injection
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {CASH_PACKS.map(pack => {
                  const canAfford = coins >= pack.coinCost;
                  return (
                    <div
                      key={pack.id}
                      className={`relative rounded-2xl p-4 flex flex-col justify-between transition-all ${
                        pack.highlight
                          ? 'bg-gradient-to-b from-neutral-800 to-neutral-900 border-2 border-amber-500/70 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
                          : 'bg-neutral-950/90 border border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {pack.badge && (
                        <span
                          className={`absolute -top-2.5 right-4 text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full shadow-md ${
                            pack.highlight
                              ? 'bg-amber-500 text-neutral-950'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {pack.badge}
                        </span>
                      )}

                      <div>
                        <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                          {pack.tier}
                        </div>
                        <h4 className="font-heading font-black text-base text-white mt-0.5">
                          {pack.title}
                        </h4>

                        <div className="my-3.5 space-y-2 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-400">Transfer Budget:</span>
                            <span className="font-heading font-black text-sm text-emerald-400 font-mono-numbers">
                              +{formatMoney(pack.transferCash, { compact: true })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-400">Wage Budget:</span>
                            <span className="font-heading font-black text-xs text-cyan-400 font-mono-numbers">
                              +{formatMoney(pack.wageCash, { perWeek: true })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 font-heading font-black text-amber-400 text-sm">
                          <span>🪙</span>
                          <span>{pack.coinCost.toLocaleString()}</span>
                        </div>

                        <button
                          onClick={() => handleExchange(pack)}
                          disabled={!canAfford}
                          className={`px-4 py-2 rounded-xl font-heading font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-md ${
                            canAfford
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-900/30'
                              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/60'
                          }`}
                        >
                          <span>{canAfford ? 'Exchange' : 'Need Coins'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TOP UP COIN BUNDLES */}
          {activeTab === 'bundles' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-950/60 via-neutral-900 to-neutral-900 p-4 rounded-2xl border border-amber-800/40 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-black text-sm text-amber-400">
                    RUGBY NATIONS STANDARD COIN VAULTS
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Acquire standard coin bundles or earn them on matchdays through tries, victories, and clean sheets
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-300 block font-semibold">Earn on Matchdays:</span>
                  <span className="text-xs text-neutral-300 font-mono-numbers">+150 W / +75 D / +15 per Try</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {COIN_BUNDLES.map(b => (
                  <div
                    key={b.id}
                    className={`rounded-2xl p-4 flex items-center justify-between border transition-all ${
                      b.featured
                        ? 'bg-gradient-to-br from-amber-950/40 via-neutral-900 to-neutral-950 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                        : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                        🪙
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-heading font-black text-base text-white">
                            {b.title}
                          </h4>
                          <span className="text-[9px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                            {b.tag}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">{b.desc}</p>
                        <div className="mt-2 font-heading font-black text-lg text-amber-400 font-mono-numbers">
                          +{b.amount.toLocaleString()} <span className="text-xs font-semibold">Coins</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTopUpCoins(b.amount, b.title)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-heading font-black text-xs tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-950/50 shrink-0"
                    >
                      Top Up +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CLUB BOOSTERS & PERKS */}
          {activeTab === 'perks' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-950/60 via-neutral-900 to-neutral-900 p-4 rounded-2xl border border-purple-800/40 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-black text-sm text-purple-400">
                    TACTICAL & SQUAD BOOSTERS
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Use your coins for emergency squad readiness, recovery drinks, and media campaigns
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Instant Recovery */}
                <div className="rounded-2xl p-5 bg-neutral-950/90 border border-neutral-800 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3">
                      <Zap className="w-5 h-5" />
                    </div>
                    <h4 className="font-heading font-bold text-base text-white">Instant Squad Recovery</h4>
                    <p className="text-xs text-neutral-400 mt-1">
                      Distribute professional sports recovery nutrition to restore 100% match condition and high morale to all squad members immediately.
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-between">
                    <span className="font-heading font-black text-sm text-amber-400">
                      🪙 200 Coins
                    </span>
                    <button
                      onClick={handleBuyFitness}
                      disabled={coins < 200}
                      className={`px-4 py-2 rounded-xl font-heading font-bold text-xs transition-all cursor-pointer ${
                        coins >= 200
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      Activate Recovery
                    </button>
                  </div>
                </div>

                {/* Morale Campaign */}
                <div className="rounded-2xl p-5 bg-neutral-950/90 border border-neutral-800 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-3">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h4 className="font-heading font-bold text-base text-white">PR & Fan Morale Campaign</h4>
                    <p className="text-xs text-neutral-400 mt-1">
                      Run an official club supporters campaign and sponsor gala to boost Board Confidence and Fan Satisfaction by +15%.
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-between">
                    <span className="font-heading font-black text-sm text-amber-400">
                      🪙 175 Coins
                    </span>
                    <button
                      onClick={handleBuyMorale}
                      disabled={coins < 175}
                      className={`px-4 py-2 rounded-xl font-heading font-bold text-xs transition-all cursor-pointer ${
                        coins >= 175
                          ? 'bg-purple-600 hover:bg-purple-500 text-white'
                          : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      Boost Morale
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
