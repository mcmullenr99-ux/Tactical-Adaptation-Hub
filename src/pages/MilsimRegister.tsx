import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/components/auth/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { Shield, ChevronRight, ChevronLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  BRANCHES, UNIT_TYPES_BY_BRANCH, GAMES_LIST, COUNTRIES_LIST, LANGUAGES_LIST, type Branch,
} from "@/lib/milsimConstants";

interface FormData {
  name: string;
  tagLine: string;
  description: string;
  discordUrl: string;
  websiteUrl: string;
  logoUrl: string;
  sops: string;
  orbat: string;
  country: string;
  language: string;
  branch: string;
  unitType: string;
  games: string[];
}

const STEPS = ["Identity", "About", "Details", "Doctrine", "Review"];

export default function MilsimRegister() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: "", tagLine: "", description: "", discordUrl: "", websiteUrl: "", logoUrl: "", sops: "", orbat: "", country: "", language: "", branch: "", unitType: "", games: [] },
  });

  const values = watch();

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/milsimGroups", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          tagLine: data.tagLine || undefined,
          description: data.description || undefined,
          discordUrl: data.discordUrl || undefined,
          websiteUrl: data.websiteUrl || undefined,
          logoUrl: data.logoUrl || undefined,
          sops: data.sops || undefined,
          orbat: data.orbat || undefined,
          country: data.country || undefined,
          language: data.language || undefined,
          branch: data.branch || undefined,
          unitType: data.unitType || undefined,
          games: data.games?.length ? data.games : undefined,
        }),
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e.message ?? "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    </MainLayout>
  );

  if (!isAuthenticated) return (
    <MainLayout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Shield className="w-14 h-14 text-muted-foreground opacity-40" />
        <h2 className="font-display font-black text-2xl uppercase tracking-wider">Sign In Required</h2>
        <p className="text-muted-foreground font-sans">You need a TAG account to register a MilSim group.</p>
        <button onClick={() => setLocation("/portal/login")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 rounded clip-angled-sm transition-all">
          Sign In
        </button>
      </div>
    </MainLayout>
  );

  if (success) return (
    <MainLayout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
        <CheckCircle2 className="w-16 h-16 text-primary" />
        <div>
          <h2 className="font-display font-black text-3xl uppercase tracking-wider text-foreground mb-3">Unit Registered</h2>
          <p className="text-muted-foreground font-sans max-w-md">Your group has been submitted for review. Once approved it will appear in the registry. You can manage it from your portal.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setLocation("/portal/milsim")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 rounded clip-angled-sm transition-all">
            Manage Group
          </button>
          <button onClick={() => setLocation("/milsim")}
            className="border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 rounded clip-angled-sm transition-all">
            View Registry
          </button>
        </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="relative bg-secondary/50 border-b border-border py-16 overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 rounded text-primary font-display font-bold uppercase tracking-widest text-xs mb-5">
              <Shield className="w-3 h-3" /> Register Your Unit
            </div>
            <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight text-foreground mb-4">
              Register Your <span className="text-primary">MilSim Group</span>
            </h1>
            <p className="text-muted-foreground font-sans">Fill in the details below. You can always update them later from your management portal.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-xs border transition-all ${
                i < step ? "bg-primary border-primary text-primary-foreground"
                : i === step ? "bg-primary/10 border-primary text-primary"
                : "bg-secondary border-border text-muted-foreground"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-display font-bold uppercase tracking-widest hidden sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`w-8 h-px mx-1 ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg mb-6 text-destructive text-sm font-sans">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

            {/* Step 0: Identity */}
            {step === 0 && (
              <div className="space-y-6">
                <h2 className="font-display font-black text-xl uppercase tracking-wider text-foreground mb-6">Unit Identity</h2>
                <Field label="Unit Name *" error={errors.name?.message}>
                  <input {...register("name", { required: "Unit name is required", minLength: { value: 2, message: "Minimum 2 characters" } })}
                    className="input-field" placeholder="e.g. 1st Ranger Battalion" />
                </Field>
                <Field label="Tag Line" hint="Short motto or description shown on the card">
                  <input {...register("tagLine")} className="input-field" placeholder="e.g. Rangers Lead The Way" />
                </Field>
                <Field label="Logo URL" hint="Paste a direct image URL (Discord CDN, Imgur, etc.)">
                  <input {...register("logoUrl")} className="input-field" placeholder="https://i.imgur.com/..." />
                </Field>
                {values.logoUrl && (
                  <div className="w-24 h-24 bg-secondary border border-border rounded-lg flex items-center justify-center overflow-hidden">
                    <img src={values.logoUrl} alt="Preview" className="w-full h-full object-contain p-2" onError={(e) => (e.currentTarget.style.display = "none")} />
                  </div>
                )}
                <Field label="Discord Invite URL">
                  <input {...register("discordUrl")} className="input-field" placeholder="https://discord.gg/..." />
                </Field>
                <Field label="Website URL">
                  <input {...register("websiteUrl")} className="input-field" placeholder="https://yourunit.com" />
                </Field>
              </div>
            )}

            {/* Step 1: About */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="font-display font-black text-xl uppercase tracking-wider text-foreground mb-6">About Your Unit</h2>
                <Field label="Description" hint="Tell people what your unit is about, what games you play, your playstyle and expectations">
                  <textarea {...register("description")} rows={8} className="input-field resize-none"
                    placeholder="We are a tactical realism unit focused on..." />
                </Field>
              </div>
            )}


            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="font-display font-black text-xl uppercase tracking-wider text-foreground mb-6">Unit Details</h2>

                {/* Branch — pill selector */}
                <div>
                  <label className="block font-display font-bold uppercase tracking-wider text-xs text-foreground mb-1.5">Military Branch *</label>
                  <p className="text-xs text-muted-foreground font-sans mb-3">What branch does your unit represent?</p>
                  <div className="flex flex-wrap gap-2">
                    {BRANCHES.map(b => {
                      const sel = values.branch === b;
                      return (
                        <button key={b} type="button"
                          onClick={() => { setValue("branch", b); setValue("unitType", ""); }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${
                            sel ? "bg-primary/15 border-primary/50 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                          }`}>
                          <span className="w-2 h-2 rounded-full bg-current opacity-60 shrink-0" />{b}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Unit Type — context-aware based on branch */}
                <Field label="Unit Type" hint={values.branch ? `Unit types for ${values.branch}` : "Select a branch first to see relevant unit types"}>
                  <select {...register("unitType")} className="input-field">
                    <option value="">Select unit type...</option>
                    {(values.branch ? (UNIT_TYPES_BY_BRANCH[values.branch as Branch] ?? []) : []).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Primary Country / Nationality" hint="Where most of your members are based">
                  <select {...register("country")} className="input-field">
                    <option value="">Select country...</option>
                    {COUNTRIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Primary Language" hint="Language used during operations">
                  <select {...register("language")} className="input-field">
                    <option value="">Select language...</option>
                    {LANGUAGES_LIST.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </Field>
                <div>
                  <label className="block text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Games You Play</label>
                  <p className="text-xs text-muted-foreground font-sans mb-3">Select all that apply.</p>
                  <div className="flex flex-wrap gap-2">
                    {GAMES_LIST.map(game => {
                      const selected = (values.games ?? []).includes(game);
                      return (
                        <button
                          key={game}
                          type="button"
                          onClick={() => {
                            const current = values.games ?? [];
                            const next = selected ? current.filter(g => g !== game) : [...current, game];
                            setValue("games", next);
                          }}
                          className={`px-3 py-1.5 rounded border text-xs font-display font-bold uppercase tracking-wider transition-all ${
                            selected
                              ? "bg-primary/15 border-primary/50 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }`}
                        >
                          {game}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Doctrine */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="font-display font-black text-xl uppercase tracking-wider text-foreground mb-6">Doctrine</h2>
                <Field label="SOPs — Standard Operating Procedures" hint="Rules of engagement, communication standards, engagement protocols, etc.">
                  <textarea {...register("sops")} rows={8} className="input-field resize-none font-mono text-sm"
                    placeholder="1. Comms discipline — PTT only when necessary&#10;2. Movement — SLLS before crossing open ground..." />
                </Field>
                <Field label="ORBAT — Order of Battle" hint="Your unit structure — elements, sub-units, chains of command, etc.">
                  <textarea {...register("orbat")} rows={8} className="input-field resize-none font-mono text-sm"
                    placeholder="HQ Element&#10;  - CO: Commander&#10;  - XO: Executive Officer&#10;Alpha Squad..." />
                </Field>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="font-display font-black text-xl uppercase tracking-wider text-foreground mb-6">Review & Submit</h2>
                <div className="bg-card border border-border rounded-lg divide-y divide-border">
                  {[
                    { label: "Unit Name", value: values.name },
                    { label: "Tag Line", value: values.tagLine || "—" },
                    { label: "Logo URL", value: values.logoUrl ? "Set" : "—" },
                    { label: "Discord", value: values.discordUrl || "—" },
                    { label: "Website", value: values.websiteUrl || "—" },
                    { label: "Description", value: values.description ? `${values.description.substring(0, 80)}...` : "—" },
                    { label: "SOPs", value: values.sops ? "Provided" : "—" },
                    { label: "ORBAT", value: values.orbat ? "Provided" : "—" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start gap-4 px-5 py-3">
                      <span className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground w-28 shrink-0 pt-0.5">{row.label}</span>
                      <span className="font-sans text-sm text-foreground break-all">{row.value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-sans">
                  Your group will be reviewed before appearing publicly. You can continue setting up roles, ranks, roster, and application questions from your management portal after submitting.
                </p>
              </div>
            )}

          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
            <button type="button" onClick={() => setStep((s) => s - 1)} disabled={step === 0}
              className="inline-flex items-center gap-2 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-display font-bold uppercase tracking-wider text-sm px-5 py-3 rounded clip-angled-sm transition-all disabled:opacity-30 disabled:pointer-events-none">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button type="button" onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-6 py-3 rounded clip-angled-sm transition-all active:scale-95">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={submitting}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-wider text-sm px-8 py-3 rounded clip-angled-sm transition-all active:scale-95 disabled:opacity-60">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Shield className="w-4 h-4" /> Submit Registration</>}
              </button>
            )}
          </div>
        </form>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 6px;
          padding: 10px 14px;
          font-size: 14px;
          font-family: var(--font-sans, sans-serif);
          color: hsl(var(--foreground));
          outline: none;
          transition: border-color 0.2s;
        }
        .input-field:focus { border-color: hsl(var(--primary) / 0.6); }
        .input-field::placeholder { color: hsl(var(--muted-foreground)); }
      `}</style>
    </MainLayout>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-display font-bold uppercase tracking-wider text-xs text-foreground mb-1.5">{label}</label>
      {hint && <p className="text-xs text-muted-foreground font-sans mb-2">{hint}</p>}
      {children}
      {error && <p className="text-xs text-destructive font-sans mt-1">{error}</p>}
    </div>
  );
}
