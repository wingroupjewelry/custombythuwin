/* ═══════════════════════════════════════════════
   CUSTOM BY THU WIN — Quote Calculator
   quote.js
═══════════════════════════════════════════════ */

const METAL_PRICES = {
  silver:   8,
  '10k':    95,
  '14k':    125,
  '18k':    150,
  platinum: 88
};

const SETTING_PRICES = {
  none:        0,
  big:         40,
  melee:       1,
  fancy_melee: 5
};

let metalIdCounter = 0;
let stoneIdCounter  = 0;

/* ─────────────────────────────────────
   INIT
───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // Set today's date
  document.getElementById('quoteDate').value = new Date().toISOString().split('T')[0];

  // Auto quote number
  const num = 'CTW-' + String(Date.now()).slice(-6);
  document.getElementById('quoteNum').value = num;

  // Start with one of each
  addMetalRow();
  addStoneRow();

  // Buttons
  document.getElementById('addMetal').addEventListener('click', addMetalRow);
  document.getElementById('addStone').addEventListener('click', addStoneRow);
  document.getElementById('generatePdf').addEventListener('click', generatePDF);
  document.getElementById('generatePdf2').addEventListener('click', generatePDF);

  // Client info live update
  ['clientName', 'clientPhone', 'clientEmail', 'pieceDesc', 'quoteDate', 'quoteNum']
    .forEach(id => document.getElementById(id).addEventListener('input', updateSummary));

  // Finishing
  document.getElementById('chkPrePolish').addEventListener('change', updateSummary);
  document.getElementById('chkPolish').addEventListener('change', updateSummary);
  document.getElementById('laborCost').addEventListener('input', updateSummary);

  // Enamel toggle
  document.getElementById('chkEnamel').addEventListener('change', function () {
    const item = this.closest('.finishing-item');
    item.classList.toggle('enamel-active', this.checked);
    document.getElementById('enamelAmt').style.display = this.checked ? 'flex' : 'none';
    updateSummary();
  });
  document.getElementById('enamelPrice').addEventListener('input', updateSummary);
  document.getElementById('enamelAmt').style.display = 'none';

  updateSummary();
});

/* ─────────────────────────────────────
   ADD METAL ROW
───────────────────────────────────── */
function addMetalRow() {
  const id = ++metalIdCounter;
  const row = document.createElement('div');
  row.className = 'metal-row';
  row.dataset.id = id;

  row.innerHTML = `
    <div class="q-group">
      <label>Metal Type</label>
      <select class="m-type">
        <option value="silver">Silver</option>
        <option value="10k">10K Gold</option>
        <option value="14k" selected>14K Gold</option>
        <option value="18k">18K Gold</option>
        <option value="platinum">Platinum</option>
      </select>
    </div>
    <div class="q-group">
      <label>Weight (g)</label>
      <input type="number" class="m-weight" placeholder="0.00" min="0" step="0.01" />
    </div>
    <div class="q-group">
      <label>Price / g ($)</label>
      <input type="number" class="m-priceg" value="125" min="0" step="0.01" />
    </div>
    <div class="q-group">
      <label>Total</label>
      <div class="row-total" id="mt-${id}">$0.00</div>
    </div>
    <button class="q-remove-btn" title="Remove"><i class="fa-solid fa-trash"></i></button>
  `;

  document.getElementById('metalRows').appendChild(row);

  row.querySelector('.m-type').addEventListener('change', function () {
    row.querySelector('.m-priceg').value = METAL_PRICES[this.value] ?? '';
    updateSummary();
  });
  row.querySelector('.m-weight').addEventListener('input', updateSummary);
  row.querySelector('.m-priceg').addEventListener('input', updateSummary);
  row.querySelector('.q-remove-btn').addEventListener('click', () => { row.remove(); updateSummary(); });
}

