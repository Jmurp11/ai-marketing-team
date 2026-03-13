#!/usr/bin/env node
/**
 * RinkLink Lead Insert
 *
 * Inserts a single validated lead into the Supabase leads table.
 * Designed to be called by Claude Code after evaluating scraper output.
 *
 * Usage:
 *   node lead_insert.js --email <email> [options]
 *
 * Options:
 *   --email              Contact email (required)
 *   --name               Contact name
 *   --role               Contact role (e.g., President, Director)
 *   --association         Association name
 *   --organization-name  Organization name
 *   --organization-url   Organization website URL
 *   --source-url         Page where contact was found
 */

const { createClient } = require('@supabase/supabase-js');

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

async function main() {
  const args = parseArgs();

  if (!args.email) {
    console.error(JSON.stringify({ success: false, error: 'Missing --email' }));
    process.exit(1);
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error(JSON.stringify({ success: false, error: 'SUPABASE_URL and SUPABASE_KEY must be set' }));
    process.exit(1);
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const email = args.email.toLowerCase();

  // Check for existing lead
  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    console.log(JSON.stringify({ success: true, action: 'skipped', reason: 'already exists', id: existing.id, email }));
    return;
  }

  const { data, error } = await supabase.from('leads').insert({
    email,
    name: args.name || null,
    role: args.role || null,
    association: args.association || null,
    organization_name: args['organization-name'] || null,
    organization_url: args['organization-url'] || null,
    source_url: args['source-url'] || null,
  }).select().single();

  if (error) {
    console.error(JSON.stringify({ success: false, error: error.message, email }));
    process.exit(1);
  }

  console.log(JSON.stringify({ success: true, action: 'inserted', id: data.id, email }));
}

main();
