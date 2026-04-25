import { getDb, hasDbEnv } from "./client";
import { demoPreferences } from "./demo";
import type { UserPreferencesResponse } from "@/lib/types/api";

const DEFAULT_USER_EMAIL = "local-user@example.com";

export async function getOrCreateLocalUserId(): Promise<string> {
  const db = getDb();
  const { data: existing } = await db.from("app_users").select("id").eq("email", DEFAULT_USER_EMAIL).maybeSingle();
  if (existing?.id) return existing.id;
  const { data: created, error: insertError } = await db.from("app_users").insert({ email: DEFAULT_USER_EMAIL, display_name: "Local User" }).select("id").single();
  if (insertError || !created) throw new Error("Could not create local user");
  return created.id;
}

export async function getPreferences(): Promise<UserPreferencesResponse> {
  if (!hasDbEnv) return demoPreferences;
  const userId = await getOrCreateLocalUserId();
  const db = getDb();
  const { data, error } = await db.from("user_preferences").select("focus_team_id, highlight_focus_fixtures").eq("user_id", userId).maybeSingle();
  if (error) throw new Error("Could not load preferences");
  return { focusTeamId: data?.focus_team_id ?? null, highlightFocusFixtures: data?.highlight_focus_fixtures ?? true };
}

export async function updatePreferences(input: { focusTeamId: string | null; highlightFocusFixtures: boolean; }): Promise<UserPreferencesResponse> {
  if (!hasDbEnv) return input;
  const userId = await getOrCreateLocalUserId();
  const db = getDb();
  const { error } = await db.from("user_preferences").upsert({ user_id: userId, focus_team_id: input.focusTeamId, highlight_focus_fixtures: input.highlightFocusFixtures }, { onConflict: "user_id" });
  if (error) throw new Error("Could not update preferences");
  return input;
}
