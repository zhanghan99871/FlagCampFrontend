import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';

// Matching style with Register.jsx
// - Email + password
// - Show/Hide password
// - Basic UX states (submitting, success, error)
// - Demo login API (replace with real backend call)

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const errors = useMemo(() => {
    const e = {};

    if (!String(form.email).trim()) e.email = 'Please enter your email.';
    else if (!isValidEmail(form.email)) e.email = 'Please enter a valid email address.';

    if (!String(form.password)) e.password = 'Please enter your password.';

    return e;
  }, [form]);

  const canSubmit = useMemo(() => {
    return !submitting && Object.keys(errors).length === 0 && String(form.email).trim() && String(form.password);
  }, [errors, form, submitting]);

  function markTouched(name) {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }

  function updateField(name, value) {
    setServerError('');
    setSuccessMsg('');
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();

    setTouched({ email: true, password: true });
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setServerError('');
    setSuccessMsg('');

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      // Expect backend to return a JSON object, e.g. { token, user, expiresAt, ... }
      const token = data.token;
      // user data if needed
      const user = data.user;

      if (!token) {
        throw new Error('Login response did not include token');
      }

      localStorage.setItem('token', token);
      setSuccessMsg('Logged in! Redirecting...');
      setTimeout(() => navigate('/'), 300);
    } catch (err) {
        setServerError(err.message || 'Login failed. Please try again.');
    } finally {
        setSubmitting(false);
    }
  }

  const sideAddonWidth = 72;

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 10,
    alignItems: 'center',
    width: '100%',
  };

  const spacerStyle = {
    width: sideAddonWidth,
    minWidth: sideAddonWidth,
  };

  const fieldStyle = {
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.06)',
    color: 'white',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    opacity: 0.9,
    marginBottom: 6,
  };

  const errorStyle = {
    fontSize: 12,
    marginTop: 6,
    color: '#ffb4b4',
  };

  const cardStyle = {
    width: 'min(520px, 92vw)',
    background: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 18,
    padding: 22,
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(10px)',
  };

  const topBarStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  };

  const linkStyle = {
    color: 'white',
    textDecoration: 'underline',
    opacity: 0.9,
  };

  const buttonStyle = {
    width: '100%',
    marginTop: 12,
    borderRadius: 12,
    padding: '12px 14px',
    border: '1px solid rgba(255,255,255,0.25)',
    background: submitting ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.16)',
    color: 'white',
    fontWeight: 700,
    cursor: submitting ? 'not-allowed' : 'pointer',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        background:
          'radial-gradient(1200px 800px at 20% 20%, rgba(97,218,251,0.20), transparent 55%), radial-gradient(900px 600px at 80% 30%, rgba(255,255,255,0.10), transparent 50%), #0b1020',
        color: 'white',
      }}
    >
      <div style={cardStyle}>
        <div style={topBarStyle}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>Welcome back</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>Log in to continue.</div>
          </div>
          <Link to="/" style={linkStyle}>
            Back
          </Link>
        </div>

        {serverError ? (
          <div
            style={{
              border: '1px solid rgba(255,180,180,0.55)',
              background: 'rgba(255,180,180,0.10)',
              padding: 12,
              borderRadius: 12,
              marginBottom: 12,
              fontSize: 13,
            }}
            role="alert"
          >
            {serverError}
          </div>
        ) : null}

        {successMsg ? (
          <div
            style={{
              border: '1px solid rgba(180,255,210,0.55)',
              background: 'rgba(180,255,210,0.10)',
              padding: 12,
              borderRadius: 12,
              marginBottom: 12,
              fontSize: 13,
            }}
            role="status"
          >
            {successMsg}
          </div>
        ) : null}

        <form onSubmit={onSubmit} noValidate>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle} htmlFor="email">
              Email
            </label>
            <div style={rowStyle}>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                onBlur={() => markTouched('email')}
                placeholder="you@example.com"
                style={fieldStyle}
                autoComplete="email"
              />
              <div style={spacerStyle} aria-hidden="true" />
            </div>
            {touched.email && errors.email ? <div style={errorStyle}>{errors.email}</div> : null}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle} htmlFor="password">
              Password
            </label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                onBlur={() => markTouched('password')}
                placeholder="Your password"
                style={{ ...fieldStyle, flex: 1 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  borderRadius: 12,
                  padding: '10px 12px',
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  minWidth: sideAddonWidth,
                  width: sideAddonWidth,
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {touched.password && errors.password ? <div style={errorStyle}>{errors.password}</div> : null}
          </div>

          <div style={{ marginBottom: 6 }}>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => updateField('remember', e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span style={{ fontSize: 13, opacity: 0.9 }}>Remember me</span>
            </label>
          </div>

          <button type="submit" style={buttonStyle} disabled={!canSubmit}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <div style={{ marginTop: 14, fontSize: 13, opacity: 0.9 }}>
            Don&apos;t have an account? <Link to="/auth/register" style={linkStyle}>Create one</Link>
          </div>

          {/* <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
            Demo: password <b>Password123!</b> works. Use an email containing <b>wrong</b> to trigger an error.
          </div> */}
        </form>
      </div>
    </div>
  );
}
