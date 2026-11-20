'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';

function AdminLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: email.trim().toLowerCase(),
          password,
          portal: 'admin',
          redirectUrl: redirectTarget,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Invalid email address or password. Please try again.');
      } else {
        setSuccessMsg(data.message || 'Login successful. Welcome back!');
        setTimeout(() => {
          router.push(data.redirectUrl || redirectTarget || '/admin');
        }, 500);
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <style jsx global>{`
        .auth-wrap {
          min-height: 100vh;
          background: #050806;
          color: #eef3f0;
          font-family: 'Inter', system-ui, sans-serif;
          display: grid;
          place-items: center;
          padding: 24px;
          position: relative;
        }

        .auth-wrap::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          background: radial-gradient(800px 520px at 50% 20%, rgba(180, 83, 77, 0.2), transparent 70%),
            radial-gradient(700px 450px at 20% 90%, rgba(12, 70, 46, 0.25), transparent 70%), #050806;
        }

        .auth-card {
          position: relative;
          z-index: 1;
          width: min(440px, 100%);
          background: rgba(14, 20, 16, 0.94);
          border: 1px solid rgba(180, 83, 77, 0.3);
          border-radius: 20px;
          padding: 36px 30px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(16px);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 26px;
        }

        .auth-badge {
          display: inline-block;
          font-size: 11.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #e0908b;
          padding: 3px 12px;
          border-radius: 99px;
          background: rgba(180, 83, 77, 0.2);
          border: 1px solid rgba(180, 83, 77, 0.4);
          margin-bottom: 12px;
          font-weight: 600;
        }

        .auth-header h1 {
          font-size: 24px;
          font-weight: 600;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }

        .auth-header p {
          color: #8b9890;
          font-size: 14px;
        }

        .auth-error {
          background: rgba(180, 83, 77, 0.15);
          border: 1px solid rgba(180, 83, 77, 0.4);
          color: #e0908b;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13.5px;
          margin-bottom: 18px;
        }

        .auth-success {
          background: rgba(38, 131, 90, 0.15);
          border: 1px solid rgba(38, 131, 90, 0.4);
          color: #9fcbb0;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13.5px;
          margin-bottom: 18px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 12.5px;
          color: #8b9890;
          margin-bottom: 6px;
        }

        .form-group input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #eef3f0;
          outline: 0;
          font-size: 14px;
          box-sizing: border-box;
        }

        .form-group input:focus {
          border-color: #b4534d;
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
          color: #e0908b;
        }

        .forgot-link {
          float: right;
          font-size: 12px;
          color: #e0908b;
          cursor: pointer;
          text-decoration: none;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        .btn-auth {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #b4534d;
          border: 1px solid #d4635d;
          color: #fff;
          padding: 11px 20px;
          border-radius: 99px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14.5px;
          margin-top: 20px;
        }

        .btn-auth:hover {
          background: #c45b55;
        }

        .auth-footer {
          margin-top: 22px;
          text-align: center;
          font-size: 13.5px;
          color: #8b9890;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 18px;
        }

        .auth-footer a {
          color: #9fcbb0;
          text-decoration: none;
          font-weight: 500;
        }

        .auth-footer a:hover {
          text-decoration: underline;
        }
      `}</style>

      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-badge">Platform Management</span>
          <h1>Admin Console Sign In</h1>
          <p>Access restricted to authorized platform administrators only.</p>
        </div>

        {errorMsg && <div className="auth-error">{errorMsg}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        <form onSubmit={handleLogin}>
          {/* Field 1: Email Address */}
          <div className="form-group">
            <label>Admin Email Address</label>
            <input
              type="email"
              placeholder="admin@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Field 2: Password */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ margin: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="forgot-link"
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                Forgot Password?
              </button>
            </div>
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

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign in to Admin Console'}
          </button>
        </form>

        <div className="auth-footer">
          <div style={{ color: '#8b9890', fontSize: '12px', marginBottom: '8px' }}>
            🔒 Public administrator registration is restricted.
          </div>
          <a href="/" style={{ color: '#8b9890', fontSize: '12.5px' }}>
            ← Return to Portal Selection
          </a>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        defaultEmail={email}
        onSuccess={(recoveredEmail) => {
          setEmail(recoveredEmail);
          setSuccessMsg('Password reset successfully. Please log in with your new password.');
        }}
      />
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#050806' }} />}>
      <AdminLoginInner />
    </Suspense>
  );
}
