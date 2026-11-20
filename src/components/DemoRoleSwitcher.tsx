'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function DemoRoleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, [pathname]);

  const switchRole = async (role: string, targetPath: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch_role', role }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        router.push(targetPath);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      setCurrentUser(null);
      router.push('/');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 9999,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #1d6a46, #0e291b)',
            color: '#fff',
            border: '1px solid rgba(159, 203, 176, 0.4)',
            padding: '8px 16px',
            borderRadius: '999px',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#34f5c5',
              display: 'inline-block',
            }}
          />
          Role Switcher · {currentUser ? `${currentUser.name} (${currentUser.role})` : 'Public Visitor'}
        </button>
      ) : (
        <div
          style={{
            background: 'rgba(9, 14, 11, 0.96)',
            border: '1px solid rgba(159, 203, 176, 0.25)',
            borderRadius: '16px',
            padding: '16px',
            width: '320px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            backdropFilter: 'blur(16px)',
            color: '#eef3f0',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: '8px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#9fcbb0' }}>
              Unified Platform Portals
            </span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 0,
                color: '#8b9890',
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>

          <p style={{ fontSize: '12px', color: '#8b9890', marginBottom: '12px' }}>
            Active: <b style={{ color: '#eef3f0' }}>{currentUser ? `${currentUser.name} (${currentUser.role})` : 'Unauthenticated (Public)'}</b>
          </p>

          <div style={{ display: 'grid', gap: '6px' }}>
            <button
              disabled={loading}
              onClick={() => router.push('/')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: pathname === '/' ? 'rgba(38, 131, 90, 0.3)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#eef3f0',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>🌟 Welcome / Landing Page</span>
              <small style={{ color: '#8b9890' }}>/</small>
            </button>

            <button
              disabled={loading}
              onClick={() => router.push('/public')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: pathname.startsWith('/public') ? 'rgba(38, 131, 90, 0.3)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#eef3f0',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>🌐 Public Website (Discovery & Voting)</span>
              <small style={{ color: '#8b9890' }}>/public</small>
            </button>

            <button
              disabled={loading}
              onClick={() => switchRole('PARTICIPANT', '/participant')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: pathname.startsWith('/participant') ? 'rgba(38, 131, 90, 0.3)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#eef3f0',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>👤 Participant Portal (Anjali R.)</span>
              <small style={{ color: '#8b9890' }}>/participant</small>
            </button>

            <button
              disabled={loading}
              onClick={() => switchRole('JUDGE', '/judge')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: pathname.startsWith('/judge') ? 'rgba(38, 131, 90, 0.3)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#eef3f0',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>⚖️ Judge Portal (Dr. Nikhil Menon)</span>
              <small style={{ color: '#8b9890' }}>/judge</small>
            </button>

            <button
              disabled={loading}
              onClick={() => switchRole('SUPER_ADMIN', '/admin')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: pathname.startsWith('/admin') ? 'rgba(38, 131, 90, 0.3)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#eef3f0',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>🛡️ Admin Portal (Super Admin)</span>
              <small style={{ color: '#8b9890' }}>/admin</small>
            </button>
          </div>

          {currentUser && (
            <button
              disabled={loading}
              onClick={logout}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '6px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid rgba(180, 83, 77, 0.4)',
                color: '#e0908b',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Sign out / Clear session
            </button>
          )}
        </div>
      )}
    </div>
  );
}
