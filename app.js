const csvFile = "Race List - Sheet1.csv";
const ephis = [
  {
    key: "Classic Triple Crown",
    required: ["Satsuki Sho", "Tokyo Yushun (Japanese Derby)", "Kikuka Sho"],
    note: "Standard male Triple Crown",
  },
  {
    key: "Triple Tiara",
    required: ["Oka Sho", "Japanese Oaks", "Shuka Sho"],
    note: "Standard female Triple Tiara",
  },
  {
    key: "Senior Spring Triple Crown",
    required: ["Osaka Hai", "Tenno Sho (Spring)", "Takarazuka Kinen"],
    note: "Senior stamina path",
  },
  {
    key: "Senior Autumn Triple Crown",
    required: ["Tenno Sho (Autumn)", "Japan Cup", "Arima Kinen"],
    note: "Senior autumn goal races",
  },
];

let races = [];
let plan = [];
let bannerDimensions = null;

const bannerFiles = [
  "Arima Kinen.png",
  "Asahi Hai Futurity Stakes.png",
  "Champions Cup.png",
  "February Stakes.png",
  "Hanshin Juvenile Fillies.png",
  "Hopeful Stakes.png",
  "Japan Cup.png",
  "Japan Dirt Derby.png",
  "Japanese Oaks.png",
  "JBC Classic.png",
  "JBC Ladies’ Classic.png",
  "JBC Sprint.png",
  "Kikuka Sho.png",
  "Mile Championship.png",
  "NHK Mile Cup.png",
  "Oka Sho.png",
  "Osaka Hai.png",
  "Queen Elizabeth II Cup.png",
  "Satsuki Sho.png",
  "Sprinters Stakes.png",
  "Shuka Sho.png",
  "Takamatsunomiya Kinen.png",
  "Takarazuka Kinen.png",
  "Teio Sho.png",
  "Tenno Sho (Autumn).png",
  "Tenno Sho (Spring).png",
  "Tokyo Daishoten.png",
  "Tokyo Yushun (Japanese Derby).png",
  "Victoria Mile.png",
  "Yasuda Kinen.png",
];

const normalize = (s) => s
  .replace(/[\s\/\(\)\'\"\^’]+/g, "-")
  .replace(/[^a-zA-Z0-9\-]/g, "")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "")
  .toLowerCase();

const bannerMap = {};
for (const file of bannerFiles) {
  bannerMap[normalize(file.replace(/\.png$/i, ""))] = file;
}


const filters = {
  grade: { G1: true, G2: true, G3: true },
  surface: { Turf: true, Dirt: true },
  length: { Short: true, Mile: true, Medium: true, Long: true },
};

const status = document.getElementById("status");
const raceSelect = document.getElementById("raceSelect");
const plannedList = document.getElementById("plannedList");
const totalPlanned = document.getElementById("totalPlanned");
const g1count = document.getElementById("g1count");
const g2count = document.getElementById("g2count");
const g3count = document.getElementById("g3count");
const epithetList = document.getElementById("epithetList");

function updateStatus(text) {
  status.textContent = text;
}

function loadPlanFromStorage() {
  try {
    const saved = localStorage.getItem("uma-agenda-plan");
    if (saved) {
      plan = JSON.parse(saved);
      renderPlan();
      updateStatus("Plan loaded from localStorage.");
    }
  } catch (err) {
    console.warn(err);
    updateStatus("Failed to load from localStorage.");
  }
}

function savePlanToStorage() {
  localStorage.setItem("uma-agenda-plan", JSON.stringify(plan));
  updateStatus("Plan saved to localStorage.");
}

function resetPlan() {
  plan = [];
  localStorage.removeItem("uma-agenda-plan");
  renderPlan();
  updateStatus("Plan reset.");
}

function parseCSV(data) {
  const lines = data.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return [];
  }
  const header = lines[0].split(",").map((h) => h.trim().replace(/:+$/, ""));
  return lines.slice(1).map((line) => {
    const fields = line.split(",");
    const item = {};
    for (let i = 0; i < header.length; i += 1) {
      item[header[i]] = (fields[i] || "").trim();
    }
    return item;
  });
}

