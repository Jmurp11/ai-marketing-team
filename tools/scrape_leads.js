#!/usr/bin/env node
/**
 * RinkLink Lead Scraper
 *
 * Scrapes MyHockeyRankings.com for youth hockey organization contacts.
 * Outputs raw contacts as JSON to stdout for Claude Code to evaluate.
 * Does NOT insert into Supabase — use tools/lead_insert.sh for validated leads.
 *
 * Ported from rinklink-crm/apps/api/src/scraper/scraper.service.ts.
 *
 * Usage:
 *   node scrape_leads.js [options]
 *
 * Options:
 *   --max-pages <n>        Max associations to process (default: all)
 *   --associations <list>  Comma-separated filter (name or location substring)
 */

const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://myhockeyrankings.com';
const RATE_LIMIT_MS = parseInt(process.env.SCRAPER_RATE_LIMIT_MS || '2000', 10);
const TIMEOUT_MS = parseInt(process.env.SCRAPER_TIMEOUT_MS || '10000', 10);
const USER_AGENT = process.env.SCRAPER_USER_AGENT || 'RinkLink Bot/1.0 (+https://rinklink.com/bot)';

const httpClient = axios.create({
  timeout: TIMEOUT_MS,
  headers: {
    'User-Agent': USER_AGENT,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  },
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(msg) {
  process.stderr.write(`[scraper] ${msg}\n`);
}

// --- Parse CLI args ---
function parseArgs() {
  const args = { maxPages: 0, associations: [] };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--max-pages' && argv[i + 1]) {
      args.maxPages = parseInt(argv[++i], 10);
    } else if (argv[i] === '--associations' && argv[i + 1]) {
      args.associations = argv[++i].split(',').map((s) => s.trim());
    }
  }
  return args;
}

// --- Fetch paginated associations list ---
async function fetchAssociationsList() {
  const associations = [];
  const seenUrls = new Set();

  const firstResponse = await httpClient.get(`${BASE_URL}/associations`);
  const $first = cheerio.load(firstResponse.data);

  let totalPages = 1;
  $first('a[href*="/associations/"]').each((_, el) => {
    const href = $first(el).attr('href') || '';
    const match = href.match(/\/associations\/(\d+)/);
    if (match) {
      const page = parseInt(match[1], 10);
      if (page > totalPages) totalPages = page;
    }
  });

  log(`Found ${totalPages} pages of associations`);

  const parsePage = ($) => {
    $('a[href*="/association-info"]').each((_, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const rawText = $el.find('h3').text().trim() || $el.text().trim();
      const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
      const name = lines[0] || '';
      const location = lines[1] || '';

      if (href && name && !seenUrls.has(href)) {
        seenUrls.add(href);
        associations.push({ name, location, url: `${BASE_URL}${href}` });
      }
    });
  };

  parsePage($first);

  for (let page = 2; page <= totalPages; page++) {
    await delay(RATE_LIMIT_MS);
    const response = await httpClient.get(`${BASE_URL}/associations/${page}`);
    const $ = cheerio.load(response.data);
    parsePage($);
  }

  log(`Found ${associations.length} total associations`);
  return associations;
}

// --- Extract emails from HTML ---
function extractEmails(html) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = html.match(emailRegex) || [];
  return [...new Set(matches)].filter((email) => {
    const lower = email.toLowerCase();
    return (
      !lower.includes('example.com') &&
      !lower.includes('yourdomain') &&
      !lower.includes('email@') &&
      !lower.includes('@sentry') &&
      !lower.endsWith('.png') &&
      !lower.endsWith('.jpg') &&
      !lower.endsWith('.gif')
    );
  });
}

