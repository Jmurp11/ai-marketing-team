# Tool: Meta Post (`meta_post.sh`)

Posts to Facebook Pages and Instagram via the Meta Graph API for RinkLink's Social Agent (Alex), Ads Agent (Jordan), and Content Agent (Casey).

## Prerequisites

- Meta Developer App with required permissions (see below)
- Long-lived Page Access Token (never expires)
- `curl`, `jq` installed (`brew install jq` if needed)

### Permissions / Scopes

| Scope | Purpose |
|-------|---------|
| `pages_manage_posts` | Post to Facebook Page |
| `pages_read_engagement` | Read comments on Page posts |
| `instagram_basic` | Instagram account info |
| `instagram_content_publish` | Post to Instagram |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `META_ACCESS_TOKEN` | Long-lived Page Access Token |
| `META_PAGE_ID` | Facebook Page ID |
| `META_IG_USER_ID` | Instagram Business Account ID |

## Usage

```bash
./tools/meta_post.sh <action> <text> [media_url] [reply_to_id]
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `action` | Yes | One of: `fb_post`, `fb_photo`, `fb_reply`, `ig_photo`, `ig_reel`, `ig_reply` |
| `text` | Yes | Post text or caption |
| `media_url` | For photo/reel actions | Publicly accessible image or video URL |
| `reply_to_id` | For reply actions | Comment ID to reply to |

### Actions

| Action | Platform | Description | Requires media_url | Requires reply_to_id |
|--------|----------|-------------|:------------------:|:--------------------:|
| `fb_post` | Facebook | Text post to Page | No | No |
| `fb_photo` | Facebook | Photo post with caption | Yes | No |
| `fb_reply` | Facebook | Reply to a comment | No | Yes |
| `ig_photo` | Instagram | Image post with caption | Yes | No |
| `ig_reel` | Instagram | Video/reel post with caption | Yes | No |
| `ig_reply` | Instagram | Reply to a comment | No | Yes |

### Examples

**Post to Facebook Page:**
```bash
./tools/meta_post.sh fb_post "Check out our new rink schedule for the spring season!"
```

**Photo post to Facebook:**
```bash
./tools/meta_post.sh fb_photo "Grand opening day!" "https://example.com/photo.jpg"
```

**Reply to a Facebook comment:**
```bash
./tools/meta_post.sh fb_reply "Thanks for the feedback!" 123456789012345
```

**Photo post to Instagram:**
```bash
./tools/meta_post.sh ig_photo "Game day vibes at the rink" "https://example.com/rink-photo.jpg"
```

**Reel post to Instagram:**
```bash
./tools/meta_post.sh ig_reel "Season highlights reel" "https://example.com/highlights.mp4"
```

**Reply to an Instagram comment:**
```bash
./tools/meta_post.sh ig_reply "Glad you enjoyed it!" 17890012345678901
```

### Output

- **Success:** prints the new post/media ID (e.g., `123456789012345_987654321`)
- **Failure:** prints error message to stderr and exits with code 1

## API Notes

- Uses Meta Graph API v21.0
- **Facebook rate limits:** ~200 posts/hour for Pages
- **Instagram rate limits:** 25 posts per 24-hour period
- **Instagram requires publicly accessible media URLs** — Meta's servers fetch the image/video directly. Host images on S3, a CDN, or any publicly reachable URL.
- **Instagram cannot do text-only posts** — always requires an image (`ig_photo`) or video (`ig_reel`)
- **Instagram two-step publish:** creates a media container first, then publishes it. For reels, the script polls up to 60 seconds for video processing to complete.
- Auth uses a Page Access Token (Bearer-style via form data) — no OAuth signing needed
