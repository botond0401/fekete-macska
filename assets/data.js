const DATA_URL = new URL("../data/games.json", import.meta.url);

export const ROUND_TOTAL = 18; // 7 red cards × 1 + red ace 4 + makk felső 7
export const GAME_END = 100;

export async function loadData() {
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  data.games.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
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
      const c = playerGameCounts(g, p);
      s.zeroRounds += c.zero;
      s.bumszli += c.bumszli;
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

// Seating is circular, so it's normalized to always start with the first
// player (Apa); the other three in seat order give 3! = 6 possible orders.
export function seatingOrder(game, players) {
  const seats = game.seating || [];
  const start = seats.indexOf(players[0]);
  if (start === -1) return players;
  return [...seats.slice(start), ...seats.slice(0, start)];
}

export function seatingLabel(game, players) {
  return game.seating ? seatingOrder(game, players).join(" – ") : "";
}

export function allSeatingLabels(players) {
  const [anchor, ...rest] = players;
  const perms = arr => arr.length <= 1 ? [arr]
    : arr.flatMap((x, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).map(p => [x, ...p]));
  return perms(rest).map(p => [anchor, ...p].join(" – "));
}

export function playerGameCounts(game, player) {
  let zero = 0, bumszli = 0;
  for (const r of game.rounds) {
    if ((r[player] || 0) === 0) zero++;
    if ((r[player] || 0) === ROUND_TOTAL) bumszli++;
  }
  return { zero, bumszli };
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
