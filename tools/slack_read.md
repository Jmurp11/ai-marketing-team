# Tool: Slack Read (`slack_read.sh`)

Reads messages from Slack channels and threads. Enables agents to check for replies, monitor channels, and retrieve asset URLs.

## Prerequisites

- `SLACK_BOT_TOKEN` environment variable set (Bot OAuth token with `channels:history`, `channels:read` scopes)
- `jq` installed (`brew install jq`)
- Slack app invited to target channel

## Usage

```bash
./tools/slack_read.sh <action> <channel> [thread_ts] [limit]
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `action` | Yes | `history` (channel messages) or `replies` (thread replies) |
| `channel` | Yes | Slack channel (`#creative-requests` or raw channel ID) |
| `thread_ts` | For replies | Timestamp of the parent message |
| `limit` | No | Number of messages to fetch (default: 20) |

### Examples

**Read recent channel messages:**
```bash
./tools/slack_read.sh history "#creative-requests"
```

**Read channel messages with limit:**
```bash
./tools/slack_read.sh history "#creative-requests" "" 5
```

**Read thread replies:**
```bash
./tools/slack_read.sh replies "#creative-requests" "1710345678.123456"
```

### Output Format

Returns a JSON array of message objects:

```json
[
  {
    "ts": "1710345678.123456",
    "user": "U1234567890",
    "bot_id": null,
    "text": "Here's the image: https://example.com/asset.png"
  }
]
```

| Field | Description |
|-------|-------------|
| `ts` | Message timestamp (use as `thread_ts` for replies) |
| `user` | Slack user ID (present for human messages) |
| `bot_id` | Bot ID (present for bot messages) |
| `text` | Message text content |

### Notes

- For `replies`, the parent message is automatically skipped — only reply messages are returned
- Channel names are resolved to IDs automatically (requires `channels:read` scope)
- Messages are returned in reverse chronological order (newest first) for `history`
- Messages are returned in chronological order for `replies`
