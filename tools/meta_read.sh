#!/usr/bin/env bash
# meta_read.sh — Read analytics from Facebook & Instagram via Meta Graph API
# Usage:
#   ./tools/meta_read.sh page_insights [period]        # Facebook page metrics (default: day)
#   ./tools/meta_read.sh post_insights <post_id>       # Per-post metrics
#   ./tools/meta_read.sh ig_insights [period]           # Instagram account metrics (default: day)
#   ./tools/meta_read.sh recent_posts [count]            # Recent Facebook page posts (default: 10)
#   ./tools/meta_read.sh ig_recent [count]               # Recent Instagram posts (default: 10)
#
# Examples:
#   ./tools/meta_read.sh page_insights week
#   ./tools/meta_read.sh post_insights 123456789_987654321
#   ./tools/meta_read.sh ig_insights day
#   ./tools/meta_read.sh recent_posts 5

set -euo pipefail

ACTION="${1:?Usage: meta_read.sh <page_insights|post_insights|ig_insights|recent_posts|ig_recent> [arg]}"
ARG="${2:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

GRAPH_API="https://graph.facebook.com/v21.0"

# Validate env
if [ -z "${META_ACCESS_TOKEN:-}" ]; then
  echo "Error: META_ACCESS_TOKEN not set" >&2
  exit 1
fi

for cmd in curl jq; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "Error: ${cmd} is required" >&2
    exit 1
  fi
done

case "$ACTION" in

  page_insights)
    if [ -z "${META_PAGE_ID:-}" ]; then
      echo "Error: META_PAGE_ID not set" >&2
      exit 1
    fi
    PERIOD="${ARG:-day}"
    METRICS="page_impressions,page_engaged_users,page_fan_adds,page_views_total,page_post_engagements"
    RESPONSE=$(curl -s "${GRAPH_API}/${META_PAGE_ID}/insights?metric=${METRICS}&period=${PERIOD}&access_token=${META_ACCESS_TOKEN}")

    ERROR=$(echo "$RESPONSE" | jq -r '.error.message // empty')
    if [ -n "$ERROR" ]; then
      echo "{\"success\":false,\"error\":\"$ERROR\"}"
      exit 1
    fi

    echo "$RESPONSE" | jq '{
      success: true,
      period: "'"$PERIOD"'",
      metrics: [.data[] | {
        name: .name,
        description: .description,
        values: .values
      }]
    }'
    ;;

  post_insights)
    if [ -z "$ARG" ]; then
      echo "Error: post_insights requires a post_id" >&2
      exit 1
    fi
    METRICS="post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total"
    RESPONSE=$(curl -s "${GRAPH_API}/${ARG}/insights?metric=${METRICS}&access_token=${META_ACCESS_TOKEN}")

    ERROR=$(echo "$RESPONSE" | jq -r '.error.message // empty')
    if [ -n "$ERROR" ]; then
      echo "{\"success\":false,\"error\":\"$ERROR\"}"
      exit 1
    fi

    echo "$RESPONSE" | jq '{
      success: true,
      post_id: "'"$ARG"'",
      metrics: [.data[] | {
        name: .name,
        values: .values
      }]
    }'
    ;;

  ig_insights)
    if [ -z "${META_IG_USER_ID:-}" ]; then
      echo "Error: META_IG_USER_ID not set" >&2
      exit 1
    fi
    PERIOD="${ARG:-day}"
    METRICS="impressions,reach,follower_count,profile_views"
    RESPONSE=$(curl -s "${GRAPH_API}/${META_IG_USER_ID}/insights?metric=${METRICS}&period=${PERIOD}&access_token=${META_ACCESS_TOKEN}")

    ERROR=$(echo "$RESPONSE" | jq -r '.error.message // empty')
    if [ -n "$ERROR" ]; then
      echo "{\"success\":false,\"error\":\"$ERROR\"}"
      exit 1
    fi

    echo "$RESPONSE" | jq '{
      success: true,
      period: "'"$PERIOD"'",
      metrics: [.data[] | {
        name: .name,
        description: .description,
        values: .values
      }]
    }'
    ;;

  recent_posts)
    if [ -z "${META_PAGE_ID:-}" ]; then
      echo "Error: META_PAGE_ID not set" >&2
      exit 1
    fi
    COUNT="${ARG:-10}"
    RESPONSE=$(curl -s "${GRAPH_API}/${META_PAGE_ID}/posts?fields=id,message,created_time,shares,likes.summary(true),comments.summary(true)&limit=${COUNT}&access_token=${META_ACCESS_TOKEN}")

    ERROR=$(echo "$RESPONSE" | jq -r '.error.message // empty')
    if [ -n "$ERROR" ]; then
      echo "{\"success\":false,\"error\":\"$ERROR\"}"
      exit 1
    fi

    echo "$RESPONSE" | jq '{
      success: true,
      count: (.data | length),
      posts: [.data[] | {
        id: .id,
        message: (.message // "(no text)"),
        created_time: .created_time,
        likes: (.likes.summary.total_count // 0),
        comments: (.comments.summary.total_count // 0),
        shares: (.shares.count // 0)
      }]
    }'
    ;;

  ig_recent)
    if [ -z "${META_IG_USER_ID:-}" ]; then
      echo "Error: META_IG_USER_ID not set" >&2
      exit 1
    fi
    COUNT="${ARG:-10}"
    RESPONSE=$(curl -s "${GRAPH_API}/${META_IG_USER_ID}/media?fields=id,caption,timestamp,like_count,comments_count,media_type&limit=${COUNT}&access_token=${META_ACCESS_TOKEN}")

    ERROR=$(echo "$RESPONSE" | jq -r '.error.message // empty')
    if [ -n "$ERROR" ]; then
      echo "{\"success\":false,\"error\":\"$ERROR\"}"
      exit 1
    fi

    echo "$RESPONSE" | jq '{
      success: true,
      count: (.data | length),
      posts: [.data[] | {
        id: .id,
        caption: (.caption // "(no caption)"),
        timestamp: .timestamp,
        likes: (.like_count // 0),
        comments: (.comments_count // 0),
        type: .media_type
      }]
    }'
    ;;

  *)
    echo "Error: Invalid action '${ACTION}'. Must be: page_insights, post_insights, ig_insights, recent_posts, ig_recent" >&2
    exit 1
    ;;

esac
