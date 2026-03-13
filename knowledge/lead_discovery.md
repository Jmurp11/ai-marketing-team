# RinkLink Lead Discovery

## Purpose

This document defines how agents **discover, qualify, and route high-quality leads** for RinkLink.  
Goals:

- Identify US-based youth hockey organizations with multiple teams  
- Identify tournament directors for free and paid listings  
- Qualify leads based on scheduling challenges and volunteer support  
- Route qualified leads to demos, pricing pages, or email follow-ups  

---

# Section 1 — Ideal Customer Profile (ICP)

### Primary ICP

- **Youth hockey organizations in the US**  
- Organizations with **multiple teams** (Jr, AA, AAA, A levels)  
- Associations with active **volunteer managers**  

### Secondary ICP

- **Tournament directors**  
  - Can post tournaments for free  
  - Can feature tournaments for $100  

---

# Section 2 — Lead Qualification

Agents should ask or infer:

1. **Team support:** How does the organization support volunteer managers?  
2. **Scheduling quality:** Are teams playing opponents at the appropriate skill level?  
   - Scheduling too strong → player demoralization, attrition  
   - Scheduling too weak → player frustration, attrition  
3. **Pain indicators:** Are there signs of scheduling chaos or volunteer burnout?  

**Intent signals include:**

- Searches related to youth hockey scheduling  
- Complaints about bad scheduling  
- Posts about volunteer burnout  
- Active tournament planning discussions  
- Use of Facebook scheduling groups to find games  

---

# Section 3 — Lead Discovery Channels

Agents should crawl, monitor, and collect leads from:

- Google search analytics  
- Hockey organization websites  
- Facebook groups (especially scheduling groups)  
- Twitter/X  
- Tournament calendars  
- [MyHockeyRankings.com](https://myhockeyrankings.com/leagues) — crawl league sites for team websites and contact info  

**Lead database:** Maintain an internal database for all discovered leads.

---

# Section 4 — Outreach Triggers

Agents flag leads if they demonstrate:

- Statements like:
  - “We need help scheduling games for the season”  
  - “Too many emails around scheduling”  
  - “Looking for opponents”  
  - “Any openings on [date]”  
  - “Any open ice / game slots”  

- Active discussions or questions in scheduling groups  

**Peak lead window:** March through August (pre-season and early-season scheduling).

---

# Section 5 — Lead Scoring

Agents score leads based on:

- Organization size (number of teams)  
- US-based geography  
- Engagement signals (social posts, search activity, discussions)  

**Lead levels:** Agents determine MQL vs SQL automatically using lead behavior and attributes.

---

# Section 6 — Discovery Interaction

Qualified leads can be approached through:

- Email response  
- Direct message (Facebook/X)  
- Form fills on website  

**Next steps after engagement:**

1. Offer to schedule a **demo**  
2. Send to **website landing page**  
3. Send to **pricing page**  

---

# Section 7 — Lead Tracking & Enrichment

Agents should maintain a CRM-like internal tracker with fields:

- Organization name  
- Contact info (emails, phone, social handles)  
- Number of teams  
- League/level (Jr, AA, AAA, A)  
- Pain points / intent signals  
- Lead score  
- Last contact date  

**Lead enrichment tasks:**

- Crawl league sites and team websites for updated contact info  
- Confirm number of teams and association level  
- Flag organizations showing high engagement or urgent scheduling needs  

---

# Section 8 — Lead Nurturing

For cold or partially qualified leads, agents should send:

- Blog posts and scheduling guides  
- Tournament planning tips  
- Case use stories  
- Video demo clips  

**Follow-up cadence:** Positive and responsive leads should be engaged weekly until they convert or decline.

---

# Section 9 — Market-Specific Discovery Rules

Agents should prioritize discovery using these keywords and indicators:

- Jr, AA, AAA, A, hockey, *YHA*  
- Crawl [MyHockeyRankings.com](https://myhockeyrankings.com/leagues) to gather league and team websites  
- Collect organization contacts systematically  
- Target associations with multiple active teams  

---

# Section 10 — Agent Autonomy Rules

1. Agents may **crawl, score, and enrich leads automatically**  
2. Agents should **flag high-value leads** for immediate outreach  
3. Agents must maintain **data integrity** in the lead database  
4. Agents can recommend new discovery channels or triggers for review

---

# Scraper Infrastructure

## Scraping Tool

Use `tools/scrape_leads.sh` to scrape MyHockeyRankings.com for youth hockey org contacts.

### CLI Usage

```bash
# Dry run — preview without saving
tools/scrape_leads.sh --dry-run --max-pages 2

# Filter by region
tools/scrape_leads.sh --associations "Minnesota,Michigan" --max-pages 10

# Full scrape
tools/scrape_leads.sh --max-pages 50
```

### How It Works

1. Fetches the paginated association list from MyHockeyRankings
2. Visits each association page and follows links to org websites
3. Crawls contact/staff/board/about pages on org sites
4. Extracts emails via regex (filters false positives like image files, sentry, example.com)
5. Extracts names and roles from HTML context near each email
6. Deduplicates by email address (merges fields from multiple sources)
7. Saves new leads to the Supabase `leads` table

### Rate Limits

- 2 second delay between association pages
- 1 second delay between org subpages
- Configurable via `SCRAPER_RATE_LIMIT_MS` env var

### Contact Page Keywords

The scraper follows links containing: contact, about, staff, board, leadership, director, manager, coach, scheduler, committee, volunteer

### Enrichment

Contacts are enriched with:
- Name (extracted from surrounding HTML or inferred from email)
- Role (president, director, manager, coach, etc.)
- Association name
- Organization name and URL
- Source URL for reference  