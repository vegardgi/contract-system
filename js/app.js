/* ═══════════════════════════════════════════════════════════
   ContractFlow – Main App
   ═══════════════════════════════════════════════════════════ */

const TEMPLATES = {
  service: {
    title: 'Tjenesteavtale',
    html: `<h2>Tjenesteavtale</h2>
<p>Denne avtalen er inngått mellom <strong>[Leverandørens navn]</strong> ("Leverandøren") og <strong>[Kundens navn]</strong> ("Kunden").</p>

<h3>1. Tjenestens omfang</h3>
<p>Leverandøren forplikter seg til å levere følgende tjenester:</p>
<ul>
  <li>[Beskriv tjeneste 1]</li>
  <li>[Beskriv tjeneste 2]</li>
  <li>[Beskriv tjeneste 3]</li>
</ul>

<h3>2. Vederlag og betaling</h3>
<p>Kunden betaler <strong>[beløp] kr</strong> for tjenestene beskrevet over. Betaling forfaller <strong>[antall] dager</strong> etter fakturadato.</p>

<h3>3. Avtalens varighet</h3>
<p>Avtalen gjelder fra <strong>[startdato]</strong> og løper til <strong>[sluttdato]</strong>, med mindre den sies opp av en av partene med <strong>[antall] dagers</strong> skriftlig varsel.</p>

<h3>4. Ansvar og garanti</h3>
<p>Leverandøren garanterer at tjenestene vil bli utført på en faglig forsvarlig måte. Leverandøren er ikke ansvarlig for indirekte tap eller følgeskader.</p>

<h3>5. Konfidensialitet</h3>
<p>Begge parter forplikter seg til å behandle all informasjon om den andre parten som konfidensiell, og ikke dele denne med tredjeparter uten skriftlig samtykke.</p>

<h3>6. Tvister</h3>
<p>Tvister som måtte oppstå i forbindelse med denne avtalen skal søkes løst i minnelighet. Dersom dette ikke lykkes, avgjøres tvisten ved de ordinære domstoler med <strong>[by]</strong> tingrett som verneting.</p>`
  },
  nda: {
    title: 'Taushetserklæring (NDA)',
    html: `<h2>Taushetserklæring</h2>
<p>Denne taushetserklæringen er inngått mellom <strong>[Part A]</strong> og <strong>[Part B]</strong> (samlet "Partene").</p>

<h3>1. Formål</h3>
<p>Partene ønsker å utveksle konfidensiell informasjon i forbindelse med <strong>[beskrivelse av samarbeid/formål]</strong>. Denne erklæringen regulerer bruken og beskyttelsen av slik informasjon.</p>

<h3>2. Konfidensiell informasjon</h3>
<p>Med "Konfidensiell informasjon" menes all informasjon som en part deler med den andre parten, enten muntlig, skriftlig eller elektronisk, som er merket som konfidensiell eller som etter sin art burde forstås å være konfidensiell.</p>

<h3>3. Forpliktelser</h3>
<p>Partene forplikter seg til å:</p>
<ul>
  <li>Ikke avsløre konfidensiell informasjon til tredjeparter</li>
  <li>Kun bruke informasjonen til avtalte formål</li>
  <li>Beskytte informasjonen med rimelige sikkerhetstiltak</li>
  <li>Umiddelbart varsle den andre parten ved mistanke om sikkerhetsbrudd</li>
</ul>

<h3>4. Varighet</h3>
<p>Taushetsplikten gjelder i <strong>[antall] år</strong> fra avtalens inngåelse, uavhengig av om partenes samarbeid avsluttes.</p>

<h3>5. Unntak</h3>
<p>Taushetsplikten gjelder ikke for informasjon som er allment kjent, som mottakeren allerede hadde, eller som kreves utlevert etter lovgivning eller rettslig pålegg.</p>`
  },
  freelance: {
    title: 'Frilanskontrakt',
    html: `<h2>Frilanskontrakt</h2>
<p>Denne kontrakten er inngått mellom <strong>[Oppdragsgiver]</strong> ("Oppdragsgiver") og <strong>[Frilansers navn]</strong> ("Frilanser").</p>

<h3>1. Oppdraget</h3>
<p>Frilanser skal utføre følgende oppdrag:</p>
<ul>
  <li>[Beskriv arbeidsoppgave 1]</li>
  <li>[Beskriv arbeidsoppgave 2]</li>
</ul>

<h3>2. Leveranser og tidsplan</h3>
<ul>
  <li><strong>[Leveranse 1]</strong> – Frist: [dato]</li>
  <li><strong>[Leveranse 2]</strong> – Frist: [dato]</li>
</ul>

<h3>3. Honorar</h3>
<p>Frilanser mottar <strong>[timepris/fastpris] kr</strong> for oppdraget. Faktura sendes etter fullført leveranse med <strong>14 dagers</strong> betalingsfrist.</p>

<h3>4. Opphavsrett</h3>
<p>Alt arbeid levert under denne kontrakten tilfaller Oppdragsgiver etter full betaling. Frilanser beholder retten til å vise arbeidet i portefølje med Oppdragsgivers samtykke.</p>

<h3>5. Selvstendig oppdragstaker</h3>
<p>Frilanser er en selvstendig oppdragstaker og er ikke ansatt av Oppdragsgiver. Frilanser er ansvarlig for egne skatter og avgifter.</p>

<h3>6. Konfidensialitet</h3>
<p>Frilanser forplikter seg til å behandle all informasjon om Oppdragsgiver og dennes kunder som strengt konfidensiell.</p>`
  }
};

