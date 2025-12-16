import Header from "../components/Header";
import Footer from "../components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-20 md:py-28 animate-[fade-in-up_0.5s_ease-out]">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl space-y-10">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-lg">
            These Terms of Service govern your use of the DocVerify platform,
            including citizen and administrator dashboards, APIs and any related
            services.
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              1. Using DocVerify
            </h2>
            <p className="text-muted-foreground">
              You agree to use DocVerify only for lawful document verification
              related to government or institutional services. You are
              responsible for maintaining the confidentiality of your login
              credentials.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              2. Your responsibilities
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide accurate and up‑to‑date information when creating an account.</li>
              <li>Upload only documents that you are legally allowed to submit.</li>
              <li>Immediately notify support if you suspect unauthorised access.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              3. Platform availability
            </h2>
            <p className="text-muted-foreground">
              We strive to keep DocVerify available 24/7, but occasional
              maintenance or outages may occur. We are not liable for delays in
              verification caused by third‑party infrastructure or network
              issues.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              4. Limitation of liability
            </h2>
            <p className="text-muted-foreground">
              DocVerify provides a technical platform for document verification.
              Final decisions on approvals or rejections are made by the
              relevant authority, and DocVerify is not responsible for those
              decisions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              5. Changes to these terms
            </h2>
            <p className="text-muted-foreground">
              We may update these Terms from time to time. When we do, we will
              update the date at the bottom of this page and, where appropriate,
              notify you via the platform.
            </p>
          </section>

          <section className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}


