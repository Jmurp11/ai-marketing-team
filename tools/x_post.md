# Tool: X Post (`x_post.sh`)

Posts tweets, replies, and quote tweets to X (Twitter) as RinkLink's Social Agent (Alex).

## Prerequisites

- OAuth 1.0a credentials set as environment variables (see below)
- `openssl`, `curl`, `jq` installed (`brew install jq` if needed)
- X Developer App with **Read and Write** permissions

### Environment Variables

| Variable | Description |
|----------|-------------|
| `TWITTER_CONSUMER_KEY` | API Key (Consumer Key) from X Developer Portal |
| `TWITTER_CONSUMER_SECRET` | API Key Secret (Consumer Secret) |
| `TWITTER_ACCESS_TOKEN` | Access Token with write permissions |
| `TWITTER_ACCESS_SECRET` | Access Token Secret |

## Usage

```bash
./tools/x_post.sh <action> <text> [reply_to_id]
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `action` | Yes | One of: `tweet`, `reply`, `quote` |
| `text` | Yes | Tweet text (max 280 characters) |
| `reply_to_id` | For reply/quote | Tweet ID to reply to or quote |

### Actions

| Action | Description | Requires ID |
|--------|-------------|-------------|
| `tweet` | Post a new tweet | No |
| `reply` | Reply to an existing tweet | Yes |
| `quote` | Quote tweet with commentary | Yes |

### Examples

**Post a tweet:**
```bash
./tools/x_post.sh tweet "Just dropped a new blog post on hockey training tips for youth players"
```

**Reply to a tweet:**
```bash
./tools/x_post.sh reply "Thanks for the feedback! We're working on more content like this." 1234567890123456789
```

**Quote tweet:**
```bash
./tools/x_post.sh quote "Great insight on rink management — here's what we've found works best" 1234567890123456789
```

### Output

- **Success:** prints the new tweet ID (e.g., `1234567890123456789`)
- **Failure:** prints error message to stderr and exits with code 1

## API Tier Notes

- Uses X API v2 free tier (1,500 tweets/month)
- **Pay-per-post pricing** — each tweet incurs a charge. Minimize test posts.
- OAuth 1.0a is required for write operations (Bearer Token is read-only)
- Rate limit: 200 tweets per 15-minute window on free tier
