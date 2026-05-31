/* =========================================================
   Quiz-Engine: führt durch eine Reihe von Runden, zeigt
   Fortschritt, Punkte, Feedback und einen Ergebnisbildschirm.

   startQuiz(container, {
     total,       // Anzahl der Runden (Standard 8)
     goHome,      // zurück zur Übersicht
     buildRound,  // (host, { answer }) => void  -> rendert eine Runde
   })

   In buildRound rendert die Übung ihren Inhalt in "host" und
   ruft answer(true|false, { reveal }) auf, sobald das Kind
   geantwortet hat. "reveal" ist optionaler Text/HTML mit der
   richtigen Lösung (bei falscher Antwort).

   Zusätzlich: choiceGrid(...) als Helfer für Auswahl-Aufgaben.
   ========================================================= */

import { playCorrect, playWrong, playFanfare } from "./sound.js";
import { addStars } from "./stars.js";
import { celebrate } from "./celebrate.js";

export function startQuiz(container, config) {
  const total = config.total || 8;
  const goHome = config.goHome || (() => {});
  let index = 0;
  let score = 0;

  const root = document.createElement("div");
  root.className = "quiz";
  container.appendChild(root);

  function start() {
    index = 0;
    score = 0;
    nextRound();
  }

  function nextRound() {
    if (index >= total) {
      showResult();
      return;
    }
    root.innerHTML = "";

    // Kopf: Fortschritt + Punkte
    const head = document.createElement("div");
    head.className = "quiz__head";

    const bar = document.createElement("div");
    bar.className = "quiz__bar";
    const fill = document.createElement("div");
    fill.className = "quiz__bar-fill";
    fill.style.width = `${(index / total) * 100}%`;
    bar.appendChild(fill);

    const count = document.createElement("div");
    count.className = "quiz__count";
    count.textContent = `Frage ${index + 1} / ${total}`;

    head.append(count, bar);

    // Bühne für die Runde
    const host = document.createElement("div");
    host.className = "quiz__stage";

    root.append(head, host);

    let answered = false;
    config.buildRound(host, {
      answer(correct, opts = {}) {
        if (answered) return;
        answered = true;
        if (correct) score++;
        showFeedback(correct, opts.reveal);
      },
    });
  }

  function showFeedback(correct, reveal) {
    if (correct) playCorrect();
    else playWrong();

    const overlay = document.createElement("div");
    overlay.className = `quiz__feedback ${correct ? "is-correct" : "is-wrong"}`;

    const emoji = document.createElement("div");
    emoji.className = "quiz__feedback-emoji";
    emoji.textContent = correct ? "✓" : "✗";

    const text = document.createElement("div");
    text.className = "quiz__feedback-text";
    text.textContent = correct ? pick(PRAISE) : "Schau mal:";

    overlay.append(emoji, text);

    if (!correct && reveal) {
      const rev = document.createElement("div");
      rev.className = "quiz__feedback-reveal";
      rev.innerHTML = reveal;
      overlay.appendChild(rev);
    }

    // Weiter-Knopf mit 2-Sekunden-Animation und automatischem Auslösen.
    // Ein früher Klick löst sofort aus und stoppt den Timer.
    const next = document.createElement("button");
    next.className = "btn btn--light btn--timed";
    const label = index + 1 >= total ? "Ergebnis ansehen" : "Weiter ›";
    next.innerHTML =
      `<span class="btn__progress"></span><span class="btn__label">${label}</span>`;

    let advanced = false;
    let timer = null;
    function advance() {
      if (advanced) return;
      advanced = true;
      if (timer) clearTimeout(timer);
      if (!root.isConnected) return; // Übung wurde verlassen
      index++;
      nextRound();
    }
    next.addEventListener("click", advance);
    timer = setTimeout(advance, 2000);

    overlay.appendChild(next);

    root.appendChild(overlay);
  }

  function showResult() {
    root.innerHTML = "";

    const ratio = score / total;
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;

    // Sterne gutschreiben und ggf. 100er-Marke feiern
    const res = addStars(stars);
    if (res.reached) celebrate(res.milestone);
    else playFanfare();

    const wrap = document.createElement("div");
    wrap.className = "quiz__result";

    const starRow = document.createElement("div");
    starRow.className = "quiz__stars";
    for (let i = 1; i <= 3; i++) {
      const s = document.createElement("span");
      s.textContent = i <= stars ? "★" : "☆";
      if (i <= stars) s.className = "is-on";
      starRow.appendChild(s);
    }

    const head = document.createElement("div");
    head.className = "quiz__result-title";
    head.textContent =
      ratio >= 0.9 ? "Super gemacht!" : ratio >= 0.6 ? "Gut gemacht!" : "Weiter üben!";

    const sub = document.createElement("div");
    sub.className = "quiz__result-score";
    sub.textContent = `${score} von ${total} richtig`;

    // gesammelte Sterne (Fortschritt bis zur nächsten 100)
    const collected = document.createElement("div");
    collected.className = "quiz__result-collected";
    collected.innerHTML = `+${stars} ⭐ &nbsp;·&nbsp; gesammelt: <b>${res.total}</b> ⭐`;

    const again = document.createElement("button");
    again.className = "btn btn--primary";
    again.textContent = "Nochmal";
    again.addEventListener("click", start);

    const home = document.createElement("button");
    home.className = "btn btn--light";
    home.textContent = "Zur Übersicht";
    home.addEventListener("click", goHome);

    const btns = document.createElement("div");
    btns.className = "quiz__result-btns";
    btns.append(again, home);

    wrap.append(starRow, head, sub, collected, btns);
    root.appendChild(wrap);
  }

  start();
}

/* =========================================================
   Helfer für Auswahl-Aufgaben (Multiple Choice).
   choiceGrid(host, {
     prompt,    // HTMLElement, das oben gezeigt wird (z. B. Uhr)
     question,  // optionaler Fragetext
     options,   // [{ label, correct }]  (label kann Text/HTML sein)
     answer,    // answer-Funktion aus buildRound
     reveal,    // optionaler Lösungstext bei falscher Antwort
     columns,   // Anzahl Spalten (Standard 2)
   })
   ========================================================= */

export function choiceGrid(host, cfg) {
  if (cfg.prompt) host.appendChild(cfg.prompt);

  if (cfg.question) {
    const q = document.createElement("div");
    q.className = "quiz__question";
    q.textContent = cfg.question;
    host.appendChild(q);
  }

  const grid = document.createElement("div");
  grid.className = "choices";
  grid.style.gridTemplateColumns = `repeat(${cfg.columns || 2}, 1fr)`;

  const buttons = [];
  for (const opt of cfg.options) {
    const b = document.createElement("button");
    b.className = "choice";
    if (opt.node) b.appendChild(opt.node);
    else b.innerHTML = opt.label;
    b.addEventListener("click", () => {
      buttons.forEach((btn) => (btn.disabled = true));
      // richtige Option grün markieren, falsche Auswahl rot
      buttons.forEach((btn) => {
        if (btn.dataset.correct === "true") btn.classList.add("is-correct");
      });
      if (!opt.correct) b.classList.add("is-wrong");
      cfg.answer(!!opt.correct, { reveal: opt.correct ? null : cfg.reveal });
    });
    b.dataset.correct = opt.correct ? "true" : "false";
    grid.appendChild(b);
    buttons.push(b);
  }

  host.appendChild(grid);
}

const PRAISE = ["Richtig!", "Prima!", "Klasse!", "Stimmt genau!", "Toll!", "Super!"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
