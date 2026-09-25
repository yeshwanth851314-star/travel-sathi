import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ExternalLink, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "./badges";
import { Loading, ErrorState, Empty, PageHeader } from "./states";
import { cn } from "@/lib/utils";
import { errMsg } from "@/lib/constants";

export function NotificationsPage({
  userId,
  limit,
  incidentBasePath,
}: {
  userId: string;
  limit?: number;
  incidentBasePath?: "/tourist/incidents" | "/responder/incidents" | "/admin/incidents";
}) {
  const qc = useQueryClient();
  const { data, isLoading, error } = useNotifications(userId);
  const unread = data?.filter((n) => !n.is_read).length ?? 0;

  async function markRead(id?: string) {
    let q = supabase.from("notifications").update({ is_read: true }).eq("user_id", userId);
    q = id ? q.eq("id", id) : q.eq("is_read", false);
    const { error } = await q;
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    if (!id) {
      toast.success("All notifications marked as read.");
    }
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  const items = limit ? data?.slice(0, limit) : data;

  return (
    <div>
      {!limit && (
        <PageHeader
          title="Notifications"
          desc={`${unread} unread notification${unread === 1 ? "" : "s"}`}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={!unread}
            onClick={() => markRead()}
            className="gap-1.5"
          >
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </Button>
        </PageHeader>
      )}
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : !items?.length ? (
        <Empty
          title="No notifications yet"
          hint="You'll see real-time updates here when incidents or safety alerts occur."
        />
      ) : (
        <ul className="divide-y rounded-xl border bg-card shadow-2xs">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition-colors",
                !n.is_read && "bg-accent/40",
              )}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {!n.is_read && (
                    <span className="h-2 w-2 rounded-full bg-destructive" aria-label="Unread" />
                  )}
                  <span className="text-sm font-semibold text-foreground">{n.title}</span>
                  {(n.priority === "critical" || n.priority === "high") && (
                    <SeverityBadge severity={n.priority} />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-0.5">
                  <span>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                  {n.incident?.ref && (
                    <span className="font-mono font-semibold text-foreground">
                      · {n.incident.ref}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {n.incident_id && incidentBasePath && (
                  <Link
                    to={`${incidentBasePath}/$incidentId`}
                    params={{ incidentId: n.incident_id }}
                    onClick={() => {
                      if (!n.is_read) markRead(n.id);
                    }}
                  >
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                      View Incident <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
                {!n.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => markRead(n.id)}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
