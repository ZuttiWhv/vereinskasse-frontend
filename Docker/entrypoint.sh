#!/bin/sh
set -e # Beendet das Skript sofort, wenn ein Befehl fehlschlägt

CERT_DIR="/etc/nginx/certs"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/key.pem"

# --- SSL-ZERTIFIKAT LOGIK ---
# Prüfen, ob Zertifikate bereits existieren (z.B. durch ein gemountetes Volume)
if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "Keine SSL-Zertifikate gefunden. Generiere selbstsignierte Zertifikate..."

    # Erstellt ein 2048-bit RSA Schlüsselpaar und ein Zertifikat,
    # das 10 Jahre (3650 Tage) gültig ist.
    # '/CN=vereinskasse.local' ist ein Platzhalter-Name.
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout "$KEY_FILE" \
      -out "$CERT_FILE" \
      -subj "/C=DE/ST=State/L=City/O=Verein/OU=IT/CN=vereinskasse.local"

    echo "Zertifikate erfolgreich generiert."
else
    echo "Vorhandene SSL-Zertifikate werden verwendet."
fi


# --- BACKEND_URL LOGIK ---
# Nginx ersetzt standardmäßig Variablen nur im Ordner /etc/nginx/conf.d/.
# Das offizielle Nginx-Image führt 'envsubst' auf Templates aus, bevor der Hauptprozess startet.
# Wir stellen sicher, dass die Standard-Aktion des Nginx-Images ausgeführt wird:
if [ -d "/etc/nginx/templates" ]; then
    echo "Verarbeite Nginx-Templates..."
    /usr/local/bin/docker-entrypoint.sh "/@" # Führt das originale Nginx-Skript aus
fi

# Jetzt, wo alles vorbereitet ist, starten wir Nginx im Vordergrund.
echo "Starte Nginx..."
exec nginx -g "daemon off;"