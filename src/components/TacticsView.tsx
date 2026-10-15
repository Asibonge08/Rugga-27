import React from 'react';
import { TacticsConfig, Player } from '../types/rugby';
import { soundFx } from '../services/soundFx';
import { Zap, Shield, Target, Clock, Award, Check } from 'lucide-react';

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

  return (
    <div className="space-y-5 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-xl">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-lg text-white">Tactical Philosophy</h2>
          <p className="text-xs text-neutral-400">Configure your matchday systems, set-piece launches, and risk profiles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Attacking Systems */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 pb-2 border-b border-neutral-800">
            <Zap className="w-4 h-4" />
            <span>Attacking Pattern</span>
          </div>

          <div className="space-y-2.5">
            {[
              { id: 'BALANCED', name: 'Balanced Phase Play', desc: 'Versatile approach blending forward carriers with wide backline strikes.' },
              { id: 'WIDE_SPREAD', name: 'Wide Rugby (Edge to Edge)', desc: 'Fast releases to wings and outside backs. Stretches opposing defensive lines.' },
              { id: 'FORWARD_PACK', name: 'Forward Pack Pick & Go', desc: 'Direct, physical attrition. Drives rolling mauls and brutal fringe carries.' },
              { id: 'TERRITORY_KICK', name: 'Territory Kick & Pressure', desc: 'Pin opponents in their 22m with box kicks and tactical 50-22 grubbers.' },
              { id: 'COUNTER_ATTACK', name: 'High-Pace Counter Attack', desc: 'High-octane returns from deep. Fast offloads and broken-field running.' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => handleSelect('attackingStyle', opt.id)}
                className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  tactics.attackingStyle === opt.id
                    ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs text-neutral-100">{opt.name}</span>
                  {tactics.attackingStyle === opt.id && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Defensive Systems */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400 pb-2 border-b border-neutral-800">
            <Shield className="w-4 h-4" />
            <span>Defensive System</span>
          </div>

          <div className="space-y-2.5">
            {[
              { id: 'BLITZ_RUSH', name: 'Blitz / Rush Defence', desc: 'Aggressive line speed suffocates fly-half decision time. Forces handling errors.' },
              { id: 'DRIFT', name: 'Drift Defence (Sideline Trap)', desc: 'Connected defensive wall slides laterally, funnelling attacks toward the touchline.' },
              { id: 'BALANCED_LINE', name: 'Balanced Connected Line', desc: 'Steady disciplined line avoiding dog-legs and offside infringements.' },
              { id: 'HEAVY_BREAKDOWN', name: 'Aggressive Jackal Contest', desc: 'Openside flankers relentlessly contest the tackle ball to steal turnovers.' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => handleSelect('defensiveStyle', opt.id)}
                className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  tactics.defensiveStyle === opt.id
                    ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs text-neutral-100">{opt.name}</span>
                  {tactics.defensiveStyle === opt.id && <Check className="w-4 h-4 text-blue-400" />}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Penalty Options & Set-Piece Policies */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-400 pb-2 border-b border-neutral-800">
            <Target className="w-4 h-4" />
            <span>Penalty Award Policy</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'POSTS', label: 'Kick for Posts (3 pts)', hint: 'Consistent scoreboard pressure' },
              { id: 'CORNER_LINEOUT', label: 'Kick to Corner (5m)', hint: 'Target 7 points via rolling maul' },
              { id: 'SCRUM', label: 'Attacking Scrum', hint: 'Dominate opposition front row' },
              { id: 'TAP_AND_GO', label: 'Quick Tap & Go', hint: 'Fast attack against broken defence' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleSelect('penaltyChoice', item.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
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

        {/* Match Tempo & Kicking Strategy */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 pb-2 border-b border-neutral-800">
            <Clock className="w-4 h-4" />
            <span>Tempo & Kicking Rate</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                Phase Ball Recycling Tempo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['HIGH_TEMPO', 'CONTROLLED', 'SLOW_ATTRITION'].map(t => (
                  <button
                    key={t}
                    onClick={() => handleSelect('tempo', t)}
                    className={`p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      tactics.tempo === t ? 'bg-emerald-600 text-white' : 'bg-neutral-950 border border-neutral-800 text-neutral-400'
                    }`}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                Kicking in Open Play
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['LOW', 'MEDIUM', 'HIGH'].map(k => (
                  <button
                    key={k}
                    onClick={() => handleSelect('kickFrequency', k)}
                    className={`p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      tactics.kickFrequency === k ? 'bg-emerald-600 text-white' : 'bg-neutral-950 border border-neutral-800 text-neutral-400'
                    }`}
                  >
                    {k} FREQUENCY
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
