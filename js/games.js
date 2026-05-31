/* =========================================================
   Die eigentlichen Übungen ("Spiele").
   Jede Funktion ist ein mount(container, { goHome }) und wird
   in exercises.js der jeweiligen Übung zugeordnet.
   ========================================================= */

import { createClock } from "./clock.js";
import { startQuiz, choiceGrid } from "./quiz.js";
import { playCorrect, playWrong, playFanfare } from "./sound.js";
import { addStars } from "./stars.js";
import { celebrate } from "./celebrate.js";
import { recordCompletion } from "./stats.js";
import {
  randInt,
  pick,
  shuffle,
  fmtDigital,
  germanTime,
  sameHour12,
} from "./time.js";
import {
  genTime,
  getSettings,
  MINUTE_SETS,
  getDayParts,
  dayPartFor,
  dayPartRanges,
} from "./settings.js";

const ROUNDS = 8;

/**
 * Erzeugt einen Generator, der nie zweimal hintereinander denselben Wert
 * liefert. `keyOf` bestimmt, was als "gleiche Aufgabe" gilt. Es wird bis zu
 * `tries`-mal neu gewürfelt, damit es bei wenigen Möglichkeiten nicht hängt.
 */
function nonRepeating(generate, keyOf, tries = 60) {
  let last = null;
  return () => {
    let value = generate();
    for (let i = 0; i < tries && keyOf(value) === last; i++) {
      value = generate();
    }
    last = keyOf(value);
    return value;
  };
}

/** Kleiner Tageszeit-Hinweis unter der Uhr (nur im 24h-Modus). */
function dayPartHint(h24) {
  const dp = dayPartFor(h24);
  const el = document.createElement("div");
  el.className = "daypart-hint";
  el.innerHTML = `${dp.emoji} ${dp.name}`;
  return el;
}

/** Uhr + optionaler Tageszeit-Hinweis als ein Prompt-Element. */
function clockPrompt(clockEl, range24, h24) {
  if (!range24) return clockEl;
  const wrap = document.createElement("div");
  wrap.className = "clock-prompt";
  wrap.append(clockEl, dayPartHint(h24));
  return wrap;
}

/* ---------------------------------------------------------
   Allgemeine Lese-Übung: Uhr anzeigen, richtige Zeit wählen.
   genTime()  -> { h, m }
   format(h,m)-> Beschriftung (deutsch oder digital)
   --------------------------------------------------------- */
function readingGame(container, goHome, { genTime, format }) {
  const nextTarget = nonRepeating(genTime, (t) => `${t.h}:${t.m}`);
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const target = nextTarget();
      const correctLabel = format(target.h, target.m);

      // Uhr als Frage
      const clock = createClock({ size: 230, interactive: false });
      clock.setTime(target.h, target.m);

      // Antwortmöglichkeiten sammeln (3 Ablenker + richtige)
      const labels = new Set([correctLabel]);
      let guard = 0;
      while (labels.size < 4 && guard++ < 200) {
        const d = genTime();
        labels.add(format(d.h, d.m));
      }
      const options = shuffle(
        [...labels].map((label) => ({ label, correct: label === correctLabel }))
      );

      choiceGrid(host, {
        prompt: clock.el,
        question: "Wie viel Uhr ist es?",
        options,
        columns: 2,
        answer,
        reveal: `Richtig ist <b>${correctLabel}</b>.`,
      });
    },
  });
}

/* ---------------------------------------------------------
   Allgemeine Lese-Übung, die die globalen Einstellungen
   (Schwierigkeit + 12/24h) beachtet. Digitale Antworten.
   --------------------------------------------------------- */
function generalReadingGame(container, goHome) {
  const nextTarget = nonRepeating(genTime, (t) => `${t.h}:${t.m}`);
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const range24 = getSettings().range24;
      const target = nextTarget();
      const correctLabel = fmtDigital(target.h, target.m, range24);

      const clock = createClock({ size: 230, interactive: false });
      clock.setTime(target.h, target.m);

      // Ablenker mit eindeutigen Beschriftungen sammeln
      const labels = new Set([correctLabel]);
      let guard = 0;
      while (labels.size < 4 && guard++ < 300) {
        const d = genTime();
        labels.add(fmtDigital(d.h, d.m, range24));
      }
      const options = shuffle(
        [...labels].map((label) => ({ label, correct: label === correctLabel }))
      );

      choiceGrid(host, {
        prompt: clockPrompt(clock.el, range24, target.h),
        question: "Wie viel Uhr ist es?",
        options,
        columns: 2,
        answer,
        reveal: `Richtig ist <b>${correctLabel}</b>.`,
      });
    },
  });
}

/* ---------------------------------------------------------
   1) Volle Stunde – deutsche Sprechweise ("3 Uhr")
   --------------------------------------------------------- */
export function volleStunde(container, { goHome }) {
  readingGame(container, goHome, {
    genTime: () => ({ h: randInt(1, 12), m: 0 }),
    format: germanTime,
  });
}

/* ---------------------------------------------------------
   2) Halbe Stunde – volle und halbe Stunden gemischt
   --------------------------------------------------------- */
export function halbeStunde(container, { goHome }) {
  readingGame(container, goHome, {
    genTime: () => ({ h: randInt(1, 12), m: pick([0, 30]) }),
    format: germanTime,
  });
}

/* ---------------------------------------------------------
   3) Viertelstunde – :00 :15 :30 :45
   --------------------------------------------------------- */
export function viertelstunde(container, { goHome }) {
  readingGame(container, goHome, {
    genTime: () => ({ h: randInt(1, 12), m: pick([0, 15, 30, 45]) }),
    format: germanTime,
  });
}

/* ---------------------------------------------------------
   4) Minuten – allgemeine Übung (beachtet die Einstellungen)
   --------------------------------------------------------- */
export function minuten(container, { goHome }) {
  generalReadingGame(container, goHome);
}

/* ---------------------------------------------------------
   5) Uhr lesen – allgemeine Übung (beachtet die Einstellungen)
   --------------------------------------------------------- */
export function uhrLesen(container, { goHome }) {
  generalReadingGame(container, goHome);
}

/* ---------------------------------------------------------
   6) Uhr stellen – Zeiger auf die gesuchte Zeit ziehen
   --------------------------------------------------------- */
export function uhrStellen(container, { goHome }) {
  const nextTarget = nonRepeating(genTime, (t) => `${t.h}:${t.m}`);
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const range24 = getSettings().range24;
      const target = nextTarget();
      const targetLabel = fmtDigital(target.h, target.m, range24);
      // Klartext: bei 12h zusätzlich die deutsche Sprechweise
      const spoken = range24
        ? `${targetLabel} <span class="muted">(${dayPartFor(target.h).name})</span>`
        : `${germanTime(target.h, target.m)} <span class="muted">(${targetLabel})</span>`;

      const task = document.createElement("div");
      task.className = "quiz__question";
      task.innerHTML = `Stelle ein: <b>${spoken}</b>`;

      const snap = getSettings().difficulty === 4 ? 5 : 1;
      const clock = createClock({
        size: 250,
        interactive: true,
        snapMinutes: snap,
      });
      // auf 1:00 vorstellen, damit beide Zeiger sichtbar sind (bei 12:00 überlappen sie)
      clock.setTime(1, 0);

      const hint = document.createElement("div");
      hint.className = "quiz__hint-small";
      hint.textContent = "Ziehe die Zeiger mit dem Finger.";

      const check = document.createElement("button");
      check.className = "btn btn--primary";
      check.textContent = "Prüfen";
      check.addEventListener("click", () => {
        check.disabled = true;
        clock.setInteractive(false);
        const t = clock.getTime();
        // Analoguhr zeigt 12h-Position -> Stunde modulo 12 vergleichen
        const correct = sameHour12(t.h, target.h) && t.m === target.m;
        answer(correct, {
          reveal: `Gesucht war <b>${targetLabel}</b>.`,
        });
      });

      host.append(task, clock.el, hint, check);
    },
  });
}

