'use client';

import React, { useState } from 'react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  onSuccess: (email: string) => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  defaultEmail = '',
  onSuccess,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forgot_password',
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to send reset code.');
      } else {
        setStep('reset');
        setSuccessMsg(data.message || 'Reset code sent to your email.');
        if (data.demoCode) {
          setCode(data.demoCode);
        }
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to reset password.');
      } else {
        onSuccess(email);
        onClose();
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(440px, 100%)',
          background: 'rgba(16, 24, 20, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '20px',
          padding: '28px 24px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)',
          position: 'relative',
          color: '#eef3f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '16px',
            top: '16px',
            background: 'none',
            border: 'none',
            color: '#8b9890',
            fontSize: '22px',
            cursor: 'pointer',
          }}
          aria-label="Close"
        >
          ×
        </button>

        <span
          style={{
            display: 'inline-block',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#9fcbb0',
            padding: '3px 10px',
            borderRadius: '99px',
            background: 'rgba(38, 131, 90, 0.2)',
            border: '1px solid rgba(38, 131, 90, 0.4)',
            marginBottom: '10px',
            fontWeight: 600,
          }}
        >
          Security Recovery
        </span>

        <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>
          {step === 'request' ? 'Reset Your Password' : 'Enter Verification Code'}
        </h3>
        <p style={{ color: '#8b9890', fontSize: '13.5px', margin: '0 0 18px', lineHeight: 1.4 }}>
          {step === 'request'
            ? 'Enter your registered email address to receive a secure password recovery code.'
            : `A 6-digit verification code has been generated for ${email}.`}
        </p>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(180, 83, 77, 0.15)',
              border: '1px solid rgba(180, 83, 77, 0.4)',
              color: '#e0908b',
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: 'rgba(38, 131, 90, 0.15)',
              border: '1px solid rgba(38, 131, 90, 0.4)',
              color: '#9fcbb0',
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {successMsg}
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleSendCode}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', color: '#8b9890', marginBottom: '6px' }}>
                Registered Email Address
              </label>
              <input
                type="email"
                placeholder="you@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#eef3f0',
                  outline: 0,
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: '#1d6a46',
                border: '1px solid #26835a',
                color: '#fff',
                padding: '11px 20px',
                borderRadius: '99px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14.5px',
              }}
            >
              {loading ? 'Sending code...' : 'Send Recovery Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', color: '#8b9890', marginBottom: '6px' }}>
                6-Digit Recovery Code
              </label>
              <input
                type="text"
                placeholder="482107"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#eef3f0',
                  outline: 0,
                  fontSize: '16px',
                  letterSpacing: '2px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '14px', position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '12.5px', color: '#8b9890', marginBottom: '6px' }}>
                New Password (min 8 chars)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#eef3f0',
                    outline: 0,
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#8b9890',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '18px', position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '12.5px', color: '#8b9890', marginBottom: '6px' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#eef3f0',
                    outline: 0,
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#8b9890',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setStep('request')}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#eef3f0',
                  padding: '11px 16px',
                  borderRadius: '99px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2,
                  background: '#1d6a46',
                  border: '1px solid #26835a',
                  color: '#fff',
                  padding: '11px 20px',
                  borderRadius: '99px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14.5px',
                }}
              >
                {loading ? 'Updating...' : 'Set New Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
