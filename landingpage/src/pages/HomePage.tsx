import HeroSection from "../components/HeroSection";
import FeatureGrid from "../components/FeatureGrid";
import NewsSection from "../components/NewsSection";
import CtaBand from "../components/CtaBand";

const HomePage = () => (
  <div className="space-y-24 md:space-y-32 pb-8">
    <HeroSection />
    <FeatureGrid />
    <NewsSection />
    <CtaBand />
  </div>
);

export default HomePage;
