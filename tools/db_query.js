#!/usr/bin/env node
/**
 * RinkLink DB Query — Read-only queries against Supabase tables.
 *
 * Usage:
 *   node db_query.js --table <table> [options]
 *
 * Options:
 *   --table    Table name (required): leads, emails, social_posts, campaigns, experiments, agent_decisions
 *   --eq       Filter: column:value (repeatable)
 *   --gte      Filter: column:value (repeatable)
 *   --lte      Filter: column:value (repeatable)
 *   --order    Order: column:asc|desc (default: created_at:desc)
 *   --limit    Max rows (default: 50)
 *   --count    Return count only (no rows)
 *   --select   Columns to select (comma-separated, default: *)
 */

const { createClient } = require('@supabase/supabase-js');

const ALLOWED_TABLES = ['leads', 'emails', 'social_posts', 'campaigns', 'experiments', 'agent_decisions'];

function parseArgs() {
  const args = { eq: [], gte: [], lte: [] };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      if (key === 'eq' || key === 'gte' || key === 'lte') {
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

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error(JSON.stringify({ success: false, error: 'SUPABASE_URL and SUPABASE_KEY must be set' }));
    process.exit(1);
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  const selectCols = args.select || '*';
  let query;

  if (args.count === true) {
    query = supabase.from(args.table).select(selectCols, { count: 'exact', head: true });
  } else {
    query = supabase.from(args.table).select(selectCols);
  }

  // Apply equality filters
  for (const filter of args.eq) {
    const idx = filter.indexOf(':');
    if (idx === -1) {
      console.error(JSON.stringify({ success: false, error: `Invalid --eq format: '${filter}'. Use column:value` }));
      process.exit(1);
    }
    query = query.eq(filter.slice(0, idx), filter.slice(idx + 1));
  }

  // Apply gte filters
  for (const filter of args.gte) {
    const idx = filter.indexOf(':');
    if (idx === -1) {
      console.error(JSON.stringify({ success: false, error: `Invalid --gte format: '${filter}'. Use column:value` }));
      process.exit(1);
    }
    query = query.gte(filter.slice(0, idx), filter.slice(idx + 1));
  }

  // Apply lte filters
  for (const filter of args.lte) {
    const idx = filter.indexOf(':');
    if (idx === -1) {
      console.error(JSON.stringify({ success: false, error: `Invalid --lte format: '${filter}'. Use column:value` }));
      process.exit(1);
    }
    query = query.lte(filter.slice(0, idx), filter.slice(idx + 1));
  }

  // Apply ordering
  if (args.order) {
    const idx = args.order.indexOf(':');
    const col = idx === -1 ? args.order : args.order.slice(0, idx);
    const dir = idx === -1 ? 'desc' : args.order.slice(idx + 1);
    query = query.order(col, { ascending: dir === 'asc' });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // Apply limit
  if (args.count !== true) {
    const limit = parseInt(args.limit) || 50;
    query = query.limit(limit);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error(JSON.stringify({ success: false, error: error.message }));
    process.exit(1);
  }

  if (args.count === true) {
    console.log(JSON.stringify({ success: true, table: args.table, count }));
  } else {
    console.log(JSON.stringify({ success: true, table: args.table, rowCount: data.length, rows: data }));
  }
}

main();
