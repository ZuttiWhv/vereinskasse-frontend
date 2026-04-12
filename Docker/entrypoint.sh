#!/bin/sh
set -e

CERT_DIR="/etc/nginx/certs"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/key.pem"

# --- SSL-ZERTIFIKAT LOGIK ---
if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "Keine SSL-Zertifikate gefunden. Generiere selbstsignierte Zertifikate..."
    mkdir -p "$CERT_DIR"
    openssl req -x509 -nodes -days 3650 -newkey rsa:4096 \
      -keyout "$KEY_FILE" \
      -out "$CERT_FILE" \
      -subj "/C=DE/ST=State/L=City/O=Verein/OU=IT/CN=vereinskasse.local"
else
    echo "Vorhandene SSL-Zertifikate werden verwendet."
fi

# --- NGINX TEMPLATE MANUELL VERARBEITEN ---
# Wir machen das selbst, um sicherzugehen, dass es passiert:
echo "Verarbeite Nginx-Template für Backend-URL: $BACKEND_URL"

# Wir sagen envsubst explizit, dass es NUR $BACKEND_URL ersetzen soll.
# Sonst zerstört es eventuell Nginx-interne Variablen wie $host.
envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Starte Nginx..."
exec nginx -g "daemon off;"