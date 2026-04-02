// ─────────────────────────────────────────────────────────────────────────────
// Share utilities — Instagram card export, Night Card image, platform helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a premium 1080×1350 (4:5 Instagram ratio) story card PNG.
 * Pure Canvas rendering — no DOM dependency, no html2canvas.
 */
export async function generateStoryCardImage(opts: {
  title: string;
  heroName: string;
  refrain?: string;
  creatureEmoji?: string;
  creatureName?: string;
  nightNumber?: number;
  vibe?: string;
}): Promise<Blob | null> {
  const { title, heroName, refrain, creatureEmoji = '🌙', creatureName = 'SleepSeed', nightNumber, vibe } = opts;
  const W = 1080, H = 1350;

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // ── Background gradient (vibe-responsive)
  const vibeColors: Record<string, [string, string]> = {
    'calm-cosy': ['#0C1840', '#1a1060'],
    'warm-funny': ['#2a0828', '#1a0840'],
    'exciting': ['#081838', '#0a2050'],
    'heartfelt': ['#1a0838', '#120850'],
    'mysterious': ['#081828', '#0a1838'],
    'silly': ['#1a1040', '#200850'],
  };
  const [c1, c2] = vibeColors[vibe || ''] || ['#0C1840', '#1a1060'];
  const bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
  bg.addColorStop(0, c1);
  bg.addColorStop(0.5, c2);
  bg.addColorStop(1, c1);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Stars (deterministic from title)
  let hash = 5381;
  for (let i = 0; i < title.length; i++) hash = (hash * 33) ^ title.charCodeAt(i);
  ctx.fillStyle = '#EEE8FF';
  for (let i = 0; i < 50; i++) {
    const x = ((hash * (i + 1) * 37) % 10000) / 10000 * W;
    const y = ((hash * (i + 1) * 53) % 10000) / 10000 * H * 0.6;
    const s = 1.5 + ((hash * (i + 1)) % 3) * 0.8;
    const o = 0.1 + ((hash * (i + 1)) % 5) * 0.06;
    ctx.globalAlpha = o;
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── Creature emoji
  ctx.font = `${Math.round(W * 0.18)}px serif`;
  ctx.textAlign = 'center';
  ctx.fillText(creatureEmoji, W / 2, H * 0.28);

  // ── Content fade gradient
  const fade = ctx.createLinearGradient(0, H * 0.42, 0, H);
  fade.addColorStop(0, 'rgba(12,24,64,0)');
  fade.addColorStop(0.3, 'rgba(12,24,64,0.85)');
  fade.addColorStop(1, 'rgba(12,24,64,0.95)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, H * 0.42, W, H * 0.58);

  // ── Meta line
  ctx.fillStyle = 'rgba(244,239,232,0.35)';
  ctx.font = `600 ${Math.round(W * 0.022)}px sans-serif`;
  ctx.letterSpacing = '2px';
  ctx.textAlign = 'center';
  const metaText = `${heroName.toUpperCase()}'S STORY${nightNumber ? ` · NIGHT ${nightNumber}` : ''}`;
  ctx.fillText(metaText, W / 2, H * 0.56);

  // ── Title
  ctx.fillStyle = '#F4EFE8';
  ctx.font = `bold ${Math.round(W * 0.052)}px Georgia, serif`;
  const titleWords = title.split(' ');
  const titleLines: string[] = [];
  let line = '';
  for (const w of titleWords) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > W - 160) { titleLines.push(line); line = w; }
    else line = test;
  }
  if (line) titleLines.push(line);
  const titleStartY = H * 0.62;
  titleLines.forEach((l, i) => ctx.fillText(l, W / 2, titleStartY + i * Math.round(W * 0.065)));

  // ── Refrain
  if (refrain) {
    const refrainY = titleStartY + titleLines.length * Math.round(W * 0.065) + 30;
    ctx.fillStyle = 'rgba(244,239,232,0.5)';
    ctx.font = `italic ${Math.round(W * 0.032)}px Georgia, serif`;
    const rWords = `"${refrain}"`.split(' ');
    const rLines: string[] = [];
    let rl = '';
    for (const w of rWords) {
      const t = rl ? rl + ' ' + w : w;
      if (ctx.measureText(t).width > W - 180) { rLines.push(rl); rl = w; }
      else rl = t;
    }
    if (rl) rLines.push(rl);
    rLines.slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, refrainY + i * Math.round(W * 0.042)));
  }

  // ── Gold rule
  const ruleY = H * 0.88;
  const ruleGrad = ctx.createLinearGradient(W / 2 - 140, 0, W / 2 + 140, 0);
  ruleGrad.addColorStop(0, 'rgba(212,160,48,0)');
  ruleGrad.addColorStop(0.5, 'rgba(212,160,48,0.5)');
  ruleGrad.addColorStop(1, 'rgba(212,160,48,0)');
  ctx.fillStyle = ruleGrad;
  ctx.fillRect(W / 2 - 140, ruleY, 280, 1.5);

  // ── Footer
  ctx.fillStyle = 'rgba(244,239,232,0.3)';
  ctx.font = `${Math.round(W * 0.018)}px sans-serif`;
  ctx.textAlign = 'left';
  const footerY = H * 0.93;
  ctx.fillText(`${creatureEmoji}  ${creatureName}`, W * 0.08, footerY);
  ctx.textAlign = 'right';
  ctx.font = `${Math.round(W * 0.02)}px Georgia, serif`;
  ctx.fillStyle = 'rgba(244,239,232,0.22)';
  ctx.fillText('sleepseed', W * 0.92, footerY);

  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png'));
}

