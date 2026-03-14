# RinkLink Ads Playbook

## Purpose

This document instructs agents on how to **run paid social campaigns** for RinkLink.

Objectives:

- Drive traffic to the homepage  
- Convert youth hockey organization leaders to **paid subscriptions** ($75 per seat)  
- Grow awareness among **volunteer managers**  
- Test ad creatives and messaging for maximum ROI

---

# Platforms

Primary ad platforms:

1. Meta (Facebook & Instagram)
2. Twitter/X
3. **Google Ads (Search & Performance Max)**

Agents may use TikTok or YouTube later if performance is strong.

---

# Campaign Structure

## Campaign Types

1. **Conversion Campaigns** – Goal: paid subscriptions  
   - Audience: hockey directors, association presidents  
   - Conversion pixel: track homepage visits and paid clicks

2. **Traffic / Awareness Campaigns** – Goal: build awareness  
   - Audience: team managers, volunteers  
   - Goal: introduce RinkLink benefits

---

# Target Audiences

**Primary Buyers:**

- Hockey directors  
- Association presidents  
- Board members

**Primary Users:**

- Team managers (volunteers)  
- Coaches

**Secondary:**

- Tournament operators (promote tournament listings)  

**Demographics & Interests (Meta targeting):**

- Youth hockey  
- Hockey leagues  
- Hockey organizations  
- Volunteer parents in youth sports  
- Hockey coaches and managers

**Twitter/X targeting:**

- Follow accounts of youth hockey associations, influencers, and hockey news accounts
- Target users interacting with hockey content

**Google Ads targeting:**

- **Search:** High-intent keywords — people actively searching for hockey scheduling solutions
- **Performance Max:** Google's AI optimizes across Search, Display, YouTube, Discover, Gmail
- **Geographic:** US only
- **Demographics:** Adults 25–55, interests in youth sports / hockey
- **Negative keywords:** Block irrelevant searches (NHL, professional hockey, hockey equipment, hockey cards, etc.)

---

# Google Ads Strategy

## Search Campaigns

**Purpose:** Capture high-intent traffic — people actively looking for scheduling solutions.

**Keyword Groups:**

| Group | Keywords | Match Type |
|-------|----------|------------|
| Core Product | youth hockey scheduling, hockey schedule maker, hockey scheduling software | Phrase |
| Pain Point | youth hockey management, manage hockey team, hockey team organizer | Phrase |
| Competitor/Alt | myhockeyrankings, hockey rankings, hockey league management | Phrase |
| Feature-Specific | hockey opponent finder, balanced hockey schedule, hockey season planner | Phrase |

**Negative Keywords (exclude):**
- NHL, professional hockey, hockey equipment, hockey sticks, hockey cards
- hockey games (video game), fantasy hockey, hockey betting
- free (initially — test later), jobs, careers

**Responsive Search Ads — Headline Examples:**
1. "Youth Hockey Scheduling Made Easy"
2. "Save Hours on Game Scheduling"
3. "RinkLink - Built for Hockey Teams"
4. "Find Opponents & Build Schedules"
5. "Your Volunteer Managers Will Thank You"
6. "Balanced Schedules, Better Seasons"

**Responsive Search Ads — Description Examples:**
1. "Build balanced schedules, find opponents, prevent conflicts. Sign up today at RinkLink.ai"
2. "The scheduling tool volunteer managers actually love. Try RinkLink — $75/seat."
3. "Stop wasting hours on spreadsheets. RinkLink automates your hockey scheduling."

**Ad Extensions:**
- Sitelinks: Pricing, Features, About, Contact
- Callouts: "Built for Youth Hockey", "Easy Setup", "Find Opponents Fast"
- Structured snippets: Features — Scheduling, Opponent Finder, Conflict Prevention

## Performance Max Campaigns

**Purpose:** Let Google's AI find conversions across all Google properties.

**Assets Required:**
- Headlines (5+): Same as search ads
- Long headlines (1+): "The Scheduling Platform Youth Hockey Organizations Trust"
- Descriptions (5+): Same as search ads
- Images: Square (1200x1200) + Landscape (1200x628) — use existing campaign assets
- Logo: RinkLink logo
- Final URL: https://rinklink.ai with UTM params

