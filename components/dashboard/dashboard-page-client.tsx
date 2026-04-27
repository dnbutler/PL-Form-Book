"use client";

import { useMemo, useState } from "react";
import type { FixtureListItem, UserPreferencesResponse } from "@/lib/types/api";
import { FocusTeamSelect } from "@/components/shared/focus-team-select";
import { ClubBadge } from "@/components/shared/club-badge";

interface TeamOption { id: string; name: string; }

export function DashboardPageClient({ fixtures, teams, preferences }: { fixtures: FixtureListItem[]; teams: TeamOption[]; preferences: UserPreferencesResponse; }) {
  const [focusTeamId, setFocusTeamId] = useState<string | null>(preferences.focusTeamId);

  const visibleFixtures = useMemo(
    () => !focusTeamId
      ? fixtures
      : fixtures.filter((fixture) => fixture.homeTeam.id === focusTeamId || fixture.awayTeam.id === focusTeamId),
    [fixtures, focusTeamId]
  );

  const strongestHome = [...visibleFixtures]
    .filter((fixture) => fixture.prediction)
    .sort((a, b) => (b.prediction?.homeProb ?? 0) - (a.prediction?.homeProb ?? 0))
    .slice(0, 3);

  const strongestAway = [...visibleFixtures]
    .filter((fixture) => fixture.prediction)
    .sort((a, b) => (b.prediction?.awayProb ?? 0) - (a.prediction?.awayProb ?? 0))
    .slice(0, 3);

  const strongestDraws = [...visibleFixtures]
    .filter((fixture) => fixture.prediction)
    .sort((a, b) => (b.prediction?.drawProb ?? 0) - (a.prediction?.drawProb ?? 0))
    .slice(0, 3);

  const fixturesByGameweek = useMemo(() => {
    const groups = new Map<string, FixtureListItem[]>();

    for (const fixture of visibleFixtures) {
      const key = fixture.gameweek == null ? "Unscheduled" : `Gameweek ${fixture.gameweek}`;
      const existing = groups.get(key) ?? [];
      existing.push(fixture);
      groups.set(key, existing);
    }

    return Array.from(groups.entries()).map(([label, rows]) => ({
      label,
      fixtures: rows.sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()),
    }));
  }, [visibleFixtures]);

  return (
    <div className="stack">
      <section className="card hero">
        <div>
          <div className="eyebrow">Dashboard</div>
          <h2 className="metric" style={{ fontSize: "2rem" }}>League-wide view</h2>
          <div className="muted">Switch between the full slate and a single-club focus lens.</div>
        </div>
        <div style={{ minWidth: 280 }}>
          <FocusTeamSelect teams={teams} initialFocusTeamId={focusTeamId} onChange={setFocusTeamId} />
        </div>
      </section>

      <section className="grid grid-3">
        <StatCard title="Strongest home leans" fixtures={strongestHome} field="homeProb" label="Home" />
        <StatCard title="Strongest away leans" fixtures={strongestAway} field="awayProb" label="Away" />
        <StatCard title="Top draw candidates" fixtures={strongestDraws} field="drawProb" label="Draw" />
      </section>

      {fixturesByGameweek.length === 0 ? (
        <section className="card">
          <div className="muted">No fixtures available.</div>
        </section>
      ) : (
        fixturesByGameweek.map((group) => (
          <section key={group.label} className="card">
            <div className="section-heading">
              <h2>{group.label}</h2>
              <div className="muted">{group.fixtures.length} fixture{group.fixtures.length === 1 ? "" : "s"}</div>
            </div>

            <div className="list">
              {group.fixtures.map((fixture) => (
                <FixtureRow key={fixture.fixtureId} fixture={fixture} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function StatCard({
  title,
  fixtures,
  field,
  label,
}: {
  title: string;
  fixtures: FixtureListItem[];
  field: "homeProb" | "awayProb" | "drawProb";
  label: string;
}) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="list">
        {fixtures.length === 0 ? (
          <div className="muted">No fixtures available.</div>
        ) : (
          fixtures.map((fixture) => (
            <div key={fixture.fixtureId} className="row fixture-row">
              <div>
                <TeamLine fixture={fixture} />
                <div className="muted fixture-meta">
                  {new Date(fixture.kickoffAt).toLocaleString()} · GW {fixture.gameweek ?? "—"}
                </div>
              </div>
              <div className="badge fixture-verdict">
                {label} {fixture.prediction?.[field] ?? 0}%
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FixtureRow({ fixture }: { fixture: FixtureListItem }) {
  return (
    <div className="row fixture-row">
      <div>
        <TeamLine fixture={fixture} />
        <div className="muted fixture-meta">
          {new Date(fixture.kickoffAt).toLocaleString()}
        </div>
      </div>

      <div className="badge fixture-verdict">
        {fixture.prediction ? fixture.prediction.verdict : "No prediction yet"}
      </div>
    </div>
  );
}

function TeamLine({ fixture }: { fixture: FixtureListItem }) {
  return (
    <div className="team-line">
      <ClubBadge name={fixture.homeTeam.name} shortName={fixture.homeTeam.shortName} crestUrl={fixture.homeTeam.crestUrl} />
      <span>{fixture.homeTeam.name}</span>
      <span className="muted">vs</span>
      <ClubBadge name={fixture.awayTeam.name} shortName={fixture.awayTeam.shortName} crestUrl={fixture.awayTeam.crestUrl} />
      <span>{fixture.awayTeam.name}</span>
    </div>
  );
}
