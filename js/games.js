/* =========================================================
   Die eigentlichen Übungen ("Spiele").
   Jede Funktion ist ein mount(container, { goHome }) und wird
   in exercises.js der jeweiligen Übung zugeordnet.
   ========================================================= */

import { createClock } from "./clock.js";
import { startQuiz, choiceGrid } from "./quiz.js";
import { playCorrect, playWrong, playFanfare } from "./sound.js";
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
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const target = genTime();
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
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const range24 = getSettings().range24;
      const target = genTime();
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
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const range24 = getSettings().range24;
      const target = genTime();
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
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const range24 = getSettings().range24;
      const target = genTime();
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
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const ranges = dayPartRanges();
      const cat = pick(ranges);
      // zufällige Stunde innerhalb dieser Tageszeit (auch über Mitternacht)
      const span = ((cat.end - cat.start + 24) % 24) + 1;
      const hour24 = (cat.start + randInt(0, span - 1)) % 24;
      // Minuten gemäß Schwierigkeitsstufe
      const minutes = MINUTE_SETS[getSettings().difficulty] || MINUTE_SETS[4];
      const m = pick(minutes);

      const scene = document.createElement("div");
      scene.className = "scene";
      scene.innerHTML = `<div class="scene__emoji">${cat.emoji}</div>
        <div class="scene__time">${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")} Uhr</div>`;

      const options = ranges.map((t) => ({
        label: `${t.emoji} ${t.name}`,
        correct: t.key === cat.key,
      }));

      choiceGrid(host, {
        prompt: scene,
        question: "Welche Tageszeit ist das?",
        options,
        columns: 2,
        answer,
        reveal: `Das ist der <b>${cat.name}</b>.`,
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
    playFanfare();
    const done = document.createElement("div");
    done.className = "stunden__done";

    const title = document.createElement("div");
    title.className = "stunden__done-title";
    title.textContent = "🎉 Geschafft!";

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

    done.append(title, again, home);
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
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const s = getSettings();
      const minutes = MINUTE_SETS[s.difficulty] || MINUTE_SETS[4];
      const m = pick(minutes);
      const h12 = randInt(1, 11); // 12 wird ausgelassen (0/24 wäre mehrdeutig)
      const h24 = h12 + 12; // 13..23

      // Anzeige abwechselnd analog oder digital
      const showDigital = Math.random() < 0.5;

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

      const row12 = buildInputRow("12-Stunden-Zeit", ph);
      const row24 = buildInputRow("24-Stunden-Zeit", withMinutes ? "z. B. 21:30" : "z. B. 21");
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
          reveal: `12-Stunden: <b>${fmtUhr(h12, m)}</b><br>24-Stunden: <b>${fmtUhr(
            h24,
            m
          )}</b>`,
        });
      }

      check.addEventListener("click", submit);
      row24.input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submit();
      });

      host.appendChild(check);
    },
  });
}

/** Baut eine beschriftete Eingabezeile mit "Uhr" und Markierung. */
function buildInputRow(labelText, placeholder) {
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
  suffix.textContent = "Uhr";

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
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const parts = getDayParts();
      const minutes = MINUTE_SETS[getSettings().difficulty] || MINUTE_SETS[4];
      const hour24 = randInt(0, 23);
      const m = pick(minutes);
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
        reveal: `Das ist der <b>${correct.name}</b>.`,
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
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const ranges = dayPartRanges();
      const cat = pick(ranges);
      const span = ((cat.end - cat.start + 24) % 24) + 1;
      const hour24 = (cat.start + randInt(0, span - 1)) % 24;
      const minutes = MINUTE_SETS[getSettings().difficulty] || MINUTE_SETS[4];
      const m = pick(minutes);
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

      const options = ranges.map((t) => ({
        label: `${t.emoji} ${t.name}`,
        correct: t.key === cat.key,
      }));

      choiceGrid(host, {
        prompt: scene,
        question: "Welche Tageszeit ist das?",
        options,
        columns: 2,
        answer,
        reveal: `Das ist der <b>${cat.name}</b>.`,
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
  startQuiz(container, {
    total: ROUNDS,
    goHome,
    buildRound(host, { answer }) {
      const s = getSettings();
      const minutes = MINUTE_SETS[s.difficulty] || MINUTE_SETS[4];
      const withMin = s.difficulty > 1;
      const type = pick(TYPES);

      if (type === "both") {
        // ---- A) Analog ablesen -> 12h & 24h ----
        const m = pick(minutes);
        const h12 = randInt(1, 11); // 12 ausgelassen (0/24 mehrdeutig)
        const h24 = h12 + 12;

        const clock = createClock({ size: 200, interactive: false });
        clock.setTime(h12, m);
        host.appendChild(clock.el);

        const q = document.createElement("div");
        q.className = "quiz__question";
        q.textContent = "Trage beide Zeiten ein:";
        host.appendChild(q);

        const row12 = buildInputRow("12-Stunden-Zeit", withMin ? "z. B. 9:30" : "z. B. 9");
        const row24 = buildInputRow("24-Stunden-Zeit", withMin ? "z. B. 21:30" : "z. B. 21");
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
            reveal: `12-Stunden: <b>${fmtUhr(h12, m)}</b><br>24-Stunden: <b>${fmtUhr(
              h24,
              m
            )}</b>`,
          });
        }
        check.addEventListener("click", submit);
        row24.input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") submit();
        });
        host.appendChild(check);
      } else if (type === "set") {
        // ---- B) Digitalzeit -> Zeiger einstellen ----
        const range24 = s.range24;
        const m = pick(minutes);
        const h = range24 ? randInt(0, 23) : randInt(1, 12);
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
        const range24 = s.range24;
        const target = genTime(); // beachtet Stufe + 12/24h
        const clock = createClock({ size: 210, interactive: false });
        clock.setTime(target.h, target.m);
        host.appendChild(clock.el);

        if (range24) host.appendChild(dayPartHint(target.h));

        const q = document.createElement("div");
        q.className = "quiz__question";
        q.textContent = "Wie spät ist es? Trage die Zeit ein:";
        host.appendChild(q);

        const row = buildInputRow(
          range24 ? "24-Stunden-Zeit" : "Uhrzeit",
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
          if (e.key === "Enter") submit();
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
