#!/usr/bin/env node
/**
 * RinkLink Google Analytics 4 Report Tool
 *
 * Fetches analytics data from GA4 using the Data API.
 *
 * Usage:
 *   node ga_report.js --metric <metric> [options]
 *
 * Options:
 *   --metric     GA4 metric(s), comma-separated (required)
 *   --dimension  GA4 dimension(s) to group by, comma-separated
 *   --days       Lookback period in days (default: 7)
 *   --limit      Max rows returned (default: 20)
 *   --order-by   Sort by this metric descending (default: first metric)
 */

const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const path = require('path');

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

// --- Format date as YYYY-MM-DD ---
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function main() {
  const args = parseArgs();

  if (!args.metric) {
    console.error(JSON.stringify({ success: false, error: 'Missing --metric flag. Example: --metric sessions,totalUsers' }));
    process.exit(1);
  }

  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
  if (!propertyId) {
    console.error(JSON.stringify({ success: false, error: 'GOOGLE_ANALYTICS_PROPERTY_ID not set in .env' }));
    process.exit(1);
  }

  const keyFilePath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!keyFilePath) {
    console.error(JSON.stringify({ success: false, error: 'GOOGLE_SERVICE_ACCOUNT_JSON not set in .env' }));
    process.exit(1);
  }

  // Resolve key file path relative to project root
  const resolvedKeyPath = path.isAbsolute(keyFilePath)
    ? keyFilePath
    : path.resolve(process.cwd(), keyFilePath);

  const days = parseInt(args.days || '7', 10);
  const limit = parseInt(args.limit || '20', 10);
  const metrics = args.metric.split(',').map(m => m.trim());
  const dimensions = args.dimension ? args.dimension.split(',').map(d => d.trim()) : [];
  const orderByMetric = args['order-by'] || metrics[0];

  // Date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Initialize client with service account credentials
  const client = new BetaAnalyticsDataClient({
    keyFilename: resolvedKeyPath,
  });

  // Build report request
  const request = {
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(endDate) }],
    metrics: metrics.map(name => ({ name })),
    limit,
    orderBys: [{ metric: { metricName: orderByMetric }, desc: true }],
  };

  if (dimensions.length > 0) {
    request.dimensions = dimensions.map(name => ({ name }));
  }

  try {
    const [response] = await client.runReport(request);

    // Build rows
    const rows = (response.rows || []).map(row => {
      const obj = {};
      if (row.dimensionValues) {
        row.dimensionValues.forEach((val, i) => {
          obj[dimensions[i]] = val.value;
        });
      }
      row.metricValues.forEach((val, i) => {
        const num = parseFloat(val.value);
        obj[metrics[i]] = Number.isInteger(num) ? parseInt(val.value, 10) : Math.round(num * 100) / 100;
      });
      return obj;
    });

    // Build totals from response totals row
    const totals = {};
    if (response.totals && response.totals.length > 0) {
      response.totals[0].metricValues.forEach((val, i) => {
        const num = parseFloat(val.value);
        totals[metrics[i]] = Number.isInteger(num) ? parseInt(val.value, 10) : Math.round(num * 100) / 100;
      });
    }

    console.log(JSON.stringify({
      success: true,
      property: propertyId,
      dateRange: `${formatDate(startDate)} to ${formatDate(endDate)}`,
      rows,
      totals,
      rowCount: rows.length,
    }));
  } catch (err) {
    console.error(JSON.stringify({
      success: false,
      error: err.message,
    }));
    process.exit(1);
  }
}

main();
