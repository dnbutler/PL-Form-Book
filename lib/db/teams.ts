import { getDb, hasDbEnv } from "./client";
import { demoTeams } from "./demo";

export async function listTeams() {
  if (!hasDbEnv) return demoTeams;
  const db = getDb();
  const { data, error } = await db.from("teams").select("id, name, short_name, code").order("name", { ascending: true });
  if (error) throw new Error("Could not load teams");
  return data ?? [];
}