/* ─── Template persistence (localStorage) ───────────────────── */
(function loadSavedTemplates() {
  try {
    const saved = JSON.parse(localStorage.getItem('pp_templates') || '{}');
    Object.keys(saved).forEach(key => {
      if (TEMPLATES[key]) {
        if (saved[key].title) TEMPLATES[key].title = saved[key].title;
        if (saved[key].html)  TEMPLATES[key].html  = saved[key].html;
      }
    });
  } catch (e) {}
})();

/* ─── State ──────────────────────────────────────────────────── */
let state = {
  contracts:      [],
  currentId:      null,   // null = new (not yet saved to API)
  currentFilter:  'all',
  deleteTargetId: null,
};

/* ─── Helpers ────────────────────────────────────────────────── */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${name}`)?.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let toastTimer;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast show' + (type ? ` toast--${type}` : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('no-NO', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function excerpt(html, len = 100) {
  const tmp  = document.createElement('div');
  tmp.innerHTML = html;
  const text = (tmp.textContent || '').replace(/\s+/g, ' ').trim();
  return text.length > len ? text.slice(0, len) + '…' : text;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => fallbackCopy(text)) ?? fallbackCopy(text);
}
function fallbackCopy(text) {
  const ta = Object.assign(document.createElement('textarea'), {
    value: text, style: 'position:fixed;opacity:0'
  });
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function buildSigningLink(id) {
  const base = window.location.href.replace(/\/[^/]*$/, '');
  return `${base}/sign.html?id=${id}`;
}

/* ─── Dashboard ──────────────────────────────────────────────── */
async function renderDashboard() {
  try {
    state.contracts = await api.list();
  } catch {
    showToast('Kunne ikke koble til serveren', 'danger');
    state.contracts = [];
  }

  const grid     = document.getElementById('contracts-grid');
  const emptyEl  = document.getElementById('empty-state');
  const filtered = state.currentFilter === 'all'
    ? state.contracts
    : state.contracts.filter(c => c.status === state.currentFilter);

  document.getElementById('stat-total').textContent  = state.contracts.length;
  document.getElementById('stat-sent').textContent   = state.contracts.filter(c => c.status === 'sent').length;
  document.getElementById('stat-signed').textContent = state.contracts.filter(c => c.status === 'signed').length;

  [...grid.children].forEach(ch => { if (ch.id !== 'empty-state') ch.remove(); });

  if (filtered.length === 0) { emptyEl.style.display = ''; return; }
  emptyEl.style.display = 'none';

  [...filtered]
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach(c => grid.appendChild(createCard(c)));
}

function createCard(c) {
  const card = document.createElement('div');
  card.className = `contract-card contract-card--${c.status}`;
  card.dataset.id = c.id;

  const badgeText = { draft: 'Utkast', sent: 'Sendt', signed: 'Signert' }[c.status];
  const snippet   = c.content ? excerpt(c.content) : 'Tomt innhold';

  const recipientInfo = c.recipient?.name
    ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-top:6px;display:flex;align-items:center;gap:5px">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M1 11c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        ${escapeHtml(c.recipient.name)}
       </div>`
    : '';

  const signedInfo = c.status === 'signed'
    ? `<div style="display:flex;align-items:center;gap:5px;font-size:0.78rem;color:var(--success);margin-top:6px">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.5" stroke="currentColor" stroke-width="1.2"/><path d="M3.5 6l2 2 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Signert ${formatDate(c.signedAt)}
       </div>`
    : '';

  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">${escapeHtml(c.title || 'Uten tittel')}</div>
      <span class="badge badge--${c.status}">${badgeText}</span>
    </div>
    <div class="card-body">${snippet}${recipientInfo}${signedInfo}</div>
    <div class="card-footer">
      <span class="card-date">${formatDate(c.createdAt)}</span>
      <div class="card-actions">
        ${c.status !== 'signed' ? `<button class="card-btn" data-action="edit" title="Rediger">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10l1-3 7-7 2 2-7 7-3 1z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
        </button>` : ''}
        ${c.status === 'draft' ? `<button class="card-btn" data-action="send" title="Send">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 12l1.5-4.5L11 2l1 1-8 6.5-3 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
        </button>` : ''}
        ${c.status === 'sent' ? `<button class="card-btn" data-action="copy-link" title="Kopier signeringslenke">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 7a3 3 0 004.2-.2l1.4-1.3a3 3 0 00-4.2-4.3L5.6 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M9 7a3 3 0 00-4.2.2L3.4 8.6a3 3 0 004.2 4.3l.8-.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        </button>` : ''}
        <button class="card-btn card-btn--danger" data-action="delete" title="Slett">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V3h4v1M5.5 7v3M8.5 7v3M3 4l.7 8a1 1 0 001 .9h4.6a1 1 0 001-.9L11 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>`;

  card.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (btn) { e.stopPropagation(); handleCardAction(btn.dataset.action, c.id); return; }
    handleCardAction('edit', c.id);
  });

  return card;
}

function handleCardAction(action, id) {
  const contract = state.contracts.find(c => c.id === id);
  if (!contract) return;

  if      (action === 'edit')      openEditor(id);
  else if (action === 'send')      openSend(id);
  else if (action === 'copy-link') {
    copyToClipboard(buildSigningLink(id));
    showToast('Signeringslenke kopiert!', 'success');
  } else if (action === 'delete') {
    state.deleteTargetId = id;
    document.getElementById('modal-overlay').style.display = 'flex';
  }
}

/* ─── Editor ─────────────────────────────────────────────────── */
async function openEditor(id) {
  let contract;

  if (id) {
    try {
      contract = await api.get(id);
    } catch {
      showToast('Kunne ikke åpne kontrakt', 'danger');
      return;
    }
    state.currentId = id;
  } else {
    // New: don't create in API yet — wait until save
    state.currentId = null;
    contract = { title: '', content: '', status: 'draft', createdAt: Date.now() };
  }

  document.getElementById('contract-title').value      = contract.title || '';
  document.getElementById('editor-content').innerHTML  =
    contract.content || '<p>Start med å skrive kontraktsteksten din her, eller velg en mal fra sidepanelet.</p>';
  document.getElementById('editor-content').contentEditable =
    contract.status === 'signed' ? 'false' : 'true';

  const badge = document.getElementById('editor-status-badge');
  badge.className   = `badge badge--${contract.status}`;
  badge.textContent = { draft: 'Utkast', sent: 'Sendt', signed: 'Signert' }[contract.status];

  document.getElementById('editor-created').textContent  = formatDate(contract.createdAt);
  document.getElementById('btn-proceed-send').style.display = contract.status === 'signed' ? 'none' : '';

  // Sidebar link + PDF sections
  const linkSection = document.getElementById('sidebar-link-section');
  const pdfSection  = document.getElementById('sidebar-pdf-section');
  const isSentOrSigned = contract.status === 'sent' || contract.status === 'signed';
  linkSection.style.display = isSentOrSigned ? '' : 'none';
  pdfSection.style.display  = contract.status === 'signed' ? '' : 'none';

  // Wire copy-link button
  document.getElementById('btn-editor-copy-link').onclick = () => {
    copyToClipboard(buildSigningLink(contract.id));
    showToast('Signeringslenke kopiert!', 'success');
  };

  // Wire PDF button
  document.getElementById('btn-editor-pdf').onclick = function () {
    downloadAdminPdf(contract, this);
  };

  // Signature block
  const sigBlock = document.getElementById('signature-block');
  if (contract.status === 'signed' && contract.signature?.data) {
    document.getElementById('sig-signer-name').textContent  = contract.recipient?.name  || '—';
    document.getElementById('sig-signed-date').textContent  = new Date(contract.signedAt).toLocaleDateString('no-NO', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    document.getElementById('sig-sender-date').textContent  = contract.sentAt
      ? new Date(contract.sentAt).toLocaleDateString('no-NO', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—';
    document.getElementById('sig-image').src = contract.signature.data;
    sigBlock.style.display = 'block';
  } else {
    sigBlock.style.display = 'none';
  }

  showPage('editor');
}

async function saveCurrentDraft() {
  const title   = document.getElementById('contract-title').value.trim() || 'Uten tittel';
  const content = document.getElementById('editor-content').innerHTML;

  try {
    let contract;
    if (state.currentId === null) {
      contract       = await api.create({ title, content });
      state.currentId = contract.id;
    } else {
      contract = await api.update(state.currentId, { title, content });
    }
    return contract;
  } catch {
    showToast('Kunne ikke lagre kontrakt', 'danger');
    throw new Error('save failed');
  }
}

/* ─── Send ───────────────────────────────────────────────────── */
async function openSend(id) {
  try {
    await saveCurrentDraft();
  } catch { return; }

  state.currentId = id ?? state.currentId;

  document.getElementById('recipient-name').value  = '';
  document.getElementById('link-result').style.display = 'none';
  document.getElementById('err-name').textContent  = '';
  document.getElementById('btn-generate-link').textContent = 'Generer signeringslenke';

  // Pre-fill if already sent
  const contract = state.contracts.find(c => c.id === state.currentId);
  if (contract?.recipient) {
    document.getElementById('recipient-name').value = contract.recipient.name || '';
    if (contract.status === 'sent') showLinkResult(state.currentId);
  }

  showPage('send');
}

function showLinkResult(id) {
  document.getElementById('signing-link-text').textContent = buildSigningLink(id);
  document.getElementById('link-result').style.display     = 'block';
  document.getElementById('btn-generate-link').textContent = 'Regenerer lenke';
}

/* ─── Password gate ──────────────────────────────────────────── */
const CF_PASSWORD    = 'bEkre9-wocmon-bewhep';
const CF_SESSION_KEY = 'cf_auth';

function initPasswordGate(onUnlock) {
  if (sessionStorage.getItem(CF_SESSION_KEY) === '1') {
    document.getElementById('pw-gate').style.display = 'none';
    return; // already authenticated — onUnlock not needed
  }

  // Hide app, show gate
  document.getElementById('pw-gate').style.display   = 'flex';
  document.querySelector('.header').style.visibility = 'hidden';
  document.querySelector('.main').style.visibility   = 'hidden';

  const input  = document.getElementById('pw-input');
  const errEl  = document.getElementById('pw-error');
  const submit = document.getElementById('pw-submit');

  function tryLogin() {
    if (input.value === CF_PASSWORD) {
      sessionStorage.setItem(CF_SESSION_KEY, '1');
      document.getElementById('pw-gate').style.display   = 'none';
      document.querySelector('.header').style.visibility = '';
      document.querySelector('.main').style.visibility   = '';
      onUnlock();
    } else {
      errEl.textContent = 'Feil passord. Prøv igjen.';
      input.value = '';
      input.focus();
      input.classList.add('pw-input--shake');
      setTimeout(() => input.classList.remove('pw-input--shake'), 500);
    }
  }

  submit.addEventListener('click', tryLogin);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
  setTimeout(() => input.focus(), 50);
}

/* ─── Init ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Register all event listeners immediately (regardless of auth state)
  setupEventListeners();

  // Then handle password gate — passes renderDashboard as the unlock callback
  initPasswordGate(renderDashboard);

  // If already authenticated, load dashboard right away
  if (sessionStorage.getItem(CF_SESSION_KEY) === '1') {
    renderDashboard();
  }
});

function setupEventListeners() {

  /* New contract */
  document.getElementById('btn-new-contract').addEventListener('click', () => openEditor(null));
  document.getElementById('btn-empty-new').addEventListener('click',    () => openEditor(null));

  /* Back buttons */
  document.getElementById('btn-back-dashboard').addEventListener('click', async () => {
    await renderDashboard();
    showPage('dashboard');
  });
  document.getElementById('btn-back-editor').addEventListener('click', () => showPage('editor'));

  /* Save draft */
  document.getElementById('btn-save-draft').addEventListener('click', async () => {
    await saveCurrentDraft();
    showToast('Utkast lagret', 'success');
    renderDashboard();
  });

  /* Proceed to send */
  document.getElementById('btn-proceed-send').addEventListener('click', () => openSend(null));

  /* Toolbar */
  document.querySelectorAll('.tool-btn[data-cmd]').forEach(btn => {
    btn.addEventListener('mousedown', e => { e.preventDefault(); document.execCommand(btn.dataset.cmd, false, null); });
  });
  document.getElementById('heading-select').addEventListener('change', function () {
    document.execCommand('formatBlock', false, this.value || 'p');
    this.value = '';
    document.getElementById('editor-content').focus();
  });

  /* Templates */
  document.querySelectorAll('.template-btn[data-template]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tpl = TEMPLATES[btn.dataset.template];
      if (!tpl) return;
      if (document.getElementById('editor-content').textContent.trim().length > 10) {
        if (!confirm('Dette vil erstatte det eksisterende innholdet. Vil du fortsette?')) return;
      }
      document.getElementById('contract-title').value         = tpl.title;
      document.getElementById('editor-content').innerHTML     = tpl.html;
      showToast('Mal lastet inn');
    });
  });

  /* Template editor modal */
  const TPL_DEFAULTS = JSON.parse(JSON.stringify(
    { service: { title: TEMPLATES.service.title, html: TEMPLATES.service.html },
      nda:     { title: TEMPLATES.nda.title,     html: TEMPLATES.nda.html     },
      freelance:{ title: TEMPLATES.freelance.title, html: TEMPLATES.freelance.html } }
  ));
  let tplModalKey = 'service';

  function openTplModal(key) {
    tplModalKey = key || 'service';
    document.querySelectorAll('.tpl-tab').forEach(t => t.classList.toggle('active', t.dataset.tpl === tplModalKey));
    document.getElementById('tpl-title-input').value = TEMPLATES[tplModalKey].title;
    document.getElementById('tpl-content-editor').innerHTML = TEMPLATES[tplModalKey].html;
    document.getElementById('tpl-modal-overlay').style.display = 'flex';
    document.getElementById('tpl-title-input').focus();
  }

  document.getElementById('btn-edit-templates').addEventListener('click', () => openTplModal('service'));
  document.getElementById('btn-close-tpl-modal').addEventListener('click', () => {
    document.getElementById('tpl-modal-overlay').style.display = 'none';
  });
  document.getElementById('tpl-modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('tpl-modal-overlay'))
      document.getElementById('tpl-modal-overlay').style.display = 'none';
  });

  document.querySelectorAll('.tpl-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // Save current before switching
      TEMPLATES[tplModalKey].title = document.getElementById('tpl-title-input').value.trim() || TEMPLATES[tplModalKey].title;
      TEMPLATES[tplModalKey].html  = document.getElementById('tpl-content-editor').innerHTML;
      openTplModal(tab.dataset.tpl);
    });
  });

  document.getElementById('btn-tpl-save').addEventListener('click', () => {
    const title = document.getElementById('tpl-title-input').value.trim();
    const html  = document.getElementById('tpl-content-editor').innerHTML;
    if (!title) { showToast('Tittel kan ikke være tom', 'error'); return; }
    TEMPLATES[tplModalKey].title = title;
    TEMPLATES[tplModalKey].html  = html;
    // Update sidebar button label
    const sidebarBtn = document.querySelector(`.template-btn[data-template="${tplModalKey}"]`);
    if (sidebarBtn) sidebarBtn.lastChild.textContent = ' ' + title;
    // Persist to localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('pp_templates') || '{}');
      saved[tplModalKey] = { title, html };
      localStorage.setItem('pp_templates', JSON.stringify(saved));
    } catch (e) {}
    showToast('Mal lagret', 'success');
    document.getElementById('tpl-modal-overlay').style.display = 'none';
  });

  document.getElementById('btn-tpl-reset').addEventListener('click', () => {
    if (!confirm('Tilbakestille til standard innhold?')) return;
    TEMPLATES[tplModalKey].title = TPL_DEFAULTS[tplModalKey].title;
    TEMPLATES[tplModalKey].html  = TPL_DEFAULTS[tplModalKey].html;
    document.getElementById('tpl-title-input').value = TPL_DEFAULTS[tplModalKey].title;
    document.getElementById('tpl-content-editor').innerHTML = TPL_DEFAULTS[tplModalKey].html;
    // Remove from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('pp_templates') || '{}');
      delete saved[tplModalKey];
      localStorage.setItem('pp_templates', JSON.stringify(saved));
    } catch (e) {}
    showToast('Mal tilbakestilt');
  });

  /* Filter */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentFilter = btn.dataset.filter;
      renderDashboard();
    });
  });

  /* Send form */
  document.getElementById('send-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('recipient-name').value.trim();
    document.getElementById('err-name').textContent = '';
    if (!name) { document.getElementById('err-name').textContent = 'Vennligst skriv inn kundens navn.'; return; }

    try {
      await api.update(state.currentId, {
        status: 'sent', recipientName: name,
      });
      await renderDashboard();
      showLinkResult(state.currentId);
      showToast('Signeringslenke generert!', 'success');
    } catch {
      showToast('Kunne ikke oppdatere kontrakten', 'danger');
    }
  });

  /* Copy link */
  document.getElementById('btn-copy-link').addEventListener('click', function () {
    copyToClipboard(document.getElementById('signing-link-text').textContent);
    this.textContent = 'Kopiert!';
    this.classList.add('copied');
    setTimeout(() => {
      this.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.4"/><path d="M5 3V2a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-1" stroke="currentColor" stroke-width="1.4"/></svg> Kopier`;
      this.classList.remove('copied');
    }, 2000);
    showToast('Lenke kopiert!', 'success');
  });

  /* Delete modal */
  document.getElementById('btn-cancel-delete').addEventListener('click', () => {
    document.getElementById('modal-overlay').style.display = 'none';
    state.deleteTargetId = null;
  });
  document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
    if (!state.deleteTargetId) return;
    try {
      await api.remove(state.deleteTargetId);
      await renderDashboard();
      showToast('Kontrakt slettet', 'danger');
    } catch {
      showToast('Kunne ikke slette kontrakt', 'danger');
    }
    document.getElementById('modal-overlay').style.display = 'none';
    state.deleteTargetId = null;
  });
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      e.currentTarget.style.display = 'none';
      state.deleteTargetId = null;
    }
  });

  /* Auto-save title */
  document.getElementById('contract-title').addEventListener('input', debounce(async () => {
    if (state.currentId !== null) await saveCurrentDraft();
  }, 1000));
} // end setupEventListeners

