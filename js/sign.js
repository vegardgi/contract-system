/* ═══════════════════════════════════════════════════════════
   ContractFlow – Signing Page
   ═══════════════════════════════════════════════════════════ */

let contract        = null;
let lastSigned      = null;   // contract object after signing (for PDF in success state)
let lastSigDataUrl  = null;   // raw data-URL of signature image
let activeTab  = 'draw';
let hasDrawing = false;
let penSize    = 2;
let typedFont  = 'Dancing Script';

/* ─── Init ───────────────────────────────────────────────────── */
async function init() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { showState('not-found'); return; }

  try {
    contract = await api.get(id);
  } catch {
    showState('not-found');
    return;
  }

  if (contract.status === 'signed')  { showSignedView(contract); return; }
  if (contract.status !== 'sent')    { showState('not-found');      return; }

  document.getElementById('sign-contract-title').textContent = contract.title || 'Uten tittel';
  document.getElementById('sign-recipient-name').textContent = contract.recipient?.name || '—';
  document.getElementById('sign-contract-content').innerHTML = contract.content || '';

  showState('signing');
  initCanvas();
  initTyped();
  document.getElementById('agree-check').addEventListener('change', validateSignBtn);
}

function showState(name) {
  document.querySelectorAll('.state-view').forEach(el => el.style.display = 'none');
  document.getElementById(`state-${name}`).style.display = 'block';
}

function showSignedView(c) {
  document.getElementById('view-contract-title').textContent  = c.title || 'Uten tittel';
  document.getElementById('view-recipient-name').textContent  = c.recipient?.name || '—';
  document.getElementById('view-contract-content').innerHTML  = c.content || '';

  const dateStr = c.signedAt
    ? new Date(c.signedAt).toLocaleDateString('no-NO', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    : '—';
  document.getElementById('view-signed-date').textContent = dateStr;

  if (c.signature?.data) {
    document.getElementById('view-sig-name').textContent  = c.recipient?.name || '—';
    document.getElementById('view-sig-date').textContent  = dateStr;
    document.getElementById('view-sig-image').src         = c.signature.data;
    document.getElementById('view-sig-block').style.display = 'block';
  }

  document.getElementById('btn-pdf-view').onclick = () => downloadContractPdf(c, c.signature?.data);

  showState('already-signed');
}

/* ─── Tabs ───────────────────────────────────────────────────── */
document.querySelectorAll('.sign-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sign-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.sign-tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.dataset.tab;
    document.getElementById(`pane-${activeTab}`).classList.add('active');
    validateSignBtn();
  });
});

/* ─── Canvas drawing ─────────────────────────────────────────── */
function initCanvas() {
  const canvas      = document.getElementById('sig-canvas');
  const ctx         = canvas.getContext('2d');
  const placeholder = document.getElementById('canvas-placeholder');
  const dpr         = window.devicePixelRatio || 1;

  const rect    = canvas.getBoundingClientRect();
  const cssW    = rect.width  || 460;
  const cssH    = 180;
  canvas.width  = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.width  = cssW + 'px';
  canvas.style.height = cssH + 'px';
  ctx.scale(dpr, dpr);

  let drawing = false, lastX = 0, lastY = 0;

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing = true;
    const p = getPos(e);
    lastX = p.x; lastY = p.y;
    ctx.beginPath();
    ctx.arc(p.x, p.y, penSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#2C1A0E';
    ctx.fill();
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.strokeStyle = '#2C1A0E';
    ctx.lineWidth   = penSize;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastX = p.x; lastY = p.y;
    if (!hasDrawing) {
      hasDrawing = true;
      placeholder.classList.add('hidden');
      validateSignBtn();
    }
  }

  function endDraw(e) { e.preventDefault(); drawing = false; }

  canvas.addEventListener('mousedown',  startDraw);
  canvas.addEventListener('mousemove',  draw);
  canvas.addEventListener('mouseup',    endDraw);
  canvas.addEventListener('mouseleave', endDraw);
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove',  draw,       { passive: false });
  canvas.addEventListener('touchend',   endDraw,    { passive: false });

  document.getElementById('btn-clear-canvas').addEventListener('click', () => {
    ctx.clearRect(0, 0, cssW, cssH);
    hasDrawing = false;
    placeholder.classList.remove('hidden');
    validateSignBtn();
  });

  document.querySelectorAll('.pen-size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pen-size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      penSize = parseFloat(btn.dataset.size);
    });
  });
}

