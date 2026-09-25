import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldAlert, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResourceDirectory } from "@/components/app/SafetyBrowse";

export const Route = createFileRoute("/public/resources")({
  head: () => ({
    meta: [
      { title: "Public Emergency Resources — Travel Sathi" },
      {
        name: "description",
        content:
          "Verified hospitals, police stations, tourist police booths, and emergency centers.",
      },
    ],
  }),
  component: PublicResourcesPage,
});

function PublicResourcesPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Travel Sathi
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/public/safety">
              <Button variant="ghost" size="sm">
                Safety Info
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
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display tracking-tight text-foreground sm:text-3xl">
                Emergency Resources Directory
              </h1>
              <p className="text-sm text-muted-foreground">
                Find contact details and locations of verified medical facilities, police stations,
                and tourist helplines.
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <ResourceDirectory />
        </section>
      </main>
    </div>
  );
}
