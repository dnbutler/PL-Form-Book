-- Minimal starter schema
create extension if not exists pgcrypto;

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  short_name text not null
);

create table if not exists fixtures (
  id uuid primary key default gen_random_uuid(),
  kickoff_at timestamptz not null,
  gameweek integer,
  status text not null default 'scheduled',
  venue_name text,
  home_team_id uuid not null references teams(id),
  away_team_id uuid not null references teams(id),
  actual_home_goals integer,
  actual_away_goals integer
);

create table if not exists model_versions (
  id uuid primary key default gen_random_uuid(),
  version_key text not null unique,
  name text not null,
  description text,
  is_active boolean not null default false
);

create table if not exists model_factor_weights (
  id uuid primary key default gen_random_uuid(),
  model_version_id uuid not null references model_versions(id) on delete cascade,
  factor_key text not null,
  factor_name text not null,
  weight_pct numeric(6,3) not null,
  unique (model_version_id, factor_key)
);

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references fixtures(id) on delete cascade,
  model_version_id uuid not null references model_versions(id) on delete restrict,
  home_total numeric(8,4) not null,
  away_total numeric(8,4) not null,
  edge numeric(8,4) not null,
  home_prob numeric(6,3) not null,
  draw_prob numeric(6,3) not null,
  away_prob numeric(6,3) not null,
  verdict text not null,
  confidence text not null,
  rationale text,
  generated_at timestamptz not null default now(),
  unique (fixture_id, model_version_id)
);

create table if not exists prediction_factor_scores (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references predictions(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  factor_key text not null,
  factor_name text not null,
  factor_score numeric(8,4) not null,
  factor_weight numeric(8,4) not null,
  weighted_contribution numeric(8,4) not null,
  unique (prediction_id, team_id, factor_key)
);

create table if not exists prediction_evaluations (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null unique references predictions(id) on delete cascade,
  fixture_id uuid not null references fixtures(id) on delete cascade,
  actual_home_goals integer,
  actual_away_goals integer,
  actual_result text,
  correct_1x2 boolean,
  self_mark integer,
  exact_score_hit boolean,
  brier_score numeric(8,4),
  log_loss numeric(8,4),
  evaluated_at timestamptz not null default now()
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  display_name text
);

create table if not exists user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references app_users(id) on delete cascade,
  focus_team_id uuid references teams(id) on delete set null,
  highlight_focus_fixtures boolean not null default true
);

create or replace view v_fixture_predictions as
select
  f.id as fixture_id,
  f.kickoff_at,
  f.gameweek,
  f.status,
  f.home_team_id,
  f.away_team_id,
  ht.name as home_team,
  ht.short_name as home_team_short,
  at.name as away_team,
  at.short_name as away_team_short,
  p.id as prediction_id,
  mv.version_key,
  p.home_prob,
  p.draw_prob,
  p.away_prob,
  p.verdict,
  p.confidence,
  p.rationale,
  pe.actual_home_goals,
  pe.actual_away_goals,
  pe.actual_result,
  pe.correct_1x2,
  pe.self_mark
from fixtures f
join teams ht on ht.id = f.home_team_id
join teams at on at.id = f.away_team_id
left join predictions p on p.fixture_id = f.id
left join model_versions mv on mv.id = p.model_version_id
left join prediction_evaluations pe on pe.prediction_id = p.id;
