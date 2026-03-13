#!/usr/bin/env bash
# RinkLink Email Sender — shell wrapper
#
# Usage:
#   tools/email_send.sh --to <email> --subject <subject> --body <body> [options]
#
# Options:
#   --to            Recipient email
#   --subject       Email subject
#   --body          Email body (HTML or plain text)
#   --name          Recipient name (for template variables)
#   --organization  Organization name (for template variables)
#   --association   Association name (for template variables)
#   --preheader     Preview text shown in email clients
#   --test          Send to TEST_EMAIL instead of --to
#
# Examples:
#   tools/email_send.sh --to user@example.com --subject "Hello" --body "<p>Hi there!</p>"
#   tools/email_send.sh --test --subject "Test" --body "Testing email" --name "Jim"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

exec node "$SCRIPT_DIR/email_send.js" "$@"
