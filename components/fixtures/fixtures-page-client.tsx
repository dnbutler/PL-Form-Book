"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FixtureListItem, UserPreferencesResponse } from "@/lib/types/api";
import { FocusTeamSelect } from "@/components/shared/focus-team-select";
import { ClubBadge } from "@/components/shared/club-badge";

interface TeamOption { id: string; name: string; }

export function FixturesPageClient({ fixtures, teams, preferences }: { fixtures: FixtureListItem[]; teams: TeamOption[]; preferences: UserPreferencesResponse; }) {
  const [query, setQuery] = useState("");
  const [focusTeamId, setFocusTeamId] = useState<string | null>(preferences.focusTeamId);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = fixtures;
    if (focusTeamId) rows = rows.filter((fixture) => fixture.homeTeam.id === focusTeamId || fixture.awayTeam.id === focusTeamId);
    if (!q) return rows;
    return rows.filter((fixture) => fixture.homeTeam.name.toLowerCase().includes(q) || fixture.awayTeam.name.toLowerCase().includes(q) || String(fixture.gameweek ?? "").includes(q));
  }, [fixtures, query, focusTeamId]);

  return (
    <div className="stack">
      <section className="card hero">
        <div>
          <div className="eyebrow">Fixtures</div>
          <h2 className="metric" style={{fontSize: '2rem'}}>Upcoming slate</h2>
          <div className="muted">Open any fixture to inspect the stored prediction and factor breakdown.</div>
        </div>
        <div style={{minWidth: 280}}><FocusTeamSelect teams={teams} initialFocusTeamId={focusTeamId} onChange={setFocusTeamId} /></div>
      </section>
      <section className="card">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search fixtures" className="input" />
        <div className="list" style={{marginTop: 16}}>
          {filtered.map((fixture) => {
            const isFocus = !!focusTeamId && (fixture.homeTeam.id === focusTeamId || fixture.awayTeam.id === focusTeamId);
            return (
              <Link key={fixture.fixtureId} href={`/fixtures/${fixture.fixtureId}`} className={`row ${isFocus ? 'row-focus' : ''}`}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ClubBadge name={fixture.homeTeam.name} shortName={fixture.homeTeam.shortName} crestUrl={fixture.homeTeam.crestUrl} />
                    <span>{fixture.homeTeam.name}</span>
                    <span className="muted">vs</span>
                    <ClubBadge name={fixture.awayTeam.name} shortName={fixture.awayTeam.shortName} crestUrl={fixture.awayTeam.crestUrl} />
                    <span>{fixture.awayTeam.name}</span>
                  </div>
                  <div className="muted">{new Date(fixture.kickoffAt).toLocaleString()} · GW {fixture.gameweek ?? '—'}</div>
                </div>
                <div className="badge">{fixture.prediction ? fixture.prediction.verdict : 'No prediction yet'}</div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
