create table if not exists fixture_team_trends (
  id uuid primary key default gen_random_uuid(),

  fixture_id uuid not null references fixtures(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,

  external_match_id text not null,
  external_team_id text not null,

  side text not null check (side in ('home', 'away')),
  trend_window integer not null,
  consider_side boolean not null default true,

  avg_goals numeric(8,4),
  avg_goals_scored numeric(8,4),
  avg_goals_conceded numeric(8,4),
  avg_points numeric(8,4),

  pct_wins numeric(8,4),
  pct_draws numeric(8,4),
  pct_losses numeric(8,4),
  pct_bts numeric(8,4),
  pct_fts numeric(8,4),

  pct_o_15 numeric(8,4),
  pct_o_25 numeric(8,4),
  pct_o_35 numeric(8,4),
  pct_u_15 numeric(8,4),
  pct_u_25 numeric(8,4),
  pct_u_35 numeric(8,4),

  pct_1st_hf_o_05 numeric(8,4),
  pct_1st_hf_o_15 numeric(8,4),
  pct_2nd_hf_o_05 numeric(8,4),
  pct_2nd_hf_o_15 numeric(8,4),

  form text,
  match_ids integer[],
  competitions text,
  window_start_date date,
  window_end_date date,

  raw jsonb not null,
  synced_at timestamptz not null default now(),

  unique (fixture_id, team_id, side, trend_window, consider_side)
);

create index if not exists fixture_team_trends_fixture_id_idx
on fixture_team_trends(fixture_id);

create index if not exists fixture_team_trends_team_id_idx
on fixture_team_trends(team_id);
