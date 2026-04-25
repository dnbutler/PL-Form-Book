# Premier League Form Book V1

Merged starter bundle including:
- initial app scaffold
- prediction scoring engine
- prediction persistence hooks
- fixture detail page
- focus-team preference route and UI
- results ingest and evaluation writer

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

If Supabase env vars are missing, the app falls back to demo data for browsing the UI.

## Next steps

1. Run the SQL files in `sql/`.
2. Configure `.env.local` with Supabase values.
3. Add real fixture/result ingestion.
4. Build `team_match_inputs` snapshots before prediction generation.
