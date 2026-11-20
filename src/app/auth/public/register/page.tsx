'use client';

import React, { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function PublicRegisterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/public#voting';

  // Exactly 5 Required Fields for Public Registration
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setPhoneError('');

    // STRICT 10-DIGIT PHONE VALIDATION
    const cleanPhone = phone.trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      setPhoneError('Please enter a valid 10-digit phone number.');
      if (phoneInputRef.current) phoneInputRef.current.focus();
      return;
    }

    if (password !== confirmPassword) {
      setGeneralError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    if (password.length < 8) {
      setGeneralError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          role: 'PUBLIC_USER',
          name: fullName.trim(),
          phone: cleanPhone,
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
          redirectUrl: redirectTarget,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.field === 'phone') {
          setPhoneError(data.error || 'Please enter a valid 10-digit phone number.');
          if (phoneInputRef.current) phoneInputRef.current.focus();
        } else {
          setGeneralError(data.error || 'Failed to create voter account.');
        }
      } else {
        router.push(data.redirectUrl || redirectTarget || '/public#voting');
      }
    } catch {
      setGeneralError('An unexpected error occurred. Please try again.');
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
          padding: 32px 16px;
          position: relative;
        }

        .auth-wrap::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          background: radial-gradient(800px 520px at 50% 20%, rgba(20, 90, 60, 0.3), transparent 70%),
            radial-gradient(700px 450px at 20% 90%, rgba(12, 70, 46, 0.25), transparent 70%), #050806;
        }

        .auth-card {
          position: relative;
          z-index: 1;
          width: min(540px, 100%);
          background: rgba(14, 20, 16, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 36px 32px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(16px);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .auth-badge {
          display: inline-block;
          font-size: 11.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #9fcbb0;
          padding: 4px 14px;
          border-radius: 99px;
          background: rgba(38, 131, 90, 0.2);
          border: 1px solid rgba(38, 131, 90, 0.4);
          margin-bottom: 12px;
          font-weight: 600;
        }

        .auth-header h1 {
          font-size: 26px;
          font-weight: 700;
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
          padding: 11px 14px;
          border-radius: 12px;
          font-size: 13.5px;
          margin-bottom: 18px;
        }

        .phone-error-msg {
          color: #ef4444;
          font-size: 12.5px;
          margin-top: 5px;
          font-weight: 500;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 520px) {
          .form-grid-2 {
            grid-template-columns: 1fr;
          }
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 12.5px;
          color: #8b9890;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #eef3f0;
          outline: 0;
          font-size: 14px;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group select option {
          background: #0d1410;
          color: #eef3f0;
        }

        .form-group input:focus,
        .form-group select:focus {
          border-color: #26835a;
          box-shadow: 0 0 0 2px rgba(38, 131, 90, 0.25);
        }

        .phone-input-error {
          border: 2px solid #ef4444 !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25) !important;
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
          border-radius: 4px;
        }

        .pwd-toggle:hover {
          color: #34f5c5;
        }

        .avatar-upload-area {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed rgba(255, 255, 255, 0.2);
          margin-bottom: 16px;
        }

        .avatar-preview {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #26835a;
        }

        .avatar-placeholder {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: rgba(38, 131, 90, 0.2);
          border: 2px dashed rgba(38, 131, 90, 0.4);
          display: grid;
          place-items: center;
          color: #9fcbb0;
          font-size: 20px;
        }

        .btn-auth {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #1d6a46;
          border: 1px solid #26835a;
          color: #fff;
          padding: 12px 20px;
          border-radius: 99px;
          font-weight: 600;
          cursor: pointer;
          font-size: 15px;
          margin-top: 10px;
          transition: background 0.2s;
        }

        .btn-auth:hover {
          background: #26835a;
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
          <span className="auth-badge">Community Voter</span>
          <h1>Register to Vote</h1>
          <p>Free registration. Verified email accounts allow one vote per category in Annual Awards.</p>
        </div>

        {generalError && <div className="auth-error">{generalError}</div>}

        <form onSubmit={handleRegister}>
          {/* 1: Full Name */}
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Maya Sen"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {/* 2: Email ID */}
          <div className="form-group">
            <label>Email ID *</label>
            <input
              type="email"
              placeholder="e.g. maya@community.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* 3: Phone Number (Strict 10-digit rule) */}
          <div className="form-group">
            <label>Phone Number (10 numeric digits) *</label>
            <input
              ref={phoneInputRef}
              type="tel"
              placeholder="9876543210"
              maxLength={10}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError('');
              }}
              className={phoneError ? 'phone-input-error' : ''}
              required
            />
            {phoneError && <div className="phone-error-msg">{phoneError}</div>}
          </div>

          {/* 4 & 5: Password & Confirm Password */}
          <div className="form-grid-2">
            <div className="form-group">
              <label>Password (min 8 chars) *</label>
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

            <div className="form-group">
              <label>Confirm Password *</label>
              <div className="pwd-wrap">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="pwd-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? 'Creating Voter Account...' : 'Register to Vote'}
          </button>
        </form>

        <div className="auth-footer">
          Already have a voter account?{' '}
          <a href={`/auth/public/login?redirect=${encodeURIComponent(redirectTarget)}`}>
            Sign in to Vote
          </a>
          <div style={{ marginTop: '10px' }}>
            <a href="/" style={{ color: '#8b9890', fontSize: '12.5px' }}>
              ← Return to Portal Selection
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicRegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#050806' }} />}>
      <PublicRegisterInner />
    </Suspense>
  );
}