/* ---------------------------------------------------------
   7) Digital & Analog – passende Uhr zur digitalen Zeit wählen
   --------------------------------------------------------- */
export function digitalAnalog(container, { goHome }) {
  const nextTarget = nonRepeating(genTime, (t) => `${t.h % 12}:${t.m}`);
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const range24 = getSettings().range24;
      const target = nextTarget();
      const targetLabel = fmtDigital(target.h, target.m, range24);

      // Frage: große digitale Zeit
      const prompt = document.createElement("div");
      prompt.className = "big-digital";
      prompt.textContent = targetLabel;

      // Vier Uhren – Ablenker müssen sich auf dem Zifferblatt
      // unterscheiden (Stunde modulo 12 + Minute), sonst sähen
      // zwei Uhren gleich aus.
      const faceKey = (t) => `${t.h % 12}:${t.m}`;
      const keys = new Set([faceKey(target)]);
      const list = [target];
      let guard = 0;
      while (list.length < 4 && guard++ < 300) {
        const d = genTime();
        if (!keys.has(faceKey(d))) {
          keys.add(faceKey(d));
          list.push(d);
        }
      }

      const options = shuffle(list).map((t) => {
        const mini = createClock({
          size: 120,
          showNumbers: true,
          showTicks: false,
          interactive: false,
        });
        mini.setTime(t.h, t.m);
        return {
          node: mini.el,
          correct: sameHour12(t.h, target.h) && t.m === target.m,
        };
      });

      choiceGrid(host, {
        prompt,
        question: "Welche Uhr zeigt diese Zeit?",
        options,
        columns: 2,
        answer,
        reveal: `Gesucht war <b>${targetLabel}</b>.`,
      });
    },
  });
}

/* ---------------------------------------------------------
   8) Tageszeit – Morgen / Mittag / Abend / Nacht (mit Emoji)
   Nutzt die in den Einstellungen konfigurierten Tageszeiten.
   --------------------------------------------------------- */
export function tageszeit(container, { goHome }) {
  const nextRound = nonRepeating(
    () => {
      const ranges = dayPartRanges();
      const cat = pick(ranges);
      // zufällige Stunde innerhalb dieser Tageszeit (auch über Mitternacht)
      const span = ((cat.end - cat.start + 24) % 24) + 1;
      const hour24 = (cat.start + randInt(0, span - 1)) % 24;
      // Minuten gemäß Schwierigkeitsstufe
      const minutes = MINUTE_SETS[getSettings().difficulty] || MINUTE_SETS[4];
      return { ranges, cat, hour24, m: pick(minutes) };
    },
    (r) => `${r.cat.key}:${r.hour24}:${r.m}`
  );
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const { ranges, cat, hour24, m } = nextRound();

      const scene = document.createElement("div");
      scene.className = "scene";
      scene.innerHTML = `<div class="scene__emoji">${cat.emoji}</div>
        <div class="scene__time">${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")} Uhr</div>`;

      // Ab Stufe 2 keine Emojis auf den Buttons (sonst zu leicht ableitbar)
      const showIcons = getSettings().difficulty <= 1;
      const options = ranges.map((t) => ({
        label: showIcons ? `${t.emoji} ${t.name}` : t.name,
        correct: t.key === cat.key,
      }));

      choiceGrid(host, {
        prompt: scene,
        question: "Welche Tageszeit ist das?",
        options,
        columns: 2,
        answer,
        reveal: `Das ist <b>${cat.name}</b>.`,
      });
    },
  });
}

/* ---------------------------------------------------------
   9) 24 Stunden zuordnen – Drag & Drop
   Rund um die 12-Stunden-Uhr wird jeder Position die passende
   24-Stunden-Zeit (13–24/0 Uhr) zugeordnet. Die Kärtchen
   werden mit dem Finger an die richtige Stelle gezogen.
   --------------------------------------------------------- */
export function stundenZuordnen(container, { goHome }) {
  const wrap = document.createElement("div");
  wrap.className = "stunden";

  const intro = document.createElement("div");
  intro.className = "quiz__question";
  intro.innerHTML =
    'Ein Tag hat <b>24 Stunden</b>.<br><span class="muted">Ziehe jede Uhrzeit an die richtige Stelle.</span>';

  const status = document.createElement("div");
  status.className = "stunden__status";

  const board = document.createElement("div");
  board.className = "stunden__board";

  const clock = createClock({
    size: 200,
    showNumbers: true,
    showTicks: true,
    interactive: false,
  });
  clock.setTime(12, 0);
  clock.el.classList.add("stunden__clock");
  board.appendChild(clock.el);

  // Drop-Zonen rund um die Uhr (Position 1..12)
  const zones = [];
  const R = 44; // Abstand vom Mittelpunkt in % der Boardgröße
  for (let p = 1; p <= 12; p++) {
    const hour24 = p === 12 ? 24 : p + 12;
    const a = (p * 30 * Math.PI) / 180;
    const zone = document.createElement("div");
    zone.className = "dropzone";
    zone.style.left = `${50 + R * Math.sin(a)}%`;
    zone.style.top = `${50 - R * Math.cos(a)}%`;
    board.appendChild(zone);
    zones.push({ hour24, el: zone, filled: false });
  }

  // Kärtchen 13..24
  const tray = document.createElement("div");
  tray.className = "stunden__tray";
  const hours = [];
  for (let h = 13; h <= 24; h++) hours.push(h);
  const total = hours.length;
  let placed = 0;

  function updateStatus() {
    status.textContent = `${placed} / ${total} zugeordnet`;
  }

  function zoneAtPoint(x, y) {
    for (const z of zones) {
      if (z.filled) continue;
      const r = z.el.getBoundingClientRect();
      const m = 16; // etwas Toleranz für kleine Finger
      if (x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m) {
        return z;
      }
    }
    return null;
  }

  function lockInto(chip, zone) {
    zone.filled = true;
    zone.el.classList.add("is-filled");
    zone.el.textContent = chip.textContent;
    chip.remove();
    placed++;
    updateStatus();
    playCorrect();
    if (placed === total) finish();
  }

  function makeDraggable(chip) {
    let sx = 0,
      sy = 0,
      dragging = false;

    chip.addEventListener("pointerdown", (e) => {
      dragging = true;
      sx = e.clientX;
      sy = e.clientY;
      chip.setPointerCapture(e.pointerId);
      chip.classList.add("is-dragging");
    });

    chip.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      chip.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
    });

    function end(e) {
      if (!dragging) return;
      dragging = false;
      chip.classList.remove("is-dragging");
      try {
        chip.releasePointerCapture(e.pointerId);
      } catch (_) {}

      const zone = zoneAtPoint(e.clientX, e.clientY);
      if (zone && zone.hour24 === Number(chip.dataset.hour24)) {
        lockInto(chip, zone);
      } else {
        // sanft zurück an den Ausgangsort
        if (zone) {
          playWrong();
          chip.classList.add("shake");
          setTimeout(() => chip.classList.remove("shake"), 400);
        }
        chip.style.transition = "transform 0.2s ease";
        chip.style.transform = "";
        setTimeout(() => (chip.style.transition = ""), 220);
      }
    }

    chip.addEventListener("pointerup", end);
    chip.addEventListener("pointercancel", end);
  }

  shuffle(hours).forEach((h) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.dataset.hour24 = String(h);
    chip.textContent = h === 24 ? "0 / 24 Uhr" : `${h} Uhr`;
    makeDraggable(chip);
    tray.appendChild(chip);
  });

  function finish() {
    // Vollständig gelöst = alles richtig -> zählen + Sterne gutschreiben
    recordCompletion();
    const res = addStars(3);
    if (res.reached) celebrate(res.milestone);
    else playFanfare();

    const done = document.createElement("div");
    done.className = "stunden__done";

    const title = document.createElement("div");
    title.className = "stunden__done-title";
    title.textContent = "🎉 Geschafft!";

    const collected = document.createElement("div");
    collected.className = "quiz__result-collected";
    collected.innerHTML = `+3 ⭐ &nbsp;·&nbsp; gesammelt: <b>${res.total}</b> ⭐`;

    const again = document.createElement("button");
    again.className = "btn btn--primary";
    again.textContent = "Nochmal";
    again.addEventListener("click", () => {
      container.innerHTML = "";
      stundenZuordnen(container, { goHome });
    });

    const home = document.createElement("button");
    home.className = "btn btn--light";
    home.textContent = "Zur Übersicht";
    home.addEventListener("click", goHome);

    done.append(title, collected, again, home);
    wrap.appendChild(done);
  }

  updateStatus();
  wrap.append(intro, status, board, tray);
  container.appendChild(wrap);
}

