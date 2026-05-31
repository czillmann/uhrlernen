/* =========================================================
   Kleine Töne mit der Web-Audio-API.
   Bewusst dezent gehalten. Fehler werden ignoriert, falls
   Audio nicht verfügbar ist.
   ========================================================= */

let ctx = null;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  // Manche Browser starten den Context pausiert – nach Nutzergeste fortsetzen.
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/** Einen einzelnen Ton spielen. */
function tone(freq, start, duration, type = "sine", gain = 0.15) {
  const a = ac();
  if (!a) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g).connect(a.destination);
  const t = a.currentTime + start;
  osc.start(t);
  // sanftes Ausklingen
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.stop(t + duration);
}

/** Aufsteigende zwei Töne – "richtig". */
export function playCorrect() {
  try {
    tone(660, 0, 0.14, "triangle");
    tone(880, 0.12, 0.18, "triangle");
  } catch (_) {}
}

/** Tiefer, kurzer Ton – "leider falsch". */
export function playWrong() {
  try {
    tone(200, 0, 0.28, "sawtooth", 0.12);
  } catch (_) {}
}

/** Kleine Fanfare am Ende. */
export function playFanfare() {
  try {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => tone(f, i * 0.13, 0.22, "triangle"));
  } catch (_) {}
}
