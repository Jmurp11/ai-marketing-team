#!/usr/bin/env node
/**
 * RinkLink Email Sender
 *
 * Sends branded emails via Protonmail SMTP and logs to Supabase.
 *
 * Usage:
 *   node email_send.js --to <email> --subject <subject> --body <body> [options]
 *
 * Options:
 *   --to            Recipient email (required)
 *   --subject       Email subject (required)
 *   --body          Email body — HTML or plain text (required)
 *   --name          Recipient name (for template vars)
 *   --organization  Organization name (for template vars)
 *   --association   Association name (for template vars)
 *   --preheader     Preheader text for email preview
 *   --test          Send to TEST_EMAIL instead of --to
 *   --cold          Send as plain text only (no branded HTML template)
 */

const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const { buildEmailHtml, buildEmailText, normalizeBodyFont } = require('./email_template');

// --- Parse CLI args ---
function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
        args[key] = argv[++i];
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

// --- Render template variables ---
function renderTemplate(template, vars) {
  return template
    .replace(/\{\{name\}\}/g, vars.name || 'there')
    .replace(/\{\{email\}\}/g, vars.email || '')
    .replace(/\{\{organization_name\}\}/g, vars.organization || '')
    .replace(/\{\{association\}\}/g, vars.association || '');
}

async function main() {
  const args = parseArgs();

  // Resolve recipient
  const to = args.test ? process.env.TEST_EMAIL : args.to;
  if (!to) {
    console.error(JSON.stringify({ success: false, error: 'Missing --to or --test flag' }));
    process.exit(1);
  }
  if (!args.subject || !args.body) {
    console.error(JSON.stringify({ success: false, error: 'Missing --subject or --body' }));
    process.exit(1);
  }

  // Template variables
  const vars = {
    name: args.name || '',
    email: to,
    organization: args.organization || '',
    association: args.association || '',
  };

  // Render subject and body
  const renderedSubject = renderTemplate(args.subject, vars);
  const renderedBody = renderTemplate(args.body, vars);

  // Build email content based on mode
  const isCold = !!args.cold;
  const plainText = renderedBody.replace(/<[^>]*>/g, '');

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: renderedSubject,
    text: isCold ? plainText : buildEmailText({ subject: renderedSubject, body: plainText }),
  };

  if (!isCold) {
    mailOptions.html = buildEmailHtml({
      subject: renderedSubject,
      body: normalizeBodyFont(renderedBody),
      preheader: args.preheader || '',
    });
  }

  // Create SMTP transport
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Log to Supabase if configured
    let dbRecord = null;
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      const { data, error } = await supabase.from('emails').insert({
        to_email: to,
        subject: renderedSubject,
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: {
          type: isCold ? 'cold' : 'branded',
          name: vars.name,
          organization: vars.organization,
          association: vars.association,
          message_id: info.messageId,
        },
      }).select().single();

      if (error) {
        console.error(`Supabase log warning: ${error.message}`);
      } else {
        dbRecord = data;
      }
    }

    console.log(JSON.stringify({
      success: true,
      to,
      subject: renderedSubject,
      messageId: info.messageId,
      dbId: dbRecord?.id || null,
    }));
  } catch (err) {
    console.error(JSON.stringify({
      success: false,
      error: err.message,
      to,
      subject: renderedSubject,
    }));
    process.exit(1);
  }
}

main();
