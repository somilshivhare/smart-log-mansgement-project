import Header from "../components/Header";
import Footer from "../components/Footer";

export default function HelpCenterPage() {
  const faqs = [
    {
      q: "How long does verification take?",
      a: "Most verifications are processed within 24–72 hours, depending on the agency workload and complexity of the documents.",
    },
    {
      q: "Which file types do you support?",
      a: "You can upload common formats such as PDF, JPG and PNG. For best results, ensure the document is clearly readable.",
    },
    {
      q: "Can I track my request?",
      a: "Yes. Log into your citizen dashboard to see the real‑time status of every document you have submitted.",
    },
    {
      q: "Who can see my documents?",
      a: "Only authorised officers from the relevant authority can view your documents. Every access is logged for auditing.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-20 md:py-28 animate-[fade-in-up_0.5s_ease-out]">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl space-y-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Help Center
            </h1>
            <p className="text-muted-foreground text-lg">
              Browse common questions about document submission, verification
              timelines, and managing your DocVerify account.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="border border-border rounded-lg p-5 bg-card"
              >
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  {item.q}
                </h2>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