/**
 * Generate a premium Night Card image (600×800, matching the visual design).
 * Renders: gradient sky, stars, creature, headline, quote, hero name, branding.
 */
export async function generateNightCardImage(nc: {
  heroName: string;
  headline: string;
  quote: string;
  emoji?: string;
  date: string;
  photo?: string;
  nightNumber?: number;
  creatureEmoji?: string;
  creatureColor?: string;
  isOrigin?: boolean;
}): Promise<Blob | null> {
  const W = 600, H = 840;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const creature = nc.creatureEmoji || nc.emoji || '🌙';
  const color = nc.creatureColor || '#9A7FD4';

  // Parse creature color to rgba
  const hexToRgb = (hex: string) => {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 154, g: 127, b: 212 };
  };
  const rgb = hexToRgb(color);

  // ── Sky zone (top 45%)
  const skyH = Math.round(H * 0.45);
  const skyGrad = ctx.createLinearGradient(0, 0, 0, skyH);
  skyGrad.addColorStop(0, nc.isOrigin ? '#150e05' : '#0d1428');
  skyGrad.addColorStop(1, nc.isOrigin ? '#2a1808' : '#1a1040');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, skyH);

  // Glow
  const glowGrad = ctx.createRadialGradient(W / 2, skyH * 0.5, 0, W / 2, skyH * 0.5, W * 0.5);
  glowGrad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.2)`);
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, W, skyH);

  // Stars
  let hash = 5381;
  for (let i = 0; i < nc.headline.length; i++) hash = (hash * 33) ^ nc.headline.charCodeAt(i);
  ctx.fillStyle = '#EEE8FF';
  for (let i = 0; i < 30; i++) {
    const x = ((hash * (i + 1) * 37) % 5800) / 5800 * W;
    const y = ((hash * (i + 1) * 53) % 3600) / 3600 * skyH;
    const s = 1 + ((hash * (i + 1)) % 3) * 0.4;
    ctx.globalAlpha = 0.12 + ((hash * (i + 1)) % 5) * 0.06;
    ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Night badge
  if (nc.nightNumber) {
    ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.2)`;
    const badgeW = 90, badgeH = 24, badgeX = 16, badgeY = 16;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
    ctx.fill();
    ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.9)`;
    ctx.font = '600 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`NIGHT ${nc.nightNumber}`, badgeX + badgeW / 2, badgeY + 16);
  }

  // Creature emoji
  ctx.font = '64px serif';
  ctx.textAlign = 'center';
  ctx.fillText(creature, W / 2, skyH * 0.55);

  // Photo (if available, draw it in sky area)
  const drawRest = () => {
    // ── Paper zone (bottom 55%)
    const paperColor = nc.isOrigin ? '#fdf8ee' : '#faf6ee';
    ctx.fillStyle = paperColor;
    ctx.fillRect(0, skyH, W, H - skyH);

    // Subtle grain texture effect
    ctx.fillStyle = 'rgba(0,0,0,0.02)';
    for (let i = 0; i < 200; i++) {
      const gx = Math.random() * W;
      const gy = skyH + Math.random() * (H - skyH);
      ctx.fillRect(gx, gy, 1, 1);
    }

    // Headline
    ctx.fillStyle = nc.isOrigin ? '#1a0e04' : '#1a0f08';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    const headlineWords = nc.headline.split(' ');
    const headLines: string[] = [];
    let hl = '';
    for (const w of headlineWords) {
      const t = hl ? hl + ' ' + w : w;
      if (ctx.measureText(t).width > W - 60) { headLines.push(hl); hl = w; }
      else hl = t;
    }
    if (hl) headLines.push(hl);
    const headY = skyH + 32;
    headLines.slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, headY + i * 24));

    // Quote
    ctx.fillStyle = 'rgba(26,15,8,0.55)';
    ctx.font = 'italic 15px Georgia, serif';
    const quoteText = `"${nc.quote}"`;
    const qWords = quoteText.split(' ');
    const qLines: string[] = [];
    let ql = '';
    for (const w of qWords) {
      const t = ql ? ql + ' ' + w : w;
      if (ctx.measureText(t).width > W - 80) { qLines.push(ql); ql = w; }
      else ql = t;
    }
    if (ql) qLines.push(ql);
    const quoteY = headY + headLines.length * 24 + 20;
    qLines.slice(0, 4).forEach((l, i) => ctx.fillText(l, W / 2, quoteY + i * 22));

    // Origin badge
    if (nc.isOrigin) {
      const oy = quoteY + qLines.length * 22 + 20;
      ctx.fillStyle = 'rgba(245,184,76,0.15)';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 60, oy, 120, 24, 12);
      ctx.fill();
      ctx.fillStyle = 'rgba(245,184,76,0.8)';
      ctx.font = '600 10px sans-serif';
      ctx.fillText('✦ First Night Ever', W / 2, oy + 16);
    }

    // Footer
    const footerY = H - 40;
    // Divider
    ctx.strokeStyle = 'rgba(26,15,8,0.08)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(40, footerY - 14); ctx.lineTo(W - 40, footerY - 14); ctx.stroke();

    ctx.fillStyle = 'rgba(26,15,8,0.35)';
    ctx.font = '600 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(nc.heroName, 40, footerY);
    ctx.textAlign = 'center';
    try {
      ctx.fillText(new Date(nc.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), W / 2, footerY);
    } catch { ctx.fillText(nc.date, W / 2, footerY); }
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(26,15,8,0.2)';
    ctx.font = '10px monospace';
    ctx.fillText('SleepSeed', W - 40, footerY);
  };

  if (nc.photo) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw photo in sky area
      const photoH = skyH - 20;
      const scale = Math.max(W / img.width, photoH / img.height);
      const sw = img.width * scale, sh = img.height * scale;
      ctx.drawImage(img, (W - sw) / 2, 10 + (photoH - sh) / 2, sw, sh);
      // Re-draw creature on top of photo
      ctx.font = '48px serif';
      ctx.textAlign = 'center';
      ctx.fillText(creature, W / 2, skyH - 20);
      drawRest();
    };
    img.onerror = () => drawRest();
    img.src = nc.photo;
    // Wait for image to load
    return new Promise(resolve => {
      const check = setInterval(() => {
        if (img.complete || img.naturalWidth > 0) {
          clearInterval(check);
          setTimeout(() => canvas.toBlob(b => resolve(b), 'image/png'), 50);
        }
      }, 50);
      setTimeout(() => { clearInterval(check); canvas.toBlob(b => resolve(b), 'image/png'); }, 3000);
    });
  } else {
    drawRest();
    return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png'));
  }
}

/**
 * Download a blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Share or download a story card image for Instagram.
 */
export async function shareStoryCardForInstagram(opts: {
  title: string;
  heroName: string;
  refrain?: string;
  creatureEmoji?: string;
  creatureName?: string;
  nightNumber?: number;
  vibe?: string;
}): Promise<void> {
  const blob = await generateStoryCardImage(opts);
  if (!blob) return;
  const file = new File([blob], `sleepseed-${opts.title.replace(/[^a-z0-9]/gi, '_')}.png`, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: opts.title }); return; } catch {}
  }
  downloadBlob(blob, file.name);
}

/**
 * Share or download a Night Card image.
 */
export async function shareNightCardImage(nc: Parameters<typeof generateNightCardImage>[0]): Promise<void> {
  const blob = await generateNightCardImage(nc);
  if (!blob) return;
  const file = new File([blob], `nightcard-${nc.heroName}-${nc.date}.png`, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: `${nc.heroName}'s Night Card` }); return; } catch {}
  }
  downloadBlob(blob, file.name);
}
