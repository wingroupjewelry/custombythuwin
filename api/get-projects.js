/* ═══════════════════════════════════════════════
   Vercel Serverless Function — api/get-projects.js
   Client data is stored in PORTAL_CLIENTS env var.
   It is NEVER stored in the public repo.
═══════════════════════════════════════════════ */

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

  const raw = process.env.PORTAL_CLIENTS;
  if (!raw) {
    console.error('Missing PORTAL_CLIENTS env var.');
    return res.status(500).json({ error: 'Portal is not configured yet. Please contact us.' });
  }

  let clients;
  try {
    clients = JSON.parse(raw);
  } catch {
    console.error('Invalid PORTAL_CLIENTS JSON.');
    return res.status(500).json({ error: 'Portal configuration error. Please contact us.' });
  }

  // Match by email AND access code (case-insensitive)
  const matched = clients.filter(
    c => (c.email || '').toLowerCase() === email &&
         (c.code  || '').toUpperCase() === code
  );

  if (matched.length === 0) {
    return res.status(401).json({ error: 'Invalid email or access code. Please double-check and try again.' });
  }

  // Strip email/code before sending to browser
  const projects = matched.map(({ email: _e, code: _c, ...rest }) => rest);
  return res.status(200).json({ projects });
}
