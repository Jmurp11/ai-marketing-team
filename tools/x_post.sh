#!/usr/bin/env bash
# x_post.sh — Post to X (Twitter) as RinkLink's Social Agent
# Usage: ./tools/x_post.sh <action> <text> [reply_to_id]
#
# Examples:
#   ./tools/x_post.sh tweet "Just dropped a new blog post on hockey training tips"
#   ./tools/x_post.sh reply "Thanks for the feedback!" 1234567890
#   ./tools/x_post.sh quote "Check this out" 1234567890

set -euo pipefail

ACTION="${1:?Usage: x_post.sh <action> <text> [reply_to_id]}"
TEXT="${2:?Text required}"
REPLY_TO_ID="${3:-}"

# Validate action
case "$ACTION" in
  tweet|reply|quote) ;;
  *)
    echo "Error: Invalid action '${ACTION}'. Must be one of: tweet, reply, quote" >&2
    exit 1
    ;;
esac

# Validate env vars
for var in TWITTER_CONSUMER_KEY TWITTER_CONSUMER_SECRET TWITTER_ACCESS_TOKEN TWITTER_ACCESS_SECRET; do
  if [ -z "${!var:-}" ]; then
    echo "Error: ${var} not set. Export it or add to .env" >&2
    exit 1
  fi
done

# Validate dependencies
for cmd in openssl curl jq; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "Error: ${cmd} is required. Install with: brew install ${cmd}" >&2
    exit 1
  fi
done

# Validate reply/quote requires an ID
if [ "$ACTION" = "reply" ] || [ "$ACTION" = "quote" ]; then
  if [ -z "$REPLY_TO_ID" ]; then
    echo "Error: ${ACTION} requires a tweet ID as the third argument" >&2
    exit 1
  fi
fi

# --- OAuth 1.0a signing ---
API_URL="https://api.x.com/2/tweets"
HTTP_METHOD="POST"

# Percent-encode per RFC 3986
percent_encode() {
  local string="$1"
  printf '%s' "$string" | curl -Gso /dev/null -w '%{url_effective}' --data-urlencode @- '' | cut -c 3-
}

# Generate nonce and timestamp
OAUTH_NONCE=$(openssl rand -hex 16)
OAUTH_TIMESTAMP=$(date +%s)

# OAuth parameters
OAUTH_CONSUMER_KEY="$TWITTER_CONSUMER_KEY"
OAUTH_TOKEN="$TWITTER_ACCESS_TOKEN"
OAUTH_SIGNATURE_METHOD="HMAC-SHA1"
OAUTH_VERSION="1.0"

# Build parameter string (sorted alphabetically)
PARAMS="oauth_consumer_key=$(percent_encode "$OAUTH_CONSUMER_KEY")"
PARAMS="${PARAMS}&oauth_nonce=$(percent_encode "$OAUTH_NONCE")"
PARAMS="${PARAMS}&oauth_signature_method=$(percent_encode "$OAUTH_SIGNATURE_METHOD")"
PARAMS="${PARAMS}&oauth_timestamp=$(percent_encode "$OAUTH_TIMESTAMP")"
PARAMS="${PARAMS}&oauth_token=$(percent_encode "$OAUTH_TOKEN")"
PARAMS="${PARAMS}&oauth_version=$(percent_encode "$OAUTH_VERSION")"

# Build signature base string
SIGNATURE_BASE="${HTTP_METHOD}&$(percent_encode "$API_URL")&$(percent_encode "$PARAMS")"

# Build signing key
SIGNING_KEY="$(percent_encode "$TWITTER_CONSUMER_SECRET")&$(percent_encode "$TWITTER_ACCESS_SECRET")"

# Generate HMAC-SHA1 signature
OAUTH_SIGNATURE=$(printf '%s' "$SIGNATURE_BASE" | openssl dgst -sha1 -hmac "$SIGNING_KEY" -binary | base64)

# Build Authorization header
AUTH_HEADER="OAuth "
AUTH_HEADER+="oauth_consumer_key=\"$(percent_encode "$OAUTH_CONSUMER_KEY")\", "
AUTH_HEADER+="oauth_nonce=\"$(percent_encode "$OAUTH_NONCE")\", "
AUTH_HEADER+="oauth_signature=\"$(percent_encode "$OAUTH_SIGNATURE")\", "
AUTH_HEADER+="oauth_signature_method=\"$(percent_encode "$OAUTH_SIGNATURE_METHOD")\", "
AUTH_HEADER+="oauth_timestamp=\"$(percent_encode "$OAUTH_TIMESTAMP")\", "
AUTH_HEADER+="oauth_token=\"$(percent_encode "$OAUTH_TOKEN")\", "
AUTH_HEADER+="oauth_version=\"$(percent_encode "$OAUTH_VERSION")\""

# --- Build JSON payload ---
case "$ACTION" in
  tweet)
    PAYLOAD=$(jq -n --arg text "$TEXT" '{text: $text}')
    ;;
  reply)
    PAYLOAD=$(jq -n --arg text "$TEXT" --arg id "$REPLY_TO_ID" \
      '{text: $text, reply: {in_reply_to_tweet_id: $id}}')
    ;;
  quote)
    PAYLOAD=$(jq -n --arg text "$TEXT" --arg id "$REPLY_TO_ID" \
      '{text: $text, quote_tweet_id: $id}')
    ;;
esac

# --- Post to X ---
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Authorization: ${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Check response
TWEET_ID=$(echo "$RESPONSE" | jq -r '.data.id // empty')
if [ -n "$TWEET_ID" ]; then
  echo "$TWEET_ID"
else
  ERROR=$(echo "$RESPONSE" | jq -r '.detail // .errors[0].message // .title // "Unknown error"')
  echo "Error posting to X: ${ERROR}" >&2
  echo "Full response: ${RESPONSE}" >&2
  exit 1
fi
