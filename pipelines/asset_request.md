# Pipeline: Visual Asset Request

Agents request visual assets from the founder via `#creative-requests`. The founder creates the visuals and replies with a public URL.

## Trigger

- **Manual:** Any agent needing a visual asset for a post, ad, blog, or email

## Flow

### Step 1: Agent Creates Creative Brief

The requesting agent drafts:
- **Creative brief:** What the visual should convey (tone, subject, brand alignment)
- **Image prompt:** Detailed description for image creation (style, subjects, colors, composition)
- **Dimensions:** Platform-specific size requirements
- **Deadline:** When the asset is needed

### Step 2: Agent Posts to `#creative-requests`

Post the request using the `asset_request.json` template:

```bash
./tools/slack_post.sh social "#creative-requests" "Asset request for Instagram" \
  slack/templates/asset_request.json \
  '{"agent_name":"Alex (Social)","platform":"Instagram","campaign":"Spring Registration Push","urgency":"High - needed by EOD","creative_brief":"Excited kids at a rink with RinkLink branding","image_prompt":"Photo-realistic youth hockey players celebrating on ice, bright arena lighting, RinkLink logo visible on boards, energetic and positive mood, shot from ice level","dimensions":"1080x1080 (Instagram square)","format":"JPG","deadline":"2026-03-14 by 5:00 PM EST"}'
```

Note the `ts` value from the output — this is the thread ID for checking replies.

### Step 3: Founder Creates Visual

The founder sees the request in `#creative-requests`, creates the visual using the image prompt as guidance, and hosts it at a publicly accessible URL.

### Step 4: Founder Replies with URL

The founder replies in the thread with the public URL of the completed asset.

### Step 5: Agent Reads Thread for URL

The agent checks the thread for the founder's reply:

```bash
./tools/slack_read.sh replies "#creative-requests" "1710345678.123456"
```

Parse the response for a URL in the reply text.

### Step 6: Agent Uses Asset

The agent includes the URL in their post:

```bash
# Meta post with image
./tools/meta_post.sh post "Check out our spring registration!" "https://example.com/asset.jpg"

# X post (attach image separately)
./tools/x_post.sh post "Spring registration is open! 🏒"
```

## Platform Dimensions Reference

| Platform | Format | Dimensions |
|----------|--------|------------|
| Instagram | Square post | 1080x1080 |
| Instagram | Story/Reel | 1080x1920 |
| Facebook | Link share | 1200x630 |
| X (Twitter) | In-stream | 1600x900 |
| Blog | Header image | 1200x630 |
| Email | Banner | 600x200 |
| Meta Ads | Square | 1080x1080 |
| Meta Ads | Landscape | 1200x628 |

## Success Criteria

- Asset request posted to `#creative-requests` with all required fields
- Founder replies in thread with publicly accessible URL
- Agent successfully retrieves URL via `slack_read.sh`
- Asset used in final post/ad/content
