/* =========================================================
   Registry aller Übungen ("Apps" auf dem Homescreen).
   Jede Übung hat:
     id      – eindeutiger Schlüssel (wird in der URL benutzt)
     name    – Beschriftung unter dem App-Icon
     emoji   – Symbol auf der Kachel
     color   – Hintergrundfarbe der Kachel
     hint    – kurzer Text in der geöffneten Übung
     mount   – Funktion mount(container, { goHome }), die den
               Übungsinhalt rendert. Fehlt sie, zeigen wir einen
               "Kommt bald"-Platzhalter.
   ========================================================= */

import {
  volleStunde,
  halbeStunde,
  viertelstunde,
  minuten,
  uhrLesen,
  uhrStellen,
  digitalAnalog,
  tageszeit,
  stundenZuordnen,
  zeitEintragen,
  digitalTageszeit,
  tageszeitAktivitaet,
  gemischteUhr,
} from "./games.js";

export const exercises = [
  {
    id: "uhr-lesen",
    name: "Uhr lesen",
    emoji: "🕐",
    color: "#4a6cf7",
    hint: "Lies ab, wie viel Uhr es ist.",
    mount: uhrLesen,
  },
  {
    id: "uhr-stellen",
    name: "Uhr stellen",
    emoji: "🛠️",
    color: "#f7705a",
    hint: "Stelle die Zeiger auf die richtige Zeit.",
    mount: uhrStellen,
  },
  {
    id: "volle-stunde",
    name: "Volle Stunde",
    emoji: "🌞",
    color: "#f2b134",
    hint: "Übe die vollen Stunden.",
    minLevel: 1,
    mount: volleStunde,
  },
  {
    id: "halbe-stunde",
    name: "Halbe Stunde",
    emoji: "🌗",
    color: "#9b5de5",
    hint: "Übe halbe Stunden.",
    minLevel: 2,
    mount: halbeStunde,
  },
  {
    id: "viertelstunde",
    name: "Viertel­stunde",
    emoji: "🍕",
    color: "#00bbf9",
    hint: "Viertel vor und Viertel nach.",
    minLevel: 3,
    mount: viertelstunde,
  },
  {
    id: "minuten",
    name: "Minuten",
    emoji: "⏱️",
    color: "#00c897",
    hint: "Lies die Minuten genau ab.",
    minLevel: 4,
    mount: minuten,
  },
  {
    id: "digital-analog",
    name: "Digital & Analog",
    emoji: "🔢",
    color: "#ff7eb6",
    hint: "Ordne digitale und analoge Zeit einander zu.",
    mount: digitalAnalog,
  },
  {
    id: "tageszeit",
    name: "Tageszeit",
    emoji: "🌙",
    color: "#3a86ff",
    hint: "Morgen, Vormittag, Mittag, Nachmittag, Abend, Nacht.",
    mount: tageszeit,
  },
  {
    id: "stunden-24",
    name: "24 Stunden",
    emoji: "🌍",
    color: "#2a9d8f",
    hint: "Ordne die 24-Stunden-Zeiten der Uhr zu.",
    mount: stundenZuordnen,
  },
  {
    id: "zeit-eintragen",
    name: "12h & 24h",
    emoji: "📝",
    color: "#e76f51",
    hint: "Trage die 12- und 24-Stunden-Zeit ein.",
    mount: zeitEintragen,
  },
  {
    id: "tageszeit-digital",
    name: "Digital-Tageszeit",
    emoji: "🕗",
    color: "#5e60ce",
    hint: "Lies die Digitaluhr und wähle die Tageszeit.",
    mount: digitalTageszeit,
  },
  {
    id: "tageszeit-aktivitaet",
    name: "Tagesablauf",
    emoji: "🧒",
    color: "#118ab2",
    hint: "Uhr und Aktivität – welche Tageszeit ist das?",
    mount: tageszeitAktivitaet,
  },
  {
    id: "uhr-gemischt",
    name: "Gemischt",
    emoji: "🔀",
    color: "#8338ec",
    hint: "Ablesen, einstellen und umwandeln – gemischt.",
    mount: gemischteUhr,
  },
];

/** Findet eine Übung anhand ihrer id. */
export function findExercise(id) {
  return exercises.find((e) => e.id === id) || null;
}
