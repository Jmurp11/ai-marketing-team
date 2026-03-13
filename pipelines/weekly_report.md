# Pipeline: Weekly Report

Runs every Monday at 8:00 AM EST. Each agent submits a comprehensive weekly report.

## Trigger

- **Automated:** GitHub Actions (`.github/workflows/weekly_report.yml`) at 8:00 AM EST Mondays
- **Manual:** Run via Claude Code at any time

## Flow

### Step 1: Agents Submit Reports (parallel)

Each agent posts to their default channel using the `weekly_report.json` template.

| Agent | Channel | Key Metrics |
|-------|---------|-------------|
| Social (Alex) | `#social-updates` | Followers, engagement rate, top posts, CTR |
| Ads (Jordan) | `#ads-updates` | Impressions, CTR, CPC, CPA, conversions |
| Content (Morgan) | `#content-updates` | Blog traffic, content pieces published, CTR |
| Email (Drew) | `#email-updates` | Emails sent, open rate, CTR, demo bookings, conversions |
| Growth (Sam) | `#experiments` | Experiments run, winners, losers, recommendations |
| Leads (Taylor) | `#leads` | Leads discovered, scores, leads routed to demos |
| Assistant (Casey) | `#admin-log` | Tasks completed, pending requests, asset needs |
| Admin (Riley) | `#admin-log` | Board summary, system health, agent performance |

### Step 2: Admin Compiles Executive Summary

Admin (Riley) compiles a cross-agent summary and posts to `#rinklink-hq`:
- Top wins across all agents
- Key metrics (total leads, conversions, spend)
- Priorities for the coming week
- Board status overview

### Step 3: Board Update

Admin updates the GitHub Projects board:
- Close completed tasks from the past week
- Set "This Week" items for the new week
- Update Week field to current week (e.g., "2026-W12")

## Execution

### Via Claude Code (manual)

```bash
# Post weekly report for a specific agent
./tools/slack_post.sh ads "#ads-updates" "" slack/templates/weekly_report.json \
  '{"agent_name":"Jordan (Ads)","week":"2026-W11","metrics":"• Impressions: 45,200\n• CTR: 2.3%\n• CPA: $8.50\n• Conversions: 12","highlights":"• Scaled tournament ad set 40%\n• New lookalike audience performing well","next_week":"• Launch spring registration campaign\n• Test video creative"}'
```

## Success Criteria

- All 8 agents submit reports by 9:00 AM EST Monday
- Admin executive summary posted to `#rinklink-hq` by 10:00 AM EST
- Board updated with new week's priorities
