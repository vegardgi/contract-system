/* ═══════════════════════════════════════════════════════════
   ContractFlow – Main App
   ═══════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'contractflow_v1';

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
<p>Følgende leveranser skal ferdigstilles:</p>
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

/* ─── State ──────────────────────────────────────────────────── */
let state = {
  contracts:      [],
  currentId:      null,   // id of contract being edited/sent
  currentFilter:  'all',
  deleteTargetId: null,
};

/* ─── Storage ────────────────────────────────────────────────── */
function loadContracts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.contracts = raw ? JSON.parse(raw) : [];
  } catch { state.contracts = []; }
}
function saveContracts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.contracts));
}
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ─── Helpers ────────────────────────────────────────────────── */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`page-${name}`);
  if (page) page.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let toastTimer;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ` toast--${type}` : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); }, 2800);
}

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('no-NO', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function excerpt(html, len = 100) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const text = (tmp.textContent || '').replace(/\s+/g, ' ').trim();
  return text.length > len ? text.slice(0, len) + '…' : text;
}

/* ─── Dashboard ──────────────────────────────────────────────── */
function renderDashboard() {
  const grid      = document.getElementById('contracts-grid');
  const emptyEl   = document.getElementById('empty-state');
  const all       = state.contracts;
  const filtered  = state.currentFilter === 'all'
    ? all
    : all.filter(c => c.status === state.currentFilter);

  // Stats
  document.getElementById('stat-total').textContent  = all.length;
  document.getElementById('stat-sent').textContent   = all.filter(c => c.status === 'sent').length;
  document.getElementById('stat-signed').textContent = all.filter(c => c.status === 'signed').length;

  // Clear old cards (keep empty-state node)
  [...grid.children].forEach(ch => {
    if (ch.id !== 'empty-state') ch.remove();
  });

  if (filtered.length === 0) {
    emptyEl.style.display = '';
    return;
  }
  emptyEl.style.display = 'none';

  // Sort: newest first
  const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);

  sorted.forEach(contract => {
    const card = createCard(contract);
    grid.appendChild(card);
  });
}

