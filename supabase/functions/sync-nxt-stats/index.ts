import { createClient } from "jsr:@supabase/supabase-js@2";

const SHEET_ID = "1rkVyhgGVASxqHL3NbPZ0NOmsKxekLQCtBNb6WQaIU8Y";
const PLAYER_STATS_GID = "2106129791";
const SEASON = "S3";
const TIER = "NXT";

const COL = {
  POS: 1, NAME: 2, TEAM: 3, GP: 4, MIN: 5, PTS: 6, REB: 7, AST: 8,
  STL: 9, BLK: 10, TO: 11, FGM: 12, FGA: 13, THREE_PTM: 14, THREE_PTA: 15,
  FTM: 16, FTA: 17, FG_PCT: 18, THREE_PT_PCT: 19, FT_PCT: 20, TS_PCT: 21,
  EFG_PCT: 22, SCORE: 23, FLS: 24, PRF: 25, DNK: 26, DD: 27, TD: 28,
  TWENTY_PLUS_PTS: 29, GH_MIN: 31, GH_PTS: 32, GH_REB: 33, GH_AST: 34,
  GH_STL: 35, GH_BLK: 36, GH_PRF: 37, GA_MIN: 39, GA_PTS: 40, GA_REB: 41,
  GA_AST: 42, GA_STL: 43, GA_BLK: 44, GA_SCORE: 45,
};

function pct(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(v.replace("%", "").trim());
  return Number.isNaN(n) ? null : n / 100;
}

function int(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseInt(v.replace(/,/g, ""), 10);
  return Number.isNaN(n) ? null : n;
}

function flt(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
}

function teamCode(v: string | undefined): string {
  return v?.split("/")[0]?.trim() ?? "";
}

function isFillerPlayer(name: string): boolean {
  return name.trim().toLowerCase().includes("filler player");
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "", inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === "," && !inQ) { cells.push(cur); cur = ""; continue; }
    cur += ch;
  }
  cells.push(cur);
  return cells;
}

async function fetchCsv(url: string): Promise<string[][]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
  const text = await res.text();
  return text.split("\n").map(parseCsvLine);
}

Deno.serve(async (_req) => {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${PLAYER_STATS_GID}`;
    const rawRows = await fetchCsv(url);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let headerFound = false;
    let inserted = 0, updated = 0, errors = 0;

    for (const row of rawRows) {
      const name = (row[COL.NAME] ?? "").trim();
      const pos = (row[COL.POS] ?? "").trim();

      if (!headerFound) {
        if (name === "NAME") { headerFound = true; }
        continue;
      }
      if (!name || !pos || isFillerPlayer(name)) continue;

      const team = teamCode(row[COL.TEAM]);
      if (!team) continue;

      const player = {
        season: SEASON,
        tier: TIER,
        player_name: name,
        team_name: team,
        position: pos,
        gp: int(row[COL.GP]),
        min_total: int(row[COL.MIN]),
        pts_total: int(row[COL.PTS]),
        reb_total: int(row[COL.REB]),
        ast_total: int(row[COL.AST]),
        stl_total: int(row[COL.STL]),
        blk_total: int(row[COL.BLK]),
        turnovers_total: int(row[COL.TO]),
        fgm: int(row[COL.FGM]),
        fga: int(row[COL.FGA]),
        three_ptm: int(row[COL.THREE_PTM]),
        three_pta: int(row[COL.THREE_PTA]),
        ftm: int(row[COL.FTM]),
        fta: int(row[COL.FTA]),
        fg_pct: pct(row[COL.FG_PCT]),
        three_pt_pct: pct(row[COL.THREE_PT_PCT]),
        ft_pct: pct(row[COL.FT_PCT]),
        ts_pct: pct(row[COL.TS_PCT]),
        efg_pct: pct(row[COL.EFG_PCT]),
        score: int(row[COL.SCORE]),
        fls: int(row[COL.FLS]),
        prf: int(row[COL.PRF]),
        dnk: int(row[COL.DNK]),
        dd: int(row[COL.DD]),
        td: int(row[COL.TD]),
        twenty_plus_pts: int(row[COL.TWENTY_PLUS_PTS]),
        game_highs: {
          min: int(row[COL.GH_MIN]),
          pts: int(row[COL.GH_PTS]),
          reb: int(row[COL.GH_REB]),
          ast: int(row[COL.GH_AST]),
          stl: int(row[COL.GH_STL]),
          blk: int(row[COL.GH_BLK]),
          prf: int(row[COL.GH_PRF]),
        },
        game_averages: {
          min: flt(row[COL.GA_MIN]),
          pts: flt(row[COL.GA_PTS]),
          reb: flt(row[COL.GA_REB]),
          ast: flt(row[COL.GA_AST]),
          stl: flt(row[COL.GA_STL]),
          blk: flt(row[COL.GA_BLK]),
          score: flt(row[COL.GA_SCORE]),
        },
      };

      const { error } = await supabase
        .from("player_season_stats")
        .upsert(player, { onConflict: "season,tier,player_name" });

      if (error) {
        errors++;
      } else if (player.gp && player.gp > 0) {
        inserted++;
      } else {
        updated++;
      }
    }

    return new Response(JSON.stringify({
      status: "ok",
      inserted, updated, errors,
      total: inserted + updated + errors,
    }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({
      status: "error",
      message: String(err),
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
