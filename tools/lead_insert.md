# Lead Insert Tool

Inserts a single validated lead into the Supabase `leads` table. Designed to be called after Claude Code has evaluated scraper output and confirmed the contact is a valid lead.

## Usage

```bash
tools/lead_insert.sh --email <email> [options]
```

## Options

| Flag | Description |
|------|-------------|
| `--email` | Contact email address (required) |
| `--name` | Contact full name |
| `--role` | Contact role (e.g., President, Director, Registrar) |
| `--association` | Hockey association name |
| `--organization-name` | Organization name |
| `--organization-url` | Organization website URL |
| `--source-url` | Page where the contact was discovered |

## Behavior

- Checks for existing lead by email before inserting (skips duplicates)
- Returns JSON with `action: "inserted"` or `action: "skipped"`

## Example

```bash
tools/lead_insert.sh \
  --email "john@metrohockey.org" \
  --name "John Smith" \
  --role "President" \
  --association "Metro Hockey Association" \
  --organization-name "Metro Hockey Club" \
  --organization-url "https://metrohockey.org" \
  --source-url "https://metrohockey.org/contact"
```

## Output

```json
{"success": true, "action": "inserted", "id": 42, "email": "john@metrohockey.org"}
```

Or if already exists:
```json
{"success": true, "action": "skipped", "reason": "already exists", "id": 12, "email": "john@metrohockey.org"}
```
