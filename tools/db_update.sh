#!/usr/bin/env bash
# RinkLink DB Update — Update existing rows in Supabase tables
#
# Usage:
#   tools/db_update.sh --table <table> --eq <column:value> --set <column:value> [--set ...]
#
# Allowed tables: leads, campaigns, experiments
# Allowed columns per table:
#   leads:       nurture_status, nurture_step, last_email_at, name, role, association, organization_name, organization_url
#   campaigns:   status, metrics, notes, end_date, updated_at
#   experiments:  status, outcome, started_at, completed_at
#
# Examples:
#   tools/db_update.sh --table leads --eq id:42 --set nurture_status:nurture --set nurture_step:2 --set last_email_at:2026-03-13
#   tools/db_update.sh --table campaigns --eq id:5 --set status:active --set updated_at:2026-03-13
#   tools/db_update.sh --table experiments --eq id:3 --set status:completed --set outcome:"Variant A won with 15% higher CTR"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

exec node "$SCRIPT_DIR/db_update.js" "$@"