// --- Extract name from surrounding text ---
function extractNameFromContainer(text, email) {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const emailIndex = cleanText.toLowerCase().indexOf(email.toLowerCase());
  const relevantText = emailIndex > 0 ? cleanText.substring(0, emailIndex) : cleanText;

  const nameRegex = /\b([A-Z][a-zA-Z.''-]+(?:\s+[A-Z][a-zA-Z.''-]+){1,2})\b/g;
  const matches = relevantText.match(nameRegex) || [];

  const skipTerms = [
    'president', 'secretary', 'treasurer', 'director', 'manager', 'coach',
    'contact', 'email', 'phone', 'board', 'team', 'head', 'assistant',
    'coordinator', 'registrar', 'administrator', 'volunteer', 'staff',
    'hockey', 'association', 'youth', 'junior', 'minor', 'major', 'bantam',
    'midget', 'peewee', 'squirt', 'mite', 'novice', 'atom', 'tyke',
    'aaa', 'aa', 'tier', 'division', 'league', 'club', 'rink', 'arena',
    'ice', 'skate', 'skating', 'program', 'travel', 'house', 'select',
    'click', 'here', 'read', 'more', 'view', 'download', 'submit',
    'about', 'home', 'schedule', 'calendar', 'news', 'events',
  ];

  const validNames = [];
  for (const match of matches) {
    const words = match.split(/\s+/);
    const lowerMatch = match.toLowerCase();
    if (words.some((w) => skipTerms.includes(w.toLowerCase()))) continue;
    if (/^[A-Z]{1,2}$/.test(words[0])) continue;
    if (skipTerms.some((term) => lowerMatch.includes(term))) continue;
    if (email.toLowerCase().startsWith(lowerMatch.replace(/\s/g, ''))) continue;
    if (match.length < 5) continue;
    const validWordCount = words.filter((w) => w.length >= 2).length;
    if (validWordCount < 2) continue;
    validNames.push(match);
  }

  return validNames.length > 0 ? validNames[validNames.length - 1] : null;
}

// --- Extract role near email ---
function extractRoleNearEmail(text, email) {
  const roleKeywords = [
    'president', 'director', 'manager', 'coordinator', 'secretary',
    'treasurer', 'coach', 'administrator', 'contact', 'registrar',
  ];
  const context = text.toLowerCase();
  const emailIndex = context.indexOf(email.toLowerCase());
  const nearbyText = context.substring(Math.max(0, emailIndex - 100), emailIndex + email.length + 100);

  for (const keyword of roleKeywords) {
    if (nearbyText.includes(keyword)) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
  }
  return null;
}

// --- Find organization links on an association page ---
function findOrganizationLinks($, sourceUrl) {
  const links = [];
  const seenUrls = new Set();
  const skipDomains = [
    'myhockeyrankings.com', 'myhockeytournaments.com', 'livebarn.com',
    'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
    'youtube.com', 'tiktok.com', 'linkedin.com', 'google.com',
  ];

  $('a[href^="http"]').each((_, element) => {
    const $el = $(element);
    const href = $el.attr('href');
    const text = $el.text().trim();
    if (!href || seenUrls.has(href)) return;
    if (skipDomains.some((domain) => href.includes(domain))) return;
    seenUrls.add(href);
    links.push({ name: text || 'Organization', url: href });
  });

  return links;
}

// --- Process an organization website ---
async function processOrganizationSite(org, association) {
  const contacts = [];

  try {
    const mainResponse = await httpClient.get(org.url);
    const $main = cheerio.load(mainResponse.data);
    const mainEmails = extractEmails(mainResponse.data);
    const baseUrl = new URL(org.url).origin;

    for (const email of mainEmails) {
      contacts.push({
        email,
        association,
        organizationName: org.name,
        organizationUrl: org.url,
        sourceUrl: org.url,
      });
    }

    const contactKeywords = [
      'contact', 'about', 'staff', 'board', 'leadership', 'director',
      'manager', 'coach', 'scheduler', 'committee', 'volunteer', '/team/',
    ];
    const discoveredUrls = new Set();

    $main('a[href]').each((_, element) => {
      const href = $main(element).attr('href');
      if (!href) return;
      const lowerHref = href.toLowerCase();
      if (contactKeywords.some((kw) => lowerHref.includes(kw))) {
        let fullUrl;
        if (href.startsWith('http')) {
          try {
            if (new URL(href).origin !== baseUrl) return;
          } catch { return; }
          fullUrl = href;
        } else {
          fullUrl = href.startsWith('/') ? `${baseUrl}${href}` : `${baseUrl}/${href}`;
        }
        discoveredUrls.add(fullUrl);
      }
    });

    log(`Discovered ${discoveredUrls.size} contact-related pages on ${baseUrl}`);

    for (const pageUrl of discoveredUrls) {
      try {
        await delay(RATE_LIMIT_MS / 2);
        const pageResponse = await httpClient.get(pageUrl);
        const $ = cheerio.load(pageResponse.data);
        const pageEmails = extractEmails(pageResponse.data);

        for (const email of pageEmails) {
          if (contacts.some((c) => c.email === email)) continue;

          let name = null;
          let role = null;

          const mailtoLink = $(`a[href*="${email}"]`).first();
          if (mailtoLink.length) {
            const container = mailtoLink.closest('div, li, tr, article, section').first();
            if (container.length) {
              const containerText = container.text();
              name = extractNameFromContainer(containerText, email);
              role = extractRoleNearEmail(containerText, email);
            }
          }

          if (!name) {
            $(`:contains("${email}")`).each((_, el) => {
              const $el = $(el);
              if ($el.children(`:contains("${email}")`).length > 0) return;
              const container = $el.closest('div, li, tr, article, section').first();
              if (container.length) {
                const containerText = container.text();
                if (!name) name = extractNameFromContainer(containerText, email);
                if (!role) role = extractRoleNearEmail(containerText, email);
              }
            });
          }

          contacts.push({
            email,
            name: name || undefined,
            role: role || undefined,
            association,
            organizationName: org.name,
            organizationUrl: org.url,
            sourceUrl: pageUrl,
          });
        }
      } catch {
        // Page failed to load
      }
    }
  } catch (err) {
    log(`Failed to fetch ${org.url}: ${err.message}`);
  }

  return contacts;
}

