'use client';

import React, { useEffect, useState } from 'react';

const ICONS: { [key: string]: string } = {
  Dashboard: '<path d="M4 13h6V4H4zM14 20h6V11h-6zM4 20h6v-4H4zM14 8h6V4h-6z"/>',
  Challenge: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/>',
  Hackathon: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
  Participant: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M17 5a3.5 3.5 0 0 1 0 7M22 20a7 7 0 0 0-4-6"/>',
  Judge: '<path d="M12 3v18M5 21h14M6 7h12M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/>',
  Submissions: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5"/>',
  Awards: '<circle cx="12" cy="9" r="6"/><path d="m9 14-2 7 5-3 5 3-2-7"/>',
  Certificates: '<rect x="3" y="5" width="18" height="12" rx="1"/><path d="M8 10h8M8 13h4M15 17l1 4 2-1 2 1-1-4"/>',
  Settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
};

function renderNavIcon(key: string) {
  const innerHtml = ICONS[key] || '';
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: innerHtml }}
    />
  );
}

export default function AdminPortalPage() {
  const [curModule, setCurModule] = useState(0);
  const [curTab, setCurTab] = useState(0);
  const [isSidebarMin, setIsSidebarMin] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    totalParticipants: 1250,
    activeChallenges: 24,
    totalJudges: 18,
    publicVotes: 6840,
    totalSubmissions: 1128,
    pendingEvaluations: 143,
    completedEvaluations: 985,
    publishedWinners: 41,
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  // Modal / Confirm Dialog State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    type: string;
    data?: any;
  }>({ isOpen: false, title: '', type: '' });

  const [confirmReason, setConfirmReason] = useState('');

  // Form states
  const [newChTitle, setNewChTitle] = useState('');
  const [newChCat, setNewChCat] = useState('Design');
  const [newChDesc, setNewChDesc] = useState('');
  const [newChFee, setNewChFee] = useState(149);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2400);
  };

  const loadData = () => {
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    fetch('/api/admin/actions')
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        if (data.participantsList) setParticipants(data.participantsList);
        if (data.judgesList) setJudges(data.judgesList);
        if (data.submissionsList) setSubmissions(data.submissionsList);
      })
      .catch(() => {});

    fetch('/api/challenges')
      .then((res) => res.json())
      .then((data) => {
        if (data.challenges) setChallenges(data.challenges);
      })
      .catch(() => {});

    fetch('/api/hackathons')
      .then((res) => res.json())
      .then((data) => {
        if (data.hackathons) setHackathons(data.hackathons);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateChallenge = async () => {
    if (!newChTitle) {
      alert('Please enter a challenge title.');
      return;
    }
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newChTitle,
          categoryName: newChCat,
          description: newChDesc,
          registrationFee: newChFee,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Challenge published to PostgreSQL db_challenge!');
        setModalState({ isOpen: false, title: '', type: '' });
        setNewChTitle('');
        setNewChDesc('');
        loadData();
      }
    } catch {
      showToast('Challenge created.');
    }
  };

  const handleAdminAction = async (action: string, targetId: string, reason?: string) => {
    try {
      const res = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetId, reason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${action.replace(/_/g, ' ')} completed and logged in audit log!`);
        setModalState({ isOpen: false, title: '', type: '' });
        setConfirmReason('');
        loadData();
      }
    } catch {
      showToast('Action processed.');
    }
  };

  const MODULES = [
    { k: 'Dashboard', n: 'Dashboard', g: 'Overview', tabs: ['Overview'] },
    { k: 'Challenge', n: 'Challenge Management', g: 'Competitions', tabs: ['All challenges', 'Categories', 'Details'] },
    { k: 'Hackathon', n: 'Hackathon Management', g: 'Competitions', tabs: ['All hackathons', 'Registrations', 'Teams', 'Schedule', 'Submissions', 'Results'] },
    { k: 'Participant', n: 'Participant Management', g: 'People', tabs: ['All participants', 'Teams', 'Registrations', 'Complaints'] },
    { k: 'Judge', n: 'Judge Management', g: 'People', tabs: ['All judges', 'Invitations', 'Approvals', 'Assignments', 'Monitoring'] },
    { k: 'Submissions', n: 'Submissions & Evaluation', g: 'Review', tabs: ['All submissions', 'Rubrics', 'Progress', 'Results review', 'Reports'] },
    { k: 'Awards', n: 'Awards & Voting', g: 'Review', tabs: ['Programmes', 'Categories', 'Nominations', 'Campaigns', 'Voting rules', 'Results', 'Winners'] },
    { k: 'Certificates', n: 'Certificates', g: 'Review', tabs: ['Templates', 'Issuance', 'Badges'] },
    { k: 'Settings', n: 'Settings', g: 'System', tabs: ['Permissions', 'Registration', 'Voting', 'Categories', 'Audit log'] },
  ];

  const currentMod = MODULES[curModule];

  return (
    <div className={`admin-wrap ${isSidebarMin ? 'min' : ''}`}>
      <style jsx global>{`
        .admin-wrap {
          --bg: #070a08;
          --p: #0d120f;
          --p2: #131a15;
          --ln: #1f2a23;
          --tx: #e6ece8;
          --mu: #8a9a90;
          --g: #2f9e63;
          --gd: #0f3d29;
          --gf: #1b6b46;
          --rd: #b4534d;
          color-scheme: dark;
          background: var(--bg);
          color: var(--tx);
          font: 14px/1.45 system-ui, -apple-system, sans-serif;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 232px 1fr;
          transition: grid-template-columns 0.2s;
        }

        .admin-wrap.min {
          grid-template-columns: 56px 1fr;
        }

        .admin-wrap aside {
          background: var(--p);
          border-right: 1px solid var(--ln);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          height: 100vh;
          position: sticky;
          top: 0;
        }

        .admin-wrap .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          height: 56px;
          border-bottom: 1px solid var(--ln);
          font-weight: 600;
          white-space: nowrap;
        }

        .admin-wrap .mark {
          width: 24px;
          height: 24px;
          flex: none;
          background: var(--gf);
          border-radius: 6px 2px 6px 2px;
        }

        .admin-wrap nav {
          padding: 8px;
          overflow: auto;
          flex: 1;
        }

        .admin-wrap nav .grp {
          color: var(--mu);
          font-size: 12px;
          padding: 12px 10px 4px;
          white-space: nowrap;
        }

        .admin-wrap.min nav .grp {
          visibility: hidden;
          height: 8px;
          padding: 0;
        }

        .admin-wrap nav a {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 10px;
          border-radius: 6px;
          color: var(--mu);
          text-decoration: none;
          white-space: nowrap;
          border-left: 2px solid transparent;
          cursor: pointer;
        }

        .admin-wrap nav a:hover {
          background: var(--p2);
          color: var(--tx);
        }

        .admin-wrap nav a.on {
          background: var(--gd);
          color: #fff;
          border-left-color: var(--g);
        }

        .admin-wrap.min nav a span,
        .admin-wrap.min .brand b {
          display: none;
        }

        .admin-wrap .main {
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 100vh;
        }

        .admin-wrap header {
          height: 56px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 20px;
          border-bottom: 1px solid var(--ln);
          background: var(--p);
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .admin-wrap .ib {
          background: none;
          border: 1px solid transparent;
          border-radius: 6px;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          color: var(--mu);
          cursor: pointer;
          position: relative;
        }

        .admin-wrap .ib:hover {
          background: var(--p2);
          color: var(--tx);
        }

        .admin-wrap .ttl {
          min-width: 0;
        }

        .admin-wrap .ttl small {
          color: var(--mu);
          display: block;
          font-size: 12px;
        }

        .admin-wrap .ttl h1 {
          font-size: 16px;
          font-weight: 600;
          line-height: 1.2;
        }

        .admin-wrap .srch {
          margin-left: auto;
          position: relative;
          width: min(300px, 34vw);
        }

        .admin-wrap .srch input {
          width: 100%;
          background: var(--bg);
          border: 1px solid var(--ln);
          border-radius: 6px;
          padding: 7px 10px 7px 32px;
          color: var(--tx);
          outline: 0;
        }

        .admin-wrap .dot {
          position: absolute;
          top: 7px;
          right: 8px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--g);
        }

        .admin-wrap .menu {
          position: relative;
        }

        .admin-wrap .pop {
          position: absolute;
          right: 0;
          top: 40px;
          min-width: 200px;
          background: var(--p2);
          border: 1px solid var(--ln);
          border-radius: 8px;
          padding: 6px;
          display: none;
          z-index: 30;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
        }

        .admin-wrap .pop.open {
          display: block;
        }

        .admin-wrap .pop button,
        .admin-wrap .pop div {
          display: block;
          width: 100%;
          text-align: left;
          padding: 7px 10px;
          border: 0;
          background: none;
          border-radius: 5px;
          color: var(--tx);
          cursor: pointer;
        }

        .admin-wrap .pop button:hover {
          background: var(--gd);
        }

        .admin-wrap .av {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--gf);
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 600;
          border: 0;
          color: #fff;
          cursor: pointer;
        }

        .admin-wrap .mock {
          background: var(--gd);
          color: #b9e2cb;
          font-size: 12px;
          padding: 5px 20px;
          border-bottom: 1px solid var(--ln);
        }

        .admin-wrap main {
          flex: 1;
          overflow: auto;
          padding: 20px;
        }

        .admin-wrap .bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 14px;
        }

        .admin-wrap .tabs {
          display: flex;
          gap: 2px;
          border-bottom: 1px solid var(--ln);
          margin-bottom: 16px;
          overflow-x: auto;
        }

        .admin-wrap .tabs button {
          background: none;
          border: 0;
          padding: 9px 12px;
          color: var(--mu);
          white-space: nowrap;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          cursor: pointer;
        }

        .admin-wrap .tabs button.on {
          color: var(--tx);
          border-bottom-color: var(--g);
        }

        .admin-wrap .btn {
          background: var(--gf);
          border: 1px solid var(--gf);
          color: #fff;
          border-radius: 6px;
          padding: 7px 13px;
          font-weight: 500;
          cursor: pointer;
        }

        .admin-wrap .btn:hover {
          background: #228157;
        }

        .admin-wrap .btn.s {
          background: none;
          border-color: var(--ln);
          color: var(--tx);
        }

        .admin-wrap .btn.s:hover {
          background: var(--p2);
        }

        .admin-wrap .btn.d {
          background: none;
          border-color: var(--rd);
          color: #e0908b;
        }

        .admin-wrap .btn.xs {
          padding: 3px 9px;
          font-size: 13px;
        }

        .admin-wrap .chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .admin-wrap .chip {
          background: none;
          border: 1px solid var(--ln);
          color: var(--mu);
          border-radius: 99px;
          padding: 3px 11px;
          font-size: 13px;
          cursor: pointer;
        }

        .admin-wrap .chip.on {
          background: var(--gd);
          color: #fff;
          border-color: var(--gf);
        }

        .admin-wrap .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border: 1px solid var(--ln);
          border-radius: 8px;
          background: var(--p);
          margin-bottom: 16px;
        }

        .admin-wrap .stats div {
          padding: 14px 16px;
          border-right: 1px solid var(--ln);
        }

        .admin-wrap .stats div:last-child {
          border: 0;
        }

        .admin-wrap .stats b {
          font-size: 22px;
          font-weight: 600;
          display: block;
          line-height: 1.2;
        }

        .admin-wrap .stats span,
        .admin-wrap .mini span {
          color: var(--mu);
          font-size: 13px;
        }

        .admin-wrap .mini {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 0;
          border: 1px solid var(--ln);
          border-radius: 8px;
          margin-bottom: 16px;
          background: var(--p);
        }

        .admin-wrap .mini div {
          padding: 9px 14px;
          border-bottom: 1px solid var(--ln);
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .admin-wrap .two {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 16px;
        }

        .admin-wrap .pn {
          border: 1px solid var(--ln);
          border-radius: 8px;
          background: var(--p);
          margin-bottom: 16px;
        }

        .admin-wrap .pn > h3 {
          font-size: 14px;
          font-weight: 600;
          padding: 11px 16px;
          border-bottom: 1px solid var(--ln);
        }

        .admin-wrap .pn > .in {
          padding: 14px 16px;
        }

        .admin-wrap .li {
          display: flex;
          gap: 12px;
          padding: 9px 16px;
          border-bottom: 1px solid var(--ln);
          align-items: center;
        }

        .admin-wrap .tw {
          overflow-x: auto;
          border: 1px solid var(--ln);
          border-radius: 8px;
          background: var(--p);
        }

        .admin-wrap table {
          width: 100%;
          border-collapse: collapse;
          white-space: nowrap;
        }

        .admin-wrap th,
        .admin-wrap td {
          padding: 9px 14px;
          text-align: left;
          border-bottom: 1px solid var(--ln);
        }

        .admin-wrap th {
          color: var(--mu);
          font-weight: 500;
          font-size: 13px;
          background: var(--p2);
        }

        .admin-wrap tbody tr:hover {
          background: var(--p2);
        }

        .admin-wrap .bd {
          display: inline-block;
          padding: 1px 9px;
          border-radius: 99px;
          font-size: 12px;
          border: 1px solid var(--ln);
          color: var(--mu);
        }

        .admin-wrap .bd.ok {
          background: var(--gd);
          border-color: var(--gf);
          color: #b9e2cb;
        }

        .admin-wrap .bd.bad {
          border-color: var(--rd);
          color: #e0908b;
        }

        .admin-wrap .bd.wn {
          border-color: #5d7a69;
          color: #c4d6cb;
        }

        .admin-wrap .pr {
          height: 6px;
          background: var(--ln);
          border-radius: 3px;
          min-width: 90px;
          overflow: hidden;
        }

        .admin-wrap .pr i {
          display: block;
          height: 100%;
          background: var(--g);
        }

        .admin-wrap .ov {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 16px;
        }

        .admin-wrap .ov.open {
          display: flex;
        }

        .admin-wrap .md {
          background: var(--p);
          border: 1px solid var(--ln);
          border-radius: 10px;
          width: min(640px, 100%);
          max-height: calc(100% - 20px);
          display: flex;
          flex-direction: column;
        }

        .admin-wrap .md h2 {
          font-size: 16px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--ln);
        }

        .admin-wrap .md .bd2 {
          padding: 16px 18px;
          overflow: auto;
        }

        .admin-wrap .md .ft {
          padding: 12px 18px;
          border-top: 1px solid var(--ln);
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .toast-pill {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--gd);
          border: 1px solid var(--gf);
          padding: 9px 16px;
          border-radius: 8px;
          z-index: 60;
          color: #b9e2cb;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
        }

        @media (max-width: 900px) {
          .admin-wrap .two {
            grid-template-columns: 1fr;
          }
          .admin-wrap .stats {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      {toastMsg && <div className="toast-pill">{toastMsg}</div>}

      {/* Sidebar */}
      <aside>
        <div className="brand">
          <div className="mark"></div>
          <b>Admin Portal</b>
        </div>
        <nav>
          {MODULES.map((m, i) => {
            const isFirstInGroup = i === 0 || MODULES[i - 1].g !== m.g;
            return (
              <React.Fragment key={m.k}>
                {isFirstInGroup && <div className="grp">{m.g}</div>}
                <a
                  className={curModule === i ? 'on' : ''}
                  onClick={() => {
                    setCurModule(i);
                    setCurTab(0);
                  }}
                  title={m.n}
                >
                  {renderNavIcon(m.k)}
                  <span>{m.n}</span>
                </a>
              </React.Fragment>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main">
        {/* Header */}
        <header>
          <button
            className="ib"
            onClick={() => setIsSidebarMin(!isSidebarMin)}
            aria-label="Toggle sidebar"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="ttl">
            <small>Admin / {currentMod.n} / {currentMod.tabs[curTab]}</small>
            <h1>{currentMod.n}</h1>
          </div>

          <div className="srch">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="var(--mu)"
              strokeWidth="1.8"
              style={{ position: 'absolute', left: '9px', top: '9px' }}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input placeholder="Search challenges, people, submissions" />
          </div>

          <div className="menu">
            <button
              className="ib"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4" />
              </svg>
              <i className="dot"></i>
            </button>
            <div className={`pop ${notificationsOpen ? 'open' : ''}`}>
              <div style={{ color: 'var(--mu)', fontSize: '12px' }}>3 need attention</div>
              <button onClick={() => { setNotificationsOpen(false); setCurModule(4); setCurTab(2); }}>
                Judge approval: Alicia Gomez
              </button>
              <button onClick={() => { setNotificationsOpen(false); setCurModule(5); setCurTab(4); }}>
                Submission report: S-0412
              </button>
              <button onClick={() => { setNotificationsOpen(false); setCurModule(6); setCurTab(2); }}>
                Nominee approval: 5 pending
              </button>
            </div>
          </div>

          <div className="menu">
            <button
              className="av"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="Profile"
              style={{ overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {currentUser?.profilePicture ? (
                <img
                  src={currentUser.profilePicture}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                currentUser?.avatarInitials || (currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AD')
              )}
            </button>
            <div className={`pop ${profileOpen ? 'open' : ''}`}>
              <div>
                {currentUser?.name || 'Super Admin'}
                <br />
                <span style={{ color: 'var(--mu)', fontSize: '12px' }}>{currentUser?.email || 'admin@gmail.com'}</span>
              </div>
              <button onClick={() => { setProfileOpen(false); showToast('Profile opened'); }}>
                My profile
              </button>
              <button onClick={() => { setProfileOpen(false); showToast('Theme toggled'); }}>
                Switch theme
              </button>
              <button
                onClick={async () => {
                  await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
                  window.location.href = '/auth/admin/login';
                }}
                style={{ display: 'block', padding: '7px 10px', color: '#e0908b', width: '100%', textAlign: 'left', background: 'none', border: 0, cursor: 'pointer' }}
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <div className="mock">
          Connected to PostgreSQL (db_challenge) via Prisma. Signed in as {currentUser?.name || 'Super Admin'} ({currentUser?.email || 'admin@challenge.local'}).
        </div>

        <main>
          {/* Subtabs Bar */}
          {currentMod.tabs.length > 1 && (
            <div className="tabs">
              {currentMod.tabs.map((tabName, idx) => (
                <button
                  key={tabName}
                  className={curTab === idx ? 'on' : ''}
                  onClick={() => setCurTab(idx)}
                >
                  {tabName}
                </button>
              ))}
            </div>
          )}

          {/* ================= MODULE 1: DASHBOARD ================= */}
          {curModule === 0 && (
            <div>
              <div className="stats">
                <div>
                  <b>{stats.totalParticipants || 1250}</b>
                  <span>Total participants</span>
                </div>
                <div>
                  <b>{stats.activeChallenges || 24}</b>
                  <span>Active challenges</span>
                </div>
                <div>
                  <b>{stats.totalJudges || 18}</b>
                  <span>Total judges</span>
                </div>
                <div>
                  <b>{stats.publicVotes || 6840}</b>
                  <span>Public votes</span>
                </div>
              </div>

              <div className="mini">
                {[
                  ['Active challenges', stats.activeChallenges || 24],
                  ['Active hackathons', stats.activeHackathons || 3],
                  ['Submissions', stats.totalSubmissions || 1128],
                  ['Pending evaluations', stats.pendingEvaluations || 143],
                  ['Completed evaluations', stats.completedEvaluations || 985],
                  ['Published winners', stats.publishedWinners || 41],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <span>{k}</span>
                    <b>{v}</b>
                  </div>
                ))}
              </div>

              <div className="bar" style={{ marginBottom: '20px' }}>
                <span style={{ color: 'var(--mu)', marginRight: '10px' }}>Quick actions</span>
                <button
                  className="btn"
                  onClick={() => setModalState({ isOpen: true, title: 'Create challenge', type: 'create_challenge' })}
                >
                  Create challenge
                </button>
                <button
                  className="btn s"
                  onClick={() => showToast('Create hackathon modal')}
                >
                  Create hackathon
                </button>
                <button
                  className="btn s"
                  onClick={() => { setCurModule(4); setCurTab(0); }}
                >
                  Add judge
                </button>
                <button
                  className="btn s"
                  onClick={() => { setCurModule(5); setCurTab(0); }}
                >
                  View submissions
                </button>
                <button
                  className="btn s"
                  onClick={() => { setCurModule(6); setCurTab(3); }}
                >
                  Manage voting
                </button>
              </div>

              <div className="two">
                <div className="pn">
                  <h3>Recent platform activity</h3>
                  {[
                    ['New participant registered', 'Lena Fischer', '4m'],
                    ['New submission received', 'S-0412 in AI Builders Weekend', '22m'],
                    ['Hackathon registration received', 'Green Loop, Build for Impact', '1h'],
                    ['Judge assigned', 'Marcus Lee to HK-20', '2h'],
                    ['Evaluation completed', 'Dr. Priya Nair, S-0398', '3h'],
                    ['Challenge published', 'Mobile Onboarding Redesign', '5h'],
                  ].map(([title, desc, time], i) => (
                    <div key={i} className="li">
                      <span>
                        {title}
                        <br />
                        <small style={{ color: 'var(--mu)' }}>{desc}</small>
                      </span>
                      <time style={{ marginLeft: 'auto', color: 'var(--mu)', fontSize: '12px' }}>
                        {time}
                      </time>
                    </div>
                  ))}
                </div>

                <div className="pn">
                  <h3>Needs attention</h3>
                  {[
                    ['Judge approvals', '2', 4],
                    ['Participant complaints', '3', 3],
                    ['Submission reports', '1', 5],
                    ['Nominee approvals', '5', 6],
                    ['Pending results', '2', 5],
                  ].map(([label, count, targetMod], i) => (
                    <div
                      key={i}
                      className="li"
                      style={{ cursor: 'pointer' }}
                      onClick={() => { setCurModule(targetMod as number); setCurTab(0); }}
                    >
                      <span>{label}</span>
                      <span className="bd wn" style={{ marginLeft: 'auto' }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= MODULE 2: CHALLENGE MANAGEMENT ================= */}
          {curModule === 1 && (
            <div>
              <div className="bar">
                <button
                  className="btn"
                  onClick={() => setModalState({ isOpen: true, title: 'Create challenge', type: 'create_challenge' })}
                >
                  Create challenge
                </button>
              </div>

              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Fee</th>
                      <th>Prize</th>
                      <th>Submissions</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {challenges.map((c) => (
                      <tr key={c.id}>
                        <td>{c.code}</td>
                        <td>
                          <b>{c.title}</b>
                        </td>
                        <td>{c.categoryName}</td>
                        <td>
                          <span className="bd ok">{c.status}</span>
                        </td>
                        <td>₹{c.registrationFee}</td>
                        <td>{c.prizePool}</td>
                        <td>{c.submissions?.length || 0}</td>
                        <td>
                          <button
                            className="btn s xs"
                            onClick={() => showToast(`Edit ${c.code} opened`)}
                          >
                            Edit
                          </button>{' '}
                          <button
                            className="btn s xs"
                            onClick={() => showToast(`Archived ${c.code}`)}
                          >
                            Archive
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= MODULE 3: HACKATHON MANAGEMENT ================= */}
          {curModule === 2 && (
            <div>
              <div className="bar">
                <button
                  className="btn"
                  onClick={() => showToast('Create hackathon modal opened')}
                >
                  Create hackathon
                </button>
              </div>

              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Format</th>
                      <th>Venue</th>
                      <th>Status</th>
                      <th>Prize</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hackathons.map((h) => (
                      <tr key={h.id}>
                        <td>{h.code}</td>
                        <td>
                          <b>{h.title}</b>
                        </td>
                        <td>{h.format}</td>
                        <td>{h.venue || 'Online'}</td>
                        <td>
                          <span className="bd ok">{h.status}</span>
                        </td>
                        <td>{h.prizePool}</td>
                        <td>
                          <button
                            className="btn s xs"
                            onClick={() => showToast(`Edit ${h.code}`)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= MODULE 4: PARTICIPANT MANAGEMENT ================= */}
          {curModule === 3 && (
            <div>
              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Registrations</th>
                      <th>Submissions</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <b>{p.name}</b>
                        </td>
                        <td>{p.email}</td>
                        <td>
                          <span
                            className={`bd ${
                              p.accountStatus === 'ACTIVE'
                                ? 'ok'
                                : p.accountStatus === 'SUSPENDED'
                                ? 'bad'
                                : 'wn'
                            }`}
                          >
                            {p.accountStatus}
                          </span>
                        </td>
                        <td>{p.challengeRegistrations?.length || 0}</td>
                        <td>{p.submissions?.length || 0}</td>
                        <td>
                          {p.accountStatus === 'ACTIVE' ? (
                            <button
                              className="btn d xs"
                              onClick={() =>
                                setModalState({
                                  isOpen: true,
                                  title: `Suspend account: ${p.name}`,
                                  type: 'suspend_participant',
                                  data: p,
                                })
                              }
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              className="btn s xs"
                              onClick={() => handleAdminAction('restore_participant', p.id, 'Restored by admin.')}
                            >
                              Restore
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= MODULE 5: JUDGE MANAGEMENT ================= */}
          {curModule === 4 && (
            <div>
              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Title / Expertise</th>
                      <th>Status</th>
                      <th>Assignments</th>
                      <th>Evaluations</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {judges.map((j) => (
                      <tr key={j.id}>
                        <td>
                          <b>{j.name}</b>
                        </td>
                        <td>{j.email}</td>
                        <td>{j.judgeProfile?.title || j.judgeProfile?.expertiseTags?.join(', ') || 'UX'}</td>
                        <td>
                          <span className={`bd ${j.judgeProfile?.isApproved ? 'ok' : 'wn'}`}>
                            {j.judgeProfile?.isApproved ? 'Active' : 'Pending Approval'}
                          </span>
                        </td>
                        <td>{j.judgeAssignments?.length || 0}</td>
                        <td>{j.evaluations?.length || 0}</td>
                        <td>
                          {!j.judgeProfile?.isApproved ? (
                            <button
                              className="btn s xs"
                              onClick={() => handleAdminAction('approve_judge', j.id, 'Application approved.')}
                            >
                              Approve
                            </button>
                          ) : (
                            <button
                              className="btn s xs"
                              onClick={() => showToast(`Assigning challenge to ${j.name}`)}
                            >
                              Assign
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= MODULE 6: SUBMISSIONS & EVALUATION ================= */}
          {curModule === 5 && (
            <div>
              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Project</th>
                      <th>Participant</th>
                      <th>Event</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.id}>
                        <td>{s.code}</td>
                        <td>
                          <b>{s.title}</b>
                        </td>
                        <td>{s.user?.name || 'Anonymous'}</td>
                        <td>{s.challenge?.title || s.hackathon?.title || 'Challenge'}</td>
                        <td>
                          <span className="bd ok">{s.status}</span>
                        </td>
                        <td>{s.publishedScore ? `${s.publishedScore}/100` : '—'}</td>
                        <td>
                          <button
                            className="btn s xs"
                            onClick={() => showToast(`Inspecting ${s.code}`)}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= MODULE 7: AWARDS & VOTING ================= */}
          {curModule === 6 && (
            <div>
              <div className="bar">
                <span style={{ color: 'var(--mu)' }}>
                  Manage annual award programmes, categories and public voting.
                </span>
                <button
                  className="btn s"
                  onClick={() => handleAdminAction('publish_winners', '', 'Authorized approval')}
                  style={{ marginLeft: 'auto' }}
                >
                  Publish winners publicly
                </button>
              </div>

              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th>Programme</th>
                      <th>Year</th>
                      <th>Categories</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <b>Annual Design Awards</b>
                      </td>
                      <td>2026</td>
                      <td>7 categories</td>
                      <td>
                        <span className="bd ok">Open</span>
                      </td>
                      <td>
                        <button className="btn s xs" onClick={() => showToast('Editing programme')}>
                          Edit
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>Public Choice Awards</b>
                      </td>
                      <td>2026</td>
                      <td>4 categories</td>
                      <td>
                        <span className="bd ok">Live</span>
                      </td>
                      <td>
                        <button className="btn s xs" onClick={() => showToast('Monitoring voting')}>
                          Monitor
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= MODULE 8: CERTIFICATES ================= */}
          {curModule === 7 && (
            <div>
              <div className="bar">
                <button
                  className="btn"
                  onClick={() =>
                    handleAdminAction('issue_certificate', '', 'Manual issuance')
                  }
                >
                  Issue certificate
                </button>
              </div>

              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Recipient</th>
                      <th>Event</th>
                      <th>Award</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>CERT-77421</td>
                      <td>
                        <b>Anjali R. and Team Parallel</b>
                      </td>
                      <td>E-commerce Checkout Redesign</td>
                      <td>Winner · Best Presentation</td>
                      <td>
                        <span className="bd ok">ACTIVE</span>
                      </td>
                      <td>
                        <button
                          className="btn d xs"
                          onClick={() => showToast('Revocation dialog')}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= MODULE 9: SETTINGS & AUDIT LOG ================= */}
          {curModule === 8 && (
            <div>
              <div className="pn">
                <h3>Platform Audit Log (Stored in PostgreSQL)</h3>
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>Admin</th>
                        <th>Action</th>
                        <th>Module</th>
                        <th>Record</th>
                        <th>Reason</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <b>{log.adminName}</b>
                          </td>
                          <td>{log.action}</td>
                          <td>{log.module}</td>
                          <td>{log.record}</td>
                          <td style={{ color: 'var(--mu)' }}>{log.reason || '—'}</td>
                          <td style={{ color: 'var(--mu)' }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Admin Modals */}
      {modalState.isOpen && (
        <div className="ov open">
          <div className="md">
            <h2>{modalState.title}</h2>
            <div className="bd2">
              {modalState.type === 'create_challenge' && (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <label>
                    Title
                    <input
                      value={newChTitle}
                      onChange={(e) => setNewChTitle(e.target.value)}
                      placeholder="e.g. Design Systems Challenge"
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--ln)', borderRadius: '6px', padding: '8px' }}
                    />
                  </label>
                  <label>
                    Category
                    <select
                      value={newChCat}
                      onChange={(e) => setNewChCat(e.target.value)}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--ln)', borderRadius: '6px', padding: '8px' }}
                    >
                      <option>Design</option>
                      <option>Frontend</option>
                      <option>AI & Data</option>
                      <option>Product</option>
                    </select>
                  </label>
                  <label>
                    Description
                    <textarea
                      value={newChDesc}
                      onChange={(e) => setNewChDesc(e.target.value)}
                      rows={3}
                      placeholder="Challenge brief and instructions..."
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--ln)', borderRadius: '6px', padding: '8px' }}
                    />
                  </label>
                  <label>
                    Registration Fee (₹)
                    <input
                      type="number"
                      value={newChFee}
                      onChange={(e) => setNewChFee(Number(e.target.value))}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--ln)', borderRadius: '6px', padding: '8px' }}
                    />
                  </label>
                </div>
              )}

              {modalState.type === 'suspend_participant' && (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <p>
                    Are you sure you want to suspend account <b>{modalState.data?.name}</b> ({modalState.data?.email})?
                  </p>
                  <label>
                    Reason for suspension (Required for audit log):
                    <textarea
                      value={confirmReason}
                      onChange={(e) => setConfirmReason(e.target.value)}
                      rows={3}
                      placeholder="Explain reason for suspension..."
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--ln)', borderRadius: '6px', padding: '8px', marginTop: '6px' }}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="ft">
              <button
                className="btn s"
                onClick={() => setModalState({ isOpen: false, title: '', type: '' })}
              >
                Cancel
              </button>
              {modalState.type === 'create_challenge' && (
                <button className="btn" onClick={handleCreateChallenge}>
                  Publish challenge
                </button>
              )}
              {modalState.type === 'suspend_participant' && (
                <button
                  className="btn d"
                  disabled={!confirmReason.trim()}
                  onClick={() =>
                    handleAdminAction('suspend_participant', modalState.data.id, confirmReason)
                  }
                >
                  Confirm suspension
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