function parseTurn(turn) {
  const raw = String(turn || "").trim();
  const parts = raw.split("_");
  const m = parseInt(parts[0], 10);
  const half = parseInt(parts[1], 10);
  if (!Number.isInteger(m) || m < 1 || m > 12) {
    return { month: null, half: null, key: "Unknown", label: "Unknown" };
  }
  const halfName = half === 2 ? "Late" : "Early";
  const key = `${String(m).padStart(2, "0")}_${String(half || 1).padStart(2, "0")}`;
  return { month: m, half: half || 1, key, label: `${monthName(m)} (${halfName})` };
}

function monthName(m) {
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return names[m - 1] || "N/A";
}

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  const selectedNames = new Set(plan.map((p) => p["Race Name"]));
  const byYear = {};
  races.forEach((race) => {
    const year = race.Year || "Unknown";
    const turn = parseTurn(race.Turn);
    const key = turn.key;
    if (!byYear[year]) byYear[year] = {};
    if (!byYear[year][key]) byYear[year][key] = { turn, races: [] };
    byYear[year][key].races.push(race);
  });

  Object.keys(byYear).sort().forEach((year) => {
    const box = document.createElement("div");
    box.className = "year-box";
    const header = document.createElement("h3");
    header.innerHTML = `${year} <span>[toggle months]</span>`;
    header.addEventListener("click", () => {
      box.classList.toggle("collapsed");
    });
    box.appendChild(header);

    const monthRow = document.createElement("div");
    monthRow.className = "month-row";
    const monthKeys = Object.keys(byYear[year]).sort((a, b) => {
      const ta = byYear[year][a].turn;
      const tb = byYear[year][b].turn;
      if (ta.month !== tb.month) return ta.month - tb.month;
      return ta.half - tb.half;
    });

    monthKeys.forEach((key) => {
      const cell = document.createElement("div");
      cell.className = "month-cell";
      const data = byYear[year][key];
      const turn = data.turn;
      const monthRaces = data.races;
      cell.innerHTML = `<h4>${turn.label}</h4>`;
      const gradeRank = (g) => {
        if (!g) return 99;
        const key = g.toUpperCase();
        if (key === "G1") return 1;
        if (key === "G2") return 2;
        if (key === "G3") return 3;
        return 99;
      };
      monthRaces.sort((a, b) => {
        const rankA = gradeRank(a.Grade);
        const rankB = gradeRank(b.Grade);
        if (rankA !== rankB) return rankA - rankB;
        return a["Race Name"].localeCompare(b["Race Name"]);
      }).forEach((race) => {
        const raceName = race["Race Name"];
        const btn = document.createElement("button");
        const gradeClass = (race.Grade || "").toLowerCase();
        btn.className = `race-btn ${gradeClass}`;
        const distance = race["Length"] || race["Length (m)"] || "";
        const hasDirt =
          (race.Type && race.Type.toLowerCase() === "dirt") ||
          (race["Location and Direction"] || "").toLowerCase().includes("dirt");
        const surface = hasDirt ? "Dirt" : "Turf";
        let type = (race.Type || "").trim();
        if (!type) type = surface;
        const lengthCat = race["Length"] || "";
        if (!filters.grade[race.Grade] || !filters.surface[surface] || !filters.length[lengthCat]) {
          return;
        }
        const details = [surface];
        if (type && type !== surface) details.push(type);
        if (distance) details.push(distance);
        const summary = details.join(" • ");
        const selected = selectedNames.has(raceName);
        if (selected) btn.classList.add("selected");
        const normalizedName = normalize(raceName);
        const bannerFile = bannerMap[normalizedName];
        const hasBannerFile = Boolean(bannerFile);
        const icon = selected ? "−" : "+";

        const applyNoBannerSize = () => {
          if (bannerDimensions) {
            btn.style.width = `${bannerDimensions.width}px`;
            btn.style.height = `${bannerDimensions.height}px`;
          } else {
            btn.style.width = "100%";
            btn.style.height = "100px";
          }
        };

        if (hasBannerFile) {
          const bannerSrc = `races/${bannerFile}`;
          const bannerImg = document.createElement("img");
          bannerImg.src = bannerSrc;
          bannerImg.alt = raceName;
          bannerImg.className = "race-banner";
          bannerImg.onload = () => {
            btn.classList.add("has-banner");
            btn.innerHTML = "";
            btn.appendChild(bannerImg);
            const sr = document.createElement("span");
            sr.className = "sr-only";
            sr.textContent = `${raceName}, ${race.Grade}, ${summary}`;
            btn.appendChild(sr);

            bannerDimensions = {
              width: bannerImg.naturalWidth,
              height: bannerImg.naturalHeight,
            };

            document.querySelectorAll(".race-btn.no-banner").forEach((otherBtn) => {
              otherBtn.style.width = `${bannerDimensions.width}px`;
              otherBtn.style.height = `${bannerDimensions.height}px`;
            });

            btn.style.width = `${bannerDimensions.width}px`;
            btn.style.height = `${bannerDimensions.height}px`;
          };
          bannerImg.onerror = () => {
            btn.classList.add("no-banner");
            btn.innerHTML = `<span class="race-icon">${icon}</span> <div class="race-info"><strong>${raceName}</strong><br><small>${race.Grade} • ${summary}</small></div>`;
            applyNoBannerSize();
          };
          btn.appendChild(bannerImg);
        } else {
          btn.classList.add("no-banner");
          btn.innerHTML = `<span class="race-icon">${icon}</span> <div class="race-info"><strong>${raceName}</strong><br><small>${race.Grade} • ${summary}</small></div>`;
          applyNoBannerSize();
        }

        btn.title = `${raceName} | ${race.Grade} | ${summary}`;
        btn.setAttribute("data-race", raceName);
        cell.appendChild(btn);
      });
      monthRow.appendChild(cell);
    });
    box.appendChild(monthRow);
    grid.appendChild(box);
  });
  syncCalendarSelection();
}

