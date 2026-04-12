/* ─── ContractFlow API client ────────────────────────────────── */
(function () {
  function base() {
    return (window.CF_API_BASE || 'http://localhost:3000').replace(/\/$/, '');
  }

  async function req(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(base() + path, opts);
    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `API-feil (${res.status})`);
    return data;
  }

  window.api = {
    list:   ()           => req('GET',    '/api/contracts'),
    get:    (id)         => req('GET',    `/api/contracts/${id}`),
    create: (body)       => req('POST',   '/api/contracts', body),
    update: (id, body)   => req('PUT',    `/api/contracts/${id}`, body),
    remove: (id)         => req('DELETE', `/api/contracts/${id}`),
    sign:   (id, body)   => req('POST',   `/api/contracts/${id}/sign`, body),
  };
})();
