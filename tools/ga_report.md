# Google Analytics Report Tool

Fetches website analytics data from Google Analytics 4.

## Usage

```bash
tools/ga_report.sh --metric <metric> [options]
```

## Options

| Flag | Description |
|------|-------------|
| `--metric` | GA4 metric(s), comma-separated (required) |
| `--dimension` | GA4 dimension(s) to group by, comma-separated |
| `--days` | Lookback period in days (default: 7) |
| `--limit` | Max rows returned (default: 20) |
| `--order-by` | Sort by this metric descending (default: first metric) |

## Common Metrics

| Metric | Description |
|--------|-------------|
| `sessions` | Total sessions |
| `totalUsers` | Unique users |
| `newUsers` | First-time visitors |
| `screenPageViews` | Page views |
| `bounceRate` | Bounce rate (0-1) |
| `averageSessionDuration` | Avg session length in seconds |
| `conversions` | Conversion events |
| `engagedSessions` | Sessions with engagement |
| `engagementRate` | Engaged sessions / total sessions |
| `eventCount` | Total events fired |

## Common Dimensions

| Dimension | Description |
|-----------|-------------|
| `pagePath` | URL path (e.g., `/pricing`) |
| `sessionSource` | Traffic source (e.g., `google`, `direct`) |
| `sessionMedium` | Traffic medium (e.g., `organic`, `cpc`) |
| `sessionCampaignName` | Campaign name |
| `city` | Visitor city |
| `country` | Visitor country |
| `deviceCategory` | Device type (`desktop`, `mobile`, `tablet`) |
| `operatingSystem` | OS (e.g., `iOS`, `Windows`) |
| `browser` | Browser name |
| `landingPagePlusQueryString` | Landing page URL |

## Examples

**Traffic overview (last 7 days):**
```bash
tools/ga_report.sh --metric sessions,totalUsers,screenPageViews --days 7
```

**Top pages by sessions:**
```bash
tools/ga_report.sh --metric sessions,totalUsers --dimension pagePath --days 30 --limit 10
```

**Traffic sources:**
```bash
tools/ga_report.sh --metric sessions,totalUsers --dimension sessionSource --days 30
```

**Device breakdown:**
```bash
tools/ga_report.sh --metric sessions --dimension deviceCategory --days 7
```

**Conversions by source:**
```bash
tools/ga_report.sh --metric conversions,sessions --dimension sessionSource --days 30 --order-by conversions
```

**Bounce rate by page:**
```bash
tools/ga_report.sh --metric bounceRate,sessions --dimension pagePath --days 14 --limit 10 --order-by sessions
```

## Output

Returns JSON to stdout:
```json
{
  "success": true,
  "property": "123456789",
  "dateRange": "2026-03-06 to 2026-03-13",
  "rows": [
    { "pagePath": "/", "sessions": 142, "totalUsers": 98 },
    { "pagePath": "/pricing", "sessions": 67, "totalUsers": 52 }
  ],
  "totals": { "sessions": 584, "totalUsers": 312 },
  "rowCount": 2
}
```

## Notes

- Requires `GOOGLE_ANALYTICS_PROPERTY_ID` and `GOOGLE_SERVICE_ACCOUNT_JSON` in `.env`
- The service account must have Viewer access on the GA4 property
- Date ranges are inclusive of both start and end dates
- Metrics like `bounceRate` and `engagementRate` return decimals (0-1)
- `averageSessionDuration` returns seconds — divide by 60 for minutes
