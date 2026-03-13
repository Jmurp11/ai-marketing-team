# Pipeline: Daily Standup

Runs every weekday at 9:00 AM EST. Each agent posts a morning update to `#rinklink-hq`.

## Trigger

- **Automated:** GitHub Actions (`.github/workflows/daily_standup.yml`) at 9:00 AM EST weekdays
- **Manual:** Run via Claude Code at any time

## Flow

### Step 1: Each Agent Posts Standup (parallel)

All 8 agents post to `#rinklink-hq` using the `daily_update.json` template.

Each agent's standup should include:
- **Yesterday:** What was accomplished
- **Today:** What's planned
- **Blockers:** Anything preventing progress

**Order (if sequential):** Admin → Assistant → Content → Email → Ads → Social → Growth → Leads

### Step 2: Admin Summary

After all agents post, Admin (Riley) posts a summary to `#admin-log`:
- Count of agents reporting
- Key blockers flagged
- Board items that need attention

### Step 3: Board Sync

Admin reviews standups and updates the GitHub Projects board:
- Move completed items to Done
- Flag blocked items
- Add new tasks mentioned in standups

## Agent Standup Prompts

Each agent should be prompted with:

> Review your current tasks, recent metrics, and any pending work. Post your daily standup to #rinklink-hq using the daily_update.json template. Include what you accomplished yesterday, what you're working on today, and any blockers.

## Execution

### Via Claude Code (manual)

```bash
# Post standup for a specific agent
./tools/slack_post.sh social "#rinklink-hq" "" slack/templates/daily_update.json \
  '{"agent_name":"Alex (Social)","date":"2026-03-13","yesterday":"...","today":"...","blockers":"None"}'
```

### Via GitHub Actions (automated)

The workflow triggers Claude Code to generate standup content for each agent, then posts via `slack_post.sh`.

## Success Criteria

- All 8 agents post to `#rinklink-hq` by 9:30 AM EST
- Admin posts summary to `#admin-log` by 9:45 AM EST
- Board is updated to reflect standup outcomes
