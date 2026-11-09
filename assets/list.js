import { loadData, finalScores, placements, seatingLabel, allSeatingLabels, fmt } from "./data.js";

const theadEl = document.getElementById("thead");
const tbodyEl = document.getElementById("tbody");
const statusEl = document.getElementById("status");
const summaryHeadEl = document.getElementById("summary-head");
const summaryBodyEl = document.getElementById("summary-body");
const switchEl = document.getElementById("summary-switch");

function shortDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const opts = { month: "short", day: "numeric" };
  if (y !== new Date().getFullYear()) opts.year = "numeric";
  return new Date(y, m - 1, d).toLocaleDateString("hu-HU", opts);
}

function renderGames(players, games) {
  theadEl.innerHTML = `<tr><th>Dátum</th><th>Helyszín</th>${players.map(p => `<th>${p}</th>`).join("")}`
    + `<th>Körök</th><th>Sorrend</th><th>Kezdőjátékos</th></tr>`;

  if (!games.length) {
    tbodyEl.innerHTML = `<tr><td colspan="${players.length + 5}" class="muted">Még nincs rögzített játszma.</td></tr>`;
    return;
  }

  for (const g of [...games].reverse()) {
    const totals = finalScores(g, players);
    const places = placements(g, players);
    const tr = document.createElement("tr");
    tr.className = "clickable";
    tr.innerHTML = `<td>${shortDate(g.date)}</td>`
      + `<td class="text">${g.location || "–"}</td>`
      + players.map(p => `<td class="${places[p] === 1 ? "winner" : ""}">${totals[p]}</td>`).join("")
      + `<td class="muted">${g.rounds.length}</td>`
      + `<td class="text">${seatingLabel(g, players) || "–"}</td>`
      + `<td class="text">${g.starter || "–"}</td>`;
    tr.addEventListener("click", () => { location.href = `../jatszma/?id=${encodeURIComponent(g.id)}`; });
    tbodyEl.appendChild(tr);
  }
}

function renderSummary(players, games, mode) {
  const keys = mode === "seating" ? allSeatingLabels(players) : players;
  const labelOf = mode === "seating" ? g => seatingLabel(g, players) : g => g.starter;
  const counts = new Map(keys.map(k => [k, 0]));
  for (const g of games) {
    const k = labelOf(g);
    if (counts.has(k)) counts.set(k, counts.get(k) + 1);
  }
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1] || keys.indexOf(a[0]) - keys.indexOf(b[0]));
  const max = Math.max(1, ...rows.map(([, n]) => n));

  summaryHeadEl.innerHTML =
    `<tr><th>${mode === "seating" ? "Sorrend" : "Kezdőjátékos"}</th><th>Játszmák</th><th>Arány</th><th class="bar-col"></th></tr>`;
  summaryBodyEl.innerHTML = rows.map(([k, n]) => `
    <tr class="${n === 0 ? "zero-row" : ""}">
      <td>${k}</td>
      <td>${n}</td>
      <td class="muted">${games.length ? fmt((n / games.length) * 100, 0) : "0"}%</td>
      <td class="bar-col"><span class="share-bar" style="width:${(n / max) * 100}%"></span></td>
    </tr>`).join("");
}

(async function init() {
  try {
    const { players, games } = await loadData();
    renderGames(players, games);

    let mode = "seating";
    renderSummary(players, games, mode);
    switchEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-mode]");
      if (!btn || btn.dataset.mode === mode) return;
      mode = btn.dataset.mode;
      switchEl.querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", String(b === btn)));
      renderSummary(players, games, mode);
    });
  } catch (err) {
    statusEl.textContent = `Nem sikerült betölteni az adatokat: ${err.message}`;
  }
})();