**Audience Signals (guide Google's AI):**
- Custom segments: people who searched for hockey scheduling, youth sports management
- Interests: Youth sports, hockey, coaching, team management
- Demographics: US, 25–55

## Google Ads Budget

| Item | Value |
|------|-------|
| Monthly budget | $100 |
| Daily budget | $3.30 |
| Target CPA | $25–$37 |
| Bidding strategy | Enhanced CPC (Search) / Maximize Conversions (PMax) |
| Min test duration | 7 days per ad variant |
| Auto-pause threshold | 7 days, zero conversions |

## Google Ads Conversion Tracking

Conversions tracked via GA4 integration:
1. Link Google Ads account to GA4 property
2. Import GA4 conversion events into Google Ads
3. UTM parameters on all ad URLs: `utm_source=google&utm_medium=cpc&utm_campaign=<name>`
4. Jordan cross-references Google Ads cost data with GA4 signup conversions weekly

## Google Ads Weekly Optimization

1. Pull `tools/google_ads.sh report --days 7` for spend/click data
2. Pull `tools/ga_report.sh --metric conversions --dimension sessionSource,sessionCampaignName --days 7` for actual signups
3. Calculate true CPA = Google Ads spend / GA4 conversions from google/cpc
4. Pause keywords with spend > $20 and zero conversions
5. Increase bids on keywords with CPA < $25
6. Add new negative keywords based on search terms report
7. Test 1 new ad copy variant per week
8. Report cross-platform comparison to `#ads-updates`

---

# Messaging & Ad Angles

Ad messaging should emphasize:

1. **Volunteer Relief** – "Make life easier for your volunteer managers"  
2. **Better Seasons** – "Build balanced schedules and prevent bad seasons"  
3. **Time Savings** – "Save hours coordinating games every week"  
4. **Direct Conversion** – "$75 per seat, give your teams the tools to succeed"  

Hooks for ad copy:

- “Most youth hockey teams make this scheduling mistake”  
- “The hardest job in youth hockey is team manager”  
- “Why youth hockey seasons fall apart”

---

# Creative Guidelines

**Ad formats:**

- Single image  
- Carousel  
- Short videos (15–30 sec) demonstrating opponent finder or scheduling features  
- Meta Stories for short visual hooks  

**Creative rules:**

- Clear headline and benefit-focused copy  
- Include **RinkLink branding**  
- Strong call-to-action (CTA): "Start today" / "Schedule better seasons" / "Sign up now"  

**Visual assets:** Provided separately to agents (screenshots, demo clips, hockey graphics, diagrams)

---

# Budget & Bidding

- Monthly budget: $100–$1000 per platform
- Google Ads: $100/month ($3.30/day), target CPA $25–$37
- Bidding: optimize for **paid conversions**
- Start with **small A/B tests** per ad creative & audience segment
- Scale winning ads gradually

---

# Testing & Optimization

**A/B Testing Variables:**

- Headlines / hooks  
- Body copy / messaging angles  
- Images vs. videos  
- CTA wording  
- Audience targeting  
- Placements (Feed, Stories, Reels, X Promoted Tweet, Google Search, PMax)  

**Testing rules:**

- Run each test for minimum 3–5 days  
- Test one variable at a time per ad set  
- Pause underperforming ads early  
- Scale winners aggressively

---

# Ad Reporting Metrics

Agents should track and report:

- Impressions  
- Click-through rate (CTR)  
- Cost per click (CPC)  
- Conversion rate (signups / paid seats)  
- Cost per acquisition (CPA)  

Daily automated reports should flag:

- Underperforming ad sets  
- Winning creatives to scale

---

# Ad Copy Rules for Agents

1. Always use **founder voice**  
2. Emphasize **volunteer relief, better seasons, and time saved**  
3. Avoid generic tech jargon  
4. Include **clear CTA**  
5. Direct traffic to **homepage**  
6. Rotate hooks and angles to prevent ad fatigue

---

# Weekly Optimization Loop

1. Review ad performance metrics  
2. Pause or adjust low-performing ads  
3. Scale high-performing ads  
4. Test new hooks and creatives  
5. Update audience segments if necessary  

Agents should repeat this cycle **weekly**.

---

# Example Campaign Flow

1. **Target Audience:** Hockey directors, youth hockey associations  
2. **Ad Hook:** “Most youth hockey teams make this scheduling mistake”  
3. **Visual:** Demo of opponent finder  
4. **Copy:** "RinkLink helps your managers find opponents, prevent conflicts, and save hours per week. Sign up now."  
5. **CTA:** "Start building better seasons today"  
6. **Destination:** Homepage  

---

# Principles for Ads Agents

1. Focus on **paid conversions** first  
2. Always highlight **real-world outcomes**  
3. Keep founder voice consistent  
4. Test constantly, scale winners, pause losers  
5. Keep messaging **volunteer-centered**  
6. Do not target irrelevant sports or audiences