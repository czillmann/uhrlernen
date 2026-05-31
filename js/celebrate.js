/* =========================================================
   Glückwunsch-Animation mit Konfetti.
   Wird gezeigt, wenn ein 100er-Sterneziel erreicht ist.
   ========================================================= */

import { playFanfare } from "./sound.js";

const CONFETTI = ["⭐", "🎉", "🌟", "✨", "🏆", "🎊"];

export function celebrate(milestone) {
  const overlay = document.createElement("div");
  overlay.className = "celebrate";

  // Konfettiregen
  const confetti = document.createElement("div");
  confetti.className = "celebrate__confetti";
  for (let i = 0; i < 44; i++) {
    const s = document.createElement("span");
    s.textContent = CONFETTI[i % CONFETTI.length];
    s.style.left = Math.random() * 100 + "%";
    s.style.animationDelay = Math.random() * 1.2 + "s";
    s.style.animationDuration = 2.4 + Math.random() * 2 + "s";
    s.style.fontSize = 16 + Math.random() * 26 + "px";
    confetti.appendChild(s);
  }

  // Glückwunschkarte
  const card = document.createElement("div");
  card.className = "celebrate__card";

  const big = document.createElement("div");
  big.className = "celebrate__star";
  big.textContent = "⭐";

  const title = document.createElement("div");
  title.className = "celebrate__title";
  title.textContent = `${milestone} Sterne!`;

  const sub = document.createElement("div");
  sub.className = "celebrate__sub";
  sub.textContent = "Super gemacht! Weiter so!";

  const close = document.createElement("button");
  close.className = "btn btn--primary";
  close.textContent = "Juhu!";

  card.append(big, title, sub, close);
  overlay.append(confetti, card);
  document.body.appendChild(overlay);

  playFanfare();

  let timer = setTimeout(remove, 7000);
  function remove() {
    clearTimeout(timer);
    overlay.classList.add("is-leaving");
    setTimeout(() => overlay.remove(), 300);
  }
  close.addEventListener("click", remove);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) remove();
  });
}
