import { useEffect, useRef, useState } from 'react';

interface Props {
  onCreateStory: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onNightCards: () => void;
  onLibrary: () => void;
}

/**
 * Live homepage — renders homepage-preview.html in a full-page iframe.
 * The parent app's nav is hidden; the iframe's own nav handles sign-in/sign-up
 * via postMessage communication.
 */
export default function HomepageLive({ onSignIn, onSignUp }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Listen for postMessage from the iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data === 'sleepseed:signin') onSignIn();
      if (e.data === 'sleepseed:signup') onSignUp();
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onSignIn, onSignUp]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#060912' }}>
      <iframe
        ref={iframeRef}
        src="/homepage-preview.html"
        onLoad={() => setLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity .3s',
        }}
        title="SleepSeed"
      />
    </div>
  );
}
