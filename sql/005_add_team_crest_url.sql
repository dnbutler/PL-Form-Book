alter table teams
add column if not exists crest_url text;

drop view if exists v_fixture_predictions;

create view v_fixture_predictions as
select
  f.id as fixture_id,
  f.kickoff_at,
  f.gameweek,
  f.status,
  f.home_team_id,
  f.away_team_id,
  ht.name as home_team,
  ht.short_name as home_team_short,
  ht.crest_url as home_team_crest_url,
  at.name as away_team,
  at.short_name as away_team_short,
  at.crest_url as away_team_crest_url,
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
