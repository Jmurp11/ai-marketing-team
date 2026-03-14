# RinkLink AI Agent Knowledge Base – Master Reference

This file serves as the **central index** for all RinkLink AI agent resources.
Agents should use this file to **navigate to detailed instructions** across business, marketing, social, ads, content, growth, lead discovery, email, tools, and communication.

---

## 1. Business Overview
**File:** [business.md](./business.md)
**Purpose:** Full understanding of:

- RinkLink product, features, and benefits
- Problem solved for youth hockey organizations
- Target users and primary buyers

---

## 2. Marketing Strategy
**File:** [marketing.md](./marketing.md)
**Purpose:** Guidance on:

- 90-day marketing objectives
- Paid subscription focus
- Messaging, positioning, and target audience
- Channel priorities: Meta, Twitter/X, social engagement

---

## 3. Social Strategy
**File:** [social_strategy.md](./social_strategy.md)
**Purpose:** Autonomous social agent operations:

- Platform tactics (Meta, X, Instagram)
- Posting frequency, hooks, content themes
- Community engagement and follower growth
- Founder voice and brand tone

---

## 4. Ads Playbook
**File:** [ads_playbook.md](./ads_playbook.md)
**Purpose:** Paid agent operations:

- Paid campaign setup & optimization (Meta, X, & **Google Ads**)
- Google Ads Search & Performance Max campaign strategy
- Keyword groups, negative keywords, responsive search ads
- Audience targeting, creative, and messaging
- Budget management ($100/month Google Ads, $3.30/day), target CPA $25–$37
- Conversion-focused campaign management with GA4 cross-referencing

---

## 5. Content Engine
**File:** [content_engine.md](./content_engine.md)
**Purpose:** Content agent operations:

- Writing blogs, emails, ad copy
- Content scheduling & repurposing
- Visual asset integration
- Conversion and KPI tracking

---

## 6. Email Engine
**File:** [email_engine.md](./email_engine.md)
**Purpose:** Email agent operations:

- Weekly email campaign schedule (7 emails/week)
- Nurture sequences and cold outreach cadences
- Subject line optimization and personalization
- Custom SMTP via Protonmail

---

## 7. Growth Experiments
**File:** [growth_experiments.md](./growth_experiments.md)
**Purpose:** Growth experiment agent operations:

- Plan, execute, and optimize weekly experiments
- Test social posts, ads, emails, blogs
- Track KPIs and scale winning experiments

---

## 8. Lead Discovery
**File:** [lead_discovery.md](./lead_discovery.md)
**Purpose:** Lead discovery agent operations:

- Discover, qualify, enrich, and route youth hockey organization leads
- Track engagement signals & lead scoring
- Route leads to demos, website, or pricing pages

---

## 9. Agent Directory

Each agent has a spec file in [`/agents/`](../agents/) with responsibilities, rules, decision logic, and a **Slack identity** for team communication.

| Agent | File | Slack Name | Default Channel | Personality |
|-------|------|------------|-----------------|-------------|
| Admin | [admin_agent.md](../agents/admin_agent.md) | Riley (Admin) | `#admin-log` | Professional, organized, concise |
| Assistant | [assistant_agent.md](../agents/assistant_agent.md) | Casey (Assistant) | `#admin-log` | Helpful, warm, proactive |
| Content | [content_agent.md](../agents/content_agent.md) | Morgan (Content) | `#content-updates` | Creative, articulate, vivid |
| Email | [email_agent.md](../agents/email_agent.md) | Drew (Email) | `#email-updates` | Persuasive, conversational, founder-voiced |
| Ads | [ads_agent.md](../agents/ads_agent.md) | Jordan (Ads) | `#ads-updates` | Data-driven, metric-focused |
| Social | [social_agent.md](../agents/social_agent.md) | Alex (Social) | `#social-updates` | Energetic, trend-aware, casual |
| Growth Experiment | [growth_experiment_agent.md](../agents/growth_experiment_agent.md) | Sam (Growth) | `#experiments` | Analytical, hypothesis-driven |
| Lead Discovery | [lead_discovery_agent.md](../agents/lead_discovery_agent.md) | Taylor (Leads) | `#leads` | Investigative, detail-oriented |

All agents also post to **`#rinklink-hq`** for daily standups and cross-agent updates.

---

## 10. Slack Communication

**Config:** [`/slack/config.json`](../slack/config.json) — Agent identities, avatars, and channel mappings
**Avatars:** `/slack/avatars/` — Agent profile images
**Tool:** [`/tools/slack_post.sh`](../tools/slack_post.sh) | **Spec:** [`/tools/slack_post.md`](../tools/slack_post.md)

Posts to Slack as any agent with custom display name and avatar via `chat:write.customize`.

### Channels