/* ─── Sender signature image loader ─────────────────────────── */
async function getSenderSigDataUrl() {
  if (window._senderSigCache) return window._senderSigCache;
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      window._senderSigCache = canvas.toDataURL('image/png');
      resolve(window._senderSigCache);
    };
    img.onerror = () => resolve(null);
    img.src = 'sign2.png';
  });
}

/* ─── Admin PDF download ─────────────────────────────────────── */
async function downloadAdminPdf(c, btn) {
  const origHTML = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="animation:spin 0.8s linear infinite"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5" stroke-dasharray="14 8"/></svg> Genererer…`;
  }

  try {
    const recipientName = c.recipient?.name || '—';
    const signedDate = c.signedAt
      ? new Date(c.signedAt).toLocaleDateString('no-NO', {
          day: 'numeric', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      : '—';
    const sigDataUrl = c.signature?.data || null;

    // Preload customer signature + sender signature image for html2canvas
    const [senderSigUrl] = await Promise.all([
      getSenderSigDataUrl(),
      sigDataUrl ? new Promise(r => { const p = new Image(); p.onload = r; p.onerror = r; p.src = sigDataUrl; }) : Promise.resolve(),
    ]);

    const wrap = document.createElement('div');
    wrap.style.cssText = [
      'position:fixed','left:-9999px','top:0',
      'width:794px','background:#fff',
      'font-family:Arial,Helvetica,sans-serif',
      'font-size:13px','line-height:1.65',
      'color:#2C1A0E','padding:52px 64px 64px',
    ].join(';');

    wrap.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;
                  padding-bottom:18px;border-bottom:2.5px solid #C8562A;margin-bottom:32px">
        <div style="display:flex;align-items:center;gap:9px">
          <div style="width:30px;height:30px;background:#FDF0EA;border-radius:6px;
                      display:flex;align-items:center;justify-content:center">
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
              <path d="M4 2h10l4 4v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"
                    fill="#C8562A" opacity="0.25"/>
              <path d="M14 2l4 4h-3a1 1 0 01-1-1V2z" fill="#C8562A"/>
              <path d="M4 2h10l4 4v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"
                    stroke="#C8562A" stroke-width="1.5" fill="none"/>
            </svg>
          </div>
          <span style="font-size:0.9rem;font-weight:700;letter-spacing:-0.01em">
            Pizzapappa – kontraktsignering
          </span>
        </div>
        <span style="font-size:0.65rem;font-weight:700;text-transform:uppercase;
                     letter-spacing:0.1em;color:#5A8330;background:#EDF4E3;
                     border:1px solid rgba(90,131,48,0.2);padding:4px 11px;border-radius:100px">
          ✓ Signert
        </span>
      </div>

      <h1 style="font-size:1.6rem;font-weight:800;letter-spacing:-0.03em;
                 margin-bottom:24px;line-height:1.2">
        ${String(c.title || 'Uten tittel').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
      </h1>

      <div style="margin-bottom:36px;font-size:13px;line-height:1.7;color:#2C1A0E">
        ${c.content || ''}
      </div>

      <!-- Dual signature block -->
      <div style="border-top:2px dashed #F0C4A8;padding-top:22px">
        <div style="display:flex;align-items:center;gap:7px;font-size:0.62rem;
                    font-weight:700;text-transform:uppercase;letter-spacing:0.1em;
                    color:#C8562A;margin-bottom:18px">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M2 12l1.5-4.5L12 1l3 3-8.5 7.5L2 12z"
                  stroke="#C8562A" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
          Signaturer
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;border:1.5px solid #F0C4A8;border-radius:10px;overflow:hidden">

          <!-- Customer -->
          <div style="padding:18px 22px;border-right:1px solid #F0C4A8">
            <div style="font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#B89080;margin-bottom:10px">Kunde</div>
            <div style="margin-bottom:4px">
              <div style="font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#B89080">Signert av</div>
              <div style="font-size:0.85rem;font-weight:600;margin-top:2px">${recipientName.replace(/</g,'&lt;')}</div>
            </div>
            <div style="margin-bottom:14px">
              <div style="font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#B89080">Dato</div>
              <div style="font-size:0.85rem;font-weight:600;margin-top:2px">${signedDate}</div>
            </div>
            ${sigDataUrl
              ? `<div style="background:#FDFAF6;border:1.5px solid #F0DDD0;border-radius:7px;padding:10px 14px;display:inline-block;width:244px;height:80px;background-image:url('${sigDataUrl}');background-size:contain;background-repeat:no-repeat;background-position:left center;"></div>`
              : ''}
          </div>

          <!-- Sender -->
          <div style="padding:18px 22px;background:#FDFAF6">
            <div style="font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#B89080;margin-bottom:10px">Pizzapappa v/Vegard Giskehaug</div>
            <div style="margin-bottom:4px">
              <div style="font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#B89080">Signert av</div>
              <div style="font-size:0.85rem;font-weight:600;margin-top:2px">Vegard Giskehaug</div>
            </div>
            <div style="margin-bottom:14px">
              <div style="font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#B89080">Dato</div>
              <div style="font-size:0.85rem;font-weight:600;margin-top:2px">${c.sentAt ? new Date(c.sentAt).toLocaleDateString('no-NO',{day:'numeric',month:'long',year:'numeric'}) : '—'}</div>
            </div>
            ${senderSigUrl
              ? `<div style="width:180px;height:68px;background-image:url('${senderSigUrl}');background-size:contain;background-repeat:no-repeat;background-position:left center;"></div>`
              : `<div style="font-size:0.9rem;font-weight:600;color:#2C1A0E">Vegard Giskehaug</div>`}
          </div>

        </div>
      </div>

      <div style="margin-top:32px;padding-top:14px;border-top:1px solid #E8DDD4;
                  font-size:0.65rem;color:#B89080;display:flex;justify-content:space-between">
        <span>Pizzapappa – kontraktsignering</span>
        <span>Signert: ${signedDate}</span>
      </div>
    `;

    document.body.appendChild(wrap);

    // Give browser time to paint background-image before html2canvas captures
    await new Promise(r => setTimeout(r, 120));

    const canvas = await html2canvas(wrap, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
    });
    document.body.removeChild(wrap);

    const { jsPDF } = window.jspdf;
    const pdf  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pgW  = pdf.internal.pageSize.getWidth();
    const pgH  = pdf.internal.pageSize.getHeight();
    const imgW = pgW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let srcY = 0, page = 0;
    while (srcY < imgH) {
      if (page > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG',
        0, -srcY, imgW, imgH, '', 'FAST');
      srcY += pgH;
      page++;
    }

    const safeName = (c.title || 'kontrakt')
      .replace(/[^\w\sæøåÆØÅ-]/g, '').trim() || 'kontrakt';
    pdf.save(`${safeName}.pdf`);

  } catch (err) {
    console.error(err);
    showToast('Kunne ikke generere PDF', 'danger');
  }

  if (btn) { btn.disabled = false; btn.innerHTML = origHTML; }
}

/* ─── Spin keyframe for PDF button ──────────────────────────── */
(function () {
  const s = document.createElement('style');
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
})();
