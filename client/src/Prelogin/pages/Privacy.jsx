import Header from "../components/Header";
import Footer from "../components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-20 md:py-28 animate-[fade-in-up_0.5s_ease-out]">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl space-y-10">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-lg">
            At DocVerify, we take the protection of your personal information
            seriously. This Privacy Policy explains how we collect, use, store
            and protect data when citizens and administrators use our digital
            document verification platform.
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              1. Information we collect
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Account data:</span> name, email address and optional contact details when you create an account.
              </li>
              <li>
                <span className="font-medium text-foreground">Document data:</span> copies of IDs and supporting documents you upload for verification.
              </li>
              <li>
                <span className="font-medium text-foreground">Usage data:</span> log‑in history, actions taken (such as submitting, viewing or approving a document) and technical information like browser type.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              2. How we use your information
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>To verify and process your documents on behalf of participating authorities.</li>
              <li>To provide a secure dashboard for citizens and administrators.</li>
              <li>To detect fraud and protect the integrity of government services.</li>
              <li>To improve our platform based on aggregated, anonymised analytics.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              3. How we protect your data
            </h2>
            <p className="text-muted-foreground">
              We use industry‑standard encryption in transit and at rest, strict access
              controls for administrators, and detailed audit logs for every verification
              action performed on DocVerify.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              4. Your rights
            </h2>
            <p className="text-muted-foreground">
              You can request access to, correction of, or deletion of your account data at
              any time, subject to legal retention requirements for government records.
              To exercise these rights, contact us through the Contact Us page.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              5. Contact
            </h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy or how we handle your data,
              please reach out to our support team via{" "}
              <span className="font-medium text-foreground">
                support@docverify.gov
              </span>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}


