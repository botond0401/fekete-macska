// Swapped for the private data store once the UI is finalized.
const DATA_URL = new URL("../data/mock.json", import.meta.url);

export const ROUND_TOTAL = 18; // 7 red cards × 1 + red ace 4 + makk felső 7
export const GAME_END = 100;

export async function loadData() {
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  data.games.sort((a, b) => a.date.localeCompare(b.date));
  return data;
}

export function finalScores(game, players) {
  const totals = Object.fromEntries(players.map(p => [p, 0]));
  for (const r of game.rounds) for (const p of players) totals[p] += r[p] || 0;
  return totals;
}

// Lowest score is 1st; ties share the better place (1, 2, 2, 4).
export function placements(game, players) {
  const totals = finalScores(game, players);
  const places = {};
  for (const p of players) places[p] = 1 + players.filter(q => totals[q] < totals[p]).length;
  return places;
}

export function cumulative(game, players) {
  const running = Object.fromEntries(players.map(p => [p, 0]));
  return game.rounds.map(r => {
    for (const p of players) running[p] += r[p] || 0;
    return { ...running };
  });
}

export function playerStats(data) {
  const { players, games } = data;
  const stats = Object.fromEntries(players.map(p => [p, {
    name: p, places: [0, 0, 0, 0], totalPoints: 0, zeroRounds: 0, bumszli: 0, games: 0,
  }]));

  for (const g of games) {
    const totals = finalScores(g, players);
    const places = placements(g, players);
    for (const p of players) {
      const s = stats[p];
      s.games++;
      s.places[places[p] - 1]++;
      s.totalPoints += totals[p];
      for (const r of g.rounds) {
        if ((r[p] || 0) === 0) s.zeroRounds++;
        if ((r[p] || 0) === ROUND_TOTAL) s.bumszli++;
      }
    }
  }

  return players.map(p => {
    const s = stats[p];
    const n = s.games || 1;
    return {
      ...s,
      winRate: s.places[0] / n,
      avgPoints: s.totalPoints / n,
      avgZeroRounds: s.zeroRounds / n,
      avgBumszli: s.bumszli / n,
    };
  }).sort((a, b) =>
    b.places[0] - a.places[0] || b.places[1] - a.places[1] || b.places[2] - a.places[2] || a.avgPoints - b.avgPoints
  );
}

export function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" });
}

export function daysSince(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const then = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - then) / 86400000);
}

export function fmt(n, digits = 1) {
  return n.toLocaleString("hu-HU", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
