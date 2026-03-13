# Tool: GitHub Board (`github_board.sh`)

Manages the "RinkLink Marketing Operations" GitHub Projects V2 board. **Only the Admin agent (Riley) should use this tool.** Other agents communicate needs via Slack; Admin translates to board actions.

## Prerequisites

- `gh` CLI authenticated (`gh auth login`)
- `GITHUB_PROJECT_NUMBER` environment variable set
- `GITHUB_REPO` environment variable set (defaults to `ai-company`)
- `jq` installed

## Board Structure

| Status | Purpose |
|--------|---------|
| Backlog | Ideas and future tasks |
| This Week | Planned for current week |
| In Progress | Actively being worked on |
| Review | Awaiting founder review |
| Done | Completed and approved |

**Custom Fields:** Agent, Priority (H/M/L), Category, Week

## Commands

### Create a Task

```bash
./tools/github_board.sh create <title> <agent> <priority> <category> [status]
```

| Parameter | Values |
|-----------|--------|
| `agent` | `admin`, `assistant`, `content`, `email`, `ads`, `social`, `growth`, `leads` |
| `priority` | `H` (high), `M` (medium), `L` (low) |
| `category` | `Campaign`, `Content`, `Email`, `Experiment`, `Lead`, `System`, `Report` |
| `status` | Default: `Backlog`. Options: `Backlog`, `This Week`, `In Progress`, `Review`, `Done` |

**Example:**
```bash
./tools/github_board.sh create "Draft March newsletter sequence" email H Email "This Week"
```

### Move a Task

```bash
./tools/github_board.sh move <item_id> <status>
```

**Example:**
```bash
./tools/github_board.sh move PVTI_abc123 "In Progress"
```

### List Tasks

```bash
./tools/github_board.sh list [status]
```

**Examples:**
```bash
./tools/github_board.sh list              # All tasks
./tools/github_board.sh list "In Progress"  # Filter by status
```

### Update a Field

```bash
./tools/github_board.sh update <item_id> <field> <value>
```

**Example:**
```bash
./tools/github_board.sh update PVTI_abc123 Week "2026-W11"
```

## Workflow

1. Agent posts a request in Slack (e.g., `#rinklink-hq`)
2. Admin (Riley) reviews and creates/updates board task
3. Admin posts confirmation to `#admin-log` using `slack_post.sh` with `board_update.json` template
4. Admin moves tasks through statuses as work progresses

## Integration with Slack

After any board change, Admin should post to `#admin-log`:

```bash
./tools/slack_post.sh admin "#admin-log" "" \
  slack/templates/board_update.json \
  '{"action":"Created","task_title":"Draft March newsletter","agent":"email","status":"This Week","priority":"H"}'
```
