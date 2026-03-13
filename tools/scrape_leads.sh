#!/usr/bin/env bash
# RinkLink Lead Scraper — shell wrapper
# Outputs raw contacts as JSON. Does NOT insert into Supabase.
# Use tools/lead_insert.sh to insert validated leads.
#
# Usage:
#   tools/scrape_leads.sh [options]
#
# Options:
#   --max-pages <n>        Max associations to process
#   --associations <list>  Comma-separated name/location filter
#
# Examples:
#   tools/scrape_leads.sh --max-pages 2
#   tools/scrape_leads.sh --associations "Minnesota,Michigan" --max-pages 5
#   tools/scrape_leads.sh --max-pages 10

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

exec node "$SCRIPT_DIR/scrape_leads.js" "$@"
