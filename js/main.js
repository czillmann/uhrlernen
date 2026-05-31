/* =========================================================
   App-Shell: rendert Homescreen und geöffnete Übungen.
   Einfaches Hash-Routing:
     #/            -> Homescreen
     #/u/<id>      -> Übung mit der jeweiligen id
     #/settings    -> Einstellungen
   ========================================================= */

import { exercises, findExercise } from "./exercises.js";
import {
  getSettings,
  saveSettings,
  settingsLabel,
  dayPartRanges,
  saveDayPartStart,
  getStarGoal,
  saveStarGoal,
} from "./settings.js";
import { starProgress, getStars, resetStars } from "./stars.js";

const root = document.getElementById("app");

const DIFFICULTY_LABELS = {
  1: "Nur volle Stunden",
  2: "Volle & halbe Stunden",
  3: "Volle, halbe & Viertelstunden",
  4: "Minutengenau",
};

/* ---------- Routing ---------- */

function currentRoute() {
  const hash = location.hash.replace(/^#/, "");
  const match = hash.match(/^\/u\/([\w-]+)$/);
  if (match) return { screen: "exercise", id: match[1] };
  if (hash === "/settings") return { screen: "settings" };
  return { screen: "home" };
}

function openExercise(id) {
  location.hash = `/u/${id}`;
}

function openSettings() {
  location.hash = "/settings";
}

function goHome() {
  location.hash = "/";
}

/* ---------- Render ---------- */

function render() {
  const route = currentRoute();

  if (route.screen === "exercise") {
    const exercise = findExercise(route.id);
    if (exercise && !isLocked(exercise)) {
      renderExercise(exercise);
      return;
    }
    // gesperrte oder unbekannte Übung -> zurück zur Übersicht
  }
  if (route.screen === "settings") {
    renderSettings();
    return;
  }
  renderHome();
}

function renderHome() {
  root.innerHTML = "";

  const home = el("div", "home");

  // Zahnrad oben rechts -> Einstellungen
  const gear = el("button", "home__gear", "⚙︎");
  gear.type = "button";
  gear.setAttribute("aria-label", "Einstellungen");
  gear.addEventListener("click", openSettings);

  // Kopf mit Live-Uhr
  const header = el("div", "home__header");
  const clock = el("div", "home__clock");
  const date = el("div", "home__date");
  const title = el("div", "home__title", "Uhr lernen");
  const level = el("button", "home__level", settingsLabel());
  level.type = "button";
  level.addEventListener("click", openSettings);
  header.append(clock, date, title, level, buildStarMeter());

  home.append(gear);

  // App-Raster
  const grid = el("div", "grid");
  for (const ex of exercises) {
    grid.append(buildAppIcon(ex));
  }
  // (Sperr-Status richtet sich nach der aktuellen Schwierigkeitsstufe)

  // Punkt-Anzeige (Andeutung mehrerer Seiten)
  const dots = el("div", "home__dots");
  const dot = el("span");
  dot.classList.add("is-active");
  dots.append(dot);

  home.append(header, grid, dots);
  root.append(home);

  startClock(clock, date);
}

/* ---------- Einstellungen ---------- */

function renderSettings() {
  stopClock();
  root.innerHTML = "";

  const view = el("div", "settings");

  // Kopfleiste mit Zurück-Knopf
  const bar = el("div", "exercise__bar");
  const back = el("button", "exercise__back", "‹ Zurück");
  back.type = "button";
  back.addEventListener("click", goHome);
  bar.append(back, el("div", "exercise__title", "Einstellungen"));

  const body = el("div", "settings__body");

  // --- Schwierigkeitsstufe ---
  body.append(el("div", "settings__label", "Schwierigkeitsstufe"));
  const diffList = el("div", "settings__options");

  function paintDifficulty() {
    const cur = getSettings().difficulty;
    [...diffList.children].forEach((b) => {
      b.classList.toggle("is-active", Number(b.dataset.level) === cur);
    });
  }

  for (let lvl = 1; lvl <= 4; lvl++) {
    const opt = el("button", "settings__option");
    opt.type = "button";
    opt.dataset.level = String(lvl);
    opt.innerHTML = `<span class="settings__option-num">${lvl}</span>
      <span class="settings__option-text">${DIFFICULTY_LABELS[lvl]}</span>
      <span class="settings__check">✓</span>`;
    opt.addEventListener("click", () => {
      saveSettings({ difficulty: lvl });
      paintDifficulty();
    });
    diffList.append(opt);
  }
  body.append(diffList);
  paintDifficulty();

  // --- Stundenbereich (12 / 24h) ---
  body.append(el("div", "settings__label", "Stundenbereich"));
  const toggleRow = el("label", "settings__toggle");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = getSettings().range24;
  const toggleText = el("span", null, "Auch 0–24 Uhr üben (nachmittags/abends)");
  checkbox.addEventListener("change", () => {
    saveSettings({ range24: checkbox.checked });
  });
  toggleRow.append(checkbox, toggleText);
  body.append(toggleRow);

  const note = el(
    "div",
    "settings__note",
    "Gilt für: Uhr lesen, Uhr stellen, Minuten und Digital & Analog. " +
      "Die Übungen Volle/Halbe/Viertelstunde bleiben auf 1–12 Uhr."
  );
  body.append(note);

  // --- Tageszeiten ---
  body.append(el("div", "settings__label", "Tageszeiten"));
  const dayWrap = el("div", "settings__options");
  body.append(dayWrap);

  function renderDayParts() {
    dayWrap.innerHTML = "";
    for (const cat of dayPartRanges()) {
      const row = el("div", "daypart");

      const head = el("div", "daypart__head");
      head.append(
        el("span", "daypart__emoji", cat.emoji),
        el("span", "daypart__name", cat.name)
      );

      const ctrl = el("div", "daypart__ctrl");
      const von = el("span", "daypart__von", "ab");

      const select = document.createElement("select");
      select.className = "daypart__select";
      for (let h = 0; h <= 23; h++) {
        const o = document.createElement("option");
        o.value = String(h);
        o.textContent = `${h} Uhr`;
        if (h === cat.start) o.selected = true;
        select.appendChild(o);
      }
      select.addEventListener("change", () => {
        saveDayPartStart(cat.key, Number(select.value));
        renderDayParts(); // Bereiche neu berechnen
      });

      const range = el(
        "span",
        "daypart__range",
        `(${cat.start}–${cat.end} Uhr)`
      );

      ctrl.append(von, select, range);
      row.append(head, ctrl);
      dayWrap.append(row);
    }
  }
  renderDayParts();

  body.append(
    el(
      "div",
      "settings__note",
      "Das Ende ergibt sich automatisch aus der nächsten Tageszeit. " +
        "Gilt für die Übungen Tageszeit und Digital-Tageszeit."
    )
  );

  // --- Sterne ---
  body.append(el("div", "settings__label", "Sterne"));
  const starsBox = el("div");
  body.append(starsBox);

  function renderStarsSection() {
    starsBox.innerHTML = "";

    // Ziel einstellen
    const goalRow = el("div", "daypart");
    goalRow.append(el("span", "daypart__name", "Ziel für die Belohnung"));
    const goalCtrl = el("div", "daypart__ctrl");
    const select = document.createElement("select");
    select.className = "daypart__select";
    const goal = getStarGoal();
    const choices = [25, 50, 75, 100, 150, 200, 300, 500];
    if (!choices.includes(goal)) choices.push(goal);
    choices.sort((a, b) => a - b);
    for (const g of choices) {
      const o = document.createElement("option");
      o.value = String(g);
      o.textContent = `${g} ⭐`;
      if (g === goal) o.selected = true;
      select.appendChild(o);
    }
    select.addEventListener("change", () => {
      saveStarGoal(Number(select.value));
      renderStarsSection();
    });
    goalCtrl.append(select);
    goalRow.append(goalCtrl);

    // Aktueller Stand + Zurücksetzen
    const stateRow = el("div", "daypart");
    stateRow.append(el("span", "daypart__name", `Gesammelt: ${getStars()} ⭐`));
    const resetBtn = el("button", "settings__reset", "Zurücksetzen");
    resetBtn.type = "button";
    resetBtn.addEventListener("click", () => {
      if (window.confirm("Alle gesammelten Sterne wirklich auf 0 zurücksetzen?")) {
        resetStars();
        renderStarsSection();
      }
    });
    stateRow.append(resetBtn);

    starsBox.append(goalRow, stateRow);
  }
  renderStarsSection();

  view.append(bar, body);
  root.append(view);
}

function buildStarMeter() {
  const { total, current, goal } = starProgress();

  const meter = el("div", "starmeter");
  meter.title = `Insgesamt ${total} Sterne gesammelt`;

  const label = el("div", "starmeter__label", `⭐ ${current} / ${goal}`);

  const bar = el("div", "starmeter__bar");
  const fill = el("div", "starmeter__fill");
  fill.style.width = `${(current / goal) * 100}%`;
  bar.appendChild(fill);

  meter.append(label, bar);
  return meter;
}

/** Passt die Mindeststufe der Übung nicht zur Einstellung? */
function isLocked(ex) {
  return ex.minLevel && ex.minLevel > getSettings().difficulty;
}

function buildAppIcon(ex) {
  const locked = isLocked(ex);
  const btn = el("button", "app-icon" + (locked ? " app-icon--locked" : ""));
  btn.type = "button";
  btn.setAttribute("aria-label", ex.name);

  const tile = el("div", "app-icon__tile", ex.emoji);
  tile.style.setProperty("--tile-bg", ex.color);

  if (locked) {
    const lock = el("div", "app-icon__lock", "🔒");
    tile.appendChild(lock);
  }

  const label = el("div", "app-icon__label", ex.name);

  btn.append(tile, label);

  if (locked) {
    btn.disabled = true;
    btn.title = `Erst ab Stufe ${ex.minLevel}`;
    // kleiner Hinweis unter dem Namen
    btn.append(el("div", "app-icon__sublabel", `ab Stufe ${ex.minLevel}`));
  } else {
    btn.addEventListener("click", () => openExercise(ex.id));
  }
  return btn;
}

function renderExercise(ex) {
  stopClock();
  root.innerHTML = "";

  const view = el("div", "exercise");
  view.style.background = `linear-gradient(160deg, ${ex.color} 0%, #0e1733 130%)`;

  // Obere Leiste mit Zurück-Knopf
  const bar = el("div", "exercise__bar");
  const back = el("button", "exercise__back", "‹ Zurück");
  back.type = "button";
  back.addEventListener("click", goHome);
  const barTitle = el("div", "exercise__title", ex.name);
  bar.append(back, barTitle);

  // Inhalt der Übung
  const body = el("div", "exercise__body");

  if (typeof ex.mount === "function") {
    // Echte Übung
    body.classList.add("exercise__body--game");
    ex.mount(body, { goHome });
  } else {
    // Platzhalter, bis die Übung gebaut ist
    body.append(
      el("div", "exercise__emoji", ex.emoji),
      el("div", "exercise__hint", ex.hint),
      el("div", "badge-soon", "ÜBUNG KOMMT BALD")
    );
  }

  view.append(bar, body);
  root.append(view);
}

/* ---------- Live-Uhr auf dem Homescreen ---------- */

let clockTimer = null;

function startClock(clockEl, dateEl) {
  const tick = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    clockEl.textContent = `${hh}:${mm}`;
    dateEl.textContent = now.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };
  tick();
  clockTimer = setInterval(tick, 1000);
}

function stopClock() {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
}

/* ---------- Mini-Helfer ---------- */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/* ---------- Start ---------- */

window.addEventListener("hashchange", render);
render();

// Service Worker registrieren (PWA / Offline-Fähigkeit)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* Offline-Funktion optional – Fehler ignorieren */
    });
  });
}
