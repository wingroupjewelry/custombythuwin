/* ═══════════════════════════════════════════════
   CUSTOM BY THU WIN — portal.js
   Client Portal Logic
═══════════════════════════════════════════════ */

/* ──────────────────────────────────────────────
   CONFIGURATION
   Running locally (file://) → uses demo data.
   Deployed on Netlify → calls real backend.
────────────────────────────────────────────── */
const API_URL   = '/api/get-projects';
const IS_LOCAL  = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

/* ──────────────────────────────────────────────
   DEMO ACCOUNT (local preview only)
   Email:       demo@custombythuwin.com
   Access Code: CBTW-DEMO-001
────────────────────────────────────────────── */
const DEMO_EMAIL = 'demo@custombythuwin.com';
const DEMO_CODE  = 'CBTW-DEMO-001';

const DEMO_PROJECTS = [
  {
    id: 'demo-1',
    name: '18k Yellow Gold Natural Emerald & Marquise Diamond Engagement Ring',
    status: 'Casting',
    description: 'Stones have been selected and approved. Wax model is complete — your piece is now being cast.',
    start_date: 'January 15, 2026',
    due_date: '',
    deliverable: '',
    notes: '',
    metal: '18k Gold · Yellow',
    jewelry_type: 'Ring',
    diamond: 'Natural Diamond',
    ring_size: '6.5',
    project_num: 'CBTW-2026-001',
    cover: '',
    viewer_url: '',           // ← paste your iJewel3D public share/embed URL here
    last_updated: 'March 5, 2026',
  },
  {
    id: 'demo-2',
    name: '14k Yellow Gold Enamel Horseshoe Memorial Pendant',
    status: 'Complete',
    description: 'Your piece is complete and has shipped via FedEx Overnight Insured. Certificate of authenticity included.',
    start_date: 'November 10, 2025',
    due_date: '',
    deliverable: 'https://drive.google.com',
    notes: '',
    metal: '14k Gold · Yellow',
    jewelry_type: 'Pendant',
    diamond: 'Natural Diamond',
    ring_size: '',
    project_num: 'CBTW-2025-048',
    cover: '',
    viewer_url: '',           // ← paste your iJewel3D public share/embed URL here
    last_updated: 'December 22, 2025',
  },
  {
    id: 'demo-3',
    name: 'Platinum Oval Lab Diamond Solitaire Ring',
    status: 'Waiting for Approval',
    description: 'Your CAD design is ready! Please review the 3D rendering in the link below and let us know if you\'d like any changes.',
    start_date: 'February 20, 2026',
    due_date: '',
    deliverable: 'https://drive.google.com',
    notes: '',
    metal: 'Platinum',
    jewelry_type: 'Ring',
    diamond: 'Lab Diamond',
    ring_size: '7',
    project_num: 'CBTW-2026-009',
    cover: '',
    viewer_url: '',           // ← paste your iJewel3D public share/embed URL here
    last_updated: 'March 6, 2026',
  },
];

/* ──────────────────────────────────────────────
   NAV (same as main site)
────────────────────────────────────────────── */
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinksEl = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinksEl.classList.toggle('open');
});

navLinksEl.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinksEl.classList.remove('open');
  });
});

/* ──────────────────────────────────────────────
   SESSION: persist login in sessionStorage
────────────────────────────────────────────── */
function saveSession(email, code) {
  sessionStorage.setItem('portal_email', email);
  sessionStorage.setItem('portal_code', code);
}

function getSession() {
  return {
    email: sessionStorage.getItem('portal_email'),
    code:  sessionStorage.getItem('portal_code'),
  };
}

function clearSession() {
  sessionStorage.removeItem('portal_email');
  sessionStorage.removeItem('portal_code');
}

/* ──────────────────────────────────────────────
   UI ELEMENTS
────────────────────────────────────────────── */
const loginWrap      = document.getElementById('loginWrap');
const loginForm      = document.getElementById('loginForm');
const loginBtn       = document.getElementById('loginBtn');
const loginError     = document.getElementById('loginError');
const loginErrorMsg  = document.getElementById('loginErrorMsg');

const dashboard      = document.getElementById('portalDashboard');
const welcomeName    = document.getElementById('welcomeName');
const logoutBtn      = document.getElementById('logoutBtn');

const projectsLoading = document.getElementById('projectsLoading');
const projectsError   = document.getElementById('projectsError');
const projectsErrorMsg= document.getElementById('projectsErrorMsg');
const projectsGrid    = document.getElementById('projectsGrid');
const noProjects      = document.getElementById('noProjects');

