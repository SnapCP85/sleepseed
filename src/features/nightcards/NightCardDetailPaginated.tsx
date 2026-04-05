import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { SavedNightCard } from '../../lib/types';
import { getCardVariant, CARD_VARIANT_STYLES } from '../../lib/types';

/* ─────────────────────────────────────────────────────────
   CSS — ported verbatim from sleepseed-nightcard-paginated.html
   reference file.  Embedded per project convention.
   ───────────────────────────────────────────────────────── */
const CSS = `
:root {
  --ncd-night: #060912;
  --ncd-amber: #F5B84C;
  --ncd-amber-dim: #c99436;
  --ncd-amber-deep: #a8782b;
  --ncd-teal: #14d890;
  --ncd-purple: #9482ff;
  --ncd-cream: #F4EFE8;
  --ncd-cream-dim: #d8d1c5;
  --ncd-paper: #f7f1e3;
  --ncd-ink: #2a2620;
  --ncd-ink-dim: #6b6359;
  --ncd-ink-faint: #9a9185;
  --ncd-hairline: rgba(42, 38, 32, 0.09);
  --ncd-hairline-strong: rgba(42, 38, 32, 0.15);
}

/* ============ CARD SHELL ============ */
.ncd-card {
  width: 340px;
  max-width: 100%;
  height: 640px;
  max-height: calc(100vh - 80px);
  background: var(--ncd-cream);
  background-image:
    radial-gradient(ellipse 120% 80% at 50% 0%, rgba(255,250,240,0.7) 0%, transparent 50%),
    radial-gradient(ellipse 100% 60% at 50% 100%, rgba(245, 184, 76, 0.04) 0%, transparent 50%);
  border-radius: 10px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.8),
    inset 0 0 0 0.5px rgba(42, 38, 32, 0.06),
    0 60px 120px -35px rgba(0,0,0,0.8),
    0 35px 65px -22px rgba(0,0,0,0.55),
    0 12px 24px -8px rgba(0,0,0,0.3),
    0 0 0 1px rgba(245, 184, 76, 0.04);
  padding: 14px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}
.ncd-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.16 0 0 0 0 0.13 0 0 0 0 0.1 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.045;
  mix-blend-mode: multiply;
  pointer-events: none;
  border-radius: inherit;
  z-index: 1;
}
.ncd-card::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 45%;
  background: radial-gradient(ellipse 70% 100% at 50% 100%,
    rgba(245, 184, 76, 0.055) 0%,
    rgba(245, 184, 76, 0.02) 40%,
    transparent 70%);
  pointer-events: none;
  border-radius: inherit;
  z-index: 1;
}
.ncd-card > * { position: relative; z-index: 2; }

/* ============ PHOTO ZONE ============ */
.ncd-photo-zone {
  position: relative;
  width: 100%;
  height: 320px;
  border-radius: 5px;
  overflow: hidden;
  background: var(--ncd-night);
  flex-shrink: 0;
  box-shadow:
    inset 0 0 0 0.5px rgba(0,0,0,0.35),
    0 1px 2px rgba(0,0,0,0.12),
    0 8px 20px -8px rgba(0,0,0,0.25);
}
.ncd-photo-zone img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.ncd-photo-gradient-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 100% 70% at 50% 100%, rgba(245, 184, 76, 0.09) 0%, transparent 45%),
    radial-gradient(ellipse 140% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.28) 100%),
    linear-gradient(180deg,
      rgba(0,0,0,0.38) 0%,
      rgba(0,0,0,0.08) 18%,
      transparent 35%,
      transparent 65%,
      rgba(0,0,0,0.22) 100%);
  pointer-events: none;
}
.ncd-photo-zone::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(245, 184, 76, 0.4), transparent);
  pointer-events: none;
}

/* ── Photo fallback (no photo — creature on gradient) ── */
.ncd-photo-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.ncd-photo-fallback-creature {
  font-size: 72px;
  z-index: 2;
  animation: ncdFloat 4s ease-in-out infinite;
}
.ncd-photo-fallback-glow {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  width: 160px; height: 160px;
  border-radius: 50%;
  filter: blur(45px);
  opacity: 0.3;
  z-index: 1;
}
@keyframes ncdFloat {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* ── Close button ── */
.ncd-modal-close {
  position: absolute;
  top: 13px; left: 13px;
  width: 32px; height: 32px;
  background:
    linear-gradient(135deg, rgba(20, 15, 10, 0.55), rgba(20, 15, 10, 0.35));
  backdrop-filter: blur(14px) saturate(1.4);
  -webkit-backdrop-filter: blur(14px) saturate(1.4);
  border: 0.5px solid rgba(255,255,255,0.22);
  border-radius: 50%;
  color: rgba(255,255,255,0.95);
  font-size: 15px;
  font-weight: 300;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  box-shadow:
    0 4px 12px -2px rgba(0,0,0,0.35),
    inset 0 1px 0 rgba(255,255,255,0.15);
  transition: all 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);
  padding: 0;
}
.ncd-modal-close:hover {
  background: linear-gradient(135deg, rgba(20, 15, 10, 0.7), rgba(20, 15, 10, 0.5));
  transform: scale(1.05);
}

/* ── Creature seal pill ── */
.ncd-creature-seal {
  position: absolute;
  top: 13px; right: 13px;
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.14em;
  color: rgba(255, 243, 214, 0.98);
  background:
    linear-gradient(135deg,
      rgba(245, 184, 76, 0.32) 0%,
      rgba(200, 140, 60, 0.22) 50%,
      rgba(168, 120, 43, 0.28) 100%);
  backdrop-filter: blur(14px) saturate(1.4);
  -webkit-backdrop-filter: blur(14px) saturate(1.4);
  padding: 6px 12px 6px 9px;
  border-radius: 100px;
  text-transform: uppercase;
  border: 0.5px solid rgba(245, 184, 76, 0.45);
  display: flex;
  align-items: center;
  gap: 7px;
  z-index: 3;
  box-shadow:
    0 4px 12px -2px rgba(0,0,0,0.35),
    inset 0 1px 0 rgba(255, 230, 180, 0.35),
    0 0 20px -6px rgba(245, 184, 76, 0.3);
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
}
.ncd-creature-seal .ncd-seal-emoji {
  font-size: 13px;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
}

/* ── Origin foil shimmer ── */
@keyframes ncdFoilShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.ncd-origin-foil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 20%,
    rgba(245,184,76,0.08) 30%,
    rgba(255,255,255,0.12) 38%,
    transparent 50%
  );
  background-size: 200% 100%;
  animation: ncdFoilShimmer 5s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
}

/* ============ PAGINATOR ============ */
.ncd-paginator {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  min-height: 0;
  position: relative;
}
.ncd-page-label-zone {
  height: 26px;
  padding: 6px 0 8px;
  text-align: center;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.ncd-page-label-ornament {
  font-size: 5px;
  color: var(--ncd-amber-deep);
  opacity: 0.55;
  transition: opacity 0.45s ease;
  letter-spacing: 0;
}
.ncd-page-label {
  font-family: 'DM Mono', monospace;
  font-size: 8.5px;
  letter-spacing: 0.26em;
  color: var(--ncd-ink-dim);
  text-transform: uppercase;
  opacity: 0.8;
  transition: opacity 0.35s ease, transform 0.35s ease;
}

/* — PAGE ROW: gold side rails + sliding page window — */
.ncd-page-row {
  flex: 1;
  display: flex;
  align-items: stretch;
  min-height: 0;
  gap: 4px;
}
.ncd-nav-side {
  width: 32px;
  flex-shrink: 0;
  border: none;
  background: linear-gradient(180deg,
    rgba(245, 184, 76, 0.02) 0%,
    rgba(245, 184, 76, 0.08) 20%,
    rgba(245, 184, 76, 0.18) 50%,
    rgba(245, 184, 76, 0.08) 80%,
    rgba(245, 184, 76, 0.02) 100%);
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ncd-amber-deep);
  transition: all 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
  position: relative;
  padding: 0;
  overflow: visible;
}
/* inner gilt line */
.ncd-nav-side::before {
  content: '';
  position: absolute;
  top: 10%;
  bottom: 10%;
  width: 2px;
  background: linear-gradient(180deg,
    transparent 0%,
    rgba(245, 184, 76, 0.3) 15%,
    var(--ncd-amber) 40%,
    var(--ncd-amber) 60%,
    rgba(245, 184, 76, 0.3) 85%,
    transparent 100%);
  opacity: 0.75;
  transition: opacity 0.4s ease, width 0.4s ease;
  border-radius: 1px;
}
.ncd-nav-prev::before { right: 5px; }
.ncd-nav-next::before { left: 5px; }
/* ambient hover halo */
.ncd-nav-side::after {
  content: '';
  position: absolute;
  inset: -4px;
  background: radial-gradient(ellipse 60% 50% at 50% 50%,
    rgba(245, 184, 76, 0.22) 0%,
    transparent 70%);
  opacity: 0;
  transition: opacity 0.45s ease;
  pointer-events: none;
  border-radius: 8px;
}
.ncd-nav-side:hover:not(:disabled) {
  background: linear-gradient(180deg,
    rgba(245, 184, 76, 0.04) 0%,
    rgba(245, 184, 76, 0.14) 20%,
    rgba(245, 184, 76, 0.3) 50%,
    rgba(245, 184, 76, 0.14) 80%,
    rgba(245, 184, 76, 0.04) 100%);
  color: var(--ncd-amber);
}
.ncd-nav-side:hover:not(:disabled)::before {
  opacity: 1;
  width: 2.5px;
}
.ncd-nav-side:hover:not(:disabled)::after {
  opacity: 1;
}
.ncd-nav-side:disabled {
  opacity: 0.15;
  cursor: default;
}
.ncd-nav-side .ncd-chevron {
  position: relative;
  z-index: 1;
  width: 20px;
  height: 20px;
  transition: transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
  filter: drop-shadow(0 0 6px rgba(245, 184, 76, 0.3));
  animation: ncdChevronBreathe 4.5s ease-in-out infinite;
}
.ncd-nav-side:disabled .ncd-chevron {
  animation: none;
}
@keyframes ncdChevronBreathe {
  0%, 100% { opacity: 0.78; }
  50% { opacity: 1; }
}
.ncd-nav-side:hover:not(:disabled) .ncd-chevron {
  transform: scale(1.15);
  filter: drop-shadow(0 0 10px rgba(245, 184, 76, 0.55));
}
.ncd-nav-prev:hover:not(:disabled) .ncd-chevron {
  transform: scale(1.15) translateX(-2px);
}
.ncd-nav-next:hover:not(:disabled) .ncd-chevron {
  transform: scale(1.15) translateX(2px);
}
.ncd-nav-side .ncd-chevron svg {
  width: 100%;
  height: 100%;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

.ncd-page-window {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
}
.ncd-page-track {
  position: absolute;
  inset: 0;
  display: flex;
  transition: transform 0.55s cubic-bezier(0.32, 0.72, 0.3, 1);
}
.ncd-page {
  flex: 0 0 100%;
  width: 100%;
  padding: 8px 10px 4px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* — NAV FOOTER: dots only — */
.ncd-nav-footer {
  flex-shrink: 0;
  padding: 12px 4px 4px;
  border-top: 1px solid var(--ncd-hairline);
  display: flex;
  align-items: center;
  justify-content: center;
}
.ncd-nav-dots {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 1;
  justify-content: center;
}
.ncd-nav-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(42, 38, 32, 0.18);
  cursor: pointer;
  transition: all 0.45s cubic-bezier(0.22, 0.61, 0.36, 1);
  border: none;
  padding: 0;
  position: relative;
}
.ncd-nav-dot.ncd-active {
  width: 22px;
  border-radius: 100px;
  background: linear-gradient(90deg, var(--ncd-amber-dim), var(--ncd-amber), var(--ncd-amber-dim));
  box-shadow:
    0 0 14px rgba(245, 184, 76, 0.5),
    0 0 4px rgba(245, 184, 76, 0.3);
}
.ncd-nav-dot:hover:not(.ncd-active) {
  background: rgba(168, 120, 43, 0.55);
  transform: scale(1.15);
}

/* ============ PAGE: COVER ============ */
.ncd-cover-page {
  text-align: center;
  padding: 0 6px;
}
.ncd-cover-headline {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.25;
  color: var(--ncd-ink);
  letter-spacing: -0.01em;
}
.ncd-cover-whisper {
  font-family: 'Kalam', cursive;
  font-size: 15px;
  line-height: 1.35;
  color: var(--ncd-ink);
  margin-top: 10px;
  opacity: 0.95;
}
.ncd-cover-memory {
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  color: var(--ncd-ink-dim);
  margin-top: 10px;
  line-height: 1.5;
}
.ncd-cover-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  margin-top: 16px;
  padding-top: 13px;
  border-top: 1px solid var(--ncd-hairline);
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.14em;
  color: var(--ncd-ink-faint);
  text-transform: uppercase;
}
.ncd-cover-meta .ncd-mood {
  font-size: 14px;
  margin-right: 2px;
  filter: drop-shadow(0 1px 2px rgba(245, 184, 76, 0.15));
}
.ncd-cover-meta .ncd-bullet { color: var(--ncd-amber-deep); margin-right: 4px; }
.ncd-book-link {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 13px;
  color: var(--ncd-amber-deep);
  text-decoration: none;
  padding: 12px 0 4px;
  display: block;
  text-align: center;
  transition: color 0.35s ease, letter-spacing 0.35s ease;
  cursor: pointer;
  position: relative;
  letter-spacing: 0.005em;
  background: none;
  border: none;
  width: 100%;
}
.ncd-book-link::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 2px;
  transform: translateX(-50%);
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(245, 184, 76, 0.6),
    transparent);
  transition: width 0.4s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.3s ease;
  opacity: 0.5;
}
.ncd-book-link:hover {
  color: var(--ncd-amber);
  letter-spacing: 0.015em;
}
.ncd-book-link:hover::after {
  width: 100px;
  opacity: 1;
}
.ncd-book-link .ncd-book-label {
  font-family: 'DM Mono', monospace;
  font-style: normal;
  font-size: 8px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--ncd-ink-faint);
  display: block;
  margin-bottom: 4px;
  opacity: 0.72;
}
.ncd-book-link .ncd-book-arrow {
  font-style: normal;
  margin-left: 5px;
  transition: transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);
  display: inline-block;
}
.ncd-book-link:hover .ncd-book-arrow { transform: translateX(4px); }

/* ============ PAGE: VOICE ============ */
.ncd-voice-box {
  background:
    linear-gradient(135deg, rgba(20, 216, 144, 0.1), rgba(148, 130, 255, 0.08)),
    radial-gradient(ellipse at top right, rgba(245, 184, 76, 0.04), transparent 60%);
  border: 1px solid rgba(148, 130, 255, 0.25);
  border-radius: 12px;
  padding: 20px 18px 16px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.4),
    0 8px 24px -8px rgba(148, 130, 255, 0.18),
    0 2px 4px rgba(0,0,0,0.03);
  backdrop-filter: blur(4px);
}
.ncd-voice-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ncd-play-btn {
  width: 42px; height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ncd-amber), var(--ncd-amber-dim));
  border: none;
  cursor: pointer;
  box-shadow:
    0 6px 14px -3px rgba(245, 184, 76, 0.55),
    0 2px 4px rgba(0,0,0,0.1),
    inset 0 1px 0 rgba(255, 230, 180, 0.6),
    inset 0 -1px 0 rgba(168, 120, 43, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
}
.ncd-play-btn svg { width: 13px; height: 13px; fill: var(--ncd-ink); margin-left: 2px; }
.ncd-waveform {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1.5px;
  height: 32px;
}
.ncd-wave-bar {
  flex: 1;
  background: linear-gradient(180deg, var(--ncd-amber), var(--ncd-amber-dim));
  border-radius: 1.5px;
  opacity: 0.82;
}
.ncd-voice-desc {
  margin-top: 12px;
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  color: var(--ncd-ink);
  line-height: 1.55;
  opacity: 0.88;
  text-align: center;
}
.ncd-voice-duration {
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: var(--ncd-amber-deep);
  letter-spacing: 0.12em;
  margin-right: 8px;
  text-transform: uppercase;
}

/* ============ PAGE: BONDING ANSWER ============ */
.ncd-answer-page { text-align: center; padding: 4px 8px; }
.ncd-answer-context {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 12.5px;
  color: var(--ncd-ink-dim);
  opacity: 0.75;
  line-height: 1.5;
  margin-bottom: 18px;
  max-width: 280px;
  margin-left: auto;
  margin-right: auto;
}
.ncd-answer-text {
  font-family: 'Baloo 2', sans-serif;
  font-size: 19px;
  font-weight: 500;
  line-height: 1.38;
  color: var(--ncd-ink);
  padding: 0 6px;
}
.ncd-answer-byline {
  margin-top: 18px;
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.15em;
  color: var(--ncd-ink-faint);
  opacity: 0.7;
  text-transform: uppercase;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
.ncd-answer-byline .ncd-mood-pill { font-size: 14px; }

/* ============ PAGE: DRAWING ============ */
.ncd-drawing-page { text-align: center; padding: 0 4px; }
.ncd-drawing-paper {
  background: var(--ncd-paper);
  background-image:
    radial-gradient(ellipse 100% 80% at 30% 20%, rgba(245, 230, 200, 0.5), transparent 60%),
    radial-gradient(ellipse 80% 60% at 80% 80%, rgba(235, 215, 180, 0.4), transparent 60%);
  border-radius: 3px;
  padding: 18px 14px 14px;
  transform: rotate(0.5deg);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.6),
    0 12px 24px -10px rgba(0,0,0,0.3),
    0 6px 12px -6px rgba(0,0,0,0.2);
  position: relative;
  max-width: 290px;
  margin: 0 auto;
}
.ncd-drawing-paper::before,
.ncd-drawing-paper::after {
  content: '';
  position: absolute;
  width: 32px; height: 10px;
  background: rgba(245, 220, 160, 0.55);
  border: 0.5px solid rgba(220, 190, 130, 0.35);
  top: -4px;
}
.ncd-drawing-paper::before { left: 12px; transform: rotate(-4deg); }
.ncd-drawing-paper::after { right: 12px; transform: rotate(3deg); }
.ncd-drawing-img {
  width: 100%;
  max-width: 210px;
  display: block;
  margin: 0 auto;
  border-radius: 2px;
}
.ncd-drawing-byline {
  margin-top: 6px;
  font-family: 'DM Mono', monospace;
  font-size: 7.5px;
  letter-spacing: 0.18em;
  color: var(--ncd-ink-faint);
  opacity: 0.6;
  text-transform: uppercase;
}

/* ============ PAGE: DIARY ============ */
.ncd-diary-page {
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}
.ncd-diary-text {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--ncd-ink);
  opacity: 0.92;
  text-align: left;
  max-width: 280px;
  margin: 0 auto;
  letter-spacing: 0.002em;
  position: relative;
}
.ncd-diary-text::before {
  content: '';
  position: absolute;
  left: -14px;
  top: 4px;
  bottom: 4px;
  width: 1px;
  background: linear-gradient(180deg,
    transparent,
    rgba(245, 184, 76, 0.35) 20%,
    rgba(245, 184, 76, 0.35) 80%,
    transparent);
}
`;

