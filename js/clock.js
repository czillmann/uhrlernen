/* =========================================================
   Wiederverwendbare Analoguhr als SVG.

   createClock(options) -> {
     el,                 // das SVG-Element zum Einhängen
     setTime(h, m),      // Zeiger setzen (h: 1..12, m: 0..59)
     getTime(),          // aktuelle Zeit { h, m }
     setInteractive(b),  // Ziehen an/aus
   }

   Optionen:
     size         Kantenlänge in px (Standard 260)
     showNumbers  Ziffern 1..12 anzeigen (Standard true)
     showTicks    Minutenstriche anzeigen (Standard true)
     interactive  Zeiger mit dem Finger/Maus ziehbar (Standard false)
     snapMinutes  Einrasten beim Ziehen in Minuten-Schritten (Standard 5)
     onChange     Callback({h, m}) bei Änderung durchs Ziehen
   ========================================================= */

const SVG_NS = "http://www.w3.org/2000/svg";
const C = 100; // Mittelpunkt im viewBox-Koordinatensystem (0..200)

export function createClock(options = {}) {
  const opt = {
    size: 260,
    showNumbers: true,
    showTicks: true,
    interactive: false,
    snapMinutes: 5,
    onChange: null,
    ...options,
  };

  let state = { h: 12, m: 0 };
  let activeHand = null; // "hour" | "minute" | null

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 200 200");
  svg.setAttribute("class", "clock");
  svg.style.width = opt.size + "px";
  svg.style.height = opt.size + "px";

  // Zifferblatt
  svg.appendChild(circle(C, C, 94, { class: "clock__face" }));
  svg.appendChild(circle(C, C, 94, { class: "clock__rim" }));

  // Minuten- und Stundenstriche
  if (opt.showTicks) {
    for (let i = 0; i < 60; i++) {
      const big = i % 5 === 0;
      const r1 = big ? 80 : 85;
      const r2 = 90;
      const a = (i * 6 * Math.PI) / 180;
      const line = lineEl(
        C + r1 * Math.sin(a),
        C - r1 * Math.cos(a),
        C + r2 * Math.sin(a),
        C - r2 * Math.cos(a),
        { class: big ? "clock__tick clock__tick--big" : "clock__tick" }
      );
      svg.appendChild(line);
    }
  }

  // Ziffern 1..12
  if (opt.showNumbers) {
    for (let n = 1; n <= 12; n++) {
      const a = (n * 30 * Math.PI) / 180;
      const x = C + 68 * Math.sin(a);
      const y = C - 68 * Math.cos(a);
      const t = document.createElementNS(SVG_NS, "text");
      t.setAttribute("x", x);
      t.setAttribute("y", y);
      t.setAttribute("class", "clock__num");
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("dominant-baseline", "central");
      t.textContent = String(n);
      svg.appendChild(t);
    }
  }

  // Zeiger
  const hourHand = lineEl(C, C, C, C - 48, { class: "clock__hand clock__hand--hour" });
  const minuteHand = lineEl(C, C, C, C - 72, { class: "clock__hand clock__hand--minute" });
  svg.appendChild(hourHand);
  svg.appendChild(minuteHand);
  svg.appendChild(circle(C, C, 5, { class: "clock__center" }));

  function render() {
    const minuteAngle = state.m * 6;
    const hourAngle = (state.h % 12) * 30 + state.m * 0.5;
    setHand(minuteHand, minuteAngle, 72);
    setHand(hourHand, hourAngle, 48);
  }

  function setTime(h, m) {
    state = { h: ((h + 11) % 12) + 1, m: ((m % 60) + 60) % 60 };
    render();
    return state;
  }

  function getTime() {
    return { ...state };
  }

  /* ----- Interaktion: Zeiger ziehen ----- */

  function pointerAngle(evt) {
    const rect = svg.getBoundingClientRect();
    const x = ((evt.clientX - rect.left) / rect.width) * 200 - C;
    const y = ((evt.clientY - rect.top) / rect.height) * 200 - C;
    let deg = (Math.atan2(x, -y) * 180) / Math.PI;
    return (deg + 360) % 360;
  }

  function onDown(evt) {
    evt.preventDefault();
    const angle = pointerAngle(evt);
    // Näheren Zeiger wählen (per Winkelabstand)
    const minuteAngle = state.m * 6;
    const hourAngle = (state.h % 12) * 30 + state.m * 0.5;
    activeHand =
      angleDist(angle, minuteAngle) <= angleDist(angle, hourAngle)
        ? "minute"
        : "hour";
    svg.setPointerCapture(evt.pointerId);
    applyAngle(angle);
  }

  function onMove(evt) {
    if (!activeHand) return;
    evt.preventDefault();
    applyAngle(pointerAngle(evt));
  }

  function onUp(evt) {
    if (!activeHand) return;
    activeHand = null;
    try {
      svg.releasePointerCapture(evt.pointerId);
    } catch (_) {}
  }

  function applyAngle(angle) {
    if (activeHand === "minute") {
      let m = Math.round(angle / 6);
      const snap = opt.snapMinutes || 1;
      m = (Math.round(m / snap) * snap) % 60;
      state.m = m;
    } else if (activeHand === "hour") {
      // Minutenanteil herausrechnen, dann auf volle Stunde runden
      let hourPos = Math.round((angle - state.m * 0.5) / 30);
      hourPos = ((hourPos % 12) + 12) % 12;
      state.h = hourPos === 0 ? 12 : hourPos;
    }
    render();
    if (opt.onChange) opt.onChange(getTime());
  }

  function setInteractive(on) {
    opt.interactive = on;
    if (on) {
      svg.classList.add("clock--interactive");
      svg.addEventListener("pointerdown", onDown);
      svg.addEventListener("pointermove", onMove);
      svg.addEventListener("pointerup", onUp);
      svg.addEventListener("pointercancel", onUp);
    } else {
      svg.classList.remove("clock--interactive");
      svg.removeEventListener("pointerdown", onDown);
      svg.removeEventListener("pointermove", onMove);
      svg.removeEventListener("pointerup", onUp);
      svg.removeEventListener("pointercancel", onUp);
    }
  }

  render();
  if (opt.interactive) setInteractive(true);

  return { el: svg, setTime, getTime, setInteractive };
}

/* ----- kleine SVG-Helfer ----- */

function circle(cx, cy, r, attrs) {
  const c = document.createElementNS(SVG_NS, "circle");
  c.setAttribute("cx", cx);
  c.setAttribute("cy", cy);
  c.setAttribute("r", r);
  applyAttrs(c, attrs);
  return c;
}

function lineEl(x1, y1, x2, y2, attrs) {
  const l = document.createElementNS(SVG_NS, "line");
  l.setAttribute("x1", x1);
  l.setAttribute("y1", y1);
  l.setAttribute("x2", x2);
  l.setAttribute("y2", y2);
  applyAttrs(l, attrs);
  return l;
}

function applyAttrs(node, attrs) {
  if (!attrs) return;
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
}

/** Zeigerspitze auf Winkel (Grad, 0 = oben) mit Länge L setzen. */
function setHand(hand, angleDeg, length) {
  const a = (angleDeg * Math.PI) / 180;
  hand.setAttribute("x2", C + length * Math.sin(a));
  hand.setAttribute("y2", C - length * Math.cos(a));
}

/** Kleinster Winkelabstand zwischen zwei Winkeln (0..180). */
function angleDist(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
