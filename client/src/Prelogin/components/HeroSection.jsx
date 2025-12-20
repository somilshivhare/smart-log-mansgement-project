import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BlurText from "./BlurText";
import { MacbookScroll } from "./MacBookScroll";
export default function HeroSection() {
  const handleAnimationComplete = () => {
    console.log("Animation completed!");
  };

  return (
    <section id="home" className="py-0 overflow-hidden relative">
      <div className="absolute inset-x-0 -top-2 h-24" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute inset-x-0 top-6 z-30 flex flex-col items-center gap-4"
      >
        <BlurText
          text={
            "Secure, AI-powered document verification for governments and citizens."
          }
          delay={150}
          animateBy="words"
          direction="top"
          onAnimationComplete={handleAnimationComplete}
          className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground text-center leading-tight"
        />

        <div className="flex gap-3 items-center">
          <Button
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 text-base hover:scale-105 transition-transform duration-200"
            onClick={() => (window.location.href = "/signup")}
          >
            Get Started
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-base bg-transparent hover:scale-105 transition-transform duration-200"
            onClick={() => (window.location.href = "/how-it-works")}
          >
            How it works
          </Button>
        </div>
      </motion.div>
      <MacbookScroll
        src="/images/heroBackground.png"
        showGradient={false}
        title={false}
      />
    </section>
  );
}
