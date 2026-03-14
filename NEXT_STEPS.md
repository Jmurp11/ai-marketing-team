# Next Steps — RinkLink Ads & Creative Pipeline

Living checklist for pending setup tasks. Check off items as they're completed.

---

## 1. Google Ads API Access (Pending)

**Status:** Applied for developer token — expect approval by ~2026-03-18 (3 business days from 2026-03-13).

Once approved:

- [ ] Populate `.env` with Google Ads credentials:
  - `GOOGLE_ADS_DEVELOPER_TOKEN`
  - `GOOGLE_ADS_CLIENT_ID`
  - `GOOGLE_ADS_CLIENT_SECRET`
  - `GOOGLE_ADS_REFRESH_TOKEN`
  - `GOOGLE_ADS_CUSTOMER_ID`
  - `GOOGLE_ADS_LOGIN_CUSTOMER_ID`
- [ ] Test with `tools/google_ads.sh list-campaigns`
- [ ] Enable first campaign via the ads agent

---

## 2. Meta Ads API Setup (TODO)

Currently only organic Meta posting works (`tools/meta_post.sh`). These steps enable programmatic paid campaign management on Facebook/Instagram.

### Account & App Setup

- [ ] **Create a Meta Business Account** at business.facebook.com (if not already done)
- [ ] **Create a Meta App** at developers.facebook.com → My Apps → Create App → Business type
- [ ] **Add "Marketing API" product** to the app (this is the Meta Ads API)
- [ ] **Get Ad Account ID** from Meta Business Suite → Settings → Ad Account → copy the `act_XXXXXXXXX` ID
- [ ] **Generate a System User Access Token** (long-lived, no expiry):
  - Business Settings → System Users → Add → Admin role
  - Assign assets: Ad Account, Page, Instagram Account
  - Generate token with scopes: `ads_management`, `ads_read`, `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`, `business_management`
- [ ] **Request Advanced Access** for `ads_management` (required for production ad creation — Standard Access only works on test ad accounts)
- [ ] **Submit App Review** if needed for advanced permissions
- [ ] **Link Instagram Business Account** to Facebook Page (if not done) via Facebook Page Settings → Instagram

### Environment Variables

- [ ] Populate `.env` with:
  - `META_APP_ID` (already exists)
  - `META_APP_SECRET` (already exists)
  - `META_ACCESS_TOKEN` — replace with system user token (already exists, may need update)
  - `META_PAGE_ID` (already exists)
  - `META_IG_USER_ID` (already exists)
  - `META_AD_ACCOUNT_ID` (already exists)

### Testing

- [ ] Test organic: `tools/meta_post.sh fb_post "Test post"`
- [ ] Test ads tool once built (see below)

### Build `tools/meta_ads.js`

Follow the same pattern as `tools/google_ads.js`. Capabilities to implement:

- Campaign creation (awareness, traffic, conversions objectives)
- Ad set creation (audience targeting, budget, schedule, placements)
- Ad creative creation (image, carousel, video)
- Campaign / ad set / ad pause & enable
- Performance reporting (impressions, reach, CPC, CPA, conversions)
- Uses Meta Marketing API v21.0 endpoints

---

## 3. Gemini Imagen 3 Integration (TODO)

Enable agents to generate their own visual assets instead of relying on `#creative-requests`.

### API Setup

- [ ] **Enable Gemini API** in Google Cloud project `947742882624`
- [ ] **Generate an API key** via Cloud Console → Credentials → Create API Key (or use existing service account with Vertex AI)
- [ ] **Add `GOOGLE_GEMINI_API_KEY`** to `.env`

### Build `tools/generate_image.js`

- [ ] Create tool accepting:
  - `--prompt` — image description
  - `--dimensions` — output size (1080x1080, 1200x628, etc.)
  - `--style` — optional style modifier
- [ ] Call Gemini Imagen 3 API to generate image
- [ ] Save output to `assets/generated/` with timestamp filename
- [ ] Return local file path + upload to a public URL (e.g., GitHub raw or simple hosting) so Meta/X APIs can fetch it

### Agent Updates

- [ ] **Update agent system prompts** — Social, Content, and Ads agents gain ability to generate images directly instead of posting to `#creative-requests`
- [ ] **Update `knowledge/content_policy.md`** with AI-generated image rules

### Guardrails

- [ ] All generated images for ads go through `#content-review` approval
- [ ] No images depicting minors (add to prompt guardrails)
- [ ] Must include RinkLink branding requirements in generation prompts
- [ ] Social posts can use generated images autonomously (lower risk)

---

## 4. Future Enhancements

- [ ] YouTube Ads (once video assets are ready)
- [ ] TikTok Ads integration
- [ ] Automated A/B testing of AI-generated creatives
- [ ] Dynamic ad creative generation based on performance data