/* ---------------------------------------------------------
   10) 12h- & 24h-Zeit eintragen
   Es wird eine analoge oder digitale Uhr gezeigt. Darunter
   trägt das Kind beide Zeiten ein: die 12-Stunden- und die
   24-Stunden-Zeit (z. B. 4 Uhr / 16 Uhr).
   Die Minuten richten sich nach der Schwierigkeitsstufe.
   --------------------------------------------------------- */

/** Eingabe wie "4", "16:30", "4.00 uhr" zu { h, m } parsen. */
function parseTimeInput(str) {
  if (!str) return null;
  let s = str.toLowerCase().replace("uhr", "").trim();
  if (!s) return null;
  const sep = s.includes(":") ? ":" : s.includes(".") ? "." : null;
  let h, m;
  if (sep) {
    const [a, b] = s.split(sep);
    h = parseInt(a, 10);
    m = parseInt(b, 10);
  } else {
    h = parseInt(s, 10);
    m = 0;
  }
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { h, m };
}

/** Anzeigeformat: "4 Uhr" bzw. "16:30 Uhr". */
function fmtUhr(h, m) {
  return m === 0 ? `${h} Uhr` : `${h}:${String(m).padStart(2, "0")} Uhr`;
}

export function zeitEintragen(container, { goHome }) {
  const nextRound = nonRepeating(
    () => {
      const minutes = MINUTE_SETS[getSettings().difficulty] || MINUTE_SETS[4];
      const h12 = randInt(1, 11); // 12 wird ausgelassen (0/24 wäre mehrdeutig)
      return {
        m: pick(minutes),
        h12,
        h24: h12 + 12, // 13..23
        showDigital: Math.random() < 0.5,
      };
    },
    (r) => `${r.h12}:${r.m}`
  );
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const s = getSettings();
      const { m, h12, h24, showDigital } = nextRound();

      const prompt = document.createElement("div");
      prompt.className = "enter-prompt";

      if (showDigital) {
        const dev = document.createElement("div");
        dev.className = "digi-clock";
        dev.textContent = `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        prompt.appendChild(dev);
      } else {
        const clock = createClock({ size: 210, interactive: false });
        clock.setTime(h12, m);
        prompt.appendChild(clock.el);
      }

      host.appendChild(prompt);

      const q = document.createElement("div");
      q.className = "quiz__question";
      q.textContent = "Trage beide Zeiten ein:";
      host.appendChild(q);

      const withMinutes = s.difficulty > 1;
      const ph = withMinutes ? "z. B. 9:30" : "z. B. 9";

      const row12 = buildInputRow("Frühe Zeit", ph);
      const row24 = buildInputRow("Späte Zeit", withMinutes ? "z. B. 21:30" : "z. B. 21");
      host.append(row12.el, row24.el);

      const check = document.createElement("button");
      check.className = "btn btn--primary";
      check.textContent = "Prüfen";

      function submit() {
        const a12 = parseTimeInput(row12.input.value);
        const a24 = parseTimeInput(row24.input.value);

        const ok12 = a12 && a12.h === h12 && a12.m === m;
        // 24h: h24 (13..23); 0 statt 24 hier nicht nötig, da 12 ausgelassen
        const ok24 = a24 && a24.h === h24 && a24.m === m;

        row12.mark(ok12);
        row24.mark(ok24);

        check.disabled = true;
        row12.input.disabled = true;
        row24.input.disabled = true;

        answer(ok12 && ok24, {
          reveal: `Frühe Zeit: <b>${fmtUhr(h12, m)}</b><br>Späte Zeit: <b>${fmtUhr(
            h24,
            m
          )}</b>`,
        });
      }

      check.addEventListener("click", submit);
      // Enter im frühen Feld: nicht abschicken, sondern zum späten Feld wechseln
      row12.input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          row24.input.focus();
        }
      });
      // Enter im späten Feld: Aufgabe prüfen
      row24.input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      });

      host.appendChild(check);
    },
  });
}

/** Baut eine beschriftete Eingabezeile mit Einheit (Standard "Uhr") und Markierung. */
function buildInputRow(labelText, placeholder, suffixText = "Uhr") {
  const el = document.createElement("div");
  el.className = "enter-row";

  const label = document.createElement("label");
  label.className = "enter-row__label";
  label.textContent = labelText;

  const field = document.createElement("div");
  field.className = "enter-row__field";

  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "numeric";
  input.className = "enter-input";
  input.placeholder = placeholder;
  input.autocomplete = "off";

  const suffix = document.createElement("span");
  suffix.className = "enter-row__suffix";
  suffix.textContent = suffixText;

  field.append(input, suffix);
  el.append(label, field);

  return {
    el,
    input,
    mark(ok) {
      field.classList.add(ok ? "is-correct" : "is-wrong");
    },
  };
}

/* ---------------------------------------------------------
   11) Digitaluhr -> Tageszeit
   Eine Digitaluhr zeigt eine Zeit (0–24 Uhr). Welche Tageszeit
   ist das? Nutzt die in den Einstellungen konfigurierten Grenzen.
   --------------------------------------------------------- */
export function digitalTageszeit(container, { goHome }) {
  const nextRound = nonRepeating(
    () => {
      const minutes = MINUTE_SETS[getSettings().difficulty] || MINUTE_SETS[4];
      return { hour24: randInt(0, 23), m: pick(minutes) };
    },
    (r) => `${r.hour24}:${r.m}`
  );
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const parts = getDayParts();
      const { hour24, m } = nextRound();
      const correct = dayPartFor(hour24);

      const prompt = document.createElement("div");
      prompt.className = "enter-prompt";
      const dev = document.createElement("div");
      dev.className = "digi-clock";
      dev.textContent = `${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      prompt.appendChild(dev);

      const options = parts.map((p) => ({
        label: `${p.emoji} ${p.name}`,
        correct: p.key === correct.key,
      }));

      choiceGrid(host, {
        prompt,
        question: "Welche Tageszeit ist das?",
        options,
        columns: 2,
        answer,
        reveal: `Das ist <b>${correct.name}</b>.`,
      });
    },
  });
}

