import { getDb } from "@/lib/db/client";

type CompletedFixtureRow = {
  id: string;
  kickoff_at: string;
  home_team_id: string;
  away_team_id: string;
  actual_home_goals: number | null;
  actual_away_goals: number | null;
};

type StandingsEntry = {
  teamId: string;
  points: number;
  goalDiff: number;
  goalsFor: number;
};

export async function buildTeamMatchInputsForFixture(fixtureId: string) {
  const db = getDb();

  const { data: fixture, error: fixtureError } = await db
    .from("fixtures")
    .select(`
      id,
      kickoff_at,
      home_team_id,
      away_team_id,
      home_team:teams!fixtures_home_team_id_fkey(id, name),
      away_team:teams!fixtures_away_team_id_fkey(id, name)
    `)
    .eq("id", fixtureId)
    .single();

  if (fixtureError || !fixture) {
    throw new Error(`Could not load fixture ${fixtureId}: ${fixtureError?.message ?? "No row returned"}`);
  }

  const kickoffAt = fixture.kickoff_at as string;
  const homeTeamId = fixture.home_team_id as string;
  const awayTeamId = fixture.away_team_id as string;

  const homeTeam = Array.isArray(fixture.home_team) ? fixture.home_team[0] : fixture.home_team;
  const awayTeam = Array.isArray(fixture.away_team) ? fixture.away_team[0] : fixture.away_team;

  const [homeHistory, awayHistory, standings] = await Promise.all([
    getCompletedHistoryForTeam(homeTeamId, kickoffAt),
    getCompletedHistoryForTeam(awayTeamId, kickoffAt),
    getStandingsBeforeKickoff(kickoffAt),
  ]);

  const homeInput = buildInputRow({
    fixtureId,
    teamId: homeTeamId,
    opponentTeamId: awayTeamId,
    isHome: true,
    kickoffAt,
    history: homeHistory,
    standings,
  });

  const awayInput = buildInputRow({
    fixtureId,
    teamId: awayTeamId,
    opponentTeamId: homeTeamId,
    isHome: false,
    kickoffAt,
    history: awayHistory,
    standings,
  });

  const { error: upsertError } = await db
    .from("team_match_inputs")
    .upsert([homeInput, awayInput], { onConflict: "fixture_id,team_id" });

  if (upsertError) {
    throw new Error(`Could not upsert team_match_inputs for fixture ${fixtureId}: ${upsertError.message}`);
  }

  return {
    fixtureId,
    createdInputs: 2,
    homeTeamName: homeTeam?.name ?? "Home",
    awayTeamName: awayTeam?.name ?? "Away",
  };
}

async function getCompletedHistoryForTeam(teamId: string, kickoffAt: string): Promise<CompletedFixtureRow[]> {
  const db = getDb();

  const { data, error } = await db
    .from("fixtures")
    .select("id,kickoff_at,home_team_id,away_team_id,actual_home_goals,actual_away_goals")
    .eq("status", "completed")
    .lt("kickoff_at", kickoffAt)
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order("kickoff_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load completed history for team ${teamId}: ${error.message}`);
  }

  return (data ?? []) as CompletedFixtureRow[];
}

async function getStandingsBeforeKickoff(kickoffAt: string): Promise<Map<string, number>> {
  const db = getDb();

  const { data, error } = await db
    .from("fixtures")
    .select("home_team_id,away_team_id,actual_home_goals,actual_away_goals")
    .eq("status", "completed")
    .lt("kickoff_at", kickoffAt);

  if (error) {
    throw new Error(`Could not load standings snapshot: ${error.message}`);
  }

  const table = new Map<string, StandingsEntry>();

  for (const row of data ?? []) {
    const homeTeamId = row.home_team_id as string;
    const awayTeamId = row.away_team_id as string;
    const homeGoals = Number(row.actual_home_goals ?? 0);
    const awayGoals = Number(row.actual_away_goals ?? 0);

    ensureEntry(table, homeTeamId);
    ensureEntry(table, awayTeamId);

    const home = table.get(homeTeamId)!;
    const away = table.get(awayTeamId)!;

    home.goalsFor += homeGoals;
    away.goalsFor += awayGoals;
    home.goalDiff += homeGoals - awayGoals;
    away.goalDiff += awayGoals - homeGoals;

    if (homeGoals > awayGoals) {
      home.points += 3;
    } else if (awayGoals > homeGoals) {
      away.points += 3;
    } else {
      home.points += 1;
      away.points += 1;
    }
  }

  const ranked = [...table.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });

  const positions = new Map<string, number>();
  ranked.forEach((entry, index) => positions.set(entry.teamId, index + 1));
  return positions;
}

