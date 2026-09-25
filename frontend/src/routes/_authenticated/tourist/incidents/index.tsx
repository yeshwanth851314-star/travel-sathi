import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  ListChecks,
  Search,
  ArrowLeft,
  Clock,
  PlusCircle,
  Siren,
  ChevronRight,
} from "lucide-react";
import { useIncidents } from "@/lib/queries";
import { SeverityBadge, StatusBadge } from "@/components/app/badges";
import { Loading, Empty, ErrorState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/tourist/incidents/")({
  head: () => ({
    meta: [{ title: "My Incidents & Requests — Travel Sathi" }],
  }),
  component: TouristIncidentsListPage,
});

type FilterTab = "all" | "active" | "resolved" | "sos" | "incident" | "assistance";

function TouristIncidentsListPage() {
  const { user } = Route.useRouteContext();
  const { data: incidents, isLoading, error } = useIncidents({ reporterId: user.id });

  const [tab, setTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return (incidents ?? []).filter((inc) => {
      // Tab filter
      if (tab === "active" && (inc.status === "resolved" || inc.status === "cancelled")) {
        return false;
      }
      if (tab === "resolved" && inc.status !== "resolved" && inc.status !== "cancelled") {
        return false;
      }
      if (tab === "sos" && inc.kind !== "sos") return false;
      if (tab === "incident" && inc.kind !== "incident") return false;
      if (tab === "assistance" && inc.kind !== "assistance") return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchRef = inc.ref.toLowerCase().includes(q);
        const matchCat = inc.category.toLowerCase().includes(q);
        const matchDesc = (inc.description ?? "").toLowerCase().includes(q);
        const matchLoc = (inc.location_text ?? "").toLowerCase().includes(q);
        if (!matchRef && !matchCat && !matchDesc && !matchLoc) return false;
      }

      return true;
    });
  }, [incidents, tab, search]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/tourist"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <ListChecks className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
                My Incidents & Safety Requests
              </h1>
              <p className="text-sm text-muted-foreground">
                Track all emergency alerts, incident reports, and assistance requests submitted by
                you.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/tourist/report">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold">
              <PlusCircle className="h-4 w-4" /> Report Incident
            </Button>
          </Link>
          <Link to="/tourist/sos">
            <Button size="sm" variant="destructive" className="gap-1.5 text-xs font-semibold">
              <Siren className="h-4 w-4" /> SOS
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-1 rounded-xl bg-muted/60 p-1 text-xs font-semibold">
          {[
            { id: "all", label: "All Incidents" },
            { id: "active", label: "Active" },
            { id: "resolved", label: "Resolved / Closed" },
            { id: "sos", label: "SOS Only" },
            { id: "incident", label: "Reports" },
            { id: "assistance", label: "Assistance" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as FilterTab)}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                tab === t.id
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ref, category…"
            className="pl-9 h-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Incident List */}
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : !filtered.length ? (
        <Empty
          title="No incidents found"
          hint="There are no incidents matching your selected filters or search terms."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((inc) => (
            <Link
              key={inc.id}
              to="/tourist/incidents/$incidentId"
              params={{ incidentId: inc.id }}
              className="block group"
            >
              <div className="rounded-2xl border bg-card p-5 hover:border-primary/50 hover:shadow-xs transition-all space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground bg-muted/80 px-2 py-0.5 rounded">
                      {inc.ref}
                    </span>
                    <SeverityBadge severity={inc.severity} />
                    <span className="text-xs uppercase font-semibold text-muted-foreground">
                      {inc.kind}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={inc.status} kind={inc.kind} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground">{inc.category}</h3>
                  {inc.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {inc.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Reported {format(new Date(inc.created_at), "PP p")}</span>
                    {inc.location_text && <span>· Near {inc.location_text}</span>}
                  </div>

                  <div>
                    {inc.responder?.full_name ? (
                      <span className="font-medium text-primary">
                        Assigned to: {inc.responder.full_name}
                      </span>
                    ) : (
                      <span>Awaiting responder assignment</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