/* ─── Typed signature ────────────────────────────────────────── */
function initTyped() {
  const input       = document.getElementById('typed-name');
  const previewArea = document.getElementById('typed-preview-area');
  const display     = document.getElementById('typed-sig-display');

  input.addEventListener('input', () => {
    const val = input.value.trim();
    if (val) {
      display.textContent  = val;
      display.style.fontFamily = `'${typedFont}', cursive`;
      previewArea.style.display = 'block';
    } else {
      previewArea.style.display = 'none';
    }
    validateSignBtn();
  });

  document.querySelectorAll('.font-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.font-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      typedFont = btn.dataset.font;
      display.style.fontFamily = `'${typedFont}', cursive`;
    });
  });
}

/* ─── Validation ─────────────────────────────────────────────── */
function validateSignBtn() {
  const agreed = document.getElementById('agree-check').checked;
  const hasSig = activeTab === 'draw'
    ? hasDrawing
    : document.getElementById('typed-name').value.trim().length > 0;
  document.getElementById('btn-sign').disabled = !(agreed && hasSig);
}

/* ─── Submit ─────────────────────────────────────────────────── */
document.getElementById('btn-sign').addEventListener('click', async () => {
  const btn  = document.getElementById('btn-sign');
  btn.disabled = true;
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="animation:spin 0.7s linear infinite"><path d="M9 2a7 7 0 110 14A7 7 0 019 2z" stroke="white" stroke-width="2" stroke-dasharray="22 10"/></svg> Signerer...`;

  let sigDataUrl;
  if (activeTab === 'draw') {
    sigDataUrl = document.getElementById('sig-canvas').toDataURL('image/png');
  } else {
    sigDataUrl = await renderTypedSignature(
      document.getElementById('typed-name').value.trim(),
      typedFont
    );
  }

  try {
    const signed = await api.sign(contract.id, {
      type: activeTab,
      data: sigDataUrl,
      font: activeTab === 'type' ? typedFont : null,
    });

    lastSigned     = signed;
    lastSigDataUrl = sigDataUrl;

    document.getElementById('success-name').textContent = signed.recipient?.name || '—';
    document.getElementById('success-date').textContent = new Date(signed.signedAt).toLocaleDateString('no-NO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    if (sigDataUrl) {
      document.getElementById('signed-sig-img').src           = sigDataUrl;
      document.getElementById('signed-sig-preview').style.display = 'block';
    }
    showState('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 16l2-6L14 1l3 3L7 14 2 16z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg> Signer kontrakt`;
    alert('Kunne ikke lagre signatur: ' + err.message);
  }
});

/* ─── Render typed name to canvas ────────────────────────────── */
function renderTypedSignature(name, fontFamily) {
  return new Promise(resolve => {
    const canvas  = document.createElement('canvas');
    canvas.width  = 460;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    document.fonts.ready.then(() => {
      ctx.font = `60px '${fontFamily}', cursive`;
      ctx.fillStyle   = '#2C1A0E';
      ctx.textBaseline = 'middle';
      const metrics = ctx.measureText(name);
      if (metrics.width > 420) {
        ctx.font = `${Math.floor(60 * 420 / metrics.width)}px '${fontFamily}', cursive`;
      }
      ctx.fillText(name, 20, 60);
      resolve(canvas.toDataURL('image/png'));
    });
  });
}

/* ─── PDF download ───────────────────────────────────────────── */
document.getElementById('btn-pdf-success').addEventListener('click', () => {
  if (lastSigned) downloadContractPdf(lastSigned, lastSigDataUrl);
});