/* ---------------------------------------------------------
   12) Analoguhr + Aktivität -> Tageszeit
   Eine analoge Uhr steht neben einem typischen Aktivitäts-Bild
   (z. B. Frühstück, Schule, Schlafen). Das Kind ordnet die
   passende Tageszeit zu. Das Bild löst zugleich auf, ob es
   vormittags oder nachmittags ist.
   --------------------------------------------------------- */
const ACTIVITIES = {
  morgen: ["🥣", "🪥", "🐓", "🌞"],
  vormittag: ["🏫", "📚", "✏️", "🎒"],
  mittag: ["🍽️", "🍝", "🥪", "🍎"],
  nachmittag: ["⚽", "🚲", "🎨", "🛝"],
  abend: ["🛁", "📺", "🍲", "🦷"],
  nacht: ["😴", "🛏️", "🌙", "⭐"],
};

export function tageszeitAktivitaet(container, { goHome }) {
  const nextRound = nonRepeating(
    () => {
      const ranges = dayPartRanges();
      const cat = pick(ranges);
      const span = ((cat.end - cat.start + 24) % 24) + 1;
      const hour24 = (cat.start + randInt(0, span - 1)) % 24;
      const minutes = MINUTE_SETS[getSettings().difficulty] || MINUTE_SETS[4];
      return { ranges, cat, hour24, m: pick(minutes) };
    },
    (r) => `${r.cat.key}:${r.hour24}:${r.m}`
  );
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const { ranges, cat, hour24, m } = nextRound();
      const activity = pick(ACTIVITIES[cat.key] || ["⏰"]);

      // Uhr + Aktivitätsbild nebeneinander
      const scene = document.createElement("div");
      scene.className = "act-scene";

      const clock = createClock({ size: 170, interactive: false });
      clock.setTime(hour24, m);

      const pic = document.createElement("div");
      pic.className = "act-scene__pic";
      pic.textContent = activity;

      scene.append(clock.el, pic);

      // Ab Stufe 2 keine Emojis auf den Buttons
      const showIcons = getSettings().difficulty <= 1;
      const options = ranges.map((t) => ({
        label: showIcons ? `${t.emoji} ${t.name}` : t.name,
        correct: t.key === cat.key,
      }));

      choiceGrid(host, {
        prompt: scene,
        question: "Welche Tageszeit ist das?",
        options,
        columns: 2,
        answer,
        reveal: `Das ist <b>${cat.name}</b>.`,
      });
    },
  });
}

/* ---------------------------------------------------------
   13) Gemischt – wie das Arbeitsblatt "Die Uhr"
   Pro Frage zufällig einer von drei Aufgabentypen:
     A) analoge Uhr ablesen -> 12h- und 24h-Zeit eintragen
     B) Digitalzeit vorgegeben -> Zeiger an der Uhr einstellen
     C) analoge Uhr ablesen -> Digitalzeit eintippen
   Beachtet Schwierigkeitsstufe und 12/24h-Einstellung.
   --------------------------------------------------------- */
export function gemischteUhr(container, { goHome }) {
  const TYPES = ["both", "set", "read"];
  // Aufgabe (Typ + Werte) vorab erzeugen, nie zweimal dieselbe hintereinander
  const nextSpec = nonRepeating(
    () => {
      const s = getSettings();
      const minutes = MINUTE_SETS[s.difficulty] || MINUTE_SETS[4];
      const type = pick(TYPES);
      if (type === "both") {
        const h12 = randInt(1, 11);
        return { type, m: pick(minutes), h12, h24: h12 + 12 };
      } else if (type === "set") {
        const range24 = s.range24;
        return {
          type,
          range24,
          m: pick(minutes),
          h: range24 ? randInt(0, 23) : randInt(1, 12),
        };
      }
      return { type: "read", range24: s.range24, target: genTime() };
    },
    (sp) =>
      sp.type === "both"
        ? `both:${sp.h12}:${sp.m}`
        : sp.type === "set"
        ? `set:${sp.h}:${sp.m}`
        : `read:${sp.target.h}:${sp.target.m}`
  );
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const s = getSettings();
      const withMin = s.difficulty > 1;
      const spec = nextSpec();
      const type = spec.type;

      if (type === "both") {
        // ---- A) Analog ablesen -> 12h & 24h ----
        const m = spec.m;
        const h12 = spec.h12;
        const h24 = spec.h24;

        const clock = createClock({ size: 200, interactive: false });
        clock.setTime(h12, m);
        host.appendChild(clock.el);

        const q = document.createElement("div");
        q.className = "quiz__question";
        q.textContent = "Trage beide Zeiten ein:";
        host.appendChild(q);

        const row12 = buildInputRow("Frühe Zeit", withMin ? "z. B. 9:30" : "z. B. 9");
        const row24 = buildInputRow("Späte Zeit", withMin ? "z. B. 21:30" : "z. B. 21");
        host.append(row12.el, row24.el);

        const check = mkCheckButton();
        function submit() {
          const a12 = parseTimeInput(row12.input.value);
          const a24 = parseTimeInput(row24.input.value);
          const ok12 = a12 && a12.h === h12 && a12.m === m;
          const ok24 = a24 && a24.h === h24 && a24.m === m;
          row12.mark(ok12);
          row24.mark(ok24);
          lockInputs(check, [row12.input, row24.input]);
          answer(ok12 && ok24, {
            reveal: `Frühe Zeit: <b>${fmtUhr(h12, m)}</b><br>Späte Zeit: <b>${fmtUhr(
              h24,
              m
            )}</b>`,
          });
        }
        check.addEventListener("click", submit);
        // Enter im frühen Feld: zum späten Feld wechseln statt abzuschicken
        row12.input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            row24.input.focus();
          }
        });
        row24.input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        });
        host.appendChild(check);
      } else if (type === "set") {
        // ---- B) Digitalzeit -> Zeiger einstellen ----
        const range24 = spec.range24;
        const m = spec.m;
        const h = spec.h;
        const targetLabel = fmtDigital(h, m, range24);

        const q = document.createElement("div");
        q.className = "quiz__question";
        q.textContent = "Stelle diese Zeit ein:";
        host.appendChild(q);

        const promptWrap = document.createElement("div");
        promptWrap.className = "enter-prompt";
        const box = document.createElement("div");
        box.className = "digi-clock digi-clock--small";
        box.textContent = targetLabel;
        promptWrap.appendChild(box);
        host.appendChild(promptWrap);

        const clock = createClock({
          size: 230,
          interactive: true,
          snapMinutes: s.difficulty === 4 ? 5 : 1,
        });
        // auf 1:00 vorstellen, damit beide Zeiger sichtbar sind (bei 12:00 überlappen sie)
        clock.setTime(1, 0);
        host.appendChild(clock.el);

        const hint = document.createElement("div");
        hint.className = "quiz__hint-small";
        hint.textContent = "Ziehe die Zeiger mit dem Finger.";
        host.appendChild(hint);

        const check = mkCheckButton();
        check.addEventListener("click", () => {
          check.disabled = true;
          clock.setInteractive(false);
          const t = clock.getTime();
          const correct = sameHour12(t.h, h) && t.m === m;
          answer(correct, { reveal: `Gesucht war <b>${targetLabel} Uhr</b>.` });
        });
        host.appendChild(check);
      } else {
        // ---- C) Analog ablesen -> Digitalzeit eintippen ----
        const range24 = spec.range24;
        const target = spec.target;
        const clock = createClock({ size: 210, interactive: false });
        clock.setTime(target.h, target.m);
        host.appendChild(clock.el);

        if (range24) host.appendChild(dayPartHint(target.h));

        const q = document.createElement("div");
        q.className = "quiz__question";
        q.textContent = "Wie spät ist es? Trage die Zeit ein:";
        host.appendChild(q);

        const row = buildInputRow(
          "Uhrzeit",
          withMin ? "z. B. 7:30" : "z. B. 7"
        );
        host.appendChild(row.el);

        const check = mkCheckButton();
        function submit() {
          const a = parseTimeInput(row.input.value);
          const ok = a && a.h === target.h && a.m === target.m;
          row.mark(ok);
          lockInputs(check, [row.input]);
          answer(ok, {
            reveal: `Richtig ist <b>${fmtDigital(target.h, target.m, range24)} Uhr</b>.`,
          });
        }
        check.addEventListener("click", submit);
        row.input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        });
        host.appendChild(check);
      }
    },
  });
}

