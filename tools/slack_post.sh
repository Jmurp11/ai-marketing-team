#!/usr/bin/env bash
# slack_post.sh — Post to Slack as any RinkLink agent
# Usage: ./tools/slack_post.sh <agent_key> <channel> <message> [template_file] [template_vars_json]
#
# Examples:
#   ./tools/slack_post.sh admin "#admin-log" "Board sync complete"
#   ./tools/slack_post.sh email "#email-updates" "" slack/templates/email_update.json '{"campaign_name":"Welcome Sequence","open_rate":"42%"}'

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../slack/config.json"

AGENT_KEY="${1:?Usage: slack_post.sh <agent_key> <channel> <message> [template_file] [template_vars_json]}"
CHANNEL="${2:?Channel required (e.g. #admin-log)}"
MESSAGE="${3:-}"
TEMPLATE_FILE="${4:-}"
TEMPLATE_VARS="${5:-}"

# Validate bot token
if [ -z "${SLACK_BOT_TOKEN:-}" ]; then
  echo "Error: SLACK_BOT_TOKEN not set. Export it or add to .env" >&2
  exit 1
fi

# Read agent config
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required. Install with: brew install jq" >&2
  exit 1
fi

DISPLAY_NAME=$(jq -r ".agents.${AGENT_KEY}.display_name // empty" "$CONFIG_FILE")
ICON_URL=$(jq -r ".agents.${AGENT_KEY}.icon_url // empty" "$CONFIG_FILE")

if [ -z "$DISPLAY_NAME" ]; then
  echo "Error: Unknown agent key '${AGENT_KEY}'. Valid keys: admin, assistant, content, email, ads, social, growth, leads" >&2
  exit 1
fi

# Build payload
if [ -n "$TEMPLATE_FILE" ] && [ -f "$TEMPLATE_FILE" ]; then
  # Template mode: substitute variables into Block Kit template
  BLOCKS=$(cat "$TEMPLATE_FILE")
  if [ -n "$TEMPLATE_VARS" ]; then
    for key in $(echo "$TEMPLATE_VARS" | jq -r 'keys[]'); do
      value=$(echo "$TEMPLATE_VARS" | jq -r ".${key}")
      BLOCKS=$(echo "$BLOCKS" | sed "s|{{${key}}}|${value}|g")
    done
  fi
  # Replace any remaining template vars with "N/A"
  BLOCKS=$(echo "$BLOCKS" | sed 's|{{[a-z_]*}}|N/A|g')

  PAYLOAD=$(jq -n \
    --arg channel "$CHANNEL" \
    --arg username "$DISPLAY_NAME" \
    --arg icon_url "$ICON_URL" \
    --arg text "$MESSAGE" \
    --argjson blocks "$BLOCKS" \
    '{channel: $channel, username: $username, icon_url: $icon_url, text: $text, blocks: $blocks}')
else
  # Plain text mode
  if [ -z "$MESSAGE" ]; then
    echo "Error: Message required when not using a template" >&2
    exit 1
  fi
  PAYLOAD=$(jq -n \
    --arg channel "$CHANNEL" \
    --arg username "$DISPLAY_NAME" \
    --arg icon_url "$ICON_URL" \
    --arg text "$MESSAGE" \
    '{channel: $channel, username: $username, icon_url: $icon_url, text: $text}')
fi

# Post to Slack
RESPONSE=$(curl -s -X POST "https://slack.com/api/chat.postMessage" \
  -H "Authorization: Bearer ${SLACK_BOT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Check response
OK=$(echo "$RESPONSE" | jq -r '.ok')
if [ "$OK" = "true" ]; then
  TS=$(echo "$RESPONSE" | jq -r '.ts')
  echo "Posted as ${DISPLAY_NAME} to ${CHANNEL} (ts: ${TS})"
else
  ERROR=$(echo "$RESPONSE" | jq -r '.error')
  echo "Error posting to Slack: ${ERROR}" >&2
  exit 1
fi
