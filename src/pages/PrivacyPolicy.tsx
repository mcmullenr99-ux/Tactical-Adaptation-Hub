import { MainLayout } from "@/components/layout/MainLayout";
import { useSEO } from "@/hooks/useSEO";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  useSEO({ title: "Privacy Policy", description: "TAG Privacy Policy — how we handle your data." });

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-8">
      <h2 className="font-display font-bold text-xl uppercase tracking-widest text-primary mb-3">{title}</h2>
      <div className="prose prose-invert max-w-none text-muted-foreground space-y-3">{children}</div>
    </section>
  );

  return (
    <MainLayout>
      <div className="pt-28 pb-20 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-primary/20 border border-primary/40 rounded flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl uppercase tracking-widest">Privacy Policy</h1>
              <p className="text-muted-foreground text-sm">Last updated: March 2026</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 sm:p-8 space-y-8">

            <Section title="Who We Are">
              <p>Tactical Adaptation Group (TAG) is an online gaming community. Our website is located at this domain. Questions can be directed to staff via our Discord server.</p>
            </Section>

            <Section title="Data We Collect">
              <p>When you register an account, we collect:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Your chosen username (callsign)</li>
                <li>Your email address</li>
                <li>A hashed (irreversible) version of your password</li>
                <li>Optional bio text and Discord tag you choose to provide</li>
              </ul>
              <p>When you use the site, we automatically log:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Your IP address and browser type, for security purposes</li>
                <li>Session cookies to keep you logged in</li>
                <li>Actions you take (messages sent, group changes) in our audit log</li>
              </ul>
            </Section>

            <Section title="Why We Collect It (Legal Basis)">
              <p>Under UK GDPR, we process your data under the following bases:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Contract</strong> — to provide the membership portal you signed up for</li>
                <li><strong>Legitimate interests</strong> — security logging, abuse prevention, and community moderation</li>
                <li><strong>Legal obligation</strong> — retaining security logs to support Computer Misuse Act proceedings if required</li>
              </ul>
            </Section>

            <Section title="How We Use Your Data">
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>To operate your account and member portal</li>
                <li>To moderate the community and prevent abuse</li>
                <li>To generate evidence packages for law enforcement in the event of unauthorised access or criminal activity</li>
                <li>We do <strong>not</strong> sell your data. We do not use it for advertising.</li>
              </ul>
            </Section>

            <Section title="Data Retention">
              <p>Account data is retained while your account is active. Audit logs are retained for up to 12 months. You may request deletion at any time (see below).</p>
            </Section>

            <Section title="Your Rights (UK GDPR)">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Access</strong> — request a copy of your data</li>
                <li><strong>Rectification</strong> — correct inaccurate data via your profile</li>
                <li><strong>Erasure</strong> — delete your account from the portal settings (note: security logs may be retained)</li>
                <li><strong>Portability</strong> — contact staff for a data export</li>
                <li><strong>Objection</strong> — contact staff on Discord</li>
              </ul>
              <p>To exercise any right, contact TAG staff on Discord: <a href="https://discord.gg/matmFhU4yg" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">discord.gg/matmFhU4yg</a></p>
            </Section>

            <Section title="Cookies">
              <p>We use one strictly necessary session cookie to keep you logged in. This cookie expires after 7 days. We do not use advertising or tracking cookies.</p>
            </Section>

            <Section title="Security">
              <p>Passwords are hashed using bcrypt and are never stored in plain text. IP addresses and session data are used solely for security and moderation purposes.</p>
            </Section>

            <Section title="Contact">
              <p>For any privacy concerns: Discord — <a href="https://discord.gg/matmFhU4yg" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">discord.gg/matmFhU4yg</a></p>
            </Section>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
