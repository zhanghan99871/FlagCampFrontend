import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// A simple, self-contained registration page.
// - Client-side validation (email format, password strength, confirm password match)
// - Show/Hide password
// - Basic UX states (submitting, success, error)
// - No backend required (demo submit). Replace `fakeRegisterApi` with real API call later.

function isValidEmail(email) {
  // Practical email check (not perfect by design, but good for UI validation)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function passwordStrength(pw) {
  const s = String(pw || '');
  // Score 0-4
  let score = 0;
  if (s.length >= 8) score++;
  if (/[A-Z]/.test(s)) score++;
  if (/[a-z]/.test(s)) score++;
  if (/[0-9]/.test(s)) score++;
  if (/[^A-Za-z0-9]/.test(s)) score++;

  // Clamp to 4 for labeling (we allow 5 checks but cap the label scale)
  const clamped = Math.min(score, 4);
  const label = ['Weak', 'Okay', 'Good', 'Strong', 'Very strong'][clamped];
  return { score: clamped, label };
}

async function fakeRegisterApi(payload) {
  // Simulate a network request
  await new Promise((r) => setTimeout(r, 800));

  // Example: reject if email looks already used
  if (String(payload.email).toLowerCase().includes('taken')) {
    const err = new Error('This email is already registered. Try another one.');
    err.code = 'EMAIL_TAKEN';
    throw err;
  }

  return { ok: true, userId: 'demo-user-123' };
}

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agree: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);

  const errors = useMemo(() => {
    const e = {};

    if (!String(form.fullName).trim()) e.fullName = 'Please enter your name.';

    if (!String(form.email).trim()) e.email = 'Please enter your email.';
    else if (!isValidEmail(form.email)) e.email = 'Please enter a valid email address.';

    if (!String(form.password)) e.password = 'Please enter a password.';
    else {
      if (String(form.password).length < 8) {
        e.password = 'Password must be at least 8 characters.';
      } else if (strength.score <= 1) {
        e.password = 'Password is too weak. Add numbers/symbols and mixed case.';
      }
    }

    if (!String(form.confirmPassword)) e.confirmPassword = 'Please confirm your password.';
    else if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match.';

    if (!form.agree) e.agree = 'You must agree to continue.';

    return e;
  }, [form, strength.score]);

  const canSubmit = useMemo(() => {
    return (
      !submitting &&
      !serverError &&
      Object.keys(errors).length === 0 &&
      String(form.fullName).trim() &&
      String(form.email).trim() &&
      String(form.password) &&
      String(form.confirmPassword) &&
      form.agree
    );
  }, [errors, form, serverError, submitting]);

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

    // Touch all fields to show validation
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      agree: true,
    });

    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setServerError('');
    setSuccessMsg('');

    try {
      const payload = {
        fullName: String(form.fullName).trim(),
        email: String(form.email).trim(),
        password: form.password,
      };

      await fakeRegisterApi(payload);
      setSuccessMsg('Registration successful! Redirecting to home...');

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/');
      }, 900);
    } catch (err) {
      setServerError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

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

  const hintStyle = {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 6,
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

  function strengthBarWidth(score) {
    // score 0..4 => 10..100
    const pct = Math.max(10, Math.min(100, (score / 4) * 100));
    return `${pct}%`;
  }

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
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>Create account</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
              Sign up to start using the app.
            </div>
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
            <label style={labelStyle} htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              onBlur={() => markTouched('fullName')}
              placeholder="Your name"
              style={fieldStyle}
              autoComplete="name"
            />
            {touched.fullName && errors.fullName ? <div style={errorStyle}>{errors.fullName}</div> : null}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle} htmlFor="email">
              Email
            </label>
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
                placeholder="At least 8 characters"
                style={{ ...fieldStyle, flex: 1 }}
                autoComplete="new-password"
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
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.85 }}>
                <div>Password strength</div>
                <div style={{ fontWeight: 700 }}>{strength.label}</div>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.12)',
                  overflow: 'hidden',
                  marginTop: 8,
                }}
                aria-hidden="true"
              >
                <div
                  style={{
                    height: '100%',
                    width: strengthBarWidth(strength.score),
                    background: 'rgba(97,218,251,0.75)',
                    borderRadius: 999,
                    transition: 'width 180ms ease',
                  }}
                />
              </div>
              <div style={hintStyle}>Use 8+ chars with numbers/symbols and mixed case.</div>
            </div>

            {touched.password && errors.password ? <div style={errorStyle}>{errors.password}</div> : null}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle} htmlFor="confirmPassword">
              Confirm password
            </label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                onBlur={() => markTouched('confirmPassword')}
                placeholder="Re-enter your password"
                style={{ ...fieldStyle, flex: 1 }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                style={{
                  borderRadius: 12,
                  padding: '10px 12px',
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword ? (
              <div style={errorStyle}>{errors.confirmPassword}</div>
            ) : null}
          </div>

          <div style={{ marginBottom: 6 }}>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(e) => updateField('agree', e.target.checked)}
                onBlur={() => markTouched('agree')}
                style={{ marginTop: 3 }}
              />
              <span style={{ fontSize: 13, opacity: 0.9 }}>
                I agree to the Terms of Service and Privacy Policy.
              </span>
            </label>
            {touched.agree && errors.agree ? <div style={errorStyle}>{errors.agree}</div> : null}
          </div>

          <button type="submit" style={buttonStyle} disabled={!canSubmit}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>

          <div style={{ marginTop: 14, fontSize: 13, opacity: 0.9 }}>
            Already have an account? <Link to="/login" style={linkStyle}>Sign in</Link>.{' '}
            {/* <span style={{ opacity: 0.8 }}>(Login page not implemented yet)</span> */}
          </div>

          {/* <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
            Tip: try an email containing <b>taken</b> (e.g. <i>taken@example.com</i>) to see the demo server error.
          </div> */}
        </form>
      </div>
    </div>
  );
}
