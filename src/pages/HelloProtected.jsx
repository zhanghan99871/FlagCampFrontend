import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';

export default function HelloProtected() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    (async () => {
      try {
        const text = await apiFetch('/', { method: 'GET' });
        setMsg(text);
      } catch (e) {
        setErr(e?.message || 'Request failed');
        // token 失效/被拒绝的话可以直接踢回登录
        navigate('/auth/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/">Home</Link> | <button onClick={() => { localStorage.removeItem('token'); navigate('/auth/login'); }}>Logout</button>
      </div>

      <h2>Protected Hello</h2>

      {loading ? <div>Loading…</div> : null}
      {err ? <div style={{ color: 'red' }}>{err}</div> : null}
      {msg ? <div>Backend says: {msg}</div> : null}
    </div>
  );
}