'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function RegisterSelectionInner() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '';
  const redirectQuery = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';

  return (
    <div className="reg-wrap">
      <style jsx global>{`
        .reg-wrap {
          min-height: 100vh;
          background: #050806;
          color: #eef3f0;
          font-family: 'Inter', system-ui, sans-serif;
          position: relative;
          padding: 48px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .reg-wrap::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          background: radial-gradient(900px 520px at 50% 15%, rgba(20, 90, 60, 0.35), transparent 70%),
            radial-gradient(800px 480px at 20% 85%, rgba(12, 70, 46, 0.25), transparent 70%), #050806;
        }

        .reg-container {
          position: relative;
          z-index: 1;
          width: min(1120px, 100%);
          margin: 0 auto;
        }

        .reg-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .reg-badge {
          display: inline-block;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #9fcbb0;
          padding: 5px 16px;
          border-radius: 99px;
          background: rgba(38, 131, 90, 0.2);
          border: 1px solid rgba(38, 131, 90, 0.4);
          margin-bottom: 14px;
          font-weight: 600;
        }

        .reg-header h1 {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(30px, 4.5vw, 44px);
          font-weight: 700;
          letter-spacing: -0.025em;
          margin-bottom: 10px;
          color: #fff;
        }

        .reg-header p {
          color: #8b9890;
          font-size: 16px;
          max-width: 620px;
          margin: 0 auto;
          line-height: 1.5;
        }

        .reg-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
          gap: 24px;
          margin-bottom: 36px;
        }

        .reg-card {
          background: rgba(14, 20, 16, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(14px);
          transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
        }

        .reg-card:hover {
          transform: translateY(-4px);
          border-color: rgba(52, 245, 197, 0.4);
          box-shadow: 0 28px 56px rgba(0, 0, 0, 0.8), 0 0 24px rgba(52, 245, 197, 0.15);
        }

        .card-top {
          margin-bottom: 24px;
        }

        .card-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: rgba(38, 131, 90, 0.2);
          border: 1px solid rgba(38, 131, 90, 0.4);
          display: grid;
          place-items: center;
          font-size: 24px;
          margin-bottom: 18px;
        }

        .card-role {
          font-size: 11.5px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #34f5c5;
          font-weight: 700;
          display: block;
          margin-bottom: 6px;
        }

        .card-title {
          font-size: 22px;
          font-weight: 700;
          color: #eef3f0;
          margin-bottom: 10px;
        }

        .card-desc {
          color: #8b9890;
          font-size: 14px;
          line-height: 1.55;
          margin-bottom: 18px;
        }

        .card-points {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 18px;
        }

        .card-points li {
          font-size: 13.5px;
          color: #c4d4cc;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .card-points li span {
          color: #34f5c5;
          font-weight: bold;
        }

        .card-btn {
          margin-top: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          background: #1d6a46;
          color: #fff;
          font-weight: 600;
          font-size: 14.5px;
          text-decoration: none;
          transition: background 0.2s, transform 0.1s;
          box-sizing: border-box;
        }

        .card-btn:hover {
          background: #34f5c5;
          color: #050806;
          transform: translateY(-1px);
        }

        .reg-footer {
          text-align: center;
          color: #8b9890;
          font-size: 14.5px;
        }

        .reg-footer a {
          color: #34f5c5;
          text-decoration: none;
          font-weight: 600;
        }

        .reg-footer a:hover {
          text-decoration: underline;
        }
      `}</style>

      <div className="reg-container">
        <div className="reg-header">
          <span className="reg-badge">Registration Options</span>
          <h1>Create an Account</h1>
          <p>
            Choose your registration category below. Access is partitioned by role so you receive the dedicated tools and dashboards for your responsibilities.
          </p>
        </div>

        {/* 3 SEPARATE REGISTRATION CARDS */}
        <div className="reg-cards">
          {/* Card 1: Participant */}
          <div className="reg-card">
            <div className="card-top">
              <div className="card-icon">👤</div>
              <span className="card-role">Participants</span>
              <h2 className="card-title">Participant Registration</h2>
              <p className="card-desc">
                For developers, designers, students, and creators competing in sprints, submitting projects, and winning prizes.
              </p>
              <ul className="card-points">
                <li><span>✓</span> Solo & Team participation (2 to 4 members)</li>
                <li><span>✓</span> Project submission uploads & versioning</li>
                <li><span>✓</span> Verified completion certificates & awards</li>
              </ul>
            </div>
            <Link href={`/auth/participant/register${redirectQuery}`} className="card-btn">
              Register as Participant →
            </Link>
          </div>

          {/* Card 2: Judge */}
          <div className="reg-card">
            <div className="card-top">
              <div className="card-icon">⚖️</div>
              <span className="card-role">Judges</span>
              <h2 className="card-title">Judges Registration</h2>
              <p className="card-desc">
                For authorized industry professionals evaluating assigned submissions using admin-defined rubric criteria.
              </p>
              <ul className="card-points">
                <li><span>✓</span> Structured rubric evaluation & feedback</li>
                <li><span>✓</span> Anonymous double-blind submission scoring</li>
                <li><span>✓</span> Requires administrator verification</li>
              </ul>
            </div>
            <Link href={`/auth/judge/register${redirectQuery}`} className="card-btn">
              Register as Judge →
            </Link>
          </div>

          {/* Card 3: Public */}
          <div className="reg-card">
            <div className="card-top">
              <div className="card-icon">🗳️</div>
              <span className="card-role">Public Voting</span>
              <h2 className="card-title">Public Registration</h2>
              <p className="card-desc">
                For voters casting verified votes for nominees in the Annual People’s Choice Awards.
              </p>
              <ul className="card-points">
                <li><span>✓</span> 100% free community voter registration</li>
                <li><span>✓</span> Strictly 5 fields without profile photo</li>
                <li><span>✓</span> Verified one-person-one-vote security</li>
              </ul>
            </div>
            <Link href={`/auth/public/register${redirectQuery}`} className="card-btn">
              Register as Public Voter →
            </Link>
          </div>
        </div>

        <div className="reg-footer">
          Already registered?{' '}
          <Link href={`/login${redirectQuery}`}>
            Sign in here
          </Link>
          {' · '}
          <Link href="/">
            Return to Welcome Page
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#050806' }}></div>}>
      <RegisterSelectionInner />
    </Suspense>
  );
}
