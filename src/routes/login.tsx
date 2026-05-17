import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: (s.redirect as string) || "/",
    mode: (s.mode as "signin" | "signup") || "signin",
  }),
  head: () => ({ meta: [{ title: "Sign in — DERYA Chic" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${search.redirect}`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Check your inbox", { description: "Confirm your email to sign in." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: search.redirect });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
  setBusy(true);
  
  // غانـتأكدو بلي الـ redirect ديما كيبدا بـ سلاش / وإلا غانصيفطوه للرئيسية ديريكت
  const targetRedirect = search.redirect || '/';
  const finalRedirectUri = `${window.location.origin}${targetRedirect.startsWith('/') ? targetRedirect : '/' + targetRedirect}`;

  const r = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: finalRedirectUri,
  });
    if ((r as any).error) {
      toast.error("Google sign-in failed");
      setBusy(false);
    } else if (!(r as any).redirected) {
      navigate({ to: search.redirect });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>

        <h1 className="font-display text-4xl tracking-[0.06em]">
          {mode === "signin" ? "Welcome back" : "Create account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to continue your collection." : "Join the DERYA Chic atelier."}
        </p>

        <button
          onClick={google}
          disabled={busy}
          className="mt-8 w-full glass-strong rounded-[14px] py-3.5 text-sm font-medium hover:bg-muted transition flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.61z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <div className="flex-1 h-px bg-border" /> or <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <Field icon={UserIcon} placeholder="Full name" value={name} onChange={setName} />
          )}
          <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} required />
          <Field icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} required minLength={6} />

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-foreground text-background rounded-[14px] py-3.5 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {mode === "signin" ? "New to DERYA Chic?" : "Already a member?"}{" "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-foreground font-medium hover:text-neon"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

function Field({ icon: Icon, ...rest }: any) {
  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.6} />
      <input
        {...rest}
        onChange={(e) => rest.onChange(e.target.value)}
        className="w-full glass rounded-[14px] pl-11 pr-4 py-3.5 text-sm bg-background/50 border border-border focus:border-foreground/40 outline-none transition placeholder:text-muted-foreground"
      />
    </div>
  );
}
