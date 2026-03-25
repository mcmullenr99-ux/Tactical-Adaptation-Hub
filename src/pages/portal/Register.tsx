import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";
import { TagLogo } from "@/components/TagLogo";
import { useAuth } from "@/components/auth/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { register: registerUser } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setErrorMsg(null);
    setIsPending(true);
    try {
      await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
      });
      setLocation("/portal/verify-email");
    } catch (err: any) {
      setErrorMsg(err?.data?.error || "Registration failed. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-[90vh] flex items-center justify-center py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-background/95" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
        </div>

        <motion.div 
          className="relative z-10 w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-card border border-border p-8 sm:p-10 rounded-lg clip-angled shadow-xl">
            <div className="flex flex-col items-center mb-8">
              <TagLogo size={110} className="mb-4" />
              <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-foreground">Registration</h1>
              <p className="text-muted-foreground font-sans mt-2 text-center">Establish your TAG identity</p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded text-destructive flex items-center gap-3 text-sm font-sans">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Callsign / Username
                </label>
                <input
                  {...register("username")}
                  type="text"
                  className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="Ghost_Actual"
                />
                {errors.username && <p className="text-destructive text-sm mt-1 font-sans">{errors.username.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Email Address
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="operator@tag.com"
                />
                {errors.email && <p className="text-destructive text-sm mt-1 font-sans">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Passcode
                </label>
                <input
                  {...register("password")}
                  type="password"
                  className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-destructive text-sm mt-1 font-sans">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Confirm Passcode
                </label>
                <input
                  {...register("confirmPassword")}
                  type="password"
                  className="w-full bg-background border-2 border-border rounded px-4 py-3 text-foreground font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-destructive text-sm mt-1 font-sans">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-3 font-display font-bold uppercase tracking-widest text-lg bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded clip-angled shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all active:scale-95 disabled:opacity-70 mt-6"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {isPending ? "Processing..." : "Create Identity"}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-border pt-6">
              <p className="text-muted-foreground font-sans text-sm">
                Already registered?{" "}
                <Link href="/portal/login" className="text-primary hover:text-accent transition-colors font-bold">
                  Authenticate Here
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