/** Erzeugt einen "Prüfen"-Knopf. */
function mkCheckButton() {
  const b = document.createElement("button");
  b.className = "btn btn--primary";
  b.textContent = "Prüfen";
  return b;
}

/** Prüfen-Knopf und Eingaben nach der Antwort sperren. */
function lockInputs(button, inputs) {
  button.disabled = true;
  inputs.forEach((i) => (i.disabled = true));
}

/* =========================================================
   Gemeinsame kleine Helfer für die neuen Übungen
   ========================================================= */

/** Mini-Helfer zum Element-Erzeugen (innerHTML, da wir den Inhalt steuern). */
function ce(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** Minuten seit Mitternacht (zum Sortieren). */
function minutesOfDay(t) {
  return t.h * 60 + t.m;
}

/** "HH:MM" (immer zweistellig, 24h) – z. B. für Fahrpläne. */
function fmtHHMM(min) {
  const h = Math.floor(min / 60) % 24;
  return `${pad2(h)}:${pad2(min % 60)}`;
}

/** n verschiedene Zeiten gemäß Einstellungen erzeugen. */
function distinctTimes(n, keyOf) {
  const key = keyOf || ((t) => `${t.h}:${t.m}`);
  const seen = new Set();
  const list = [];
  let guard = 0;
  while (list.length < n && guard++ < 400) {
    const t = genTime();
    const k = key(t);
    if (!seen.has(k)) {
      seen.add(k);
      list.push(t);
    }
  }
  return list;
}

/**
 * Sortier-Runde per Drag & Drop: Karten oben im Pool, darunter nummerierte
 * Kästchen (1..N). Die Karten werden in die richtige Reihenfolge gezogen,
 * "Prüfen" wertet aus.
 * cards: [{ el, key }] – el ist ein <button>, key eine Zahl.
 */
function orderingRound(host, answer, cards, { question, reveal }) {
  // Breiteren Container nutzen, damit die Karten in eine Reihe passen
  const quizEl = host.closest(".quiz");
  if (quizEl) quizEl.classList.add("quiz--wide");

  if (question) host.appendChild(ce("div", "quiz__question", question));

  const expected = [...cards].sort((a, b) => a.key - b.key);

  const pool = ce("div", "order-pool");
  const slotsWrap = ce("div", "order-slots");
  const slots = cards.map((_, i) => {
    const s = ce("div", "order-slot");
    s.appendChild(ce("span", "order-slot__num", String(i + 1)));
    s.card = null;
    return s;
  });
  slots.forEach((s) => slotsWrap.appendChild(s));

  const check = mkCheckButton();
  check.disabled = true;
  const updateCheck = () => {
    check.disabled = slots.some((s) => !s.card);
  };

  function placeInPool(card) {
    if (card.slot) {
      card.slot.card = null;
      card.slot = null;
    }
    card.el.classList.remove("in-slot");
    pool.appendChild(card.el);
  }
  function placeInSlot(card, slot) {
    if (slot.card && slot.card !== card) placeInPool(slot.card); // Platz frei machen
    if (card.slot && card.slot !== slot) card.slot.card = null;
    slot.card = card;
    card.slot = slot;
    card.el.classList.add("in-slot");
    slot.appendChild(card.el);
  }

  function dropTargetAt(x, y) {
    for (const s of slots) {
      const r = s.getBoundingClientRect();
      const m = 12;
      if (x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m) {
        return s;
      }
    }
    return null; // sonst zurück in den Pool
  }

  cards.forEach((card) => {
    card.el.classList.add("order-card");
    let ox = 0;
    let oy = 0;
    let dragging = false;

    card.el.addEventListener("pointerdown", (e) => {
      if (card.el.disabled) return;
      dragging = true;
      const r = card.el.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
      card.el.setPointerCapture(e.pointerId);
      card.el.classList.add("is-dragging");
      card.el.style.width = r.width + "px";
      card.el.style.height = r.height + "px";
      card.el.style.position = "fixed";
      card.el.style.left = e.clientX - ox + "px";
      card.el.style.top = e.clientY - oy + "px";
    });
    card.el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      card.el.style.left = e.clientX - ox + "px";
      card.el.style.top = e.clientY - oy + "px";
    });
    function end(e) {
      if (!dragging) return;
      dragging = false;
      card.el.classList.remove("is-dragging");
      try {
        card.el.releasePointerCapture(e.pointerId);
      } catch (_) {}
      const slot = dropTargetAt(e.clientX, e.clientY);
      // Stil zurücksetzen
      card.el.style.position = "";
      card.el.style.left = "";
      card.el.style.top = "";
      card.el.style.width = "";
      card.el.style.height = "";
      if (slot) placeInSlot(card, slot);
      else placeInPool(card);
      updateCheck();
    }
    card.el.addEventListener("pointerup", end);
    card.el.addEventListener("pointercancel", end);
    pool.appendChild(card.el);
  });

  check.addEventListener("click", () => {
    let correct = true;
    slots.forEach((s, i) => {
      const ok = s.card && s.card.key === expected[i].key;
      s.classList.add(ok ? "is-correct" : "is-wrong");
      if (!ok) correct = false;
    });
    cards.forEach((c) => (c.el.disabled = true));
    check.disabled = true;
    answer(correct, { reveal });
  });

  host.append(pool, slotsWrap, check);
}

