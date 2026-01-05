export async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('token');
  
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  
    const ct = res.headers.get('content-type') || '';
    const payload = ct.includes('application/json')
      ? await res.json().catch(() => ({}))
      : await res.text().catch(() => '');
  
    if (!res.ok) {
      // payload 可能是 string 或 object
      const message =
        typeof payload === 'string'
          ? payload
          : payload?.message || payload?.error || `HTTP ${res.status}`;
  
      const err = new Error(message);
      err.status = res.status;
      err.data = payload;
      throw err;
    }
  
    return payload;
  }