import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldAlert,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Compass,
  Siren,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { clearAuthCache, setCachedRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errMsg, roleHome, type Role } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Travel Sathi" },
      {
        name: "description",
        content:
          "Sign in or create a Travel Sathi Tourist, Emergency Responder, or Administrator account.",
      },
      { property: "og:title", content: "Sign in — Travel Sathi" },
      { property: "og:description", content: "Sign in or create a Travel Sathi account." },
    ],
  }),
  component: Login,
});

const ROLE_OPTIONS: {
  value: Role;
  label: string;
  emoji: string;
  sub: string;
  icon: typeof Compass;
}[] = [
  {
    value: "tourist",
    label: "Tourist",
    emoji: "🧳",
    sub: "SOS, Alerts & Safety Map",
    icon: Compass,
  },
  {
    value: "responder",
    label: "Responder",
    emoji: "🚨",
    sub: "Active & Assigned Incidents",
    icon: Siren,
  },
  {
    value: "admin",
    label: "Administrator",
    emoji: "🛡️",
    sub: "Users, Analytics & Audit",
    icon: ShieldCheck,
  },
];

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [selectedRole, setSelectedRole] = useState<Role | "auto">("auto");
  const [signupRole, setSignupRole] = useState<Role>("tourist");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    clearAuthCache();
    try {
      if (mode === "in") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (selectedRole !== "auto") {
          await supabase.rpc("switch_my_role", { _role: selectedRole });
          if (data.user) setCachedRole(data.user.id, selectedRole);
          toast.success(`Signed in as ${selectedRole.toUpperCase()}!`);
          navigate({ to: roleHome(selectedRole) });
        } else {
          toast.success("Welcome back to Travel Sathi!");
          navigate({ to: "/home" });
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/home",
            data: { full_name: name, role: signupRole },
          },
        });
        if (error) throw error;
        if (data.session) {
          await supabase.rpc("switch_my_role", { _role: signupRole });
          if (data.user) setCachedRole(data.user.id, signupRole);
          toast.success(`Welcome to Travel Sathi! Signed in as ${signupRole}.`);
          navigate({ to: roleHome(signupRole) });
          return;
        }
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

  async function quickDemoLogin(role: Role, demoEmail: string) {
    setBusy(true);
    setMsg(null);
    clearAuthCache();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: "TravelSathi2026!",
      });
      if (error) throw error;
      await supabase.rpc("switch_my_role", { _role: role });
      if (data.user) setCachedRole(data.user.id, role);
      toast.success(`Signed into ${role.toUpperCase()} portal!`);
      navigate({ to: roleHome(role) });
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
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </div>

        <div className="text-center space-y-1.5">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-1">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            Travel Sathi
          </h1>
          <p className="text-sm text-muted-foreground">Sign in to access your safety dashboard</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 sm:p-7 shadow-2xs">
          <div className="flex rounded-lg bg-muted p-1 mb-6 text-sm font-medium">
            <button
              type="button"
              className={`flex-1 rounded-md py-1.5 transition-colors ${
                mode === "in"
                  ? "bg-card text-foreground shadow-2xs font-semibold"
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
                  ? "bg-card text-foreground shadow-2xs font-semibold"
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
            {/* Clean Role Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">
                  {mode === "up" ? "Account Role" : "Portal Role"}
                </Label>
                {mode === "in" && selectedRole !== "auto" && (
                  <button
                    type="button"
                    onClick={() => setSelectedRole("auto")}
                    className="text-xs text-primary hover:underline"
                  >
                    Use default
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_OPTIONS.map((r) => {
                  const Icon = r.icon;
                  const active = mode === "up" ? signupRole === r.value : selectedRole === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        if (mode === "up") setSignupRole(r.value);
                        else setSelectedRole(r.value);
                      }}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-center transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {mode === "up" && (
              <div className="space-y-1.5">
                <Label htmlFor="fullname">Full Name</Label>
                <Input
                  id="fullname"
                  required
                  placeholder="e.g. Pratibha"
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
                <p className="text-xs text-muted-foreground">Minimum 8 characters required</p>
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
                selectedRole !== "auto" ? (
                  `Sign In as ${ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label}`
                ) : (
                  "Sign In"
                )
              ) : (
                `Create ${ROLE_OPTIONS.find((r) => r.value === signupRole)?.label} Account`
              )}
            </Button>
          </form>

          {/* Clean Quick Demo Access */}
          <div className="mt-6 pt-5 border-t space-y-2.5">
            <p className="text-xs font-medium text-center text-muted-foreground">
              Quick Demo Access
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => quickDemoLogin("tourist", "tourist@travelsathi.demo")}
                className="text-xs h-8"
              >
                Tourist
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => quickDemoLogin("responder", "responder@travelsathi.demo")}
                className="text-xs h-8"
              >
                Responder
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => quickDemoLogin("admin", "admin@travelsathi.demo")}
                className="text-xs h-8"
              >
                Admin
              </Button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-muted-foreground">
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
