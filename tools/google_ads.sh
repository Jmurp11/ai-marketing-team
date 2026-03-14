#!/usr/bin/env bash
# RinkLink Google Ads Management — shell wrapper
#
# Usage:
#   tools/google_ads.sh <action> [options]
#
# Actions:
#   report          Pull campaign/ad group/ad performance metrics
#   create-campaign Create a new campaign (Search or Performance Max)
#   create-budget   Create a campaign budget
#   create-ad-group Create an ad group within a campaign
#   create-ad       Create a responsive search ad
#   add-keywords    Add keywords to an ad group
#   pause           Pause a campaign or ad group
#   enable          Enable a paused campaign or ad group
#   update-budget   Update daily budget for a campaign
#   list-campaigns  List all campaigns with status
#
# Examples:
#   tools/google_ads.sh report --days 7
#   tools/google_ads.sh create-campaign --name "Search - Hockey Scheduling" --type search --budget-micros 3300000
#   tools/google_ads.sh pause --campaign-id 123456789
#   tools/google_ads.sh add-keywords --ad-group-id 123 --keywords "youth hockey scheduling,hockey schedule maker"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

exec node "$SCRIPT_DIR/google_ads.js" "$@"
