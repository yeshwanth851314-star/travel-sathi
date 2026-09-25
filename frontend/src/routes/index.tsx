import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldAlert,
  MapPin,
  PhoneCall,
  Activity,
  HeartHandshake,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Building2,
  BookOpen,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Travel Sathi — Smart Tourist Safety & Emergency Response Platform" },
      {
        name: "description",
        content:
          "Smart Tourist Safety & Emergency Response Platform. One-tap SOS, live location tracking, verified safety guides, and rapid emergency coordination.",
      },
      {
        property: "og:title",
        content: "Travel Sathi — Smart Tourist Safety & Emergency Response Platform",
      },
      {
        property: "og:description",
        content:
          "Instant SOS emergency dispatch, live incident updates, and verified local safety resources for international and domestic travelers.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Top Emergency Advisory Bar */}
      <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-center text-xs font-medium text-destructive">
        <span className="inline-flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5" />
          In immediate life danger? Dial <strong>112</strong> immediately or use our one-tap{" "}
          <Link to="/login" className="underline font-bold hover:text-destructive/80">
            Emergency SOS
          </Link>
          .
        </span>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-display text-xl font-bold tracking-tight"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span>Travel Sathi</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link to="/public/safety" className="hover:text-foreground transition-colors">
              Safety Information
            </Link>
            <Link to="/public/resources" className="hover:text-foreground transition-colors">
              Emergency Resources
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Safety Protocols
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-medium">
                Sign In
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="font-medium shadow-xs">
                Get Started <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Next-Gen Smart Tourist Safety Platform</span>
              </div>

              <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-balance">
                Travel with confidence. <br className="hidden sm:inline" />
                <span className="text-primary">Help when it matters.</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Travel Sathi bridges tourists, emergency responders, and official authorities into a
                seamless, real-time safety network. Instant one-tap SOS, live GPS tracking, verified
                local guides, and coordinated dispatch.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link to="/login" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-12 px-6 text-base font-semibold shadow-md"
                  >
                    <ShieldAlert className="mr-2 h-5 w-5 text-destructive-foreground" />
                    Activate SOS / Emergency Sign In
                  </Button>
                </Link>
                <Link to="/public/safety" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto h-12 px-6 text-base font-semibold"
                  >
                    Browse Safety Directory
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t text-left max-w-lg mx-auto lg:mx-0">
                <div>
                  <p className="text-2xl font-bold font-display text-foreground">24/7</p>
                  <p className="text-xs text-muted-foreground">Emergency Readiness</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-foreground">&lt; 3 sec</p>
                  <p className="text-xs text-muted-foreground">SOS Signal Dispatch</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-foreground">100%</p>
                  <p className="text-xs text-muted-foreground">Verified Local Resources</p>
                </div>
              </div>
            </div>

            {/* Hero Interactive Card Preview */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Live Incident Shield
                    </span>
                  </div>
                  <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-bold text-destructive">
                    CRITICAL READY
                  </span>
                </div>

                <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 text-center space-y-2">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">One-Tap Geotagged SOS</h3>
                  <p className="text-xs text-muted-foreground">
                    Transmits live device GPS coordinates, notifies pre-configured emergency
                    contacts, and alerts verified responders instantly.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/60">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" /> Geolocation Precision
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      High Accuracy GPS
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/60">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Activity className="h-4 w-4 text-primary" /> Realtime Channel
                    </span>
                    <span className="font-semibold text-foreground">Supabase Live Sync</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/60">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <PhoneCall className="h-4 w-4 text-primary" /> Primary Contact
                    </span>
                    <span className="font-semibold text-foreground">SMS & Email Auto-alert</span>
                  </div>
                </div>

                <Link to="/login" className="block pt-2">
                  <Button className="w-full text-xs font-semibold h-9" variant="secondary">
                    Access Dashboard Demo <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Capabilities */}
      <section className="bg-card/50 py-16 border-y">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-primary">
              Core Architecture
            </h2>
            <p className="font-display text-3xl font-bold tracking-tight text-foreground">
              Engineered for Critical Response
            </p>
            <p className="text-sm text-muted-foreground">
              Every workflow is backed by automated PostgreSQL triggers, real-time WebSocket
              subscriptions, and role-based security.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* 1 */}
            <div className="rounded-xl border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground text-base">One-Tap SOS Activation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Prevents duplicate alerts, captures device coordinates with high accuracy, and
                initiates an immediate critical incident workflow.
              </p>
            </div>

            {/* 2 */}
            <div className="rounded-xl border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground text-base">Live Interactive Map</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Leaflet-powered maps visualize incident locations, user positions, and nearby
                emergency services such as hospitals and police stations.
              </p>
            </div>

            {/* 3 */}
            <div className="rounded-xl border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground text-base">
                Verified Safety Information
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Authoritative local guides, emergency numbers, cultural protocols, and verified
                advisories reviewed by regional authorities.
              </p>
            </div>

            {/* 4 */}
            <div className="rounded-xl border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground text-base">
                Tourist Assistance & Reports
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Report lost items, transport problems, medical issues, or harassment with
                category-specific categorization and responder tracking.
              </p>
            </div>

            {/* 5 */}
            <div className="rounded-xl border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground text-base">
                Emergency Resource Directory
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Direct phone lines, addresses, and operating hours of verified medical centers,
                police booths, and tourist helplines.
              </p>
            </div>

            {/* 6 */}
            <div className="rounded-xl border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground text-base">Live Responder Timeline</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Subscribers receive real-time updates as responders accept tickets, mark themselves
                en route, provide assistance, and resolve incidents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Segments */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-primary">
              Unified Ecosystem
            </h2>
            <p className="font-display text-3xl font-bold tracking-tight text-foreground">
              Built for Every Stakeholder
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Tourist */}
            <div className="rounded-2xl border bg-card p-6 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  01
                </div>
                <h3 className="text-xl font-bold font-display">For Tourists</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Travel safely with one-tap emergency SOS, pre-saved emergency contacts, incident
                  reporting, and real-time safety advisories.
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Instant Geolocation
                    Tagging
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Live Response Progress
                    Status
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Offline Contact Records
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <Link to="/login">
                  <Button variant="outline" className="w-full text-xs">
                    Tourist Portal
                  </Button>
                </Link>
              </div>
            </div>

            {/* Responder */}
            <div className="rounded-2xl border bg-card p-6 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  02
                </div>
                <h3 className="text-xl font-bold font-display">For Responders</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Dedicated response dashboard with prioritized emergency triage, live dispatch
                  maps, status progressions, and internal responder notes.
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Prioritized Triage Queue
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Single-click Acceptance
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Route & Location Mapping
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <Link to="/login">
                  <Button variant="outline" className="w-full text-xs">
                    Responder Console
                  </Button>
                </Link>
              </div>
            </div>

            {/* Admin */}
            <div className="rounded-2xl border bg-card p-6 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                  03
                </div>
                <h3 className="text-xl font-bold font-display">For Tourism Admins</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Comprehensive oversight: analytics dashboards, user role administration, full CRUD
                  on verified guides and emergency resources, and immutable audit logs.
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Citywide Safety Heatmaps
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Role & Permission
                    Management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Full Audit Trail Logs
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <Link to="/login">
                  <Button variant="outline" className="w-full text-xs">
                    Admin Center
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-card py-10 text-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-display text-base font-bold">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Travel Sathi
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Smart Tourist Safety & Emergency Response Platform. Connecting visitors with trusted
                safety resources and rapid assistance.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                Safety & Resources
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>
                  <Link to="/public/safety" className="hover:text-foreground transition-colors">
                    Safety Guidelines
                  </Link>
                </li>
                <li>
                  <Link to="/public/resources" className="hover:text-foreground transition-colors">
                    Emergency Directory
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-foreground transition-colors">
                    Report an Incident
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                Legal & Compliance
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>
                  <Link to="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-emerald-500" /> RLS Database Protected
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                Emergency Helplines
              </h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  National Emergency: <strong className="text-foreground">112</strong>
                </p>
                <p>
                  Tourist Police Helpline: <strong className="text-foreground">1363</strong>
                </p>
                <p>
                  Medical Emergency: <strong className="text-foreground">108</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
            <p>© {new Date().getFullYear()} Travel Sathi. All rights reserved.</p>
            <p>Smart Tourist Safety & Emergency Response Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