/* ──────────────────────────────────────────────
   INIT: check for existing session
────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  const session = getSession();
  if (session.email && session.code) {
    showDashboard(session.email, session.code);
  }
});

/* ──────────────────────────────────────────────
   LOGIN FORM SUBMIT
────────────────────────────────────────────── */
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('portalEmail').value.trim().toLowerCase();
  const code  = document.getElementById('portalCode').value.trim().toUpperCase();

  if (!email || !code) return;

  loginError.style.display = 'none';
  loginBtn.classList.add('loading');
  loginBtn.innerHTML = '<i class="fa-solid fa-unlock-keyhole"></i> Verifying…';

  try {
    const result = await fetchProjects(email, code);

    if (result.error) {
      showLoginError(result.error);
    } else {
      saveSession(email, code);
      showDashboard(email, code, result.projects);
    }
  } catch (err) {
    showLoginError('Unable to connect. Please check your internet and try again.');
  } finally {
    loginBtn.classList.remove('loading');
    loginBtn.innerHTML = '<i class="fa-solid fa-unlock-keyhole"></i> View My Projects';
  }
});

/* ──────────────────────────────────────────────
   LOGOUT
────────────────────────────────────────────── */
logoutBtn.addEventListener('click', () => {
  clearSession();
  dashboard.style.display = 'none';
  loginWrap.style.display = 'block';
  document.getElementById('portalEmail').value = '';
  document.getElementById('portalCode').value  = '';
});

/* ──────────────────────────────────────────────
   SHOW DASHBOARD
────────────────────────────────────────────── */
function showDashboard(email, code, projects = null) {
  loginWrap.style.display  = 'none';
  dashboard.style.display  = 'block';
  welcomeName.textContent  = email;

  if (projects) {
    renderProjects(projects);
  } else {
    loadProjects(email, code);
  }
}

/* ──────────────────────────────────────────────
   LOAD PROJECTS (called on return visit)
────────────────────────────────────────────── */
async function loadProjects(email, code) {
  const session = getSession();
  email = email || session.email;
  code  = code  || session.code;

  projectsLoading.style.display = 'flex';
  projectsError.style.display   = 'none';
  projectsGrid.innerHTML        = '';
  noProjects.style.display      = 'none';

  try {
    const result = await fetchProjects(email, code);
    if (result.error) {
      showProjectsError(result.error);
    } else {
      renderProjects(result.projects);
    }
  } catch (err) {
    showProjectsError('Connection failed. Please try again.');
  } finally {
    projectsLoading.style.display = 'none';
  }
}

// Expose for retry button
window.loadProjects = loadProjects;

/* ──────────────────────────────────────────────
   FETCH PROJECTS FROM BACKEND (or demo data)
────────────────────────────────────────────── */
async function fetchProjects(email, code) {
  // Local file preview → use demo data
  if (IS_LOCAL) {
    await new Promise(r => setTimeout(r, 900)); // simulate loading
    if (email === DEMO_EMAIL && code === DEMO_CODE) {
      return { projects: DEMO_PROJECTS };
    }
    return { error: 'Invalid email or access code. Try the demo account: demo@custombythuwin.com / CBTW-DEMO-001' };
  }

  // Deployed → call real Netlify backend
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    return { error: data.error || `Server error (${response.status}).` };
  }

  return response.json();
}

/* ──────────────────────────────────────────────
   RENDER PROJECT CARDS
────────────────────────────────────────────── */
function renderProjects(projects) {
  projectsLoading.style.display = 'none';
  projectsGrid.innerHTML = '';

  if (!projects || projects.length === 0) {
    noProjects.style.display = 'flex';
    return;
  }

  noProjects.style.display = 'none';

  projects.forEach(p => {
    const card = buildProjectCard(p);
    projectsGrid.appendChild(card);
  });
}

