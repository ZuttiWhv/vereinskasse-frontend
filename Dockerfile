# ==========================================
# STAGE 1: Build (Node.js)
# ==========================================

FROM node:20-alpine AS build-stage

WORKDIR /app

# Zuerst nur Package-Dateien kopieren.
# Das nutzt den Docker-Cache optimal: 'npm install' wird nur ausgeführt,
# wenn sich die package.json geändert hat, nicht bei jeder Code-Änderung.
COPY package*.json ./

# Abhängigkeiten installieren (auch devDependencies für den Build)
RUN npm ci

# Den restlichen Quellcode kopieren
COPY . .

# Das produktive, optimierte Bundle erstellen (landet standardmäßig in /dist)
RUN npm run build


# ==========================================
# STAGE 2: Production (Nginx)
# ==========================================
# Wir wechseln zum schlanken Nginx-Image für die Auslieferung.
FROM nginx:stable-alpine AS production-stage

# Notwendige Pakete für das Entrypoint-Skript installieren:
# - openssl: Zum Generieren der selbstsignierten Zertifikate
# - bash: Falls das Skript komplexer wird (optional, 'sh' reicht oft)
RUN apk add --no-cache openssl

# Arbeitsverzeichnis für Nginx setzen
WORKDIR /usr/share/nginx/html

# 1. Kopiere die gebauten statischen Dateien aus Stage 1
COPY --from=build-stage /app/dist .

# 2. Kopiere die Nginx-Template-Konfiguration
# Nginx scannt diesen Ordner und ersetzt ${BACKEND_URL} beim Start.
COPY ./Docker/default.conf.template /etc/nginx/templates/default.conf.template

# 3. Kopiere das neue Entrypoint-Skript und mache es ausführbar
COPY ./Docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Ordner für die Zertifikate erstellen (damit Nginx darauf zugreifen kann)
RUN mkdir -p /etc/nginx/certs

# Standard-Ports für HTTP und HTTPS exponieren
EXPOSE 80 443

# Setze das Skript als Entrypoint. Es bereitet SSL vor und startet dann Nginx.
ENTRYPOINT ["/entrypoint.sh"]
