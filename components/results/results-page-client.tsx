"use client";

import type { ReviewedFixtureItem } from "@/lib/db/evaluations";

export function ResultsPageClient({ fixtures }: { fixtures: ReviewedFixtureItem[] }) {
  return (
    <div className="stack">
      <section className="card hero">
        <div>
          <div className="eyebrow">Results</div>
          <h2 className="metric" style={{ fontSize: "2rem" }}>Prediction review</h2>
          <div className="muted">Completed fixtures with self-marking and evaluation context.</div>
        </div>
      </section>

      <section className="card">
        <div className="list">
          {fixtures.length === 0 ? (
            <div className="muted">No reviewed fixtures yet.</div>
          ) : (
            fixtures.map((fixture) => (
              <div key={fixture.fixtureId} className="row" style={{ alignItems: "flex-start" }}>
                <div>
                  <div>{fixture.homeTeam.name} vs {fixture.awayTeam.name}</div>
                  <div className="muted">
                    Prediction: {fixture.prediction.verdict ?? "No prediction"}
                    {fixture.prediction.confidence ? ` · ${fixture.prediction.confidence}` : ""}
                  </div>
                  <div className="muted">
                    Probabilities: H {fixture.prediction.homeProb ?? 0}% · D {fixture.prediction.drawProb ?? 0}% · A {fixture.prediction.awayProb ?? 0}%
                  </div>
                </div>

                <div>
                  {fixture.evaluation.actualHomeGoals}-{fixture.evaluation.actualAwayGoals}
                </div>

                <div className="badge">
                  {fixture.evaluation.correct1x2 ? "Correct 1X2" : "Incorrect 1X2"}
                </div>

                <div className="badge">
                  Self-mark {fixture.evaluation.selfMark}
                </div>

                <div className="muted">
                  Brier {fixture.evaluation.brierScore?.toFixed(3) ?? "—"} · LogLoss {fixture.evaluation.logLoss?.toFixed(3) ?? "—"}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}