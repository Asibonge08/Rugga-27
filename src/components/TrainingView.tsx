import React from 'react';
import { CareerState } from '../services/careerManager';
import { soundFx } from '../services/soundFx';
import { Activity, Flame, Shield, Zap, HeartPulse, RefreshCw } from 'lucide-react';

interface TrainingViewProps {
  state: CareerState;
  onUpdateTraining: (focus: CareerState['trainingSchedule']['focus'], intensity: CareerState['trainingSchedule']['intensity']) => void;
}

export const TrainingView: React.FC<TrainingViewProps> = ({ state, onUpdateTraining }) => {
  const { focus, intensity } = state.trainingSchedule;
  const userClub = state.clubs.find(c => c.id === state.userClubId);
  const clubPlayers = state.players.filter(p => p.clubId === state.userClubId);

  const handleSetFocus = (f: CareerState['trainingSchedule']['focus']) => {
    soundFx.playClick();
    onUpdateTraining(f, intensity);
  };

  const handleSetIntensity = (i: CareerState['trainingSchedule']['intensity']) => {
    soundFx.playClick();
    onUpdateTraining(focus, i);
  };

  return (
    <div className="space-y-4 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-xl">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-lg text-white">High Performance & Training</h2>
          <p className="text-xs text-neutral-400">Manage squad workload, set-piece routines, and recovery cycles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly Training Focus */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-3">
          <span className="text-xs font-heading font-bold text-emerald-400 uppercase tracking-wider block pb-2 border-b border-neutral-800">
            Weekly Focus Drill
          </span>

          {[
            { id: 'BALANCED', name: 'Balanced All-Round Training', desc: 'Standard conditioning, skills handling, and team shape.' },
            { id: 'SET_PIECE', name: 'Set Piece Mastery (Scrum & Lineout)', desc: 'Props, hookers, and locks focus heavily on scrum stability and lineout calling.' },
            { id: 'BREAKDOWN', name: 'Breakdown & Jackal Intensity', desc: 'Flankers and forwards drill aggressive ground contest and turnover speed.' },
            { id: 'ATTACK_PATTERNS', name: 'Backline Pattern Execution', desc: 'Accelerates offloading, tactical kicking precision, and backline strike speed.' },
            { id: 'DEFENCE_FITNESS', name: 'Defensive Line & Aerobic Engine', desc: 'High-repetition tackle wraps, drift spacing, and cardiovascular stamina.' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handleSetFocus(opt.id as any)}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                focus === opt.id
                  ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
                  : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
              }`}
            >
              <div className="font-heading font-bold text-xs text-neutral-100">{opt.name}</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>

        {/* Training Intensity & Fatigue Monitor */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-xl space-y-4">
          <span className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider block pb-2 border-b border-neutral-800">
            Workload Intensity Setting
          </span>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'LOW', label: 'Low Workload', note: 'Fast recovery, slower growth' },
              { id: 'NORMAL', label: 'Normal Intensity', note: 'Balanced progression' },
              { id: 'HIGH', label: 'High Intensity', note: 'Max growth, injury risk' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleSetIntensity(item.id as any)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  intensity === item.id
                    ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500 text-white'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="font-heading font-bold text-xs">{item.label}</div>
                <div className="text-[9px] text-neutral-400 mt-1">{item.note}</div>
              </button>
            ))}
          </div>

          {/* Squad Fatigue Warning List */}
          <div className="pt-3 border-t border-neutral-800">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase block mb-2">
              Highest Fatigue Watchlist
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {clubPlayers
                .sort((a, b) => b.fatigue - a.fatigue)
                .slice(0, 5)
                .map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800/80 text-xs"
                  >
                    <span className="font-medium text-neutral-200">{p.name}</span>
                    <div className="flex items-center space-x-2 font-mono-numbers">
                      <span className="text-neutral-400 text-[10px]">Fit: {p.fitness}%</span>
                      <span className={`font-bold ${p.fatigue > 50 ? 'text-red-400' : 'text-neutral-300'}`}>
                        Fatigue: {p.fatigue}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
