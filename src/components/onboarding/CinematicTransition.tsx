import { useEffect, useRef } from 'react';
import ElderDreamKeeper from './ElderDreamKeeper';
import './onboarding.css';

// ── Letter constellation data (A-Z) — from v9 ──────────────────────────────
const LD: Record<string, { p: [number, number][]; l: [number, number][] }> = {
  A:{p:[[.5,0],[0,1],[1,1],[.15,.52],[.85,.52]],l:[[0,1],[0,2],[3,4]]},
  B:{p:[[0,0],[0,1],[0,.5],[.72,.08],[.88,.28],[.72,.5],[.88,.72],[.72,.92]],l:[[0,1],[0,3],[3,4],[4,5],[5,2],[2,6],[6,7],[7,1]]},
  C:{p:[[.88,.14],[.5,0],[0,.5],[.5,1],[.88,.86]],l:[[0,1],[1,2],[2,3],[3,4]]},
  D:{p:[[0,0],[0,1],[.58,.04],[.92,.32],[.92,.68],[.58,.96]],l:[[0,1],[0,2],[2,3],[3,4],[4,5],[5,1]]},
  E:{p:[[0,0],[0,.5],[0,1],[.88,0],[.68,.5],[.88,1]],l:[[0,1],[1,2],[0,3],[1,4],[2,5]]},
  F:{p:[[0,0],[0,1],[.88,0],[.65,.5]],l:[[0,1],[0,2],[1,3]]},
  G:{p:[[.88,.15],[.5,0],[0,.5],[.5,1],[.88,.85],[.88,.5],[.52,.5]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]},
  H:{p:[[0,0],[0,1],[1,0],[1,1],[.12,.5],[.88,.5]],l:[[0,1],[2,3],[4,5]]},
  I:{p:[[.15,0],[.85,0],[.5,0],[.5,1],[.15,1],[.85,1]],l:[[0,1],[2,3],[4,5]]},
  J:{p:[[.18,0],[.82,0],[.82,1],[.28,.86],[0,.64]],l:[[0,1],[1,2],[2,3],[3,4]]},
  K:{p:[[0,0],[0,1],[0,.5],[1,0],[1,1]],l:[[0,1],[2,3],[2,4]]},
  L:{p:[[0,0],[0,1],[.85,1]],l:[[0,1],[1,2]]},
  M:{p:[[0,1],[0,0],[.5,.58],[1,0],[1,1]],l:[[0,1],[1,2],[2,3],[3,4]]},
  N:{p:[[0,1],[0,0],[1,1],[1,0]],l:[[0,1],[1,2],[2,3]]},
  O:{p:[[.5,0],[1,.5],[.5,1],[0,.5]],l:[[0,1],[1,2],[2,3],[3,0]]},
  P:{p:[[0,0],[0,1],[0,.5],[.75,.08],[.92,.3],[.75,.5]],l:[[0,1],[0,3],[3,4],[4,5],[5,2]]},
  Q:{p:[[.5,0],[1,.48],[.5,1],[0,.48],[.62,.65],[.95,.95]],l:[[0,1],[1,2],[2,3],[3,0],[4,5]]},
  R:{p:[[0,0],[0,1],[0,.5],[.75,.08],[.92,.3],[.75,.5],[1,1]],l:[[0,1],[0,3],[3,4],[4,5],[5,2],[5,6]]},
  S:{p:[[.88,.16],[.5,0],[.12,.22],[.5,.5],[.88,.78],[.5,1],[.12,.84]],l:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]},
  T:{p:[[0,0],[1,0],[.5,0],[.5,1]],l:[[0,1],[2,3]]},
  U:{p:[[0,0],[0,.72],[.28,1],[.72,1],[1,.72],[1,0]],l:[[0,1],[1,2],[2,3],[3,4],[4,5]]},
  V:{p:[[0,0],[.5,1],[1,0]],l:[[0,1],[1,2]]},
  W:{p:[[0,0],[.24,1],[.5,.52],[.76,1],[1,0]],l:[[0,1],[1,2],[2,3],[3,4]]},
  X:{p:[[0,0],[1,1],[.5,.5],[0,1],[1,0]],l:[[0,1],[3,4]]},
  Y:{p:[[0,0],[.5,.5],[1,0],[.5,1]],l:[[0,1],[1,2],[1,3]]},
  Z:{p:[[0,0],[1,0],[0,1],[1,1]],l:[[0,1],[1,2],[2,3]]},
};

function buildConstellation(name: string, cW: number, centerY: number) {
  const up = name.toUpperCase().replace(/[^A-Z]/g, '');
  if (!up) return { dots: [] as { x: number; y: number }[], lines: [] as [number, number][] };
  const N = up.length;
  const margin = 28;
  const avail = cW - margin * 2;
  const lW = Math.max(14, Math.min(52, Math.floor(avail / (N * 1.38))));
  const lH = Math.round(lW * 1.55);
  const lPad = Math.max(5, Math.round(lW * 0.28));
  const totalW = N * lW + (N - 1) * lPad;
  const startX = (cW - totalW) / 2;
  const startY = centerY - lH / 2;
  const dots: { x: number; y: number }[] = [];
  const lines: [number, number][] = [];
  up.split('').forEach((ch, li) => {
    const def = LD[ch];
    if (!def) return;
    const ox = startX + li * (lW + lPad);
    const oy = startY;
    const doff = dots.length;
    def.p.forEach(([nx, ny]) => dots.push({ x: ox + nx * lW, y: oy + ny * lH }));
    def.l.forEach(([a, b]) => lines.push([doff + a, doff + b]));
  });
  return { dots, lines };
}

