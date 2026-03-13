# Email Send Tool

Sends branded RinkLink emails via Protonmail SMTP.

## Usage

```bash
tools/email_send.sh --to <email> --subject <subject> --body <body> [options]
```

## Options

| Flag | Description |
|------|-------------|
| `--to` | Recipient email address (required unless `--test`) |
| `--subject` | Email subject line (required) |
| `--body` | Email body — supports HTML (required) |
| `--name` | Recipient name — replaces `{{name}}` in body/subject |
| `--organization` | Organization name — replaces `{{organization_name}}` |
| `--association` | Association name — replaces `{{association}}` |
| `--preheader` | Preview text shown in email client inbox |
| `--test` | Send to `TEST_EMAIL` env var instead of `--to` |
| `--cold` | Send as plain text only — no branded HTML template (for cold outreach) |

## Template Variables

Use these placeholders in `--subject` or `--body`:

- `{{name}}` — recipient name (falls back to "there")
- `{{email}}` — recipient email
- `{{organization_name}}` — organization name
- `{{association}}` — association name

## Examples

**Send a test email:**
```bash
tools/email_send.sh --test --subject "Test from RinkLink" --body "<p>Hello {{name}}, this is a test.</p>"
```

**Send to a specific contact:**
```bash
tools/email_send.sh \
  --to director@hockey.org \
  --subject "Scheduling made easy for {{organization_name}}" \
  --body "<p>Hi {{name}},</p><p>RinkLink can help {{organization_name}} schedule games faster.</p>" \
  --name "John" \
  --organization "Metro Hockey"
```

**Cold outreach (plain text, no branding):**
```bash
tools/email_send.sh \
  --to director@hockey.org \
  --subject "Quick question about {{organization_name}} scheduling" \
  --body "Hi {{name}}, I saw {{organization_name}} is in the middle of the season. Are you still coordinating games over email? Happy to show you how RinkLink handles it." \
  --name "John" \
  --organization "Metro Hockey" \
  --cold
```

## Output

Returns JSON to stdout:
```json
{
  "success": true,
  "to": "user@example.com",
  "subject": "...",
  "messageId": "...",
  "dbId": "..."
}
```

## Notes

- By default, emails are wrapped in the branded RinkLink HTML template (dark blue header, orange CTAs, Space Grotesk font)
- Use `--cold` for cold outreach — sends plain text only to avoid spam filters
- Send records are logged to the Supabase `emails` table
- Uses Protonmail SMTP credentials from `.env`