function ensureEntry(map: Map<string, StandingsEntry>, teamId: string) {
  if (!map.has(teamId)) {
    map.set(teamId, {
      teamId,
      points: 0,
      goalDiff: 0,
      goalsFor: 0,
    });
  }
}

function buildInputRow(params: {
  fixtureId: string;
  teamId: string;
  opponentTeamId: string;
  isHome: boolean;
  kickoffAt: string;
  history: CompletedFixtureRow[];
  standings: Map<string, number>;
}) {
  const { fixtureId, teamId, opponentTeamId, isHome, kickoffAt, history, standings } = params;

  const allMatches = history;
  const last5 = allMatches.slice(0, 5);
  const last3 = allMatches.slice(0, 3);

  const venueMatches = allMatches.filter((match) =>
    isHome ? match.home_team_id === teamId : match.away_team_id === teamId
  );

  const lastPlayed = allMatches[0]?.kickoff_at ?? null;
  const daysRest = lastPlayed ? daysBetween(lastPlayed, kickoffAt) : 7;

  return {
    fixture_id: fixtureId,
    team_id: teamId,
    opponent_team_id: opponentTeamId,
    is_home: isHome,

    table_position: standings.get(teamId) ?? 10,
    points_per_game: perGame(totalPoints(allMatches, teamId), allMatches.length),
    goal_diff_per_game: perGame(goalDiff(allMatches, teamId), allMatches.length),

    last_3_points: totalPoints(last3, teamId),
    last_5_points: totalPoints(last5, teamId),
    last_5_goals_for: goalsFor(last5, teamId),
    last_5_goals_against: goalsAgainst(last5, teamId),

    home_points_per_game: perGame(totalPoints(venueMatches, teamId), venueMatches.length),
    away_points_per_game: perGame(totalPoints(venueMatches, teamId), venueMatches.length),
    home_goal_diff_per_game: perGame(goalDiff(venueMatches, teamId), venueMatches.length),
    away_goal_diff_per_game: perGame(goalDiff(venueMatches, teamId), venueMatches.length),

    scoring_matches_last_5: scoringMatches(last5, teamId),
    clean_sheets_last_5: cleanSheets(last5, teamId),
    failed_to_score_last_5: failedToScore(last5, teamId),
    conceded_2plus_last_5: conceded2Plus(last5, teamId),

    missing_starters_count: 0,
    missing_key_attacker: false,
    missing_key_defender: false,
    missing_goalkeeper: false,

    days_rest: daysRest,
    had_midweek_match: daysRest <= 4,
  };
}

function totalPoints(matches: CompletedFixtureRow[], teamId: string) {
  return matches.reduce((sum, match) => sum + pointsFromMatch(match, teamId), 0);
}

function goalsFor(matches: CompletedFixtureRow[], teamId: string) {
  return matches.reduce((sum, match) => sum + teamGoals(match, teamId), 0);
}

function goalsAgainst(matches: CompletedFixtureRow[], teamId: string) {
  return matches.reduce((sum, match) => sum + opponentGoals(match, teamId), 0);
}

function goalDiff(matches: CompletedFixtureRow[], teamId: string) {
  return goalsFor(matches, teamId) - goalsAgainst(matches, teamId);
}

function scoringMatches(matches: CompletedFixtureRow[], teamId: string) {
  return matches.filter((match) => teamGoals(match, teamId) > 0).length;
}

function cleanSheets(matches: CompletedFixtureRow[], teamId: string) {
  return matches.filter((match) => opponentGoals(match, teamId) === 0).length;
}

function failedToScore(matches: CompletedFixtureRow[], teamId: string) {
  return matches.filter((match) => teamGoals(match, teamId) === 0).length;
}

function conceded2Plus(matches: CompletedFixtureRow[], teamId: string) {
  return matches.filter((match) => opponentGoals(match, teamId) >= 2).length;
}

function pointsFromMatch(match: CompletedFixtureRow, teamId: string) {
  const gf = teamGoals(match, teamId);
  const ga = opponentGoals(match, teamId);
  if (gf > ga) return 3;
  if (gf === ga) return 1;
  return 0;
}

function teamGoals(match: CompletedFixtureRow, teamId: string) {
  return match.home_team_id === teamId
    ? Number(match.actual_home_goals ?? 0)
    : Number(match.actual_away_goals ?? 0);
}

function opponentGoals(match: CompletedFixtureRow, teamId: string) {
  return match.home_team_id === teamId
    ? Number(match.actual_away_goals ?? 0)
    : Number(match.actual_home_goals ?? 0);
}

function perGame(total: number, count: number) {
  if (!count) return 0;
  return round3(total / count);
}

function round3(value: number) {
  return Math.round(value * 1000) / 1000;
}

function daysBetween(fromIso: string, toIso: string) {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  return Math.max(0, Math.round((to - from) / (1000 * 60 * 60 * 24)));
}