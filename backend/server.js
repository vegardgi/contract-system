require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const db      = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json({ limit: '10mb' })); // base64 signatures can be large

/* ─── Utils ──────────────────────────────────────────────────── */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function toContract(row) {
  if (!row) return null;
  return {
    id:        row.id,
    title:     row.title,
    content:   row.content,
    status:    row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sentAt:    row.sent_at    || null,
    signedAt:  row.signed_at  || null,
    recipient: row.recipient_name
      ? { name: row.recipient_name, email: row.recipient_email }
      : null,
    signature: row.signature_data
      ? { type: row.signature_type, data: row.signature_data, font: row.signature_font }
      : null,
  };
}

/* ─── Routes ─────────────────────────────────────────────────── */

// GET /api/contracts
app.get('/api/contracts', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM contracts ORDER BY created_at DESC'
  ).all();
  res.json(rows.map(toContract));
});

// GET /api/contracts/:id
app.get('/api/contracts/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Ikke funnet' });
  res.json(toContract(row));
});

// POST /api/contracts
app.post('/api/contracts', (req, res) => {
  const { title = '', content = '' } = req.body;
  const id  = genId();
  const now = Date.now();
  db.prepare(`
    INSERT INTO contracts (id, title, content, status, created_at, updated_at)
    VALUES (?, ?, ?, 'draft', ?, ?)
  `).run(id, title, content, now, now);
  res.status(201).json(toContract(
    db.prepare('SELECT * FROM contracts WHERE id = ?').get(id)
  ));
});

// PUT /api/contracts/:id
app.put('/api/contracts/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Ikke funnet' });

  const { title, content, status, recipientName, recipientEmail } = req.body;
  const now = Date.now();

  // Set sent_at if transitioning to 'sent'
  const newStatus = status ?? existing.status;
  const sentAt    = (newStatus === 'sent' && existing.status !== 'sent') ? now : existing.sent_at;

  db.prepare(`
    UPDATE contracts SET
      title           = ?,
      content         = ?,
      status          = ?,
      recipient_name  = ?,
      recipient_email = ?,
      sent_at         = ?,
      updated_at      = ?
    WHERE id = ?
  `).run(
    title          ?? existing.title,
    content        ?? existing.content,
    newStatus,
    recipientName  ?? existing.recipient_name,
    recipientEmail ?? existing.recipient_email,
    sentAt,
    now,
    req.params.id
  );

  res.json(toContract(
    db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id)
  ));
});

// DELETE /api/contracts/:id
app.delete('/api/contracts/:id', (req, res) => {
  const result = db.prepare('DELETE FROM contracts WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Ikke funnet' });
  res.status(204).end();
});

// POST /api/contracts/:id/sign
app.post('/api/contracts/:id/sign', (req, res) => {
  const existing = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Ikke funnet' });
  if (existing.status === 'signed') return res.status(409).json({ error: 'Allerede signert' });

  const { type, data, font } = req.body;
  if (!type || !data) return res.status(400).json({ error: 'Mangler signatursdata' });

  const now = Date.now();
  db.prepare(`
    UPDATE contracts SET
      status         = 'signed',
      signed_at      = ?,
      signature_type = ?,
      signature_data = ?,
      signature_font = ?,
      updated_at     = ?
    WHERE id = ?
  `).run(now, type, data, font || null, now, req.params.id);

  res.json(toContract(
    db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id)
  ));
});

app.get('/', (req, res) => res.json({ status: 'ContractFlow API running' }));

app.listen(PORT, () => console.log(`ContractFlow API on port ${PORT}`));
