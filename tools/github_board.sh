#!/usr/bin/env bash
# github_board.sh — Manage the RinkLink Marketing Operations GitHub Projects board
# Only the Admin agent should use this script.
#
# Usage:
#   ./tools/github_board.sh create <title> <agent> <priority> <category> [status]
#   ./tools/github_board.sh move <item_id> <status>
#   ./tools/github_board.sh list [status]
#   ./tools/github_board.sh update <item_id> <field> <value>

set -euo pipefail

REPO="${GITHUB_REPO:-ai-company}"
PROJECT_NUMBER="${GITHUB_PROJECT_NUMBER:?Set GITHUB_PROJECT_NUMBER env var}"
OWNER="${GITHUB_OWNER:-$(gh api user -q .login)}"

ACTION="${1:?Usage: github_board.sh <create|move|list|update> ...}"
shift

case "$ACTION" in
  create)
    TITLE="${1:?Title required}"
    AGENT="${2:?Agent required (admin|assistant|content|email|ads|social|growth|leads)}"
    PRIORITY="${3:?Priority required (H|M|L)}"
    CATEGORY="${4:?Category required (Campaign|Content|Email|Experiment|Lead|System|Report)}"
    STATUS="${5:-Backlog}"

    # Create issue
    ISSUE_URL=$(gh issue create --repo "$OWNER/$REPO" --title "$TITLE" \
      --label "$AGENT,$PRIORITY,$CATEGORY" --body "Agent: $AGENT | Priority: $PRIORITY | Category: $CATEGORY" 2>&1)
    ISSUE_NUMBER=$(echo "$ISSUE_URL" | grep -o '[0-9]*$')

    # Add to project
    ITEM_ID=$(gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$ISSUE_URL" --format json | jq -r '.id')

    # Set custom fields
    gh project item-edit --project-id "$(gh project view "$PROJECT_NUMBER" --owner "$OWNER" --format json | jq -r '.id')" \
      --id "$ITEM_ID" --field-id Status --text "$STATUS" 2>/dev/null || true

    echo "Created issue #${ISSUE_NUMBER} → Project item ${ITEM_ID} (${STATUS})"
    echo "  Title: ${TITLE}"
    echo "  Agent: ${AGENT} | Priority: ${PRIORITY} | Category: ${CATEGORY}"
    ;;

  move)
    ITEM_ID="${1:?Item ID required}"
    STATUS="${2:?Status required (Backlog|This Week|In Progress|Review|Done)}"

    PROJECT_ID=$(gh project view "$PROJECT_NUMBER" --owner "$OWNER" --format json | jq -r '.id')
    STATUS_FIELD_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json | jq -r '.fields[] | select(.name=="Status") | .id')

    gh project item-edit --project-id "$PROJECT_ID" --id "$ITEM_ID" \
      --field-id "$STATUS_FIELD_ID" --single-select-option-id \
      "$(gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json | jq -r ".fields[] | select(.name==\"Status\") | .options[] | select(.name==\"$STATUS\") | .id")"

    echo "Moved item ${ITEM_ID} → ${STATUS}"
    ;;

  list)
    STATUS_FILTER="${1:-}"
    if [ -n "$STATUS_FILTER" ]; then
      gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json | \
        jq -r ".items[] | select(.status==\"$STATUS_FILTER\") | \"\(.id)\t\(.title)\t\(.status)\""
    else
      gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json | \
        jq -r '.items[] | "\(.id)\t\(.title)\t\(.status)"'
    fi
    ;;

  update)
    ITEM_ID="${1:?Item ID required}"
    FIELD="${2:?Field name required}"
    VALUE="${3:?Value required}"

    PROJECT_ID=$(gh project view "$PROJECT_NUMBER" --owner "$OWNER" --format json | jq -r '.id')
    FIELD_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json | jq -r ".fields[] | select(.name==\"$FIELD\") | .id")

    gh project item-edit --project-id "$PROJECT_ID" --id "$ITEM_ID" \
      --field-id "$FIELD_ID" --text "$VALUE"

    echo "Updated item ${ITEM_ID}: ${FIELD} = ${VALUE}"
    ;;

  *)
    echo "Unknown action: ${ACTION}" >&2
    echo "Usage: github_board.sh <create|move|list|update> ..." >&2
    exit 1
    ;;
esac