function downloadContractPdf(c, sigDataUrl) {
  const recipientName = c.recipient?.name || '—';
  const signedDate = c.signedAt
    ? new Date(c.signedAt).toLocaleDateString('no-NO', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    : '—';

  const sigImgTag = sigDataUrl
    ? `<img src="${sigDataUrl}" class="sig-img" alt="Signatur">`
    : '<span class="no-sig">Ingen signaturbilde</span>';

  const html = `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(c.title || 'Kontrakt')} – Pizzapappa</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 15px; -webkit-font-smoothing: antialiased; }
    body {
      font-family: 'Inter', Arial, sans-serif;
      color: #111827;
      background: #fff;
      padding: 0;
      line-height: 1.65;
    }

    /* ── Page shell ── */
    .page-wrap {
      max-width: 740px;
      margin: 0 auto;
      padding: 48px 56px 56px;
    }

    /* ── Header ── */
    .doc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 20px;
      border-bottom: 2px solid #C8562A;
      margin-bottom: 36px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-mark {
      width: 32px; height: 32px;
      background: #FDF0EA;
      border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
    }
    .brand-name {
      font-size: 1rem;
      font-weight: 700;
      color: #2C1A0E;
      letter-spacing: -0.02em;
    }
    .doc-status {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #059669;
      background: #ECFDF5;
      border: 1px solid rgba(5,150,105,0.2);
      padding: 5px 12px;
      border-radius: 100px;
    }

    /* ── Title ── */
    .contract-title {
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #111827;
      margin-bottom: 28px;
      line-height: 1.25;
    }

    /* ── Content ── */
    .contract-content { margin-bottom: 40px; }
    .contract-content h1 { font-size: 1.3rem; font-weight: 700; margin: 24px 0 10px; }
    .contract-content h2 { font-size: 1.15rem; font-weight: 700; margin: 20px 0 8px; }
    .contract-content h3 { font-size: 1rem; font-weight: 600; margin: 16px 0 6px; }
    .contract-content p  { margin-bottom: 10px; color: #374151; }
    .contract-content ul, .contract-content ol {
      padding-left: 20px; margin-bottom: 10px; color: #374151;
    }
    .contract-content li { margin-bottom: 4px; }
    .contract-content strong { font-weight: 600; color: #111827; }

    /* ── Signature block ── */
    .sig-block {
      border-top: 2px dashed #F0C4A8;
      padding-top: 28px;
      margin-top: 8px;
    }
    .sig-block-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #C8562A;
      margin-bottom: 20px;
    }
    .sig-meta-grid {
      display: flex;
      gap: 40px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .sig-meta-item { display: flex; flex-direction: column; gap: 3px; }
    .sig-meta-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #9CA3AF;
    }
    .sig-meta-value { font-size: 0.9rem; font-weight: 600; color: #111827; }
    .sig-img-wrap {
      background: #FDFAF6;
      border: 1.5px solid #F0DDD0;
      border-radius: 10px;
      padding: 16px 24px;
      display: inline-block;
    }
    .sig-img { max-height: 80px; max-width: 300px; display: block; }
    .no-sig { font-size: 0.85rem; color: #9CA3AF; }

    /* ── Footer ── */
    .doc-footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #E5E7EB;
      font-size: 0.72rem;
      color: #9CA3AF;
      display: flex;
      justify-content: space-between;
    }

    /* ── Print ── */
    @media print {
      body { padding: 0; }
      .page-wrap { padding: 20px 32px 32px; max-width: 100%; }
      @page { margin: 15mm 15mm 15mm 15mm; size: A4; }
    }
  </style>
</head>
<body>
<div class="page-wrap">

  <div class="doc-header">
    <div class="brand">
      <div class="brand-mark">
        <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
          <path d="M4 2h10l4 4v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" fill="#C8562A" opacity="0.2"/>
          <path d="M14 2l4 4h-3a1 1 0 01-1-1V2z" fill="#C8562A"/>
          <path d="M4 2h10l4 4v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="#C8562A" stroke-width="1.5" fill="none"/>
        </svg>
      </div>
      <span class="brand-name">Pizzapappa – kontraktsignering</span>
    </div>
    <span class="doc-status">✓ Signert</span>
  </div>

  <h1 class="contract-title">${escapeHtml(c.title || 'Uten tittel')}</h1>

  <div class="contract-content">${c.content || ''}</div>

  <div class="sig-block">
    <div class="sig-block-label">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 12l1.5-4.5L12 1l3 3-8.5 7.5L2 12z" stroke="#C8562A" stroke-width="1.5" stroke-linejoin="round"/></svg>
      Signatur
    </div>
    <div class="sig-meta-grid">
      <div class="sig-meta-item">
        <span class="sig-meta-label">Signert av</span>
        <span class="sig-meta-value">${escapeHtml(recipientName)}</span>
      </div>
      <div class="sig-meta-item">
        <span class="sig-meta-label">Dato</span>
        <span class="sig-meta-value">${escapeHtml(signedDate)}</span>
      </div>
    </div>
    <div class="sig-img-wrap">${sigImgTag}</div>
  </div>

  <div class="doc-footer">
    <span>Generert av ContractFlow</span>
    <span>Signert: ${escapeHtml(signedDate)}</span>
  </div>

</div>
<script>
  window.addEventListener('load', () => {
    // Wait for fonts/images, then print
    setTimeout(() => { window.print(); }, 600);
  });
<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { alert('Tillat popup-vinduer for å laste ned PDF.'); return; }
  win.document.write(html);
  win.document.close();
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ─── Spin animation ─────────────────────────────────────────── */
const s = document.createElement('style');
s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(s);

window.addEventListener('DOMContentLoaded', init);
