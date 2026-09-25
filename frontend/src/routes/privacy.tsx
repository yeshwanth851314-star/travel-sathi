import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Travel Sathi" },
      {
        name: "description",
        content: "Privacy policy for the Travel Sathi tourist safety platform.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: September 2026</p>

        <div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p>
              Travel Sathi collects only data required to preserve tourist safety and coordinate
              emergency response: user account profile information (full name, email, phone number),
              designated emergency contacts, emergency reports, and voluntary tourist travel details
              (medical notes, language preferences).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. Geolocation Privacy</h2>
            <p>
              Location coordinates are collected only with your explicit permission when an
              emergency SOS is triggered, an incident is reported, or a location update is provided.
              Location data is shared strictly with authorized responders and administrators
              actively handling your incident.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. Security & Access Control</h2>
            <p>
              All data is stored in secure database instances protected by strict Row-Level Security
              (RLS) policies. Regular users can only access their own profile records and submitted
              incidents. Only vetted responders and administrators have access to emergency queues.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              4. Disclosure to Emergency Services
            </h2>
            <p>
              In life-critical emergency situations initiated by SOS, incident metadata and
              coordinates may be transmitted to official emergency response entities (police,
              ambulance, tourist helpline, search and rescue).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              5. Data Retention & Your Rights
            </h2>
            <p>
              You have the right to review, update, or request deletion of your profile data at any
              time through your account settings or by contacting our administration team.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
