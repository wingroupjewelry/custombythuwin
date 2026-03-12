/* ═══════════════════════════════════════════════
   Vercel Serverless Function — api/get-projects.js
   Safely proxies Notion API. Your API key is
   NEVER exposed to the browser.
═══════════════════════════════════════════════ */

const NOTION_VERSION = '2022-06-28';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  let email, code;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    email = (body.email || '').trim().toLowerCase();
    code  = (body.code  || '').trim().toUpperCase();
  } catch {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and access code are required.' });
  }

  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const NOTION_DB_ID   = process.env.NOTION_DATABASE_ID;

  if (!NOTION_API_KEY || !NOTION_DB_ID) {
    console.error('Missing NOTION_API_KEY or NOTION_DATABASE_ID env vars.');
    return res.status(500).json({ error: 'Portal is not configured yet. Please contact us.' });
  }

  const notionBody = JSON.stringify({
    filter: {
      and: [
        { property: 'Client Email', email:     { equals: email } },
        { property: 'Access Code',  rich_text: { equals: code  } },
      ],
    },
    sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
  });

  let notionResp;
  try {
    notionResp = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization:   `Bearer ${NOTION_API_KEY}`,
          'Content-Type':  'application/json',
          'Notion-Version': NOTION_VERSION,
        },
        body: notionBody,
      }
    );
  } catch (err) {
    console.error('Notion fetch error:', err);
    return res.status(502).json({ error: 'Could not reach Notion. Please try again later.' });
  }

  if (!notionResp.ok) {
    const errData = await notionResp.json().catch(() => ({}));
    console.error('Notion API error:', notionResp.status, errData);
    if (notionResp.status === 401) {
      return res.status(500).json({ error: 'Notion authentication failed. Please contact us.' });
    }
    return res.status(502).json({ error: 'Failed to fetch project data from Notion.' });
  }

  const data    = await notionResp.json();
  const results = data.results || [];

  if (results.length === 0) {
    return res.status(401).json({ error: 'Invalid email or access code. Please double-check and try again.' });
  }

  const projects = results.map(parseNotionPage);
  return res.status(200).json({ projects });
}

function parseNotionPage(page) {
  const props = page.properties || {};
  const goldKarat = getMultiSelect(props, 'Gold Karat');
  const goldColor = getMultiSelect(props, 'Gold Color');
  const metal     = [goldKarat, goldColor].filter(Boolean).join(' · ');

  return {
    id:           page.id,
    name:         getTitle(props),
    status:       getStatus(props, 'Status'),
    description:  getRichText(props, 'Comments '),
    start_date:   getDate(props, 'Start Date'),
    deliverable:  getUrl(props, 'Drive Link '),
    metal,
    jewelry_type: getSelect(props, 'Jewelry Type'),
    diamond:      getSelect(props, 'Natural or Lab Diamond'),
    ring_size:    getNumber(props, 'Bail Size or Ring Size(MM)'),
    project_num:  getRichText(props, 'Project Number'),
    cover:        getCover(page),
    last_updated: formatDate(page.last_edited_time),
  };
}

function getTitle(props) {
  for (const key of Object.keys(props)) {
    if (props[key].type === 'title' && props[key].title?.length) {
      return props[key].title[0].plain_text || 'Untitled';
    }
  }
  return 'Untitled';
}

function getStatus(props, key)      { return props[key]?.status?.name || ''; }
function getSelect(props, key)      { return props[key]?.select?.name || ''; }
function getMultiSelect(props, key) { return (props[key]?.multi_select || []).map(o => o.name).join(', '); }
function getNumber(props, key)      { const v = props[key]?.number; return v != null ? String(v) : ''; }
function getRichText(props, key)    { return (props[key]?.rich_text || []).map(t => t.plain_text).join(''); }
function getUrl(props, key)         { return props[key]?.url || ''; }

function getDate(props, key) {
  const d = props[key]?.date?.start;
  return d ? formatDate(d) : '';
}

function getCover(page) {
  const cover = page.cover;
  if (!cover) return '';
  if (cover.type === 'external') return cover.external?.url || '';
  if (cover.type === 'file')     return cover.file?.url     || '';
  return '';
}

function formatDate(str) {
  if (!str) return '';
  try {
    return new Date(str).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return str; }
}
