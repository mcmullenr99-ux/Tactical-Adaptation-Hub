import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "wouter";
import { Phone, MessageSquare, ExternalLink, Shield, Users, Heart, Compass } from "lucide-react";

const RESOURCES = [
  {
    name: "Veterans Crisis Line",
    description: "Call, text, or chat 24/7. Real people, no hold music, no judgment.",
    action: "Call 988 — Press 1",
    secondary: "Text 838255",
    href: "https://www.veteranscrisisline.net",
    urgent: true,
    icon: Phone,
  },
  {
    name: "Headstrong",
    description: "Free, confidential mental health care for post-9/11 veterans. No VA required. No paperwork runaround.",
    action: "Get started free",
    href: "https://www.getheadstrong.org",
    urgent: false,
    icon: Heart,
  },
  {
    name: "Give an Hour",
    description: "Free therapy sessions with licensed clinicians who specialize in military and veteran care.",
    action: "Find a provider",
    href: "https://giveanhour.org",
    urgent: false,
    icon: MessageSquare,
  },
  {
    name: "Team Red White & Blue",
    description: "Getting veterans active and connected through physical and social activity. Gets you moving and around people who get it.",
    action: "Find your chapter",
    href: "https://www.teamrwb.org",
    urgent: false,
    icon: Users,
  },
  {
    name: "Mission 22",
    description: "Veteran outreach, mental health programs, and a community built around keeping veterans in the fight.",
    action: "Learn more",
    href: "https://mission22.com",
    urgent: false,
    icon: Compass,
  },
];

