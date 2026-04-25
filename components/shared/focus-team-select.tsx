"use client";

import { useEffect, useState } from "react";

interface TeamOption { id: string; name: string; }

export function FocusTeamSelect({ teams, initialFocusTeamId, onChange }: { teams: TeamOption[]; initialFocusTeamId: string | null; onChange?: (teamId: string | null) => void; }) {
  const [value, setValue] = useState(initialFocusTeamId ?? "ALL");
  const [saving, setSaving] = useState(false);
  useEffect(() => { setValue(initialFocusTeamId ?? "ALL"); }, [initialFocusTeamId]);

  async function handleChange(nextValue: string) {
    setValue(nextValue);
    setSaving(true);
    const focusTeamId = nextValue === "ALL" ? null : nextValue;
    await fetch("/api/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ focusTeamId, highlightFocusFixtures: true }) });
    setSaving(false);
    onChange?.(focusTeamId);
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Focus team</div>
      <select value={value} onChange={(e) => handleChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
        <option value="ALL">All teams</option>
        {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
      </select>
      <div className="text-xs text-slate-500">{saving ? "Saving…" : "Saved preference used across dashboard and fixtures."}</div>
    </div>
  );
}