/* ─────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────── */

const WAVEFORM_HEIGHTS = [20, 35, 55, 42, 68, 88, 72, 50, 30, 45, 62, 78, 92, 80, 58, 40, 55, 70, 85, 66, 48, 32, 25, 40, 55, 72, 60, 42];

interface PageDef {
  key: string;
  label: string;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  } catch { return iso; }
}

function formatTime(iso: string, bedtimeActual?: string): string {
  if (bedtimeActual) {
    // Convert 24h HH:MM to 12h format
    const [h, m] = bedtimeActual.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
}

function truncateWhisper(text: string, max = 48): string {
  if (text.length <= max) return text;
  const truncated = text.slice(0, max);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated) + '…';
}

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

interface NightCardDetailPaginatedProps {
  card: SavedNightCard;
  onClose: () => void;
  onOpenStory?: (card: SavedNightCard) => void;
}

export default function NightCardDetailPaginated({
  card,
  onClose,
  onOpenStory,
}: NightCardDetailPaginatedProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [labelText, setLabelText] = useState('');
  const [labelVisible, setLabelVisible] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const variant = useMemo(() => getCardVariant(card), [card]);
  const vs = CARD_VARIANT_STYLES[variant];
  const creatureEmoji = card.creatureEmoji || card.emoji || '🌙';
  const creatureColor = card.creatureColor || vs.glowColor;
  const hasPhoto = !!(card.photo && card.photo.length > 0 && card.photo !== '[uploaded]');

  // Build pages array based on available data
  const pages = useMemo<PageDef[]>(() => {
    const p: PageDef[] = [{ key: 'cover', label: 'Tonight' }];
    if (card.audioClip) p.push({ key: 'voice', label: 'Her voice' });
    if (card.bondingAnswer) p.push({ key: 'answer', label: 'What she said' });
    if (card.childDrawing) p.push({ key: 'drawing', label: 'What she drew' });
    if (card.parentReflection) p.push({ key: 'diary', label: 'What I want to remember' });
    return p;
  }, [card.audioClip, card.bondingAnswer, card.childDrawing, card.parentReflection]);

  // Reset page when card changes
  useEffect(() => {
    setCurrentPage(0);
    setIsPlaying(false);
  }, [card.id]);

  // Update label text with animation
  useEffect(() => {
    setLabelVisible(false);
    const timeout = setTimeout(() => {
      setLabelText(pages[currentPage]?.label || '');
      setLabelVisible(true);
    }, 260);
    return () => clearTimeout(timeout);
  }, [currentPage, pages]);

  // Focus card on mount for keyboard nav
  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  const goToPage = useCallback((index: number) => {
    if (index < 0 || index >= pages.length) return;
    setCurrentPage(index);
  }, [pages.length]);

  // Keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goToPage(currentPage + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goToPage(currentPage - 1); }
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  }, [currentPage, goToPage, onClose]);

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    // Only horizontal swipe, threshold 50px, not too vertical
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goToPage(currentPage + 1);
      else goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  // Audio playback
  const toggleAudio = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying]);

  const handleBookLinkClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenStory) onOpenStory(card);
  }, [card, onOpenStory]);

  // ── Variant-specific seal styling ──
  const sealStyle = useMemo(() => {
    const base = {
      background: `linear-gradient(135deg,
        ${vs.glowColor}52 0%,
        ${vs.glowColor}38 50%,
        ${vs.glowColor}47 100%)`,
      borderColor: `${vs.glowColor}73`,
      boxShadow: `0 4px 12px -2px rgba(0,0,0,0.35),
        inset 0 1px 0 rgba(255, 230, 180, 0.35),
        0 0 20px -6px ${vs.glowColor}4D`,
    };
    return base;
  }, [vs.glowColor]);

  /* ─── Render page content ─── */

  function renderCoverPage() {
    return (
      <div className="ncd-cover-page">
        <div className="ncd-cover-headline">{card.headline}</div>
        {card.whisper && (
          <div className="ncd-cover-whisper">{truncateWhisper(card.whisper)}</div>
        )}
        {card.memory_line && (
          <div className="ncd-cover-memory">{card.memory_line}</div>
        )}
        <div className="ncd-cover-meta">
          {card.childMood && (
            <span className="ncd-mood">{card.childMood}</span>
          )}
          <span>
            <span className="ncd-bullet">◆</span>
            {formatDate(card.date)}
          </span>
          <span>
            <span className="ncd-bullet">◆</span>
            {formatTime(card.date, card.bedtimeActual)}
          </span>
        </div>
        {card.storyTitle && (
          <button
            className="ncd-book-link"
            onClick={handleBookLinkClick}
            type="button"
          >
            <span className="ncd-book-label">tonight's story</span>
            {card.storyTitle} <span className="ncd-book-arrow">→</span>
          </button>
        )}
      </div>
    );
  }

  function renderVoicePage() {
    return (
      <div className="ncd-voice-box">
        <div className="ncd-voice-row">
          <button className="ncd-play-btn" onClick={toggleAudio} type="button" aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? (
              <svg viewBox="0 0 16 16"><rect x="3" y="2" width="4" height="12" fill="var(--ncd-ink)"/><rect x="9" y="2" width="4" height="12" fill="var(--ncd-ink)"/></svg>
            ) : (
              <svg viewBox="0 0 16 16"><path d="M4 2l10 6-10 6V2z"/></svg>
            )}
          </button>
          <div className="ncd-waveform">
            {WAVEFORM_HEIGHTS.map((h, i) => (
              <div key={i} className="ncd-wave-bar" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="ncd-voice-desc">
          <span className="ncd-voice-duration">
            {/* No duration field in schema — show generic */}
            {isPlaying ? 'Playing' : 'Recorded'}
          </span>
        </div>
        {card.audioClip && (
          <audio
            ref={audioRef}
            src={card.audioClip}
            onEnded={() => setIsPlaying(false)}
            preload="metadata"
          />
        )}
      </div>
    );
  }

  function renderAnswerPage() {
    // Transform bondingQuestion into natural prose context line
    const contextLine = card.bondingQuestion
      ? `When ${creatureEmoji} asked her ${card.bondingQuestion.toLowerCase().replace(/\?$/, '')} —`
      : undefined;

    return (
      <div className="ncd-answer-page">
        {contextLine && (
          <div className="ncd-answer-context">{contextLine}</div>
        )}
        <div className="ncd-answer-text">"{card.bondingAnswer}"</div>
        <div className="ncd-answer-byline">
          <span>{card.heroName}{card.childAge ? ` · age ${card.childAge}` : ''}</span>
          {card.childMood && <span className="ncd-mood-pill">{card.childMood}</span>}
        </div>
      </div>
    );
  }

  function renderDrawingPage() {
    return (
      <div className="ncd-drawing-page">
        <div className="ncd-drawing-paper">
          <img
            className="ncd-drawing-img"
            src={card.childDrawing}
            alt={`Drawing by ${card.heroName}`}
            style={{ objectFit: 'contain' }}
          />
          <div className="ncd-drawing-byline">
            {card.heroName}{card.childAge ? `, age ${card.childAge}` : ''}
          </div>
        </div>
      </div>
    );
  }

  function renderDiaryPage() {
    return (
      <div className="ncd-diary-page">
        <div className="ncd-diary-text">{card.parentReflection}</div>
      </div>
    );
  }

  const PAGE_RENDERERS: Record<string, () => JSX.Element> = {
    cover: renderCoverPage,
    voice: renderVoicePage,
    answer: renderAnswerPage,
    drawing: renderDrawingPage,
    diary: renderDiaryPage,
  };

  const formattedDate = formatDate(card.date);

  return (
    <>
      <style>{CSS}</style>
      <div
        ref={cardRef}
        className="ncd-card"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-label={`Night card — ${formattedDate}, ${card.heroName}'s bedtime`}
        style={{ outline: 'none' }}
      >
        {/* ── PHOTO ZONE ── */}
        <div className="ncd-photo-zone" style={!hasPhoto ? { background: vs.skyGradient } : undefined}>
          {hasPhoto ? (
            <>
              <img src={card.photo} alt={`${card.heroName}'s bedtime on ${formattedDate}`} />
              <div className="ncd-photo-gradient-overlay" />
              {variant === 'origin' && <div className="ncd-origin-foil" />}
            </>
          ) : (
            <div className="ncd-photo-fallback">
              <div className="ncd-photo-fallback-glow" style={{ background: creatureColor }} />
              <div className="ncd-photo-fallback-creature">{creatureEmoji}</div>
            </div>
          )}

          {/* Close button */}
          <button
            className="ncd-modal-close"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close"
            type="button"
          >
            ×
          </button>

          {/* Creature seal pill */}
          <div
            className="ncd-creature-seal"
            style={{
              background: sealStyle.background,
              borderColor: sealStyle.borderColor,
              boxShadow: sealStyle.boxShadow,
            }}
          >
            <span className="ncd-seal-emoji">{creatureEmoji}</span>
            <span>Night {card.nightNumber || 1}</span>
          </div>
        </div>

        {/* ── PAGINATOR ── */}
        <div className="ncd-paginator">
          {/* Page label zone */}
          <div className="ncd-page-label-zone">
            <span className="ncd-page-label-ornament">◆</span>
            <span
              className="ncd-page-label"
              style={{
                opacity: labelVisible ? 0.8 : 0,
                transform: labelVisible ? 'translateY(0)' : 'translateY(2px)',
              }}
            >
              {labelText}
            </span>
            <span className="ncd-page-label-ornament">◆</span>
          </div>

          {/* Page row: prev rail + pages + next rail */}
          <div className="ncd-page-row">
            <button
              className="ncd-nav-side ncd-nav-prev"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              aria-label="Previous page"
              type="button"
            >
              <span className="ncd-chevron">
                <svg viewBox="0 0 20 20"><polyline points="13,4 6,10 13,16" /></svg>
              </span>
            </button>

            <div className="ncd-page-window">
              <div
                className="ncd-page-track"
                style={{ transform: `translateX(-${currentPage * 100}%)` }}
              >
                {pages.map((page) => (
                  <div key={page.key} className="ncd-page">
                    {PAGE_RENDERERS[page.key]?.()}
                  </div>
                ))}
              </div>
            </div>

            <button
              className="ncd-nav-side ncd-nav-next"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === pages.length - 1}
              aria-label="Next page"
              type="button"
            >
              <span className="ncd-chevron">
                <svg viewBox="0 0 20 20"><polyline points="7,4 14,10 7,16" /></svg>
              </span>
            </button>
          </div>

          {/* Nav footer dots */}
          <div className="ncd-nav-footer">
            <div className="ncd-nav-dots">
              {pages.map((page, i) => (
                <button
                  key={page.key}
                  className={`ncd-nav-dot${i === currentPage ? ' ncd-active' : ''}`}
                  onClick={() => goToPage(i)}
                  aria-label={`Go to ${page.label}`}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