/** Standard-Abschluss mit Sternen (für Nicht-Quiz-Übungen). */
function finishWithStars(wrap, container, goHome, rerun, titleText) {
  recordCompletion();
  const res = addStars(3);
  if (res.reached) celebrate(res.milestone);
  else playFanfare();

  const done = ce("div", "stunden__done");
  done.append(ce("div", "stunden__done-title", titleText));
  done.append(
    ce("div", "quiz__result-collected", `+3 ⭐ &nbsp;·&nbsp; gesammelt: <b>${res.total}</b> ⭐`)
  );
  const again = ce("button", "btn btn--primary", "Nochmal");
  again.addEventListener("click", () => {
    container.innerHTML = "";
    rerun();
  });
  const home = ce("button", "btn btn--light", "Zur Übersicht");
  home.addEventListener("click", goHome);
  done.append(again, home);
  wrap.appendChild(done);
}

/* =========================================================
   KATEGORIE 3 – Spielerische Formate
   ========================================================= */

/* 14) Memory – gleiche Zeit als Uhr und als Zahl finden */
export function memory(container, { goHome }) {
  const range24 = getSettings().range24;
  const wrap = ce("div", "memory");
  wrap.appendChild(ce("div", "quiz__question", "Finde die Paare: gleiche Zeit als Uhr und als Zahl."));
  const status = ce("div", "stunden__status", "");
  wrap.appendChild(status);

  const times = distinctTimes(4, (t) => `${t.h % 12}:${t.m}`);
  let deck = [];
  times.forEach((t, i) => {
    deck.push({ pair: i, kind: "analog", t });
    deck.push({ pair: i, kind: "digital", t });
  });
  deck = shuffle(deck);

  const grid = ce("div", "memory-grid");
  let first = null;
  let lock = false;
  let matched = 0;
  let moves = 0;

  const updateStatus = () => {
    status.textContent = `Paare: ${matched} / 4 · Versuche: ${moves}`;
  };
  const reveal = (card, on) => {
    card.revealed = on;
    card.el.classList.toggle("is-up", on);
  };

  deck.forEach((card) => {
    const el = ce("button", "mcard");
    el.appendChild(ce("div", "mcard__back", "❓"));
    const front = ce("div", "mcard__front");
    if (card.kind === "analog") {
      const c = createClock({ size: 92, showNumbers: true, showTicks: false, interactive: false });
      c.setTime(card.t.h, card.t.m);
      front.appendChild(c.el);
    } else {
      front.classList.add("mcard__digi");
      front.textContent = fmtDigital(card.t.h, card.t.m, range24);
    }
    el.appendChild(front);
    card.el = el;

    el.addEventListener("click", () => {
      if (lock || card.done || card.revealed) return;
      reveal(card, true);
      if (!first) {
        first = card;
        return;
      }
      moves++;
      updateStatus();
      if (first.pair === card.pair) {
        first.done = card.done = true;
        matched++;
        updateStatus();
        playCorrect();
        first = null;
        if (matched === 4) {
          finishWithStars(wrap, container, goHome, () => memory(container, { goHome }), "🎉 Alle Paare gefunden!");
        }
      } else {
        playWrong();
        lock = true;
        const a = first;
        const b = card;
        first = null;
        setTimeout(() => {
          reveal(a, false);
          reveal(b, false);
          lock = false;
        }, 900);
      }
    });
    grid.appendChild(el);
  });

  updateStatus();
  wrap.appendChild(grid);
  container.appendChild(wrap);
}

/* 15) Sortieren – Uhren von früh nach spät antippen */
export function sortieren(container, { goHome }) {
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const range24 = getSettings().range24;
      const times = distinctTimes(4);
      const cards = shuffle(times).map((t) => {
        const el = ce("button", "order-card");
        const c = createClock({ size: 104, showNumbers: true, showTicks: false, interactive: false });
        c.setTime(t.h, t.m);
        el.appendChild(c.el);
        return { el, key: minutesOfDay(t) };
      });
      const correctList = [...times]
        .sort((a, b) => minutesOfDay(a) - minutesOfDay(b))
        .map((t) => fmtDigital(t.h, t.m, range24))
        .join(", ");
      orderingRound(host, answer, cards, {
        question: "Ziehe die Uhren in die Kästchen – von früh nach spät.",
        reveal: `Richtige Reihenfolge: <b>${correctList}</b>.`,
      });
    },
  });
}

/* 16) Stoppuhr – bei genau X Sekunden stoppen */
export function stoppuhr(container, { goHome }) {
  const TOL = { 1: 1.0, 2: 0.7, 3: 0.5, 4: 0.3 };
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const tol = TOL[getSettings().difficulty] || 0.5;
      const targetSec = randInt(3, 8);

      host.appendChild(ce("div", "quiz__question", `Stoppe bei genau <b>${targetSec} Sekunden</b>!`));
      const disp = ce("div", "stopwatch", "0.0");
      host.appendChild(disp);
      const btn = mkCheckButton();
      btn.textContent = "Start";
      host.appendChild(btn);

      let startT = 0;
      let raf = 0;
      let running = false;
      let stopped = false;

      function frame() {
        if (!disp.isConnected) {
          cancelAnimationFrame(raf);
          return;
        }
        disp.textContent = ((performance.now() - startT) / 1000).toFixed(1);
        raf = requestAnimationFrame(frame);
      }

      btn.addEventListener("click", () => {
        if (stopped) return;
        if (!running) {
          running = true;
          btn.textContent = "Stopp!";
          startT = performance.now();
          raf = requestAnimationFrame(frame);
        } else {
          stopped = true;
          cancelAnimationFrame(raf);
          const elapsed = (performance.now() - startT) / 1000;
          disp.textContent = elapsed.toFixed(1);
          btn.disabled = true;
          const ok = Math.abs(elapsed - targetSec) <= tol;
          answer(ok, {
            reveal: `Du hast bei <b>${elapsed.toFixed(1)} s</b> gestoppt. Ziel: ${targetSec} s (±${tol} s).`,
          });
        }
      });
    },
  });
}

/* =========================================================
   KATEGORIE 4 – Hören
   ========================================================= */

