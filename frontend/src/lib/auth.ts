import { supabase } from "@/integrations/supabase/client";
import type { Role } from "./constants";

let roleCache: { userId: string; role: Role; expiresAt: number } | null = null;
const ROLE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function setCachedRole(userId: string, role: Role) {
  roleCache = { userId, role, expiresAt: Date.now() + ROLE_TTL_MS };
}

export function clearAuthCache() {
  roleCache = null;
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT" || event === "USER_DELETED") {
      clearAuthCache();
    }
  });
}

export async function fetchRole(userId: string, forceRefresh = false): Promise<Role> {
  if (
    !forceRefresh &&
    roleCache &&
    roleCache.userId === userId &&
    roleCache.expiresAt > Date.now()
  ) {
    return roleCache.role;
  }

  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw error;
  const roles = (data ?? []).map((r) => r.role);
  const resolved: Role = roles.includes("admin")
    ? "admin"
    : roles.includes("responder")
      ? "responder"
      : "tourist";

  setCachedRole(userId, resolved);
  return resolved;
}
