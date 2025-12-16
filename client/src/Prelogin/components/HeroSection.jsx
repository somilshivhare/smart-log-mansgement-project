import { Button } from "@/components/ui/button"
import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"

export default function HeroSection() {
  const heroRef = useRef(null)
  const cardRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in")
          }
        })
      },
      { threshold: 0.1 },
    )

    if (heroRef.current) observer.observe(heroRef.current)
    if (cardRef.current) observer.observe(cardRef.current)

    return () => observer.disconnect()
  }, [])

  return (
    <section id="home" className="py-20 md:py-28 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div ref={heroRef} className="space-y-6 opacity-0 translate-y-8 transition-all duration-1000">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-balance leading-tight">
              Secure Document Verification for Digital Governance
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-pretty max-w-2xl">
              Streamline document verification with AI-powered analysis, real-time tracking, and transparent audit logs
              for citizens and administrators.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 text-base hover:scale-105 transition-transform duration-200"
                onClick={() => navigate("/signup")}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base bg-transparent hover:scale-105 transition-transform duration-200"
                onClick={() => navigate("/how-it-works")}
              >
                Learn More
              </Button>
            </div>
          </div>

          <div ref={cardRef} className="relative opacity-0 translate-x-8 transition-all duration-1000 delay-300">
            <div className="rounded-lg border border-border bg-card p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded bg-accent/10 flex items-center justify-center animate-pulse">
                    <svg className="h-6 w-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Verification Status</div>
                    <div className="text-lg font-semibold text-foreground">Approved</div>
                  </div>
                </div>
                <div className="h-px bg-border" />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Document ID</span>
                    <span className="font-medium text-foreground">DOC-2025-001</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Submitted</span>
                    <span className="font-medium text-foreground">Jan 15, 2025</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Verified by</span>
                    <span className="font-medium text-foreground">Admin Team</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