function detectEpithets() {
  const target = new Set(plan.map((p) => p["Race Name"].toLowerCase()));
  const found = [];
  ephis.forEach((e) => {
    const missing = e.required.filter((v) => !target.has(v.toLowerCase()));
    if (missing.length === 0) {
      found.push({ name: e.key, note: e.note, complete: true, missing: [] });
    } else {
      found.push({ name: e.key, note: e.note, complete: false, missing });
    }
  });
  return found;
}

function syncCalendarSelection() {
  const selectedNames = new Set(plan.map((p) => p["Race Name"]));
  document.querySelectorAll("button.race-btn").forEach((btn) => {
    const raceName = btn.getAttribute("data-race");
    if (!raceName) return;
    const isSelected = selectedNames.has(raceName);
    btn.classList.toggle("selected", isSelected);
    const icon = btn.querySelector(".race-icon");
    if (icon) icon.textContent = isSelected ? "−" : "+";
  });
}

function renderPlan() {
  if (plannedList) {
    plannedList.innerHTML = "";
    plan.forEach((race, idx) => {
      const distance = race["Length"] || race["Length (m)"] || "";
      const hasDirt =
        (race.Type && race.Type.toLowerCase() === "dirt") ||
        (race["Location and Direction"] || "").toLowerCase().includes("dirt");
      const surface = hasDirt ? "Dirt" : "Turf";
      const type = race.Type || surface;
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="race-summary">
          <strong>${race["Race Name"]}</strong> <span>(${race.Grade})</span>
        </div>
        <div class="race-meta">${race.Year} • ${surface} • ${type} • ${distance}</div>
        <button data-index="${idx}">Remove</button>
      `;
      plannedList.appendChild(li);
    });
  }

  const g1 = plan.filter((r) => r.Grade && r.Grade.toUpperCase() === "G1").length;
  const g2 = plan.filter((r) => r.Grade && r.Grade.toUpperCase() === "G2").length;
  const g3 = plan.filter((r) => r.Grade && r.Grade.toUpperCase() === "G3").length;

  totalPlanned.textContent = String(plan.length);
  g1count.textContent = String(g1);
  g2count.textContent = String(g2);
  g3count.textContent = String(g3);

  const ep = detectEpithets();
  epithetList.innerHTML = "";
  const ul = document.createElement("ul");
  ep.forEach((e) => {
    const li = document.createElement("li");
    li.textContent = `${e.complete ? "✅" : "⚠️"} ${e.name} (${e.note})`;
    if (!e.complete) {
      const sub = document.createElement("small");
      sub.textContent = ` missing: ${e.missing.join(", ")}`;
      li.appendChild(sub);
    }
    ul.appendChild(li);
  });
  epithetList.appendChild(ul);

  syncCalendarSelection();
  savePlanToStorage();
}

function addRaceByName(name) {
  const r = races.find((it) => it["Race Name"] === name);
  if (!r) return;
  if (plan.some((p) => p["Race Name"] === name)) {
    updateStatus(`'${name}' is already in plan.`);
    return;
  }
  plan.push(r);
  renderPlan();
  updateStatus(`Added '${name}' to plan.`);
}

function toggleRaceSelection(name) {
  if (plan.some((p) => p["Race Name"] === name)) {
    plan = plan.filter((p) => p["Race Name"] !== name);
    renderPlan();
    updateStatus(`Removed '${name}' from plan.`);
  } else {
    addRaceByName(name);
  }
}

async function loadRaceCSV() {
  updateStatus("Loading race CSV...");
  try {
    const res = await fetch(csvFile);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const text = await res.text();
    races = parseCSV(text);
    if (races.length === 0) {
      throw new Error("No race rows found in CSV");
    }
    renderCalendar();
    updateStatus(`Loaded ${races.length} races.`);
    loadPlanFromStorage();
  } catch (error) {
    updateStatus(`Failed to load CSV: ${error.message}. Please run app via small local server (e.g. python -m http.server) and refresh.`);
    races = [];
    raceSelect.innerHTML = "<option disabled>Load CSV first</option>";
  }
}

function downloadPlan() {
  const data = JSON.stringify(plan, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `uma-agenda-plan-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  updateStatus("Saved plan to JSON file.");
}

function importPlanFromFile(file) {
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const obj = JSON.parse(evt.target.result);
      if (!Array.isArray(obj)) {
        throw new Error("Invalid plan format");
      }
      plan = obj;
      renderPlan();
      updateStatus("Loaded plan from JSON file.");
    } catch (err) {
      updateStatus(`Invalid file: ${err.message}`);
    }
  };
  reader.readAsText(file);
}

function init() {
  document.getElementById("reloadBtn").addEventListener("click", loadRaceCSV);
  document.getElementById("saveJsonBtn").addEventListener("click", downloadPlan);
  document.getElementById("loadJsonBtn").addEventListener("click", () => {
    document.getElementById("loadFile").click();
  });
  document.getElementById("resetBtn").addEventListener("click", resetPlan);
  document.getElementById("loadFile").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      importPlanFromFile(file);
    }
    event.target.value = "";
  });

  if (plannedList) {
    plannedList.addEventListener("click", (event) => {
      if (event.target.tagName === "BUTTON") {
        const idx = Number(event.target.dataset.index);
        if (!Number.isNaN(idx)) {
          plan.splice(idx, 1);
          renderPlan();
          updateStatus("Removed race from plan.");
        }
      }
    });
  }

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-filter-type");
      const value = btn.getAttribute("data-filter-value");
      if (!type || !value) return;
      filters[type][value] = !filters[type][value];
      btn.classList.toggle("active", filters[type][value]);
      if (!filters[type][value]) {
        btn.classList.remove("active");
      } else {
        btn.classList.add("active");
      }
      renderCalendar();
    });
  });

  document.getElementById("calendarGrid").addEventListener("click", (event) => {
    const target = event.target.closest("button.race-btn");
    if (target) {
      const raceName = target.getAttribute("data-race");
      if (raceName) {
        toggleRaceSelection(raceName);
      }
    }
  });

  loadRaceCSV();
}

init();
