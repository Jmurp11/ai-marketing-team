# RinkLink AI Marketing Team

An autonomous multi-agent marketing system for [RinkLink.ai](https://rinklink.ai) — a youth hockey scheduling platform. Eight AI agents, each with a distinct personality, collaborate through Slack to handle content, email, social media, ads, lead generation, growth experiments, and administration.

Everything runs on a home server: a Slack bot (Socket Mode) receives messages, routes them to the right agent, shells out to `claude -p` CLI, and posts the response back as that agent's persona.

---

## Architecture

```
Slack (Socket Mode)
  │
  ▼
slack_bot.js ─── resolves channel/mention → agent key
  │
  ├── loads system prompt from agents/<agent>.md
  │
  ├── calls: claude -p --system-prompt <prompt> --no-session-persistence "<message>"
  │
  └── posts response as agent (display name + avatar)

Tools (bash/node scripts)     GitHub Actions (cron)
  ├── email_send.sh              ├── daily_standup.yml (Mon–Fri 9am EST)
  ├── slack_post.sh              └── weekly_report.yml (Mon 8am EST)
  ├── slack_read.sh
  ├── x_post.sh              Supabase (PostgreSQL)
  ├── meta_post.sh              ├── leads
  ├── github_board.sh           ├── emails
  └── scrape_leads.sh           ├── social_posts
                                ├── github_tasks
                                ├── campaigns
                                └── agent_decisions
```

### Agents

| Key | Name | Channel | Role |
|-----|------|---------|------|
| `admin` | Riley (Admin) | #admin-log | System resources, DB integrity, credentials, weekly reports |
| `assistant` | Casey (Assistant) | #rinklink-hq | Supports other agents, visual asset coordination |
| `content` | Morgan (Content) | #content-updates | Blog posts, email copy, ad copy, content repurposing |
| `email` | Drew (Email) | #email-updates | Email campaigns, lead nurture sequences, cold outreach |
| `ads` | Jordan (Ads) | #ads-updates | Meta & X paid campaigns, budget, performance optimization |
| `social` | Alex (Social) | #social-updates | Facebook, Instagram, X posting, engagement, trends |
| `growth` | Sam (Growth) | #experiments | Weekly A/B experiments, hypothesis-driven optimization |
| `leads` | Taylor (Leads) | #leads | Lead scraping from MyHockeyRankings, qualification, scoring |

### Message Routing

1. **Channel-based**: Messages in a mapped channel go to that channel's agent
2. **@mention override**: Mention an agent name (e.g., `@riley`, `@drew`) in any channel to route to that agent

### Slack Channels

| Channel | Purpose |
|---------|---------|
| #rinklink-hq | Daily standups, cross-agent updates, founder announcements |
| #admin-log | System health, board updates, weekly summaries |
| #content-updates | Blog drafts, content calendar |
| #email-updates | Email campaign performance, sequences, open/click rates |
| #ads-updates | Campaign launches, performance reports |
| #social-updates | Social post drafts, engagement metrics |
| #experiments | Experiment proposals and results |
| #leads | New leads, scores, routing decisions |
| #creative-requests | Visual asset requests from agents |

---

## How to Run

### Prerequisites

- **Node.js 18+**
- **`claude` CLI** — installed and authenticated (`claude --version` should work)
- **`jq`**, **`gh` CLI**, **`curl`**, **`openssl`** — used by tool scripts
- A **Slack workspace** you control
- A **Supabase** project (free tier works)

### 1. Clone and configure environment

```bash
git clone <repo-url> ai-company && cd ai-company
cp .env.example .env   # see "Environment Variables" below — fill in all values
```

### 2. Install dependencies

```bash
cd slack/bot && npm install && cd ../..
cd tools && npm install && cd ..
```

### 3. Create Slack app

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. Enable **Socket Mode** (Settings → Socket Mode → toggle on) — generate an **App-Level Token** with `connections:write` scope → this is `SLACK_APP_TOKEN`
3. Under **OAuth & Permissions**, add these Bot Token Scopes:
   - `chat:write`, `chat:write.customize` (post as agent personas)
   - `chat:write.public` (post to channels without joining)
   - `channels:history`, `channels:read` (read messages and channel info)
   - `users:read` (resolve bot user ID)
4. Under **Event Subscriptions** → **Subscribe to bot events**: `message.channels`
5. Install to workspace → copy **Bot User OAuth Token** → this is `SLACK_BOT_TOKEN`
6. Create the 9 channels listed above and invite the bot to each

### 4. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the schema setup in the SQL Editor:

```sql
-- Copy contents of database/setup.sql into the Supabase SQL Editor and run
```

3. Copy your project URL and `anon`/`service_role` key into `.env`

### 5. Start the bot

```bash
node slack/bot/slack_bot.js
```

You should see:
```
⚡ RinkLink Slack Bot is running (Socket Mode)
   Agents: admin, assistant, content, email, ads, social, growth, leads
   Channels: #rinklink-hq, #admin-log, #content-updates, ...
```

### 6. Test

Send a message in any mapped channel. The bot will show "_Agent is thinking..._", call Claude CLI, and post the agent's response.

---

## Tools

Each tool is a standalone bash/node script in `tools/`. They can be run independently from the command line.

| Tool | Script | What it does |
|------|--------|--------------|
| **Email Send** | `email_send.sh` → `email_send.js` | Sends branded or cold emails via Protonmail SMTP, logs to Supabase `emails` table |
| **Slack Post** | `slack_post.sh` | Posts to Slack as any agent, supports Block Kit templates from `slack/templates/` |
| **Slack Read** | `slack_read.sh` | Reads channel history or thread replies, outputs JSON |
| **X Post** | `x_post.sh` | Posts to Twitter/X with OAuth 1.0a (tweet, reply, quote) |
| **Meta Post** | `meta_post.sh` | Posts to Facebook & Instagram via Graph API (fb_post, fb_photo, fb_reply, ig_photo, ig_reel, ig_reply) |
| **GitHub Board** | `github_board.sh` | Manages GitHub Projects board items (create, move, list, update) |
| **Scrape Leads** | `scrape_leads.sh` → `scrape_leads.js` | Scrapes MyHockeyRankings.com for youth hockey org contacts, outputs raw JSON |
| **Lead Insert** | `lead_insert.sh` → `lead_insert.js` | Inserts a single validated lead into Supabase `leads` table |

### Tool usage examples

```bash
# Send a test email
./tools/email_send.sh --to test@example.com --subject "Hello" --body "Test email" --test

# Post to Slack
./tools/slack_post.sh admin "#admin-log" "System check complete."

# Scrape leads (outputs JSON, does not insert)
./tools/scrape_leads.sh --max-pages 2

# Insert a validated lead
./tools/lead_insert.sh --email "john@hockey.org" --name "John Smith" --role "President" --association "Metro Hockey"

# Post a tweet
./tools/x_post.sh tweet "Check out RinkLink.ai!"

# Create a GitHub board item
./tools/github_board.sh create "Write blog post" content H Content "2026-W11"
```

---

## Gap Analysis

### What works today

- Slack bot routing: channel → agent → Claude CLI → response
- All 7 tool scripts are functional and independently runnable
- Email sending (branded HTML + cold plaintext modes) with Supabase logging
- Lead scraping from MyHockeyRankings with deduplication
- Social posting to X (OAuth 1.0a) and Meta (Graph API)
- GitHub Projects board management via `gh` CLI
- Slack posting/reading with Block Kit template support

### What's missing

| Gap | Impact | Details |
|-----|--------|---------|
| **Agents can't execute tools** | **HIGH** | `callClaude()` uses `-p` (print mode) + `--no-session-persistence`. Claude responds with text advice but cannot actually run `email_send.sh`, `x_post.sh`, etc. When an agent says "I'll send the email" — it doesn't. **Fix**: add `--allowedTools` to the CLI invocation, or expose tools as MCP servers. |
| **GitHub Actions don't invoke Claude** | **HIGH** | `daily_standup.yml` and `weekly_report.yml` post placeholder content ("See agent activity log", "Weekly highlights pending"). They don't call Claude to generate real standup/report content. **Fix**: install Claude CLI in a self-hosted runner on the home server, or trigger these pipelines via webhook from the home server. |
| **No process manager** | **MEDIUM** | The Slack bot is a bare `node` process. If it crashes, it stays down. **Fix**: use `pm2`, `systemd`, or Docker for auto-restart. |
| **No `.env.example`** | **MEDIUM** | `.env` is gitignored but there's no template showing required variables. New setup requires reading tool source code to find all env vars. |
| **DB schema doesn't match tool inserts** | **MEDIUM** | `email_send.js` inserts `to_email`, `status`, `sent_at`, `metadata` into `emails` — but `setup.sql` defines `lead_id`, `subject`, `body`, `sent_at`, `replied`. `scrape_leads.js` inserts `name`, `role`, `association`, `organization_name`, `organization_url`, `source_url` into `leads` — but `setup.sql` defines `organization`, `contact_name`, `twitter`, `facebook`, `status`, `notes`. **Fix**: update `setup.sql` to match what the tools actually insert. |
| **Shell scripts missing `.env` loading** | **LOW** | `slack_post.sh`, `slack_read.sh`, `x_post.sh`, `meta_post.sh`, `github_board.sh` expect env vars but don't source `.env`. Only `email_send.sh` and `scrape_leads.sh` auto-load it. **Fix**: add `.env` sourcing to all shell scripts, or always run them via the bot (which loads `.env` via dotenv). |
| **Avatar URLs are broken** | **LOW** | `slack/config.json` avatar URLs point to `https://raw.githubusercontent.com/ai-company/main/...` — this is missing the GitHub owner in the path. Should be `https://raw.githubusercontent.com/<owner>/ai-company/main/...`. |
| **No conversation memory** | **LOW** | `--no-session-persistence` means each message is a fresh Claude invocation. Agents can't reference prior messages or maintain context across a conversation. |
| **`node_modules` not gitignored** | **LOW** | `.gitignore` only excludes `.env` and `.DS_Store`. `node_modules/` directories for `tools/` and `slack/bot/` should be added. |

---

## File Inventory

### Agents (`agents/`)

| File | Agent | Description |
|------|-------|-------------|
| `admin_agent.md` | Riley | System prompt for Admin — resource management, DB, credentials, reporting |
| `assistant_agent.md` | Casey | System prompt for Assistant — cross-agent support, asset coordination |
| `content_agent.md` | Morgan | System prompt for Content — blogs, emails, ad copy, repurposing |
| `email_agent.md` | Drew | System prompt for Email — campaigns, nurture sequences, cold outreach |
| `ads_agent.md` | Jordan | System prompt for Ads — Meta/X paid campaigns, budgets, optimization |
| `social_agent.md` | Alex | System prompt for Social — FB, IG, X posting, engagement, trends |
| `growth_experiment_agent.md` | Sam | System prompt for Growth — A/B experiments, hypothesis testing |
| `lead_discovery_agent.md` | Taylor | System prompt for Leads — scraping, qualification, scoring |

### Slack Bot (`slack/`)

| File | Description |
|------|-------------|
| `bot/slack_bot.js` | Main bot — Socket Mode, message routing, Claude CLI invocation |
| `bot/package.json` | Dependencies: `@slack/bolt`, `dotenv` |
| `config.json` | Agent display names, avatars, personalities, channel purposes |
| `avatars/*.png` | 8 agent avatar images |
| `templates/*.json` | 8 Block Kit templates (daily_update, weekly_report, lead_alert, etc.) |

### Tools (`tools/`)

| File | Description |
|------|-------------|
| `email_send.sh` | Shell wrapper — sources `.env`, calls `email_send.js` |
| `email_send.js` | Node — sends email via SMTP, logs to Supabase |
| `email_send.md` | Tool documentation for Claude agent context |
| `email_template.js` | HTML email template builder (branded RinkLink layout) |
| `scrape_leads.sh` | Shell wrapper — sources `.env`, calls `scrape_leads.js` |
| `scrape_leads.js` | Node — scrapes MyHockeyRankings, extracts contacts, outputs JSON (no DB insert) |
| `scrape_leads.md` | Tool documentation for Claude agent context |
| `lead_insert.sh` | Shell wrapper — sources `.env`, calls `lead_insert.js` |
| `lead_insert.js` | Node — inserts a single validated lead into Supabase |
| `lead_insert.md` | Tool documentation for Claude agent context |
| `slack_post.sh` | Posts to Slack channels with optional Block Kit templates |
| `slack_post.md` | Tool documentation |
| `slack_read.sh` | Reads Slack channel history or thread replies |
| `slack_read.md` | Tool documentation |
| `x_post.sh` | Posts to Twitter/X with OAuth 1.0a signing |
| `x_post.md` | Tool documentation |
| `meta_post.sh` | Posts to Facebook & Instagram via Graph API |
| `meta_post.md` | Tool documentation |
| `github_board.sh` | Manages GitHub Projects board (create, move, list, update) |
| `github_board.md` | Tool documentation |
| `package.json` | Dependencies: `nodemailer`, `axios`, `cheerio`, `@supabase/supabase-js`, `dotenv` |

### Database (`database/`)

| File | Description |
|------|-------------|
| `setup.sql` | PostgreSQL schema — 6 tables (leads, emails, social_posts, github_tasks, campaigns, agent_decisions) |

### Pipelines (`pipelines/`)

| File | Description |
|------|-------------|
| `daily_standup.md` | Pipeline spec for daily standup process |
| `weekly_report.md` | Pipeline spec for weekly reporting process |
| `board_sync.md` | Pipeline spec for GitHub board synchronization |
| `asset_request.md` | Pipeline spec for visual asset request workflow |

### Knowledge (`knowledge/`)

| File | Description |
|------|-------------|
| `master_reference.md` | Master reference document for all agents |
| `business.md` | RinkLink business context and positioning |
| `marketing.md` | Marketing strategy and target audience |
| `content_engine.md` | Content production playbook |
| `email_engine.md` | Email campaign strategy and sequences |
| `social_strategy.md` | Social media strategy across platforms |
| `ads_playbook.md` | Paid advertising playbook (Meta + X) |
| `growth_experiments.md` | Growth experiment framework |
| `lead_discovery.md` | Lead generation and qualification process |

### GitHub Actions (`.github/workflows/`)

| File | Schedule | Description |
|------|----------|-------------|
| `daily_standup.yml` | Mon–Fri 9:00 AM EST | Posts standup updates per agent to Slack (currently placeholder content) |
| `weekly_report.yml` | Mon 8:00 AM EST | Posts weekly reports per agent to Slack (currently placeholder content) |

### Other

| File | Description |
|------|-------------|
| `.env` | Environment variables (gitignored) |
| `.gitignore` | Excludes `.env` and `.DS_Store` |
| `assets/intro-campaign/` | 5 campaign ad images + campaign spec |

---

## Environment Variables

| Variable | Used By | Description |
|----------|---------|-------------|
| `SLACK_BOT_TOKEN` | slack_bot.js, slack_post.sh, slack_read.sh | Slack Bot User OAuth Token (`xoxb-...`) |
| `SLACK_APP_TOKEN` | slack_bot.js | Slack App-Level Token for Socket Mode (`xapp-...`) |
| `GITHUB_TOKEN` | github_board.sh, workflows | GitHub Personal Access Token |
| `GITHUB_OWNER` | github_board.sh | GitHub repo owner |
| `GITHUB_REPO` | github_board.sh | GitHub repo name |
| `GITHUB_PROJECT_NUMBER` | github_board.sh, workflows | GitHub Projects board number |
| `SUPABASE_URL` | email_send.js, scrape_leads.js | Supabase project URL |
| `SUPABASE_KEY` | email_send.js, scrape_leads.js | Supabase anon or service_role key |
| `SMTP_HOST` | email_send.js | SMTP server hostname |
| `SMTP_PORT` | email_send.js | SMTP port (default: 587) |
| `SMTP_USER` | email_send.js | SMTP username |
| `SMTP_PASS` | email_send.js | SMTP password |
| `SMTP_SECURE` | email_send.js | Use TLS (`true`/`false`) |
| `EMAIL_FROM` | email_send.js | Sender email address |
| `ADMIN_EMAIL` | — | Admin notification address |
| `TEST_EMAIL` | email_send.js | Recipient for `--test` flag |
| `TWITTER_CONSUMER_KEY` | x_post.sh | Twitter/X OAuth consumer key |
| `TWITTER_CONSUMER_SECRET` | x_post.sh | Twitter/X OAuth consumer secret |
| `TWITTER_ACCESS_TOKEN` | x_post.sh | Twitter/X OAuth access token |
| `TWITTER_ACCESS_SECRET` | x_post.sh | Twitter/X OAuth access secret |
| `META_ACCESS_TOKEN` | meta_post.sh | Meta Graph API access token |
| `META_PAGE_ID` | meta_post.sh | Facebook Page ID |
| `META_IG_USER_ID` | meta_post.sh | Instagram Business Account ID |
| `META_AD_ACCOUNT_ID` | meta_post.sh | Meta Ads account ID |
| `META_APP_ID` | — | Meta App ID |
| `META_APP_SECRET` | — | Meta App Secret |
| `ANTHROPIC_API_KEY` | claude CLI | Anthropic API key (used by `claude` CLI) |
| `SCRAPER_RATE_LIMIT_MS` | scrape_leads.js | Delay between scraper requests (default: 2000) |
| `SCRAPER_USER_AGENT` | scrape_leads.js | User-Agent string for scraper |
| `SCRAPER_TIMEOUT_MS` | scrape_leads.js | HTTP timeout for scraper (default: 10000) |
| `EMAIL_BATCH_SIZE` | — | Max emails per batch (default: 50) |
| `EMAIL_DELAY_MS` | — | Delay between emails (default: 1000) |
| `EMAIL_DAILY_LIMIT` | — | Max emails per day (default: 500) |
| `JWT_SECRET` | — | JWT signing secret |
| `TOKEN_ENCRYPTION_KEY` | — | Token encryption key |
| `GOOGLE_ANALYTICS_PROPERTY_ID` | — | GA4 property ID |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | — | Path to Google service account JSON |

---

## Verification Checklist

- [ ] **Slack bot starts**: `node slack/bot/slack_bot.js` prints "RinkLink Slack Bot is running"
- [ ] **Agent routing works**: Send message in #content-updates → Morgan responds
- [ ] **@mention routing works**: Type "@drew" in #rinklink-hq → Drew responds
- [ ] **Email tool works**: `./tools/email_send.sh --to x --subject "Test" --body "Test" --test` sends to `TEST_EMAIL`
- [ ] **Scraper tool works**: `./tools/scrape_leads.sh --max-pages 1` returns contacts JSON
- [ ] **Lead insert tool works**: `./tools/lead_insert.sh --email "test@example.com" --name "Test User"` inserts to Supabase
- [ ] **Slack post tool works**: `./tools/slack_post.sh admin "#admin-log" "Test post"`
- [ ] **Slack read tool works**: `./tools/slack_read.sh <channel-id> 5`
- [ ] **X post tool works**: `./tools/x_post.sh tweet "Test"` (use a test account)
- [ ] **GitHub board tool works**: `./tools/github_board.sh list`
- [ ] **Supabase connected**: Tools that log to Supabase show `dbId` in output
- [ ] **GitHub Actions run**: Manually trigger workflows via `workflow_dispatch`
