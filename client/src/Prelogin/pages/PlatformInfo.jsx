import Header from "../components/Header";
import Footer from "../components/Footer";

export default function PlatformInfoPage({ title }) {
  const lower = title.toLowerCase();

  const sections =
    lower === "how it works"
      ? [
          {
            heading: "Step 1: Secure upload",
            body: "Citizens upload scans or photos of their documents through the DocVerify dashboard. Files are encrypted in transit and stored in secure, access‑controlled storage.",
          },
          {
            heading: "Step 2: AI pre‑verification",
            body: "Our AI engine extracts key fields, checks for tampering, and compares information against configured rules to flag potential issues before a human ever reviews it.",
          },
          {
            heading: "Step 3: Administrative review",
            body: "Authorized government officers review AI suggestions, inspect the document imagery, and approve or reject the submission with full audit logging.",
          },
        ]
      : lower === "features"
      ? [
          {
            heading: "Unified citizen dashboard",
            body: "Track every document, status update, and notification from one place—no more visiting multiple offices or portals.",
          },
          {
            heading: "Admin verification workspace",
            body: "Admins get queues, filters, and detailed timelines to handle high volumes of verifications without losing control.",
          },
          {
            heading: "Real‑time status and alerts",
            body: "Citizens receive clear status updates, while administrators get alerts for suspicious activity or SLA breaches.",
          },
        ]
      : lower === "security"
      ? [
          {
            heading: "End‑to‑end encryption",
            body: "All traffic uses HTTPS and documents are encrypted at rest. Sensitive fields can be stored separately with additional controls.",
          },
          {
            heading: "Role‑based access control",
            body: "Only authorised officers can view or act on documents. Every access is recorded for compliance and audits.",
          },
          {
            heading: "Comprehensive audit trails",
            body: "Every login, view, decision, and export is logged so agencies can meet strict compliance requirements.",
          },
        ]
      : [
          {
            heading: "Regulatory alignment",
            body: "DocVerify is designed to support government‑grade compliance, including long‑term retention policies and traceability.",
          },
          {
            heading: "Data residency & retention",
            body: "Deployment options allow agencies to keep data within specific regions, with configurable retention periods for records.",
          },
          {
            heading: "Continuous monitoring",
            body: "System health and security signals are continuously monitored so that administrators can respond quickly to incidents.",
          },
        ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-20 md:py-28 animate-[fade-in-up_0.5s_ease-out]">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl space-y-10">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {title}
          </h1>
          <p className="text-muted-foreground text-lg">
            Learn more about how DocVerify supports secure, transparent and
            efficient digital document verification.
          </p>
          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.heading} className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">
                  {section.heading}
                </h2>
                <p className="text-muted-foreground">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


