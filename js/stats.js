/* =========================================================
   Zählt, wie oft jede Übung vollständig durchlaufen wurde.
   Gespeichert im Browser (localStorage).

   Damit nicht jede Übung ihre id durchreichen muss, merken wir
   uns die gerade geöffnete Übung global (setCurrentExercise)
   und zählen beim Abschluss (recordCompletion).
   ========================================================= */

const KEY = "uhrlernen.completions";
let currentId = null;

export function setCurrentExercise(id) {
  currentId = id;
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
  } catch (_) {
    return {};
  }
}

function save(obj) {
  try {
    localStorage.setItem(KEY, JSON.stringify(obj));
  } catch (_) {}
}

/** Zähler der aktuell geöffneten Übung um 1 erhöhen. */
export function recordCompletion() {
  if (!currentId) return;
  const obj = load();
  obj[currentId] = (obj[currentId] || 0) + 1;
  save(obj);
}

export function getCompletion(id) {
  return load()[id] || 0;
}

export function resetCompletions() {
  save({});
}
