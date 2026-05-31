/* =========================================================
   Zeit-Hilfsfunktionen
   Stunden werden intern als 1..12 geführt, Minuten als 0..59.
   ========================================================= */

/** Zufällige Ganzzahl von min bis max (beide inklusive). */
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Ein zufälliges Element aus einem Array. */
export function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/** Array zufällig mischen (Fisher-Yates), gibt eine neue Liste zurück. */
export function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Nächste Stunde (für "halb" und "Viertel vor"): 12 -> 1. */
export function nextHour(h) {
  return h === 12 ? 1 : h + 1;
}

/** Digitale Darstellung, z. B. (3, 5) -> "3:05". */
export function digital(h, m) {
  return `${h}:${String(m).padStart(2, "0")}`;
}

/**
 * Digitale Darstellung je nach Stundenbereich.
 *   range24=false -> "3:05"   (Stunde 1–12)
 *   range24=true  -> "15:05"  (Stunde 0–23, zweistellig)
 */
export function fmtDigital(h, m, range24) {
  if (range24) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  return digital(h, m);
}

/** Zwei Zeiten gleich? (h 1..12, m 0..59) */
export function sameTime(a, b) {
  return a.h === b.h && a.m === b.m;
}

/** Stunden gleich, unabhängig von 12/24h (z. B. 15 == 3). */
export function sameHour12(a, b) {
  return a % 12 === b % 12;
}

/* Hinweis: Die Tageszeit-Zuordnung lebt in settings.js
   (dayPartFor / dayPartRanges) und ist dort konfigurierbar. */

/**
 * Deutsche Sprechweise einer Uhrzeit.
 * Unterstützt volle/halbe/viertel Stunden sauber sowie 5-Minuten-Schritte.
 *   3:00 -> "3 Uhr"
 *   3:15 -> "Viertel nach 3"
 *   3:30 -> "halb 4"
 *   3:45 -> "Viertel vor 4"
 *   3:10 -> "10 nach 3"
 *   3:50 -> "10 vor 4"
 *   3:25 -> "5 vor halb 4"
 *   3:35 -> "5 nach halb 4"
 */
export function germanTime(h, m) {
  if (m === 0) return `${h} Uhr`;
  if (m === 15) return `Viertel nach ${h}`;
  if (m === 30) return `halb ${nextHour(h)}`;
  if (m === 45) return `Viertel vor ${nextHour(h)}`;

  if (m < 30) {
    if (m === 25) return `5 vor halb ${nextHour(h)}`;
    return `${m} nach ${h}`;
  }
  // m > 30
  if (m === 35) return `5 nach halb ${nextHour(h)}`;
  return `${60 - m} vor ${nextHour(h)}`;
}
