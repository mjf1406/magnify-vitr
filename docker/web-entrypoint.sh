#!/bin/sh
set -eu

export VITE_INSTANT_APP_ID="${VITE_INSTANT_APP_ID:-}"
export VITE_INSTANT_API_URI="${VITE_INSTANT_API_URI:-}"
export VITE_INSTANT_WEBSOCKET_URI="${VITE_INSTANT_WEBSOCKET_URI:-}"
export VITE_INSTANT_GOOGLE_CLIENT_NAME="${VITE_INSTANT_GOOGLE_CLIENT_NAME:-google-web}"

origin_from_url() {
  raw="$1"
  if [ -z "$raw" ]; then
    return 0
  fi
  printf '%s\n' "$raw" | sed -E 's#^([a-zA-Z][a-zA-Z0-9+.-]*://[^/?#]+).*#\1#'
}

ws_from_http() {
  raw="$1"
  printf '%s\n' "$raw" | sed -e 's#^https:#wss:#' -e 's#^http:#ws:#'
}

INSTANT_HTTPS_ORIGIN="$(origin_from_url "${VITE_INSTANT_API_URI}")"
if [ -n "${VITE_INSTANT_WEBSOCKET_URI}" ]; then
  INSTANT_WSS_ORIGIN="$(origin_from_url "${VITE_INSTANT_WEBSOCKET_URI}")"
else
  INSTANT_WSS_ORIGIN="$(ws_from_http "${INSTANT_HTTPS_ORIGIN}")"
fi

export INSTANT_HTTPS_ORIGIN INSTANT_WSS_ORIGIN

envsubst '${VITE_INSTANT_APP_ID} ${VITE_INSTANT_API_URI} ${VITE_INSTANT_WEBSOCKET_URI} ${VITE_INSTANT_GOOGLE_CLIENT_NAME}' \
  < /runtime-env.template.js \
  > /usr/share/nginx/html/runtime-env.js

exec /docker-entrypoint.sh "$@"