| Channel | Purpose | Primary Posters |
|---------|---------|-----------------|
| `#rinklink-hq` | Daily standups, cross-agent updates, founder announcements | All agents |
| `#social-updates` | Social post drafts, engagement metrics | Alex (Social) |
| `#ads-updates` | Campaign launches, performance reports | Jordan (Ads) |
| `#content-updates` | Blog drafts, content calendar | Morgan (Content) |
| `#email-updates` | Email campaign performance, sequences, open/click rates | Drew (Email) |
| `#experiments` | Experiment proposals and results | Sam (Growth) |
| `#leads` | New leads, scores, routing decisions | Taylor (Leads) |
| `#admin-log` | System health, board updates, weekly summaries | Riley (Admin), Casey (Assistant) |

### Block Kit Templates

Located in [`/slack/templates/`](../slack/templates/):

| Template | File | Used By |
|----------|------|---------|
| Daily Standup | `daily_update.json` | All agents |
| Weekly Report | `weekly_report.json` | All agents |
| Experiment Result | `experiment_result.json` | Growth |
| Lead Alert | `lead_alert.json` | Leads |
| Campaign Update | `campaign_update.json` | Ads |
| Email Update | `email_update.json` | Email |
| Board Update | `board_update.json` | Admin |

---

## 11. GitHub Projects Board

**Board:** "RinkLink Marketing Operations"
**Manager:** Admin (Riley) — sole agent with board write access
**Tool:** [`/tools/github_board.sh`](../tools/github_board.sh) | **Spec:** [`/tools/github_board.md`](../tools/github_board.md)

| Status | Purpose |
|--------|---------|
| Backlog | Ideas and future tasks |
| This Week | Planned for current week |
| In Progress | Actively being worked on |
| Review | Awaiting founder review |
| Done | Completed and approved |

**Custom Fields:** Agent (8 values), Priority (H/M/L), Category (Campaign/Content/Email/Experiment/Lead/System/Report), Week (e.g., "2026-W11")

**Key Rule:** Other agents request board changes via Slack. Admin translates to board actions and confirms in `#admin-log`.

---

## 12. Pipelines & Automation

### Pipelines

Located in [`/pipelines/`](../pipelines/):

| Pipeline | File | Schedule | Description |
|----------|------|----------|-------------|
| Daily Standup | [daily_standup.md](../pipelines/daily_standup.md) | Weekdays 9 AM EST | All agents post morning updates to `#rinklink-hq` |
| Weekly Report | [weekly_report.md](../pipelines/weekly_report.md) | Mondays 8 AM EST | All agents submit weekly reports to their channels |
| Board Sync | [board_sync.md](../pipelines/board_sync.md) | After standups + on-demand | Admin syncs Slack activity to GitHub Projects board |

### GitHub Actions

Located in [`.github/workflows/`](../.github/workflows/):

| Workflow | File | Trigger |
|----------|------|---------|
| Daily Standup | `daily_standup.yml` | Cron (weekdays 14:00 UTC) + manual |
| Weekly Report | `weekly_report.yml` | Cron (Mondays 13:00 UTC) + manual |

---

## 13. Database

**File:** [`/database/setup.sql`](../database/setup.sql)

| Table | Purpose |
|-------|---------|
| `leads` | Lead contact info, status, and notes |
| `emails` | Sent emails linked to leads |
| `social_posts` | Social content and engagement metrics |
| `github_tasks` | GitHub Projects board items (agent, status, priority, category, week) |
| `campaigns` | Campaign goals, dates, and notes |
| `agent_decisions` | Logged agent decisions with context |

---

## 14. Environment & Config

| File | Purpose |
|------|---------|
| [`.env.example`](../.env.example) | Template for all required env vars (Slack, GitHub, Meta, Twitter, Google Analytics, SMTP) |
| [`.gitignore`](../.gitignore) | Excludes `.env` and OS files from git |

---

## 15. Usage Notes for Agents

1. Begin with **business.md** to understand the product and audience.
2. Reference **marketing.md** for objectives and messaging.
3. Use **social_strategy.md** and **ads_playbook.md** for autonomous campaign execution.
4. Follow **content_engine.md** for content creation and repurposing.
5. Follow **email_engine.md** for email campaigns and sequences.
6. Use **growth_experiments.md** to test, optimize, and scale growth strategies.
7. Leverage **lead_discovery.md** for systematic lead generation.
8. Refer to your agent file in `/agents/` for **role-specific instructions and Slack identity**.
9. Use `#rinklink-hq` as the **shared context channel** — all agents post standups here.
10. Use `/tools/slack_post.sh` to post to any channel as your agent identity.
11. Request board changes via Slack — Admin (Riley) manages the GitHub Projects board.

---

## 16. Reporting & Dashboards

- Each agent sends **weekly reports** per their pipeline schedule (Mondays 8 AM EST).
- Reports go to each agent's default Slack channel + executive summary to `#rinklink-hq`.
- Admin compiles cross-agent summaries and updates the GitHub Projects board.
- Recommended dashboard tools:

  - Google Data Studio for social, ads, and website KPIs
  - Notion or Google Sheets for content, growth experiments, and lead tracking
  - `#rinklink-hq` Slack channel for real-time cross-agent visibility
  - GitHub Projects board for task tracking and status

---

> This master file ensures agents **never lose context** and can **jump directly to any detailed instructions**, while maintaining alignment across the full RinkLink AI system.
