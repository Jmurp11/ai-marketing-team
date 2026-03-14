#!/usr/bin/env node
/**
 * RinkLink Google Ads Management Tool
 *
 * Manages Google Ads campaigns via the Google Ads API.
 * Uses OAuth2 refresh token flow for authentication.
 *
 * Required env vars:
 *   GOOGLE_ADS_DEVELOPER_TOKEN   — Developer token from Google Ads API Center
 *   GOOGLE_ADS_CLIENT_ID         — OAuth2 client ID
 *   GOOGLE_ADS_CLIENT_SECRET     — OAuth2 client secret
 *   GOOGLE_ADS_REFRESH_TOKEN     — OAuth2 refresh token
 *   GOOGLE_ADS_CUSTOMER_ID       — Google Ads customer ID (no dashes)
 *   GOOGLE_ADS_LOGIN_CUSTOMER_ID — Manager (MCC) account ID (optional, if using MCC)
 *
 * Usage:
 *   node google_ads.js <action> [options]
 */

const https = require('https');
const querystring = require('querystring');

// --- Constants ---
const API_VERSION = 'v17';
const BASE_URL = `https://googleads.googleapis.com/${API_VERSION}`;

// --- Parse CLI args ---
function parseArgs() {
  const argv = process.argv.slice(2);
  const action = argv[0];
  const args = {};
  for (let i = 1; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
        args[key] = argv[++i];
      } else {
        args[key] = true;
      }
    }
  }
  return { action, args };
}

// --- Validate required env vars ---
function validateEnv() {
  const required = [
    'GOOGLE_ADS_DEVELOPER_TOKEN',
    'GOOGLE_ADS_CLIENT_ID',
    'GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_REFRESH_TOKEN',
    'GOOGLE_ADS_CUSTOMER_ID',
  ];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(JSON.stringify({
      success: false,
      error: `Missing env vars: ${missing.join(', ')}. See .env.example for setup.`,
    }));
    process.exit(1);
  }
}

