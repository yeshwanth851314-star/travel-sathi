import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

/** Subscribe to realtime changes on a table and invalidate the given query keys. */
export function useRealtimeInvalidate(table: string, keys: string[][], filter?: string) {
  const qc = useQueryClient();
  const sig = JSON.stringify(keys) + (filter ?? "");
  useEffect(() => {
    const channel = supabase
      .channel(`rt-${table}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        () => keys.forEach((k) => qc.invalidateQueries({ queryKey: k })),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, sig]);
}

const INCIDENT_SELECT =
  "*, reporter:profiles!incidents_reporter_id_fkey(id, full_name, email, phone), responder:profiles!incidents_assigned_responder_id_fkey(id, full_name, email)";

export function useIncidents(
  opts: { reporterId?: string; responderId?: string; enabled?: boolean } = {},
) {
  useRealtimeInvalidate("incidents", [["incidents"]]);
  return useQuery({
    queryKey: ["incidents", opts.reporterId ?? "", opts.responderId ?? ""],
    enabled: opts.enabled ?? true,
    refetchInterval: 30000,
    queryFn: async () => {
      let q = supabase
        .from("incidents")
        .select(INCIDENT_SELECT)
        .order("created_at", { ascending: false })
        .limit(500);
      if (opts.reporterId) q = q.eq("reporter_id", opts.reporterId);
      if (opts.responderId) q = q.eq("assigned_responder_id", opts.responderId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useIncident(id: string) {
  useRealtimeInvalidate("incidents", [["incident", id]], `id=eq.${id}`);
  return useQuery({
    queryKey: ["incident", id],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidents")
        .select(INCIDENT_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useTimeline(id: string) {
  useRealtimeInvalidate("incident_timeline", [["timeline", id]], `incident_id=eq.${id}`);
  return useQuery({
    queryKey: ["timeline", id],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incident_timeline")
        .select("*")
        .eq("incident_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useNotifications(userId: string | undefined) {
  useRealtimeInvalidate(
    "notifications",
    [["notifications"]],
    userId ? `user_id=eq.${userId}` : undefined,
  );
  return useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, incident:incidents(ref)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

export function useAlerts(all = false) {
  useRealtimeInvalidate("safety_alerts", [["alerts"]]);
  return useQuery({
    queryKey: ["alerts", all],
    queryFn: async () => {
      let q = supabase.from("safety_alerts").select("*").order("created_at", { ascending: false });
      if (!all) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data.filter((a) => all || !a.ends_at || new Date(a.ends_at) > new Date());
    },
  });
}

export function useSafetyInfo() {
  return useQuery({
    queryKey: ["safety_info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("safety_information")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useResources() {
  return useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("emergency_resources").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useEmergencyContacts(userId: string | undefined) {
  useRealtimeInvalidate(
    "emergency_contacts",
    [["emergency_contacts"]],
    userId ? `user_id=eq.${userId}` : undefined,
  );
  return useQuery({
    queryKey: ["emergency_contacts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", userId!)
        .order("priority", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useProfile(userId: string | undefined) {
  useRealtimeInvalidate(
    "profiles",
    [["profile", userId ?? ""]],
    userId ? `id=eq.${userId}` : undefined,
  );
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useTouristProfile(userId: string | undefined) {
  useRealtimeInvalidate(
    "tourist_profiles",
    [["tourist_profile", userId ?? ""]],
    userId ? `user_id=eq.${userId}` : undefined,
  );
  return useQuery({
    queryKey: ["tourist_profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tourist_profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useIncidentNotes(incidentId: string | undefined) {
  useRealtimeInvalidate(
    "incident_notes",
    [["incident_notes", incidentId ?? ""]],
    incidentId ? `incident_id=eq.${incidentId}` : undefined,
  );
  return useQuery({
    queryKey: ["incident_notes", incidentId],
    enabled: !!incidentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incident_notes")
        .select("*, author:profiles!incident_notes_author_id_fkey(id, full_name, email)")
        .eq("incident_id", incidentId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useIncidentLocations(incidentId: string | undefined) {
  useRealtimeInvalidate(
    "incident_locations",
    [["incident_locations", incidentId ?? ""]],
    incidentId ? `incident_id=eq.${incidentId}` : undefined,
  );
  return useQuery({
    queryKey: ["incident_locations", incidentId],
    enabled: !!incidentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incident_locations")
        .select("*")
        .eq("incident_id", incidentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAllUsers() {
  useRealtimeInvalidate("profiles", [["all_users"]]);
  useRealtimeInvalidate("user_roles", [["all_users"]]);
  return useQuery({
    queryKey: ["all_users"],
    queryFn: async () => {
      const [{ data: profiles, error: pError }, { data: roles, error: rError }] = await Promise.all(
        [
          supabase.from("profiles").select("*").order("created_at", { ascending: false }),
          supabase.from("user_roles").select("user_id, role"),
        ],
      );
      if (pError) throw pError;
      if (rError) throw rError;
      const roleMap = new Map<string, Database["public"]["Enums"]["app_role"]>();
      for (const r of roles ?? []) {
        roleMap.set(r.user_id, r.role);
      }
      return (profiles ?? []).map((p) => ({
        ...p,
        role: roleMap.get(p.id) ?? ("tourist" as Database["public"]["Enums"]["app_role"]),
      }));
    },
  });
}

export function useAuditLogs() {
  useRealtimeInvalidate("audit_logs", [["audit_logs"]]);
  return useQuery({
    queryKey: ["audit_logs"],
    queryFn: async () => {
      const [{ data: logs, error }, { data: profiles }] = await Promise.all([
        supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("profiles").select("id, full_name, email"),
      ]);
      if (error) throw error;
      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, { id: p.id, full_name: p.full_name, email: p.email }]),
      );
      return (logs ?? []).map((l) => ({
        ...l,
        actor: l.actor_id ? (profileMap.get(l.actor_id) ?? null) : null,
      }));
    },
  });
}
