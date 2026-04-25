"use client";

import type { FixtureListItem } from "@/lib/types/api";

export function ResultsPageClient({ fixtures }: { fixtures: FixtureListItem[] }) {
  return (
    <div className="stack">
      <section className="card hero">
        <div>
          <div className="eyebrow">Results</div>
          <h2 className="metric" style={{fontSize: '2rem'}}>Prediction review</h2>
          <div className="muted">Completed fixtures with self-marking and evaluation context.</div>
        </div>
      </section>
      <section className="card">
        <div className="list">
          {fixtures.map((fixture) => (
            <div key={fixture.fixtureId} className="row">
              <div>
                <div>{fixture.homeTeam.name} vs {fixture.awayTeam.name}</div>
                <div className="muted">Prediction: {fixture.prediction?.verdict ?? 'No prediction'}</div>
              </div>
              <div>{fixture.evaluation?.actualHomeGoals != null && fixture.evaluation?.actualAwayGoals != null ? `${fixture.evaluation.actualHomeGoals}-${fixture.evaluation.actualAwayGoals}` : 'Pending'}</div>
              <div className="badge">{fixture.evaluation?.selfMark != null ? `Self-mark ${fixture.evaluation.selfMark}` : '—'}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