/** Passende deutsche Stimme suchen (falls vorhanden). */
function germanVoice() {
  try {
    return window.speechSynthesis.getVoices().find((v) => /de(-|_)/i.test(v.lang)) || null;
  } catch (_) {
    return null;
  }
}
// Stimmen vorladen (manche Browser füllen die Liste erst asynchron)
if ("speechSynthesis" in window) {
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", () => window.speechSynthesis.getVoices());
  } catch (_) {}
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  try {
    const sy = window.speechSynthesis;
    sy.cancel(); // laufende Ausgabe stoppen
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    u.rate = 0.9;
    const v = germanVoice();
    if (v) u.voice = v;
    sy.speak(u);
  } catch (_) {}
}

function spokenTime(t, range24) {
  if (range24) return t.m ? `${t.h} Uhr ${t.m}` : `${t.h} Uhr`;
  return germanTime(t.h, t.m);
}

/* 17) Hör zu – gesprochene Zeit anhören und an der Uhr einstellen.
   Wichtig: Auf Tablets/iOS darf Ton nur nach einer Berührung abspielen,
   daher ist der große "Zeit anhören"-Knopf die Hauptaktion. */
export function hoerZu(container, { goHome }) {
  const nextTarget = nonRepeating(genTime, (t) => `${t.h}:${t.m}`);
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const range24 = getSettings().range24;
      const target = nextTarget();
      const phrase = spokenTime(target, range24);

      host.appendChild(ce("div", "quiz__question", "Höre die Uhrzeit und stelle die Uhr."));

      // Anhör-Knopf wird IMMER angezeigt (Ton startet erst beim Tippen – iOS-Regel)
      const listen = ce("button", "btn btn--primary listen-btn", "🔊 Zeit anhören");
      listen.addEventListener("click", () => speak(phrase));
      host.appendChild(listen);

      // Notfall: Zeit anzeigen (falls auf einem Gerät kein Ton möglich ist)
      const textEl = ce("div", "quiz__question hoer-text", "");
      const showBtn = ce("button", "btn btn--light", "👁 Zeit anzeigen");
      showBtn.addEventListener("click", () => {
        textEl.innerHTML = `<b>${phrase} Uhr</b>`;
        showBtn.style.display = "none";
      });
      host.appendChild(showBtn);
      host.appendChild(textEl);

      // Bester Versuch, beim Öffnen vorzulesen (auf iOS evtl. erst nach Tippen)
      speak(phrase);

      const clock = createClock({
        size: 230,
        interactive: true,
        snapMinutes: getSettings().difficulty === 4 ? 5 : 1,
      });
      clock.setTime(1, 0);
      host.appendChild(clock.el);

      const check = mkCheckButton();
      check.addEventListener("click", () => {
        check.disabled = true;
        clock.setInteractive(false);
        const t = clock.getTime();
        const ok = sameHour12(t.h, target.h) && t.m === target.m;
        answer(ok, { reveal: `Das war <b>${fmtDigital(target.h, target.m, range24)} Uhr</b>.` });
      });
      host.appendChild(check);
    },
  });
}

/* =========================================================
   KATEGORIE 5 – Alltag
   ========================================================= */

/* 18) Fahrplan – wann fährt der nächste Bus? */
export function fahrplan(container, { goHome }) {
  const INTERVALS = { 1: 60, 2: 30, 3: 15 };
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const d = getSettings().difficulty;
      const interval = INTERVALS[d] || pick([5, 10, 20]);
      const base = randInt(6, 19) * 60;
      const deps = [];
      for (let i = 0; i < 5; i++) deps.push(base + i * interval);
      const k = randInt(0, 3);
      const now = deps[k] + Math.max(1, Math.floor(interval / 2));
      const correct = deps[k + 1];

      const prompt = ce("div", "fahrplan-wrap");
      const table = ce("div", "fahrplan");
      table.appendChild(ce("div", "fahrplan__title", "🚌 Abfahrten"));
      deps.forEach((x) => table.appendChild(ce("div", "fahrplan__row", `${fmtHHMM(x)} Uhr`)));
      prompt.appendChild(table);
      prompt.appendChild(ce("div", "fahrplan__now", `Jetzt ist es <b>${fmtHHMM(now)} Uhr</b>.`));

      const options = deps.map((x) => ({ label: `${fmtHHMM(x)} Uhr`, correct: x === correct }));

      choiceGrid(host, {
        prompt,
        question: "Wann fährt der nächste Bus?",
        options,
        columns: 2,
        answer,
        reveal: `Der nächste Bus fährt um <b>${fmtHHMM(correct)} Uhr</b>.`,
      });
    },
  });
}

/* 19) Tagesplan – Tagesablauf in die richtige Reihenfolge bringen */
const TAGESPLAN = [
  { emoji: "⏰", label: "Aufstehen", h: 6, m: 30 },
  { emoji: "🥣", label: "Frühstück", h: 7, m: 0 },
  { emoji: "🏫", label: "Schule", h: 8, m: 0 },
  { emoji: "🍽️", label: "Mittagessen", h: 12, m: 30 },
  { emoji: "📚", label: "Hausaufgaben", h: 15, m: 0 },
  { emoji: "⚽", label: "Spielen", h: 16, m: 30 },
  { emoji: "🛁", label: "Baden", h: 19, m: 0 },
  { emoji: "😴", label: "Schlafen", h: 20, m: 30 },
];

export function tagesplan(container, { goHome }) {
  const COUNT = { 1: 3, 2: 4, 3: 5, 4: 6 };
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const n = COUNT[getSettings().difficulty] || 4;
      const chosen = shuffle(TAGESPLAN).slice(0, n);
      const cards = shuffle(chosen).map((a) => {
        const el = ce(
          "button",
          "order-card order-card--act",
          `<div class="act-emoji">${a.emoji}</div><div class="act-label">${a.label}</div><div class="act-time">${a.h}:${pad2(a.m)} Uhr</div>`
        );
        return { el, key: a.h * 60 + a.m };
      });
      const correctList = [...chosen]
        .sort((a, b) => a.h * 60 + a.m - (b.h * 60 + b.m))
        .map((a) => a.label)
        .join(" → ");
      orderingRound(host, answer, cards, {
        question: "Ziehe die Bilder in die Kästchen – in die richtige Reihenfolge (früh → spät).",
        reveal: `Richtig: <b>${correctList}</b>.`,
      });
    },
  });
}

/* 20) Wecker – den Wecker auf die gesuchte Zeit stellen */
const WECKER_REASONS = [
  "zum Aufstehen",
  "für die Schule",
  "für den Sport",
  "zum Mittagessen",
  "für den Film",
  "für den Bus",
];

export function wecker(container, { goHome }) {
  const nextTarget = nonRepeating(genTime, (t) => `${t.h}:${t.m}`);
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const range24 = getSettings().range24;
      const target = nextTarget();
      const label = fmtDigital(target.h, target.m, range24);
      const reason = pick(WECKER_REASONS);

      host.appendChild(ce("div", "quiz__question", `⏰ Stelle den Wecker ${reason} auf <b>${label} Uhr</b>.`));
      const clock = createClock({
        size: 240,
        interactive: true,
        snapMinutes: getSettings().difficulty === 4 ? 5 : 1,
      });
      clock.setTime(1, 0);
      host.appendChild(clock.el);
      host.appendChild(ce("div", "quiz__hint-small", "Ziehe die Zeiger mit dem Finger."));

      const check = mkCheckButton();
      check.addEventListener("click", () => {
        check.disabled = true;
        clock.setInteractive(false);
        const t = clock.getTime();
        const ok = sameHour12(t.h, target.h) && t.m === target.m;
        answer(ok, { reveal: `Gesucht war <b>${label} Uhr</b>.` });
      });
      host.appendChild(check);
    },
  });
}