function buildProjectCard(p) {
  const statusClass = slugify(p.status);
  const badgeClass  = statusBadgeClass(p.status);

  const card = document.createElement('div');
  card.className = `project-card status-${statusClass}`;

  // Cover image (always shown if available)
  const coverHtml = p.cover
    ? `<img class="project-card-cover" src="${escHtml(p.cover)}" alt="${escHtml(p.name)}" loading="lazy" />`
    : `<div class="project-card-cover-placeholder"><i class="fa-solid fa-gem"></i></div>`;

  // Meta rows (only show if value exists)
  const metaRows = [
    p.project_num  ? metaRow('fa-hashtag',           'Project #',  p.project_num)  : '',
    p.jewelry_type ? metaRow('fa-gem',               'Type',       p.jewelry_type) : '',
    p.metal        ? metaRow('fa-circle-dot',        'Metal',      p.metal)        : '',
    p.diamond      ? metaRow('fa-star',              'Diamond',    p.diamond)      : '',
    p.ring_size    ? metaRow('fa-ring',              'Ring Size',  p.ring_size + ' mm') : '',
    p.start_date   ? metaRow('fa-calendar-plus',     'Started',    p.start_date)   : '',
    p.description  ? metaRow('fa-note-sticky',       'Notes',      p.description)  : '',
  ].join('');

  // Deliverable button
  const deliverableHtml = p.deliverable
    ? `<a class="project-deliverable-btn" href="${escHtml(p.deliverable)}" target="_blank" rel="noopener">
         <i class="fa-solid fa-arrow-up-right-from-square"></i> View Files / Preview
       </a>`
    : '';

  // 3D viewer button
  const viewerBtnHtml = p.viewer_url
    ? `<a class="project-deliverable-btn project-viewer-btn" href="${escHtml(p.viewer_url)}" target="_blank" rel="noopener">
         <i class="fa-solid fa-cube"></i> View 3D Preview
       </a>`
    : '';

  card.innerHTML = `
    ${coverHtml}
    <div class="project-card-body">
      <div class="project-card-header">
        <h3 class="project-name">${escHtml(p.name)}</h3>
        <span class="status-badge ${badgeClass}">
          <i class="${statusIcon(p.status)}"></i> ${escHtml(p.status || 'No Status')}
        </span>
      </div>
      ${p.description ? `<p class="project-description">${escHtml(p.description)}</p>` : ''}
      ${metaRows ? `<div class="project-meta">${metaRows}</div>` : ''}
    </div>
    ${viewerBtnHtml || deliverableHtml || p.last_updated ? `
    <div class="project-card-footer">
      ${viewerBtnHtml}
      ${deliverableHtml}
      ${p.last_updated ? `<span class="project-last-updated">Updated ${escHtml(p.last_updated)}</span>` : ''}
    </div>` : ''}
  `;

  return card;
}

function metaRow(icon, label, value) {
  return `
    <div class="project-meta-row">
      <i class="fa-regular ${icon}"></i>
      <span class="project-meta-label">${label}</span>
      <span class="project-meta-value">${escHtml(value)}</span>
    </div>
  `;
}

/* ──────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────── */
function showLoginError(msg) {
  loginErrorMsg.textContent  = msg;
  loginError.style.display   = 'flex';
}

function showProjectsError(msg) {
  projectsErrorMsg.textContent = msg;
  projectsError.style.display  = 'flex';
  projectsLoading.style.display = 'none';
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(str) {
  return (str || 'default').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function statusBadgeClass(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('initiation'))                    return 's-consultation';
  if (s.includes('quote'))                         return 's-consultation';
  if (s.includes('waiting for deposit'))           return 's-consultation';
  if (s.includes('waiting for payment'))           return 's-consultation';
  if (s.includes('cad'))                           return 's-design';
  if (s.includes('waiting for approval'))          return 's-design';
  if (s.includes('revision'))                      return 's-design';
  if (s.includes('wax') || s.includes('cast') || s.includes('sending to cast')) return 's-crafting';
  if (s.includes('clean') || s.includes('polish') || s.includes('enamel') || s.includes('setting')) return 's-in-progress';
  if (s.includes('repair'))                        return 's-in-progress';
  if (s.includes('waiting for shipping'))          return 's-review';
  if (s.includes('paid'))                          return 's-completed';
  if (s.includes('complete'))                      return 's-completed';
  if (s.includes('cancel'))                        return 's-default';
  return 's-default';
}

function statusIcon(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('initiation') || s.includes('quote'))      return 'fa-regular fa-comments';
  if (s.includes('waiting for deposit') || s.includes('waiting for payment')) return 'fa-solid fa-clock';
  if (s.includes('cad'))                                    return 'fa-solid fa-pencil-ruler';
  if (s.includes('waiting for approval') || s.includes('revision')) return 'fa-solid fa-eye';
  if (s.includes('wax'))                                    return 'fa-solid fa-cube';
  if (s.includes('cast') || s.includes('sending'))         return 'fa-solid fa-fire-flame-curved';
  if (s.includes('clean') || s.includes('polish') || s.includes('setting')) return 'fa-solid fa-gem';
  if (s.includes('enamel'))                                 return 'fa-solid fa-palette';
  if (s.includes('repair'))                                 return 'fa-solid fa-screwdriver-wrench';
  if (s.includes('waiting for shipping'))                   return 'fa-solid fa-truck';
  if (s.includes('paid') || s.includes('complete'))         return 'fa-solid fa-circle-check';
  if (s.includes('cancel'))                                 return 'fa-solid fa-ban';
  return 'fa-regular fa-circle';
}