/* ─────────────────────────────────────
   ADD STONE ROW
───────────────────────────────────── */
function addStoneRow() {
  const id = ++stoneIdCounter;
  const row = document.createElement('div');
  row.className = 'stone-row';
  row.dataset.id = id;

  row.innerHTML = `
    <div class="stone-row-top">
      <div class="q-group">
        <label>Description</label>
        <input type="text" class="s-desc" placeholder="e.g. Center Stone — Oval VS1 Diamond" />
      </div>
      <button class="q-remove-btn" title="Remove"><i class="fa-solid fa-trash"></i></button>
    </div>
    <div class="stone-row-bottom">
      <div class="q-group">
        <label>Price / ct ($)</label>
        <input type="number" class="s-price" placeholder="0.00" min="0" step="0.01" />
      </div>
      <div class="q-group">
        <label>Carats</label>
        <input type="number" class="s-carats" placeholder="0.000" min="0" step="0.001" />
      </div>
      <div class="q-group">
        <label>Qty</label>
        <input type="number" class="s-qty" value="1" min="1" step="1" />
      </div>
      <div class="q-group">
        <label>Setting Type</label>
        <select class="s-setting">
          <option value="none">No Setting</option>
          <option value="big">Big Diamond — $40/stone</option>
          <option value="melee">Melee — $1/stone</option>
          <option value="fancy_melee">Fancy Melee — $5/stone</option>
        </select>
      </div>
      <div class="q-group">
        <label>Total</label>
        <div class="row-total" id="st-${id}">$0.00</div>
      </div>
    </div>
  `;

  document.getElementById('stoneRows').appendChild(row);

  row.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', updateSummary);
    el.addEventListener('change', updateSummary);
  });
  row.querySelector('.q-remove-btn').addEventListener('click', () => { row.remove(); updateSummary(); });
}

/* ─────────────────────────────────────
   UPDATE LIVE SUMMARY
───────────────────────────────────── */
function updateSummary() {
  let total = 0;
  const lines = [];

  // Client display
  document.getElementById('qs-name').textContent  = document.getElementById('clientName').value || 'Client Name';
  document.getElementById('qs-piece').textContent = document.getElementById('pieceDesc').value  || 'Piece Description';
  document.getElementById('qs-num').textContent   = document.getElementById('quoteNum').value   || '—';

  // ── Metal rows
  document.querySelectorAll('.metal-row').forEach(row => {
    const typeEl  = row.querySelector('.m-type');
    const weight  = parseFloat(row.querySelector('.m-weight').value) || 0;
    const priceG  = parseFloat(row.querySelector('.m-priceg').value) || 0;
    const rowTotal = weight * priceG;
    const id       = row.dataset.id;

    const el = document.getElementById(`mt-${id}`);
    if (el) el.textContent = fmt(rowTotal);

    if (rowTotal > 0) {
      const typeName = typeEl.options[typeEl.selectedIndex].text;
      lines.push({ cat: 'Metal', label: `${typeName} — ${weight}g × $${priceG}/g`, amount: rowTotal });
      total += rowTotal;
    }
  });

  // ── Stone rows
  document.querySelectorAll('.stone-row').forEach(row => {
    const desc      = row.querySelector('.s-desc').value || 'Stone';
    const priceCt   = parseFloat(row.querySelector('.s-price').value)  || 0;
    const carats    = parseFloat(row.querySelector('.s-carats').value) || 0;
    const qty       = parseInt(row.querySelector('.s-qty').value)      || 1;
    const settingEl = row.querySelector('.s-setting');
    const setting   = settingEl.value;
    const id        = row.dataset.id;

    const stoneCost   = priceCt * carats * qty;
    const settingCost = SETTING_PRICES[setting] * qty;
    const rowTotal    = stoneCost + settingCost;

    const el = document.getElementById(`st-${id}`);
    if (el) el.textContent = fmt(rowTotal);

    if (stoneCost > 0) {
      lines.push({ cat: 'Diamond / Stone', label: `${desc} — ${carats}ct × $${priceCt}/ct × ${qty}`, amount: stoneCost });
      total += stoneCost;
    }
    if (settingCost > 0) {
      const settingName = settingEl.options[settingEl.selectedIndex].text.split(' —')[0];
      lines.push({ cat: 'Setting', label: `${settingName} × ${qty} stone${qty > 1 ? 's' : ''}`, amount: settingCost });
      total += settingCost;
    }
  });

  // ── Finishing
  if (document.getElementById('chkPrePolish').checked) {
    lines.push({ cat: 'Finishing', label: 'Pre-Polishing & Cleaning', amount: 30 });
    total += 30;
  }
  if (document.getElementById('chkPolish').checked) {
    lines.push({ cat: 'Finishing', label: 'Polishing', amount: 30 });
    total += 30;
  }
  if (document.getElementById('chkEnamel').checked) {
    const amt = parseFloat(document.getElementById('enamelPrice').value) || 0;
    if (amt > 0) {
      lines.push({ cat: 'Finishing', label: 'Enamel Work', amount: amt });
      total += amt;
    }
  }

  // ── Labor
  const labor = parseFloat(document.getElementById('laborCost').value) || 0;
  if (labor > 0) {
    lines.push({ cat: 'Labor', label: 'Labor & Craftsmanship', amount: labor });
    total += labor;
  }

  // ── Render lines
  const container = document.getElementById('qs-lines');
  if (lines.length === 0) {
    container.innerHTML = '<p class="qs-empty">Add items on the left to see your quote breakdown.</p>';
  } else {
    container.innerHTML = lines.map(l => `
      <div class="qs-line">
        <div class="qs-line-label">
          <span class="qs-line-cat">${l.cat}</span>
          ${l.label}
        </div>
        <span class="qs-line-amount">${fmt(l.amount)}</span>
      </div>
    `).join('');
  }

  document.getElementById('qs-subtotal').textContent = fmt(total);
  document.getElementById('qs-total').textContent    = fmt(total);
}

