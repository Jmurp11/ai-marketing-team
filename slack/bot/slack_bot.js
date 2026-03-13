#!/usr/bin/env node
// RinkLink Slack Bot — Routes Slack messages to Claude Code agents via CLI
// Uses Socket Mode (no public URL needed)

const { App } = require("@slack/bolt");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

// ── Config ──────────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const CONFIG = JSON.parse(
  fs.readFileSync(path.resolve(PROJECT_ROOT, "slack/config.json"), "utf-8")
);

// Channel name → agent key mapping (built from config)
const CHANNEL_TO_AGENT = {
  "rinklink-hq": "assistant", // general channel defaults to assistant
  "admin-log": "admin",
  "content-updates": "content",
  "email-updates": "email",
  "ads-updates": "ads",
  "social-updates": "social",
  experiments: "growth",
  leads: "leads",
};

// Agent key → system prompt file
function agentPromptPath(agentKey) {
  const filenames = {
    admin: "admin_agent.md",
    assistant: "assistant_agent.md",
    content: "content_agent.md",
    email: "email_agent.md",
    ads: "ads_agent.md",
    social: "social_agent.md",
    growth: "growth_experiment_agent.md",
    leads: "lead_discovery_agent.md",
  };
  return path.resolve(PROJECT_ROOT, "agents", filenames[agentKey]);
}

// ── Slack App ───────────────────────────────────────────────────────────────

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// Cache bot user ID so we can ignore our own messages
let botUserId = null;

// ── Message Handler ─────────────────────────────────────────────────────────

app.message(async ({ message, say, client }) => {
  // Ignore bot messages, edits, and threads (for now)
  if (message.subtype || message.bot_id) return;

  // Ignore our own messages
  if (!botUserId) {
    const auth = await client.auth.test();
    botUserId = auth.user_id;
  }
  if (message.user === botUserId) return;

  // Look up channel name
  let channelName;
  try {
    const info = await client.conversations.info({ channel: message.channel });
    channelName = info.channel.name;
  } catch {
    return; // can't resolve channel, skip
  }

  // Check for @mention override — if user @mentions a specific agent pattern
  // e.g. "@ riley" or "@ admin" in any channel
  let agentKey = resolveAgentFromMention(message.text);

  // Fall back to channel-based routing
  if (!agentKey) {
    agentKey = CHANNEL_TO_AGENT[channelName];
  }

  if (!agentKey) return; // not a mapped channel

  const agentConfig = CONFIG.agents[agentKey];
  const promptFile = agentPromptPath(agentKey);

  if (!fs.existsSync(promptFile)) {
    console.error(`Agent prompt file not found: ${promptFile}`);
    return;
  }

  const systemPrompt = fs.readFileSync(promptFile, "utf-8");

  console.log(
    `[${new Date().toISOString()}] #${channelName} → ${agentConfig.display_name}: "${message.text.slice(0, 80)}..."`
  );

  // Show typing indicator
  const thinking = await say({
    text: `_${agentConfig.display_name} is thinking..._`,
    username: agentConfig.display_name,
    icon_url: agentConfig.icon_url,
  });

  try {
    const response = await callClaude(systemPrompt, message.text, agentKey);

    // Delete thinking message and post real response
    try {
      await client.chat.delete({
        channel: message.channel,
        ts: thinking.ts,
      });
    } catch {
      // OK if delete fails (permissions), response still posts
    }

    // Split long responses (Slack limit is 4000 chars per message)
    const chunks = splitMessage(response, 3900);
    for (const chunk of chunks) {
      await say({
        text: chunk,
        username: agentConfig.display_name,
        icon_url: agentConfig.icon_url,
      });
    }
  } catch (err) {
    console.error(`Error calling Claude for ${agentKey}:`, err.message);

    try {
      await client.chat.delete({
        channel: message.channel,
        ts: thinking.ts,
      });
    } catch {
      // ignore
    }

    await say({
      text: `_Error: ${err.message}_`,
      username: agentConfig.display_name,
      icon_url: agentConfig.icon_url,
    });
  }
});

