export async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('token');
    const base = process.env.REACT_APP_API_BASE || '';
  
    const url = /^https?:\/\//.test(path) ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
  
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return {};
    return res.json().catch(() => ({}));
  }