/* ─────────────────────────────────────
   FORMAT CURRENCY
───────────────────────────────────── */
function fmt(n) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/* ─────────────────────────────────────
   GENERATE PDF (print window)
───────────────────────────────────── */
function generatePDF() {
  const clientName  = document.getElementById('clientName').value  || 'Client';
  const clientPhone = document.getElementById('clientPhone').value || '';
  const clientEmail = document.getElementById('clientEmail').value || '';
  const pieceDesc   = document.getElementById('pieceDesc').value   || '';
  const quoteDate   = document.getElementById('quoteDate').value;
  const quoteNum    = document.getElementById('quoteNum').value    || '';
  const notes       = document.getElementById('quoteNotes').value  || '';

  const formattedDate = quoteDate
    ? new Date(quoteDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const rows  = [];
  let   total = 0;

  // Metal
  document.querySelectorAll('.metal-row').forEach(row => {
    const typeEl  = row.querySelector('.m-type');
    const weight  = parseFloat(row.querySelector('.m-weight').value) || 0;
    const priceG  = parseFloat(row.querySelector('.m-priceg').value) || 0;
    const amt     = weight * priceG;
    if (amt > 0) {
      rows.push({ cat: 'Metal', desc: typeEl.options[typeEl.selectedIndex].text, detail: `${weight}g × $${priceG}/g`, amount: amt });
      total += amt;
    }
  });

  // Stones
  document.querySelectorAll('.stone-row').forEach(row => {
    const desc      = row.querySelector('.s-desc').value || 'Stone';
    const priceCt   = parseFloat(row.querySelector('.s-price').value)  || 0;
    const carats    = parseFloat(row.querySelector('.s-carats').value) || 0;
    const qty       = parseInt(row.querySelector('.s-qty').value)      || 1;
    const settingEl = row.querySelector('.s-setting');
    const setting   = settingEl.value;

    const stoneCost   = priceCt * carats * qty;
    const settingCost = SETTING_PRICES[setting] * qty;

    if (stoneCost > 0) {
      rows.push({ cat: 'Diamond / Stone', desc, detail: `${carats}ct × $${priceCt}/ct × ${qty} stone${qty > 1 ? 's' : ''}`, amount: stoneCost });
      total += stoneCost;
    }
    if (settingCost > 0) {
      const settingName = settingEl.options[settingEl.selectedIndex].text.split(' —')[0];
      rows.push({ cat: 'Setting', desc: `${settingName}`, detail: `${qty} stone${qty > 1 ? 's' : ''}`, amount: settingCost });
      total += settingCost;
    }
  });

  // Finishing
  if (document.getElementById('chkPrePolish').checked) {
    rows.push({ cat: 'Finishing', desc: 'Pre-Polishing & Cleaning', detail: '', amount: 30 });
    total += 30;
  }
  if (document.getElementById('chkPolish').checked) {
    rows.push({ cat: 'Finishing', desc: 'Polishing', detail: '', amount: 30 });
    total += 30;
  }
  if (document.getElementById('chkEnamel').checked) {
    const amt = parseFloat(document.getElementById('enamelPrice').value) || 0;
    if (amt > 0) {
      rows.push({ cat: 'Finishing', desc: 'Enamel Work', detail: '', amount: amt });
      total += amt;
    }
  }

  const labor = parseFloat(document.getElementById('laborCost').value) || 0;
  if (labor > 0) {
    rows.push({ cat: 'Labor', desc: 'Labor & Craftsmanship', detail: '', amount: labor });
    total += labor;
  }

  const tableRows = rows.map(r => `
    <tr>
      <td class="td-cat">${r.cat}</td>
      <td class="td-desc">
        <strong>${r.desc}</strong>
        ${r.detail ? `<br><span class="detail">${r.detail}</span>` : ''}
      </td>
      <td class="td-amt">${fmtPdf(r.amount)}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Quote ${quoteNum} — ${clientName}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Georgia, serif; font-size: 11pt; color: #1a1a1a; background: #fff; }
    .page { max-width: 760px; margin: 0 auto; padding: 48px 40px; }

    /* ── Header ── */
    .doc-header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:20px; border-bottom:2px solid #c9a96e; margin-bottom:28px; }
    .brand-name { font-size:20pt; font-weight:400; letter-spacing:0.03em; }
    .brand-sub  { font-size:7pt; letter-spacing:0.3em; text-transform:uppercase; color:#c9a96e; margin-top:4px; }
    .quote-label { text-align:right; }
    .quote-label h2 { font-size:22pt; font-weight:400; color:#c9a96e; letter-spacing:0.1em; }
    .quote-label p  { font-size:8pt; color:#888; margin-top:4px; }

    /* ── Client + From ── */
    .parties { display:flex; justify-content:space-between; margin-bottom:24px; }
    .party-block h4 { font-size:7pt; letter-spacing:0.25em; text-transform:uppercase; color:#c9a96e; margin-bottom:8px; }
    .party-block .name { font-size:12pt; font-weight:bold; margin-bottom:3px; }
    .party-block p { font-size:9pt; color:#555; margin-bottom:2px; }
    .party-right { text-align:right; }

    /* ── Piece ── */
    .piece-bar { background:#f9f5ef; border-left:3px solid #c9a96e; padding:10px 14px; margin-bottom:24px; }
    .piece-bar label { font-size:7pt; letter-spacing:0.25em; text-transform:uppercase; color:#c9a96e; display:block; margin-bottom:4px; }
    .piece-bar p { font-size:11pt; }

    /* ── Table ── */
    table { width:100%; border-collapse:collapse; }
    thead tr { background:#1a1a1a; }
    thead th { color:#c9a96e; font-size:7pt; letter-spacing:0.18em; text-transform:uppercase; padding:9px 12px; text-align:left; font-weight:600; }
    thead th.th-amt { text-align:right; }
    tbody tr { border-bottom:1px solid #eeeeee; }
    tbody tr:nth-child(even) { background:#fafafa; }
    td { padding:9px 12px; vertical-align:top; }
    .td-cat  { font-size:7pt; letter-spacing:0.12em; text-transform:uppercase; color:#c9a96e; width:100px; padding-top:11px; }
    .td-desc strong { font-size:10pt; font-weight:600; }
    .td-desc .detail { font-size:8.5pt; color:#777; display:block; margin-top:2px; }
    .td-amt  { text-align:right; font-weight:700; font-size:10pt; width:110px; }

    /* ── Total ── */
    .total-wrap { margin-top:0; border-top:2px solid #1a1a1a; padding-top:0; }
    .total-row-outer { display:flex; justify-content:flex-end; }
    .total-box { width:260px; }
    .total-grand { display:flex; justify-content:space-between; align-items:center; background:#1a1a1a; color:#fff; padding:12px 16px; }
    .total-grand .label { font-size:8pt; letter-spacing:0.2em; text-transform:uppercase; }
    .total-grand .value { font-size:16pt; color:#c9a96e; font-weight:700; }

    /* ── Notes ── */
    .notes { margin-top:28px; border:1px solid #e0d5c5; padding:14px 16px; }
    .notes h4 { font-size:7pt; letter-spacing:0.25em; text-transform:uppercase; color:#c9a96e; margin-bottom:8px; }
    .notes p  { font-size:9.5pt; color:#555; line-height:1.7; }

    /* ── Footer ── */
    .doc-footer { margin-top:36px; padding-top:16px; border-top:1px solid #ddd; display:flex; justify-content:space-between; align-items:flex-end; }
    .doc-footer .validity { font-size:8pt; color:#999; line-height:1.6; }
    .doc-footer .tagline  { font-style:italic; font-size:9pt; color:#c9a96e; }

    @media print {
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      .page { padding:24px; }
    }
  </style>
</head>
<body>
<div class="page">

  <div class="doc-header">
    <div>
      <div class="brand-name">Custom By Thu Win</div>
      <div class="brand-sub">Luxury Bespoke Jewelry</div>
    </div>
    <div class="quote-label">
      <h2>QUOTE</h2>
      <p># ${quoteNum}</p>
      <p>${formattedDate}</p>
    </div>
  </div>

  <div class="parties">
    <div class="party-block">
      <h4>Prepared For</h4>
      <div class="name">${clientName}</div>
      ${clientPhone ? `<p>${clientPhone}</p>` : ''}
      ${clientEmail ? `<p>${clientEmail}</p>` : ''}
    </div>
    <div class="party-block party-right">
      <h4>From</h4>
      <div class="name">Custom By Thu Win</div>
      <p>info@custombythuwin.com</p>
      <p>+1 (917) 807-9323</p>
    </div>
  </div>

  ${pieceDesc ? `
  <div class="piece-bar">
    <label>Piece Description</label>
    <p>${pieceDesc}</p>
  </div>` : ''}

  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Description</th>
        <th class="th-amt">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows || '<tr><td colspan="3" style="text-align:center;color:#999;padding:20px;">No items added.</td></tr>'}
    </tbody>
  </table>

  <div class="total-wrap">
    <div class="total-row-outer">
      <div class="total-box">
        <div class="total-grand">
          <span class="label">Total</span>
          <span class="value">${fmtPdf(total)}</span>
        </div>
      </div>
    </div>
  </div>

  ${notes ? `
  <div class="notes">
    <h4>Notes</h4>
    <p>${notes.replace(/\n/g, '<br>')}</p>
  </div>` : ''}

  <div class="doc-footer">
    <div class="validity">
      This quote is valid for 30 days from the date above.<br>
      Final price may vary based on material availability and specifications.
    </div>
    <div class="tagline">Your vision. Our craft. A treasure forever.</div>
  </div>

</div>
<script>window.onload = () => { window.focus(); window.print(); };<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
}

function fmtPdf(n) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
