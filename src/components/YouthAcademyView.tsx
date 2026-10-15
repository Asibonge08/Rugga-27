import React from 'react';
import { Player } from '../types/rugby';
import { getPositionName, getPositionShort } from '../data/rugbyDatabase';
import { soundFx } from '../services/soundFx';
import { Sparkles, Award, ArrowUpRight } from 'lucide-react';

interface YouthAcademyViewProps {
  prospects: Player[];
  onPromotePlayer: (playerId: string) => void;
}

export const YouthAcademyView: React.FC<YouthAcademyViewProps> = ({
  prospects,
  onPromotePlayer
}) => {
  return (
    <div className="space-y-4 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-xl">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-lg text-white">Youth Academy & Development</h2>
          <p className="text-xs text-neutral-400">Nurture homegrown talent and promote emerging wonderkids to the senior first team</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {prospects.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-neutral-900 border border-neutral-800 p-8 text-center text-neutral-400 text-sm">
            All youth academy graduates are currently promoted to senior squads. The next intake arrives in the off-season.
          </div>
        ) : (
          prospects.map(p => (
            <div
              key={p.id}
              className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-heading font-bold text-sm text-neutral-100">{p.name}</span>
                    <span className="text-[11px] text-neutral-400 block">{getPositionName(p.primaryPosition)}</span>
                  </div>
                  <span className="text-xs font-mono-numbers text-amber-400 font-bold bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
                    POT {p.potential}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono-numbers bg-neutral-950 p-2.5 rounded-xl mb-4">
                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase font-sans block">Current OVR</span>
                    <span className="text-emerald-400 font-bold">{p.overall}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase font-sans block">Age</span>
                    <span className="text-neutral-200">{p.age} Years Old</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  soundFx.playWhistle('short');
                  onPromotePlayer(p.id);
                }}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs tracking-wide flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Promote to Senior Squad</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
