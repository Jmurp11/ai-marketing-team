#!/usr/bin/env node
/**
 * RinkLink DB Insert — Insert rows into context tables.
 *
 * Usage:
 *   node db_insert.js --table <table> --data '<json>'
 *
 * Options:
 *   --table    Table name (required): social_posts, campaigns, experiments, agent_decisions
 *   --data     JSON object to insert (required)
 *
 * Note: leads and emails have dedicated tools with validation (lead_insert.sh, email_send.sh).
 */

const { createClient } = require('@supabase/supabase-js');

const ALLOWED_TABLES = ['social_posts', 'campaigns', 'experiments', 'agent_decisions'];

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

  if (!args.table) {
    console.error(JSON.stringify({ success: false, error: 'Missing --table' }));
    process.exit(1);
  }

  if (!ALLOWED_TABLES.includes(args.table)) {
    console.error(JSON.stringify({ success: false, error: `Table '${args.table}' not allowed. Allowed: ${ALLOWED_TABLES.join(', ')}. Use lead_insert.sh for leads and email_send.sh for emails.` }));
    process.exit(1);
  }

  if (!args.data) {
    console.error(JSON.stringify({ success: false, error: 'Missing --data. Provide a JSON object.' }));
    process.exit(1);
  }

  let row;
  try {
    row = JSON.parse(args.data);
  } catch (e) {
    console.error(JSON.stringify({ success: false, error: `Invalid JSON in --data: ${e.message}` }));
    process.exit(1);
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error(JSON.stringify({ success: false, error: 'SUPABASE_URL and SUPABASE_KEY must be set' }));
    process.exit(1);
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  const { data, error } = await supabase.from(args.table).insert(row).select().single();

  if (error) {
    console.error(JSON.stringify({ success: false, error: error.message, table: args.table }));
    process.exit(1);
  }

  console.log(JSON.stringify({ success: true, action: 'inserted', table: args.table, id: data.id }));
}

main();
