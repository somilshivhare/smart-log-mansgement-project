import Header from "../components/Header"
import Footer from "../components/Footer" 
export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-20 md:py-28 animate-[fade-in-up_0.5s_ease-out]">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8 text-balance">About DocVerify</h1>

          <div className="space-y-8 text-muted-foreground">
            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Our Mission</h2>
              <p className="text-lg leading-relaxed">
                DocVerify is committed to revolutionizing document verification for government services through
                cutting-edge technology and transparent processes. We believe that every citizen deserves fast, secure,
                and reliable document verification.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">What We Do</h2>
              <p className="text-lg leading-relaxed">
                We provide an AI-powered platform that streamlines the document verification process for government
                agencies and citizens. Our system combines automated pre-verification with human oversight to ensure
                accuracy and compliance while reducing processing times from weeks to hours.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Our Values</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-border rounded-lg p-6 bg-card">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Security First</h3>
                  <p className="leading-relaxed">
                    We employ bank-level encryption and multi-factor authentication to protect sensitive documents.
                  </p>
                </div>
                <div className="border border-border rounded-lg p-6 bg-card">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Transparency</h3>
                  <p className="leading-relaxed">
                    Real-time tracking and comprehensive audit logs provide full visibility into the verification
                    process.
                  </p>
                </div>
                <div className="border border-border rounded-lg p-6 bg-card">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Efficiency</h3>
                  <p className="leading-relaxed">
                    AI-powered automation reduces processing times while maintaining the highest standards of accuracy.
                  </p>
                </div>
                <div className="border border-border rounded-lg p-6 bg-card">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Accessibility</h3>
                  <p className="leading-relaxed">
                    Our platform is designed to be user-friendly for both citizens and administrators.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Our Impact</h2>
              <div className="grid md:grid-cols-3 gap-6 mt-6">
                <div className="text-center p-6 border border-border rounded-lg bg-card">
                  <div className="text-4xl font-bold text-accent mb-2">95%</div>
                  <div className="text-sm">Faster Processing</div>
                </div>
                <div className="text-center p-6 border border-border rounded-lg bg-card">
                  <div className="text-4xl font-bold text-accent mb-2">10M+</div>
                  <div className="text-sm">Documents Verified</div>
                </div>
                <div className="text-center p-6 border border-border rounded-lg bg-card">
                  <div className="text-4xl font-bold text-accent mb-2">99.9%</div>
                  <div className="text-sm">Accuracy Rate</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
