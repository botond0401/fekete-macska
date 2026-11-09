import { loadData, playerStats, formatDate, daysSince, fmt } from "./data.js";

const statusEl = document.getElementById("status");
const rankingEl = document.getElementById("ranking");
const toggleBtn = document.getElementById("details-toggle");
const detailsEl = document.getElementById("details");

function agoText(days) {
  if (days === 0) return "ma";
  if (days === 1) return "tegnap";
  return `${days} napja`;
}

function placeBar(places, games) {
  return places.map((n, i) => n
    ? `<span style="width:${(n / games) * 100}%; background:var(--place-${i + 1})" title="${i + 1}. hely: ${n}"></span>`
    : ""
  ).join("");
}

function renderRanking(stats) {
  rankingEl.innerHTML = stats.map((s, i) => `
    <li>
      <div class="rank-row">
        <span class="rank-num">${i + 1}.</span>
        <span class="rank-name">${s.name}</span>
        <span class="rank-wins">${s.places[0]} győzelem</span>
        <span class="placebar">${placeBar(s.places, s.games)}</span>
      </div>
    </li>`).join("");
}

function renderDetails(stats) {
  document.getElementById("details-head").innerHTML =
    `<tr><th></th>${stats.map(s => `<th>${s.name}</th>`).join("")}</tr>`;

  const rows = [
    ...[0, 1, 2, 3].map(i => ({
      label: `<span class="swatch" style="background:var(--place-${i + 1})"></span>${i + 1}. hely`,
      value: s => s.places[i],
    })),
    { label: "Győzelmi arány", value: s => `${fmt(s.winRate * 100, 0)}%`, divider: true },
    { label: "Átlagos pontszám", value: s => fmt(s.avgPoints) },
    { label: "Nullázás / játszma", value: s => fmt(s.avgZeroRounds) },
    { label: "Bumszli / játszma", value: s => fmt(s.avgBumszli, 2) },
  ];

  document.getElementById("details-body").innerHTML = rows.map(r => `
    <tr class="${r.divider ? "divider" : ""}">
      <td><span class="row-label">${r.label}</span></td>
      ${stats.map(s => `<td>${r.value(s)}</td>`).join("")}
    </tr>`).join("");
}

toggleBtn.addEventListener("click", () => {
  const open = toggleBtn.getAttribute("aria-expanded") === "true";
  toggleBtn.setAttribute("aria-expanded", String(!open));
  detailsEl.hidden = open;
});

(async function init() {
  try {
    const data = await loadData();
    const games = data.games;

    document.getElementById("game-count").textContent = games.length;
    if (games.length) {
      const last = games[games.length - 1].date;
      document.getElementById("last-date").textContent = formatDate(last);
      document.getElementById("last-ago").textContent = agoText(daysSince(last));
    }

    const stats = playerStats(data);
    renderRanking(stats);
    renderDetails(stats);
  } catch (err) {
    statusEl.textContent = `Nem sikerült betölteni az adatokat: ${err.message}`;
  }
})();
