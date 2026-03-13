#!/usr/bin/env bash
# slack_read.sh — Read messages from Slack channels and threads
# Usage: ./tools/slack_read.sh <action> <channel> [thread_ts] [limit]
#
# Examples:
#   ./tools/slack_read.sh history "#creative-requests" "" 10
#   ./tools/slack_read.sh replies "#creative-requests" "1710345678.123456"

set -euo pipefail

ACTION="${1:?Usage: slack_read.sh <action> <channel> [thread_ts] [limit]}"
CHANNEL="${2:?Channel required (e.g. #creative-requests or C1234567890)}"
THREAD_TS="${3:-}"
LIMIT="${4:-20}"

# Validate action
if [[ "$ACTION" != "history" && "$ACTION" != "replies" ]]; then
  echo "Error: Action must be 'history' or 'replies'" >&2
  exit 1
fi

if [[ "$ACTION" == "replies" && -z "$THREAD_TS" ]]; then
  echo "Error: thread_ts required for 'replies' action" >&2
  exit 1
fi

# Validate bot token
if [ -z "${SLACK_BOT_TOKEN:-}" ]; then
  echo "Error: SLACK_BOT_TOKEN not set. Export it or add to .env" >&2
  exit 1
fi

# Validate dependencies
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required. Install with: brew install jq" >&2
  exit 1
fi

# Resolve channel name to ID if needed
if [[ "$CHANNEL" == \#* ]]; then
  CHANNEL_NAME="${CHANNEL#\#}"
  CHANNEL_ID=""
  CURSOR=""

  while true; do
    if [ -n "$CURSOR" ]; then
      CHANNELS_RESPONSE=$(curl -s -G "https://slack.com/api/conversations.list" \
        -H "Authorization: Bearer ${SLACK_BOT_TOKEN}" \
        -d "types=public_channel,private_channel" \
        -d "limit=200" \
        -d "cursor=${CURSOR}")
    else
      CHANNELS_RESPONSE=$(curl -s -G "https://slack.com/api/conversations.list" \
        -H "Authorization: Bearer ${SLACK_BOT_TOKEN}" \
        -d "types=public_channel,private_channel" \
        -d "limit=200")
    fi

    OK=$(echo "$CHANNELS_RESPONSE" | jq -r '.ok')
    if [ "$OK" != "true" ]; then
      ERROR=$(echo "$CHANNELS_RESPONSE" | jq -r '.error')
      echo "Error listing channels: ${ERROR}" >&2
      exit 1
    fi

    FOUND=$(echo "$CHANNELS_RESPONSE" | jq -r --arg name "$CHANNEL_NAME" '.channels[] | select(.name == $name) | .id')
    if [ -n "$FOUND" ]; then
      CHANNEL_ID="$FOUND"
      break
    fi

    CURSOR=$(echo "$CHANNELS_RESPONSE" | jq -r '.response_metadata.next_cursor // empty')
    if [ -z "$CURSOR" ]; then
      break
    fi
  done

  if [ -z "$CHANNEL_ID" ]; then
    echo "Error: Channel '#${CHANNEL_NAME}' not found. Check the channel exists and the bot is invited." >&2
    exit 1
  fi
else
  CHANNEL_ID="$CHANNEL"
fi

# Fetch messages
if [ "$ACTION" == "history" ]; then
  RESPONSE=$(curl -s -G "https://slack.com/api/conversations.history" \
    -H "Authorization: Bearer ${SLACK_BOT_TOKEN}" \
    -d "channel=${CHANNEL_ID}" \
    -d "limit=${LIMIT}")
else
  RESPONSE=$(curl -s -G "https://slack.com/api/conversations.replies" \
    -H "Authorization: Bearer ${SLACK_BOT_TOKEN}" \
    -d "channel=${CHANNEL_ID}" \
    -d "ts=${THREAD_TS}" \
    -d "limit=${LIMIT}")
fi

# Check response
OK=$(echo "$RESPONSE" | jq -r '.ok')
if [ "$OK" != "true" ]; then
  ERROR=$(echo "$RESPONSE" | jq -r '.error')
  echo "Error reading from Slack: ${ERROR}" >&2
  exit 1
fi

# Format output — for replies, skip the parent message (index 0)
if [ "$ACTION" == "replies" ]; then
  echo "$RESPONSE" | jq '[.messages[1:] | .[] | {ts: .ts, user: (.user // null), bot_id: (.bot_id // null), text: .text}]'
else
  echo "$RESPONSE" | jq '[.messages[] | {ts: .ts, user: (.user // null), bot_id: (.bot_id // null), text: .text}]'
fi
