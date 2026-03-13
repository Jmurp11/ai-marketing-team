#!/usr/bin/env bash
# RinkLink Lead Insert — inserts a single validated lead into Supabase
#
# Usage:
#   tools/lead_insert.sh --email <email> [options]
#
# Options:
#   --email              Contact email (required)
#   --name               Contact name
#   --role               Contact role
#   --association         Association name
#   --organization-name  Organization name
#   --organization-url   Organization website URL
#   --source-url         Page where contact was found
#
# Examples:
#   tools/lead_insert.sh --email "john@hockey.org" --name "John Smith" --role "President" --association "Metro Hockey" --organization-name "Metro Hockey Club"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

exec node "$SCRIPT_DIR/lead_insert.js" "$@"
