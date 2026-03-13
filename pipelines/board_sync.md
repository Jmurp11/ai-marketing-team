# Pipeline: Board Sync

Admin (Riley) syncs Slack activity to the GitHub Projects board. Runs after daily standups and on-demand.

## Trigger

- **After daily standup:** Admin reviews all standup posts and updates board
- **On-demand:** When agents post task requests or status updates in Slack
- **Weekly:** As part of Monday weekly report pipeline

## Flow

### Step 1: Scan Slack Channels

Admin reviews recent posts in all channels for:
- Task completion announcements → Move items to Done
- New work requests → Create new board items
- Blockers reported → Flag items, add comments
- Status changes → Move items between columns

### Step 2: Update Board

For each identified action:

**New task:**
```bash
./tools/github_board.sh create "<title>" <agent> <priority> <category> "<status>"
```

**Move task:**
```bash
./tools/github_board.sh move <item_id> "<new_status>"
```

**Update field:**
```bash
./tools/github_board.sh update <item_id> Week "2026-W11"
```

### Step 3: Post Confirmations

After each board change, Admin posts to `#admin-log`:

```bash
./tools/slack_post.sh admin "#admin-log" "" slack/templates/board_update.json \
  '{"action":"Moved to Done","task_title":"March blog series","agent":"content","status":"Done","priority":"M"}'
```

### Step 4: Weekly Board Cleanup (Mondays)

- Archive Done items older than 2 weeks
- Review Backlog for stale items
- Ensure all In Progress items have an assigned agent
- Update Week field on all This Week items

## Board Status Mapping

| Slack Signal | Board Action |
|--------------|-------------|
| "completed", "done", "shipped" | → Done |
| "starting", "working on" | → In Progress |
| "need review", "ready for review" | → Review |
| "planning", "next week" | → This Week |
| "idea", "should we", "what if" | → Backlog |

## Key Rule

**Only Admin (Riley) writes to the board.** Other agents communicate via Slack. This ensures a single source of truth and prevents conflicts.
