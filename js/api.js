/* ─── ContractFlow API client ────────────────────────────────── */
(function () {
  function base() {
    return (window.CF_API_BASE || 'https://www.pizzapappa.no/_functions').replace(/\/$/, '');
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
    list:   ()           => req('GET',    '/contracts'),
    get:    (id)         => req('GET',    `/contract?id=${encodeURIComponent(id)}`),
    create: (body)       => req('POST',   '/contract', body),
    update: (id, body)   => req('PUT',    `/contract?id=${encodeURIComponent(id)}`, body),
    remove: (id)         => req('DELETE', `/contract?id=${encodeURIComponent(id)}`),
    sign:   (id, body)   => req('POST',   `/sign?id=${encodeURIComponent(id)}`, body),
  };
})();
