import { Button } from "@/components/ui/button"
import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
export default function CtaSection() {
  const ctaRef = useRef(null)
  const navigate = useNavigate();

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

    if (ctaRef.current) observer.observe(ctaRef.current)

    return () => observer.disconnect()
  }, [])

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div
          ref={ctaRef}
          className="max-w-3xl mx-auto text-center space-y-8 opacity-0 translate-y-8 transition-all duration-1000"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Join thousands of citizens and administrators using our platform for secure, transparent document
            verification.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 text-base hover:scale-105 transition-transform duration-200"
              onClick={() => navigate("/signup")}
            >
              Create Account
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base bg-transparent hover:scale-105 transition-transform duration-200"
              onClick={() => navigate("/contact")}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
