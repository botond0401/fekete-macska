import { loadData, playerStats, formatDate, daysSince, fmt } from "./data.js";

const statusEl = document.getElementById("status");
const rankingEl = document.getElementById("ranking");

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

function renderRow(s, rank) {
  const li = document.createElement("li");
  const id = `detail-${rank}`;
  li.innerHTML = `
    <button class="rank-row" aria-expanded="false" aria-controls="${id}">
      <span class="rank-num">${rank}.</span>
      <span class="rank-name">${s.name}</span>
      <span class="rank-wins">${s.places[0]} győzelem</span>
      <span class="chevron"></span>
      <span class="placebar">${placeBar(s.places, s.games)}</span>
    </button>
    <div class="rank-detail" id="${id}" hidden>
      <div class="places">
        ${s.places.map((n, i) => `
          <div class="place">
            <div class="place-label"><span class="swatch" style="background:var(--place-${i + 1})"></span>${i + 1}. hely</div>
            <div class="place-value">${n}</div>
          </div>`).join("")}
      </div>
      <dl class="metrics">
        <div><dt>Győzelmi arány</dt><dd>${fmt(s.winRate * 100, 0)}%</dd></div>
        <div><dt>Átlagos pontszám</dt><dd>${fmt(s.avgPoints)}</dd></div>
        <div><dt>Nullás körök / játszma</dt><dd>${fmt(s.avgZeroRounds)}</dd></div>
        <div><dt>Bumszli / játszma</dt><dd>${fmt(s.avgBumszli, 2)}</dd></div>
      </dl>
    </div>`;
  const btn = li.querySelector(".rank-row");
  const detail = li.querySelector(".rank-detail");
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    detail.hidden = open;
  });
  return li;
}

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

    playerStats(data).forEach((s, i) => rankingEl.appendChild(renderRow(s, i + 1)));
  } catch (err) {
    statusEl.textContent = `Nem sikerült betölteni az adatokat: ${err.message}`;
  }
})();
