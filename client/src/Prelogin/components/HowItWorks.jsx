import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import ScrollStack, { ScrollStackItem } from "@/components/ScrollStack";
export default function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const stepsRef = useRef([]);

  const steps = [
    {
      number: "01",
      title: "Upload Documents Securely",
      description:
        "Citizens upload their documents through our encrypted platform with multi-factor authentication.",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      ),
    },
    {
      number: "02",
      title: "Automated Pre-Verification",
      description:
        "AI-powered analysis checks document authenticity, completeness, and compliance automatically.",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
    },
    {
      number: "03",
      title: "Admin Review & Approval",
      description:
        "Trained administrators review flagged documents and make final verification decisions.",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      number: "04",
      title: "Track Status & Activity",
      description:
        "Real-time tracking and comprehensive audit logs provide full transparency throughout the process.",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            A simple, transparent process designed for efficiency and security
          </p>
        </motion.div>

        {/* ScrollStack: convert steps into stacked scroll cards */}
        <div className="">
          <ScrollStack
            useWindowScroll={true}
            itemDistance={140}
            itemScale={0.04}
            itemStackDistance={36}
            stackPosition="30%"
            scaleEndPosition="16%"
            baseScale={0.9}
            blurAmount={1}
            className="pt-8 pb-24"
          >
            {steps.map((step, index) => (
              <ScrollStackItem
                key={index}
                itemClassName="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary/10 to-accent/10 flex items-center justify-center text-primary transition-transform duration-300">
                    {step.icon}
                  </div>
                  <div className="text-xs font-bold text-muted-foreground tracking-wider">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground text-pretty">
                    {step.description}
                  </p>
                </div>
              </ScrollStackItem>
            ))}
          </ScrollStack>
        </div>
      </div>
    </section>
  );
}
