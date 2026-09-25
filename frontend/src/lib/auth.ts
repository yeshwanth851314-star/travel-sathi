import { supabase } from "@/integrations/supabase/client";
import type { Role } from "./constants";

export async function fetchRole(userId: string): Promise<Role> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw error;
  const roles = (data ?? []).map((r) => r.role);
  if (roles.includes("admin")) return "admin";
  if (roles.includes("responder")) return "responder";
  return "tourist";
}
