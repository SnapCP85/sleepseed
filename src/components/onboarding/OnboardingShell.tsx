import type { ReactNode } from 'react';
import './onboarding.css';

/** Wraps onboarding content in a mobile-first container.
 *  On desktop: centered phone frame (430×932 max).
 *  On mobile: fills viewport. */
export default function OnboardingShell({ children }: { children: ReactNode }) {
  return (
    <div className="ob-container">
      <div className="ob-phone">
        {children}
      </div>
    </div>
  );
}
