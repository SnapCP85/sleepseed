import { useEffect, useRef } from 'react';

interface Props {
  onCreateStory: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onNightCards: () => void;
  onLibrary: () => void;
}

/**
 * Live homepage — renders the static homepage-preview.html in an iframe
 * and intercepts CTA / sign-in clicks to trigger real auth flows.
 */
export default function HomepageLive({ onSignIn, onSignUp }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const onLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      // Auto-resize iframe to content height
      const resize = () => {
        const h = doc.documentElement.scrollHeight;
        if (h > 0) iframe.style.height = h + 'px';
      };
      resize();
      // Re-check after animations/images load
      setTimeout(resize, 500);
      setTimeout(resize, 2000);

      // Wire up all sign-in buttons
      doc.querySelectorAll('.btn-signin').forEach(btn => {
        (btn as HTMLElement).onclick = (e) => { e.preventDefault(); onSignIn(); };
      });

      // Wire up all CTA / sign-up buttons
      doc.querySelectorAll('.btn-start, .hero-cta, .final-cta, .mid-cta .hero-cta').forEach(btn => {
        (btn as HTMLElement).onclick = (e) => { e.preventDefault(); onSignUp(); };
      });
    };

    iframe.addEventListener('load', onLoad);
    return () => iframe.removeEventListener('load', onLoad);
  }, [onSignIn, onSignUp]);

  return (
    <iframe
      ref={iframeRef}
      src="/homepage-preview.html"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        display: 'block',
      }}
      title="SleepSeed"
    />
  );
}
