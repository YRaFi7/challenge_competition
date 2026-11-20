'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotErr, setForgotErr] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: email.trim().toLowerCase(),
          password,
          portal: 'general',
          redirectUrl: redirectTarget,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to sign in. Please verify your credentials.');
      } else {
        // Direct to their own respected page automatically
        window.location.href = data.redirectUrl || '/';
      }
    } catch {
      setErrorMsg('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErr('');
    setForgotMsg('');
    setForgotLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forgot_password',
          email: forgotEmail.trim().toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setForgotErr(data.error || 'Failed to send recovery code.');
      } else {
        setForgotMsg(data.message || 'Verification code sent to your email.');
        setForgotStep('reset');
      }
    } catch {
      setForgotErr('Network error occurred.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErr('');
    setForgotMsg('');

    if (newPassword !== confirmNewPassword) {
      setForgotErr('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setForgotErr('Password must be at least 8 characters long.');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          email: forgotEmail.trim().toLowerCase(),
          code: forgotCode.trim(),
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setForgotErr(data.error || 'Failed to reset password.');
      } else {
        setForgotMsg('Password reset successfully! You can now log in.');
        setTimeout(() => {
          setForgotOpen(false);
          setForgotStep('request');
          setEmail(forgotEmail);
        }, 1500);
      }
    } catch {
      setForgotErr('Network error occurred.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <style jsx global>{`
        .login-wrap {
          min-height: 100vh;
          background: #050806;
          color: #eef3f0;
          font-family: 'Inter', system-ui, sans-serif;
          display: grid;
          place-items: center;
          padding: 32px 16px;
          position: relative;
        }

        .login-wrap::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          background: radial-gradient(800px 520px at 50% 20%, rgba(20, 90, 60, 0.35), transparent 70%),
            radial-gradient(700px 450px at 20% 90%, rgba(12, 70, 46, 0.25), transparent 70%), #050806;
        }

        .login-card {
          position: relative;
          z-index: 1;
          width: min(440px, 100%);
          background: rgba(14, 20, 16, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 38px 32px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(16px);
        }

        .login-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .login-badge {
          display: inline-block;
          font-size: 11.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #34f5c5;
          padding: 4px 14px;
          border-radius: 99px;
          background: rgba(38, 131, 90, 0.2);
          border: 1px solid rgba(38, 131, 90, 0.4);
          margin-bottom: 12px;
          font-weight: 600;
        }

        .login-header h1 {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }

        .login-header p {
          color: #8b9890;
          font-size: 14px;
          line-height: 1.5;
        }

        .error-alert {
          background: rgba(180, 83, 77, 0.15);
          border: 1px solid rgba(180, 83, 77, 0.4);
          color: #e0908b;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 13.5px;
          margin-bottom: 20px;
          line-height: 1.45;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-group label {
          display: block;
          font-size: 12.5px;
          color: #8b9890;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #eef3f0;
          outline: 0;
          font-size: 14px;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus {
          border-color: #26835a;
          box-shadow: 0 0 0 2px rgba(38, 131, 90, 0.25);
        }

        .pwd-wrap {
          position: relative;
        }

        .pwd-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #8b9890;
          cursor: pointer;
          font-size: 12.5px;
          padding: 4px 6px;
        }

        .pwd-toggle:hover {
          color: #34f5c5;
        }

        .extra-row {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 20px;
          font-size: 12.5px;
        }

        .extra-row a {
          color: #9fcbb0;
          text-decoration: none;
          cursor: pointer;
        }

        .extra-row a:hover {
          text-decoration: underline;
        }

        .btn-submit {
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          background: #1d6a46;
          color: #fff;
          font-size: 14.5px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }

        .btn-submit:hover:not(:disabled) {
          background: #34f5c5;
          color: #050806;
          transform: translateY(-1px);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 13.5px;
          color: #8b9890;
        }

        .login-footer a {
          color: #34f5c5;
          text-decoration: none;
          font-weight: 600;
        }

        .login-footer a:hover {
          text-decoration: underline;
        }

        /* Modal styling */
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: grid;
          place-items: center;
          padding: 20px;
        }

        .modal-card {
          width: min(420px, 100%);
          background: #0d1410;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 30px;
          position: relative;
        }
      `}</style>

      <div className="login-card">
        <div className="login-header">
          <span className="login-badge">Portal Authentication</span>
          <h1>Sign In</h1>
          <p>
            Enter your Email ID and Password. You will be directed to your own respected portal.
          </p>
        </div>

        {errorMsg && <div className="error-alert">{errorMsg}</div>}

        <form onSubmit={handleLogin}>
          {/* 1: Email ID */}
          <div className="form-group">
            <label>Email ID *</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* 2: Password */}
          <div className="form-group">
            <label>Password *</label>
            <div className="pwd-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="pwd-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="extra-row">
            <a onClick={() => setForgotOpen(true)}>Forgot Password?</a>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          Don't have an account?{' '}
          <Link href="/register">
            Register here
          </Link>
          <div style={{ marginTop: '10px' }}>
            <Link href="/" style={{ color: '#8b9890', fontSize: '12.5px', fontWeight: 'normal' }}>
              ← Return to Welcome Page
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ margin: '0 0 10px', fontSize: '20px', color: '#fff' }}>Reset Password</h3>
            <p style={{ color: '#8b9890', fontSize: '13.5px', margin: '0 0 18px', lineHeight: 1.5 }}>
              {forgotStep === 'request'
                ? 'Enter your registered Email ID to receive a verification code.'
                : `Enter the verification code sent to ${forgotEmail} and set your new password.`}
            </p>

            {forgotErr && <div className="error-alert" style={{ marginBottom: '14px' }}>{forgotErr}</div>}
            {forgotMsg && (
              <div style={{ background: 'rgba(38,131,90,0.2)', border: '1px solid #26835a', color: '#9fcbb0', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px' }}>
                {forgotMsg}
              </div>
            )}

            {forgotStep === 'request' ? (
              <form onSubmit={handleSendResetCode}>
                <div className="form-group">
                  <label>Email ID</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(false)}
                    style={{ flex: 1, padding: '11px', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    style={{ flex: 1 }}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Sending...' : 'Send Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label>Verification Code</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password (min 8 chars)</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setForgotStep('request')}
                    style={{ flex: 1, padding: '11px', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer' }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    style={{ flex: 1 }}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Resetting...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#050806' }}></div>}>
      <LoginPageInner />
    </Suspense>
  );
}
