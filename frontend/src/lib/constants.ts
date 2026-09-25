import type { Database } from "@/integrations/supabase/types";

export type Severity = Database["public"]["Enums"]["incident_severity"];
export type Status = Database["public"]["Enums"]["incident_status"];
export type Kind = Database["public"]["Enums"]["incident_kind"];
export type Role = Database["public"]["Enums"]["app_role"];
export type Incident = Database["public"]["Tables"]["incidents"]["Row"];

export const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];
export const SEVERITY_RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export const STATUSES: Status[] = [
  "submitted",
  "received",
  "assigned",
  "accepted",
  "en_route",
  "assistance_provided",
  "resolved",
  "cancelled",
];

export function statusLabel(status: Status, kind?: Kind) {
  if (status === "submitted") return kind === "sos" ? "SOS Activated" : "Submitted";
  return {
    received: "Received",
    assigned: "Assigned",
    accepted: "Accepted",
    en_route: "Responder En Route",
    assistance_provided: "Assistance Provided",
    resolved: "Resolved",
    cancelled: "Cancelled",
  }[status];
}

export const ACTIVE_STATUSES: Status[] = [
  "submitted",
  "received",
  "assigned",
  "accepted",
  "en_route",
  "assistance_provided",
];
export const isActive = (s: Status) => ACTIVE_STATUSES.includes(s);

/** Mirrors the transitions the database enforces for staff. */
export const NEXT_STATUSES: Partial<Record<Status, Status[]>> = {
  submitted: ["received", "accepted", "cancelled"],
  received: ["accepted", "cancelled"],
  assigned: ["accepted", "cancelled"],
  accepted: ["en_route", "assistance_provided", "resolved"],
  en_route: ["assistance_provided", "resolved"],
  assistance_provided: ["resolved"],
};

export const KIND_LABEL: Record<Kind, string> = {
  sos: "SOS",
  incident: "Incident report",
  assistance: "Assistance request",
};

export const INCIDENT_CATEGORIES = [
  "Theft",
  "Harassment",
  "Medical Emergency",
  "Accident",
  "Lost Person",
  "Lost Property",
  "Unsafe Location",
  "Natural Hazard",
  "Suspicious Activity",
  "Transportation Problem",
  "Other",
];

export const ASSISTANCE_CATEGORIES = [
  "Medical assistance",
  "Police/security assistance",
  "Lost person assistance",
  "Transport assistance",
  "Tourist assistance",
  "Embassy/consular information",
  "Other",
];

export const INFO_CATEGORIES = [
  "Tourist safety",
  "Medical emergency",
  "Natural disasters",
  "Women's safety",
  "Child safety",
  "Lost passport",
  "Local emergency procedures",
  "General travel safety",
];

export const RESOURCE_TYPES = [
  "Police",
  "Ambulance",
  "Fire",
  "Hospital",
  "Tourist assistance center",
  "Government emergency service",
  "Embassy/consulate",
];

export function roleHome(role: Role | null | undefined) {
  if (role === "admin") return "/admin" as const;
  if (role === "responder") return "/responder" as const;
  return "/tourist" as const;
}

export function errMsg(e: unknown) {
  if (e && typeof e === "object" && "message" in e)
    return String((e as { message: unknown }).message);
  return String(e);
}
