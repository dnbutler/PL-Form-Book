# Premier League Form Book

A Next.js + Supabase app for:
- building pre-match team input snapshots
- generating 1X2 predictions for scheduled fixtures
- storing factor scores
- reviewing completed fixtures with evaluation metrics

## Stack

- Next.js 15
- React 19
- Supabase
- TypeScript

## Local setup

```bash
npm install
cp .env.example .env.local
```

## Operations

The app expects the local Next.js server to be running before calling the operational scripts:

```bash
npm run dev
```

In a separate terminal, run the weekly pipeline:

```bash
npm run weekly:run
```

This runs fixture sync first, then builds slate inputs and predictions for scheduled fixtures:

```bash
npm run fixtures:sync && npm run slate:run
```

Required local environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
FOOTBALL_DATA_API_TOKEN
```
