import { Link, useNavigate } from "react-router";
import { useEffect } from "react";
import { ArrowLeft, Mail, Shield } from "lucide-react";

const LAST_UPDATED = "June 10, 2026";

export function PrivacyPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Privacy Policy — Pasona";
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
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Privacy Policy</h2>
        </div>

        <section className="bg-white p-8 rounded-2xl card-shadow border border-slate-50 space-y-6 text-sm text-slate-600 leading-relaxed">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">Your privacy matters</h1>
              <p className="text-xs text-slate-400 mt-1">Last updated: {LAST_UPDATED}</p>
            </div>
          </div>

          <Section title="Introduction">
            Pasona ("we", "our", "us") provides a personal finance tracking application. This
            Privacy Policy explains how we collect, use, and protect your information when you use
            our service.
          </Section>

          <Section title="Information We Collect">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <span className="font-bold text-slate-700">Account information:</span> your name and
                email address when you register, or the name, email, and avatar URL associated
                with your Google account if you sign in with Google.
              </li>
              <li>
                <span className="font-bold text-slate-700">Profile preferences:</span> your
                optional notification settings, including the daily transaction reminder time
                (e.g. 21:10) and the timestamp of the last reminder we sent you.
              </li>
              <li>
                <span className="font-bold text-slate-700">Financial data:</span> the transactions,
                accounts, and categories you create inside the app.
              </li>
              <li>
                <span className="font-bold text-slate-700">Authentication tokens:</span> an access
                token issued by our backend after sign-in, used to authenticate your requests.
              </li>
            </ul>
          </Section>

          <Section title="How We Use Your Information">
            We use the information we collect to:
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Authenticate you and keep your account secure.</li>
              <li>Store and display the financial data you enter.</li>
              <li>Send you the emails required to operate your account — a welcome message on
                  sign-up, an email-address verification link, and password-reset links when you
                  request them.
              </li>
              <li>Send the optional daily transaction reminder you configured in your settings.</li>
              <li>Operate, maintain, and improve the service.</li>
            </ul>
          </Section>

          <Section title="Email Communications">
            We send two kinds of email. You can tell them apart at a glance:
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <span className="font-bold text-slate-700">Transactional emails</span> — welcome,
                email verification, and password reset. These are required to use the service and
                cannot be turned off while you have an account, but we will never send a
                transactional email you didn't trigger.
              </li>
              <li>
                <span className="font-bold text-slate-700">Reminder emails</span> — a single
                optional daily nudge at the time you picked (default 21:10) to log the day's
                transactions. You can change the time or turn reminders off entirely at any time
                from your <span className="font-bold text-slate-700">Notification settings</span>.
                We also skip the nudge automatically on any day you already logged a transaction,
                and we never email more than once per day.
              </li>
            </ul>
            <p className="mt-2">
              We use <span className="font-bold text-slate-700">Resend</span> (resend.com) to
              deliver all outbound email on our behalf. Resend receives your email address and the
              message contents for the sole purpose of delivery. Their privacy practices apply to
              that data — see{" "}
              <a
                href="https://resend.com/legal/privacy-policy"
                target="_blank"
                rel="noreferrer noopener"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                resend.com/legal/privacy-policy
              </a>
              .
            </p>
          </Section>

          <Section title="Data Sharing">
            We do not sell your data. We only share it with the third parties necessary to operate
            the service:
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <span className="font-bold text-slate-700">Google:</span> if you sign in with
                Google, we receive your basic profile (name, email, avatar) from Google OAuth.
                Google's own privacy practices apply to that data.
              </li>
              <li>
                <span className="font-bold text-slate-700">Supabase (Postgres):</span> our
                database host, which stores all account and financial data on our behalf under
                confidentiality obligations.
              </li>
              <li>
                <span className="font-bold text-slate-700">Resend:</span> our transactional and
                reminder email provider, as described in the "Email Communications" section above.
              </li>
            </ul>
          </Section>

          <Section title="Data Security">
            We protect your data using industry-standard measures including encrypted transport
            (HTTPS) and secure password storage. No method of transmission or storage is 100%
            secure, but we work hard to safeguard your information.
          </Section>

          <Section title="Your Rights">
            You can view, correct, or delete your account and associated data at any time.
            <p className="mt-2">
              To delete your account and all associated data, go to
              <span className="font-bold text-slate-700"> Settings &rarr; Delete Account</span>.
              The action is final and cannot be undone — your profile, accounts, categories, and
              transactions are removed immediately. To view or correct your data, or if you
              encounter any issues, contact us using the details below.
            </p>
            <p className="mt-2">
              You can also control your email experience directly from the app: change or disable
              your daily transaction reminder from
              <span className="font-bold text-slate-700"> Settings &rarr; Notifications</span>.
            </p>
          </Section>

          <Section title="Data Retention">
            We keep your account and financial data for as long as your account is active. When you
            delete your account from Settings, your profile, accounts, categories, and transactions
            are removed immediately (soft-deleted, with permanent erasure within 30 days).
            Aggregated, non-identifying analytics (e.g. total registered users) may be retained
            after deletion.
          </Section>

          <Section title="Changes to This Policy">
            We may update this policy from time to time. We will revise the "Last updated" date
            above when we do. Material changes will be communicated through the app.
          </Section>

          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-black text-slate-900 mb-2">Contact us</h2>
            <a
              href="mailto:pasona@adebayosystems.com.ng"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              <Mail size={16} />
              pasona@adebayosystems.com.ng
            </a>
          </div>
        </section>

        <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest">
          <Link to="/login" className="hover:text-slate-600">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-black text-slate-900">{title}</h2>
      <div>{children}</div>
    </div>
  );
}
