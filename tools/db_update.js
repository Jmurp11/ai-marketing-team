#!/usr/bin/env node
/**
 * RinkLink DB Update — Update existing rows in Supabase tables.
 *
 * Usage:
 *   node db_update.js --table <table> --eq <column:value> --set <column:value> [--set ...]
 *
 * Options:
 *   --table    Table name (required): leads, campaigns, experiments
 *   --eq       Row filter: column:value (required, repeatable)
 *   --set      Field to update: column:value (required, repeatable)
 */

const { createClient } = require('@supabase/supabase-js');

const ALLOWED_TABLES = ['leads', 'campaigns', 'experiments'];

// Restrict which columns can be updated per table
const ALLOWED_COLUMNS = {
  leads: ['nurture_status', 'nurture_step', 'last_email_at', 'name', 'role', 'association', 'organization_name', 'organization_url'],
  campaigns: ['status', 'metrics', 'notes', 'end_date', 'updated_at'],
  experiments: ['status', 'outcome', 'started_at', 'completed_at'],
};

function parseArgs() {
  const args = { eq: [], set: [] };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      if (key === 'eq' || key === 'set') {
        args[key].push(val);
      } else {
        args[key] = val;
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
    console.error(JSON.stringify({ success: false, error: `Table '${args.table}' not allowed. Allowed: ${ALLOWED_TABLES.join(', ')}` }));
    process.exit(1);
  }

  if (args.eq.length === 0) {
    console.error(JSON.stringify({ success: false, error: 'Missing --eq filter. At least one is required.' }));
    process.exit(1);
  }

  if (args.set.length === 0) {
    console.error(JSON.stringify({ success: false, error: 'Missing --set values. At least one is required.' }));
    process.exit(1);
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error(JSON.stringify({ success: false, error: 'SUPABASE_URL and SUPABASE_KEY must be set' }));
    process.exit(1);
  }

  // Build update object and validate columns
  const updates = {};
  const allowedCols = ALLOWED_COLUMNS[args.table];
  for (const s of args.set) {
    const idx = s.indexOf(':');
    if (idx === -1) {
      console.error(JSON.stringify({ success: false, error: `Invalid --set format: '${s}'. Use column:value` }));
      process.exit(1);
    }
    const col = s.slice(0, idx);
    const val = s.slice(idx + 1);
    if (!allowedCols.includes(col)) {
      console.error(JSON.stringify({ success: false, error: `Column '${col}' not allowed for table '${args.table}'. Allowed: ${allowedCols.join(', ')}` }));
      process.exit(1);
    }
    // Try to parse as JSON for JSONB columns, otherwise use string
    try {
      updates[col] = JSON.parse(val);
    } catch {
      updates[col] = val;
    }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  let query = supabase.from(args.table).update(updates);

  // Apply filters
  for (const filter of args.eq) {
    const idx = filter.indexOf(':');
    if (idx === -1) {
      console.error(JSON.stringify({ success: false, error: `Invalid --eq format: '${filter}'. Use column:value` }));
      process.exit(1);
    }
    query = query.eq(filter.slice(0, idx), filter.slice(idx + 1));
  }

  const { data, error } = await query.select();

  if (error) {
    console.error(JSON.stringify({ success: false, error: error.message, table: args.table }));
    process.exit(1);
  }

  console.log(JSON.stringify({ success: true, action: 'updated', table: args.table, rowsAffected: data.length, rows: data }));
}

main();
