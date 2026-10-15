import React, { useRef, useEffect } from 'react';
import { RugbyMatchEngine } from '../services/matchEngine';

interface MatchPitchCanvasProps {
  engine: RugbyMatchEngine | null;
  onSelectPlayer?: (playerId: string) => void;
}

export const MatchPitchCanvas: React.FC<MatchPitchCanvasProps> = ({ engine, onSelectPlayer }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animationId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas || !engine) {
        animationId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Pitch dimensions: 100m length + 20m in-goals (10m each side) = 120m virtual width
      // 70m pitch width + 10m dead ball perimeter = 80m virtual height
      const marginX = width * 0.05;
      const marginY = height * 0.08;
      const pitchW = width - (marginX * 2);
      const pitchH = height - (marginY * 2);

      // Coordinate transformers: 0-100m x -> canvas, 0-70m y -> canvas
      const scaleX = (x: number) => marginX + (x / 100) * pitchW;
      const scaleY = (y: number) => marginY + (y / 70) * pitchH;

      // 1. Clear background (stadium apron)
      ctx.fillStyle = '#06130b';
      ctx.fillRect(0, 0, width, height);

      // 2. Pitch grass with subtle vertical mowing stripes
      const stripeCount = 10;
      const stripeW = pitchW / stripeCount;
      for (let i = 0; i < stripeCount; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#1b4d2e' : '#174227';
        ctx.fillRect(marginX + i * stripeW, marginY, stripeW, pitchH);
      }

      // In-goal areas (shaded slightly darker)
      ctx.fillStyle = 'rgba(10, 35, 18, 0.45)';
      ctx.fillRect(marginX, marginY, (10 / 100) * pitchW, pitchH);
      ctx.fillRect(marginX + (90 / 100) * pitchW, marginY, (10 / 100) * pitchW, pitchH);

      // 3. Pitch Lines (White crisp markings)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = Math.max(1.5, width * 0.002);

      // Boundary line
      ctx.strokeRect(marginX, marginY, pitchW, pitchH);

      // Halfway line (50m)
      const halfX = scaleX(50);
      ctx.beginPath();
      ctx.moveTo(halfX, marginY);
      ctx.lineTo(halfX, marginY + pitchH);
      ctx.stroke();

      // Halfway center spot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(halfX, scaleY(35), 3, 0, Math.PI * 2);
      ctx.fill();

      // 10m lines (dashed)
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';

      const tenHomeX = scaleX(40);
      const tenAwayX = scaleX(60);
      ctx.beginPath();
      ctx.moveTo(tenHomeX, marginY);
      ctx.lineTo(tenHomeX, marginY + pitchH);
      ctx.moveTo(tenAwayX, marginY);
      ctx.lineTo(tenAwayX, marginY + pitchH);
      ctx.stroke();

      // 22m lines (solid)
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      const twentyTwoHomeX = scaleX(22);
      const twentyTwoAwayX = scaleX(78);
      ctx.beginPath();
      ctx.moveTo(twentyTwoHomeX, marginY);
      ctx.lineTo(twentyTwoHomeX, marginY + pitchH);
      ctx.moveTo(twentyTwoAwayX, marginY);
      ctx.lineTo(twentyTwoAwayX, marginY + pitchH);
      ctx.stroke();

      // Try Lines (Goal Lines at 0m and 100m)
      ctx.lineWidth = Math.max(2.5, width * 0.0035);
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(scaleX(0), marginY);
      ctx.lineTo(scaleX(0), marginY + pitchH);
      ctx.moveTo(scaleX(100), marginY);
      ctx.lineTo(scaleX(100), marginY + pitchH);
      ctx.stroke();

      // 5m tramlines
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      const tramlineTopY = scaleY(5);
      const tramlineBottomY = scaleY(65);
      ctx.beginPath();
      ctx.moveTo(marginX, tramlineTopY);
      ctx.lineTo(marginX + pitchW, tramlineTopY);
      ctx.moveTo(marginX, tramlineBottomY);
      ctx.lineTo(marginX + pitchW, tramlineBottomY);
      ctx.stroke();
      ctx.restore();

      // Pitch Labels (50m, 22m, 10m)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = `600 ${Math.max(10, width * 0.014)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('50', halfX, marginY + 16);
      ctx.fillText('22', twentyTwoHomeX, marginY + 16);
      ctx.fillText('22', twentyTwoAwayX, marginY + 16);
      ctx.fillText('10', tenHomeX, marginY + 16);
      ctx.fillText('10', tenAwayX, marginY + 16);

      // 4. Goal Posts (H-posts)
      const renderGoalPosts = (gx: number, isLeft: boolean) => {
        const postMidY = scaleY(35);
        const postGap = (5.6 / 70) * pitchH; // 5.6m between posts in rugby union
        const topPostY = postMidY - postGap / 2;
        const botPostY = postMidY + postGap / 2;

        ctx.strokeStyle = '#f3f4f6';
        ctx.lineWidth = 3;
        // Crossbar
        ctx.beginPath();
        ctx.moveTo(gx, topPostY);
        ctx.lineTo(gx, botPostY);
        ctx.stroke();

        // Uprights
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gx, topPostY, 4, 0, Math.PI * 2);
        ctx.arc(gx, botPostY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(gx + (isLeft ? 3 : -3), topPostY + 3, 4, 2, 0, 0, Math.PI * 2);
        ctx.ellipse(gx + (isLeft ? 3 : -3), botPostY + 3, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      };

      renderGoalPosts(scaleX(0), true);
      renderGoalPosts(scaleX(100), false);

      // 5. Render Players
      const playerRadius = Math.max(8, width * 0.013);
      const homeColor = engine.homeClub.primaryColor;
      const awayColor = engine.awayClub.primaryColor;

      const renderPlayer = (p: typeof engine.homePlayers[0]) => {
        if (p.state === 'sin_bin') return;

        const px = scaleX(p.x);
        const py = scaleY(p.y);

        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(px + 1, py + 2.5, playerRadius, playerRadius * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ball Carrier highlight halo
        if (p.isCarrier) {
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(px, py, playerRadius + 3.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Ruck / Tackle indicator
        if (p.state === 'rucking') {
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, py, playerRadius + 2, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Player Circle Jersey
        ctx.fillStyle = p.team === 'home' ? homeColor : awayColor;
        ctx.beginPath();
        ctx.arc(px, py, playerRadius, 0, Math.PI * 2);
        ctx.fill();

        // Jersey border
        ctx.strokeStyle = p.team === 'home' ? engine.homeClub.secondaryColor : engine.awayClub.secondaryColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Player number
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 ${Math.max(8, playerRadius * 0.9)}px Chakra Petch, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(p.number), px, py + 0.5);

        // Player name tag for ball carrier or active players
        if (p.isCarrier || p.state === 'scrum' || p.state === 'kicking') {
          ctx.font = `600 ${Math.max(9, width * 0.009)}px Inter, sans-serif`;
          const textW = ctx.measureText(p.name).width;
          ctx.fillStyle = 'rgba(15, 23, 20, 0.85)';
          ctx.fillRect(px - textW / 2 - 4, py - playerRadius - 14, textW + 8, 12);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(p.name, px, py - playerRadius - 8);
        }
      };

      // Draw players
      engine.homePlayers.forEach(renderPlayer);
      engine.awayPlayers.forEach(renderPlayer);

      // 6. Render Rugby Ball
      const bx = scaleX(engine.ball.x);
      const by = scaleY(engine.ball.y);
      const bz = engine.ball.z || 0;
      const ballVisualY = by - (bz * 2.5);

      // Ball shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(bx, by + 1, 5 + bz * 0.3, 3 + bz * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ball body (Oval shape with white seams)
      ctx.save();
      ctx.translate(bx, ballVisualY);
      ctx.rotate(engine.ball.state === 'kicked' ? 0.4 : 0);

      // White leather ball
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(0, 0, 6.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rugby ball blue/red grip trim rings
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.8, 3.8, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [engine]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !engine || !onSelectPlayer) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const marginX = width * 0.05;
    const marginY = height * 0.08;
    const pitchW = width - (marginX * 2);
    const pitchH = height - (marginY * 2);

    const normX = ((clickX - marginX) / pitchW) * 100;
    const normY = ((clickY - marginY) / pitchH) * 70;

    let closestP: string | null = null;
    let closestDist = 999;

    [...engine.homePlayers, ...engine.awayPlayers].forEach(p => {
      const d = Math.hypot(p.x - normX, p.y - normY);
      if (d < 5 && d < closestDist) {
        closestDist = d;
        closestP = p.id;
      }
    });

    if (closestP) {
      onSelectPlayer(closestP);
    }
  };

  return (
    <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[64vh] rounded-xl overflow-hidden border border-emerald-950/60 shadow-2xl bg-neutral-950">
      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        onClick={handleCanvasClick}
        className="w-full h-full object-cover cursor-pointer block"
      />
    </div>
  );
};
