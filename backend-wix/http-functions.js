// ─────────────────────────────────────────────────────────────
// ContractFlow – Wix Velo HTTP Functions
//
// INSTRUKSJONER:
// 1. Åpne Pizzapappa.no i Wix Editor
// 2. Klikk på "{}" (Dev Mode) i venstre meny for å aktivere Velo
// 3. I venstre filpanel: Backend → Klikk "+" → New .js file
// 4. Gi filen navnet: http-functions.js
// 5. Lim inn HELE denne filen
// 6. Klikk Publish (Publiser) øverst
// ─────────────────────────────────────────────────────────────

import { response } from 'wix-http-functions';
import wixData from 'wix-data';

const COLLECTION = 'Contracts';

// ─── Hjelpefunksjoner ─────────────────────────────────────────

function jsonRes(status, data) {
  return response({
    status,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods':'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type',
    },
    body: JSON.stringify(data),
  });
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function toContract(item) {
  if (!item) return null;
  return {
    id:        item._id,
    title:     item.title     || '',
    content:   item.content   || '',
    status:    item.status    || 'draft',
    archived:  item.archived  || false,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
    sentAt:    item.sentAt    || null,
    signedAt:  item.signedAt  || null,
    recipient: item.recipientName
      ? { name: item.recipientName, email: item.recipientEmail }
      : null,
    signature: item.signatureData
      ? { type: item.signatureType, data: item.signatureData, font: item.signatureFont }
      : null,
  };
}

// ─── OPTIONS (CORS preflight) ─────────────────────────────────

export function options_contracts(req) { return jsonRes(200, {}); }
export function options_contract(req)  { return jsonRes(200, {}); }
export function options_sign(req)      { return jsonRes(200, {}); }

// ─── GET /_functions/contracts – hent alle ───────────────────

export function get_contracts(req) {
  return wixData.query(COLLECTION)
    .descending('createdAt')
    .limit(100)
    .find({ suppressAuth: true })
    .then(res => jsonRes(200, res.items.map(toContract)))
    .catch(err => jsonRes(500, { error: err.message }));
}

// ─── GET /_functions/contract?id=xxx – hent én ───────────────

export function get_contract(req) {
  const id = req.query['id'];
  if (!id) return Promise.resolve(jsonRes(400, { error: 'Mangler id' }));

  return wixData.get(COLLECTION, id, { suppressAuth: true })
    .then(item => item ? jsonRes(200, toContract(item)) : jsonRes(404, { error: 'Ikke funnet' }))
    .catch(err => jsonRes(500, { error: err.message }));
}

// ─── POST /_functions/contract – opprett ─────────────────────

export async function post_contract(req) {
  let body;
  try { body = await req.body.json(); } catch { return jsonRes(400, { error: 'Ugyldig JSON' }); }

  const now  = Date.now();
  const item = {
    _id:       genId(),
    title:     body.title   || '',
    content:   body.content || '',
    status:    'draft',
    createdAt: now,
    updatedAt: now,
  };

  return wixData.insert(COLLECTION, item, { suppressAuth: true })
    .then(inserted => jsonRes(201, toContract(inserted)))
    .catch(err     => jsonRes(500, { error: err.message }));
}

// ─── PUT /_functions/contract?id=xxx – oppdater ──────────────

export async function put_contract(req) {
  const id = req.query['id'];
  if (!id) return jsonRes(400, { error: 'Mangler id' });

  let body;
  try { body = await req.body.json(); } catch { return jsonRes(400, { error: 'Ugyldig JSON' }); }

  return wixData.get(COLLECTION, id, { suppressAuth: true })
    .then(existing => {
      if (!existing) return jsonRes(404, { error: 'Ikke funnet' });

      const now       = Date.now();
      const newStatus = body.status !== undefined ? body.status : existing.status;
      const sentAt    = (newStatus === 'sent' && existing.status !== 'sent')
        ? now : (existing.sentAt || null);

      const updated = {
        ...existing,
        title:          body.title          !== undefined ? body.title          : existing.title,
        content:        body.content        !== undefined ? body.content        : existing.content,
        status:         newStatus,
        archived:       body.archived       !== undefined ? body.archived       : (existing.archived || false),
        recipientName:  body.recipientName  !== undefined ? body.recipientName  : (existing.recipientName  || null),
        recipientEmail: body.recipientEmail !== undefined ? body.recipientEmail : (existing.recipientEmail || null),
        sentAt,
        updatedAt: now,
      };

      return wixData.update(COLLECTION, updated, { suppressAuth: true })
        .then(res => jsonRes(200, toContract(res)));
    })
    .catch(err => jsonRes(500, { error: err.message }));
}

// ─── DELETE /_functions/contract?id=xxx – slett ──────────────

export function delete_contract(req) {
  const id = req.query['id'];
  if (!id) return Promise.resolve(jsonRes(400, { error: 'Mangler id' }));

  return wixData.remove(COLLECTION, id, { suppressAuth: true })
    .then(() => jsonRes(200, { success: true }))
    .catch(err => jsonRes(500, { error: err.message }));
}

// ─── POST /_functions/sign?id=xxx – signer ───────────────────

export async function post_sign(req) {
  const id = req.query['id'];
  if (!id) return jsonRes(400, { error: 'Mangler id' });

  let body;
  try { body = await req.body.json(); } catch { return jsonRes(400, { error: 'Ugyldig JSON' }); }
  if (!body.type || !body.data) return jsonRes(400, { error: 'Mangler signaturdata' });

  return wixData.get(COLLECTION, id, { suppressAuth: true })
    .then(existing => {
      if (!existing)                  return jsonRes(404, { error: 'Ikke funnet' });
      if (existing.status === 'signed') return jsonRes(409, { error: 'Allerede signert' });

      const now     = Date.now();
      const updated = {
        ...existing,
        status:        'signed',
        signedAt:      now,
        signatureType: body.type,
        signatureData: body.data,
        signatureFont: body.font || null,
        updatedAt:     now,
      };

      return wixData.update(COLLECTION, updated, { suppressAuth: true })
        .then(res => jsonRes(200, toContract(res)));
    })
    .catch(err => jsonRes(500, { error: err.message }));
}
