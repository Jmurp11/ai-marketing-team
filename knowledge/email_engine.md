# Email Engine – RinkLink

## Purpose

The Email Engine drives **demo bookings and paid subscriptions** through a high-frequency email strategy targeting youth hockey organizations and tournament directors.

Emails focus on **real operational pain points** experienced by organizations, especially around scheduling, volunteer burnout, and competitive balance.

Primary conversion goals:

• Book demo  
• Visit landing page  
• View pricing  
• Watch demo video  

---

# Target Email Segments

### 1. Youth Hockey Organization Directors
Primary buyers and decision makers.

Pain points:
- Volunteer burnout
- Difficult season scheduling
- Poor competitive balance
- Too many emails coordinating games

---

### 2. Team Managers

Pain points:
- Finding opponents
- Scheduling conflicts
- Communication overload
- Coordinating ice time

---

### 3. Tournament Directors

Secondary market.

Opportunities:
- List tournaments on RinkLink for free
- Pay to feature tournaments

---

### 4. Discovered Leads (Cold)

Sources:
- MyHockeyRankings league directories
- Hockey association websites
- Facebook scheduling groups
- Tournament calendars
- Twitter/X conversations

---

# Email Cadence

Target: **7 emails per week**

Distribution mix:

Monday — Pain-point story  
Tuesday — Product feature  
Wednesday — Case study  
Thursday — Educational tip  
Friday — Direct conversion  
Saturday — Blog or guide promotion  
Sunday — Scheduling insight / industry observation

---

# Email Format

Emails should be:

• Short to medium length  
• Conversational founder voice  
• Direct and tactical  
• Focused on operational problems

Typical length:

Short: 100–200 words  
Medium: 200–400 words

---

# Personalization

Emails should include:

• Organization name  
• League name  

Example:

"Many organizations in the **{league_name} league** struggle with scheduling..."

---

# Core Pain Points to Emphasize

### Volunteer Burnout

Team managers spend hours coordinating games.

---

### Poor Competitive Balance

Games scheduled too high or too low skill level cause:

• Player attrition  
• Frustration  
• Poor development

---

### Scheduling Chaos

Organizations rely on:

• Email threads  
• Facebook scheduling groups  
• Spreadsheet tracking

This creates operational overhead.

---

# Call to Action

Primary CTAs:

• Book a demo  
• Visit landing page  
• View pricing  
• Watch demo video

---

# Cold Lead Nurture Sequence

When a lead is discovered they enter a **7-email nurture sequence**.

Day 1 — Scheduling chaos story  
Day 2 — Blog article  
Day 3 — Product feature  
Day 4 — Case study  
Day 5 — Scheduling tip  
Day 6 — Volunteer burnout story  
Day 7 — Demo invitation

---

# Follow-up Strategy

If a recipient does not respond:

Follow-up cadence:

Day 3 follow-up  
Day 7 follow-up  
Day 14 final follow-up

Follow-ups should be short and conversational.

Example:

"Just wanted to bump this in case scheduling is becoming a headache this season."

---

# Compliance

All emails must include:

• CAN-SPAM compliant unsubscribe  
• Sender identification  
• Respect unsubscribe requests immediately

---

# Email Performance Metrics

Track:

• Open rate  
• Demo bookings  
• Paid conversions  

Secondary metrics:

• CTR  
• Replies

---

# Integration

Email performance data should be shared with:

• Growth Experiment Agent  
• Content Agent  
• Lead Discovery Agent  

This enables continuous optimization of messaging and targeting.

---

# Email Infrastructure

## SMTP Configuration

Emails are sent via Protonmail SMTP:
- Host: `smtp.protonmail.ch`
- Port: 587
- Secure: false (STARTTLS)
- Sender: `jim@rinklink.ai`

## Sending Tool

Use `tools/email_send.sh` to send emails. The tool:
1. Renders template variables (`{{name}}`, `{{email}}`, `{{organization_name}}`, `{{association}}`)
2. Wraps content in the branded RinkLink HTML template
3. Sends via SMTP
4. Logs the send to the Supabase `emails` table

## Brand Template

All emails use the unified RinkLink template:
- **Header:** Dark blue (#0c4066) bar with "RinkLink.ai" logo text
- **Body:** White card with Space Grotesk font, 16px, 1.6 line height
- **Buttons:** Orange (#f0622b) primary CTAs, outline variant available
- **Footer:** Copyright text in gray
- **Responsive:** Mobile-optimized with 600px max-width

## Cold vs Branded Emails

Cold outreach and first-contact emails to unknown recipients **must** use the `--cold` flag. This sends plain text only — no HTML template, no branding — which avoids spam filters that flag heavy HTML from unknown senders.

The branded HTML template (header bar, styled container, web fonts) should only be used for:
- Newsletters to opted-in contacts
- Nurture sequences to known leads
- Campaign emails to existing subscribers

## Rate Limits

- 1 second delay between individual sends
- Batch size: 50 emails per batch
- Daily limit: 500 emails

## Template Variables

Available in subject and body:
- `{{name}}` — recipient name (defaults to "there")
- `{{email}}` — recipient email address
- `{{organization_name}}` — their organization
- `{{association}}` — their association/league