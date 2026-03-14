#!/usr/bin/env bash
# RinkLink DB Insert — Insert rows into context tables
#
# Usage:
#   tools/db_insert.sh --table <table> --data '<json>'
#
# Allowed tables: social_posts, campaigns, experiments, agent_decisions
# (leads and emails have dedicated tools with validation)
#
# Examples:
#   tools/db_insert.sh --table social_posts --data '{"platform":"x","action":"tweet","content":"Hello world","platform_post_id":"123456"}'
#   tools/db_insert.sh --table agent_decisions --data '{"agent":"social","decision":"Posted 3 tweets","reasoning":"Morning schedule","context":{"hooks_used":["pain_point","social_proof"]}}'
#   tools/db_insert.sh --table experiments --data '{"name":"subject_line_test","hypothesis":"Shorter subjects get more opens","channel":"email","variable_tested":"subject_length","kpi":"open_rate","status":"planned"}'

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

exec node "$SCRIPT_DIR/db_insert.js" "$@"
