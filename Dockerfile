# Schlanker Container, der die statische PWA mit nginx ausliefert.
FROM nginx:1.27-alpine

# Eigene Server-Konfiguration (ersetzt die Standard-Config)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nur die App-Dateien ins Webroot kopieren
COPY index.html styles.css manifest.webmanifest sw.js /usr/share/nginx/html/
COPY js/ /usr/share/nginx/html/js/
COPY icons/ /usr/share/nginx/html/icons/

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
