export function FixtureDetailPage({ detail }: { detail: any }) {
  const prediction = detail.prediction;
  const grouped = (detail.factorScores ?? []).reduce((acc: Record<string, any[]>, row: any) => { if (!acc[row.team_id]) acc[row.team_id] = []; acc[row.team_id].push(row); return acc; }, {});
  const homeTeam = Array.isArray(detail.fixture.home_team) ? detail.fixture.home_team[0] : detail.fixture.home_team;
  const awayTeam = Array.isArray(detail.fixture.away_team) ? detail.fixture.away_team[0] : detail.fixture.away_team;
  return (
    <div className="stack">
      <section className="card hero">
        <div>
          <div className="eyebrow">Fixture detail</div>
          <h2 className="metric" style={{fontSize: '2rem'}}>{homeTeam.name} vs {awayTeam.name}</h2>
          <div className="muted">{new Date(detail.fixture.kickoff_at).toLocaleString()} · Gameweek {detail.fixture.gameweek ?? '—'}</div>
        </div>
      </section>
      <section className="grid grid-3">
        <ProbCard label="Home win" value={prediction?.home_prob ?? 0} />
        <ProbCard label="Draw" value={prediction?.draw_prob ?? 0} />
        <ProbCard label="Away win" value={prediction?.away_prob ?? 0} />
      </section>
      <section className="card">
        <div className="row"><div><div className="muted">Verdict</div><div className="metric">{prediction?.verdict ?? 'No prediction'}</div></div><div className="badge">{prediction?.confidence ?? '—'}</div></div>
        <p className="muted" style={{marginTop: 16}}>{prediction?.rationale ?? 'No rationale available.'}</p>
      </section>
      <section className="grid grid-2">
        <FactorTable title={homeTeam.name} rows={grouped[homeTeam.id] ?? []} />
        <FactorTable title={awayTeam.name} rows={grouped[awayTeam.id] ?? []} />
      </section>
    </div>
  );
}

function ProbCard({ label, value }: { label: string; value: number }) {
  return <div className="card"><div className="muted">{label}</div><div className="metric">{value}%</div></div>;
}

function FactorTable({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div className="card">
      <h2>{title} factor breakdown</h2>
      <div className="list">
        {rows.length === 0 ? <div className="muted">No factor scores available.</div> : rows.map((row, idx) => (
          <div key={`${row.factor_key}-${idx}`} className="row">
            <div>{row.factor_name}</div>
            <div>{Number(row.factor_score).toFixed(2)}</div>
            <div className="muted">{Number(row.weighted_contribution).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
