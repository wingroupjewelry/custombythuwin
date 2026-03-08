/* ═══════════════════════════════════════════════
   CUSTOM BY THU WIN — script.js
═══════════════════════════════════════════════ */

/* ── Navbar: scroll effect + active link ─────── */
const navbar   = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

function onScroll() {
  // Scrolled class for background
  navbar.classList.toggle('scrolled', window.scrollY > 60);

  // Active nav link highlight
  let current = '';
  sections.forEach(sec => {
    const top = sec.offsetTop - 120;
    if (window.scrollY >= top) current = sec.getAttribute('id');
  });

  navLinks.forEach(link => {
    link.classList.toggle(
      'active',
      link.getAttribute('href') === `#${current}`
    );
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll(); // run once on load

/* ── Hamburger menu ──────────────────────────── */
const hamburger  = document.getElementById('hamburger');
const navLinksEl = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinksEl.classList.toggle('open');
});

// Close menu when a link is clicked
navLinksEl.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinksEl.classList.remove('open');
  });
});

/* ── Scroll reveal ───────────────────────────── */
const revealEls = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
);

revealEls.forEach(el => observer.observe(el));

/* ── Portfolio Lightbox ──────────────────────── */
const lightbox        = document.getElementById('lightbox');
const lightboxContent = document.getElementById('lightboxContent');
const lightboxClose   = document.getElementById('lightboxClose');

document.querySelectorAll('.portfolio-media').forEach(media => {
  media.addEventListener('click', () => {
    const img   = media.querySelector('img');
    const video = media.querySelector('video');

    lightboxContent.innerHTML = '';

    if (img) {
      const clone = img.cloneNode();
      lightboxContent.appendChild(clone);
      lightbox.classList.add('open');
    } else if (video) {
      const clone = video.cloneNode(true);
      clone.controls = true;
      clone.autoplay = true;
      clone.muted    = false;
      lightboxContent.appendChild(clone);
      lightbox.classList.add('open');
    }
  });
});

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

function closeLightbox() {
  lightbox.classList.remove('open');
  // Pause any playing video
  const vid = lightboxContent.querySelector('video');
  if (vid) vid.pause();
  setTimeout(() => { lightboxContent.innerHTML = ''; }, 350);
}

/* ── Appointment Form — checkbox serialisation ─ */
// FormSubmit handles arrays oddly; we flatten checkboxes into one string per group.
const form = document.getElementById('appointmentForm');
if (form) {
  form.addEventListener('submit', e => {
    // Collect Gold Options
    const goldChecked = [...form.querySelectorAll('input[name="Gold Options"]:checked')]
      .map(cb => cb.value);
    const diamondChecked = [...form.querySelectorAll('input[name="Diamond Options"]:checked')]
      .map(cb => cb.value);

    // Remove individual checkboxes from POST and replace with hidden inputs
    form.querySelectorAll('input[name="Gold Options"], input[name="Diamond Options"]')
        .forEach(cb => cb.removeAttribute('name'));

    const addHidden = (name, value) => {
      const h = document.createElement('input');
      h.type  = 'hidden';
      h.name  = name;
      h.value = value || 'Not specified';
      form.appendChild(h);
    };

    addHidden('Gold Options',    goldChecked.join(', ')    || 'None selected');
    addHidden('Diamond Options', diamondChecked.join(', ') || 'None selected');
  });
}

/* ── Smooth appear for hero on first load ─────── */
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});
