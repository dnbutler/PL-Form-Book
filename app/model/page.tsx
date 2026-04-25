import { getActiveModelVersion } from "@/lib/db/queries";

export default async function ModelPage() {
  const model = await getActiveModelVersion();
  return (
    <div className="stack">
      <section className="card hero">
        <div className="eyebrow">Model</div>
        <h2 className="metric" style={{fontSize: '2rem'}}>{model.versionKey}</h2>
        <div className="muted">Rules-based weighting model with room for richer v2 feature ingestion.</div>
      </section>
      <section className="card">
        <h2>Factor weights</h2>
        <div className="list">
          {model.factorWeights.map((weight) => (
            <div key={weight.factorKey} className="row">
              <div>{weight.factorName}</div>
              <div className="badge">{weight.weightPct}%</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