/* =========================================================
   KATEGORIE 1 – Zeitspannen & Rechnen (erst ab Stufe 4)
   ========================================================= */

/** Minuten addieren/subtrahieren auf der 12-Stunden-Uhr (Ergebnis 1..12). */
function addMinutes(h, m, delta) {
  const total = ((((h % 12) * 60 + m + delta) % 720) + 720) % 720;
  let nh = Math.floor(total / 60);
  if (nh === 0) nh = 12;
  return { h: nh, m: total % 60 };
}

/* 21) Zeit rechnen – "Wie spät ist es in/vor X Minuten?" */
export function rechnenZeit(container, { goHome }) {
  const next = nonRepeating(
    () => ({
      h: randInt(1, 12),
      m: pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]),
      delta: pick([5, 10, 15, 20, 30, 45]),
      dir: pick([1, -1]),
    }),
    (r) => `${r.h}:${r.m}:${r.delta}:${r.dir}`
  );
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const { h, m, delta, dir } = next();
      const res = addMinutes(h, m, delta * dir);

      const clock = createClock({ size: 200, interactive: false });
      clock.setTime(h, m);
      host.appendChild(clock.el);

      const word = dir > 0 ? `in ${delta} Minuten` : `vor ${delta} Minuten`;
      host.appendChild(ce("div", "quiz__question", `Wie spät ist es <b>${word}</b>?`));

      const row = buildInputRow("Antwort", "z. B. 4:15");
      host.appendChild(row.el);

      const check = mkCheckButton();
      function submit() {
        const a = parseTimeInput(row.input.value);
        const ok = a && a.h === res.h && a.m === res.m;
        row.mark(ok);
        lockInputs(check, [row.input]);
        answer(ok, { reveal: `Richtig: <b>${res.h}:${pad2(res.m)} Uhr</b>.` });
      }
      check.addEventListener("click", submit);
      row.input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      });
      host.appendChild(check);
    },
  });
}

/* 22) Wie lange? – Dauer zwischen zwei Uhrzeiten in Minuten */
export function dauer(container, { goHome }) {
  const next = nonRepeating(
    () => ({
      startH: randInt(1, 11),
      startM: pick([0, 15, 30, 45]),
      delta: pick([15, 30, 45, 60, 75, 90]),
    }),
    (r) => `${r.startH}:${r.startM}:${r.delta}`
  );
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const { startH, startM, delta } = next();
      const end = addMinutes(startH, startM, delta);

      const duo = ce("div", "duo-clock");
      [
        ["Start", startH, startM],
        ["Ende", end.h, end.m],
      ].forEach(([lab, hh, mm]) => {
        const box = ce("div", "duo-clock__item");
        const c = createClock({ size: 150, interactive: false });
        c.setTime(hh, mm);
        box.appendChild(c.el);
        box.appendChild(ce("div", "duo-clock__label", `${lab}: ${hh}:${pad2(mm)} Uhr`));
        duo.appendChild(box);
      });
      host.appendChild(duo);

      host.appendChild(ce("div", "quiz__question", "Wie viele Minuten vergehen?"));
      const row = buildInputRow("Dauer", "z. B. 30", "Minuten");
      host.appendChild(row.el);

      const check = mkCheckButton();
      function submit() {
        const n = parseInt(row.input.value, 10);
        const ok = n === delta;
        row.mark(ok);
        lockInputs(check, [row.input]);
        answer(ok, { reveal: `Es vergehen <b>${delta} Minuten</b>.` });
      }
      check.addEventListener("click", submit);
      row.input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      });
      host.appendChild(check);
    },
  });
}

/* =========================================================
   KATEGORIE 2 – Zeiteinheiten (erst ab Stufe 4)
   ========================================================= */

const UNIT_TASKS = [
  () => ({ q: "1 Stunde = ? Minuten", a: 60, suf: "Minuten" }),
  () => {
    const n = randInt(2, 5);
    return { q: `${n} Stunden = ? Minuten`, a: n * 60, suf: "Minuten" };
  },
  () => {
    const n = randInt(2, 5);
    return { q: `${n * 60} Minuten = ? Stunden`, a: n, suf: "Stunden" };
  },
  () => ({ q: "1 Minute = ? Sekunden", a: 60, suf: "Sekunden" }),
  () => ({ q: "1 Tag = ? Stunden", a: 24, suf: "Stunden" }),
  () => ({ q: "Eine halbe Stunde = ? Minuten", a: 30, suf: "Minuten" }),
  () => ({ q: "Eine Viertelstunde = ? Minuten", a: 15, suf: "Minuten" }),
];

/* 23) Einheiten umrechnen */
export function einheiten(container, { goHome }) {
  const next = nonRepeating(() => pick(UNIT_TASKS)(), (u) => u.q);
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const u = next();
      host.appendChild(ce("div", "quiz__question", u.q));
      const row = buildInputRow("Antwort", "z. B. 60", u.suf);
      host.appendChild(row.el);

      const check = mkCheckButton();
      function submit() {
        const n = parseInt(row.input.value, 10);
        const ok = n === u.a;
        row.mark(ok);
        lockInputs(check, [row.input]);
        answer(ok, { reveal: `Richtig: <b>${u.a} ${u.suf}</b>.` });
      }
      check.addEventListener("click", submit);
      row.input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      });
      host.appendChild(check);
    },
  });
}

const ZEIT_FAKTEN = [
  { q: "Wie viele Stunden hat ein Tag?", a: 24, opts: [12, 24, 60, 7] },
  { q: "Wie viele Minuten hat eine Stunde?", a: 60, opts: [24, 30, 60, 100] },
  { q: "Wie viele Sekunden hat eine Minute?", a: 60, opts: [30, 60, 100, 24] },
  { q: "Wie viele Tage hat eine Woche?", a: 7, opts: [5, 7, 10, 12] },
  { q: "Wie viele Monate hat ein Jahr?", a: 12, opts: [7, 10, 12, 24] },
  { q: "Wie viele Minuten hat eine halbe Stunde?", a: 30, opts: [15, 30, 45, 60] },
  { q: "Wie viele Minuten hat eine Viertelstunde?", a: 15, opts: [10, 15, 20, 30] },
];

/* 24) Zeit-Wissen – kleine Faktenfragen */
export function zeitWissen(container, { goHome }) {
  const next = nonRepeating(() => pick(ZEIT_FAKTEN), (f) => f.q);
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const f = next();
      const options = shuffle(f.opts).map((o) => ({
        label: String(o),
        correct: o === f.a,
      }));
      choiceGrid(host, {
        question: f.q,
        options,
        columns: 2,
        answer,
        reveal: `Richtig: <b>${f.a}</b>.`,
      });
    },
  });
}
