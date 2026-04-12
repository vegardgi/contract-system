/* ═══════════════════════════════════════════════════════════
   ContractFlow – Signing Page
   ═══════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'contractflow_v1';

let contract   = null;
let activeTab  = 'draw';         // 'draw' | 'type'
let hasDrawing = false;
let penSize    = 2;
let typedFont  = 'Dancing Script';

/* ─── Init ───────────────────────────────────────────────────── */
function init() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');

  if (!id) { showState('not-found'); return; }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : [];
    contract  = all.find(c => c.id === id) || null;
  } catch { contract = null; }

  if (!contract) { showState('not-found'); return; }

  if (contract.status === 'signed') { showState('already-signed'); return; }

  if (contract.status !== 'sent') { showState('not-found'); return; }

  // Populate contract view
  document.getElementById('sign-contract-title').textContent  = contract.title || 'Uten tittel';
  document.getElementById('sign-recipient-name').textContent  = contract.recipient?.name || '—';
  document.getElementById('sign-contract-content').innerHTML  = contract.content || '';

  showState('signing');
  initCanvas();
  initTyped();
  initAgreement();
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
  const canvas  = document.getElementById('sig-canvas');
  const ctx     = canvas.getContext('2d');
  const placeholder = document.getElementById('canvas-placeholder');

  // Scale for retina
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width  = rect.width  * dpr || 460 * dpr;
  canvas.height = 180 * dpr;
  canvas.style.width  = (rect.width || 460) + 'px';
  canvas.style.height = '180px';
  ctx.scale(dpr, dpr);

  let drawing = false;
  let lastX = 0, lastY = 0;

  function setupCtx() {
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth   = penSize;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
  }

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - r.left,
        y: e.touches[0].clientY - r.top
      };
    }
    return { x: e.clientX - r.left, y: e.clientY - r.top };
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
    setupCtx();
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    setupCtx();
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

  function endDraw(e) {
    e.preventDefault();
    drawing = false;
  }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup',   endDraw);
  canvas.addEventListener('mouseleave', endDraw);
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove',  draw,       { passive: false });
  canvas.addEventListener('touchend',   endDraw,    { passive: false });

  /* Clear button */
  document.getElementById('btn-clear-canvas').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    hasDrawing = false;
    placeholder.classList.remove('hidden');
    validateSignBtn();
  });

  /* Pen size */
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
  const input      = document.getElementById('typed-name');
  const previewArea = document.getElementById('typed-preview-area');
  const display    = document.getElementById('typed-sig-display');

  input.addEventListener('input', () => {
    const val = input.value.trim();
    if (val) {
      display.textContent = val;
      display.style.fontFamily = `'${typedFont}', cursive`;
      previewArea.style.display = 'block';
    } else {
      previewArea.style.display = 'none';
    }
    validateSignBtn();
  });

  /* Font choice */
  document.querySelectorAll('.font-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.font-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      typedFont = btn.dataset.font;
      display.style.fontFamily = `'${typedFont}', cursive`;
    });
  });
}

/* ─── Agreement checkbox ─────────────────────────────────────── */
function initAgreement() {
  document.getElementById('agree-check').addEventListener('change', validateSignBtn);
}

/* ─── Validation ─────────────────────────────────────────────── */
function validateSignBtn() {
  const agreed  = document.getElementById('agree-check').checked;
  const hasSig  = activeTab === 'draw'
    ? hasDrawing
    : document.getElementById('typed-name').value.trim().length > 0;
  document.getElementById('btn-sign').disabled = !(agreed && hasSig);
}

/* ─── Submit ─────────────────────────────────────────────────── */
document.getElementById('btn-sign').addEventListener('click', async () => {
  const btn = document.getElementById('btn-sign');
  btn.disabled = true;
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="animation:spin 0.7s linear infinite"><path d="M9 2a7 7 0 110 14A7 7 0 019 2z" stroke="white" stroke-width="2" stroke-dasharray="22 10"/></svg> Signerer...`;

  // Capture signature image
  let sigDataUrl = null;

  if (activeTab === 'draw') {
    const canvas = document.getElementById('sig-canvas');
    sigDataUrl   = canvas.toDataURL('image/png');
  } else {
    sigDataUrl = await renderTypedSignature(
      document.getElementById('typed-name').value.trim(),
      typedFont
    );
  }

  // Update contract in localStorage
  const raw = localStorage.getItem(STORAGE_KEY);
  const all = raw ? JSON.parse(raw) : [];
  const idx = all.findIndex(c => c.id === contract.id);
  if (idx !== -1) {
    all[idx].status    = 'signed';
    all[idx].signedAt  = Date.now();
    all[idx].signature = {
      type: activeTab,
      data: sigDataUrl,
      name: activeTab === 'type' ? document.getElementById('typed-name').value.trim() : null,
      font: activeTab === 'type' ? typedFont : null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    contract = all[idx];
  }

  // Show success
  document.getElementById('success-name').textContent = contract.recipient?.name || '—';
  document.getElementById('success-date').textContent = new Date().toLocaleDateString('no-NO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  if (sigDataUrl) {
    const imgEl = document.getElementById('signed-sig-img');
    imgEl.src   = sigDataUrl;
    document.getElementById('signed-sig-preview').style.display = 'block';
  }

  showState('success');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ─── Render typed name to canvas ────────────────────────────── */
function renderTypedSignature(name, fontFamily) {
  return new Promise(resolve => {
    const canvas  = document.createElement('canvas');
    canvas.width  = 460;
    canvas.height = 120;
    const ctx     = canvas.getContext('2d');

    // Wait for font to be ready then draw
    document.fonts.ready.then(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font      = `60px '${fontFamily}', cursive`;
      ctx.fillStyle = '#1e1b4b';
      ctx.textBaseline = 'middle';

      // Scale text to fit
      const metrics = ctx.measureText(name);
      const maxW    = canvas.width - 40;
      if (metrics.width > maxW) {
        const scale = maxW / metrics.width;
        ctx.font = `${Math.floor(60 * scale)}px '${fontFamily}', cursive`;
      }

      ctx.fillText(name, 20, canvas.height / 2);
      resolve(canvas.toDataURL('image/png'));
    });
  });
}

/* ─── Spin animation ─────────────────────────────────────────── */
const spinStyle = document.createElement('style');
spinStyle.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(spinStyle);

/* ─── Start ──────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', init);
