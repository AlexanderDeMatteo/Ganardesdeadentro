#!/usr/bin/env sh
# Quick tunnel de Cloudflare (URLs temporales; cambian al reiniciar).
# Requisitos: cloudflared instalado, stack prod en localhost:3000 y :5000
# Ver docs/DEPLOY_MAC_MINI.md
#
# Uso: abrir DOS terminales y ejecutar un comando en cada una.
#
# Terminal 1 — frontend (app):
#   cloudflared tunnel --url http://127.0.0.1:3000
#
# Terminal 2 — backend (api):
#   cloudflared tunnel --url http://127.0.0.1:5000
#
# Copia las URLs https://....trycloudflare.com que imprime cada proceso:
#   - URL del frontend → backend/.env (CORS_ORIGINS, FRONTEND_URL)
#   - URL del backend  → .env.hosting (NEXT_PUBLIC_API_BASE_URL)
#
# Reinicia contenedores tras actualizar env:
#   docker compose -p fittrack -f docker-compose.prod.yml up -d --force-recreate fittrack-frontend fittrack-backend
#
# Windows (PowerShell) — mismos comandos cloudflared.
# Mac/Linux — instalar: brew install cloudflared  o  ver https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

set -e

echo "Este archivo es documentación ejecutable. Abre dos terminales:"
echo ""
echo "  cloudflared tunnel --url http://127.0.0.1:3000"
echo "  cloudflared tunnel --url http://127.0.0.1:5000"
echo ""
echo "Luego actualiza .env.hosting y backend/.env según las URLs generadas."
