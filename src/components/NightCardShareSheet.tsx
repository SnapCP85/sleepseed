import { useState, useCallback } from 'react';
import { generatePremiumCard916, downloadBlob } from '../lib/shareUtils';

// ─────────────────────────────────────────────────────────────────────────────
// NightCardShareSheet — Bottom sheet for saving + sharing Night Cards
// ─────────────────────────────────────────────────────────────────────────────
// "Tonight's memory is ready."
// Primary: Save to Camera Roll (download 9:16 PNG)
// Secondary: Share (native share or clipboard)
// Tertiary: View in Library
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
@keyframes ncss-slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes ncss-fadeIn{from{opacity:0}to{opacity:1}}
@keyframes ncss-pulse{0%,100%{opacity:.5}50%{opacity:1}}
.ncss-overlay{position:fixed;inset:0;background:rgba(6,9,18,.85);z-index:500;animation:ncss-fadeIn .2s ease both;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.ncss-sheet{position:fixed;bottom:0;left:0;right:0;z-index:501;background:linear-gradient(180deg,#141830 0%,#0d1224 100%);border-radius:24px 24px 0 0;padding:28px 24px max(28px,env(safe-area-inset-bottom));animation:ncss-slideUp .35s cubic-bezier(.22,1,.36,1) both;max-width:500px;margin:0 auto}
.ncss-handle{width:36px;height:4px;border-radius:2px;background:rgba(244,239,232,.12);margin:0 auto 20px}
.ncss-title{font-family:'Fraunces',Georgia,serif;font-size:20px;font-weight:300;font-style:italic;color:#F4EFE8;text-align:center;margin-bottom:4px}
.ncss-sub{font-family:'DM Mono',monospace;font-size:10px;color:rgba(244,239,232,.25);text-align:center;letter-spacing:.5px;margin-bottom:24px}
.ncss-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;border:none;border-radius:16px;cursor:pointer;font-family:'Nunito',system-ui,sans-serif;font-weight:700;transition:all .15s;position:relative;overflow:hidden}
.ncss-btn:active{transform:scale(.98)}
.ncss-primary{padding:18px 24px;background:linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010);color:#120800;font-size:16px;margin-bottom:10px;min-height:56px}
.ncss-primary:hover{filter:brightness(1.08)}
.ncss-secondary{padding:14px 24px;background:rgba(244,239,232,.06);border:1px solid rgba(244,239,232,.1);color:rgba(244,239,232,.65);font-size:14px;margin-bottom:8px;min-height:52px}
.ncss-secondary:hover{background:rgba(244,239,232,.1);border-color:rgba(244,239,232,.18)}
.ncss-tertiary{padding:12px 24px;background:transparent;color:rgba(244,239,232,.3);font-size:13px;font-weight:600;min-height:48px}
.ncss-tertiary:hover{color:rgba(244,239,232,.5)}
.ncss-error{text-align:center;padding:10px 16px;background:rgba(255,80,80,.08);border:1px solid rgba(255,80,80,.15);border-radius:12px;color:rgba(255,140,130,.7);font-size:12px;font-family:'Nunito',sans-serif;margin-bottom:10px}
.ncss-success{text-align:center;color:rgba(20,216,144,.7);font-size:12px;font-family:'DM Mono',monospace;margin-bottom:10px}
.ncss-shimmer{position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.15) 50%,transparent 100%);background-size:200% 100%;animation:ncss-shimmerAnim 3s ease-in-out infinite;pointer-events:none}
@keyframes ncss-shimmerAnim{0%{background-position:200% 0}100%{background-position:-200% 0}}
`;

interface Props {
  card: {
    childName: string;
    dreamKeeperName: string;
    dreamKeeperEmoji: string;
    dreamKeeperColor: string;
    nightNumber?: number;
    date: string;
    storyLine: string;
    quote?: string;
    isOrigin?: boolean;
    storyTitle?: string;
    heroName?: string;
  };
  shareUrl?: string;
  onClose: () => void;
  onViewLibrary?: () => void;
}

export default function NightCardShareSheet({ card, shareUrl, onClose, onViewLibrary }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');

  const generateImage = useCallback(async () => {
    return generatePremiumCard916({
      childName: card.childName,
      dreamKeeperName: card.dreamKeeperName,
      dreamKeeperEmoji: card.dreamKeeperEmoji,
      dreamKeeperColor: card.dreamKeeperColor,
      nightNumber: card.nightNumber,
      date: card.date,
      storyLine: card.storyLine,
      quote: card.quote,
      isOrigin: card.isOrigin,
    });
  }, [card]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError('');
    try {
      const blob = await generateImage();
      if (!blob) throw new Error('Failed to generate image');
      const name = card.dreamKeeperName?.toLowerCase().replace(/\s+/g, '-') || 'dreamkeeper';
      const filename = `sleepseed-night-${card.nightNumber || 1}-${name}.png`;
      downloadBlob(blob, filename);
      setSaved(true);
    } catch (e) {
      console.error('[ShareSheet] Save failed:', e);
      setError('Could not save image. Tap to try again.');
    }
    setSaving(false);
  }, [generateImage, card]);

  const handleShare = useCallback(async () => {
    setSharing(true);
    setError('');
    try {
      const blob = await generateImage();
      if (blob && navigator.share) {
        const file = new File([blob], `sleepseed-night-${card.nightNumber || 1}.png`, { type: 'image/png' });
        const shareData: ShareData = {
          title: `${card.childName}'s Night Card`,
          text: `Night ${card.nightNumber || ''} with ${card.dreamKeeperName} 🌙`,
        };
        // Try sharing with image file first
        if (navigator.canShare?.({ ...shareData, files: [file] })) {
          await navigator.share({ ...shareData, files: [file] });
        } else if (shareUrl) {
          await navigator.share({ ...shareData, url: shareUrl });
        } else {
          await navigator.share(shareData);
        }
      } else if (shareUrl) {
        // Fallback: copy link
        await navigator.clipboard.writeText(shareUrl);
        setSaved(true); // reuse success state for "copied" feedback
      } else {
        // Last resort: copy text
        const text = `"${card.storyLine}"\nNight ${card.nightNumber || ''} with ${card.dreamKeeperName} 🌙`;
        await navigator.clipboard.writeText(text);
        setSaved(true);
      }
    } catch (e: any) {
      // User cancelled share — not an error
      if (e?.name !== 'AbortError') {
        console.error('[ShareSheet] Share failed:', e);
        setError('Could not share. Try saving the image instead.');
      }
    }
    setSharing(false);
  }, [generateImage, card, shareUrl]);

  return (
    <>
      <style>{CSS}</style>
      <div className="ncss-overlay" onClick={onClose} />
      <div className="ncss-sheet">
        <div className="ncss-handle" />

        <div className="ncss-title">Tonight{'\u2019'}s memory is ready.</div>
        <div className="ncss-sub">
          {card.dreamKeeperEmoji} {card.dreamKeeperName} {'\u00B7'} Night {card.nightNumber || 1}
        </div>

        {error && (
          <div className="ncss-error" onClick={() => setError('')}>
            {error}
          </div>
        )}

        {saved && !error && (
          <div className="ncss-success">{'\u2713'} Saved</div>
        )}

        {/* PRIMARY: Save to Camera Roll */}
        <button className="ncss-btn ncss-primary" onClick={handleSave} disabled={saving}>
          <div className="ncss-shimmer" />
          <span style={{ position: 'relative', zIndex: 1 }}>
            {saving ? 'Saving...' : saved ? 'Save again' : 'Save to Camera Roll'}
          </span>
        </button>

        {/* SECONDARY: Share */}
        <button className="ncss-btn ncss-secondary" onClick={handleShare} disabled={sharing}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          {sharing ? 'Sharing...' : 'Share'}
        </button>

        {/* TERTIARY: View in Library */}
        {onViewLibrary && (
          <button className="ncss-btn ncss-tertiary" onClick={onViewLibrary}>
            View in Library
          </button>
        )}
      </div>
    </>
  );
}
