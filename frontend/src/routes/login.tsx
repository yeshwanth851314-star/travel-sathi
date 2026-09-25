import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldAlert, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errMsg } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Travel Sathi" },
      {
        name: "description",
        content: "Sign in or create a Travel Sathi tourist or emergency responder account.",
      },
      { property: "og:title", content: "Sign in — Travel Sathi" },
      { property: "og:description", content: "Sign in or create a Travel Sathi account." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back to Travel Sathi!");
        navigate({ to: "/home" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/home",
            data: { full_name: name },
          },
        });
        if (error) throw error;
        setMsg({
          type: "success",
          text: "Registration initiated! Please check your email to verify your account, then sign in.",
        });
        toast.success("Registration email sent!");
      }
    } catch (err) {
      const formatted = errMsg(err);
      setMsg({ type: "error", text: formatted });
      toast.error(formatted);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2 shadow-xs">
            <ShieldAlert className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            Travel Sathi
          </h1>
          <p className="text-sm text-muted-foreground">
            Smart Tourist Safety & Emergency Response Platform
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-xs sm:p-8">
          <div className="flex rounded-lg bg-muted p-1 mb-6 text-sm font-medium">
            <button
              type="button"
              className={`flex-1 rounded-md py-1.5 transition-colors ${
                mode === "in"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                setMode("in");
                setMsg(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md py-1.5 transition-colors ${
                mode === "up"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                setMode("up");
                setMsg(null);
              }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "up" && (
              <div className="space-y-1.5">
                <Label htmlFor="fullname">Full Name</Label>
                <Input
                  id="fullname"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                required
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "in" && (
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                required
                minLength={8}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "in" ? "current-password" : "new-password"}
              />
              {mode === "up" && (
                <p className="text-[12px] text-muted-foreground">Minimum 8 characters required</p>
              )}
            </div>

            {msg && (
              <div
                className={`flex items-start gap-2.5 rounded-lg p-3 text-sm ${
                  msg.type === "error"
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                }`}
                role="alert"
              >
                {msg.type === "error" ? (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">{msg.text}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-10 font-medium" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait…
                </>
              ) : mode === "in" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
