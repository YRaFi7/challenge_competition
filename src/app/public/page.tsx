'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PublicWebsitePage() {
  const [activeHash, setActiveHash] = useState('home');
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Data from backend
  const [challenges, setChallenges] = useState<any[]>([]);
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [votingCategories, setVotingCategories] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('Any status');
  const [selectedParticipation, setSelectedParticipation] = useState('Any participation');

  // Selected Challenge for Public Exploration (No registration)
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);

  // Hackathons filter state (All, Online, Offline, Upcoming, Live, Completed)
  const [selectedHackathonFilter, setSelectedHackathonFilter] = useState('All');

  // Public Voting 6-step workflow state:
  // 1: Pick a category, 2: Browse nominees, 3: View the work, 4: Vote, 5: Verify, 6: Confirmed
  const [selectedVotingCategoryId, setSelectedVotingCategoryId] = useState('cat-pc-ui');
  const [votingActiveStep, setVotingActiveStep] = useState<number>(2);

  // Voting Modal State
  const [votingModalOpen, setVotingModalOpen] = useState(false);
  const [voteStep, setVoteStep] = useState<'s0' | 's1' | 's2' | 's3' | 's4' | 's5'>('s1');
  const [voterEmail, setVoterEmail] = useState('');
  const [votingEmailError, setVotingEmailError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [userVotes, setUserVotes] = useState<Array<{ id: string; categoryId: string | null; nominationId: string }>>([]);
  const [otpCode, setOtpCode] = useState(['4', '8', '2', '1', '0', '7']);
  const [selectedNominee, setSelectedNominee] = useState<any>({
    id: 'nom-checkout',
    name: 'Meera N.',
    title: 'Checkout, simplified',
    category: 'People’s Choice · UI',
    categoryId: 'cat-pc-ui',
    description: 'A three-step checkout for a regional e-commerce brand. Redesign cut form fields by half and added clear error recovery.',
    demoUrl: 'https://figma.com/proto/checkout-simplified',
    coverClass: 'c3',
  });
  const [votingLoading, setVotingLoading] = useState(false);

  // Sync hash routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      setActiveHash(hash);
      window.scrollTo(0, 0);
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Fetch live database records
  useEffect(() => {
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

    fetch('/api/voting')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories && data.categories.length > 0) {
          setVotingCategories(data.categories);
          const defaultCat = data.categories.find((c: any) => c.nominations?.length > 0) || data.categories[0];
          if (defaultCat) {
            setSelectedVotingCategoryId(defaultCat.id);
          }
        }
        if (data.winners) setWinners(data.winners);
        if (data.currentUser) {
          setCurrentUser(data.currentUser);
          setVoterEmail(data.currentUser.email);
        }
        if (data.userVotes) setUserVotes(data.userVotes);
      })
      .catch(() => {});
  }, []);

  const navigateTo = (hash: string) => {
    window.location.hash = hash;
    setActiveHash(hash);
    setDrawerOpen(false);
  };

  const handleSendCode = async () => {
    setVotingEmailError('');
    if (!voterEmail || !voterEmail.includes('@')) {
      setVotingEmailError('Please enter a valid email address.');
      return;
    }
    setVotingLoading(true);
    try {
      const res = await fetch('/api/voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_code',
          email: voterEmail,
          nominationId: selectedNominee.id,
          categoryId: selectedNominee.categoryId || selectedVotingCategoryId || 'cat-pc-ui',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requireAuth) {
          setVoteStep('s0');
        } else if (data.alreadyVoted) {
          setVoteStep('s5');
        } else {
          setVotingEmailError(data.error || 'Invalid Email Address. Please enter the email address you used during registration.');
        }
      } else {
        setVoteStep('s2');
        setVotingActiveStep(5); // Step 5: Verify
      }
    } catch {
      setVotingEmailError('An unexpected error occurred. Please try again.');
    } finally {
      setVotingLoading(false);
    }
  };

  const handleVerifyVote = async () => {
    setVotingLoading(true);
    try {
      const fullCode = otpCode.join('');
      const res = await fetch('/api/voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_and_vote',
          email: voterEmail,
          code: fullCode,
          nominationId: selectedNominee.id,
          categoryId: selectedNominee.categoryId || selectedVotingCategoryId || 'cat-pc-ui',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVoteStep('s3');
        setVotingActiveStep(6); // Step 6: Confirmed
        if (data.vote) {
          setUserVotes((prev) => [...prev, data.vote]);
        }
      } else if (data.alreadyVoted) {
        setVoteStep('s5');
      } else {
        setVoteStep('s4');
      }
    } catch {
      setVoteStep('s4');
    } finally {
      setVotingLoading(false);
    }
  };

  const openVoteModal = (nominee?: any) => {
    if (nominee) setSelectedNominee(nominee);
    setVotingEmailError('');
    setVotingActiveStep((prev) => Math.max(prev, 4)); // Step 4: Vote
    if (!currentUser) {
      setVoteStep('s0');
    } else {
      const targetCatId = nominee?.categoryId || selectedVotingCategoryId || 'cat-pc-ui';
      const hasVoted = userVotes.some(
        (v) => (targetCatId && v.categoryId === targetCatId) || v.nominationId === nominee?.id
      );
      if (hasVoted) {
        setVoteStep('s5');
      } else {
        setVoteStep('s1');
      }
    }
    setVotingModalOpen(true);
  };

  return (
    <div className="public-wrap">
      <style jsx global>{`
        .public-wrap {
          --ink: #eef3f0;
          --mut: #8b9890;
          --ln: rgba(255, 255, 255, 0.09);
          --g: #1d6a46;
          --g2: #26835a;
          --sg: #9fcbb0;
          --gl: rgba(255, 255, 255, 0.04);
          color-scheme: dark;
          box-sizing: border-box;
          font: 400 15px/1.6 Inter, system-ui, sans-serif;
          color: var(--ink);
          background: #050806;
          min-height: 100vh;
        }

        .public-wrap::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: -1;
          background: radial-gradient(900px 560px at 100% 0, rgba(20, 90, 60, 0.3), transparent 70%),
            radial-gradient(800px 560px at 0 100%, rgba(12, 70, 46, 0.32), transparent 70%), #050806;
        }

        .public-wrap a {
          color: inherit;
          text-decoration: none;
        }

        .public-wrap button,
        .public-wrap input,
        .public-wrap select {
          font: inherit;
          color: inherit;
        }

        .public-wrap h1 {
          font-size: clamp(34px, 5vw, 58px);
          font-weight: 600;
          letter-spacing: -0.025em;
          line-height: 1.08;
        }

        .public-wrap h2 {
          font-size: clamp(24px, 3vw, 34px);
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }

        .public-wrap h3 {
          font-size: 17px;
          font-weight: 600;
        }

        .public-wrap .mut {
          color: var(--mut);
        }

        .public-wrap .lbl {
          font-size: 11.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--mut);
        }

        .public-wrap .w {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 28px;
        }

        .public-wrap .sec {
          padding: 76px 0;
          border-top: 1px solid var(--ln);
        }

        .public-wrap .sec.t {
          background: linear-gradient(180deg, rgba(29, 106, 70, 0.14), rgba(29, 106, 70, 0.03));
        }

        .public-wrap .hd {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 30px;
        }

        .public-wrap .hd a {
          color: var(--sg);
          font-size: 14px;
        }

        .public-wrap .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--g);
          background: var(--g);
          color: #fff;
          padding: 11px 22px;
          border-radius: 99px;
          font-weight: 500;
          cursor: pointer;
          font-size: 14.5px;
        }

        .public-wrap .btn:hover {
          background: var(--g2);
          border-color: var(--g2);
        }

        .public-wrap .btn.gh {
          background: transparent;
          border-color: rgba(255, 255, 255, 0.22);
          color: var(--ink);
        }

        .public-wrap .btn.gh:hover {
          background: var(--gl);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .public-wrap .btn.s {
          padding: 7px 16px;
          font-size: 13.5px;
        }

        .public-wrap header {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(5, 8, 6, 0.62);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--ln);
        }

        .public-wrap .h1 {
          display: flex;
          align-items: center;
          gap: 16px;
          height: 60px;
        }

        .public-wrap .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          font-size: 16px;
          margin-right: auto;
        }

        .public-wrap .logo i {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: var(--g);
          display: grid;
          place-items: center;
          font-style: normal;
          font-size: 14px;
        }

        .public-wrap .ib {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid var(--ln);
          background: var(--gl);
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .public-wrap .ib:hover {
          border-color: rgba(255, 255, 255, 0.3);
        }

        .public-wrap .nv {
          display: flex;
          gap: 2px;
          height: 44px;
          align-items: stretch;
          border-top: 1px solid var(--ln);
        }

        .public-wrap .nv a {
          display: flex;
          align-items: center;
          padding: 0 7px;
          font-size: 13.5px;
          color: #b4c0b9;
          position: relative;
          cursor: pointer;
        }

        .public-wrap .nv a:hover {
          color: #fff;
        }

        .public-wrap .nv a.on {
          color: #fff;
        }

        .public-wrap .nv a.on::after {
          content: '';
          position: absolute;
          left: 7px;
          right: 7px;
          bottom: 0;
          height: 2px;
          background: var(--g2);
        }

        .public-wrap .sr {
          display: none;
          position: absolute;
          left: 0;
          right: 0;
          top: 100%;
          padding: 14px 28px;
          background: rgba(8, 13, 10, 0.92);
          backdrop-filter: blur(18px);
        }

        .public-wrap .sr.o {
          display: block;
        }

        .public-wrap .sr input {
          width: 100%;
          max-width: 640px;
          margin: auto;
          display: block;
          padding: 12px 16px;
          border-radius: 99px;
          background: var(--gl);
          border: 1px solid var(--ln);
          outline: 0;
        }

        .public-wrap .dr {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(5, 8, 6, 0.96);
          padding: 70px 28px;
          overflow: auto;
        }

        .public-wrap .dr.o {
          display: block;
        }

        .public-wrap .dr a {
          display: block;
          padding: 13px 0;
          border-bottom: 1px solid var(--ln);
          font-size: 18px;
        }

        .public-wrap .st {
          display: inline-block;
          font-size: 12px;
          padding: 2px 10px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #b4c0b9;
          white-space: nowrap;
        }

        .public-wrap .st.g {
          background: rgba(38, 131, 90, 0.22);
          border-color: rgba(38, 131, 90, 0.4);
          color: var(--sg);
        }

        .public-wrap .st.live {
          background: rgba(38, 131, 90, 0.25);
          border-color: rgba(38, 131, 90, 0.5);
          color: #d4ecdc;
        }

        .public-wrap .st.live::before {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--sg);
          margin-right: 6px;
          vertical-align: 1px;
        }

        .public-wrap .st.up {
          border-style: dashed;
        }

        .public-wrap .st.off {
          color: var(--mut);
          border-color: var(--ln);
        }

        .public-wrap .dur {
          font-size: 11.5px;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--sg);
          font-weight: 500;
        }

        .public-wrap .gl {
          background: var(--gl);
          border: 1px solid var(--ln);
          border-radius: 18px;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .public-wrap .cov {
          background: linear-gradient(135deg, #14583a, #050d09);
          position: relative;
          border-radius: 12px;
          min-height: 120px;
        }

        .public-wrap .cov::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: repeating-linear-gradient(
            120deg,
            rgba(255, 255, 255, 0.05) 0 1px,
            transparent 1px 22px
          );
        }

        .public-wrap .c2 {
          background: radial-gradient(circle at 70% 25%, #1f7650, #06120c 70%);
        }
        .public-wrap .c3 {
          background: linear-gradient(200deg, #0b2a1c, #1d6a46 140%);
        }
        .public-wrap .c4 {
          background: linear-gradient(60deg, #050d09, #17513a);
        }

        .public-wrap .chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin: 0 0 12px;
        }

        .public-wrap .chips button {
          border: 1px solid var(--ln);
          background: transparent;
          border-radius: 99px;
          padding: 6px 14px;
          cursor: pointer;
          color: #b4c0b9;
          font-size: 13.5px;
        }

        .public-wrap .chips button:hover {
          border-color: rgba(255, 255, 255, 0.3);
        }

        .public-wrap .chips button[aria-pressed='true'] {
          background: var(--g);
          border-color: var(--g);
          color: #fff;
        }

        .public-wrap .in {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--ln);
          border-radius: 99px;
          padding: 9px 16px;
          outline: 0;
        }

        .public-wrap .bar2 {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .public-wrap .meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 22px;
          color: var(--mut);
          font-size: 13px;
          margin-top: 12px;
        }

        .public-wrap .meta b {
          color: var(--ink);
          font-weight: 500;
        }

        .public-wrap .lst {
          display: grid;
          grid-template-columns: 260px 1fr auto;
          gap: 26px;
          padding: 26px 0;
          border-bottom: 1px solid var(--ln);
          align-items: start;
        }

        .public-wrap .lst .cov {
          height: 170px;
        }

        .public-wrap .lst p {
          color: #b4c0b9;
          margin-top: 6px;
          max-width: 60ch;
        }

        .public-wrap .lst .r {
          text-align: right;
          min-width: 150px;
        }

        .public-wrap .lst .r b {
          display: block;
          font-size: 18px;
          font-weight: 600;
          margin: 2px 0 14px;
        }

        .public-wrap .sc {
          overflow-x: auto;
        }

        .public-wrap table {
          width: 100%;
          border-collapse: collapse;
          min-width: 640px;
        }

        .public-wrap th {
          text-align: left;
          font-size: 11.5px;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--mut);
          font-weight: 500;
          padding: 12px;
        }

        .public-wrap td {
          padding: 14px 12px;
          border-top: 1px solid var(--ln);
        }

        .public-wrap td small {
          display: block;
          color: var(--mut);
          font-size: 12.5px;
        }

        .public-wrap tr:hover td {
          background: rgba(255, 255, 255, 0.025);
        }

        .public-wrap .hero {
          position: relative;
          padding: 84px 0 76px;
          overflow: hidden;
        }

        .public-wrap .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
              60deg,
              rgba(255, 255, 255, 0.025) 0 1px,
              transparent 1px 56px
            ),
            radial-gradient(700px 400px at 78% 40%, rgba(29, 106, 70, 0.38), transparent 70%);
        }

        .public-wrap .hg {
          position: relative;
          display: grid;
          grid-template-columns: 1.25fr 0.75fr;
          gap: 56px;
          align-items: center;
        }

        .public-wrap .hero p.lead {
          font-size: 18px;
          color: #b4c0b9;
          max-width: 52ch;
          margin: 22px 0 30px;
        }

        .public-wrap .live {
          padding: 26px;
        }

        .public-wrap .live .t {
          font-size: 44px;
          font-weight: 600;
          letter-spacing: -0.03em;
          margin: 10px 0 4px;
        }

        .public-wrap .stat {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid var(--ln);
          border-bottom: 1px solid var(--ln);
          padding: 22px 0;
        }

        .public-wrap .stat div {
          padding: 0 22px;
          border-left: 1px solid var(--ln);
          color: var(--mut);
          font-size: 13px;
        }

        .public-wrap .stat div:first-child {
          border: 0;
          padding-left: 0;
        }

        .public-wrap .stat b {
          display: block;
          font-size: 30px;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: -0.02em;
        }

        .public-wrap .fg {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 26px;
        }

        .public-wrap .fg .big {
          min-height: 360px;
          display: flex;
          align-items: flex-end;
          padding: 28px;
          border-radius: 18px;
        }

        .public-wrap .fg .big > div {
          position: relative;
          z-index: 1;
        }

        .public-wrap .two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        .public-wrap .ls {
          list-style: none;
          padding: 0;
        }

        .public-wrap .ls li {
          display: flex;
          gap: 16px;
          padding: 15px 0;
          border-bottom: 1px solid var(--ln);
          align-items: center;
        }

        .public-wrap .ls li .r {
          margin-left: auto;
          color: var(--mut);
          font-size: 13px;
          text-align: right;
        }

        .public-wrap .tag {
          display: inline-block;
          border: 1px solid var(--ln);
          border-radius: 99px;
          padding: 3px 12px;
          font-size: 13px;
          margin: 0 6px 6px 0;
          color: #c8d2cc;
        }

        .public-wrap .av {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2a8559, #0d3b27);
          display: grid;
          place-items: center;
          font-size: 14px;
          font-weight: 600;
          flex: none;
        }

        .public-wrap .win {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 34px;
        }

        .public-wrap .win .cov {
          height: 200px;
          margin-bottom: 14px;
        }

        .public-wrap .stp {
          display: flex;
          font-size: 12.5px;
          color: var(--mut);
        }

        .public-wrap .stp span {
          flex: 1;
          padding-top: 12px;
          border-top: 2px solid rgba(255, 255, 255, 0.12);
        }

        .public-wrap .stp span.d {
          border-top-color: var(--g2);
          color: var(--sg);
        }

        .public-wrap .kv {
          display: grid;
          grid-template-columns: 110px 1fr;
          padding: 10px 0;
          border-bottom: 1px solid var(--ln);
          gap: 10px;
          font-size: 14px;
        }

        .public-wrap .kv span {
          color: var(--mut);
        }

        .public-wrap .bar {
          height: 5px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }

        .public-wrap .bar i {
          display: block;
          height: 100%;
          background: var(--g2);
          width: var(--p);
        }

        .public-wrap .cr {
          display: grid;
          grid-template-columns: 170px 1fr 40px;
          gap: 14px;
          align-items: center;
          padding: 8px 0;
          font-size: 14px;
        }

        .public-wrap .sch {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid var(--ln);
          margin: 30px 0;
        }

        .public-wrap .sch div {
          padding: 14px 16px 14px 0;
          border-bottom: 1px solid var(--ln);
          font-size: 14px;
        }

        .public-wrap .sch small {
          display: block;
          color: var(--mut);
          font-size: 12px;
        }

        .public-wrap .dg {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 330px;
          gap: 56px;
          align-items: start;
        }

        .public-wrap .dg article {
          padding-bottom: 26px;
          margin-bottom: 26px;
          border-bottom: 1px solid var(--ln);
        }

        .public-wrap .dg h3 {
          margin-bottom: 10px;
        }

        .public-wrap .dg ul {
          padding-left: 18px;
          color: #c3cec8;
        }

        .public-wrap .reg {
          position: sticky;
          top: 130px;
          padding: 24px;
        }

        .public-wrap .ban {
          height: 260px;
          border-radius: 20px;
          display: flex;
          align-items: flex-end;
          padding: 28px;
          margin-bottom: 30px;
          overflow: hidden;
        }

        .public-wrap .ban > div {
          position: relative;
          z-index: 1;
        }

        .public-wrap .row {
          display: grid;
          grid-template-columns: 44px 1.1fr 1.5fr auto auto;
          gap: 22px;
          align-items: center;
          padding: 20px 0;
          border-bottom: 1px solid var(--ln);
        }

        .public-wrap .row .n {
          color: var(--sg);
          font-weight: 500;
        }

        .public-wrap .nom {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 34px;
        }

        .public-wrap .nom .cov {
          height: 190px;
          margin-bottom: 12px;
        }

        .public-wrap .nom h3 {
          margin: 4px 0 2px;
        }

        .public-wrap .nom .b {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .public-wrap .cert {
          border-radius: 14px;
          padding: 24px;
          min-height: 210px;
          background: linear-gradient(145deg, #0f2f21, #050b08);
          border: 1px solid rgba(159, 203, 176, 0.28);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .public-wrap .cert::before {
          content: '';
          position: absolute;
          inset: 8px;
          border: 1px solid rgba(159, 203, 176, 0.16);
          border-radius: 9px;
        }

        .public-wrap .cert h3 {
          font-size: 21px;
          font-weight: 500;
        }

        .public-wrap .gal {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 26px;
        }

        .public-wrap .gal > div {
          grid-column: span 2;
        }

        .public-wrap .gal .b4 {
          grid-column: span 4;
        }

        .public-wrap .gal .b3 {
          grid-column: span 3;
        }

        .public-wrap .gal p {
          font-size: 13px;
          color: var(--mut);
          margin-top: 10px;
        }

        .public-wrap .gal b {
          color: var(--ink);
          font-weight: 500;
        }

        .public-wrap .pol {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 50px;
        }

        .public-wrap .pol div {
          padding: 14px 0;
          border-bottom: 1px solid var(--ln);
        }

        .public-wrap .pol small {
          display: block;
          color: var(--mut);
        }

        .public-wrap details {
          border-bottom: 1px solid var(--ln);
          padding: 18px 0;
        }

        .public-wrap summary {
          cursor: pointer;
          font-weight: 500;
          list-style: none;
          display: flex;
          justify-content: space-between;
        }

        .public-wrap summary::after {
          content: '+';
          color: var(--sg);
        }

        .public-wrap details[open] summary::after {
          content: '–';
        }

        .public-wrap details p {
          color: var(--mut);
          margin-top: 10px;
          max-width: 70ch;
        }

        .public-wrap .md {
          position: fixed;
          inset: 0;
          z-index: 70;
          display: none;
          place-items: center;
          background: rgba(0, 0, 0, 0.62);
          backdrop-filter: blur(6px);
          padding: 18px;
        }

        .public-wrap .md.o {
          display: grid;
        }

        .public-wrap .mp {
          width: min(440px, 100%);
          padding: 30px;
          background: rgba(12, 18, 14, 0.94);
          position: relative;
        }

        .public-wrap .sp {
          display: none;
        }

        .public-wrap .sp.o {
          display: block;
        }

        .public-wrap .sp h3 {
          font-size: 20px;
          margin: 6px 0 8px;
        }

        .public-wrap .sp p {
          color: var(--mut);
          margin-bottom: 16px;
        }

        .public-wrap .sp input.f {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--ln);
          margin-bottom: 14px;
          outline: 0;
        }

        .public-wrap .otp {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }

        .public-wrap .otp input {
          width: 100%;
          min-width: 0;
          text-align: center;
          padding: 12px 0;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--ln);
          outline: 0;
        }

        .public-wrap .x {
          position: absolute;
          right: 16px;
          top: 14px;
          background: none;
          border: 0;
          font-size: 22px;
          color: var(--mut);
          cursor: pointer;
        }

        .public-wrap .pv {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 20px;
          font-size: 12px;
          color: var(--mut);
          align-items: center;
        }

        .public-wrap .pv button {
          background: none;
          border: 1px solid var(--ln);
          border-radius: 99px;
          color: var(--mut);
          padding: 2px 10px;
          cursor: pointer;
        }

        .public-wrap .stt {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0 40px;
        }

        .public-wrap .stt > div {
          padding: 26px 0;
          border-bottom: 1px solid var(--ln);
        }

        .public-wrap .sk {
          height: 10px;
          border-radius: 9px;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.05),
            rgba(255, 255, 255, 0.14),
            rgba(255, 255, 255, 0.05)
          );
          background-size: 200% 100%;
          animation: s 1.6s infinite;
          margin: 10px 0;
        }

        @keyframes s {
          to {
            background-position: -200% 0;
          }
        }

        .public-wrap footer {
          border-top: 1px solid var(--ln);
          background: linear-gradient(180deg, transparent, rgba(10, 60, 40, 0.28));
          padding: 60px 0 30px;
        }

        .public-wrap .ft {
          display: grid;
          grid-template-columns: 1.6fr 1fr 1fr 1fr;
          gap: 34px;
        }

        .public-wrap footer h4 {
          margin-bottom: 10px;
          font-size: 14px;
        }

        .public-wrap footer a {
          display: block;
          padding: 3px 0;
          font-size: 14px;
          color: var(--mut);
        }

        .public-wrap footer a:hover {
          color: #fff;
        }

        .public-wrap .cp {
          margin-top: 34px;
          padding-top: 18px;
          border-top: 1px solid var(--ln);
          font-size: 13px;
          color: var(--mut);
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        @media (max-width: 1080px) {
          .public-wrap .nv {
            display: none;
          }
          .public-wrap .hg,
          .public-wrap .fg,
          .public-wrap .dg,
          .public-wrap .two {
            grid-template-columns: 1fr;
          }
          .public-wrap .reg {
            position: static;
          }
        }

        @media (max-width: 900px) {
          .public-wrap .w {
            padding: 0 18px;
          }
          .public-wrap .sec {
            padding: 54px 0;
          }
          .public-wrap .lst {
            grid-template-columns: 1fr;
          }
          .public-wrap .lst .r {
            text-align: left;
          }
          .public-wrap .stat {
            grid-template-columns: 1fr 1fr;
            gap: 18px 0;
          }
          .public-wrap .stat div:nth-child(odd) {
            border: 0;
            padding-left: 0;
          }
          .public-wrap .win,
          .public-wrap .nom,
          .public-wrap .stt,
          .public-wrap .pol {
            grid-template-columns: 1fr;
          }
          .public-wrap .gal {
            grid-template-columns: 1fr;
          }
          .public-wrap .gal > div,
          .public-wrap .gal .b4,
          .public-wrap .gal .b3 {
            grid-column: auto;
          }
          .public-wrap .row {
            grid-template-columns: 1fr;
            gap: 6px;
          }
          .public-wrap .sch {
            grid-template-columns: 1fr 1fr;
          }
          .public-wrap .ft {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      {/* Header */}
      <header>
        <div className="w">
          <div className="h1">
            <a className="logo" onClick={() => navigateTo('home')}>
              <i>P</i>Portfolio Builders
            </a>
            <button
              className="ib"
              id="sb"
              aria-label="Search"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </button>
            <a className="btn gh s" href="/auth/public/login">
              Voter Sign In
            </a>
            <a className="btn s" href="/auth/participant/register">
              Join as Participant
            </a>
            <button
              className="ib"
              id="mb"
              aria-label="Menu"
              onClick={() => setDrawerOpen(true)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              >
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          </div>

          {/* Main Navigation */}
          <nav className="nv" aria-label="Main">
            {[
              ['Home', 'home'],
              ['Explore Challenges', 'explore'],
              ['Hackathons', 'hackathons'],
              ['Annual Awards', 'awards'],
              ['Public Voting', 'voting'],
              ['Winners', 'winners'],
              ['Award Gallery', 'gallery'],
              ['Leaderboard', 'leaderboard'],
              ['Participant Showcase', 'showcase'],
              ['About', 'about'],
            ].map(([label, hash]) => (
              <a
                key={hash}
                className={activeHash === hash || (hash === 'explore' && activeHash === 'challenge') || (hash === 'voting' && activeHash === 'nominee') ? 'on' : ''}
                onClick={() => navigateTo(hash)}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* Global Search Bar */}
        <div className={`sr ${searchOpen ? 'o' : ''}`}>
          <input
            placeholder="Search challenges, nominees, winners and participants"
            aria-label="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`dr ${drawerOpen ? 'o' : ''}`}>
        <button
          className="x"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close"
          style={{ top: '22px', right: '22px' }}
        >
          ×
        </button>
        {[
          ['Home', 'home'],
          ['Explore Challenges', 'explore'],
          ['Hackathons', 'hackathons'],
          ['Annual Awards', 'awards'],
          ['Public Voting', 'voting'],
          ['Winners', 'winners'],
          ['Award Gallery', 'gallery'],
          ['Leaderboard', 'leaderboard'],
          ['Participant Showcase', 'showcase'],
          ['About', 'about'],
        ].map(([label, hash]) => (
          <a key={hash} onClick={() => navigateTo(hash)}>
            {label}
          </a>
        ))}
        <a href="/participant" style={{ color: 'var(--sg)', marginTop: '16px' }}>
          Sign in to Participant Portal →
        </a>
      </div>

      <main>
        {/* ================= SECTION 1: HOME ================= */}
        {activeHash === 'home' && (
          <section id="home">
            <div className="hero">
              <div className="w hg">
                <div>
                  <p className="lbl" style={{ marginBottom: '16px' }}>
                    Challenges · Hackathons · Annual Awards
                  </p>
                  <h1>Where design and technology talent earns recognition.</h1>
                  <p className="lead">
                    Explore Admin-published challenges, follow hackathons and annual awards, and see the work that wins. No account needed to browse.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <a className="btn" onClick={() => navigateTo('explore')}>
                      Explore Challenges
                    </a>
                    <a className="btn gh" onClick={() => navigateTo('awards')}>
                      View Annual Awards
                    </a>
                  </div>
                </div>

                <aside className="gl live">
                  <span className="st live">Live now</span>
                  <span className="dur" style={{ marginLeft: '8px' }}>
                    Hourly challenge
                  </span>
                  <p className="t">02h 35m</p>
                  <p className="mut">remaining · Speed UI: Mobile Checkout</p>
                  <div className="kv" style={{ marginTop: '16px' }}>
                    <span>Submission</span>Today, 5:00 PM
                  </div>
                  <div className="kv">
                    <span>Participation</span>Individual
                  </div>
                  <div className="kv" style={{ border: 0 }}>
                    <span>Prize</span>₹5,000
                  </div>
                  <a
                    className="btn gh"
                    onClick={() => navigateTo('challenge')}
                    style={{ marginTop: '14px', width: '100%', justifyContent: 'center' }}
                  >
                    View challenge
                  </a>
                </aside>
              </div>
            </div>

            <div className="w">
              <div className="stat">
                <div>
                  <b>128</b>Competitions published
                </div>
                <div>
                  <b>18,400</b>Participants
                </div>
                <div>
                  <b>64</b>Awards published
                </div>
                <div>
                  <b>310</b>Recognised winners
                </div>
              </div>
              <p className="mut" style={{ fontSize: '12px', marginTop: '8px' }}>
                Illustrative sample values backed by PostgreSQL.
              </p>
            </div>

            <div className="sec" style={{ marginTop: '60px' }}>
              <div className="w">
                <div className="hd">
                  <div>
                    <p className="lbl">Live challenges</p>
                    <h2>Happening now</h2>
                  </div>
                  <a onClick={() => navigateTo('explore')}>All live challenges →</a>
                </div>
                <ul className="ls">
                  <li>
                    <div>
                      <a onClick={() => navigateTo('challenge')}>
                        <b style={{ fontWeight: 500 }}>Speed UI: Mobile Checkout</b>
                      </a>
                      <small style={{ display: 'block', color: 'var(--mut)' }}>
                        Hourly challenge · Individual
                      </small>
                    </div>
                    <span className="st live" style={{ marginLeft: 'auto' }}>
                      Live
                    </span>
                    <span className="r" style={{ minWidth: '120px' }}>
                      Ends in 02h 35m
                    </span>
                  </li>
                  <li>
                    <div>
                      <a onClick={() => navigateTo('challenge')}>
                        <b style={{ fontWeight: 500 }}>Daily Brief: Grocery App Onboarding</b>
                      </a>
                      <small style={{ display: 'block', color: 'var(--mut)' }}>
                        Daily challenge · Team of 2–4
                      </small>
                    </div>
                    <span className="st live" style={{ marginLeft: 'auto' }}>
                      Live
                    </span>
                    <span className="r" style={{ minWidth: '120px' }}>
                      Submission closes tonight
                    </span>
                  </li>
                  <li>
                    <div>
                      <a onClick={() => navigateTo('challenge')}>
                        <b style={{ fontWeight: 500 }}>Weekly UI: Travel Dashboard</b>
                      </a>
                      <small style={{ display: 'block', color: 'var(--mut)' }}>
                        Weekly challenge · Individual
                      </small>
                    </div>
                    <span className="st live" style={{ marginLeft: 'auto' }}>
                      Live
                    </span>
                    <span className="r" style={{ minWidth: '120px' }}>
                      Ends in 3 days
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="sec">
              <div className="w">
                <div className="hd">
                  <div>
                    <p className="lbl">Featured challenges</p>
                    <h2>Selected by the Admin team</h2>
                  </div>
                  <a onClick={() => navigateTo('explore')}>Explore all →</a>
                </div>
                <div className="fg">
                  <div className="cov big">
                    <div>
                      <span className="dur">Yearly challenge</span>
                      <span className="st g" style={{ marginLeft: '8px' }}>
                        Registration open
                      </span>
                      <h2 style={{ margin: '10px 0 6px' }}>The Redesign Prize 2026</h2>
                      <p className="mut">Registration closes in 12 days · Prize pool ₹2,00,000</p>
                      <a
                        className="btn"
                        onClick={() => navigateTo('challenge')}
                        style={{ marginTop: '16px' }}
                      >
                        View challenge
                      </a>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: '26px' }}>
                    <div>
                      <div className="cov c3" style={{ height: '150px' }}></div>
                      <p className="dur" style={{ marginTop: '12px' }}>
                        Monthly challenge
                      </p>
                      <h3>December Case Study</h3>
                      <p className="mut" style={{ fontSize: '14px' }}>
                        Registration opens 25 Nov · Team of 2–4
                      </p>
                    </div>
                    <div>
                      <div className="cov c2" style={{ height: '150px' }}></div>
                      <p className="dur" style={{ marginTop: '12px' }}>
                        Daily challenge
                      </p>
                      <h3>Fintech Onboarding UX</h3>
                      <p className="mut" style={{ fontSize: '14px' }}>
                        Registration closes in 2 days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sec">
              <div className="w two">
                <div>
                  <p className="lbl">Upcoming competitions</p>
                  <h2 style={{ marginBottom: '20px' }}>On the calendar</h2>
                  <ul className="ls">
                    <li>
                      <div>
                        <a onClick={() => navigateTo('challenge')}>
                          <b style={{ fontWeight: 500 }}>Fintech Onboarding UX</b>
                        </a>
                        <small style={{ display: 'block', color: 'var(--mut)' }}>
                          Starts 22 Nov · Daily
                        </small>
                      </div>
                      <span className="st g" style={{ marginLeft: 'auto' }}>
                        Registration open
                      </span>
                      <span className="r" style={{ minWidth: '120px' }}>
                        Closes in 2 days
                      </span>
                    </li>
                    <li>
                      <div>
                        <a onClick={() => navigateTo('challenge')}>
                          <b style={{ fontWeight: 500 }}>December Case Study</b>
                        </a>
                        <small style={{ display: 'block', color: 'var(--mut)' }}>
                          Starts 1 Dec · Monthly
                        </small>
                      </div>
                      <span className="st up" style={{ marginLeft: 'auto' }}>
                        Upcoming
                      </span>
                      <span className="r" style={{ minWidth: '120px' }}>
                        Opens 25 Nov
                      </span>
                    </li>
                    <li>
                      <div>
                        <a onClick={() => navigateTo('voting')}>
                          <b style={{ fontWeight: 500 }}>Annual Awards 2026 voting</b>
                        </a>
                        <small style={{ display: 'block', color: 'var(--mut)' }}>
                          Opens 1 Dec
                        </small>
                      </div>
                      <span className="st up" style={{ marginLeft: 'auto' }}>
                        Upcoming
                      </span>
                      <span className="r" style={{ minWidth: '120px' }}>
                        Public voting
                      </span>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="lbl">Featured hackathons</p>
                  <h2 style={{ marginBottom: '20px' }}>Build together</h2>
                  <ul className="ls">
                    <li>
                      <div>
                        <a onClick={() => navigateTo('hackathons')}>
                          <b style={{ fontWeight: 500 }}>Kerala Product Hackathon</b>
                        </a>
                        <small style={{ display: 'block', color: 'var(--mut)' }}>
                          14–16 Dec · Kochi
                        </small>
                      </div>
                      <span className="st up" style={{ marginLeft: 'auto' }}>
                        Offline
                      </span>
                      <span className="r" style={{ minWidth: '120px' }}>
                        Registration open
                      </span>
                    </li>
                    <li>
                      <div>
                        <a onClick={() => navigateTo('hackathons')}>
                          <b style={{ fontWeight: 500 }}>Open Web Sprint</b>
                        </a>
                        <small style={{ display: 'block', color: 'var(--mut)' }}>
                          20–21 Dec · Online
                        </small>
                      </div>
                      <span className="st up" style={{ marginLeft: 'auto' }}>
                        Online
                      </span>
                      <span className="r" style={{ minWidth: '120px' }}>
                        Registration open
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="sec t">
              <div className="w">
                <div className="two" style={{ alignItems: 'center' }}>
                  <div>
                    <p className="lbl">Annual awards · Season 2026</p>
                    <h2 style={{ margin: '8px 0 14px' }}>
                      Seven awards. Judged by experts, and one chosen by you.
                    </h2>
                    <p className="mut" style={{ marginBottom: '22px', maxWidth: '50ch' }}>
                      Nominees are published by the Admin. Public voting is free and requires a quick verification.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <a className="btn" onClick={() => navigateTo('voting')}>
                        Vote now
                      </a>
                      <a className="btn gh" onClick={() => navigateTo('awards')}>
                        See categories
                      </a>
                    </div>
                  </div>
                  <div>
                    <span className="tag">Best UI Design</span>
                    <span className="tag">Best UX Design</span>
                    <span className="tag">Best Website Redesign</span>
                    <span className="tag">Best App Redesign</span>
                    <span className="tag">Innovation Award</span>
                    <span className="tag">Best Digital Experience</span>
                    <span className="tag">People’s Choice Award</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sec">
              <div className="w">
                <div className="hd">
                  <div>
                    <p className="lbl">Recent winners</p>
                    <h2>Officially published</h2>
                  </div>
                  <a onClick={() => navigateTo('winners')}>View winners →</a>
                </div>
                <div className="win">
                  <div>
                    <div className="cov" style={{ height: '210px', marginBottom: '12px' }}></div>
                    <p className="lbl">Best UX Design · Checkout Redesign</p>
                    <h3 style={{ margin: '4px 0' }}>Checkout, simplified</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '8px 0' }}>
                      <span className="av" style={{ width: '30px', height: '30px', fontSize: '11px' }}>
                        MN
                      </span>
                      <span>Meera N.</span>
                    </div>
                    <a className="btn gh s" onClick={() => navigateTo('showcase')}>
                      View portfolio
                    </a>
                  </div>
                  <div>
                    <div className="cov c2" style={{ height: '210px', marginBottom: '12px' }}></div>
                    <p className="lbl">Best App Redesign · Weekly UI</p>
                    <h3 style={{ margin: '4px 0' }}>Wayfinder</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '8px 0' }}>
                      <span className="av" style={{ width: '30px', height: '30px', fontSize: '11px' }}>
                        TP
                      </span>
                      <span>Team Parallel</span>
                    </div>
                    <a className="btn gh s" onClick={() => navigateTo('showcase')}>
                      View portfolio
                    </a>
                  </div>
                  <div>
                    <div className="cov c3" style={{ height: '210px', marginBottom: '12px' }}></div>
                    <p className="lbl">Best Website Redesign · Redesign Prize 2025</p>
                    <h3 style={{ margin: '4px 0' }}>Munnar Stays</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '8px 0' }}>
                      <span className="av" style={{ width: '30px', height: '30px', fontSize: '11px' }}>
                        AK
                      </span>
                      <span>Arun K.</span>
                    </div>
                    <a className="btn gh s" onClick={() => navigateTo('showcase')}>
                      View portfolio
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= SECTION 2: EXPLORE CHALLENGES ================= */}
        {activeHash === 'explore' && (
          <section id="explore">
            <div className="w" style={{ paddingTop: '60px' }}>
              <p className="lbl">Explore challenges</p>
              <h1 style={{ fontSize: 'clamp(32px, 4.4vw, 48px)', margin: '8px 0 12px' }}>
                Every challenge, published by the Admin.
              </h1>
              <p className="mut" style={{ maxWidth: '56ch', marginBottom: '28px' }}>
                Read everything without signing in. You’ll only be asked to sign in when you register.
              </p>

              <div className="bar2">
                <input
                  className="in"
                  style={{ width: '300px' }}
                  placeholder="Search challenges"
                  aria-label="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select className="in" aria-label="Sort">
                  <option>Sort: Closing soon</option>
                  <option>Newest</option>
                  <option>Prize</option>
                </select>
              </div>

              <div className="chips">
                {['All', 'Daily', 'Weekly', 'Monthly', 'Yearly', 'UI Design', 'UX Design'].map((d) => (
                  <button
                    key={d}
                    aria-pressed={selectedDuration === d}
                    onClick={() => setSelectedDuration(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="chips">
                {['Any status', 'Upcoming', 'Registration open', 'Live', 'Closing soon', 'Completed'].map((s) => (
                  <button
                    key={s}
                    aria-pressed={selectedStatus === s}
                    onClick={() => setSelectedStatus(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="chips">
                {['Any participation', 'Individual', 'Team'].map((p) => (
                  <button
                    key={p}
                    aria-pressed={selectedParticipation === p}
                    onClick={() => setSelectedParticipation(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '16px' }}>
                {challenges.length > 0 ? (
                  challenges
                    .filter((c) => {
                      if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                      if (selectedDuration !== 'All' && c.categoryName && !c.categoryName.toLowerCase().includes(selectedDuration.toLowerCase()) && c.durationType !== selectedDuration.toUpperCase()) return false;
                      return true;
                    })
                    .map((c, i) => (
                      <div key={c.id} className="lst">
                        <div className={`cov ${i % 3 === 1 ? 'c2' : i % 3 === 2 ? 'c3' : ''}`}></div>
                        <div>
                          <span className="dur">{c.durationDisplay || 'Daily challenge'}</span>
                          <span className="st live" style={{ marginLeft: '8px' }}>
                            {c.status.replace(/_/g, ' ')}
                          </span>
                          <h2 style={{ fontSize: '24px', marginTop: '6px' }}>{c.title}</h2>
                          <p className="mut" style={{ margin: '2px 0 0' }}>
                            Admin · Portfolio Builders · {c.categoryName}
                          </p>
                          <p>{c.description}</p>
                          <div className="meta">
                            <span>
                              Participation <b>{c.participationType || 'Individual'}</b>
                            </span>
                            <span>
                              Prize <b>{c.prizePool || '₹50,000'}</b>
                            </span>
                            <span>
                              Fee <b>₹{c.registrationFee || 149}</b>
                            </span>
                            <span>
                              Submissions <b>{c.submissions?.length || 0}</b>
                            </span>
                          </div>
                        </div>
                        <div className="r">
                          <p className="lbl">Status</p>
                          <b>{c.status === 'LIVE' ? 'Ends in 2 days' : 'Open'}</b>
                          <a
                            className="btn gh"
                            onClick={() => {
                              setSelectedChallenge(c);
                              navigateTo('challenge');
                            }}
                          >
                            View details
                          </a>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="stt" style={{ marginTop: '20px' }}>
                    <div>
                      <h3>Loading challenges...</h3>
                      <div className="sk"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ height: '70px' }}></div>
          </section>
        )}

        {/* ================= SECTION 3: CHALLENGE DETAILS ================= */}
        {activeHash === 'challenge' && (() => {
          const activeChallenge = selectedChallenge || (challenges.length > 0 ? challenges[0] : null) || {
            title: 'Fintech Onboarding UX',
            durationDisplay: 'Daily · 24 hours',
            durationType: 'Daily',
            status: 'LIVE',
            categoryName: 'UX Design',
            participationType: 'Individual or Team (2–4)',
            prizePool: '₹50,000',
            registrationFee: 149,
            overview: 'New users abandon savings apps during sign-up. Redesign the first-time flow so someone can open an account and set a first goal in under three minutes.',
            objectives: 'Reduce steps and cognitive load.\nExplain trust and security clearly.\nPrototype the complete happy path.',
            eligibility: 'Open to students and professionals in India.\nIndividual or team. Team size: minimum 2, maximum 4.\nOriginal work only. One submission, before the deadline.',
          };

          return (
            <section id="challenge">
              <div className="w" style={{ paddingTop: '44px' }}>
                <a className="mut" onClick={() => navigateTo('explore')} style={{ cursor: 'pointer' }}>
                  ← Back to challenges
                </a>
                <div className="cov ban" style={{ marginTop: '18px' }}>
                  <div>
                    <span className="dur">{activeChallenge.durationDisplay || activeChallenge.durationType || 'Daily challenge'}</span>
                    <span className="st g" style={{ marginLeft: '8px' }}>
                      {activeChallenge.status?.replace(/_/g, ' ') || 'Live'}
                    </span>
                    <h1 style={{ marginTop: '10px', fontSize: 'clamp(30px, 4vw, 44px)' }}>
                      {activeChallenge.title}
                    </h1>
                  </div>
                </div>
                <p className="mut">Published by Admin · Portfolio Builders · {activeChallenge.categoryName || 'Design'}</p>

                <div className="sch">
                  <div>
                    <small>Duration</small>{activeChallenge.durationDisplay || activeChallenge.durationType || 'Daily · 24 hours'}
                  </div>
                  <div>
                    <small>Participation</small>{activeChallenge.participationType || 'Individual / Team'}
                  </div>
                  <div>
                    <small>Status</small>
                    <b>{activeChallenge.status === 'LIVE' ? 'Ends in 2 days' : activeChallenge.status?.replace(/_/g, ' ') || 'Open'}</b>
                  </div>
                  <div>
                    <small>Fee</small>₹{activeChallenge.registrationFee ?? 149}
                  </div>
                  <div>
                    <small>Prize pool</small>{activeChallenge.prizePool || '₹50,000'}
                  </div>
                  <div>
                    <small>Submission deadline</small>{activeChallenge.submissionDeadline ? new Date(activeChallenge.submissionDeadline).toLocaleDateString() : 'Closing soon'}
                  </div>
                </div>

                <div className="dg">
                  <div>
                    <article>
                      <h3>Overview and problem</h3>
                      <p className="mut">
                        {activeChallenge.overview || activeChallenge.description || 'Redesign and prototype an end-to-end user experience meeting all evaluation standards.'}
                      </p>
                    </article>
                    <article>
                      <h3>Objectives</h3>
                      <ul>
                        {(activeChallenge.objectives ? activeChallenge.objectives.split('\n').filter(Boolean) : [
                          'Reduce steps and cognitive load.',
                          'Explain trust and security clearly.',
                          'Prototype the complete happy path.',
                        ]).map((obj: string, i: number) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    </article>
                    <article>
                      <h3>Eligibility, participation and rules</h3>
                      <ul>
                        {(activeChallenge.eligibility ? activeChallenge.eligibility.split('\n').filter(Boolean) : [
                          'Open to students and professionals worldwide.',
                          'Individual or team. Team size: minimum 2, maximum 4.',
                          'Original work only. One submission, before the deadline.',
                        ]).map((rule: string, i: number) => (
                          <li key={i}>{rule}</li>
                        ))}
                      </ul>
                    </article>
                    <article>
                      <h3>Evaluation criteria</h3>
                      <div className="cr">
                        <span>User flow</span>
                        <div className="bar">
                          <i style={{ width: '30%' }}></i>
                        </div>
                        <span>30</span>
                      </div>
                      <div className="cr">
                        <span>Visual design</span>
                        <div className="bar">
                          <i style={{ width: '25%' }}></i>
                        </div>
                        <span>25</span>
                      </div>
                      <div className="cr">
                        <span>Research</span>
                        <div className="bar">
                          <i style={{ width: '25%' }}></i>
                        </div>
                        <span>25</span>
                      </div>
                      <div className="cr">
                        <span>Presentation</span>
                        <div className="bar">
                          <i style={{ width: '20%' }}></i>
                        </div>
                        <span>20</span>
                      </div>
                    </article>
                    <article style={{ border: 0 }}>
                      <h3>Prizes</h3>
                      <p className="mut">{activeChallenge.prizePool ? `Prize pool ${activeChallenge.prizePool} plus certificates and recognition for finalists.` : '1st ₹25,000 · 2nd ₹15,000 · 3rd ₹10,000, plus certificates for finalists.'}</p>
                    </article>
                  </div>

                  <aside className="gl reg">
                    <span className="st" style={{ background: 'rgba(159, 203, 176, 0.15)', color: 'var(--sg)', borderColor: 'rgba(159, 203, 176, 0.3)' }}>
                      Public View Only
                    </span>
                    <p style={{ fontSize: '28px', fontWeight: 600, margin: '12px 0 4px' }}>
                      {activeChallenge.prizePool || '₹50,000'}
                    </p>
                    <p className="mut" style={{ marginBottom: '14px' }}>
                      Prize pool · Public Directory
                    </p>
                    <div className="kv">
                      <span>Format</span>{activeChallenge.participationType || 'Individual / Team'}
                    </div>
                    <div className="kv">
                      <span>Duration</span>{activeChallenge.durationDisplay || activeChallenge.durationType || 'Daily challenge'}
                    </div>
                    <div className="kv">
                      <span>Status</span>{activeChallenge.status?.replace(/_/g, ' ') || 'Open'}
                    </div>
                    <div className="kv" style={{ border: 0 }}>
                      <span>Fee</span>₹{activeChallenge.registrationFee ?? 149}
                    </div>
                    <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--ln)', fontSize: '13px', color: 'var(--mut)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>Public Preview Mode</strong>
                      Registration is managed inside the Participant Portal. Public visitors can explore briefs, criteria, and prizes without registering.
                    </div>
                  </aside>
                </div>
              </div>
            </section>
          );
        })()}

        {/* ================= SECTION 4: HACKATHONS ================= */}
        {activeHash === 'hackathons' && (() => {
          const filteredHackathons = hackathons.filter((h) => {
            if (selectedHackathonFilter === 'All') return true;
            const fmt = (h.format || '').toUpperCase();
            const st = (h.status || '').toUpperCase();
            if (selectedHackathonFilter === 'Online') return fmt === 'ONLINE' || fmt === 'HYBRID';
            if (selectedHackathonFilter === 'Offline') return fmt === 'OFFLINE' || fmt === 'HYBRID';
            if (selectedHackathonFilter === 'Upcoming') return st === 'UPCOMING' || st === 'REGISTRATION_OPEN';
            if (selectedHackathonFilter === 'Live') return st === 'LIVE' || st === 'ACTIVE';
            if (selectedHackathonFilter === 'Completed') return st === 'COMPLETED' || st === 'CLOSED' || st === 'UNDER_EVALUATION';
            return true;
          });

          return (
            <section id="hackathons">
              <div className="w" style={{ paddingTop: '60px' }}>
                <p className="lbl">Hackathons</p>
                <h1 style={{ fontSize: 'clamp(32px, 4.4vw, 48px)', margin: '8px 0 26px' }}>
                  Build with a team, online or on site.
                </h1>
                <div className="chips">
                  {['All', 'Online', 'Offline', 'Upcoming', 'Live', 'Completed'].map((tab) => (
                    <button
                      key={tab}
                      aria-pressed={selectedHackathonFilter === tab}
                      onClick={() => setSelectedHackathonFilter(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '16px' }}>
                  {filteredHackathons.length > 0 ? (
                    filteredHackathons.map((h, i) => (
                      <div key={h.id} className="lst">
                        <div className={`cov ${i === 0 ? 'c4' : i === 1 ? 'c2' : 'c3'}`}></div>
                        <div>
                          <span className="dur">
                            {h.format} {h.venue ? `· ${h.venue}` : ''}
                          </span>
                          <span className="st g" style={{ marginLeft: '8px' }}>
                            {h.status ? h.status.replace(/_/g, ' ') : 'Scheduled'}
                          </span>
                          <h2 style={{ fontSize: '24px', marginTop: '6px' }}>{h.title}</h2>
                          <p className="mut" style={{ margin: '2px 0 0' }}>
                            Admin · Portfolio Builders · {h.categoryName || 'Open Category'}
                          </p>
                          <p>{h.description}</p>
                          <div className="meta">
                            <span>
                              Team <b>2–4</b>
                            </span>
                            <span>
                              Format <b>{h.format}</b>
                            </span>
                            <span>
                              Prize pool <b>{h.prizePool}</b>
                            </span>
                          </div>
                        </div>
                        <div className="r">
                          <p className="lbl">Status</p>
                          <b>{h.status ? h.status.replace(/_/g, ' ') : 'Scheduled'}</b>
                          <span className="st" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--sg)', border: '1px solid var(--ln)', textAlign: 'center', display: 'inline-block', padding: '6px 14px', borderRadius: '8px', fontSize: '13px' }}>
                            Public Schedule
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--mut)' }}>
                      <p style={{ fontSize: '16px' }}>No hackathons match the <strong>{selectedHackathonFilter}</strong> filter.</p>
                      <button
                        className="btn gh s"
                        onClick={() => setSelectedHackathonFilter('All')}
                        style={{ marginTop: '12px' }}
                      >
                        Reset to All
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ height: '70px' }}></div>
            </section>
          );
        })()}

        {/* ================= SECTION 5: ANNUAL AWARDS ================= */}
        {activeHash === 'awards' && (
          <section id="awards">
            <div className="w" style={{ paddingTop: '60px' }}>
              <p className="lbl">Annual Awards · Season 2026</p>
              <h1 style={{ margin: '8px 0 18px', maxWidth: '18ch' }}>Recognition that has been earned.</h1>
              <p className="mut" style={{ maxWidth: '60ch', marginBottom: '34px' }}>
                An annual programme created by the Admin. Categories, nominees, voting rules and results are all published here.
              </p>
              <div className="stp" style={{ maxWidth: '820px' }}>
                <span className="d">Nominations · to 20 Nov</span>
                <span className="d">Judging · 21–30 Nov</span>
                <span>Public voting · 1–10 Dec</span>
                <span>Winners · 15 Dec</span>
              </div>
            </div>

            <div className="sec" style={{ marginTop: '50px' }}>
              <div className="w">
                <h2 style={{ marginBottom: '10px' }}>Award categories</h2>
                <div className="row">
                  <span className="n">01</span>
                  <div>
                    <h3>Best UI Design</h3>
                    <span className="mut" style={{ fontSize: '13px' }}>
                      Judged
                    </span>
                  </div>
                  <p className="mut">Visual craft, systems and polish.</p>
                  <span className="mut" style={{ fontSize: '13px' }}>
                    12 nominees
                  </span>
                  <span className="st g">Nominees published</span>
                </div>
                <div className="row">
                  <span className="n">02</span>
                  <div>
                    <h3>Best UX Design</h3>
                    <span className="mut" style={{ fontSize: '13px' }}>
                      Judged
                    </span>
                  </div>
                  <p className="mut">Research, flows and problem solving.</p>
                  <span className="mut" style={{ fontSize: '13px' }}>
                    10 nominees
                  </span>
                  <span className="st g">Nominees published</span>
                </div>
                <div className="row">
                  <span className="n">03</span>
                  <div>
                    <h3>Best Website Redesign</h3>
                    <span className="mut" style={{ fontSize: '13px' }}>
                      Judged
                    </span>
                  </div>
                  <p className="mut">A public-facing site improved with evidence.</p>
                  <span className="mut" style={{ fontSize: '13px' }}>
                    9 nominees
                  </span>
                  <span className="st g">Nominees published</span>
                </div>
                <div className="row">
                  <span className="n">04</span>
                  <div>
                    <h3>People’s Choice Award</h3>
                    <span className="mut" style={{ fontSize: '13px' }}>
                      Public choice
                    </span>
                  </div>
                  <p className="mut">Chosen by free, verified public voting.</p>
                  <span className="mut" style={{ fontSize: '13px' }}>
                    Nominees published
                  </span>
                  <span className="st up">Voting open</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= SECTION 6: PUBLIC VOTING ================= */}
        {activeHash === 'voting' && (() => {
          // Available categories (from DB or fallbacks)
          const availableCategories = votingCategories.length > 0 ? votingCategories : [
            { id: 'cat-pc-ui', name: 'People’s Choice · UI' },
            { id: 'cat-best-ux', name: 'Best UX Design' },
            { id: 'cat-web-redesign', name: 'Best Website Redesign' },
            { id: 'cat-innovation', name: 'Innovation Award' },
          ];

          const currentCat = availableCategories.find((c: any) => c.id === selectedVotingCategoryId) || availableCategories[0];
          const hasVotedInCat = userVotes.some(
            (v) => (v.categoryId && v.categoryId === currentCat.id) || (selectedNominee && v.nominationId === selectedNominee.id)
          );

          // Nominees for the selected category
          const nomineesForCat = (currentCat?.nominations && currentCat.nominations.length > 0)
            ? currentCat.nominations.map((n: any, idx: number) => ({
                id: n.id,
                name: n.nomineeName || n.submission?.title || 'Anonymous Designer',
                title: n.nomineeTitle || n.submission?.title || 'Design Work',
                category: currentCat.name,
                categoryId: currentCat.id,
                description: n.description || n.submission?.detailedWriteup || n.submission?.shortDescription || 'Nominated for outstanding design and craftsmanship.',
                demoUrl: n.submission?.demoUrl || 'https://figma.com/proto/project-preview',
                coverClass: idx % 3 === 0 ? 'c3' : idx % 3 === 1 ? 'c2' : 'c4',
              }))
            : [
                {
                  id: 'nom-checkout',
                  name: 'Meera N.',
                  title: 'Checkout, simplified',
                  category: currentCat?.name || 'People’s Choice · UI',
                  categoryId: currentCat?.id || 'cat-pc-ui',
                  description: 'A three-step checkout for a regional e-commerce brand. The redesign cut form fields by half and added clear error recovery.',
                  demoUrl: 'https://figma.com/proto/checkout-simplified',
                  coverClass: 'c3',
                },
                {
                  id: 'nom-wayfinder',
                  name: 'Anjali R.',
                  title: 'Wayfinder travel dashboard',
                  category: currentCat?.name || 'People’s Choice · UI',
                  categoryId: currentCat?.id || 'cat-pc-ui',
                  description: 'A trip-planning dashboard with clear typography and booking management.',
                  demoUrl: 'https://figma.com/proto/wayfinder-dashboard',
                  coverClass: 'c2',
                },
                {
                  id: 'nom-finflow',
                  name: 'Team Parallel',
                  title: 'FinFlow onboarding',
                  category: currentCat?.name || 'People’s Choice · UI',
                  categoryId: currentCat?.id || 'cat-pc-ui',
                  description: 'Streamlined onboarding flow for personal savings app.',
                  demoUrl: 'https://figma.com/proto/finflow-onboarding',
                  coverClass: 'c4',
                },
              ];

          const votingSteps = [
            { step: 1, label: 'Pick a category' },
            { step: 2, label: 'Browse nominees' },
            { step: 3, label: 'View the work' },
            { step: 4, label: 'Vote' },
            { step: 5, label: 'Verify' },
            { step: 6, label: 'Confirmed' },
          ];

          return (
            <section id="voting">
              <div className="w" style={{ paddingTop: '60px' }}>
                <div className="two" style={{ alignItems: 'end' }}>
                  <div>
                    <p className="lbl">Public Choice Awards · 2026</p>
                    <h1 style={{ fontSize: 'clamp(32px, 4.4vw, 48px)', margin: '8px 0 14px' }}>
                      Vote for the work you admire.
                    </h1>
                    <p className="mut" style={{ maxWidth: '52ch' }}>
                      Follow the 6-step public voting process. Voting is free and verified with email OTP to ensure 100% genuine results.
                    </p>
                  </div>
                  <div className="gl" style={{ padding: '22px' }}>
                    <span className="st g">Voting open</span>
                    <div className="kv" style={{ marginTop: '12px' }}>
                      <span>Opens</span>1 Dec, 9:00 AM
                    </div>
                    <div className="kv">
                      <span>Closes</span>10 Dec, 6:00 PM
                    </div>
                    <div className="kv" style={{ border: 0 }}>
                      <span>Categories</span>{availableCategories.length} available
                    </div>
                  </div>
                </div>

                {/* 6-step workflow bar */}
                <div className="stp" style={{ margin: '40px 0 0', maxWidth: '860px' }}>
                  {votingSteps.map((s) => {
                    const isDone = votingActiveStep >= s.step || (s.step === 6 && hasVotedInCat);
                    return (
                      <span
                        key={s.step}
                        className={isDone ? 'd' : ''}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                        onClick={() => {
                          if (s.step === 1) {
                            setVotingActiveStep(1);
                          } else if (s.step === 2) {
                            setVotingActiveStep(2);
                          } else if (s.step === 3 && selectedNominee) {
                            setVotingActiveStep(3);
                            navigateTo('nominee');
                          } else if (s.step === 4 && selectedNominee) {
                            setVotingActiveStep(4);
                            openVoteModal(selectedNominee);
                          } else if (s.step === 5) {
                            setVotingActiveStep(5);
                            setVoteStep('s2');
                            setVotingModalOpen(true);
                          } else if (s.step === 6 && hasVotedInCat) {
                            setVotingActiveStep(6);
                            setVoteStep('s3');
                            setVotingModalOpen(true);
                          }
                        }}
                      >
                        {s.step}. {s.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Step 1: Pick a category */}
              <div className="w" style={{ marginTop: '36px' }}>
                <p className="lbl" style={{ marginBottom: '12px' }}>Step 1: Pick a category</p>
                <div className="chips">
                  {availableCategories.map((cat: any) => (
                    <button
                      key={cat.id}
                      aria-pressed={selectedVotingCategoryId === cat.id}
                      onClick={() => {
                        setSelectedVotingCategoryId(cat.id);
                        setVotingActiveStep((prev) => Math.max(prev, 2));
                      }}
                      style={{ fontSize: '14px', padding: '8px 18px' }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Browse nominees */}
              <div className="sec" style={{ marginTop: '20px' }}>
                <div className="w">
                  <div className="hd">
                    <div>
                      <p className="lbl">{currentCat.name}</p>
                      <h2>Step 2: Browse nominees ({nomineesForCat.length})</h2>
                    </div>
                    {hasVotedInCat && (
                      <span className="st g" style={{ fontSize: '13px', padding: '6px 14px' }}>
                        ✓ You voted in this category
                      </span>
                    )}
                  </div>

                  <div className="nom">
                    {nomineesForCat.map((nom: any) => {
                      const isThisNomineeVoted = userVotes.some((v) => v.nominationId === nom.id);
                      return (
                        <div key={nom.id}>
                          <div className={`cov ${nom.coverClass || 'c3'}`}></div>
                          <p className="lbl">{nom.category}</p>
                          <h3>{nom.title}</h3>
                          <p className="mut">{nom.name}</p>
                          <div className="b">
                            <a
                              className="btn gh s"
                              onClick={() => {
                                setSelectedNominee(nom);
                                setVotingActiveStep(3); // Step 3: View the work
                                navigateTo('nominee');
                              }}
                            >
                              View work
                            </a>
                            {isThisNomineeVoted || hasVotedInCat ? (
                              <button
                                className="btn s gh"
                                onClick={() => {
                                  setSelectedNominee(nom);
                                  setVoteStep('s3');
                                  setVotingActiveStep(6);
                                  setVotingModalOpen(true);
                                }}
                                style={{ opacity: 0.9, borderColor: '#26835a', color: '#9fcbb0' }}
                              >
                                ✓ {isThisNomineeVoted ? 'Confirmed' : 'Voted'}
                              </button>
                            ) : (
                              <button
                                className="btn s"
                                onClick={() => {
                                  setSelectedNominee(nom);
                                  setVotingActiveStep(4); // Step 4: Vote
                                  openVoteModal(nom);
                                }}
                              >
                                Vote
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="mut" style={{ fontSize: '13px', marginTop: '24px' }}>
                    Nominees appear in random order. Vote counts stay hidden until voting closes.
                  </p>
                </div>
              </div>

              <div className="sec t">
                <div className="w">
                  <h2 style={{ marginBottom: '20px' }}>How we keep voting fair</h2>
                  <div className="pol">
                    <div>
                      <b>Free, always</b>
                      <small>No paid votes and no paid advantages.</small>
                    </div>
                    <div>
                      <b>Verified voters</b>
                      <small>Email OTP verification before a vote counts.</small>
                    </div>
                    <div>
                      <b>Configurable limits</b>
                      <small>One vote per category is the default policy.</small>
                    </div>
                    <div>
                      <b>Rate limiting and bot protection</b>
                      <small>Automated voting is blocked.</small>
                    </div>
                    <div>
                      <b>Duplicate-vote detection</b>
                      <small>Repeat votes from the same voter are not counted.</small>
                    </div>
                    <div>
                      <b>Audit records</b>
                      <small>Every vote is logged. Voter details are never shown publicly.</small>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

        {/* ================= SECTION 7: NOMINEE DETAIL ================= */}
        {activeHash === 'nominee' && (() => {
          const isThisNomineeVoted = userVotes.some(
            (v) => (selectedNominee.categoryId && v.categoryId === selectedNominee.categoryId) || v.nominationId === selectedNominee.id
          );

          const votingSteps = [
            { step: 1, label: 'Pick a category' },
            { step: 2, label: 'Browse nominees' },
            { step: 3, label: 'View the work' },
            { step: 4, label: 'Vote' },
            { step: 5, label: 'Verify' },
            { step: 6, label: 'Confirmed' },
          ];

          return (
            <section id="nominee">
              <div className="w" style={{ paddingTop: '44px' }}>
                <a
                  className="mut"
                  onClick={() => {
                    setVotingActiveStep(2);
                    navigateTo('voting');
                  }}
                  style={{ cursor: 'pointer', display: 'inline-block', marginBottom: '16px' }}
                >
                  ← Back to nominees
                </a>

                {/* 6-step workflow bar */}
                <div className="stp" style={{ marginBottom: '28px', maxWidth: '860px' }}>
                  {votingSteps.map((s) => {
                    const isDone = votingActiveStep >= s.step || (s.step === 6 && isThisNomineeVoted);
                    return (
                      <span
                        key={s.step}
                        className={isDone ? 'd' : ''}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                        onClick={() => {
                          if (s.step === 1) {
                            setVotingActiveStep(1);
                            navigateTo('voting');
                          } else if (s.step === 2) {
                            setVotingActiveStep(2);
                            navigateTo('voting');
                          } else if (s.step === 4) {
                            setVotingActiveStep(4);
                            openVoteModal(selectedNominee);
                          }
                        }}
                      >
                        {s.step}. {s.label}
                      </span>
                    );
                  })}
                </div>

                <div className="dg" style={{ marginTop: '20px' }}>
                  <div>
                    <div className={`cov ${selectedNominee.coverClass || 'c3'}`} style={{ height: '380px', borderRadius: '18px' }}></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', margin: '12px 0 30px' }}>
                      <div className="cov c2" style={{ height: '100px' }}></div>
                      <div className="cov" style={{ height: '100px' }}></div>
                      <div className="cov c4" style={{ height: '100px' }}></div>
                    </div>
                    <p className="lbl">{selectedNominee.category || 'Best UI Design · People’s Choice'}</p>
                    <h1 style={{ fontSize: 'clamp(30px, 4vw, 42px)', margin: '8px 0 16px' }}>
                      {selectedNominee.title || 'Checkout, simplified'}
                    </h1>
                    <p className="mut" style={{ maxWidth: '62ch', marginBottom: '24px' }}>
                      {selectedNominee.description || 'A comprehensive product redesign focused on simplifying flows, improving accessibility, and delivering delightful user experiences.'}
                    </p>
                    <div className="kv">
                      <span>Nominee</span>{selectedNominee.name || 'Meera N.'}
                    </div>
                    <div className="kv">
                      <span>Category</span>{selectedNominee.category || 'People’s Choice Award'}
                    </div>
                    <div className="kv">
                      <span>Nomination</span>Shortlisted by Admin · Verified Entry
                    </div>
                    <div className="kv">
                      <span>Live project</span>
                      <a href={selectedNominee.demoUrl || 'https://figma.com'} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sg)' }}>
                        {selectedNominee.demoUrl || 'figma.com/proto/project-preview'} (approved)
                      </a>
                    </div>
                  </div>

                  <aside className="gl reg">
                    <span className="st g">Voting open</span>
                    <p className="mut" style={{ margin: '10px 0 4px' }}>
                      Closes 10 Dec, 6:00 PM
                    </p>
                    <h3 style={{ marginBottom: '12px' }}>
                      {isThisNomineeVoted ? 'Vote Confirmed' : 'Vote for this nominee'}
                    </h3>
                    {isThisNomineeVoted ? (
                      <button
                        className="btn gh"
                        onClick={() => {
                          setVoteStep('s3');
                          setVotingActiveStep(6);
                          setVotingModalOpen(true);
                        }}
                        style={{ width: '100%', justifyContent: 'center', borderColor: '#26835a', color: '#9fcbb0' }}
                      >
                        ✓ Vote Confirmed
                      </button>
                    ) : (
                      <button
                        className="btn"
                        id="vb"
                        onClick={() => {
                          setVotingActiveStep(4); // Step 4: Vote
                          openVoteModal(selectedNominee);
                        }}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        Vote for this nominee
                      </button>
                    )}
                    <p className="mut" style={{ fontSize: '12.5px', marginTop: '12px' }}>
                      Free. We’ll verify your email with a 6-digit OTP so every vote is genuine. Your details stay private.
                    </p>
                  </aside>
                </div>
              </div>
            </section>
          );
        })()}

        {/* ================= SECTION 8: WINNERS ================= */}
        {activeHash === 'winners' && (
          <section id="winners">
            <div className="w" style={{ paddingTop: '60px' }}>
              <p className="lbl">Winners</p>
              <h1 style={{ fontSize: 'clamp(32px, 4.4vw, 48px)', margin: '8px 0 26px' }}>
                Officially published results.
              </h1>
              <div className="chips">
                <button aria-pressed="true">2026</button>
                <button aria-pressed="false">2025</button>
                <button aria-pressed="false">2024</button>
              </div>

              <div
                className="cov c3"
                style={{
                  padding: '34px',
                  minHeight: '260px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  margin: '20px 0 30px',
                }}
              >
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <span className="dur">Winner · Best UX Design · 2026</span>
                  <h2 style={{ margin: '8px 0 4px' }}>Meera N.</h2>
                  <p className="mut">Checkout, simplified · E-commerce Checkout Redesign</p>
                </div>
              </div>

              <div className="sc">
                <table>
                  <thead>
                    <tr>
                      <th>Winner</th>
                      <th>Award</th>
                      <th>Competition</th>
                      <th>Year</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span className="av">TP</span>
                          <div>
                            <b>Team Parallel</b>
                            <small>Wayfinder</small>
                          </div>
                        </div>
                      </td>
                      <td>Best App Redesign</td>
                      <td>Weekly UI</td>
                      <td>2026</td>
                      <td>
                        <a onClick={() => navigateTo('showcase')} style={{ color: 'var(--sg)', cursor: 'pointer' }}>
                          View project
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span className="av">AK</span>
                          <div>
                            <b>Arun K.</b>
                            <small>Munnar Stays</small>
                          </div>
                        </div>
                      </td>
                      <td>Best Website Redesign</td>
                      <td>Redesign Prize 2025</td>
                      <td>2025</td>
                      <td>
                        <a onClick={() => navigateTo('showcase')} style={{ color: 'var(--sg)', cursor: 'pointer' }}>
                          View project
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span className="av">SK</span>
                          <div>
                            <b>Sana K.</b>
                            <small>Kerala Rail Companion</small>
                          </div>
                        </div>
                      </td>
                      <td>Innovation Award</td>
                      <td>Civic Tech Weekend</td>
                      <td>2025</td>
                      <td>
                        <a onClick={() => navigateTo('showcase')} style={{ color: 'var(--sg)', cursor: 'pointer' }}>
                          View project
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mut" style={{ fontSize: '13px', marginTop: '16px' }}>
                Only officially published winners are listed.
              </p>
            </div>
            <div style={{ height: '70px' }}></div>
          </section>
        )}

        {/* ================= SECTION 9: AWARD GALLERY ================= */}
        {activeHash === 'gallery' && (
          <section id="gallery">
            <div className="w" style={{ paddingTop: '60px' }}>
              <p className="lbl">Award gallery</p>
              <h1 style={{ fontSize: 'clamp(32px, 4.4vw, 48px)', margin: '8px 0 26px' }}>
                The archive of recognition.
              </h1>
              <div className="chips">
                <button aria-pressed="true">All years</button>
                <button aria-pressed="false">2026</button>
                <button aria-pressed="false">2025</button>
                <button aria-pressed="false">2024</button>
              </div>

              <div className="gal" style={{ marginTop: '20px' }}>
                <div className="b4">
                  <div className="cert" style={{ minHeight: '320px' }}>
                    <p className="lbl">Certificate · Winner</p>
                    <h3>Best UX Design</h3>
                  </div>
                  <p>
                    <b>Meera N.</b> · 2026 · E-commerce Checkout Redesign
                  </p>
                </div>
                <div>
                  <div className="cert" style={{ minHeight: '320px' }}>
                    <p className="lbl">Trophy</p>
                    <h3>Innovation Award</h3>
                  </div>
                  <p>
                    <b>Sana K.</b> · 2025 · Civic Tech Weekend
                  </p>
                </div>
                <div className="b3">
                  <div className="cert" style={{ minHeight: '220px' }}>
                    <p className="lbl">Certificate · Finalist</p>
                    <h3>Best Website Design</h3>
                  </div>
                  <p>
                    <b>Anjali R.</b> · 2026 · Annual Awards
                  </p>
                </div>
                <div className="b3">
                  <div className="cert" style={{ minHeight: '220px' }}>
                    <p className="lbl">Special recognition</p>
                    <h3>Most Accessible Design</h3>
                  </div>
                  <p>
                    <b>Team Nila</b> · 2025 · Open Web Sprint
                  </p>
                </div>
              </div>
            </div>
            <div style={{ height: '70px' }}></div>
          </section>
        )}

        {/* ================= SECTION 10: LEADERBOARD ================= */}
        {activeHash === 'leaderboard' && (
          <section id="leaderboard">
            <div className="w" style={{ paddingTop: '60px' }}>
              <p className="lbl">Leaderboard</p>
              <h1 style={{ fontSize: 'clamp(32px, 4.4vw, 48px)', margin: '8px 0 14px' }}>
                Published rankings only.
              </h1>
              <p className="mut" style={{ maxWidth: '62ch', marginBottom: '26px' }}>
                Judge-evaluated rankings and public-choice results are shown separately. Public votes do not decide every award, and unpublished scores are never shown.
              </p>

              <h2 style={{ fontSize: '22px', margin: '30px 0 8px' }}>Judge-evaluated rankings</h2>
              <div className="sc">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Participant</th>
                      <th>Competition</th>
                      <th>Category</th>
                      <th>Published score</th>
                      <th>Recognition</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <b>1</b>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span className="av" style={{ width: '34px', height: '34px', fontSize: '12px' }}>
                            MN
                          </span>
                          Meera N.
                        </div>
                      </td>
                      <td>Checkout Redesign</td>
                      <td>UX</td>
                      <td>92 / 100</td>
                      <td>Winner</td>
                      <td>
                        <span className="st g">Published</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>2</b>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span className="av" style={{ width: '34px', height: '34px', fontSize: '12px' }}>
                            TP
                          </span>
                          Team Parallel
                        </div>
                      </td>
                      <td>Weekly UI</td>
                      <td>App</td>
                      <td>89 / 100</td>
                      <td>Runner-up</td>
                      <td>
                        <span className="st g">Published</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <b>3</b>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span className="av" style={{ width: '34px', height: '34px', fontSize: '12px' }}>
                            AK
                          </span>
                          Arun K.
                        </div>
                      </td>
                      <td>Redesign Prize</td>
                      <td>Website</td>
                      <td>86 / 100</td>
                      <td>Finalist</td>
                      <td>
                        <span className="st g">Published</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ height: '70px' }}></div>
          </section>
        )}

        {/* ================= SECTION 11: SHOWCASE ================= */}
        {activeHash === 'showcase' && (
          <section id="showcase">
            <div className="w" style={{ paddingTop: '60px' }}>
              <p className="lbl">Participant showcase</p>
              <h1 style={{ fontSize: 'clamp(32px, 4.4vw, 48px)', margin: '8px 0 14px' }}>
                A curated exhibition of approved work.
              </h1>
              <p className="mut" style={{ maxWidth: '60ch', marginBottom: '26px' }}>
                Only portfolios approved for public display appear here, with only the details their owners approved.
              </p>
              <div className="win" style={{ marginTop: '24px' }}>
                <div>
                  <div className="cov c3" style={{ height: '210px', marginBottom: '12px' }}></div>
                  <p className="lbl">UX · Winner · Checkout Redesign</p>
                  <h3 style={{ margin: '4px 0' }}>Checkout, simplified</h3>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '8px 0' }}>
                    <span className="av" style={{ width: '30px', height: '30px', fontSize: '11px' }}>
                      MN
                    </span>
                    <span>Meera N.</span>
                  </div>
                  <a className="btn gh s" href="/participant#profile">
                    View portfolio
                  </a>
                </div>
                <div>
                  <div className="cov c2" style={{ height: '210px', marginBottom: '12px' }}></div>
                  <p className="lbl">UI · Finalist · Weekly UI</p>
                  <h3 style={{ margin: '4px 0' }}>Wayfinder dashboard</h3>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '8px 0' }}>
                    <span className="av" style={{ width: '30px', height: '30px', fontSize: '11px' }}>
                      AR
                    </span>
                    <span>Anjali R.</span>
                  </div>
                  <a className="btn gh s" href="/participant#profile">
                    View portfolio
                  </a>
                </div>
                <div>
                  <div className="cov c4" style={{ height: '210px', marginBottom: '12px' }}></div>
                  <p className="lbl">Website · Winner · Redesign Prize</p>
                  <h3 style={{ margin: '4px 0' }}>Munnar Stays</h3>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '8px 0' }}>
                    <span className="av" style={{ width: '30px', height: '30px', fontSize: '11px' }}>
                      AK
                    </span>
                    <span>Arun K.</span>
                  </div>
                  <a className="btn gh s" href="/participant#profile">
                    View portfolio
                  </a>
                </div>
              </div>
            </div>
            <div style={{ height: '70px' }}></div>
          </section>
        )}

        {/* ================= SECTION 12: ABOUT ================= */}
        {activeHash === 'about' && (
          <section id="about">
            <div className="w" style={{ paddingTop: '60px' }}>
              <div className="two">
                <div>
                  <p className="lbl">About</p>
                  <h1 style={{ fontSize: 'clamp(32px, 4.4vw, 48px)', margin: '8px 0 18px' }}>
                    A place to be seen for the work you do.
                  </h1>
                </div>
                <div>
                  <p className="mut" style={{ marginBottom: '14px' }}>
                    <b style={{ color: 'var(--ink)' }}>Mission.</b> Give designers and developers real briefs, fair judging and public recognition.
                  </p>
                  <p className="mut">
                    <b style={{ color: 'var(--ink)' }}>Vision.</b> A trusted international stage for emerging talent, where every result is published openly.
                  </p>
                </div>
              </div>
            </div>
            <div className="sec" style={{ marginTop: '56px' }}>
              <div className="w">
                <h2 style={{ marginBottom: '24px' }}>How it works</h2>
                <div className="stp" style={{ gap: '6px' }}>
                  <span className="d">Admin publishes</span>
                  <span className="d">Visitors explore</span>
                  <span className="d">Participants register</span>
                  <span className="d">Work is submitted</span>
                  <span className="d">Judges evaluate</span>
                  <span className="d">Results published</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ================= 2-STEP PUBLIC VOTING MODAL ================= */}
      <div className={`md ${votingModalOpen ? 'o' : ''}`}>
        <div className="gl mp">
          <button className="x" onClick={() => setVotingModalOpen(false)} aria-label="Close">
            ×
          </button>

          {voteStep === 's0' && (
            <div className="sp o">
              <span className="st">Registration Required</span>
              <h3>Please register first to vote</h3>
              <p>Please register first to access this feature. Already have an account? You can sign in.</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                <a
                  className="btn"
                  href="/auth/public/register?redirect=/public#voting"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Register Now
                </a>
                <a
                  className="btn gh"
                  href="/auth/public/login?redirect=/public#voting"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Login
                </a>
              </div>
            </div>
          )}

          {voteStep === 's1' && (
            <div className="sp o">
              <p className="lbl">Step 1 of 2 · Verification</p>
              <h3>Verify your email to vote</h3>
              <p>Please enter the email address you used during registration. Your email is never shown publicly.</p>
              <input
                className="f"
                placeholder="you@example.com"
                aria-label="Email"
                value={voterEmail}
                onChange={(e) => {
                  setVoterEmail(e.target.value);
                  setVotingEmailError('');
                }}
              />
              {votingEmailError && (
                <div style={{ color: '#ef4444', fontSize: '13px', margin: '8px 0 12px', fontWeight: 500 }}>
                  {votingEmailError}
                </div>
              )}
              <button
                className="btn"
                style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                onClick={handleSendCode}
                disabled={votingLoading}
              >
                {votingLoading ? 'Verifying email...' : 'Send verification code'}
              </button>
            </div>
          )}

          {voteStep === 's2' && (
            <div className="sp o">
              <p className="lbl">Step 2 of 2 · Enter code</p>
              <h3>Check your inbox</h3>
              <p>We sent a 6-digit code to {voterEmail || 'you@example.com'}.</p>
              <div className="otp">
                {otpCode.map((val, idx) => (
                  <input
                    key={idx}
                    value={val}
                    onChange={(e) => {
                      const newArr = [...otpCode];
                      newArr[idx] = e.target.value.slice(-1);
                      setOtpCode(newArr);
                    }}
                    maxLength={1}
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                className="btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleVerifyVote}
                disabled={votingLoading}
              >
                {votingLoading ? 'Verifying...' : 'Verify and vote'}
              </button>
              <p style={{ margin: '12px 0 0', fontSize: '13px' }}>
                Didn’t get it?{' '}
                <a onClick={handleSendCode} style={{ color: 'var(--sg)', cursor: 'pointer' }}>
                  Resend code
                </a>
              </p>
            </div>
          )}

          {voteStep === 's3' && (
            <div className="sp o">
              <span className="st g">Vote submitted</span>
              <h3>Thank you. Your vote is recorded.</h3>
              <div className="kv">
                <span>Category</span>
                {selectedNominee.category}
              </div>
              <div className="kv">
                <span>Nominee</span>
                {selectedNominee.name} · {selectedNominee.title}
              </div>
              <div className="kv" style={{ border: 0 }}>
                <span>Status</span>Confirmed
              </div>
              <p style={{ margin: '12px 0 16px', fontSize: '13px' }}>
                One vote per category under the current policy. Results are published after voting closes.
              </p>
              <button className="btn gh" onClick={() => setVotingModalOpen(false)}>
                Back to nominees
              </button>
            </div>
          )}

          {voteStep === 's4' && (
            <div className="sp o">
              <span className="st off">Verification failed</span>
              <h3>That code didn’t match.</h3>
              <p>Check the code and try again, or request a new one. Your vote has not been counted.</p>
              <button className="btn" onClick={() => setVoteStep('s2')}>
                Try again
              </button>
            </div>
          )}

          {voteStep === 's5' && (
            <div className="sp o">
              <span className="st off">Vote already recorded</span>
              <h3>You have already voted. Multiple votes are not allowed.</h3>
              <p>The current policy allows only one vote per category. You can still vote in other open categories.</p>
              <button className="btn gh" onClick={() => setVotingModalOpen(false)}>
                Browse categories
              </button>
            </div>
          )}

          <div className="pv">
            <span>Preview workflow:</span>
            <button onClick={() => { setVoteStep('s1'); setVotingActiveStep(4); }}>Step 4: Vote</button>
            <button onClick={() => { setVoteStep('s2'); setVotingActiveStep(5); }}>Step 5: Verify</button>
            <button onClick={() => { setVoteStep('s3'); setVotingActiveStep(6); }}>Step 6: Confirmed</button>
            <button onClick={() => setVoteStep('s4')}>Failed</button>
            <button onClick={() => setVoteStep('s5')}>Already voted</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer>
        <div className="w">
          <div className="ft">
            <div>
              <a className="logo" onClick={() => navigateTo('home')}>
                <i>P</i>Portfolio Builders
              </a>
              <p className="mut" style={{ marginTop: '14px', maxWidth: '34ch', fontSize: '14px' }}>
                An Admin-run platform for challenges, hackathons and annual awards.
              </p>
            </div>
            <div>
              <h4>Explore</h4>
              <a onClick={() => navigateTo('explore')}>Explore Challenges</a>
              <a onClick={() => navigateTo('hackathons')}>Hackathons</a>
              <a onClick={() => navigateTo('awards')}>Annual Awards</a>
              <a onClick={() => navigateTo('voting')}>Public Voting</a>
              <a onClick={() => navigateTo('winners')}>Winners</a>
              <a onClick={() => navigateTo('showcase')}>Participant Showcase</a>
            </div>
            <div>
              <h4>Platform</h4>
              <a onClick={() => navigateTo('about')}>About</a>
              <a onClick={() => navigateTo('about')}>Rules and Guidelines</a>
              <a onClick={() => navigateTo('about')}>FAQs</a>
            </div>
            <div>
              <h4>Contact</h4>
              <a href="mailto:hello@portfoliobuilders.in">hello@portfoliobuilders.in</a>
              <a href="#">Kerala, India</a>
              <a href="#">LinkedIn</a>
              <a href="#">Instagram</a>
            </div>
          </div>
          <div className="cp">
            <span>© 2026 Portfolio Builders. Connected to PostgreSQL (db_challenge).</span>
            <a onClick={() => navigateTo('home')} style={{ display: 'inline', color: 'var(--sg)' }}>
              Back to top
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
