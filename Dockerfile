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
FROM nginx:stable-alpine AS production-stage

# Pakete installieren
RUN apk add --no-cache openssl gettext # gettext liefert 'envsubst'

# Verzeichnisse vorbereiten
RUN rm /etc/nginx/conf.d/default.conf && \
    mkdir -p /etc/nginx/templates /etc/nginx/certs

# 1. Statische Dateien kopieren
WORKDIR /usr/share/nginx/html
COPY --from=build-stage /app/dist .

# 2. Template kopieren (Pfad anpassen, falls nötig)
# Stelle sicher, dass die Datei lokal in ./Docker/ liegt
COPY ./Docker/default.conf.template /etc/nginx/templates/default.conf.template

# 3. Entrypoint kopieren und ausführbar machen
COPY ./Docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/entrypoint.sh"]