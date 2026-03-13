#!/usr/bin/env bash
# RinkLink Google Analytics Report — shell wrapper
#
# Usage:
#   tools/ga_report.sh --metric <metric> [options]
#
# Options:
#   --metric     GA4 metric(s), comma-separated (e.g., sessions,totalUsers)
#   --dimension  GA4 dimension(s) to group by (e.g., pagePath,sessionSource)
#   --days       Lookback period in days (default: 7)
#   --limit      Max rows returned (default: 20)
#   --order-by   Sort by this metric descending (default: first metric)
#
# Examples:
#   tools/ga_report.sh --metric sessions --days 7
#   tools/ga_report.sh --metric totalUsers,sessions --dimension pagePath --days 30 --limit 10

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

exec node "$SCRIPT_DIR/ga_report.js" "$@"
