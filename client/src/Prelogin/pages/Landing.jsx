import CtaSection from "../components/CtaSection";
import Footer from "../components/Footer";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import HowItWorksSection from "../components/HowItWorks";
import KeyFeaturesSection from "../components/KeyFeatures";
import { FeaturesSectionDemo } from "../components/Bentogrid";
import TrustSecuritySection from "../components/TrustSecurity";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useState, useEffect } from "react";

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Simulate loading time

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-transparent via-white/50 dark:via-black/10 to-transparent">
      <Header />
      <main className="relative overflow-hidden">
        {/* page-level decorative blobs */}
        <div
          className="absolute -left-24 top-8 w-64 h-64 rounded-full bg-gradient-to-r from-primary/30 to-accent/30 opacity-60 blur-3xl animate-blob"
          aria-hidden="true"
        />
        <div
          className="absolute right-8 -bottom-20 w-72 h-72 rounded-full bg-gradient-to-r from-accent/20 to-primary/20 opacity-60 blur-2xl animate-blob animation-delay-2000"
          aria-hidden="true"
        />

        <HeroSection />
        <HowItWorksSection />
        <FeaturesSectionDemo />
        <TrustSecuritySection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
