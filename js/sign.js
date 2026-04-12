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

  // Sender date (sentAt)
  const senderDateStr = c.sentAt
    ? new Date(c.sentAt).toLocaleDateString('no-NO', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
    : dateStr;
  document.getElementById('view-sender-date').textContent = senderDateStr;

  const pdfBtn = document.getElementById('btn-pdf-view');
  pdfBtn.onclick = function () { downloadContractPdf(c, c.signature?.data, this); };

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
document.getElementById('btn-pdf-success').addEventListener('click', function () {
  if (lastSigned) downloadContractPdf(lastSigned, lastSigDataUrl, this);
});

async function downloadContractPdf(c, sigDataUrl, btn) {
  // Show loading state
  const origHTML = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="animation:spin 0.8s linear infinite"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5" stroke-dasharray="14 8"/></svg> Genererer…`;
  }

  try {
    const recipientName = c.recipient?.name || '—';
    const signedDate = c.signedAt
      ? new Date(c.signedAt).toLocaleDateString('no-NO', {
          day: 'numeric', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      : '—';

    // Build a hidden render container styled for A4
    // Ensure Dancing Script is loaded for PDF render
    if (!document.querySelector('link[data-pdf-font]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.dataset.pdfFont = '1';
      link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap';
      document.head.appendChild(link);
      await new Promise(r => setTimeout(r, 800)); // wait for font
    }

    const wrap = document.createElement('div');
    wrap.style.cssText = [
      'position:fixed', 'left:-9999px', 'top:0',
      'width:794px', 'background:#fff',
      'font-family:Arial,Helvetica,sans-serif',
      'font-size:13px', 'line-height:1.65',
      'color:#2C1A0E', 'padding:52px 64px 64px',
    ].join(';');

    const senderDate = c.sentAt
      ? new Date(c.sentAt).toLocaleDateString('no-NO', { day: 'numeric', month: 'long', year: 'numeric' })
      : signedDate;

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
        ${escapeHtml(c.title || 'Uten tittel')}
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
              <div style="font-size:0.85rem;font-weight:600;margin-top:2px">${escapeHtml(recipientName)}</div>
            </div>
            <div style="margin-bottom:14px">
              <div style="font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#B89080">Dato</div>
              <div style="font-size:0.85rem;font-weight:600;margin-top:2px">${escapeHtml(signedDate)}</div>
            </div>
            ${sigDataUrl
              ? `<div style="background:#FDFAF6;border:1.5px solid #F0DDD0;border-radius:7px;padding:10px 14px;display:inline-block">
                   <img src="${sigDataUrl}" style="max-height:60px;max-width:220px;display:block">
                 </div>`
              : ''}
          </div>

          <!-- Sender -->
          <div style="padding:18px 22px;background:#FDFAF6">
            <div style="font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#B89080;margin-bottom:10px">Avsender</div>
            <div style="margin-bottom:4px">
              <div style="font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#B89080">Signert av</div>
              <div style="font-size:0.85rem;font-weight:600;margin-top:2px">Vegard Giskehaug</div>
            </div>
            <div style="margin-bottom:14px">
              <div style="font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#B89080">Dato</div>
              <div style="font-size:0.85rem;font-weight:600;margin-top:2px">${escapeHtml(senderDate)}</div>
            </div>
            <div style="font-family:'Dancing Script',cursive;font-size:2rem;color:#2C1A0E;line-height:1.2;padding:4px 0">
              Vegard Giskehaug
            </div>
          </div>

        </div>
      </div>

      <div style="margin-top:32px;padding-top:14px;border-top:1px solid #E8DDD4;
                  font-size:0.65rem;color:#B89080;display:flex;justify-content:space-between">
        <span>Pizzapappa – kontraktsignering</span>
        <span>Signert: ${escapeHtml(signedDate)}</span>
      </div>
    `;

    document.body.appendChild(wrap);

    const canvas = await html2canvas(wrap, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 0,
    });

    document.body.removeChild(wrap);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW  = pageW;
    const imgH  = (canvas.height * imgW) / canvas.width;

    // Add image across multiple pages if needed
    let remaining = imgH;
    let srcY = 0;
    let page = 0;

    while (remaining > 0) {
      if (page > 0) pdf.addPage();
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.95), 'JPEG',
        0, -srcY, imgW, imgH, '', 'FAST'
      );
      srcY      += pageH;
      remaining -= pageH;
      page++;
    }

    const safeName = (c.title || 'kontrakt')
      .replace(/[^\w\sæøåÆØÅ-]/g, '').trim() || 'kontrakt';
    pdf.save(`${safeName}.pdf`);

  } catch (err) {
    console.error(err);
    alert('Kunne ikke generere PDF. Prøv igjen.');
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = origHTML;
  }
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