interface Props {
  childName: string;
  onComplete: () => void;
}

export default function CinematicTransition({ childName, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const elderRef = useRef<HTMLDivElement>(null);
  const text1Ref = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const { dots: DOTS, lines: LINES } = buildConstellation(childName, W, 245);
    const bgStars = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 0.6 + 0.2, op: Math.random() * 0.28 + 0.05,
      ts: 2 + Math.random() * 3, to: Math.random() * Math.PI * 2,
    }));
    const shooters: { x: number; y: number; vx: number; vy: number; len: number; life: number; w: number }[] = [];
    let shootT = 0;
    function spawnShoot() {
      shooters.push({
        x: -20 + Math.random() * W * 0.5, y: Math.random() * H * 0.35,
        vx: 3.5 + Math.random() * 4.5, vy: 1.2 + Math.random() * 2,
        len: 90 + Math.random() * 110, life: 1, w: 2 + Math.random() * 1.5,
      });
    }

    let phase: 'stars' | 'dots' | 'lines' | 'glow' | 'text' | 'elder' = 'stars';
    let phaseT = 0;
    let dotsR = 0, linesR = 0;
    const dotOp = new Array(DOTS.length).fill(0);
    const lineP = new Array(LINES.length).fill(0);
    let cGlow = 0, tOp = 0, starBri = 0, lastT: number | null = null;
    let cancelled = false;

    function draw(ts: number) {
      if (cancelled) return;
      if (!lastT) lastT = ts;
      const dt = Math.min((ts - lastT) / 1000, 0.05);
      lastT = ts;
      phaseT += dt;
      ctx!.clearRect(0, 0, W, H);

      if (phase === 'stars' && phaseT > 2.2) { phase = 'dots'; phaseT = 0; }
      if (phase === 'dots' && dotsR >= DOTS.length && phaseT > 0.4) { phase = 'lines'; phaseT = 0; }
      if (phase === 'lines' && linesR >= LINES.length && phaseT > 0.8) { phase = 'glow'; phaseT = 0; }
      if (phase === 'glow' && phaseT > 2) { phase = 'text'; phaseT = 0; }
      if (phase === 'text' && phaseT > 3.5) { phase = 'elder'; phaseT = 0; }

      starBri = Math.min(starBri + dt * 0.22, 1);
      if (phase === 'glow' || phase === 'text' || phase === 'elder') starBri = Math.min(starBri + dt * 0.4, 1);

      shootT -= dt;
      if (shootT <= 0 && (phase === 'stars' || phase === 'dots')) { spawnShoot(); shootT = 1.5 + Math.random() * 2.5; }

      // Shooting stars
      for (let i = shooters.length - 1; i >= 0; i--) {
        const s = shooters[i];
        s.x += s.vx; s.y += s.vy; s.life -= dt * 1.1;
        if (s.life <= 0) { shooters.splice(i, 1); continue; }
        const g = ctx!.createLinearGradient(s.x, s.y, s.x - s.vx * s.len / 3.5, s.y - s.vy * s.len / 3.5);
        g.addColorStop(0, `rgba(255,248,220,${s.life * 0.95})`);
        g.addColorStop(0.3, `rgba(246,197,111,${s.life * 0.7})`);
        g.addColorStop(1, 'rgba(246,197,111,0)');
        ctx!.beginPath();
        ctx!.moveTo(s.x, s.y);
        ctx!.lineTo(s.x - s.vx * s.len / 3.5, s.y - s.vy * s.len / 3.5);
        ctx!.strokeStyle = g;
        ctx!.lineWidth = s.w * s.life;
        ctx!.lineCap = 'round';
        ctx!.stroke();
      }

      // Background stars
      bgStars.forEach(st => {
        const tw = 0.5 + 0.5 * Math.sin(ts * 0.001 * st.ts + st.to);
        ctx!.beginPath();
        ctx!.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${(st.op * tw * (starBri * 0.9 + 0.1)).toFixed(3)})`;
        ctx!.fill();
      });

      // Dots
      if (phase === 'dots') {
        const tpd = Math.max(0.08, Math.min(0.22, 3.2 / Math.max(DOTS.length, 1)));
        dotsR = Math.min(Math.floor(phaseT / tpd), DOTS.length);
      }
      if (phase === 'lines' || phase === 'glow' || phase === 'text' || phase === 'elder') dotsR = DOTS.length;

      for (let i = 0; i < dotsR; i++) dotOp[i] = Math.min(dotOp[i] + dt * 4, 1);
      for (let i = 0; i < DOTS.length; i++) {
        const op = dotOp[i];
        if (op <= 0) continue;
        const d = DOTS[i];
        const grd = ctx!.createRadialGradient(d.x, d.y, 0, d.x, d.y, 10);
        grd.addColorStop(0, `rgba(246,197,111,${op * 0.55})`);
        grd.addColorStop(1, 'rgba(246,197,111,0)');
        ctx!.beginPath(); ctx!.arc(d.x, d.y, 10, 0, Math.PI * 2); ctx!.fillStyle = grd; ctx!.fill();
        ctx!.beginPath(); ctx!.arc(d.x, d.y, 2.8, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,248,220,${op})`;
        ctx!.shadowColor = 'rgba(246,197,111,.9)'; ctx!.shadowBlur = 8 * op;
        ctx!.fill(); ctx!.shadowBlur = 0;
      }

      // Lines
      if (phase === 'lines') {
        const tpl = Math.max(0.1, Math.min(0.28, 3.0 / Math.max(LINES.length, 1)));
        linesR = Math.min(Math.floor(phaseT / tpl), LINES.length);
      }
      if (phase === 'glow' || phase === 'text' || phase === 'elder') { linesR = LINES.length; }

      for (let i = 0; i < linesR; i++) lineP[i] = Math.min(lineP[i] + dt * 3, 1);
      for (let i = 0; i < LINES.length; i++) {
        const p = lineP[i];
        if (p <= 0) continue;
        const [ai, bi] = LINES[i];
        const a = DOTS[ai], b = DOTS[bi];
        const ex = a.x + (b.x - a.x) * p, ey = a.y + (b.y - a.y) * p;
        ctx!.beginPath(); ctx!.moveTo(a.x, a.y); ctx!.lineTo(ex, ey);
        ctx!.strokeStyle = `rgba(246,197,111,${p * 0.38})`; ctx!.lineWidth = 0.9; ctx!.stroke();
      }

      // Glow phase
      if (phase === 'glow' || phase === 'text' || phase === 'elder') {
        cGlow = Math.min(cGlow + dt * 0.6, 1);
        const gp = 0.6 + 0.4 * Math.sin(ts * 0.002);
        DOTS.forEach(d => {
          const grd = ctx!.createRadialGradient(d.x, d.y, 0, d.x, d.y, 20);
          grd.addColorStop(0, `rgba(246,197,111,${cGlow * gp * 0.3})`);
          grd.addColorStop(1, 'rgba(246,197,111,0)');
          ctx!.beginPath(); ctx!.arc(d.x, d.y, 20, 0, Math.PI * 2); ctx!.fillStyle = grd; ctx!.fill();
        });
      }

      // Text phase
      if (phase === 'text' || phase === 'elder') {
        tOp = Math.min(tOp + dt * 0.5, 1);
        if (text1Ref.current) {
          text1Ref.current.textContent = `Alright, ${childName}\u2026`;
          text1Ref.current.style.color = `rgba(244,239,232,${(tOp * 0.82).toFixed(3)})`;
        }
        if (text2Ref.current && tOp > 0.5) {
          text2Ref.current.textContent = 'We have been waiting for you.';
          text2Ref.current.style.color = `rgba(246,197,111,${((tOp - 0.5) * 1.2 * 0.65).toFixed(3)})`;
        }
      }

      // Elder phase
      if (phase === 'elder') {
        const ew = elderRef.current;
        if (ew) {
          const curOp = parseFloat(ew.style.opacity) || 0;
          if (curOp < 0.95) {
            ew.style.opacity = String(Math.min(curOp + dt * 0.35, 1));
            ew.style.transform = `translateY(${Math.max(40 - phaseT * 22, 0)}px)`;
          }
        }
        if (phaseT > 5.8) { onComplete(); return; }
      }

      requestAnimationFrame(draw);
    }

    const startTimer = window.setTimeout(() => requestAnimationFrame(draw), 500);
    return () => { cancelled = true; clearTimeout(startTimer); };
  }, [childName, onComplete]);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#030609', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={345}
        height={748}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
      />
      <div style={{
        position: 'absolute', top: '6%', left: 0, right: 0, height: '22%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', zIndex: 5, padding: '0 32px',
      }}>
        <div ref={text1Ref} style={{
          fontFamily: "'Fraunces', serif", fontSize: 21, fontWeight: 400, fontStyle: 'italic',
          color: 'rgba(244,239,232,0)', letterSpacing: -0.3, textAlign: 'center',
          lineHeight: 1.35, transition: 'color 1.6s ease', marginBottom: 8,
        }} />
        <div ref={text2Ref} style={{
          fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 300, fontStyle: 'italic',
          color: 'rgba(246,197,111,0)', transition: 'color 1.6s .5s ease', textAlign: 'center',
          lineHeight: 1.4, letterSpacing: 0.2,
        }} />
      </div>
      <div ref={elderRef} style={{
        position: 'absolute', bottom: 52, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
        opacity: 0, transform: 'translateY(40px)',
        transition: 'opacity 2s ease, transform 2s ease', zIndex: 5,
      }}>
        <ElderDreamKeeper animate={false} />
      </div>
    </div>
  );
}
