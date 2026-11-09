import { loadData, finalScores, placements } from "./data.js";

const theadEl = document.getElementById("thead");
const tbodyEl = document.getElementById("tbody");
const statusEl = document.getElementById("status");

function shortDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const opts = { month: "short", day: "numeric" };
  if (y !== new Date().getFullYear()) opts.year = "numeric";
  return new Date(y, m - 1, d).toLocaleDateString("hu-HU", opts);
}

(async function init() {
  try {
    const { players, games } = await loadData();
    theadEl.innerHTML = `<tr><th>Dátum</th>${players.map(p => `<th>${p}</th>`).join("")}<th>Körök</th></tr>`;

    if (!games.length) {
      tbodyEl.innerHTML = `<tr><td colspan="${players.length + 2}" class="muted">Még nincs rögzített játszma.</td></tr>`;
      return;
    }

    for (const g of [...games].reverse()) {
      const totals = finalScores(g, players);
      const places = placements(g, players);
      const tr = document.createElement("tr");
      tr.className = "clickable";
      tr.innerHTML = `<td>${shortDate(g.date)}</td>`
        + players.map(p => `<td class="${places[p] === 1 ? "winner" : ""}">${totals[p]}</td>`).join("")
        + `<td class="muted">${g.rounds.length}</td>`;
      tr.addEventListener("click", () => { location.href = `../jatszma/?id=${encodeURIComponent(g.id)}`; });
      tbodyEl.appendChild(tr);
    }
  } catch (err) {
    statusEl.textContent = `Nem sikerült betölteni az adatokat: ${err.message}`;
  }
})();
