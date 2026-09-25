import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateEvidenceFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      ok: false,
      error: "Invalid file format. Allowed formats: JPG, PNG, WEBP, or PDF.",
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: "File is too large. Maximum allowed size is 10 MB.",
    };
  }
  return { ok: true };
}

export async function uploadEvidenceFile(userId: string, file: File): Promise<string> {
  const validation = validateEvidenceFile(file);
  if (!validation.ok) {
    throw new Error(validation.error);
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const path = `${userId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from("evidence").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export function useEvidenceUrl(evidencePath: string | null | undefined) {
  return useQuery({
    queryKey: ["evidence_url", evidencePath ?? ""],
    enabled: !!evidencePath,
    staleTime: 1000 * 60 * 10, // 10 minutes
    queryFn: async () => {
      if (!evidencePath) return null;
      const { data, error } = await supabase.storage
        .from("evidence")
        .createSignedUrl(evidencePath, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
