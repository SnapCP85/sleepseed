import '../../components/onboarding/onboarding.css';
import HomepageNav from './HomepageNav';
import HeroSection from './HeroSection';
import CinematicSequence from './CinematicSequence';
import TruthSection from './TruthSection';
import ThreeNightArc from './ThreeNightArc';
import NightCardSection from './NightCardSection';
import FinalCTA from './FinalCTA';

interface Props {
  onCreateStory: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onNightCards: () => void;
  onLibrary: () => void;
}

export default function PublicHomepage({ onSignIn, onSignUp }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#060912',
      color: '#F4EFE8',
      overflowX: 'hidden',
    }}>
      <HomepageNav onSignIn={onSignIn} onSignUp={onSignUp} />
      <HeroSection onSignUp={onSignUp} />
      <CinematicSequence />
      <TruthSection />
      <ThreeNightArc />
      <NightCardSection />
      <FinalCTA onSignUp={onSignUp} />
    </div>
  );
}
