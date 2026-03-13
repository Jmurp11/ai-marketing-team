#!/usr/bin/env bash
# meta_post.sh — Post to Facebook & Instagram via Meta Graph API
# Usage: ./tools/meta_post.sh <action> <text> [media_url] [reply_to_id]
#
# Examples:
#   ./tools/meta_post.sh fb_post "Check out our new rink schedule"
#   ./tools/meta_post.sh fb_photo "Grand opening!" "https://example.com/photo.jpg"
#   ./tools/meta_post.sh fb_reply "Thanks for the comment!" 123456789
#   ./tools/meta_post.sh ig_photo "Game day vibes" "https://example.com/photo.jpg"
#   ./tools/meta_post.sh ig_reel "Highlights reel" "https://example.com/video.mp4"
#   ./tools/meta_post.sh ig_reply "Thanks!" 17890012345678901

set -euo pipefail

ACTION="${1:?Usage: meta_post.sh <action> <text> [media_url] [reply_to_id]}"
TEXT="${2:?Text required}"
MEDIA_URL="${3:-}"
REPLY_TO_ID="${4:-}"

GRAPH_API="https://graph.facebook.com/v21.0"

# Validate action
case "$ACTION" in
  fb_post|fb_photo|fb_reply|ig_photo|ig_reel|ig_reply) ;;
  *)
    echo "Error: Invalid action '${ACTION}'. Must be one of: fb_post, fb_photo, fb_reply, ig_photo, ig_reel, ig_reply" >&2
    exit 1
    ;;
esac

# Validate env vars
REQUIRED_VARS="META_ACCESS_TOKEN"
case "$ACTION" in
  fb_*) REQUIRED_VARS="$REQUIRED_VARS META_PAGE_ID" ;;
  ig_*) REQUIRED_VARS="$REQUIRED_VARS META_IG_USER_ID" ;;
esac

for var in $REQUIRED_VARS; do
  if [ -z "${!var:-}" ]; then
    echo "Error: ${var} not set. Export it or add to .env" >&2
    exit 1
  fi
done

# Validate dependencies
for cmd in curl jq; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "Error: ${cmd} is required. Install with: brew install ${cmd}" >&2
    exit 1
  fi
done

# Validate media_url where required
case "$ACTION" in
  fb_photo|ig_photo|ig_reel)
    if [ -z "$MEDIA_URL" ]; then
      echo "Error: ${ACTION} requires a media_url as the third argument" >&2
      exit 1
    fi
    ;;
esac

# Validate reply_to_id where required
case "$ACTION" in
  fb_reply|ig_reply)
    if [ -z "$REPLY_TO_ID" ]; then
      echo "Error: ${ACTION} requires a reply_to_id as the fourth argument" >&2
      exit 1
    fi
    ;;
esac

# --- Helper: extract ID or error from Graph API response ---
extract_id() {
  local response="$1"
  local id_field="${2:-id}"
  local post_id
  post_id=$(echo "$response" | jq -r ".${id_field} // empty")
  if [ -n "$post_id" ]; then
    echo "$post_id"
  else
    local error
    error=$(echo "$response" | jq -r '.error.message // "Unknown error"')
    echo "Error: ${error}" >&2
    echo "Full response: ${response}" >&2
    exit 1
  fi
}

# --- Actions ---

case "$ACTION" in

  fb_post)
    RESPONSE=$(curl -s -X POST "${GRAPH_API}/${META_PAGE_ID}/feed" \
      -F "message=${TEXT}" \
      -F "access_token=${META_ACCESS_TOKEN}")
    extract_id "$RESPONSE"
    ;;

  fb_photo)
    RESPONSE=$(curl -s -X POST "${GRAPH_API}/${META_PAGE_ID}/photos" \
      -F "caption=${TEXT}" \
      -F "url=${MEDIA_URL}" \
      -F "access_token=${META_ACCESS_TOKEN}")
    extract_id "$RESPONSE"
    ;;

  fb_reply)
    RESPONSE=$(curl -s -X POST "${GRAPH_API}/${REPLY_TO_ID}/comments" \
      -F "message=${TEXT}" \
      -F "access_token=${META_ACCESS_TOKEN}")
    extract_id "$RESPONSE"
    ;;

  ig_photo)
    # Step 1: Create media container
    CONTAINER=$(curl -s -X POST "${GRAPH_API}/${META_IG_USER_ID}/media" \
      -F "image_url=${MEDIA_URL}" \
      -F "caption=${TEXT}" \
      -F "access_token=${META_ACCESS_TOKEN}")
    CONTAINER_ID=$(extract_id "$CONTAINER")

    # Step 2: Publish
    RESPONSE=$(curl -s -X POST "${GRAPH_API}/${META_IG_USER_ID}/media_publish" \
      -F "creation_id=${CONTAINER_ID}" \
      -F "access_token=${META_ACCESS_TOKEN}")
    extract_id "$RESPONSE"
    ;;

  ig_reel)
    # Step 1: Create video container
    CONTAINER=$(curl -s -X POST "${GRAPH_API}/${META_IG_USER_ID}/media" \
      -F "video_url=${MEDIA_URL}" \
      -F "caption=${TEXT}" \
      -F "media_type=REELS" \
      -F "access_token=${META_ACCESS_TOKEN}")
    CONTAINER_ID=$(extract_id "$CONTAINER")

    # Step 2: Wait for video processing (poll up to 60s)
    for i in $(seq 1 12); do
      STATUS=$(curl -s "${GRAPH_API}/${CONTAINER_ID}?fields=status_code&access_token=${META_ACCESS_TOKEN}" \
        | jq -r '.status_code // "UNKNOWN"')
      if [ "$STATUS" = "FINISHED" ]; then
        break
      elif [ "$STATUS" = "ERROR" ]; then
        echo "Error: Video processing failed for container ${CONTAINER_ID}" >&2
        exit 1
      fi
      if [ "$i" -eq 12 ]; then
        echo "Error: Video processing timed out after 60s (container: ${CONTAINER_ID})" >&2
        exit 1
      fi
      sleep 5
    done

    # Step 3: Publish
    RESPONSE=$(curl -s -X POST "${GRAPH_API}/${META_IG_USER_ID}/media_publish" \
      -F "creation_id=${CONTAINER_ID}" \
      -F "access_token=${META_ACCESS_TOKEN}")
    extract_id "$RESPONSE"
    ;;

  ig_reply)
    RESPONSE=$(curl -s -X POST "${GRAPH_API}/${REPLY_TO_ID}/replies" \
      -F "message=${TEXT}" \
      -F "access_token=${META_ACCESS_TOKEN}")
    extract_id "$RESPONSE"
    ;;

esac
