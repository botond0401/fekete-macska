import {
  loadData, finalScores, placements, cumulative, formatDate, seatingLabel, seatingOrder, playerGameCounts, ROUND_TOTAL,
} from "./data.js?v=20261110121046";

const statusEl = document.getElementById("status");

function roundPoints(points) {
  const cls = points === 0 ? " zero" : points === ROUND_TOTAL ? " bumszli" : "";
  return `<span class="round-pts${cls}">${points}</span>`;
}

(async function init() {
  try {
    const { players, games } = await loadData();
    const id = new URLSearchParams(location.search).get("id");
    const index = games.findIndex(g => g.id === id);
    if (index === -1) {
      statusEl.textContent = "Nincs ilyen játszma.";
      return;
    }
    const game = games[index];
    const totals = finalScores(game, players);
    const places = placements(game, players);
    const cum = cumulative(game, players);

    document.getElementById("title").textContent = formatDate(game.date);
    document.getElementById("subtitle").textContent = `${index + 1}. játszma · ${game.rounds.length} kör`;
    document.title = `${formatDate(game.date)} · Kovács család: Fekete Macska`;

    const meta = [
      ["Helyszín", game.location],
      ["Sorrend", seatingLabel(game, players)],
      ["Kezdőjátékos", game.starter],
    ].filter(([, v]) => v);
    document.getElementById("meta").innerHTML = meta.map(([k, v]) => `<span>${k}: <b>${v}</b></span>`).join("");

    const ordered = [...players].sort((a, b) => totals[a] - totals[b]);
    document.getElementById("result").innerHTML = ordered.map(p => {
      const c = playerGameCounts(game, p);
      return `
      <li>
        <div class="rank-row">
          <span class="rank-num">${places[p]}.</span>
          <span class="rank-name">${p}</span>
          <span class="rank-wins">${totals[p]} pont
            <span class="result-meta">${c.bumszli} bumszli · ${c.zero} nullázás</span>
          </span>
        </div>
      </li>`;
    }).join("");

    const order = seatingOrder(game, players);

    document.getElementById("thead").innerHTML =
      `<tr><th>Kör</th>${order.map(p => `<th>${p}</th>`).join("")}</tr>`;

    document.getElementById("tbody").innerHTML = game.rounds.map((r, i) => `
      <tr>
        <td class="muted">${i + 1}.</td>
        ${order.map(p => `<td><span class="cum">${cum[i][p]}</span>${roundPoints(r[p] || 0)}</td>`).join("")}
      </tr>`).join("");

    document.getElementById("tfoot").innerHTML =
      `<tr><td>Összesen</td>${order.map(p => `<td>${totals[p]}</td>`).join("")}</tr>`;
  } catch (err) {
    statusEl.textContent = `Nem sikerült betölteni az adatokat: ${err.message}`;
  }
})();