// ── Claude CLI ──────────────────────────────────────────────────────────────

// Per-agent tool allowlists — only these Bash commands are permitted
const AGENT_ALLOWED_TOOLS = {
  admin: [
    "Bash(tools/github_board.sh:*)",
    "Bash(tools/ga_report.sh:*)",
    "Bash(tools/slack_post.sh:*)",
    "Bash(tools/slack_read.sh:*)",
  ],
  assistant: [
    "Bash(tools/ga_report.sh:*)",
    "Bash(tools/slack_post.sh:*)",
    "Bash(tools/slack_read.sh:*)",
  ],
  content: [
    "Bash(tools/ga_report.sh:*)",
    "Bash(tools/slack_post.sh:*)",
    "Bash(tools/slack_read.sh:*)",
  ],
  email: [
    "Bash(tools/email_send.sh:*)",
    "Bash(tools/ga_report.sh:*)",
    "Bash(tools/slack_post.sh:*)",
    "Bash(tools/slack_read.sh:*)",
  ],
  ads: [
    "Bash(tools/ga_report.sh:*)",
    "Bash(tools/slack_post.sh:*)",
    "Bash(tools/slack_read.sh:*)",
  ],
  social: [
    "Bash(tools/x_post.sh:*)",
    "Bash(tools/meta_post.sh:*)",
    "Bash(tools/ga_report.sh:*)",
    "Bash(tools/slack_post.sh:*)",
    "Bash(tools/slack_read.sh:*)",
  ],
  growth: [
    "Bash(tools/ga_report.sh:*)",
    "Bash(tools/slack_post.sh:*)",
    "Bash(tools/slack_read.sh:*)",
  ],
  leads: [
    "Bash(tools/scrape_leads.sh:*)",
    "Bash(tools/lead_insert.sh:*)",
    "Bash(tools/ga_report.sh:*)",
    "Bash(tools/slack_post.sh:*)",
    "Bash(tools/slack_read.sh:*)",
  ],
};

function callClaude(systemPrompt, userMessage, agentKey) {
  return new Promise((resolve, reject) => {
    const allowedTools = AGENT_ALLOWED_TOOLS[agentKey] || [];

    const args = [
      "--output-format",
      "text",
      "--system-prompt",
      systemPrompt,
      "--no-session-persistence",
    ];

    for (const tool of allowedTools) {
      args.push("--allowedTools", tool);
    }

    args.push("-p", userMessage);

    execFile("claude", args, { cwd: PROJECT_ROOT, timeout: 300_000 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
        return;
      }
      const response = stdout.trim();
      if (!response) {
        reject(new Error("Empty response from Claude"));
        return;
      }
      resolve(response);
    });
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function resolveAgentFromMention(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  // Match patterns like "@ riley", "@riley", "hey riley", etc.
  const nameToKey = {
    riley: "admin",
    casey: "assistant",
    morgan: "content",
    drew: "email",
    jordan: "ads",
    alex: "social",
    sam: "growth",
    taylor: "leads",
  };

  for (const [name, key] of Object.entries(nameToKey)) {
    if (lower.includes(`@${name}`) || lower.includes(`@ ${name}`)) {
      return key;
    }
  }
  return null;
}

function splitMessage(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Try to split at a newline
    let splitAt = remaining.lastIndexOf("\n", maxLen);
    if (splitAt < maxLen * 0.5) splitAt = maxLen; // no good newline, hard split
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
  return chunks;
}

// ── Start ───────────────────────────────────────────────────────────────────

(async () => {
  await app.start();
  console.log("⚡ RinkLink Slack Bot is running (Socket Mode)");
  console.log(`   Agents: ${Object.keys(CONFIG.agents).join(", ")}`);
  console.log(`   Channels: ${Object.keys(CHANNEL_TO_AGENT).map((c) => `#${c}`).join(", ")}`);
})();
