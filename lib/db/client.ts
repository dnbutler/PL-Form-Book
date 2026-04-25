import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasDbEnv = Boolean(supabaseUrl && serviceRole);

export function getDb() {
  if (!supabaseUrl || !serviceRole) {
    throw new Error("Supabase environment variables are not configured");
  }
  return createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
}