function createCard(c) {
  const card = document.createElement('div');
  card.className = `contract-card contract-card--${c.status}`;
  card.dataset.id = c.id;

  const badgeClass = `badge badge--${c.status}`;
  const badgeText  = { draft: 'Utkast', sent: 'Sendt', signed: 'Signert' }[c.status];
  const snippet    = c.content ? excerpt(c.content) : 'Tomt innhold';

  const recipientInfo = c.recipient?.name
    ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-top:6px;display:flex;align-items:center;gap:5px">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M1 11c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        ${c.recipient.name}
       </div>`
    : '';

  const signedBadge = c.status === 'signed'
    ? `<div style="display:flex;align-items:center;gap:5px;font-size:0.78rem;color:var(--success);margin-top:6px">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.5" stroke="currentColor" stroke-width="1.2"/><path d="M3.5 6l2 2 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Signert ${formatDate(c.signedAt)}
       </div>`
    : '';

  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">${escapeHtml(c.title || 'Uten tittel')}</div>
      <span class="${badgeClass}">${badgeText}</span>
    </div>
    <div class="card-body">
      ${snippet}
      ${recipientInfo}
      ${signedBadge}
    </div>
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

  // Card click to open editor (not on action buttons)
  card.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (btn) {
      e.stopPropagation();
      handleCardAction(btn.dataset.action, c.id);
      return;
    }
    handleCardAction('edit', c.id);
  });

  return card;
}

function handleCardAction(action, id) {
  const contract = state.contracts.find(c => c.id === id);
  if (!contract) return;

  if (action === 'edit') {
    openEditor(id);
  } else if (action === 'send') {
    openSend(id);
  } else if (action === 'copy-link') {
    const link = buildSigningLink(id);
    copyToClipboard(link);
    showToast('Signeringslenke kopiert!', 'success');
  } else if (action === 'delete') {
    state.deleteTargetId = id;
    document.getElementById('modal-overlay').style.display = 'flex';
  }
}

/* ─── Editor ─────────────────────────────────────────────────── */
function openEditor(id) {
  let contract;
  if (id) {
    contract = state.contracts.find(c => c.id === id);
    if (!contract) return;
    state.currentId = id;
  } else {
    // New contract
    contract = {
      id: generateId(),
      title: '',
      content: '',
      status: 'draft',
      createdAt: Date.now(),
      recipient: null,
      sentAt: null,
      signedAt: null,
      signature: null,
    };
    state.contracts.push(contract);
    saveContracts();
    state.currentId = contract.id;
  }

  document.getElementById('contract-title').value = contract.title || '';
  document.getElementById('editor-content').innerHTML =
    contract.content || '<p>Start med å skrive kontraktsteksten din her, eller velg en mal fra sidepanelet.</p>';

  const badge = document.getElementById('editor-status-badge');
  badge.className = `badge badge--${contract.status}`;
  badge.textContent = { draft: 'Utkast', sent: 'Sendt', signed: 'Signert' }[contract.status];

  document.getElementById('editor-created').textContent = formatDate(contract.createdAt);

  // Toggle send button
  const sendBtn = document.getElementById('btn-proceed-send');
  sendBtn.style.display = contract.status === 'signed' ? 'none' : '';

  // Signature block
  const sigBlock = document.getElementById('signature-block');
  if (contract.status === 'signed' && contract.signature?.data) {
    document.getElementById('sig-signer-name').textContent  = contract.recipient?.name  || '—';
    document.getElementById('sig-signer-email').textContent = contract.recipient?.email || '—';
    document.getElementById('sig-signed-date').textContent  = new Date(contract.signedAt).toLocaleDateString('no-NO', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    document.getElementById('sig-image').src = contract.signature.data;
    sigBlock.style.display = 'block';
  } else {
    sigBlock.style.display = 'none';
  }

  showPage('editor');
}

function saveCurrentDraft() {
  const contract = state.contracts.find(c => c.id === state.currentId);
  if (!contract) return;
  contract.title   = document.getElementById('contract-title').value.trim() || 'Uten tittel';
  contract.content = document.getElementById('editor-content').innerHTML;
  saveContracts();
}

/* ─── Send ───────────────────────────────────────────────────── */
function openSend(id) {
  saveCurrentDraft();
  state.currentId = id;

  // Reset form
  document.getElementById('recipient-name').value  = '';
  document.getElementById('recipient-email').value = '';
  document.getElementById('send-message').value    = '';
  document.getElementById('link-result').style.display = 'none';
  document.getElementById('err-name').textContent  = '';
  document.getElementById('err-email').textContent = '';
  document.getElementById('btn-generate-link').textContent = 'Generer signeringslenke';

  // Pre-fill if already has recipient
  const contract = state.contracts.find(c => c.id === id);
  if (contract?.recipient) {
    document.getElementById('recipient-name').value  = contract.recipient.name || '';
    document.getElementById('recipient-email').value = contract.recipient.email || '';
    if (contract.status === 'sent') {
      showLinkResult(id);
    }
  }

  showPage('send');
}

function buildSigningLink(id) {
  const base = window.location.href.replace(/\/[^/]*$/, '');
  return `${base}/sign.html?id=${id}`;
}

function showLinkResult(id) {
  const linkEl = document.getElementById('signing-link-text');
  const link   = buildSigningLink(id);
  linkEl.textContent = link;
  document.getElementById('link-result').style.display = 'block';
  document.getElementById('btn-generate-link').textContent = 'Regenerer lenke';
}

/* ─── Utilities ──────────────────────────────────────────────── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity  = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
}

/* ─── Event listeners ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadContracts();
  renderDashboard();

  /* New contract buttons */
  document.getElementById('btn-new-contract').addEventListener('click', () => openEditor(null));
  document.getElementById('btn-empty-new').addEventListener('click', () => openEditor(null));

  /* Back buttons */
  document.getElementById('btn-back-dashboard').addEventListener('click', () => {
    saveCurrentDraft();
    renderDashboard();
    showPage('dashboard');
  });
  document.getElementById('btn-back-editor').addEventListener('click', () => {
    showPage('editor');
  });

  /* Save draft */
  document.getElementById('btn-save-draft').addEventListener('click', () => {
    saveCurrentDraft();
    showToast('Utkast lagret', 'success');
    renderDashboard();
  });

  /* Proceed to send */
  document.getElementById('btn-proceed-send').addEventListener('click', () => {
    saveCurrentDraft();
    openSend(state.currentId);
  });

  /* Toolbar buttons */
  document.querySelectorAll('.tool-btn[data-cmd]').forEach(btn => {
    btn.addEventListener('mousedown', e => {
      e.preventDefault();
      document.execCommand(btn.dataset.cmd, false, null);
    });
  });

  /* Heading select */
  document.getElementById('heading-select').addEventListener('change', function () {
    if (this.value) {
      document.execCommand('formatBlock', false, this.value);
    } else {
      document.execCommand('formatBlock', false, 'p');
    }
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
      document.getElementById('contract-title').value  = tpl.title;
      document.getElementById('editor-content').innerHTML = tpl.html;
      showToast('Mal lastet inn');
    });
  });

  /* Filter buttons */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentFilter = btn.dataset.filter;
      renderDashboard();
    });
  });

  /* Send form */
  document.getElementById('send-form').addEventListener('submit', e => {
    e.preventDefault();

    const name  = document.getElementById('recipient-name').value.trim();
    const email = document.getElementById('recipient-email').value.trim();
    let valid   = true;

    document.getElementById('err-name').textContent  = '';
    document.getElementById('err-email').textContent = '';

    if (!name) {
      document.getElementById('err-name').textContent = 'Vennligst skriv inn kundens navn.';
      valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('err-email').textContent = 'Vennligst skriv inn en gyldig e-postadresse.';
      valid = false;
    }
    if (!valid) return;

    const contract = state.contracts.find(c => c.id === state.currentId);
    if (!contract) return;

    contract.recipient = { name, email };
    contract.status    = 'sent';
    contract.sentAt    = Date.now();
    saveContracts();
    renderDashboard();

    showLinkResult(state.currentId);
    showToast('Signeringslenke generert!', 'success');
  });

  /* Copy link button */
  document.getElementById('btn-copy-link').addEventListener('click', function () {
    const link = document.getElementById('signing-link-text').textContent;
    copyToClipboard(link);
    this.textContent = 'Kopiert!';
    this.classList.add('copied');
    setTimeout(() => {
      this.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.4"/><path d="M5 3V2a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-1" stroke="currentColor" stroke-width="1.4"/></svg> Kopier`;
      this.classList.remove('copied');
    }, 2000);
    showToast('Lenke kopiert til utklippstavlen!', 'success');
  });

  /* Delete modal */
  document.getElementById('btn-cancel-delete').addEventListener('click', () => {
    document.getElementById('modal-overlay').style.display = 'none';
    state.deleteTargetId = null;
  });

  document.getElementById('btn-confirm-delete').addEventListener('click', () => {
    if (!state.deleteTargetId) return;
    state.contracts = state.contracts.filter(c => c.id !== state.deleteTargetId);
    saveContracts();
    renderDashboard();
    document.getElementById('modal-overlay').style.display = 'none';
    state.deleteTargetId = null;
    showToast('Kontrakt slettet', 'danger');
  });

  /* Close modal on overlay click */
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      e.currentTarget.style.display = 'none';
      state.deleteTargetId = null;
    }
  });

  /* Auto-save on title change */
  document.getElementById('contract-title').addEventListener('input', debounce(() => {
    saveCurrentDraft();
  }, 800));
});

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
