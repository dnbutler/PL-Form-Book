"use client";

import { useState } from "react";

type RunState = "idle" | "running" | "success" | "error";

type OperationResult = {
  name: string;
  ok: boolean;
  status: number;
  body: unknown;
};

export function OperationsPageClient() {
  const [state, setState] = useState<RunState>("idle");
  const [message, setMessage] = useState<string>("No operation has been run yet.");
  const [results, setResults] = useState<OperationResult[]>([]);
  const [adminToken, setAdminToken] = useState<string>("");

  async function postJson(name: string, url: string): Promise<OperationResult> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-admin-run-token": adminToken,
      },
    });
    const text = await response.text();

    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    return {
      name,
      ok: response.ok,
      status: response.status,
      body,
    };
  }

  async function runOperation(kind: "fixtures" | "slate" | "weekly") {
    if (!adminToken.trim()) {
      setState("error");
      setMessage("Enter the admin run token before running an operation.");
      return;
    }

    setState("running");
    setResults([]);
    setMessage(
      kind === "weekly"
        ? "Running fixture sync, then slate run..."
        : kind === "fixtures"
          ? "Running fixture sync..."
          : "Running slate run..."
    );

    try {
      const nextResults: OperationResult[] = [];

      if (kind === "fixtures" || kind === "weekly") {
        const fixtureResult = await postJson("Fixture sync", "/api/fixtures/sync");
        nextResults.push(fixtureResult);

        if (!fixtureResult.ok) {
          setResults(nextResults);
          setState("error");
          setMessage("Fixture sync failed.");
          return;
        }
      }

      if (kind === "slate" || kind === "weekly") {
        const slateResult = await postJson("Slate run", "/api/slate/run");
        nextResults.push(slateResult);

        if (!slateResult.ok) {
          setResults(nextResults);
          setState("error");
          setMessage("Slate run failed.");
          return;
        }
      }

      setResults(nextResults);
      setState("success");
      setMessage(
        kind === "weekly"
          ? "Weekly pipeline completed successfully."
          : kind === "fixtures"
            ? "Fixture sync completed successfully."
            : "Slate run completed successfully."
      );
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Operation failed.");
    }
  }

  const isRunning = state === "running";

  return (
    <div className="stack">
      <section className="card hero">
        <div>
          <div className="eyebrow">Operations</div>
          <h2 className="metric" style={{ fontSize: "2rem" }}>Admin run controls</h2>
          <div className="muted">Trigger fixture sync and slate prediction workflows from the browser.</div>
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Admin token</h2>
        <p className="muted">Enter the local admin run token. It is sent as an <code>x-admin-run-token</code> header.</p>
        <input
          className="input"
          type="password"
          value={adminToken}
          onChange={(event) => setAdminToken(event.target.value)}
          placeholder="ADMIN_RUN_TOKEN"
        />
      </section>

      <section className="grid grid-3">
        <OperationCard
          title="Sync fixtures"
          description="Pull scheduled Premier League fixtures from football-data.org into Supabase."
          buttonLabel="Run fixture sync"
          disabled={isRunning}
          onRun={() => runOperation("fixtures")}
        />

        <OperationCard
          title="Run slate"
          description="Build inputs and generate predictions for currently scheduled fixtures."
          buttonLabel="Run slate"
          disabled={isRunning}
          onRun={() => runOperation("slate")}
        />

        <OperationCard
          title="Weekly pipeline"
          description="Run fixture sync first, then run the slate workflow."
          buttonLabel="Run weekly pipeline"
          disabled={isRunning}
          onRun={() => runOperation("weekly")}
        />
      </section>

      <section className="card">
        <div className="row">
          <div>
            <h2 style={{ margin: 0 }}>Latest operation</h2>
            <div className="muted">{message}</div>
          </div>
          <div className="badge">{state}</div>
        </div>

        {results.length > 0 && (
          <div className="list" style={{ marginTop: 16 }}>
            {results.map((result) => (
              <div key={result.name} className="card">
                <h3 style={{ marginTop: 0 }}>{result.name}</h3>
                <div className="muted">HTTP {result.status} · {result.ok ? "OK" : "Failed"}</div>
                <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>
                  {JSON.stringify(result.body, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function OperationCard({
  title,
  description,
  buttonLabel,
  disabled,
  onRun,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  disabled: boolean;
  onRun: () => void;
}) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      <button className="button" disabled={disabled} onClick={onRun}>
        {disabled ? "Running..." : buttonLabel}
      </button>
    </div>
  );
}
