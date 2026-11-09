import { loadData, finalScores, placements, cumulative, formatDate, ROUND_TOTAL } from "./data.js";

const statusEl = document.getElementById("status");

function cell(points) {
  if (points === 0) return `<span class="mark zero">0</span>`;
  if (points === ROUND_TOTAL) return `<span class="mark bumszli">${ROUND_TOTAL}</span>`;
  return String(points);
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

    const ordered = [...players].sort((a, b) => totals[a] - totals[b]);
    document.getElementById("result").innerHTML = ordered.map(p => `
      <li>
        <div class="rank-row">
          <span class="rank-num">${places[p]}.</span>
          <span class="rank-name">${p}</span>
          <span class="rank-wins">${totals[p]} pont</span>
        </div>
      </li>`).join("");

    document.getElementById("thead").innerHTML =
      `<tr><th>Kör</th>${players.map(p => `<th>${p}</th>`).join("")}</tr>`;

    document.getElementById("tbody").innerHTML = game.rounds.map((r, i) => `
      <tr>
        <td class="muted">${i + 1}.</td>
        ${players.map(p => `<td>${cell(r[p] || 0)}<span class="cum">${cum[i][p]}</span></td>`).join("")}
      </tr>`).join("");

    document.getElementById("tfoot").innerHTML =
      `<tr><td>Összesen</td>${players.map(p => `<td>${totals[p]}</td>`).join("")}</tr>`;
  } catch (err) {
    statusEl.textContent = `Nem sikerült betölteni az adatokat: ${err.message}`;
  }
})();
