/* =========================================================
   Gesammelte Sterne (im Browser gespeichert).
   Am Ende jeder Übung werden 1–3 Sterne gutgeschrieben.
   Beim Erreichen des (einstellbaren) Ziels gibt es eine
   Glückwunsch-Animation.
   ========================================================= */

import { getStarGoal } from "./settings.js";

const KEY = "uhrlernen.stars";

export function getStars() {
  try {
    return parseInt(localStorage.getItem(KEY) || "0", 10) || 0;
  } catch (_) {
    return 0;
  }
}

/**
 * Sterne hinzufügen. Gibt zurück:
 *   total     – neuer Gesamtstand
 *   reached   – true, wenn eine neue Ziel-Marke erreicht wurde
 *   milestone – die erreichte Marke (z. B. 100, 200)
 */
export function addStars(n) {
  const goal = getStarGoal();
  const before = getStars();
  const total = before + n;
  try {
    localStorage.setItem(KEY, String(total));
  } catch (_) {}
  const reached = Math.floor(total / goal) > Math.floor(before / goal);
  const milestone = Math.floor(total / goal) * goal;
  return { total, before, reached, milestone };
}

/** Fortschritt innerhalb der aktuellen Ziel-Runde und Gesamtstand. */
export function starProgress() {
  const goal = getStarGoal();
  const total = getStars();
  return { total, current: total % goal, goal };
}

/** Alle gesammelten Sterne zurücksetzen. */
export function resetStars() {
  try {
    localStorage.setItem(KEY, "0");
  } catch (_) {}
}
