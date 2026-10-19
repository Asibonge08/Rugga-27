import React from 'react';
import {
  TacticsConfig,
  Player,
  GamePlanPreset,
  StyleOfPlay,
  KickTendency,
  RuckCommitment,
  DefensiveLine,
  PenaltyDecisionMode
} from '../types/rugby';
import { soundFx } from '../services/soundFx';
import { getPositionShort } from '../data/rugbyDatabase';
import {
  Zap,
  Shield,
  Target,
  Clock,
  Award,
  Check,
  Crown,
  Compass,
  Sliders,
  ChevronRight,
  Flame,
  Gauge
} from 'lucide-react';

interface TacticsViewProps {
  tactics: TacticsConfig;
  clubPlayers: Player[];
  onUpdateTactics: (tactics: Partial<TacticsConfig>) => void;
}

export const TacticsView: React.FC<TacticsViewProps> = ({
  tactics,
  clubPlayers,
  onUpdateTactics
}) => {
  const handleSelect = (key: keyof TacticsConfig, value: any) => {
    soundFx.playClick();
    onUpdateTactics({ [key]: value });
  };

  const handleApplyPreset = (preset: GamePlanPreset) => {
    soundFx.playClick();
    if (preset === 'DEFENSIVE') {
      onUpdateTactics({
        gamePlan: 'DEFENSIVE',
        styleOfPlay: 'TERRITORY',
        attackingStyle: 'TERRITORY_KICK',
        defensiveStyle: 'BLITZ_RUSH',
        defensiveLine: 'DEEP',
        kickTendency: 'HIGH',
        kickFrequency: 'HIGH',
        ruckCommitment: 'HEAVY',
        tempo: 'CONTROLLED',
        penaltyChoice: 'POSTS'
      });
    } else if (preset === 'NORMAL') {
      onUpdateTactics({
        gamePlan: 'NORMAL',
        styleOfPlay: 'BALANCED',
        attackingStyle: 'BALANCED',
        defensiveStyle: 'BALANCED_LINE',
        defensiveLine: 'FLAT',
        kickTendency: 'MEDIUM',
        kickFrequency: 'MEDIUM',
        ruckCommitment: 'BALANCED',
        tempo: 'CONTROLLED',
        penaltyChoice: 'POSTS'
      });
    } else if (preset === 'ATTACKING') {
      onUpdateTactics({
        gamePlan: 'ATTACKING',
        styleOfPlay: 'EXPANSIVE',
        attackingStyle: 'WIDE_SPREAD',
        defensiveStyle: 'HEAVY_BREAKDOWN',
        defensiveLine: 'HIGH',
        kickTendency: 'LOW',
        kickFrequency: 'LOW',
        ruckCommitment: 'AGGRESSIVE',
        tempo: 'HIGH_TEMPO',
        penaltyChoice: 'CORNER_LINEOUT'
      });
    } else {
      onUpdateTactics({ gamePlan: 'CUSTOM' });
    }
  };

  const activeCaptain = clubPlayers.find(p => p.id === tactics.captainId);
  const currentGamePlan = tactics.gamePlan || 'NORMAL';
  const currentStyleOfPlay = tactics.styleOfPlay || 'BALANCED';
  const currentKickTendency = tactics.kickTendency || 'MEDIUM';
  const currentRuckCommitment = tactics.ruckCommitment || 'BALANCED';
  const currentDefensiveLine = tactics.defensiveLine || 'FLAT';
  const currentPenaltyMode = tactics.penaltyDecisionMode || 'PROMPT';

  return (
    <div className="space-y-5 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg text-white">Tactical Philosophy & Match Plan</h2>
            <p className="text-xs text-neutral-400">Configure your matchday systems, set-piece launches, and risk profiles</p>
          </div>
        </div>

        {/* Current Captain Badge */}
        <div className="flex items-center space-x-2 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 text-xs">
          <Crown className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="text-[9px] text-neutral-400 uppercase font-semibold">Active Captain (+1 OVR)</div>
            <div className="font-heading font-bold text-neutral-200 truncate max-w-[140px]">
              {activeCaptain ? activeCaptain.name : 'Unassigned'}
            </div>
          </div>
        </div>
      </div>

      {/* 1. GAME PLAN PRESETS BAR */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <span className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Sliders className="w-4 h-4" />
            <span>Master Game Plan Preset</span>
          </span>
          <span className="text-[10px] text-neutral-400">One-click strategic setup</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'DEFENSIVE', label: 'Defensive Plan', desc: 'Territory kicking, deep rush line, posts penalty focus' },
            { id: 'NORMAL', label: 'Normal / Balanced', desc: 'Standard phases, balanced drift, controlled tempo' },
            { id: 'ATTACKING', label: 'Attacking / High Pace', desc: 'Expansive wide passes, aggressive counter-rucks' },
            { id: 'CUSTOM', label: 'Custom Configuration', desc: 'Tailored sliders and bespoke tactical options' }
          ].map(preset => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset.id as GamePlanPreset)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                currentGamePlan === preset.id
                  ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500 text-white'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs">{preset.label}</span>
                  {currentGamePlan === preset.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className="text-[10px] text-neutral-400 mt-1 leading-snug">{preset.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. STYLE OF PLAY & DEFENSIVE LINE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Style of Play */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 pb-2 border-b border-neutral-800">
            <Compass className="w-4 h-4" />
            <span>Style of Play</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'EXPANSIVE', label: 'Expansive', desc: 'Edge-to-edge offloads & backline widths' },
              { id: 'BALANCED', label: 'Balanced', desc: 'Mix of forward carriers & backline strikes' },
              { id: 'TERRITORY', label: 'Territory', desc: '50-22s, box kicks & kick-chase pressure' },
              { id: 'FORWARDS', label: 'Forwards Direct', desc: 'Brutal pick & go, mauls, fringe hits' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  handleSelect('styleOfPlay', item.id);
                  handleSelect('gamePlan', 'CUSTOM');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  currentStyleOfPlay === item.id
                    ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs text-neutral-100">{item.label}</span>
                  {currentStyleOfPlay === item.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[10px] text-neutral-400 mt-0.5">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Defensive Line Height */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400 pb-2 border-b border-neutral-800">
            <Shield className="w-4 h-4" />
            <span>Defensive Line Alignment</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'DEEP', label: 'Deep Line', hint: 'Covers backfield, low energy cost' },
              { id: 'FLAT', label: 'Flat Line', hint: 'Standard connected drift line' },
              { id: 'HIGH', label: 'High Press', hint: 'Blitzes carrier, higher fatigue drain' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  handleSelect('defensiveLine', item.id);
                  handleSelect('gamePlan', 'CUSTOM');
                }}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between ${
                  currentDefensiveLine === item.id
                    ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500 text-white'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="font-heading font-bold text-xs">{item.label}</div>
                <div className="text-[10px] text-neutral-400 mt-1">{item.hint}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. KICK TENDENCY & RUCK COMMITMENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Kick Tendency Slider / Selector */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
              <Clock className="w-4 h-4" />
              <span>Kick Tendency (Clearance & Box Kicks)</span>
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {[
              { id: 'VERY_LOW', label: 'Very Low' },
              { id: 'LOW', label: 'Low' },
              { id: 'MEDIUM', label: 'Medium' },
              { id: 'HIGH', label: 'High' },
              { id: 'VERY_HIGH', label: 'Very High' }
            ].map(k => (
              <button
                key={k.id}
                onClick={() => {
                  handleSelect('kickTendency', k.id);
                  handleSelect('kickFrequency', k.id === 'VERY_LOW' ? 'LOW' : k.id === 'VERY_HIGH' ? 'HIGH' : k.id);
                  handleSelect('gamePlan', 'CUSTOM');
                }}
                className={`p-2 rounded-lg text-center transition-all cursor-pointer ${
                  currentKickTendency === k.id
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-neutral-950 border border-neutral-800 text-neutral-400 text-xs hover:text-white'
                }`}
              >
                <div className="text-[10px] uppercase font-bold">{k.label}</div>
              </button>
            ))}
          </div>
          <div className="text-[11px] text-neutral-400">
            Controls frequency of box kicks from base of rucks and positional territory kicking.
          </div>
        </div>

        {/* Ruck Forward Allocation */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
              <Flame className="w-4 h-4" />
              <span>Ruck Forward Commitment</span>
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'CONSERVATIVE', label: 'Conservative', hint: '1–2 forwards' },
              { id: 'BALANCED', label: 'Balanced', hint: '2–3 forwards' },
              { id: 'HEAVY', label: 'Heavy', hint: '3–4 forwards' },
              { id: 'AGGRESSIVE', label: 'Aggressive', hint: 'Relentless jackal' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => {
                  handleSelect('ruckCommitment', r.id);
                  handleSelect('gamePlan', 'CUSTOM');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  currentRuckCommitment === r.id
                    ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500 text-white'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="font-heading font-bold text-xs">{r.label}</div>
                <div className="text-[9px] text-neutral-400 mt-0.5">{r.hint}</div>
              </button>
            ))}
          </div>
          <div className="text-[11px] text-neutral-400">
            Higher commitment increases turnover jackals, but leaves fewer defenders in the outside line.
          </div>
        </div>
      </div>

      {/* 4. PENALTY DECISIONS & IN-GAME PROMPT MODE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* In-Game Penalty Decision Automation */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-400 pb-2 border-b border-neutral-800">
            <Target className="w-4 h-4" />
            <span>In-Match Penalty Decision Mode</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleSelect('penaltyDecisionMode', 'PROMPT')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                currentPenaltyMode === 'PROMPT'
                  ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500'
                  : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-xs text-neutral-100">Interactive Prompt</span>
                {currentPenaltyMode === 'PROMPT' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">
                Pause simulation on every penalty so you can pick: Posts, Corner, Quick Tap, or Scrum.
              </p>
            </button>

            <button
              onClick={() => handleSelect('penaltyDecisionMode', 'AUTO')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                currentPenaltyMode === 'AUTO'
                  ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500'
                  : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-xs text-neutral-100">Auto / Every Penalty</span>
                {currentPenaltyMode === 'AUTO' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">
                Engine automatically evaluates distance, score line, and kicker success without interruption.
              </p>
            </button>
          </div>
        </div>

        {/* Penalty Default Award Policy */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-400 pb-2 border-b border-neutral-800">
            <Gauge className="w-4 h-4" />
            <span>Default Restart Preference</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'POSTS', label: 'Kick for Posts (3 pts)', hint: 'Consistent points pressure' },
              { id: 'CORNER_LINEOUT', label: 'Kick to Corner (5m)', hint: 'Target 7 points via lineout' },
              { id: 'SCRUM', label: 'Attacking Scrum', hint: 'Back your forward pack' },
              { id: 'TAP_AND_GO', label: 'Quick Tap & Go', hint: 'Fast attack against retreating line' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleSelect('penaltyChoice', item.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  tactics.penaltyChoice === item.id
                    ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                }`}
              >
                <div className="font-heading font-bold text-xs text-neutral-100">{item.label}</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">{item.hint}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. CAPTAIN SELECTION (LEADERSHIP STAT BOOST) */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <span className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Matchday Captain Selection (+1 OVR Leadership Aura)</span>
          </span>
          <span className="text-[10px] text-neutral-400">Boosts all on-pitch teammates</span>
        </div>

        <p className="text-xs text-neutral-400">
          Your captain provides inspiration and composure under pressure. While your designated captain is on the pitch, every teammate gains an active <strong>+1 Rating Boost</strong> to overall performance!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
          {clubPlayers
            .slice()
            .sort((a, b) => b.overall - a.overall)
            .map(p => {
              const isCap = tactics.captainId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelect('captainId', p.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isCap
                      ? 'border-amber-500 bg-amber-950/50 ring-1 ring-amber-500 text-white'
                      : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center font-heading font-black text-xs text-amber-400 border border-neutral-700">
                      {getPositionShort(p.primaryPosition)}
                    </span>
                    <div>
                      <div className="font-heading font-bold text-xs truncate max-w-[130px]">{p.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono-numbers">
                        OVR {p.overall} · Morale {p.morale}%
                      </div>
                    </div>
                  </div>

                  {isCap ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-heading font-bold flex items-center space-x-1">
                      <Crown className="w-3 h-3 fill-current" />
                      <span>CAPTAIN</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-500 hover:text-neutral-300 font-semibold">
                      Make Captain
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};
