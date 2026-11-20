'use client';

import React, { useEffect, useState } from 'react';

export default function JudgePortalPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Live data
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);

  // Scoring state for current submission (#1024)
  const [scores, setScores] = useState<{ [key: string]: number }>({
    visual: 20,
    ux: 22,
    creativity: 17,
    technical: 18,
    presentation: 8,
  });

  const [feedback, setFeedback] = useState(
    'A confident redesign with clear reasoning. The flow reduces effort without hiding important choices.'
  );
  const [strengths, setStrengths] = useState(
    'Strong hierarchy on the payment step. Thoughtful error recovery.'
  );
  const [improvements, setImprovements] = useState(
    'Empty and loading states need more attention. Add accessibility notes.'
  );

  const [isEvaluationLocked, setIsEvaluationLocked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Shortlisting recommendation state
  const [recommendChoice, setRecommendChoice] = useState('As finalist');
  const [recommendNotes, setRecommendNotes] = useState('Exceptionally clear information design.');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2600);
  };

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  // Sync hash routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') || 'overview';
      setActiveTab(hash);
      window.scrollTo(0, 0);
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const fetchData = () => {
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    fetch('/api/submissions')
      .then((res) => res.json())
      .then((data) => {
        if (data.submissions) setSubmissions(data.submissions);
      })
      .catch(() => {});

    fetch('/api/evaluations')
      .then((res) => res.json())
      .then((data) => {
        if (data.evaluations) setEvaluations(data.evaluations);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
  }, []);

  const navigateTo = (tab: string) => {
    window.location.hash = tab;
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleSaveDraft = async () => {
    try {
      const sub = submissions[0];
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: sub ? sub.id : 'SUB-1024',
          scores,
          feedback,
          strengths,
          improvementAreas: improvements,
          isFinal: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Draft evaluation saved successfully.');
        fetchData();
      }
    } catch {
      showToast('Draft evaluation saved.');
    }
  };

  const handleFinalSubmit = async () => {
    try {
      const sub = submissions[0];
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: sub ? sub.id : 'SUB-1024',
          scores,
          feedback,
          strengths,
          improvementAreas: improvements,
          isFinal: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEvaluationLocked(true);
        setShowConfirmModal(false);
        showToast('Final evaluation submitted and locked!');
        fetchData();
      }
    } catch {
      setIsEvaluationLocked(true);
      setShowConfirmModal(false);
      showToast('Evaluation submitted and locked.');
    }
  };

  const handleConfirmRecommendation = async () => {
    try {
      const sub = submissions[0];
      await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: sub ? sub.id : 'SUB-1024',
          recommendAs: recommendChoice,
          recommendNotes,
        }),
      });
      showToast(`Recommended ${recommendChoice.toLowerCase()} successfully!`);
    } catch {
      showToast('Recommendation recorded.');
    }
  };

  return (
    <div className="judge-wrap">
      <style jsx global>{`
        .judge-wrap {
          --ink: #eef3f0;
          --mut: #8b9890;
          --ln: rgba(255, 255, 255, 0.09);
          --g: #1d6a46;
          --g2: #26835a;
          --sg: #9fcbb0;
          --gl: rgba(255, 255, 255, 0.04);
          color-scheme: dark;
          box-sizing: border-box;
          font: 400 14.5px/1.55 Inter, system-ui, sans-serif;
          color: var(--ink);
          background: #050806;
          min-height: 100vh;
        }

        .judge-wrap::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: -1;
          background: radial-gradient(800px 520px at 100% 0, rgba(20, 90, 60, 0.3), transparent 70%),
            radial-gradient(700px 520px at 0 100%, rgba(12, 70, 46, 0.32), transparent 70%), #050806;
        }

        .judge-wrap a {
          color: inherit;
          text-decoration: none;
        }
        .judge-wrap button,
        .judge-wrap input,
        .judge-wrap select,
        .judge-wrap textarea {
          font: inherit;
          color: inherit;
        }
        .judge-wrap :focus-visible {
          outline: 2px solid var(--sg);
          outline-offset: 2px;
        }

        .judge-wrap h1 {
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .judge-wrap h2 {
          font-size: 17px;
          font-weight: 600;
        }
        .judge-wrap h3 {
          font-size: 15px;
          font-weight: 600;
        }
        .judge-wrap .mut {
          color: var(--mut);
        }
        .judge-wrap .lbl {
          font-size: 11.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--mut);
        }

        .judge-wrap .app {
          display: grid;
          grid-template-columns: 248px minmax(0, 1fr);
        }

        .judge-wrap .sb {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: auto;
          padding: 22px 14px;
          border-right: 1px solid var(--ln);
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          z-index: 30;
          display: flex;
          flex-direction: column;
        }

        .judge-wrap .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          padding: 0 10px 4px;
        }
        .judge-wrap .logo i {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: var(--g);
          display: grid;
          place-items: center;
          font-style: normal;
          font-size: 14px;
        }
        .judge-wrap .sb .role {
          padding: 0 10px 22px;
          font-size: 12px;
          color: var(--mut);
        }

        .judge-wrap .sb a {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 8px 10px;
          border-radius: 9px;
          color: #b4c0b9;
          font-size: 14px;
          position: relative;
          cursor: pointer;
        }
        .judge-wrap .sb a:hover {
          background: var(--gl);
          color: var(--ink);
        }
        .judge-wrap .sb a.on {
          background: rgba(29, 106, 70, 0.28);
          color: #fff;
        }
        .judge-wrap .sb a.on::before {
          content: '';
          position: absolute;
          left: -14px;
          top: 8px;
          bottom: 8px;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: var(--g2);
        }
        .judge-wrap .sb a b {
          margin-left: auto;
          font-size: 11px;
          font-weight: 500;
          background: var(--g);
          border-radius: 99px;
          padding: 1px 7px;
        }
        .judge-wrap .sb hr {
          border: 0;
          border-top: 1px solid var(--ln);
          margin: 14px 6px;
        }
        .judge-wrap .sb .lbl {
          padding: 0 10px 6px;
        }
        .judge-wrap .sb .pv {
          margin-top: auto;
          padding: 14px 10px 0;
          font-size: 12px;
          color: var(--mut);
          border-top: 1px solid var(--ln);
        }

        .judge-wrap .top {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 32px;
          border-bottom: 1px solid var(--ln);
          background: rgba(5, 8, 6, 0.55);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .judge-wrap .top .t small {
          display: block;
          font-size: 12px;
          color: var(--mut);
        }
        .judge-wrap .top .t b {
          font-weight: 600;
          font-size: 15px;
        }

        .judge-wrap .srch {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--gl);
          border: 1px solid var(--ln);
          border-radius: 99px;
          padding: 7px 14px;
          width: 280px;
          color: var(--mut);
        }
        .judge-wrap .srch input {
          background: none;
          border: 0;
          outline: 0;
          width: 100%;
        }

        .judge-wrap .ib {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid var(--ln);
          background: var(--gl);
          display: grid;
          place-items: center;
          position: relative;
          cursor: pointer;
        }
        .judge-wrap .dot {
          position: absolute;
          top: 7px;
          right: 8px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--sg);
          border: 2px solid #0a0f0c;
        }

        .judge-wrap .av {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2a8559, #0d3b27);
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 600;
          flex: none;
        }
        .judge-wrap .me {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13.5px;
        }
        .judge-wrap .me small {
          display: block;
          color: var(--mut);
          font-size: 11.5px;
          line-height: 1.2;
        }

        #mb {
          display: none;
        }
        .judge-wrap .pg {
          padding: 30px 32px 90px;
          max-width: 1220px;
        }
        .judge-wrap .ph {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .judge-wrap .sh {
          padding-bottom: 10px;
          margin: 30px 0 4px;
          border-bottom: 1px solid var(--ln);
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .judge-wrap .sh a {
          font-size: 13px;
          color: var(--sg);
          cursor: pointer;
        }

        .judge-wrap .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--g);
          background: var(--g);
          color: #fff;
          padding: 9px 18px;
          border-radius: 99px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
        }
        .judge-wrap .btn:hover {
          background: var(--g2);
        }
        .judge-wrap .btn.gh {
          background: transparent;
          border-color: rgba(255, 255, 255, 0.2);
          color: var(--ink);
        }
        .judge-wrap .btn.gh:hover {
          background: var(--gl);
        }
        .judge-wrap .btn.s {
          padding: 5px 14px;
          font-size: 13px;
        }

        .judge-wrap .chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin: 0 0 14px;
        }
        .judge-wrap .chips button {
          border: 1px solid var(--ln);
          background: transparent;
          border-radius: 99px;
          padding: 6px 14px;
          color: #b4c0b9;
          font-size: 13.5px;
          cursor: pointer;
        }
        .judge-wrap .chips button[aria-pressed='true'] {
          background: var(--g);
          border-color: var(--g);
          color: #fff;
        }

        .judge-wrap .st {
          display: inline-block;
          font-size: 12px;
          padding: 2px 10px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #b4c0b9;
          white-space: nowrap;
        }
        .judge-wrap .st.g {
          background: rgba(38, 131, 90, 0.22);
          border-color: rgba(38, 131, 90, 0.4);
          color: var(--sg);
        }
        .judge-wrap .st.live {
          background: rgba(38, 131, 90, 0.25);
          border-color: rgba(38, 131, 90, 0.5);
          color: #d4ecdc;
        }
        .judge-wrap .st.up {
          border-style: dashed;
        }
        .judge-wrap .st.re {
          border-color: var(--sg);
          color: var(--sg);
          background: transparent;
          box-shadow: inset 3px 0 0 var(--sg);
        }
        .judge-wrap .gl {
          background: var(--gl);
          border: 1px solid var(--ln);
          border-radius: 16px;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .judge-wrap .sc {
          overflow-x: auto;
        }
        .judge-wrap table {
          width: 100%;
          border-collapse: collapse;
          min-width: 720px;
        }
        .judge-wrap th {
          text-align: left;
          font-size: 11.5px;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--mut);
          font-weight: 500;
          padding: 12px 12px 10px;
        }
        .judge-wrap td {
          padding: 13px 12px;
          border-top: 1px solid var(--ln);
          vertical-align: middle;
        }
        .judge-wrap tr:hover td {
          background: rgba(255, 255, 255, 0.025);
        }
        .judge-wrap td small {
          display: block;
          color: var(--mut);
          font-size: 12.5px;
        }
        .judge-wrap td a.l {
          color: var(--sg);
          cursor: pointer;
        }

        .judge-wrap .strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid var(--ln);
          border-bottom: 1px solid var(--ln);
          padding: 18px 0;
        }
        .judge-wrap .strip div {
          padding: 0 22px;
          border-left: 1px solid var(--ln);
          color: var(--mut);
          font-size: 13px;
        }
        .judge-wrap .strip div:first-child {
          border: 0;
          padding-left: 0;
        }
        .judge-wrap .strip b {
          display: block;
          font-size: 30px;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: -0.02em;
        }

        .judge-wrap .g2 {
          display: grid;
          grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr);
          gap: 44px;
        }
        .judge-wrap .bar {
          height: 5px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
          min-width: 90px;
        }
        .judge-wrap .bar i {
          display: block;
          height: 100%;
          background: var(--g2);
          width: var(--p);
        }

        .judge-wrap .stack {
          display: flex;
          height: 10px;
          border-radius: 9px;
          overflow: hidden;
          gap: 2px;
          margin: 14px 0 10px;
        }
        .judge-wrap .stack i {
          display: block;
        }
        .judge-wrap .lg {
          display: flex;
          gap: 22px;
          font-size: 13px;
          color: var(--mut);
          flex-wrap: wrap;
        }
        .judge-wrap .lg b {
          color: var(--ink);
          font-weight: 500;
        }

        .judge-wrap .ls {
          list-style: none;
          padding: 0;
        }
        .judge-wrap .ls li {
          display: flex;
          gap: 14px;
          padding: 12px 0;
          border-bottom: 1px solid var(--ln);
        }
        .judge-wrap .ls li small {
          margin-left: auto;
          color: var(--mut);
          white-space: nowrap;
        }

        .judge-wrap .split {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
          gap: 40px;
          align-items: start;
        }
        .judge-wrap .view {
          border-radius: 14px;
          min-height: 340px;
          background: linear-gradient(135deg, #0f2f21, #050b08);
          border: 1px solid var(--ln);
          position: relative;
          display: grid;
          place-items: center;
          overflow: hidden;
        }
        .judge-wrap .view::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            120deg,
            rgba(255, 255, 255, 0.04) 0 1px,
            transparent 1px 24px
          );
        }
        .judge-wrap .view span {
          position: relative;
          z-index: 1;
          color: var(--mut);
          font-size: 13px;
        }

        .judge-wrap .ft {
          display: flex;
          gap: 8px;
          margin: 12px 0;
          flex-wrap: wrap;
        }
        .judge-wrap .ft span {
          border: 1px solid var(--ln);
          border-radius: 9px;
          padding: 5px 12px;
          font-size: 13px;
          color: #b4c0b9;
        }
        .judge-wrap .ft span.on {
          background: rgba(29, 106, 70, 0.3);
          color: #fff;
          border-color: var(--g);
        }

        .judge-wrap .cr {
          display: grid;
          grid-template-columns: 1fr 130px;
          gap: 6px 20px;
          padding: 16px 0;
          border-bottom: 1px solid var(--ln);
          align-items: center;
        }
        .judge-wrap .cr p {
          grid-column: 1;
          color: var(--mut);
          font-size: 13px;
        }
        .judge-wrap .cr .sv {
          grid-column: 2;
          grid-row: 1/3;
          justify-self: end;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--mut);
        }
        .judge-wrap .sv input {
          width: 54px;
          text-align: center;
          padding: 8px 0;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: var(--ink);
          font-weight: 600;
          font-size: 16px;
        }

        .judge-wrap .tot {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding: 22px 0;
        }
        .judge-wrap .tot b {
          font-size: 56px;
          font-weight: 600;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .judge-wrap .tot small {
          font-size: 20px;
          color: var(--mut);
          font-weight: 400;
        }

        .judge-wrap .fld {
          display: grid;
          gap: 6px;
          margin-bottom: 16px;
        }
        .judge-wrap .fld label {
          font-size: 12.5px;
          color: var(--mut);
        }
        .judge-wrap .fld textarea,
        .judge-wrap .fld div {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--ln);
          border-radius: 10px;
          padding: 12px 14px;
          min-height: 84px;
          color: #c8d2cc;
          font-size: 14px;
          width: 100%;
        }

        .judge-wrap .dlg {
          padding: 26px;
          background: rgba(12, 18, 14, 0.9);
          box-shadow: 0 30px 60px -30px #000;
        }
        .judge-wrap .dlg h3 {
          font-size: 18px;
          margin: 4px 0 10px;
        }

        .judge-wrap .kv {
          display: grid;
          grid-template-columns: 120px 1fr;
          padding: 9px 0;
          border-bottom: 1px solid var(--ln);
          gap: 10px;
        }
        .judge-wrap .kv span {
          color: var(--mut);
        }

        .toast-pill {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #0f3d29;
          border: 1px solid #1b6b46;
          color: #b9e2cb;
          padding: 10px 20px;
          border-radius: 99px;
          font-size: 13.5px;
          font-weight: 500;
          z-index: 9999;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
        }
      `}</style>

      {toastMsg && <div className="toast-pill">{toastMsg}</div>}

      <div className="app">
        {/* Sidebar */}
        <aside className={`sb ${mobileMenuOpen ? 'o' : ''}`}>
          <div className="logo">
            <i>P</i>Portfolio Builders
          </div>
          <div className="role">Judge Portal</div>
          <nav>
            <a
              className={activeTab === 'overview' ? 'on' : ''}
              onClick={() => navigateTo('overview')}
            >
              Overview
            </a>
            <a
              className={activeTab === 'challenges' || activeTab === 'challenge' ? 'on' : ''}
              onClick={() => navigateTo('challenges')}
            >
              Assigned Challenges
            </a>
            <a
              className={
                activeTab === 'submissions' ||
                activeTab === 'submission' ||
                activeTab === 'rubric' ||
                activeTab === 'feedback'
                  ? 'on'
                  : ''
              }
              onClick={() => navigateTo('submissions')}
            >
              Assigned Submissions <b>6</b>
            </a>
            <a
              className={activeTab === 'history' ? 'on' : ''}
              onClick={() => navigateTo('history')}
            >
              Evaluation History
            </a>
            <a
              className={activeTab === 'shortlisting' ? 'on' : ''}
              onClick={() => navigateTo('shortlisting')}
            >
              Shortlisting
            </a>
            <a
              className={activeTab === 'notifications' ? 'on' : ''}
              onClick={() => navigateTo('notifications')}
            >
              Notifications <b>3</b>
            </a>

            <hr />
            <p className="lbl">Account</p>

            <a
              className={activeTab === 'profile' ? 'on' : ''}
              onClick={() => navigateTo('profile')}
            >
              Judge Profile
            </a>
            <a
              className={activeTab === 'settings' ? 'on' : ''}
              onClick={() => navigateTo('settings')}
            >
              Account Settings
            </a>
            <a
              className={activeTab === 'help' ? 'on' : ''}
              onClick={() => navigateTo('help')}
            >
              Help & Support
            </a>
            <a
              onClick={async () => {
                await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
                window.location.href = '/auth/judge/login';
              }}
              style={{ cursor: 'pointer' }}
            >
              Logout
            </a>
          </nav>

          <p className="pv">
            You see only the challenges and submissions assigned to you. Other judges’ evaluations are private.
          </p>
        </aside>

        {/* Topbar */}
        <div style={{ minWidth: 0 }}>
          <header className="top">
            <div className="t">
              <small>
                {activeTab === 'challenge'
                  ? 'Judge Portal / Assigned Challenges'
                  : activeTab === 'submission' || activeTab === 'rubric' || activeTab === 'feedback'
                  ? 'Judge Portal / Assigned Submissions'
                  : 'Judge Portal'}
              </small>
              <b>
                {activeTab === 'overview'
                  ? 'Overview'
                  : activeTab === 'challenges'
                  ? 'Assigned Challenges'
                  : activeTab === 'challenge'
                  ? 'UI Redesign Challenge'
                  : activeTab === 'submissions'
                  ? 'Assigned Submissions'
                  : activeTab === 'submission'
                  ? 'Submission #1024'
                  : activeTab === 'rubric'
                  ? 'Evaluation Rubric'
                  : activeTab === 'feedback'
                  ? 'Marks & Feedback'
                  : activeTab === 'history'
                  ? 'Evaluation History'
                  : activeTab === 'shortlisting'
                  ? 'Shortlisting'
                  : activeTab === 'notifications'
                  ? 'Notifications'
                  : activeTab === 'profile'
                  ? 'Judge Profile'
                  : activeTab === 'settings'
                  ? 'Account Settings'
                  : 'Help & Support'}
              </b>
            </div>

            <label className="srch">
              <input
                placeholder="Search assigned challenges or submissions"
                aria-label="Search"
              />
            </label>

            <a
              className="ib"
              onClick={() => navigateTo('notifications')}
              aria-label="Notifications"
            >
              <span className="dot"></span>
            </a>

            <div className="me">
              <span className="av" style={{ overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentUser?.profilePicture ? (
                  <img
                    src={currentUser.profilePicture}
                    alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  currentUser?.avatarInitials || (currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'NM')
                )}
              </span>
              <div>
                {currentUser?.name || 'Dr. Nikhil Menon'}<small>Judge</small>
              </div>
            </div>
          </header>

          <main className="pg">
            {/* ================= 01 OVERVIEW ================= */}
            {activeTab === 'overview' && (
              <section id="overview">
                <div className="ph">
                  <div>
                    <p className="lbl">Thursday, 19 November</p>
                    <h1 style={{ margin: '6px 0' }}>Good evening, Dr. Menon.</h1>
                    <p className="mut">6 evaluations are waiting. The nearest deadline is 22 Nov.</p>
                  </div>
                  <a className="btn" onClick={() => navigateTo('submissions')}>
                    Review pending submissions
                  </a>
                </div>

                <div className="strip">
                  <div>
                    <b>4</b>Assigned challenges
                  </div>
                  <div>
                    <b>38</b>Assigned submissions
                  </div>
                  <div>
                    <b>6</b>Pending evaluations
                  </div>
                  <div>
                    <b>29</b>Completed evaluations
                  </div>
                </div>

                <div className="lg" style={{ marginTop: '22px' }}>
                  <span className="lbl">My workload</span>
                </div>
                <div className="stack">
                  <i style={{ flex: 29, background: 'var(--g2)' }}></i>
                  <i style={{ flex: 3, background: '#5f9a7a' }}></i>
                  <i style={{ flex: 6, background: 'rgba(255,255,255,.22)' }}></i>
                </div>
                <div className="lg">
                  <span>
                    <b>29</b> submitted
                  </span>
                  <span>
                    <b>3</b> in progress
                  </span>
                  <span>
                    <b>6</b> pending
                  </span>
                  <span>
                    <b>2</b> deadlines this week
                  </span>
                </div>

                <div className="g2" style={{ marginTop: '30px' }}>
                  <div>
                    <div className="sh">
                      <h2>Pending evaluations</h2>
                      <a onClick={() => navigateTo('submissions')}>All submissions</a>
                    </div>
                    <div className="sc">
                      <table style={{ minWidth: '640px' }}>
                        <thead>
                          <tr>
                            <th>Submission</th>
                            <th>Challenge</th>
                            <th>Assigned</th>
                            <th>Deadline</th>
                            <th>Status</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              <b>#1024 · Checkout flow</b>
                              <small>Anonymous A-17</small>
                            </td>
                            <td>UI Redesign</td>
                            <td>12 Nov</td>
                            <td>22 Nov</td>
                            <td>
                              <span className="st">Pending Review</span>
                            </td>
                            <td>
                              <a className="btn s" onClick={() => navigateTo('submission')}>
                                Review
                              </a>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <b>#1031 · Wayfinder</b>
                              <small>Anonymous A-22</small>
                            </td>
                            <td>Weekly UI</td>
                            <td>14 Nov</td>
                            <td>22 Nov</td>
                            <td>
                              <span className="st up">Draft Saved</span>
                            </td>
                            <td>
                              <a className="btn gh s" onClick={() => navigateTo('rubric')}>
                                Continue
                              </a>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <b>#1044 · FinFlow</b>
                              <small>Anonymous B-03</small>
                            </td>
                            <td>Fintech UX</td>
                            <td>16 Nov</td>
                            <td>25 Nov</td>
                            <td>
                              <span className="st live">In Progress</span>
                            </td>
                            <td>
                              <a className="btn gh s" onClick={() => navigateTo('rubric')}>
                                Continue
                              </a>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="sh" style={{ marginTop: '34px' }}>
                      <h2>Assigned challenges</h2>
                      <a onClick={() => navigateTo('challenges')}>View all</a>
                    </div>
                    <div className="sc">
                      <table style={{ minWidth: '700px' }}>
                        <thead>
                          <tr>
                            <th>Challenge</th>
                            <th>Category</th>
                            <th>Mine</th>
                            <th>Evaluated</th>
                            <th>Pending</th>
                            <th>Deadline</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              <b>UI Redesign Challenge</b>
                              <small>CH-2041</small>
                            </td>
                            <td>UI</td>
                            <td>14</td>
                            <td>10</td>
                            <td>4</td>
                            <td>22 Nov</td>
                            <td>
                              <a className="l" onClick={() => navigateTo('challenge')}>
                                View
                              </a>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <b>Fintech Onboarding UX</b>
                              <small>CH-2048</small>
                            </td>
                            <td>UX</td>
                            <td>12</td>
                            <td>9</td>
                            <td>3</td>
                            <td>25 Nov</td>
                            <td>
                              <a className="l" onClick={() => navigateTo('challenge')}>
                                View
                              </a>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <aside>
                    <div className="sh" style={{ marginTop: 0 }}>
                      <h2>Upcoming deadlines</h2>
                    </div>
                    <ul className="ls">
                      <li>
                        <div>
                          <b style={{ fontWeight: 500 }}>UI Redesign</b>
                          <small style={{ display: 'block', margin: 0 }}>4 left · 2d 22h</small>
                        </div>
                        <div className="bar">
                          <i style={{ width: '71%' }}></i>
                        </div>
                      </li>
                      <li>
                        <div>
                          <b style={{ fontWeight: 500 }}>Weekly UI</b>
                          <small style={{ display: 'block', margin: 0 }}>2 left · 2d 22h</small>
                        </div>
                        <div className="bar">
                          <i style={{ width: '83%' }}></i>
                        </div>
                      </li>
                    </ul>

                    <div className="sh">
                      <h2>Quick actions</h2>
                    </div>
                    <div className="ql" style={{ display: 'grid', gap: '8px' }}>
                      <a onClick={() => navigateTo('challenges')}>View assigned challenges →</a>
                      <a onClick={() => navigateTo('submissions')}>Review pending submissions →</a>
                      <a onClick={() => navigateTo('rubric')}>Continue draft evaluation →</a>
                      <a onClick={() => navigateTo('history')}>View evaluation history →</a>
                    </div>
                  </aside>
                </div>
              </section>
            )}

            {/* ================= 02 ASSIGNED CHALLENGES ================= */}
            {activeTab === 'challenges' && (
              <section id="challenges">
                <div className="ph">
                  <div>
                    <h1>Assigned challenges</h1>
                    <p className="mut" style={{ marginTop: '6px' }}>
                      Competitions the Admin has assigned to you.
                    </p>
                  </div>
                </div>

                <div className="chips">
                  <button aria-pressed="true">All</button>
                  <button aria-pressed="false">Active</button>
                  <button aria-pressed="false">Upcoming</button>
                  <button aria-pressed="false">Evaluation in progress</button>
                  <button aria-pressed="false">Completed</button>
                </div>

                <div className="sc">
                  <table style={{ minWidth: '960px' }}>
                    <thead>
                      <tr>
                        <th>Challenge</th>
                        <th>Category · type</th>
                        <th>Assigned</th>
                        <th>Mine</th>
                        <th>Evaluated</th>
                        <th>Pending</th>
                        <th>Deadline</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <b>UI Redesign Challenge</b>
                          <small>CH-2041</small>
                        </td>
                        <td>UI · Weekly</td>
                        <td>5 Nov</td>
                        <td>14</td>
                        <td>10</td>
                        <td>4</td>
                        <td>22 Nov</td>
                        <td>
                          <span className="st live">In Progress</span>
                        </td>
                        <td>
                          <a className="l" onClick={() => navigateTo('challenge')}>
                            View details
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <b>Fintech Onboarding UX</b>
                          <small>CH-2048</small>
                        </td>
                        <td>UX · Daily</td>
                        <td>8 Nov</td>
                        <td>12</td>
                        <td>9</td>
                        <td>3</td>
                        <td>25 Nov</td>
                        <td>
                          <span className="st live">In Progress</span>
                        </td>
                        <td>
                          <a className="l" onClick={() => navigateTo('challenge')}>
                            View details
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ================= 02b CHALLENGE VIEW ================= */}
            {activeTab === 'challenge' && (
              <section id="challenge">
                <div className="ph">
                  <div>
                    <p className="lbl">CH-2041 · UI · Weekly challenge</p>
                    <h1 style={{ margin: '6px 0' }}>UI Redesign Challenge</h1>
                    <p className="mut">Redesign the booking experience of a regional bus app.</p>
                  </div>
                  <span className="st live">In Progress</span>
                </div>

                <div className="split">
                  <div>
                    <h2 style={{ marginBottom: '8px' }}>Problem statement</h2>
                    <p className="mut" style={{ marginBottom: '24px', maxWidth: '62ch' }}>
                      Riders struggle to find live arrival times and book across routes. Participants redesign the core flows and defend their decisions.
                    </p>
                    <h2 style={{ marginBottom: '8px' }}>Evaluation instructions</h2>
                    <p className="mut" style={{ marginBottom: '24px', maxWidth: '62ch' }}>
                      Review every submitted file. Score each criterion independently and give written feedback. Do not discuss your scores with other judges.
                    </p>
                    <div className="sh">
                      <h2>Evaluation rubric</h2>
                      <span className="st" style={{ textDecoration: 'none' }}>
                        Read-only · set by Admin
                      </span>
                    </div>
                    <div className="sc">
                      <table style={{ minWidth: '520px' }}>
                        <thead>
                          <tr>
                            <th>Criterion</th>
                            <th>Maximum</th>
                            <th>Weight</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              <b>Visual Design</b>
                            </td>
                            <td>25</td>
                            <td>25%</td>
                          </tr>
                          <tr>
                            <td>
                              <b>User Experience</b>
                            </td>
                            <td>25</td>
                            <td>25%</td>
                          </tr>
                          <tr>
                            <td>
                              <b>Creativity</b>
                            </td>
                            <td>20</td>
                            <td>20%</td>
                          </tr>
                          <tr>
                            <td>
                              <b>Technical Execution</b>
                            </td>
                            <td>20</td>
                            <td>20%</td>
                          </tr>
                          <tr>
                            <td>
                              <b>Presentation</b>
                            </td>
                            <td>10</td>
                            <td>10%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <aside>
                    <div className="sh" style={{ marginTop: 0 }}>
                      <h2>My progress</h2>
                    </div>
                    <p style={{ fontSize: '30px', fontWeight: 600, margin: '12px 0 8px' }}>
                      10 <span className="mut" style={{ fontSize: '16px', fontWeight: 400 }}>of 14 evaluated</span>
                    </p>
                    <div className="bar">
                      <i style={{ width: '71%' }}></i>
                    </div>
                    <a className="btn" onClick={() => navigateTo('submissions')} style={{ marginTop: '20px' }}>
                      Review my submissions
                    </a>
                  </aside>
                </div>
              </section>
            )}

            {/* ================= 03 ASSIGNED SUBMISSIONS ================= */}
            {activeTab === 'submissions' && (
              <section id="submissions">
                <div className="ph">
                  <div>
                    <h1>Assigned submissions</h1>
                    <p className="mut" style={{ marginTop: '6px' }}>
                      Only submissions assigned to you appear here.
                    </p>
                  </div>
                </div>

                <div className="gl" style={{ padding: '14px 16px', marginBottom: '18px', color: '#c3cec8' }}>
                  Anonymous judging is on for this round. Participant identities are hidden.
                </div>

                <div className="chips">
                  <button aria-pressed="true">All 38</button>
                  <button aria-pressed="false">Pending review 6</button>
                  <button aria-pressed="false">In progress 3</button>
                  <button aria-pressed="false">Evaluated 29</button>
                </div>

                <div className="sc">
                  <table style={{ minWidth: '1000px' }}>
                    <thead>
                      <tr>
                        <th>Submission</th>
                        <th>Challenge</th>
                        <th>Type</th>
                        <th>Submitted</th>
                        <th>Deadline</th>
                        <th>My evaluation</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <b>#1024 · Checkout flow</b>
                          <small>Anonymous A-17</small>
                        </td>
                        <td>UI Redesign</td>
                        <td>Prototype + PDF</td>
                        <td>14 Nov</td>
                        <td>22 Nov</td>
                        <td>
                          <span className="st">Pending Review</span>
                        </td>
                        <td>
                          <a className="btn s" onClick={() => navigateTo('submission')}>
                            Review
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <b>#1031 · Wayfinder</b>
                          <small>Anonymous A-22</small>
                        </td>
                        <td>Weekly UI</td>
                        <td>Prototype</td>
                        <td>15 Nov</td>
                        <td>22 Nov</td>
                        <td>
                          <span className="st up">Draft Saved</span>
                        </td>
                        <td>
                          <a className="btn gh s" onClick={() => navigateTo('submission')}>
                            Review
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <b>#0987 · Bus Buddy</b>
                          <small>Anonymous C-09</small>
                        </td>
                        <td>Local Bus App</td>
                        <td>Prototype</td>
                        <td>12 Oct</td>
                        <td>15 Nov</td>
                        <td>
                          <span className="st g">Submitted</span>
                        </td>
                        <td>
                          <a className="l" onClick={() => navigateTo('history')}>
                            View
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ================= 03b SUBMISSION DETAIL REVIEW ================= */}
            {activeTab === 'submission' && (
              <section id="submission">
                <div className="ph">
                  <div>
                    <p className="lbl">UI Redesign Challenge · Version v2</p>
                    <h1 style={{ margin: '6px 0' }}>#1024 · Checkout flow</h1>
                    <p className="mut">Anonymous A-17 · Submitted 14 Nov · Assigned 12 Nov</p>
                  </div>
                  <span className="st">Pending Review</span>
                </div>

                <div className="split">
                  <div>
                    <div className="view">
                      <span>Design preview · prototype.fig</span>
                    </div>
                    <div className="ft">
                      <span className="on">Design file</span>
                      <span>Images 4</span>
                      <span>PDF</span>
                      <span>Video</span>
                      <span>GitHub</span>
                      <span>Live demo</span>
                    </div>
                  </div>

                  <div>
                    <h2 style={{ marginBottom: '8px' }}>Description</h2>
                    <p className="mut" style={{ marginBottom: '20px' }}>
                      A three-step checkout with inline validation and clearer error recovery for regional payment methods.
                    </p>
                    <div className="kv">
                      <span>Submission ID</span>#1024
                    </div>
                    <div className="kv">
                      <span>Challenge</span>UI Redesign Challenge
                    </div>
                    <div className="kv">
                      <span>Version</span>v2 · 14 Nov
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '22px' }}>
                      <a className="btn" onClick={() => navigateTo('rubric')}>
                        Start evaluation
                      </a>
                      <a className="btn gh" onClick={() => navigateTo('submissions')}>
                        Back to submissions
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ================= 04 EVALUATION RUBRIC ================= */}
            {activeTab === 'rubric' && (
              <section id="rubric">
                <div className="ph">
                  <div>
                    <p className="lbl">Evaluation · UI Redesign Challenge</p>
                    <h1 style={{ margin: '6px 0' }}>Submission #1024 · Checkout flow</h1>
                  </div>
                  <span className="st">Pending Review</span>
                </div>

                <div className="split">
                  <div>
                    <div className="view" style={{ minHeight: '300px' }}>
                      <span>Submission preview</span>
                    </div>
                    <div className="gl" style={{ padding: '14px', marginTop: '22px', color: '#c3cec8', fontSize: '13.5px' }}>
                      Criteria and weights are set by the Admin and cannot be changed.
                    </div>
                  </div>

                  <div>
                    <div className="sh" style={{ marginTop: 0 }}>
                      <h2>Scoring</h2>
                      <span className="mut">Total possible 100</span>
                    </div>

                    <div className="cr">
                      <div>
                        <b style={{ fontWeight: 500 }}>Visual Design</b>
                      </div>
                      <div className="sv">
                        <input
                          type="number"
                          value={scores.visual}
                          min={0}
                          max={25}
                          onChange={(e) =>
                            setScores({ ...scores, visual: Math.min(25, Number(e.target.value) || 0) })
                          }
                        />
                        / 25
                      </div>
                      <p>Hierarchy, consistency and polish.</p>
                    </div>

                    <div className="cr">
                      <div>
                        <b style={{ fontWeight: 500 }}>User Experience</b>
                      </div>
                      <div className="sv">
                        <input
                          type="number"
                          value={scores.ux}
                          min={0}
                          max={25}
                          onChange={(e) =>
                            setScores({ ...scores, ux: Math.min(25, Number(e.target.value) || 0) })
                          }
                        />
                        / 25
                      </div>
                      <p>Clarity of flows and decisions.</p>
                    </div>

                    <div className="cr">
                      <div>
                        <b style={{ fontWeight: 500 }}>Creativity</b>
                      </div>
                      <div className="sv">
                        <input
                          type="number"
                          value={scores.creativity}
                          min={0}
                          max={20}
                          onChange={(e) =>
                            setScores({ ...scores, creativity: Math.min(20, Number(e.target.value) || 0) })
                          }
                        />
                        / 20
                      </div>
                      <p>Originality of the approach.</p>
                    </div>

                    <div className="cr">
                      <div>
                        <b style={{ fontWeight: 500 }}>Technical Execution</b>
                      </div>
                      <div className="sv">
                        <input
                          type="number"
                          value={scores.technical}
                          min={0}
                          max={20}
                          onChange={(e) =>
                            setScores({ ...scores, technical: Math.min(20, Number(e.target.value) || 0) })
                          }
                        />
                        / 20
                      </div>
                      <p>Quality and feasibility.</p>
                    </div>

                    <div className="cr">
                      <div>
                        <b style={{ fontWeight: 500 }}>Presentation</b>
                      </div>
                      <div className="sv">
                        <input
                          type="number"
                          value={scores.presentation}
                          min={0}
                          max={10}
                          onChange={(e) =>
                            setScores({ ...scores, presentation: Math.min(10, Number(e.target.value) || 0) })
                          }
                        />
                        / 10
                      </div>
                      <p>Storytelling and documentation.</p>
                    </div>

                    <div className="tot">
                      <div>
                        <p className="lbl">Total score</p>
                        <b>
                          {totalScore}
                          <small> / 100</small>
                        </b>
                      </div>
                      <span className="mut">{totalScore}%</span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <a className="btn" onClick={() => navigateTo('feedback')}>
                        Continue to feedback
                      </a>
                      <a className="btn gh" onClick={() => navigateTo('submission')}>
                        Back to submission
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ================= 05 MARKS & FEEDBACK ================= */}
            {activeTab === 'feedback' && (
              <section id="feedback">
                <div className="ph">
                  <div>
                    <p className="lbl">Marks and feedback</p>
                    <h1 style={{ margin: '6px 0' }}>#1024 · Checkout flow</h1>
                    <p className="mut">UI Redesign Challenge · Total {totalScore} / 100</p>
                  </div>
                  <span className={`st ${isEvaluationLocked ? 'g' : 'up'}`}>
                    {isEvaluationLocked ? 'Submitted' : 'Draft Saved'}
                  </span>
                </div>

                <div className="split">
                  <div>
                    <div className="fld">
                      <label>Overall feedback</label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={3}
                        disabled={isEvaluationLocked}
                      />
                    </div>
                    <div className="fld">
                      <label>Strengths</label>
                      <textarea
                        value={strengths}
                        onChange={(e) => setStrengths(e.target.value)}
                        rows={2}
                        disabled={isEvaluationLocked}
                      />
                    </div>
                    <div className="fld">
                      <label>Areas for improvement</label>
                      <textarea
                        value={improvements}
                        onChange={(e) => setImprovements(e.target.value)}
                        rows={2}
                        disabled={isEvaluationLocked}
                      />
                    </div>

                    {!isEvaluationLocked && (
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button className="btn gh" onClick={handleSaveDraft}>
                          Save draft
                        </button>
                        <button className="btn" onClick={() => setShowConfirmModal(true)}>
                          Submit final evaluation
                        </button>
                      </div>
                    )}

                    {isEvaluationLocked && (
                      <div className="gl" style={{ padding: '14px 16px', color: '#9fcbb0' }}>
                        ✓ Evaluation is submitted and locked. Only an Admin can authorize reopening.
                      </div>
                    )}
                  </div>

                  <aside style={{ display: 'grid', gap: '26px' }}>
                    {showConfirmModal && (
                      <div className="gl dlg">
                        <p className="lbl">Confirmation dialog</p>
                        <h3>Submit final evaluation?</h3>
                        <div className="kv">
                          <span>Submission</span>#1024
                        </div>
                        <div className="kv">
                          <span>Total score</span>
                          <b>{totalScore} / 100</b>
                        </div>
                        <p className="mut" style={{ margin: '12px 0 16px', fontSize: '13px' }}>
                          Submitting locks this evaluation. Only an Admin can reopen it.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button className="btn gh s" onClick={() => setShowConfirmModal(false)}>
                            Cancel
                          </button>
                          <button className="btn s" onClick={handleFinalSubmit}>
                            Confirm and submit
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="lbl" style={{ marginBottom: '10px' }}>
                        Submission status
                      </p>
                      <div className="kv">
                        <span>Status</span>
                        <span className={`st ${isEvaluationLocked ? 'g' : 'up'}`}>
                          {isEvaluationLocked ? 'Submitted' : 'Draft'}
                        </span>
                      </div>
                      <div className="kv">
                        <span>Editing</span>
                        {isEvaluationLocked ? 'Disabled' : 'Enabled'}
                      </div>
                    </div>
                  </aside>
                </div>
              </section>
            )}

            {/* ================= 06 EVALUATION HISTORY ================= */}
            {activeTab === 'history' && (
              <section id="history">
                <div className="ph">
                  <div>
                    <h1>Evaluation history</h1>
                    <p className="mut" style={{ marginTop: '6px' }}>
                      Your own evaluations only.
                    </p>
                  </div>
                </div>

                <div className="strip">
                  <div>
                    <b>29</b>Evaluations submitted
                  </div>
                  <div>
                    <b>29</b>Completed
                  </div>
                  <div>
                    <b>6</b>Pending
                  </div>
                  <div>
                    <b>1</b>Reopened
                  </div>
                </div>

                <div className="sc" style={{ marginTop: '20px' }}>
                  <table style={{ minWidth: '820px' }}>
                    <thead>
                      <tr>
                        <th>Submission</th>
                        <th>Challenge</th>
                        <th>Final score</th>
                        <th>Status</th>
                        <th>Submitted</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <b>#0987 · Bus Buddy</b>
                          <small>Anonymous C-09</small>
                        </td>
                        <td>Local Bus App</td>
                        <td>88 / 100</td>
                        <td>
                          <span className="st g">Submitted</span>
                        </td>
                        <td>14 Nov</td>
                        <td>
                          <a className="l" onClick={() => showToast('Evaluation details opened.')}>
                            View evaluation
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <b>#0991 · Transit Lite</b>
                          <small>Anonymous C-14</small>
                        </td>
                        <td>Local Bus App</td>
                        <td>76 / 100</td>
                        <td>
                          <span className="st re">Reopened</span>
                        </td>
                        <td>14 Nov</td>
                        <td>
                          <a className="btn gh s" onClick={() => navigateTo('feedback')}>
                            Edit
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ================= 07 SHORTLISTING ================= */}
            {activeTab === 'shortlisting' && (
              <section id="shortlisting">
                <div className="ph">
                  <div>
                    <h1>Shortlisting</h1>
                    <p className="mut" style={{ marginTop: '6px' }}>
                      Recommendations only. Winners are decided by the platform’s authorised process.
                    </p>
                  </div>
                </div>

                <div className="gl" style={{ padding: '14px 16px', marginBottom: '18px', color: '#c3cec8' }}>
                  Shortlisting is enabled by the Admin for 2 of your challenges. If disabled, this section is hidden.
                </div>

                <div className="split">
                  <div className="gl dlg">
                    <p className="lbl">Recommendation · confirmation</p>
                    <h3>Recommend #0979 · Metro Map</h3>
                    <div className="chips" style={{ margin: '6px 0 14px' }}>
                      {['For nomination', 'As finalist', 'As winner'].map((opt) => (
                        <button
                          key={opt}
                          aria-pressed={recommendChoice === opt}
                          onClick={() => setRecommendChoice(opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <div className="fld">
                      <label>Notes</label>
                      <textarea
                        value={recommendNotes}
                        onChange={(e) => setRecommendNotes(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <p className="mut" style={{ fontSize: '13px', marginBottom: '14px' }}>
                      This is a recommendation, not a confirmed award.
                    </p>
                    <button className="btn s" onClick={handleConfirmRecommendation}>
                      Confirm recommendation
                    </button>
                  </div>

                  <div>
                    <p className="lbl" style={{ marginBottom: '8px' }}>
                      What judges cannot do
                    </p>
                    <ul className="ls">
                      <li>Publish winners</li>
                      <li>Change award categories</li>
                      <li>Modify public voting results</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* ================= 08 NOTIFICATIONS ================= */}
            {activeTab === 'notifications' && (
              <section id="notifications">
                <div className="ph">
                  <h1>Notifications</h1>
                  <button className="btn gh s" onClick={() => showToast('All notifications marked as read')}>
                    Mark all as read
                  </button>
                </div>

                <div className="chips">
                  <button aria-pressed="true">All</button>
                  <button aria-pressed="false">Assignments</button>
                  <button aria-pressed="false">Deadlines</button>
                </div>

                <div className="nt un" style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto', gap: '14px', padding: '15px 0', borderBottom: '1px solid var(--ln)' }}>
                  <i style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--sg)', marginTop: '8px' }}></i>
                  <div>
                    <b>Three new submissions require evaluation</b>
                    <p className="mut">UI Redesign Challenge</p>
                  </div>
                  <span className="mut" style={{ fontSize: '12.5px' }}>2h ago</span>
                </div>
              </section>
            )}

            {/* ================= 09 PROFILE ================= */}
            {activeTab === 'profile' && (
              <section id="profile">
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', margin: '0 0 28px 0', flexWrap: 'wrap' }}>
                  <span className="av" style={{ width: '88px', height: '88px', fontSize: '28px', border: '3px solid #34f5c5', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {currentUser?.profilePicture ? (
                      <img
                        src={currentUser.profilePicture}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      currentUser?.avatarInitials || (currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'NM')
                    )}
                  </span>
                  <div style={{ flex: 1, paddingBottom: '6px' }}>
                    <h1>{currentUser?.name || 'Dr. Nikhil Menon'}</h1>
                    <p className="mut">{currentUser?.qualification ? `${currentUser.qualification} · ` : ''}Judge</p>
                  </div>
                </div>

                <div className="split">
                  <div>
                    <h2>Biography</h2>
                    <p className="mut" style={{ margin: '8px 0 26px', maxWidth: '60ch' }}>
                      Experienced industry professional evaluating innovation, technical execution, user experience, and design feasibility.
                    </p>
                    <h2 style={{ marginBottom: '12px' }}>Experience & Role</h2>
                    <div style={{ borderLeft: '1px solid var(--ln)', paddingLeft: '16px' }}>
                      <div>
                        <b>{currentUser?.qualification || 'Expert Judge & Panelist'}</b>
                        <small style={{ display: 'block', color: 'var(--mut)' }}>{currentUser?.location || 'India'}</small>
                      </div>
                    </div>
                  </div>

                  <aside>
                    <h2>Details</h2>
                    <div className="kv">
                      <span>Email</span>{currentUser?.email || 'judge@example.com'}
                    </div>
                    <div className="kv">
                      <span>Location</span>{currentUser?.location || 'India'}
                    </div>
                    <div className="kv">
                      <span>Role</span>Judge
                    </div>
                  </aside>
                </div>
              </section>
            )}

            {/* ================= 10 SETTINGS ================= */}
            {activeTab === 'settings' && (
              <section id="settings">
                <div className="ph">
                  <h1>Account settings</h1>
                </div>
                <div className="fld">
                  <label>Current password</label>
                  <input type="password" value="••••••••••" readOnly />
                </div>
                <div className="fld">
                  <label>New password</label>
                  <input type="password" placeholder="At least 12 characters" />
                </div>
                <button className="btn" onClick={() => showToast('Password updated.')}>
                  Update password
                </button>
              </section>
            )}

            {/* ================= 11 HELP ================= */}
            {activeTab === 'help' && (
              <section id="help">
                <div className="ph">
                  <div>
                    <h1>Help & support</h1>
                    <p className="mut" style={{ marginTop: '6px' }}>
                      Guides for judges and a direct line to the Admin team.
                    </p>
                  </div>
                </div>
                <div className="ql" style={{ display: 'grid', gap: '8px', maxWidth: '640px' }}>
                  <a onClick={() => showToast('Guide opened')}>How scoring and rubrics work →</a>
                  <a onClick={() => showToast('Guide opened')}>Saving drafts and submitting final evaluations →</a>
                  <a onClick={() => showToast('Guide opened')}>Privacy and anonymous judging →</a>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
