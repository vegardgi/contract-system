/* ═══════════════════════════════════════════════════════════
   ContractFlow – Signing Page
   ═══════════════════════════════════════════════════════════ */

let contract   = null;
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

  if (contract.status === 'signed')  { showState('already-signed'); return; }
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
    ctx.fillStyle = '#1e1b4b';
    ctx.fill();
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.strokeStyle = '#1e1b4b';
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
      ctx.fillStyle   = '#1e1b4b';
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

/* ─── Spin animation ─────────────────────────────────────────── */
const s = document.createElement('style');
s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(s);

window.addEventListener('DOMContentLoaded', init);
