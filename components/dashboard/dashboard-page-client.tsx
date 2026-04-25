"use client";

import { useMemo, useState } from "react";
import type { FixtureListItem, UserPreferencesResponse } from "@/lib/types/api";
import { FocusTeamSelect } from "@/components/shared/focus-team-select";

interface TeamOption { id: string; name: string; }

export function DashboardPageClient({ fixtures, teams, preferences }: { fixtures: FixtureListItem[]; teams: TeamOption[]; preferences: UserPreferencesResponse; }) {
  const [focusTeamId, setFocusTeamId] = useState<string | null>(preferences.focusTeamId);
  const visibleFixtures = useMemo(() => !focusTeamId ? fixtures : fixtures.filter((fixture) => fixture.homeTeam.id === focusTeamId || fixture.awayTeam.id === focusTeamId), [fixtures, focusTeamId]);
  const strongestHome = [...visibleFixtures].filter((fixture) => fixture.prediction).sort((a, b) => (b.prediction?.homeProb ?? 0) - (a.prediction?.homeProb ?? 0)).slice(0, 3);
  const strongestAway = [...visibleFixtures].filter((fixture) => fixture.prediction).sort((a, b) => (b.prediction?.awayProb ?? 0) - (a.prediction?.awayProb ?? 0)).slice(0, 3);
  const strongestDraws = [...visibleFixtures].filter((fixture) => fixture.prediction).sort((a, b) => (b.prediction?.drawProb ?? 0) - (a.prediction?.drawProb ?? 0)).slice(0, 3);
  return (
    <div className="stack">
      <section className="card hero">
        <div>
          <div className="eyebrow">Dashboard</div>
          <h2 className="metric" style={{fontSize: '2rem'}}>League-wide view</h2>
          <div className="muted">Switch between the full slate and a single-club focus lens.</div>
        </div>
        <div style={{minWidth: 280}}><FocusTeamSelect teams={teams} initialFocusTeamId={focusTeamId} onChange={setFocusTeamId} /></div>
      </section>
      <section className="grid grid-3">
        <StatCard title="Strongest home leans" fixtures={strongestHome} field="homeProb" label="Home" />
        <StatCard title="Strongest away leans" fixtures={strongestAway} field="awayProb" label="Away" />
        <StatCard title="Top draw candidates" fixtures={strongestDraws} field="drawProb" label="Draw" />
      </section>
    </div>
  );
}

function StatCard({ title, fixtures, field, label }: { title: string; fixtures: FixtureListItem[]; field: "homeProb" | "awayProb" | "drawProb"; label: string; }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="list">
        {fixtures.length === 0 ? <div className="muted">No fixtures available.</div> : fixtures.map((fixture) => (
          <div key={fixture.fixtureId} className="row">
            <div>{fixture.homeTeam.name} vs {fixture.awayTeam.name}</div>
            <div className="badge">{label} {fixture.prediction?.[field] ?? 0}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
