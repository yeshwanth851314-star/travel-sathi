import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldAlert, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafetyInfoBrowser, AlertsList } from "@/components/app/SafetyBrowse";

export const Route = createFileRoute("/public/safety")({
  head: () => ({
    meta: [
      { title: "Public Safety Information — Travel Sathi" },
      {
        name: "description",
        content: "Verified local safety guidelines and active alerts for travelers and tourists.",
      },
    ],
  }),
  component: PublicSafetyPage,
});

function PublicSafetyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Travel Sathi
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/public/resources">
              <Button variant="ghost" size="sm">
                Emergency Resources
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Sign In / SOS</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display tracking-tight text-foreground sm:text-3xl">
                Verified Safety Information & Alerts
              </h1>
              <p className="text-sm text-muted-foreground">
                Authoritative local guidance, cultural safety protocols, and real-time alerts.
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Active Safety Alerts</h2>
          <AlertListSection />
        </section>

        <section className="space-y-4 pt-4 border-t">
          <h2 className="text-lg font-semibold tracking-tight">Safety Knowledge Base</h2>
          <SafetyInfoBrowser />
        </section>
      </main>
    </div>
  );
}

function AlertListSection() {
  return <AlertsList />;
}