// --- Process a single association ---
async function processAssociation(association) {
  const contacts = [];

  log(`Fetching MHR page: ${association.url}`);
  const response = await httpClient.get(association.url);
  const $ = cheerio.load(response.data);

  const pageEmails = extractEmails(response.data);
  log(`Found ${pageEmails.length} emails on MHR page for ${association.name}`);

  const orgLinks = findOrganizationLinks($, association.url);
  log(`Found ${orgLinks.length} org website links for ${association.name}`);

  for (const orgLink of orgLinks.slice(0, 10)) {
    try {
      await delay(RATE_LIMIT_MS);
      log(`Crawling org website: ${orgLink.url}`);
      const orgContacts = await processOrganizationSite(orgLink, association.name);
      log(`Found ${orgContacts.length} contacts on ${orgLink.url}`);
      contacts.push(...orgContacts);
    } catch (err) {
      log(`Failed to process org site ${orgLink.url}: ${err.message}`);
    }
  }

  if (contacts.length === 0) {
    for (const email of pageEmails) {
      contacts.push({
        email,
        association: association.name,
        sourceUrl: association.url,
      });
    }
  }

  return contacts;
}

// --- Deduplicate contacts ---
function deduplicateContacts(contacts) {
  const seen = new Map();
  for (const contact of contacts) {
    const email = contact.email.toLowerCase();
    const existing = seen.get(email);
    if (!existing) {
      seen.set(email, contact);
    } else {
      seen.set(email, {
        ...existing,
        name: existing.name || contact.name,
        role: existing.role || contact.role,
        organizationName: existing.organizationName || contact.organizationName,
        organizationUrl: existing.organizationUrl || contact.organizationUrl,
      });
    }
  }
  return Array.from(seen.values());
}

// --- Main ---
async function main() {
  const args = parseArgs();
  const startTime = Date.now();
  const errors = [];
  const allContacts = [];

  try {
    log('Fetching associations list...');
    let associations = await fetchAssociationsList();

    if (args.associations.length > 0) {
      log(`Filtering by: ${JSON.stringify(args.associations)}`);
      associations = associations.filter((a) =>
        args.associations.some((filter) => {
          const lowerFilter = filter.toLowerCase();
          return a.name.toLowerCase().includes(lowerFilter) || a.location.toLowerCase().includes(lowerFilter);
        }),
      );
      log(`Matched ${associations.length} associations`);
    }

    if (args.maxPages && associations.length > args.maxPages) {
      associations = associations.slice(0, args.maxPages);
    }

    log(`Processing ${associations.length} associations`);

    for (const association of associations) {
      try {
        await delay(RATE_LIMIT_MS);
        const contacts = await processAssociation(association);
        allContacts.push(...contacts);
        log(`Found ${contacts.length} contacts from ${association.name}`);
      } catch (err) {
        log(`Failed to process ${association.name}: ${err.message}`);
        errors.push({ url: association.url, message: err.message, timestamp: new Date().toISOString() });
      }
    }

    const uniqueContacts = deduplicateContacts(allContacts);
    log(`Found ${uniqueContacts.length} unique contacts (${allContacts.length} total)`);
    log('Output is scrape-only — use tools/lead_insert.sh to insert validated leads');

    const result = {
      status: 'completed',
      contactsFound: uniqueContacts.length,
      errorCount: errors.length,
      duration: Date.now() - startTime,
      contacts: uniqueContacts,
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(JSON.stringify({
      status: 'failed',
      error: err.message,
      contactsFound: allContacts.length,
      duration: Date.now() - startTime,
    }));
    process.exit(1);
  }
}

main();
