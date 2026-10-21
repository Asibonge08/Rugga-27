// src/components/TryAnimationOverlay.tsx
// Canvas 2D Keyframe Animation & Celebratory Try Scored Overlay for Rugga 27

import React, { useEffect, useRef, useState } from 'react';
import { soundFx } from '../services/soundFx';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Award, Zap, Flame, ShieldAlert } from 'lucide-react';

export interface TryScoredEventData {
  scorerName: string;
  scorerNumber?: number;
  teamId: string;
  teamName: string;
  teamColor?: string;
  minute: number;
  description?: string;
  isRivalry?: boolean;
}

interface TryAnimationOverlayProps {
  isOpen: boolean;
  tryData: TryScoredEventData | null;
  onClose: () => void;
}

export const TryAnimationOverlay: React.FC<TryAnimationOverlayProps> = ({
  isOpen,
  tryData,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'sprint' | 'dive' | 'ground' | 'celebrate'>('sprint');
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen || !tryData) return;

    soundFx.playCrowdCheer();
    soundFx.playWhistle('short');

    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#FFFFFF']
      });
    } catch {
      // ignore
    }

    startTryAnimation();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, tryData, isReplaying]);

  const startTryAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = performance.now();
    const duration = 2800; // 2.8 seconds total sequence

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw Stylized Pitch Turf with grass stripes
      ctx.clearRect(0, 0, w, h);

      const stripeWidth = w / 10;
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#1b4d24' : '#17421f';
        ctx.fillRect(i * stripeWidth, 0, stripeWidth, h);
      }

      // In-Goal / Try Zone on right side (from x = w * 0.75 to w)
      const tryLineX = w * 0.72;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
      ctx.fillRect(tryLineX, 0, w - tryLineX, h);

      // Pitch Lines
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#FFFFFF';

      // 22m line
      ctx.beginPath();
      ctx.moveTo(w * 0.25, 0);
      ctx.lineTo(w * 0.25, h);
      ctx.stroke();

      // 5m dashed line
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(w * 0.60, 0);
      ctx.lineTo(w * 0.60, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Tryline (solid white bold)
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(tryLineX, 0);
      ctx.lineTo(tryLineX, h);
      ctx.stroke();

      // Goal Post Uprights on tryline
      const postY1 = h * 0.38;
      const postY2 = h * 0.62;
      ctx.fillStyle = '#F59E0B'; // Post padding
      ctx.fillRect(tryLineX - 5, postY1 - 8, 10, 16);
      ctx.fillRect(tryLineX - 5, postY2 - 8, 10, 16);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.strokeRect(tryLineX - 5, postY1 - 8, 10, 16);
      ctx.strokeRect(tryLineX - 5, postY2 - 8, 10, 16);

      // 2. Compute Player Sprint & Dive Keyframe Motion
      // Start at x = w * 0.12, sprint to w * 0.70, dive across to w * 0.84
      let playerX = 0;
      let playerY = h * 0.50;
      let playerAngle = 0;
      let diveHeight = 0;
      let isGrounded = false;

      const teamColor = tryData?.teamColor || '#10B981';

      if (progress < 0.55) {
        // Sprint phase (0.0 to 0.55)
        setAnimationPhase('sprint');
        const sprintProgress = progress / 0.55;
        playerX = w * 0.12 + (tryLineX - w * 0.15) * Math.pow(sprintProgress, 1.15);
        playerY = h * 0.50 + Math.sin(sprintProgress * Math.PI * 4) * 6; // running bob

        // Speed Lines behind runner
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        for (let s = 1; s <= 4; s++) {
          ctx.beginPath();
          ctx.moveTo(playerX - 25 - s * 14, playerY + (s % 2 === 0 ? 8 : -8));
          ctx.lineTo(playerX - 8, playerY + (s % 2 === 0 ? 8 : -8));
          ctx.stroke();
        }

        // Diving defender trailing behind
        const defX = playerX - 55;
        const defY = playerY + 12;
        ctx.save();
        ctx.translate(defX, defY);
        ctx.rotate(0.35);
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

      } else if (progress < 0.82) {
        // Dive Phase: airborne jump over tryline
        setAnimationPhase('dive');
        const diveProgress = (progress - 0.55) / 0.27;
        playerX = (tryLineX - w * 0.03) + (w * 0.15) * diveProgress;
        diveHeight = Math.sin(diveProgress * Math.PI) * 26; // Arc above ground
        playerY = (h * 0.50) - diveHeight;
        playerAngle = 0.35 + (diveProgress * 0.2); // Leaning forward into dive

      } else {
        // Grounded Celebration Phase: sliding across turf with ball pressed down
        setAnimationPhase('ground');
        isGrounded = true;
        const slideProgress = (progress - 0.82) / 0.18;
        playerX = tryLineX + (w * 0.12) + (w * 0.04 * Math.sin(slideProgress * Math.PI * 0.5));
        playerY = h * 0.50;
        playerAngle = 0.15;

        // Chalk dust puff on grounding
        ctx.fillStyle = `rgba(255, 255, 255, ${0.7 - slideProgress * 0.6})`;
        ctx.beginPath();
        ctx.ellipse(playerX + 16, playerY + 8, 22 * (1 + slideProgress), 10 * (1 + slideProgress), 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Render Try Scorer Token
      ctx.save();
      ctx.translate(playerX, playerY);
      ctx.rotate(playerAngle);

      // Shadow on turf
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 14 + diveHeight * 0.7, 18, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body (circular jersey token)
      ctx.fillStyle = teamColor;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Jersey Number
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(tryData?.scorerNumber || 11), 0, 0);

      // Rugby Ball carried / grounded
      const ballX = 14;
      const ballY = isGrounded ? 8 : -2;
      ctx.save();
      ctx.translate(ballX, ballY);
      ctx.rotate(isGrounded ? 0.2 : -0.3);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Ball seam stripe
      ctx.strokeStyle = teamColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, 7, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      // 4. Continue animation loop or complete
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(render);
      } else {
        setAnimationPhase('celebrate');
      }
    };

    animFrameRef.current = requestAnimationFrame(render);
  };

  const handleReplay = () => {
    setIsReplaying(prev => !prev);
  };

  if (!isOpen || !tryData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-neutral-900 border-2 border-emerald-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Glow header banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 px-6 py-3.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2 text-white">
            <Zap className="w-5 h-5 fill-current animate-pulse text-amber-300" />
            <span className="font-heading font-black tracking-wider text-base sm:text-lg uppercase drop-shadow-md">
              ⚡ TRY SCORED!
            </span>
          </div>
          <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm text-xs font-mono font-bold text-amber-200">
            {tryData.minute}’ MINUTE
          </div>
        </div>

        {/* 2D Canvas Pitch Keyframe Visualizer */}
        <div className="relative w-full bg-neutral-950 flex items-center justify-center border-b border-neutral-800 p-2 sm:p-4">
          <canvas
            ref={canvasRef}
            width={600}
            height={260}
            className="w-full h-auto max-h-56 sm:max-h-64 rounded-xl border border-neutral-800 shadow-inner"
          />

          {/* Dynamic Try Callout Overlay Stamp */}
          <div className="absolute top-4 left-6 pointer-events-none">
            <span className="px-3 py-1 rounded-lg bg-black/75 border border-emerald-400 text-emerald-400 font-heading font-black text-xs tracking-wider uppercase shadow-md flex items-center space-x-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span>DIVING FINISH ACROSS THE WHITEWASH!</span>
            </span>
          </div>
        </div>

        {/* Scorer Info & Match Context */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-emerald-400 flex items-center space-x-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>{tryData.teamName}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-heading font-black text-white tracking-wide">
                {tryData.scorerName}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-800/80 text-emerald-300 font-mono font-bold text-sm">
                +5 POINTS
              </span>
            </div>
          </div>

          <p className="text-neutral-300 text-xs sm:text-sm italic bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
            {tryData.description || `Spectacular breakout score! ${tryData.scorerName} shreds the defensive alignment and grounds the ball firmly in goal!`}
          </p>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={handleReplay}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-heading font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>REPLAY TRY</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-heading font-black tracking-wide flex items-center space-x-1.5 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>CONTINUE MATCH</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