export default function Veterans() {
  return (
    <MainLayout>

      {/* Hero */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, hsl(var(--border)) 40px, hsl(var(--border)) 41px),
              repeating-linear-gradient(90deg, transparent, transparent 40px, hsl(var(--border)) 40px, hsl(var(--border)) 41px)`,
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded text-primary font-display font-bold uppercase tracking-widest text-xs mb-8">
              <Shield className="w-3 h-3" /> For Those Who've Served
            </div>

            <h1 className="font-display font-black text-5xl md:text-6xl lg:text-7xl uppercase tracking-tight text-foreground mb-8 leading-none">
              You're Not<br />
              <span className="text-primary">Lost.</span><br />
              You're Between<br />
              <span className="text-muted-foreground">Deployments.</span>
            </h1>

            <div className="space-y-6 text-lg text-muted-foreground font-sans leading-relaxed max-w-2xl">
              <p>
                If you've recently separated and civilian life feels like a foreign operating
                environment — you're not broken. The structure is gone. The mission is gone.
                The people who understood you without explanation are gone.
                That's a real loss, and it hits hard.
              </p>
              <p>
                Nobody told you that the hardest part wasn't the deployment.
                It was coming home.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Real Talk Section */}
      <section className="py-20 bg-secondary/20 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-8">
                We Know What<br />
                <span className="text-primary">It Actually Feels Like</span>
              </h2>

              <div className="space-y-5 font-sans text-muted-foreground leading-relaxed">
                <p>
                  You wake up and there's no formation. No one's counting on you to be somewhere
                  at a specific time doing a specific thing. For most people that sounds like freedom.
                  For you it feels like falling.
                </p>
                <p>
                  Civilians are fine. But they don't understand why you scan rooms,
                  why you can't watch a movie without sitting near the exit,
                  or why small talk feels like a foreign language.
                  Explaining yourself gets exhausting.
                </p>
                <p>
                  TAG was built around tactical games, but what it actually is —
                  is a group of men who don't need everything explained.
                  You get on comms and within five minutes you're operating with people
                  who speak the same language, think the same way, and hold the same standard.
                </p>
                <p className="text-foreground font-medium">
                  That's not nothing. Sometimes that's everything.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-5"
            >
              {[
                {
                  heading: "Structure",
                  body: "Ops nights run on a schedule. There's a chain of command. There's a mission. Your brain knows what to do with that.",
                },
                {
                  heading: "Brotherhood",
                  body: "These aren't randoms. People have your back on the virtual battlefield the same way they would in real life. Trust gets built fast when you're working together under pressure.",
                },
                {
                  heading: "Purpose",
                  body: "You're not just gaming. You're leading a squad, planning an op, training newer members. You're useful again.",
                },
                {
                  heading: "No Explanation Required",
                  body: "Say you're having a rough one, no one asks twenty questions. They just say \"copy that\" and get on with the mission. That's the culture here.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.heading}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border rounded-lg p-5 hover:border-primary/40 transition-colors"
                >
                  <h3 className="font-display font-bold uppercase tracking-widest text-primary text-sm mb-2">
                    {item.heading}
                  </h3>
                  <p className="font-sans text-muted-foreground text-sm leading-relaxed">
                    {item.body}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Talking to Someone */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-4">
              If You Need to<br />
              <span className="text-primary">Talk to Someone</span>
            </h2>
            <p className="font-sans text-muted-foreground max-w-2xl leading-relaxed">
              Gaming together helps. But if things are dark right now — if you're really struggling —
              the links below connect you to people who specialize in exactly what you're going through.
              Using them isn't weakness. It's the same instinct that made you call for support on the
              battlefield when you needed it.
            </p>
          </motion.div>

          <div className="space-y-4">
            {RESOURCES.map((resource, i) => (
              <motion.a
                key={resource.name}
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`group flex items-start gap-5 p-6 rounded-lg border transition-all ${
                  resource.urgent
                    ? "bg-primary/5 border-primary/40 hover:border-primary hover:bg-primary/10"
                    : "bg-card border-border hover:border-primary/40 hover:bg-secondary/40"
                }`}
              >
                <div className={`w-12 h-12 shrink-0 rounded flex items-center justify-center ${
                  resource.urgent ? "bg-primary/20 border border-primary/50" : "bg-secondary border border-border"
                }`}>
                  <resource.icon className={`w-5 h-5 ${resource.urgent ? "text-primary" : "text-muted-foreground group-hover:text-primary"} transition-colors`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h3 className={`font-display font-bold uppercase tracking-wider text-sm ${resource.urgent ? "text-foreground" : "text-foreground"}`}>
                      {resource.name}
                    </h3>
                    {resource.urgent && (
                      <span className="text-[10px] font-display font-bold uppercase tracking-widest bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded">
                        24/7 Available
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-muted-foreground text-sm leading-relaxed mb-2">
                    {resource.description}
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className={`font-display font-bold text-sm ${resource.urgent ? "text-primary" : "text-primary"} flex items-center gap-1`}>
                      {resource.action} <ExternalLink className="w-3 h-3 opacity-60" />
                    </span>
                    {resource.secondary && (
                      <span className="font-display text-xs text-muted-foreground">
                        {resource.secondary}
                      </span>
                    )}
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Join TAG CTA */}
      <section className="py-20 bg-secondary/20 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Shield className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-foreground mb-6">
              Come Find Your People
            </h2>
            <p className="font-sans text-muted-foreground text-lg leading-relaxed mb-10 max-w-xl mx-auto">
              Whether you're a veteran, active duty, or just someone who thinks in tactics —
              TAG is a place where you belong. Jump in, no pressure. Stay as long as you like.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/join"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-black uppercase tracking-widest text-sm px-8 py-4 rounded clip-angled shadow-[0_0_20px_hsla(var(--primary),0.3)] hover:shadow-[0_0_30px_hsla(var(--primary),0.5)] transition-all active:scale-95"
              >
                <Users className="w-4 h-4" />
                Join the Unit
              </Link>
              <a
                href="https://discord.gg/matmFhU4yg"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-widest text-sm px-8 py-4 rounded clip-angled transition-all active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                Join the Discord
              </a>
            </div>
          </motion.div>
        </div>
      </section>

    </MainLayout>
  );
}
