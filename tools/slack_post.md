# Tool: Slack Post (`slack_post.sh`)

Posts messages to Slack as any RinkLink agent with custom display name and avatar.

## Prerequisites

- `SLACK_BOT_TOKEN` environment variable set (Bot OAuth token with `chat:write.customize` scope)
- `jq` installed (`brew install jq`)
- Slack app invited to target channel

## Usage

```bash
./tools/slack_post.sh <agent_key> <channel> <message> [template_file] [template_vars_json]
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `agent_key` | Yes | One of: `admin`, `assistant`, `content`, `email`, `ads`, `social`, `growth`, `leads` |
| `channel` | Yes | Slack channel (e.g. `#admin-log`, `#rinklink-hq`) |
| `message` | Yes* | Plain text message (*optional if using template) |
| `template_file` | No | Path to Block Kit JSON template in `slack/templates/` |
| `template_vars_json` | No | JSON object with template variable substitutions |

### Examples

**Plain text message:**
```bash
./tools/slack_post.sh admin "#admin-log" "Board sync complete — 3 tasks moved to Done"
```

**Using a template:**
```bash
./tools/slack_post.sh email "#email-updates" "Weekly email metrics" \
  slack/templates/email_update.json \
  '{"campaign_name":"Welcome Sequence","open_rate":"42%","ctr":"12%","emails_sent":"847","replies":"23","demo_bookings":"5","notes":"Best week yet"}'
```

**Daily standup:**
```bash
./tools/slack_post.sh social "#rinklink-hq" "Daily standup" \
  slack/templates/daily_update.json \
  '{"agent_name":"Alex (Social)","date":"2026-03-13","yesterday":"Posted 4 tweets, 2 Instagram stories","today":"Engage with hockey tournament threads, draft weekend content","blockers":"None"}'
```

### Agent Keys → Display Names

| Key | Posts As |
|-----|---------|
| `admin` | Riley (Admin) |
| `assistant` | Casey (Assistant) |
| `content` | Morgan (Content) |
| `email` | Drew (Email) |
| `ads` | Jordan (Ads) |
| `social` | Alex (Social) |
| `growth` | Sam (Growth) |
| `leads` | Taylor (Leads) |

### Available Templates

| Template | Path | Use Case |
|----------|------|----------|
| Daily Update | `slack/templates/daily_update.json` | Morning standups |
| Weekly Report | `slack/templates/weekly_report.json` | Monday metrics |
| Experiment Result | `slack/templates/experiment_result.json` | Growth experiment outcomes |
| Lead Alert | `slack/templates/lead_alert.json` | New lead discovered |
| Campaign Update | `slack/templates/campaign_update.json` | Ads performance |
| Email Update | `slack/templates/email_update.json` | Email campaign metrics |
| Board Update | `slack/templates/board_update.json` | GitHub board changes |
| Asset Request | `slack/templates/asset_request.json` | Visual asset requests |

### Channels

| Channel | Purpose |
|---------|---------|
| `#rinklink-hq` | Daily standups, cross-agent updates |
| `#social-updates` | Social drafts and metrics |
| `#ads-updates` | Campaign launches and reports |
| `#content-updates` | Blog drafts, content calendar |
| `#email-updates` | Email performance and sequences |
| `#experiments` | Experiment proposals and results |
| `#leads` | New leads, scores, routing |
| `#admin-log` | System health, board updates |
| `#creative-requests` | Visual asset requests and delivery |
