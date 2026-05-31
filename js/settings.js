/* =========================================================
   Globale Einstellungen der App (im Browser gespeichert).

     difficulty  1..4  – steuert, welche Minuten vorkommen
        1: nur volle Stunden        (:00)
        2: volle + halbe Stunden    (:00 :30)
        3: + Viertelstunden         (:00 :15 :30 :45)
        4: minutengenau             (5-Minuten-Schritte)
     range24     false: 1–12 Uhr   |   true: 0–24 Uhr

   Die Einstellungen gelten für die allgemeinen Übungen
   (Uhr lesen, Uhr stellen, Minuten, Digital & Analog).
   ========================================================= */

import { randInt, pick } from "./time.js";

const KEY = "uhrlernen.settings";

const DEFAULTS = { difficulty: 4, range24: false, starGoal: 100 };

/** Welche Minuten pro Schwierigkeitsstufe erlaubt sind. */
export const MINUTE_SETS = {
  1: [0],
  2: [0, 30],
  3: [0, 15, 30, 45],
  4: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
};

export function getSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch (_) {}
  return { ...DEFAULTS };
}

export function saveSettings(patch) {
  const next = { ...getSettings(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (_) {}
  return next;
}

/**
 * Erzeugt eine Zufallszeit gemäß den globalen Einstellungen.
 * Stunden: 0–23 (bei 24h) bzw. 1–12.
 */
export function genTime() {
  const s = getSettings();
  const minutes = MINUTE_SETS[s.difficulty] || MINUTE_SETS[4];
  const m = pick(minutes);
  const h = s.range24 ? randInt(0, 23) : randInt(1, 12);
  return { h, m };
}

/** Kurztext für die Anzeige, z. B. "Stufe 3 · 1–12 Uhr". */
export function settingsLabel() {
  const s = getSettings();
  return `Stufe ${s.difficulty} · ${s.range24 ? "0–24" : "1–12"} Uhr`;
}

/* ---------- Sterne-Ziel ---------- */

export function getStarGoal() {
  const g = getSettings().starGoal;
  return Number.isInteger(g) && g > 0 ? g : 100;
}

export function saveStarGoal(goal) {
  return saveSettings({ starGoal: goal });
}

/* =========================================================
   Tageszeiten
   Jede Tageszeit hat eine Start-Stunde ("von"). Das "bis"
   ergibt sich aus der Start-Stunde der nächsten Tageszeit,
   sodass der Tag lückenlos aufgeteilt ist (mit Übergang über
   Mitternacht). Die Start-Stunden sind in den Einstellungen
   anpassbar.
   ========================================================= */

export const DAYPARTS = [
  { key: "morgen", name: "Morgens", emoji: "🌅", start: 6 },
  { key: "vormittag", name: "Vormittag", emoji: "🌤️", start: 9 },
  { key: "mittag", name: "Mittag", emoji: "☀️", start: 12 },
  { key: "nachmittag", name: "Nachmittag", emoji: "🌇", start: 14 },
  { key: "abend", name: "Abend", emoji: "🌆", start: 18 },
  { key: "nacht", name: "Nacht", emoji: "🌙", start: 22 },
];

/** Tageszeiten mit den gespeicherten Start-Stunden. */
export function getDayParts() {
  const starts = getSettings().dayPartStarts || {};
  return DAYPARTS.map((c) => ({
    ...c,
    start: Number.isInteger(starts[c.key]) ? starts[c.key] : c.start,
  }));
}

/** Eine Start-Stunde ändern und speichern. */
export function saveDayPartStart(key, hour) {
  const starts = { ...(getSettings().dayPartStarts || {}) };
  starts[key] = ((hour % 24) + 24) % 24;
  return saveSettings({ dayPartStarts: starts });
}

/** Welche Tageszeit gilt zur angegebenen Stunde (0–23)? */
export function dayPartFor(hour24) {
  const cats = getDayParts().sort((a, b) => a.start - b.start);
  let result = cats[cats.length - 1]; // vor der ersten Start-Stunde: Übergang über Mitternacht
  for (const c of cats) {
    if (hour24 >= c.start) result = c;
  }
  return result;
}

/** Tageszeiten mit berechnetem "bis" (Ende), nach Start sortiert. */
export function dayPartRanges() {
  const cats = getDayParts().sort((a, b) => a.start - b.start);
  return cats.map((c, i) => {
    const next = cats[(i + 1) % cats.length].start;
    const end = (next - 1 + 24) % 24; // letzte volle Stunde dieser Tageszeit
    return { ...c, end };
  });
}
