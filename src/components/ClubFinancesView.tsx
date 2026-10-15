import React, { useState } from 'react';
import { Club, Player } from '../types/rugby';
import { soundFx } from '../services/soundFx';
import { useCurrency } from '../services/currencyService';
import { DollarSign, Building2, TrendingUp, ShieldCheck, ArrowUpCircle, Coins, Sparkles, ArrowRight } from 'lucide-react';
import { careerManager } from '../services/careerManager';

interface ClubFinancesViewProps {
  club: Club;
  clubPlayers: Player[];
  onUpgradeFacility: (key: keyof Club['facilities']) => { success: boolean; message: string };
  onOpenCoinStore?: () => void;
  coins?: number;
}

export const ClubFinancesView: React.FC<ClubFinancesViewProps> = ({
  club,
  clubPlayers,
  onUpgradeFacility,
  onOpenCoinStore,
  coins = 750
}) => {
  const { formatMoney } = useCurrency(club.country);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const totalWeeklyWage = clubPlayers.reduce((sum, p) => sum + p.weeklyWage, 0);
  const weeklySponsorship = Math.round(club.reputation * 1200);
  const avgMatchRevenue = Math.round((club.stadiumCapacity * 0.75) * 28 * 0.5); // home match average
  const netWeekly = (weeklySponsorship + avgMatchRevenue) - totalWeeklyWage;

  const facilityNames: { key: keyof Club['facilities']; label: string; desc: string }[] = [
    { key: 'training', label: 'Training Ground Complex', desc: 'Accelerates attribute progression and prepares players for tactical patterns.' },
    { key: 'medical', label: 'Sports Science & Medical Clinic', desc: 'Shortens injury rehabilitation duration and lowers contact injury probability.' },
    { key: 'academy', label: 'Youth Academy Infrastructure', desc: 'Produces higher potential wonderkids in the annual youth draft intake.' },
    { key: 'stadium', label: 'Stadium & Matchday Hospitality', desc: 'Expands seating capacity and increases ticket gate revenue.' },
    { key: 'analytics', label: 'Data Analytics & Scouting Lab', desc: 'Reveals precise opposition tactical tendencies and hidden player traits.' }
  ];

  const handleUpgrade = (key: keyof Club['facilities']) => {
    soundFx.playClick();
    const res = onUpgradeFacility(key);
    if (res.success) {
      soundFx.playCrowdCheer();
      setFeedback({ text: res.message, isError: false });
    } else {
      setFeedback({ text: res.message, isError: true });
    }
  };

  return (
    <div className="space-y-4 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-xl">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-lg text-white">Club Infrastructure & Finances</h2>
          <p className="text-xs text-neutral-400">Manage payroll, commercial sponsorship, and world-class facility upgrades</p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 shadow-md">
          <div className="text-[10px] text-neutral-400 uppercase font-semibold">Transfer Treasury</div>
          <div className="font-heading font-black text-xl text-emerald-400 font-mono-numbers mt-1">
            {formatMoney(club.transferBudget, { compact: true })}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 shadow-md">
          <div className="text-[10px] text-neutral-400 uppercase font-semibold">Weekly Wage Bill</div>
          <div className="font-heading font-black text-xl text-white font-mono-numbers mt-1">
            {formatMoney(totalWeeklyWage, { perWeek: true })}
            <span className="text-xs text-neutral-400 font-normal"> / {formatMoney(club.wageBudget, { perWeek: true })}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 shadow-md">
          <div className="text-[10px] text-neutral-400 uppercase font-semibold">Net Weekly Cashflow</div>
          <div className={`font-heading font-black text-xl font-mono-numbers mt-1 ${netWeekly >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {netWeekly >= 0 ? `+${formatMoney(netWeekly, { perWeek: true })}` : `-${formatMoney(Math.abs(netWeekly), { perWeek: true })}`}
          </div>
        </div>
      </div>

      {/* Rugby Nations Coin Exchange & Treasury Injection */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 border border-amber-600/40 p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
              🪙
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-heading font-black text-sm sm:text-base text-white tracking-wide">
                  RUGBY NATIONS COIN EXCHANGE
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                  Buy Club Money
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Use your Rugby Coins to inject immediate cash into your transfer treasury and wage budget
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] text-amber-300/80 uppercase font-bold block">Coin Reserve</span>
              <span className="font-heading font-black text-sm text-amber-400 font-mono-numbers">
                {coins.toLocaleString()} 🪙
              </span>
            </div>

            {onOpenCoinStore && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  onOpenCoinStore();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-heading font-black text-xs transition-all cursor-pointer shadow-md"
              >
                Coin Store →
              </button>
            )}
          </div>
        </div>

        {/* 3 Quick Conversion Tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { cost: 250, transfer: 150000, wage: 15000, label: 'Matchday Injection' },
            { cost: 500, transfer: 450000, wage: 40000, label: 'Commercial Grant' },
            { cost: 1000, transfer: 1200000, wage: 90000, label: "Director's Vault", popular: true }
          ].map(pack => {
            const canAfford = coins >= pack.cost;
            return (
              <div
                key={pack.cost}
                className={`p-3 rounded-xl border flex flex-col justify-between ${
                  pack.popular
                    ? 'bg-neutral-900 border-amber-500/60 shadow-md'
                    : 'bg-neutral-950 border-neutral-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase mb-1">
                    <span>{pack.label}</span>
                    <span className="text-amber-400 font-mono-numbers">🪙 {pack.cost}</span>
                  </div>
                  <div className="font-heading font-black text-sm text-emerald-400 font-mono-numbers">
                    +{formatMoney(pack.transfer, { compact: true })}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono-numbers">
                    +{formatMoney(pack.wage, { perWeek: true })} wage cap
                  </div>
                </div>

                <button
                  onClick={() => {
                    soundFx.playClick();
                    const res = careerManager.exchangeCoinsForCash(pack.cost, pack.transfer, pack.wage, pack.label);
                    if (res.success) {
                      soundFx.playCrowdCheer();
                      setFeedback({ text: res.message, isError: false });
                    } else {
                      soundFx.playWhistle('short');
                      setFeedback({ text: res.message, isError: true });
                    }
                  }}
                  disabled={!canAfford}
                  className={`mt-2.5 py-1.5 px-3 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer text-center ${
                    canAfford
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  {canAfford ? 'Convert Coins' : 'Need More Coins'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Facilities Upgrade Grid */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-4">
        <span className="text-xs font-heading font-bold text-emerald-400 uppercase tracking-wider block pb-2 border-b border-neutral-800">
          Club Facility Upgrades (Levels 1–5)
        </span>

        <div className="space-y-3">
          {facilityNames.map(fac => {
            const currentLevel = club.facilities[fac.key];
            const upgradeCost = currentLevel * 450000;
            const isMax = currentLevel >= 5;

            return (
              <div
                key={fac.key}
                className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-heading font-bold text-sm text-neutral-100">{fac.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono-numbers font-bold">
                      Tier {currentLevel} / 5
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">{fac.desc}</p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {!isMax ? (
                    <button
                      onClick={() => handleUpgrade(fac.key)}
                      className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      <span>Upgrade ({formatMoney(upgradeCost, { compact: true })})</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold px-3 py-1.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                      World Class (Max)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
