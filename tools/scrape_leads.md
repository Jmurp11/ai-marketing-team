# Lead Scraper Tool

Scrapes MyHockeyRankings.com for youth hockey organization contacts. Follows org website links to discover emails, names, and roles from contact/staff/board pages.

**Scrape-only** — outputs raw contacts as JSON. Does not insert into Supabase. Use `tools/lead_insert.sh` to insert leads after Claude Code has validated them.

## Usage

```bash
tools/scrape_leads.sh [options]
```

## Options

| Flag | Description |
|------|-------------|
| `--max-pages <n>` | Max number of associations to process (default: all) |
| `--associations <list>` | Comma-separated filter by association name or location |

## How It Works

1. Fetches the paginated list of associations from MyHockeyRankings
2. For each association, visits the MHR page and finds links to org websites
3. Crawls org websites and their contact/staff/board/about pages
4. Extracts emails using regex with false-positive filtering
5. Extracts names and roles from surrounding HTML context
6. Deduplicates contacts by email (merges fields)
7. Outputs all contacts as JSON to stdout

## Examples

**Scrape 2 associations:**
```bash
tools/scrape_leads.sh --max-pages 2
```

**Scrape Minnesota associations:**
```bash
tools/scrape_leads.sh --associations "Minnesota" --max-pages 10
```

## Output

Returns JSON to stdout with progress logs on stderr:
```json
{
  "status": "completed",
  "contactsFound": 42,
  "errorCount": 2,
  "duration": 125000,
  "contacts": [
    {
      "email": "director@hockey.org",
      "name": "John Smith",
      "role": "President",
      "association": "Metro Hockey Association",
      "organizationName": "Metro Hockey",
      "organizationUrl": "https://metrohockey.org",
      "sourceUrl": "https://metrohockey.org/contact"
    }
  ]
}
```

## Rate Limiting

- 2 second delay between association page fetches
- 1 second delay between org subpage fetches
- Configurable via `SCRAPER_RATE_LIMIT_MS` env var

## Notes

- Progress logs go to stderr so stdout stays clean JSON
- Contact keyword pages discovered: contact, about, staff, board, leadership, director, manager, coach, scheduler, committee, volunteer
- Social media and MHR-internal links are excluded from org crawling
