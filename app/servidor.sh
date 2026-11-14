#!/bin/bash
# Serve o app no Mac e na rede Wi-Fi, para abrir no iPhone.
cd "$(dirname "$0")"
PORTA=${PORT:-8080}
IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")
echo "No Mac:    http://localhost:$PORTA"
echo "No iPhone: http://$IP:$PORTA  (mesmo Wi-Fi)"
exec ruby -run -e httpd . --port="$PORTA" --bind-address=0.0.0.0
