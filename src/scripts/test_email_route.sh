#!/usr/bin/env bash
set -euo pipefail

# Smoke test for the current team-assignment flow. The former /api/email route
# was retired; this endpoint requires a gestor session and a ticket the gestor
# is authorized to manage.
API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
: "${TICKET_ID:?Set TICKET_ID to a ticket UUID}"
: "${EQUIPE_ID:?Set EQUIPE_ID to a team UUID}"
: "${SESSION_COOKIE:?Set SESSION_COOKIE to the authenticated Cookie header value}"
RELATORIO="${RELATORIO:-Razão do acionamento para teste da notificação da equipe.}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to build the JSON request body." >&2
  exit 1
fi

CORPO=$(jq -cn \
  --arg equipeId "$EQUIPE_ID" \
  --arg relatorio "$RELATORIO" \
  '{equipeId: $equipeId, relatorio: $relatorio}')

curl -i -X POST "$API_BASE_URL/api/tickets/$TICKET_ID/equipes" \
  -H "Content-Type: application/json" \
  -H "Cookie: $SESSION_COOKIE" \
  --data "$CORPO"
