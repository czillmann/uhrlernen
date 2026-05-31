# Uhr lernen 🕐

Eine PWA (Progressive Web App), mit der Grundschulkinder spielerisch die Uhr lesen lernen.

Dieses Grundgerüst zeigt einen **Homescreen im iPhone-Stil**: Über das Tippen auf
eine „App"-Kachel startet man die jeweilige Übung. Die Übungen selbst werden im
nächsten Schritt gebaut – aktuell zeigen sie einen Platzhalter („Übung kommt bald").

## Starten (lokal)

Ein Service Worker funktioniert nur über `http://localhost` oder HTTPS, nicht über
`file://`. Daher die App mit einem lokalen Server starten:

```bash
npm start
# oder ohne npm:
npx serve .
# oder mit Python:
python3 -m http.server 8000
```

Danach im Browser öffnen: <http://localhost:8000> (bzw. der angezeigte Port).

Auf dem Handy lässt sich die Seite über „Zum Home-Bildschirm hinzufügen"
als App installieren.

## Aufbau

```
index.html              App-Shell
styles.css              Design (Homescreen + Übungsansicht)
manifest.webmanifest    PWA-Manifest (Name, Icons, Farben)
sw.js                   Service Worker (Offline-Cache)
js/
  main.js               Render-Logik + Hash-Routing (#/ und #/u/<id>)
  exercises.js          Liste aller Übungen ("Apps")
icons/                  App-Icons (PNG + SVG-Quellen)
```

## Neue Übung hinzufügen

1. In `js/exercises.js` einen Eintrag im Array `exercises` ergänzen
   (`id`, `name`, `emoji`, `color`, `hint`).
2. Sobald die Übung gebaut wird, dem Eintrag eine `mount(container, { goHome })`
   Funktion geben. Solange diese fehlt, erscheint automatisch der
   „Übung kommt bald"-Platzhalter.
