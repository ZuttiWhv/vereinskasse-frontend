#!/bin/sh
set -e

# Wir nutzen den Pfad, den du im VOLUME definiert hast
CERT_DIR="/etc/nginx/certs"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/key.pem"

# --- SSL-ZERTIFIKAT LOGIK ---
if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "Keine SSL-Zertifikate gefunden. Generiere selbstsignierte Zertifikate..."

    # Sicherstellen, dass der Ordner existiert (falls Volume leer)
    mkdir -p "$CERT_DIR"

    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout "$KEY_FILE" \
      -out "$CERT_FILE" \
      -subj "/C=DE/ST=State/L=City/O=Verein/OU=IT/CN=vereinskasse.local"

    echo "Zertifikate erfolgreich generiert."
else
    echo "Vorhandene SSL-Zertifikate werden verwendet."
fi

# --- NGINX TEMPLATES ---
# Das offizielle Nginx-Image nutzt ein internes Skript, um Variablen in
# /etc/nginx/templates/*.template zu ersetzen und nach /etc/nginx/conf.d/ zu schreiben.
if [ -d "/etc/nginx/templates" ]; then
    echo "Verarbeite Nginx-Templates..."
    # Wir rufen das Original-Skript auf, das die Arbeit erledigt
    /docker-entrypoint.sh echo "Templates verarbeitet."
fi

echo "Starte Nginx..."
exec nginx -g "daemon off;"