#!/usr/bin/env bash
# RinkLink DB Query — Read-only queries against Supabase tables
#
# Usage:
#   tools/db_query.sh --table <table> [options]
#
# Options:
#   --table    Table name (required): leads, emails, social_posts, campaigns, experiments, agent_decisions
#   --eq       Filter: column:value (repeatable)
#   --gte      Filter: column:value (repeatable)
#   --lte      Filter: column:value (repeatable)
#   --order    Order: column:asc|desc (default: created_at:desc)
#   --limit    Max rows (default: 50)
#   --count    Return count only
#   --select   Columns to select (comma-separated)
#
# Examples:
#   tools/db_query.sh --table leads --eq nurture_status:nurture --order created_at:desc --limit 20
#   tools/db_query.sh --table social_posts --eq platform:x --gte posted_at:2026-03-01 --limit 10
#   tools/db_query.sh --table agent_decisions --eq agent:social --limit 5
#   tools/db_query.sh --table leads --count

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

exec node "$SCRIPT_DIR/db_query.js" "$@"
