#!/usr/bin/env bash
# x_read.sh — Read tweets and metrics from X (Twitter)
# Usage:
#   ./tools/x_read.sh metrics <tweet_id>    # Get metrics for a specific tweet
#   ./tools/x_read.sh recent [count]         # Get recent tweets with metrics (default: 10)
#
# Examples:
#   ./tools/x_read.sh metrics 1234567890
#   ./tools/x_read.sh recent 5

set -euo pipefail

ACTION="${1:?Usage: x_read.sh <metrics|recent> [tweet_id|count]}"
ARG="${2:-}"

# Load env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

# Validate env vars
for var in TWITTER_CONSUMER_KEY TWITTER_CONSUMER_SECRET TWITTER_ACCESS_TOKEN TWITTER_ACCESS_SECRET; do
  if [ -z "${!var:-}" ]; then
    echo "Error: ${var} not set. Export it or add to .env" >&2
    exit 1
  fi
done

for cmd in openssl curl jq; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "Error: ${cmd} is required. Install with: brew install ${cmd}" >&2
    exit 1
  fi
done

# --- OAuth 1.0a signing (reusable) ---
percent_encode() {
  local string="$1"
  printf '%s' "$string" | curl -Gso /dev/null -w '%{url_effective}' --data-urlencode @- '' | cut -c 3-
}

oauth_sign() {
  local method="$1"
  local url="$2"
  local extra_params="${3:-}"

  local nonce
  nonce=$(openssl rand -hex 16)
  local timestamp
  timestamp=$(date +%s)

  local params="oauth_consumer_key=$(percent_encode "$TWITTER_CONSUMER_KEY")"
  params="${params}&oauth_nonce=$(percent_encode "$nonce")"
  params="${params}&oauth_signature_method=$(percent_encode "HMAC-SHA1")"
  params="${params}&oauth_timestamp=$(percent_encode "$timestamp")"
  params="${params}&oauth_token=$(percent_encode "$TWITTER_ACCESS_TOKEN")"
  params="${params}&oauth_version=$(percent_encode "1.0")"
  if [ -n "$extra_params" ]; then
    params="${params}&${extra_params}"
  fi
  # Sort params
  params=$(echo "$params" | tr '&' '\n' | sort | tr '\n' '&' | sed 's/&$//')

  local base="${method}&$(percent_encode "${url%%\?*}")&$(percent_encode "$params")"
  local key="$(percent_encode "$TWITTER_CONSUMER_SECRET")&$(percent_encode "$TWITTER_ACCESS_SECRET")"
  local sig
  sig=$(printf '%s' "$base" | openssl dgst -sha1 -hmac "$key" -binary | base64)

  echo "OAuth oauth_consumer_key=\"$(percent_encode "$TWITTER_CONSUMER_KEY")\", oauth_nonce=\"$(percent_encode "$nonce")\", oauth_signature=\"$(percent_encode "$sig")\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"$(percent_encode "$timestamp")\", oauth_token=\"$(percent_encode "$TWITTER_ACCESS_TOKEN")\", oauth_version=\"1.0\""
}

case "$ACTION" in

  metrics)
    if [ -z "$ARG" ]; then
      echo "Error: metrics requires a tweet_id" >&2
      exit 1
    fi
    URL="https://api.x.com/2/tweets/${ARG}?tweet.fields=public_metrics,created_at"
    EXTRA="tweet.fields=$(percent_encode "public_metrics,created_at")"
    AUTH=$(oauth_sign "GET" "https://api.x.com/2/tweets/${ARG}" "$EXTRA")

    RESPONSE=$(curl -s -X GET "$URL" -H "Authorization: ${AUTH}")

    ERROR=$(echo "$RESPONSE" | jq -r '.errors[0].message // empty')
    if [ -n "$ERROR" ]; then
      echo "{\"success\":false,\"error\":\"$ERROR\"}"
      exit 1
    fi

    echo "$RESPONSE" | jq '{
      success: true,
      tweet_id: .data.id,
      text: .data.text,
      created_at: .data.created_at,
      metrics: .data.public_metrics
    }'
    ;;

  recent)
    COUNT="${ARG:-10}"
    # Need the authenticated user's ID first
    USER_URL="https://api.x.com/2/users/me"
    USER_AUTH=$(oauth_sign "GET" "$USER_URL")
    USER_RESPONSE=$(curl -s -X GET "$USER_URL" -H "Authorization: ${USER_AUTH}")
    USER_ID=$(echo "$USER_RESPONSE" | jq -r '.data.id // empty')

    if [ -z "$USER_ID" ]; then
      echo "{\"success\":false,\"error\":\"Could not get authenticated user ID\"}"
      exit 1
    fi

    URL="https://api.x.com/2/users/${USER_ID}/tweets?max_results=${COUNT}&tweet.fields=public_metrics,created_at"
    EXTRA="max_results=$(percent_encode "$COUNT")&tweet.fields=$(percent_encode "public_metrics,created_at")"
    AUTH=$(oauth_sign "GET" "https://api.x.com/2/users/${USER_ID}/tweets" "$EXTRA")

    RESPONSE=$(curl -s -X GET "$URL" -H "Authorization: ${AUTH}")

    ERROR=$(echo "$RESPONSE" | jq -r '.errors[0].message // empty')
    if [ -n "$ERROR" ]; then
      echo "{\"success\":false,\"error\":\"$ERROR\"}"
      exit 1
    fi

    echo "$RESPONSE" | jq '{
      success: true,
      count: (.data | length),
      tweets: [.data[] | {
        id: .id,
        text: .text,
        created_at: .created_at,
        metrics: .public_metrics
      }]
    }'
    ;;

  *)
    echo "Error: Invalid action '${ACTION}'. Must be: metrics, recent" >&2
    exit 1
    ;;

esac
