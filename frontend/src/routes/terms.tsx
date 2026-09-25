import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Travel Sathi" },
      {
        name: "description",
        content: "Terms of service for the Travel Sathi tourist safety platform.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Travel Sathi
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: September 2026</p>

        <div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Purpose and Scope</h2>
            <p>
              Travel Sathi is an emergency coordination and tourist safety assistance platform
              designed to facilitate rapid response, verified local safety information distribution,
              and emergency incident tracking. By accessing or using Travel Sathi, you agree to
              comply with these terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              2. Emergency SOS and Assistance Services
            </h2>
            <p>
              The SOS feature is intended exclusively for genuine emergencies requiring urgent
              intervention. Triggering deliberate false alarms or frivolous emergency alerts is
              strictly prohibited and may result in account termination and referral to local law
              enforcement authorities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              3. Location Sharing & Accuracy
            </h2>
            <p>
              When an SOS or incident report is submitted with location permissions enabled,
              geolocation coordinates are transmitted to assigned emergency responders and system
              administrators to aid in dispatch. Positional accuracy is contingent upon device GPS
              and cellular network capabilities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. User Responsibilities</h2>
            <p>
              Users are responsible for keeping account credentials secure and providing authentic
              contact information for designated emergency contacts. First responders and official
              authorities act in good faith based upon user-provided reports.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. Limitation of Liability</h2>
            <p>
              While Travel Sathi strives for uninterrupted 24/7 service availability, real-time
              dispatching depends on active telecommunications and responder network availability.
              Travel Sathi does not guarantee response times and cannot be held liable for network
              carrier failures or local authority delays.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
