import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldAlert,
  MapPin,
  PhoneCall,
  Activity,
  HeartHandshake,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Building2,
  BookOpen,
  Lock,
  ShieldCheck,
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Subtle Top Emergency Bar */}
      <div className="border-b bg-muted/60 px-4 py-2 text-center text-xs text-muted-foreground">
        <span>
          Need immediate emergency assistance? Call <strong className="text-foreground">112</strong>{" "}
          (National Emergency) or{" "}
          <Link to="/login" className="font-semibold text-destructive hover:underline">
            activate Emergency SOS →
          </Link>
        </span>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <span>Travel Sathi</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
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

          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-medium">
                Sign In
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="font-medium">
                Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Smart Tourist Safety &amp; Emergency Response Platform</span>
              </div>

              <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-balance leading-[1.1]">
                Travel with confidence. <br className="hidden sm:inline" />
                <span className="text-primary">Help when it matters.</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                A unified safety platform connecting travelers, emergency responders, and tourism
                authorities with instant SOS dispatch, verified local directories, and live incident
                coordination.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link to="/login">
                  <Button size="lg" className="h-11 px-6 font-semibold">
                    Access Platform <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/public/resources">
                  <Button variant="outline" size="lg" className="h-11 px-6 font-medium">
                    Emergency Directory
                  </Button>
                </Link>
              </div>

              {/* Clean Metrics Row */}
              <div className="pt-8 grid grid-cols-3 gap-6 border-t max-w-md">
                <div>
                  <p className="text-2xl font-bold font-display text-foreground">24/7</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Response Readiness</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-foreground">&lt; 3 sec</p>
                  <p className="text-xs text-muted-foreground mt-0.5">SOS Dispatch</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-foreground">100%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Verified Directory</p>
                </div>
              </div>
            </div>

            {/* Clean Overview Card */}
            <div className="lg:col-span-5">
              <div className="mx-auto max-w-md rounded-2xl border bg-card p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Emergency &amp; Safety Hub
                    </p>
                    <p className="text-xs text-muted-foreground">Real-time coordination status</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    Operational
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3.5 rounded-xl border p-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">One-Tap Geotagged SOS</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Shares live GPS coordinates and alerts nearby responders immediately.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 rounded-xl border p-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Verified Hospitals &amp; Police
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Interactive map of verified medical facilities, police booths, and
                        embassies.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 rounded-xl border p-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Live Status Tracking</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Follow responder assignment and arrival updates in real time.
                      </p>
                    </div>
                  </div>
                </div>

                <Link to="/login" className="block pt-1">
                  <Button variant="secondary" className="w-full h-10 text-xs font-semibold">
                    Explore Tourist, Responder &amp; Admin Portals{" "}
                    <ChevronRight className="ml-1 h-4 w-4" />
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
