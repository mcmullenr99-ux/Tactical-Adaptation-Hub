import { MainLayout } from "@/components/layout/MainLayout";
import { useSEO } from "@/hooks/useSEO";
import { FileText } from "lucide-react";

export default function TermsOfService() {
  useSEO({ title: "Terms of Service", description: "TAG Terms of Service — rules and standards for community membership." });

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-8">
      <h2 className="font-display font-bold text-xl uppercase tracking-widest text-primary mb-3">{title}</h2>
      <div className="text-muted-foreground space-y-3">{children}</div>
    </section>
  );

  return (
    <MainLayout>
      <div className="pt-28 pb-20 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-primary/20 border border-primary/40 rounded flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl uppercase tracking-widest">Terms of Service</h1>
              <p className="text-muted-foreground text-sm">Last updated: March 2026</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 sm:p-8 space-y-8">

            <Section title="Acceptance">
              <p>By registering an account or using this website, you agree to these Terms. If you don't agree, don't register.</p>
            </Section>

            <Section title="Who Can Join">
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>You must be 16 years of age or older</li>
                <li>You must be a genuine tactical gaming enthusiast</li>
                <li>One account per person — duplicate accounts will be removed</li>
              </ul>
            </Section>

            <Section title="Community Standards">
              <p>TAG is a mature, drama-free community. The following will result in immediate permanent ban:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Harassment, hate speech, or targeted abuse of any member</li>
                <li>Sharing or soliciting illegal content</li>
                <li>Attempting to gain unauthorised access to accounts or systems</li>
                <li>Deliberately disrupting or degrading the community or its systems</li>
                <li>Impersonating TAG staff or other members</li>
                <li>Spamming, raiding, or coordinated disruptive behaviour</li>
              </ul>
            </Section>

            <Section title="Your Account">
              <p>You are responsible for keeping your password secure. Do not share your credentials. If you suspect your account has been compromised, contact staff immediately via Discord.</p>
              <p>We reserve the right to suspend or terminate any account that violates these Terms, without notice.</p>
            </Section>

            <Section title="Unauthorised Access — Computer Misuse Act 1990">
              <p>Any attempt to gain unauthorised access to TAG systems, accounts, or data is a criminal offence under the <strong>Computer Misuse Act 1990 (UK)</strong>. We actively log all access with IP addresses and will cooperate fully with law enforcement. Evidence packages will be submitted to Action Fraud and/or local police without hesitation.</p>
            </Section>

            <Section title="Content You Post">
              <p>By posting messages, profile information, or MilSim group content, you grant TAG a non-exclusive licence to display that content within the platform. You retain ownership.</p>
              <p>Do not post personal information about other people without their consent.</p>
            </Section>

            <Section title="Donations">
              <p>Donations via Ko-fi are voluntary and non-refundable. They go directly toward server costs. No goods or services are provided in exchange for donations, and donations do not confer any special rights or privileges.</p>
            </Section>

            <Section title="Moderation and Bans">
              <p>TAG staff and moderators may remove content, suspend, or ban accounts at their discretion in order to maintain community standards. Moderation decisions are final. You may appeal by contacting a senior admin on Discord.</p>
            </Section>

            <Section title="Limitation of Liability">
              <p>TAG is a volunteer-run community. The site is provided as-is. We make no guarantees of uptime or data preservation. To the extent permitted by law, TAG accepts no liability for any loss arising from use of this platform.</p>
            </Section>

            <Section title="Changes">
              <p>We may update these Terms at any time. Continued use of the site after changes constitutes acceptance of the updated Terms.</p>
            </Section>

            <Section title="Governing Law">
              <p>These Terms are governed by the laws of England and Wales.</p>
            </Section>

            <Section title="Contact">
              <p>Discord: <a href="https://discord.gg/matmFhU4yg" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">discord.gg/matmFhU4yg</a></p>
            </Section>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
