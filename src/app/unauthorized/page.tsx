'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const portal = searchParams.get('portal') || 'Protected Portal';
  const role = searchParams.get('role') || '';
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    router.push('/');
  };

  const getAuthorizedPortalPath = () => {
    const userRole = currentUser?.role || role;
    if (userRole === 'PARTICIPANT') return '/participant';
    if (userRole === 'JUDGE') return '/judge';
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') return '/admin';
    return '/public#voting';
  };

  return (
    <div className="unauth-card">
      <div className="unauth-icon">🔒</div>
      <span className="unauth-tag">403 Access Denied</span>
      <h1>Unauthorized Portal Access</h1>
      <p>
        You do not have permission to access the <b>{portal}</b>. Each portal requires an account with designated role-based authorization.
      </p>

      <div className="unauth-info">
        <div>
          <span>Attempted Portal:</span>
          <b>{portal}</b>
        </div>
        <div>
          <span>Your Active Role:</span>
          <b>{currentUser ? currentUser.role : role || 'Unauthenticated'}</b>
        </div>
        <div>
          <span>Security Policy:</span>
          <b style={{ color: '#9fcbb0' }}>Strict RBAC Enforced</b>
        </div>
      </div>

      <div className="unauth-actions">
        {currentUser && (
          <button
            className="btn-portal"
            onClick={() => router.push(getAuthorizedPortalPath())}
          >
            Go to my authorized dashboard →
          </button>
        )}

        <button
          className="btn-secondary"
          onClick={handleLogout}
        >
          Sign out / Choose different portal
        </button>

        <button
          className="btn-secondary"
          onClick={() => router.push('/')}
          style={{ border: 0, color: '#8b9890' }}
        >
          ← Return to Portal Selection
        </button>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <div className="unauth-wrap">
      <style jsx global>{`
        .unauth-wrap {
          min-height: 100vh;
          background: #050806;
          color: #eef3f0;
          font-family: 'Inter', system-ui, sans-serif;
          display: grid;
          place-items: center;
          padding: 24px;
          position: relative;
        }

        .unauth-wrap::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          background: radial-gradient(800px 520px at 50% 30%, rgba(20, 90, 60, 0.28), transparent 70%),
            radial-gradient(600px 400px at 50% 80%, rgba(180, 83, 77, 0.15), transparent 70%), #050806;
        }

        .unauth-card {
          position: relative;
          z-index: 1;
          width: min(520px, 100%);
          background: rgba(14, 20, 16, 0.92);
          border: 1px solid rgba(180, 83, 77, 0.35);
          border-radius: 20px;
          padding: 38px 32px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          text-align: center;
        }

        .unauth-icon {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: rgba(180, 83, 77, 0.15);
          border: 1px solid rgba(180, 83, 77, 0.4);
          color: #e0908b;
          display: grid;
          place-items: center;
          margin: 0 auto 18px;
          font-size: 24px;
        }

        .unauth-tag {
          display: inline-block;
          font-size: 11.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #e0908b;
          padding: 3px 12px;
          border-radius: 99px;
          background: rgba(180, 83, 77, 0.1);
          border: 1px solid rgba(180, 83, 77, 0.25);
          margin-bottom: 12px;
          font-weight: 600;
        }

        .unauth-card h1 {
          font-size: 24px;
          font-weight: 600;
          letter-spacing: -0.02em;
          margin-bottom: 10px;
        }

        .unauth-card p {
          color: #8b9890;
          font-size: 14.5px;
          line-height: 1.55;
          margin-bottom: 22px;
        }

        .unauth-info {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 26px;
          font-size: 13.5px;
          text-align: left;
        }

        .unauth-info div {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
        }

        .unauth-info span {
          color: #8b9890;
        }

        .unauth-info b {
          color: #eef3f0;
          font-weight: 500;
        }

        .unauth-actions {
          display: grid;
          gap: 10px;
        }

        .btn-portal {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #1d6a46;
          border: 1px solid #26835a;
          color: #fff;
          padding: 11px 20px;
          border-radius: 99px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14.5px;
        }

        .btn-portal:hover {
          background: #26835a;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #eef3f0;
          padding: 10px 20px;
          border-radius: 99px;
          font-weight: 500;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>

      <Suspense fallback={<div style={{ color: '#8b9890' }}>Verifying permissions...</div>}>
        <UnauthorizedContent />
      </Suspense>
    </div>
  );
}
