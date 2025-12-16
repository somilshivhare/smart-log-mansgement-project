import Header from "../components/Header";
import Footer from "../components/Footer";

export default function DocumentationPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-20 md:py-28 animate-[fade-in-up_0.5s_ease-out]">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl space-y-10">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Documentation
          </h1>
          <p className="text-muted-foreground text-lg">
            This guide walks you through the main flows in DocVerify for both
            citizens and administrators.
          </p>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">
              For citizens
            </h2>
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
              <li>Create an account using your name and government email.</li>
              <li>Log in and open the dashboard to start a new verification.</li>
              <li>
                Upload required documents (ID, address proof, income proof, etc.)
                and confirm your details.
              </li>
              <li>
                Track the status of each request from the dashboard and receive
                notifications when a document is approved or rejected.
              </li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">
              For administrators
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Use the Verification Queue to see new and pending cases, sorted
                by urgency.
              </li>
              <li>
                Open a case to view uploaded documents, AI flags and previous
                activity.
              </li>
              <li>
                Approve or reject submissions with a clear reason so citizens
                understand next steps.
              </li>
              <li>
                Review Logs &amp; Audit to see who performed each action for
                compliance reporting.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">
              Integrations and APIs
            </h2>
            <p className="text-muted-foreground">
              DocVerify can be integrated with existing government portals via
              APIs to initiate verifications, retrieve statuses and export
              results into downstream systems.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

