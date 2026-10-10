// Backend bilan bog‘lanish. Token brauzerda saqlanadi va har so‘rovga qo‘shiladi.
const KEY = 'sn_token';
export const auth = {
  get token() { try { return localStorage.getItem(KEY); } catch { return null; } },
  set(t) { try { localStorage.setItem(KEY, t); } catch { /* */ } },
  clear() { try { localStorage.removeItem(KEY); localStorage.removeItem('sn_seller'); } catch { /* */ } },
  seller() { try { return JSON.parse(localStorage.getItem('sn_seller') || 'null'); } catch { return null; } },
  saveSeller(s) { try { localStorage.setItem('sn_seller', JSON.stringify(s)); } catch { /* */ } },
};

export async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`;
  let r;
  try {
    r = await fetch(`/api/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw Object.assign(new Error('Internet bilan aloqa yo‘q. Qayta urinib ko‘ring.'), { status: 0 });
  }
  const data = await r.json().catch(() => ({}));
  if (r.status === 401 && !path.startsWith('auth/') && !path.startsWith('public/')) {
    auth.clear();
    location.hash = '#/kirish';
  }
  if (!r.ok) throw Object.assign(new Error(data.error || `Xato: ${r.status}`), { status: r.status });
  return data;
}