// --- Get OAuth2 access token from refresh token ---
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    });

    const options = {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const parsed = JSON.parse(data);
        if (parsed.access_token) {
          resolve(parsed.access_token);
        } else {
          reject(new Error(`OAuth2 token error: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// --- Make Google Ads API request ---
async function apiRequest(method, path, body, accessToken) {
  return new Promise((resolve, reject) => {
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');
    const fullPath = path.startsWith('/') ? path : `/customers/${customerId}/${path}`;
    const url = new URL(`${BASE_URL}${fullPath}`);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        'Content-Type': 'application/json',
      },
    };

    if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
      options.headers['login-customer-id'] = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, '');
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// --- GAQL query via SearchStream ---
async function gaqlQuery(query, accessToken) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');
  const result = await apiRequest(
    'POST',
    `/customers/${customerId}/googleAds:searchStream`,
    { query },
    accessToken
  );
  return result;
}

// --- Actions ---

async function report(args, token) {
  const days = parseInt(args.days || '7', 10);
  const level = args.level || 'campaign'; // campaign, ad_group, ad
  const status = args.status || ''; // ENABLED, PAUSED, etc.

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  const fmtDate = d => d.toISOString().split('T')[0].replace(/-/g, '');

  let query;
  if (level === 'campaign') {
    query = `
      SELECT
        campaign.id, campaign.name, campaign.status,
        campaign.advertising_channel_type,
        campaign_budget.amount_micros,
        metrics.impressions, metrics.clicks, metrics.cost_micros,
        metrics.conversions, metrics.ctr, metrics.average_cpc
      FROM campaign
      WHERE segments.date BETWEEN '${fmtDate(startDate)}' AND '${fmtDate(endDate)}'
      ${status ? `AND campaign.status = '${status}'` : ''}
      ORDER BY metrics.cost_micros DESC
      LIMIT 50
    `;
  } else if (level === 'ad_group') {
    query = `
      SELECT
        campaign.name, ad_group.id, ad_group.name, ad_group.status,
        metrics.impressions, metrics.clicks, metrics.cost_micros,
        metrics.conversions, metrics.ctr, metrics.average_cpc
      FROM ad_group
      WHERE segments.date BETWEEN '${fmtDate(startDate)}' AND '${fmtDate(endDate)}'
      ORDER BY metrics.cost_micros DESC
      LIMIT 50
    `;
  } else if (level === 'ad') {
    query = `
      SELECT
        campaign.name, ad_group.name,
        ad_group_ad.ad.id, ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.status,
        metrics.impressions, metrics.clicks, metrics.cost_micros,
        metrics.conversions, metrics.ctr, metrics.average_cpc
      FROM ad_group_ad
      WHERE segments.date BETWEEN '${fmtDate(startDate)}' AND '${fmtDate(endDate)}'
      ORDER BY metrics.cost_micros DESC
      LIMIT 50
    `;
  } else if (level === 'keyword') {
    query = `
      SELECT
        campaign.name, ad_group.name,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.quality_info.quality_score,
        metrics.impressions, metrics.clicks, metrics.cost_micros,
        metrics.conversions, metrics.ctr, metrics.average_cpc
      FROM keyword_view
      WHERE segments.date BETWEEN '${fmtDate(startDate)}' AND '${fmtDate(endDate)}'
      ORDER BY metrics.impressions DESC
      LIMIT 50
    `;
  }

  const result = await gaqlQuery(query.trim(), token);
  if (result.status !== 200) {
    return { success: false, error: result.data };
  }

  // Flatten results
  const rows = [];
  if (Array.isArray(result.data)) {
    for (const batch of result.data) {
      if (batch.results) rows.push(...batch.results);
    }
  }

  return {
    success: true,
    level,
    dateRange: `${fmtDate(startDate)} to ${fmtDate(endDate)}`,
    rowCount: rows.length,
    rows: rows.map(r => {
      const out = {};
      // Flatten nested objects
      function flatten(obj, prefix) {
        for (const [k, v] of Object.entries(obj || {})) {
          const key = prefix ? `${prefix}.${k}` : k;
          if (v && typeof v === 'object' && !Array.isArray(v)) {
            flatten(v, key);
          } else {
            out[key] = v;
          }
        }
      }
      flatten(r);
      // Convert cost micros to dollars
      if (out['metrics.cost_micros']) {
        out['metrics.cost_dollars'] = (parseInt(out['metrics.cost_micros']) / 1_000_000).toFixed(2);
      }
      if (out['metrics.average_cpc']) {
        out['metrics.average_cpc_dollars'] = (parseInt(out['metrics.average_cpc']) / 1_000_000).toFixed(2);
      }
      return out;
    }),
  };
}

async function listCampaigns(args, token) {
  const query = `
    SELECT campaign.id, campaign.name, campaign.status,
           campaign.advertising_channel_type,
           campaign_budget.amount_micros
    FROM campaign
    ORDER BY campaign.id DESC
    LIMIT 50
  `;
  const result = await gaqlQuery(query.trim(), token);
  if (result.status !== 200) {
    return { success: false, error: result.data };
  }

  const rows = [];
  if (Array.isArray(result.data)) {
    for (const batch of result.data) {
      if (batch.results) rows.push(...batch.results);
    }
  }
  return { success: true, campaigns: rows };
}

async function createBudget(args, token) {
  if (!args.amount) {
    return { success: false, error: 'Missing --amount (daily budget in dollars, e.g., 3.30)' };
  }
  const amountMicros = Math.round(parseFloat(args.amount) * 1_000_000);
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');

  const body = {
    operations: [{
      create: {
        name: args.name || `RinkLink Budget $${args.amount}/day`,
        amountMicros: amountMicros.toString(),
        deliveryMethod: 'STANDARD',
      },
    }],
  };

  const result = await apiRequest('POST', `customers/${customerId}/campaignBudgets:mutate`, body, token);
  if (result.status !== 200) {
    return { success: false, error: result.data };
  }
  return { success: true, budget: result.data };
}

async function createCampaign(args, token) {
  if (!args.name) return { success: false, error: 'Missing --name' };
  if (!args['budget-resource']) return { success: false, error: 'Missing --budget-resource (from create-budget result)' };

  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');
  const channelType = (args.type || 'search').toUpperCase();
  const channelMap = {
    'SEARCH': 'SEARCH',
    'PERFORMANCE_MAX': 'PERFORMANCE_MAX',
    'DISPLAY': 'DISPLAY',
  };

  const campaign = {
    name: args.name,
    campaignBudget: args['budget-resource'],
    advertisingChannelType: channelMap[channelType] || 'SEARCH',
    status: 'PAUSED', // Always start paused for safety
    // Manual CPC bidding to start — can switch to target CPA later
    manualCpc: { enhancedCpcEnabled: true },
    networkSettings: {
      targetGoogleSearch: true,
      targetSearchNetwork: false,
      targetContentNetwork: false,
    },
    geoTargetTypeSetting: {
      positiveGeoTargetType: 'PRESENCE',
      negativeGeoTargetType: 'PRESENCE',
    },
  };

  // For Performance Max, use maximizeConversions instead
  if (channelType === 'PERFORMANCE_MAX') {
    delete campaign.manualCpc;
    delete campaign.networkSettings;
    campaign.maximizeConversions = {};
    if (args['target-cpa']) {
      campaign.maximizeConversions.targetCpaMicros = Math.round(parseFloat(args['target-cpa']) * 1_000_000).toString();
    }
  }

  const body = {
    operations: [{ create: campaign }],
  };

  const result = await apiRequest('POST', `customers/${customerId}/campaigns:mutate`, body, token);
  if (result.status !== 200) {
    return { success: false, error: result.data };
  }
  return { success: true, campaign: result.data, note: 'Campaign created as PAUSED. Post to #content-review for approval before enabling.' };
}

async function createAdGroup(args, token) {
  if (!args.name) return { success: false, error: 'Missing --name' };
  if (!args['campaign-resource']) return { success: false, error: 'Missing --campaign-resource' };

  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');
  const cpcMicros = args['cpc-bid'] ? Math.round(parseFloat(args['cpc-bid']) * 1_000_000) : 2_000_000; // Default $2 CPC

  const body = {
    operations: [{
      create: {
        name: args.name,
        campaign: args['campaign-resource'],
        status: 'ENABLED',
        type: 'SEARCH_STANDARD',
        cpcBidMicros: cpcMicros.toString(),
      },
    }],
  };

  const result = await apiRequest('POST', `customers/${customerId}/adGroups:mutate`, body, token);
  if (result.status !== 200) {
    return { success: false, error: result.data };
  }
  return { success: true, adGroup: result.data };
}

async function createAd(args, token) {
  if (!args['ad-group-resource']) return { success: false, error: 'Missing --ad-group-resource' };
  if (!args.headlines) return { success: false, error: 'Missing --headlines (pipe-separated, min 3)' };
  if (!args.descriptions) return { success: false, error: 'Missing --descriptions (pipe-separated, min 2)' };
  if (!args.url) return { success: false, error: 'Missing --url (final URL)' };

  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');
  const headlines = args.headlines.split('|').map(text => ({ text: text.trim() }));
  const descriptions = args.descriptions.split('|').map(text => ({ text: text.trim() }));

  if (headlines.length < 3) return { success: false, error: 'Need at least 3 headlines' };
  if (descriptions.length < 2) return { success: false, error: 'Need at least 2 descriptions' };

  const body = {
    operations: [{
      create: {
        adGroup: args['ad-group-resource'],
        status: 'PAUSED', // Start paused for review
        ad: {
          responsiveSearchAd: { headlines, descriptions },
          finalUrls: [args.url],
        },
      },
    }],
  };

  const result = await apiRequest('POST', `customers/${customerId}/adGroupAds:mutate`, body, token);
  if (result.status !== 200) {
    return { success: false, error: result.data };
  }
  return { success: true, ad: result.data, note: 'Ad created as PAUSED. Post to #content-review for approval.' };
}

async function addKeywords(args, token) {
  if (!args['ad-group-resource']) return { success: false, error: 'Missing --ad-group-resource' };
  if (!args.keywords) return { success: false, error: 'Missing --keywords (comma-separated)' };

  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');
  const matchType = (args['match-type'] || 'PHRASE').toUpperCase();
  const keywords = args.keywords.split(',').map(k => k.trim());

  const operations = keywords.map(keyword => ({
    create: {
      adGroup: args['ad-group-resource'],
      status: 'ENABLED',
      keyword: {
        text: keyword,
        matchType,
      },
    },
  }));

  const result = await apiRequest('POST', `customers/${customerId}/adGroupCriteria:mutate`, { operations }, token);
  if (result.status !== 200) {
    return { success: false, error: result.data };
  }
  return { success: true, keywords: result.data, count: keywords.length };
}

async function setCampaignStatus(args, token, status) {
  if (!args['campaign-id']) return { success: false, error: 'Missing --campaign-id' };

  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');
  const resourceName = `customers/${customerId}/campaigns/${args['campaign-id']}`;

  const body = {
    operations: [{
      update: { resourceName, status },
      updateMask: 'status',
    }],
  };

  const result = await apiRequest('POST', `customers/${customerId}/campaigns:mutate`, body, token);
  if (result.status !== 200) {
    return { success: false, error: result.data };
  }
  return { success: true, status, campaign: result.data };
}

async function updateBudget(args, token) {
  if (!args['budget-resource']) return { success: false, error: 'Missing --budget-resource' };
  if (!args.amount) return { success: false, error: 'Missing --amount (daily budget in dollars)' };

  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');
  const amountMicros = Math.round(parseFloat(args.amount) * 1_000_000);

  const body = {
    operations: [{
      update: {
        resourceName: args['budget-resource'],
        amountMicros: amountMicros.toString(),
      },
      updateMask: 'amount_micros',
    }],
  };

  const result = await apiRequest('POST', `customers/${customerId}/campaignBudgets:mutate`, body, token);
  if (result.status !== 200) {
    return { success: false, error: result.data };
  }
  return { success: true, newDailyBudget: `$${args.amount}`, budget: result.data };
}

// --- Main ---
async function main() {
  const { action, args } = parseArgs();

  if (!action) {
    console.error(JSON.stringify({
      success: false,
      error: 'Missing action. Use: report, create-campaign, create-budget, create-ad-group, create-ad, add-keywords, pause, enable, update-budget, list-campaigns',
    }));
    process.exit(1);
  }

  validateEnv();
  const token = await getAccessToken();

  let result;
  switch (action) {
    case 'report':
      result = await report(args, token);
      break;
    case 'list-campaigns':
      result = await listCampaigns(args, token);
      break;
    case 'create-budget':
      result = await createBudget(args, token);
      break;
    case 'create-campaign':
      result = await createCampaign(args, token);
      break;
    case 'create-ad-group':
      result = await createAdGroup(args, token);
      break;
    case 'create-ad':
      result = await createAd(args, token);
      break;
    case 'add-keywords':
      result = await addKeywords(args, token);
      break;
    case 'pause':
      result = await setCampaignStatus(args, token, 'PAUSED');
      break;
    case 'enable':
      result = await setCampaignStatus(args, token, 'ENABLED');
      break;
    case 'update-budget':
      result = await updateBudget(args, token);
      break;
    default:
      result = { success: false, error: `Unknown action: ${action}` };
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});
