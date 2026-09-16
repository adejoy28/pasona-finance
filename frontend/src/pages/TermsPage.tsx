import { useNavigate } from "react-router";
import { useEffect } from "react";
import { ArrowLeft, FileText } from "lucide-react";

const LAST_UPDATED = "June 10, 2026";

export function TermsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Terms of Service — Pasona";
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Terms of Service</h2>
        </div>

        <section className="bg-white p-8 rounded-2xl card-shadow border border-slate-50 space-y-6 text-sm text-slate-600 leading-relaxed">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">Pasona Terms of Service</h1>
              <p className="text-xs text-slate-400 mt-1">Last updated: {LAST_UPDATED}</p>
            </div>
          </div>

          <Section title="1. Agreement to Terms">
            By accessing or using Pasona ("the Service"), you agree to be bound by these Terms of
            Service. If you disagree with any part of the terms, you may not access the Service.
          </Section>

          <Section title="2. Your Account">
            You are responsible for safeguarding your credentials and for all activities that occur
            under your account. You agree to notify us immediately of any unauthorized use of your
            account.
          </Section>

          <Section title="3. Acceptable Use">
            You agree to use Pasona solely for personal financial tracking and management in compliance
            with all applicable laws. You may not misuse, disrupt, or attempt to gain unauthorized
            access to any part of the Service.
          </Section>

          <Section title="4. Disclaimer of Financial Advice">
            Pasona is a budgeting and tracking tool. It does not provide certified financial,
            investment, tax, or legal advice. Any financial decisions you make remain solely your
            responsibility.
          </Section>

          <Section title="5. Termination">
            You may delete your account at any time from your Account Settings. We reserve the right to
            suspend or terminate accounts that violate these Terms.
          </Section>

          <Section title="6. Changes to Terms">
            We may update these terms from time to time. Continued use of the Service after changes are
            posted constitutes your acceptance of the new terms.
          </Section>
        </section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="font-bold text-slate-800">{title}</h3>
      <div>{children}</div>
    </div>
  );
}
