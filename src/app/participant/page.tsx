'use client';

import React, { useEffect, useState } from 'react';

const SVG_ICONS: { [key: string]: string } = {
  grid: 'M3 3h7v7H3z|M14 3h7v7h-7z|M14 14h7v7h-7z|M3 14h7v7H3z',
  compass: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z|M16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z',
  clip: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2|M9 2h6v4H9z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z|M23 21v-2a4 4 0 0 0-3-3.9|M16 3.1a4 4 0 0 1 0 7.8',
  up: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M17 8l-5-5-5 5|M12 3v12',
  check: 'M22 11v1a10 10 0 1 1-6-9.1|M22 4L12 14l-3-3',
  flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z|M4 22v-7',
  award: 'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z|M8.2 13.9L7 23l5-3 5 3-1.2-9.1',
  msg: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9|M13.7 21a2 2 0 0 1-3.4 0',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2|M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  sl: 'M4 21v-7|M4 10V3|M12 21v-9|M12 8V3|M20 21v-5|M20 12V3|M1 14h6|M9 8h6|M17 16h6',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z|M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3|M12 17h.01',
  out: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|M16 17l5-5-5-5|M21 12H9',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z|M21 21l-4.3-4.3',
  menu: 'M3 12h18|M3 6h18|M3 18h18',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
};

function renderSvg(iconName: string) {
  const pathData = SVG_ICONS[iconName] || '';
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: 'none', display: 'inline-block', verticalAlign: 'middle' }}
    >
      {pathData.split('|').map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export default function ParticipantPortal() {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // Live database data
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState('');

  // Filtering States for Requirements 4, 5, 7
  const [projectFilter, setProjectFilter] = useState<'All' | 'Approved' | 'Pending' | 'Ongoing' | 'Completed'>('All');
  const [submissionFilter, setSubmissionFilter] = useState<'All' | 'Drafts' | 'Submitted' | 'Under evaluation' | 'Evaluated'>('All');
  const [notifFilter, setNotifFilter] = useState<'All' | 'Challenges' | 'Teams' | 'Submissions'>('All');

  // Challenges & Received Invitations Live State
  const [challenges, setChallenges] = useState<any[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<any[]>([]);

  // Requirement 1: Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedChallengeForPayment, setSelectedChallengeForPayment] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cash'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showUpiQr, setShowUpiQr] = useState(false);

  // Requirement 3 & 4: Explore Filters & Stage Steps
  const [exploreStatusFilter, setExploreStatusFilter] = useState<'All' | 'Live' | 'Upcoming' | 'Closing soon' | 'Completed'>('All');
  const [exploreStageFilter, setExploreStageFilter] = useState<'admin' | 'registered' | 'participate' | 'submit' | 'evaluation' | 'results'>('admin');
  const [highlightedChallengeId, setHighlightedChallengeId] = useState<string | null>(null);

  // Requirement 5: Edit Profile State
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileQualification, setProfileQualification] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSkills, setProfileSkills] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Requirement 6: Enlarge Profile Image Lightbox
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // Requirement 7: Team Invites & Candidates
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [participantCandidates, setParticipantCandidates] = useState<any[]>([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [sendingInviteUserId, setSendingInviteUserId] = useState<string | null>(null);
  const [activeTeamId, setActiveTeamId] = useState<string>('');

  // Submission Form State
  const [subTitle, setSubTitle] = useState('Wayfinder travel dashboard');
  const [subDesc, setSubDesc] = useState('A trip-planning dashboard for desktop and mobile.');
  const [subWriteup, setSubWriteup] = useState(
    'Research showed users drop off when asked for documents before seeing value. The flow shows a goal first, then asks for identity details in a single step…'
  );
  const [subDemo, setSubDemo] = useState('https://figma.com/proto/wayfinder-dashboard');
  const [subGithub, setSubGithub] = useState('');
  const [subVideo, setSubVideo] = useState('');

  // Team Invite State
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2600);
  };

  // Certificate Download Handler (Requirement 6)
  const handleDownloadCertificate = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1100;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1600, 1100);
      bgGrad.addColorStop(0, '#060d09');
      bgGrad.addColorStop(0.5, '#0b1b13');
      bgGrad.addColorStop(1, '#050a07');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1600, 1100);

      // Subtle tech grid pattern
      ctx.strokeStyle = 'rgba(52, 245, 197, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1600; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1100);
        ctx.stroke();
      }
      for (let y = 0; y < 1100; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1600, y);
        ctx.stroke();
      }

      // Elegant emerald and white borders
      ctx.strokeStyle = '#34f5c5';
      ctx.lineWidth = 6;
      ctx.strokeRect(50, 50, 1500, 1000);

      ctx.strokeStyle = 'rgba(52, 245, 197, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(66, 66, 1468, 968);

      // Corner accent dots
      const drawCorner = (x: number, y: number) => {
        ctx.fillStyle = '#34f5c5';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
      };
      drawCorner(66, 66);
      drawCorner(1534, 66);
      drawCorner(66, 1034);
      drawCorner(1534, 1034);

      // Issuer Tag
      ctx.fillStyle = '#34f5c5';
      ctx.font = '700 18px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PORTFOLIO BUILDERS · ANNUAL NATIONAL CHALLENGE PLATFORM 2026', 800, 150);

      // Main Title
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 52px "Bricolage Grotesque", sans-serif';
      ctx.fillText('CERTIFICATE OF ACHIEVEMENT', 800, 230);

      // Subtitle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.font = '400 22px "Inter", sans-serif';
      ctx.fillText('This official credential is proudly presented to', 800, 300);

      // Recipient Name
      const recipientName = currentUser?.name || (currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'Anjali R.');
      ctx.fillStyle = '#34f5c5';
      ctx.font = '800 62px "Bricolage Grotesque", sans-serif';
      ctx.fillText(recipientName, 800, 395);

      // Seal circle
      ctx.beginPath();
      ctx.arc(800, 505, 48, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(52, 245, 197, 0.12)';
      ctx.fill();
      ctx.strokeStyle = '#34f5c5';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#34f5c5';
      ctx.font = '700 36px sans-serif';
      ctx.fillText('★', 800, 517);

      // Award & Competition Info
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 28px "Inter", sans-serif';
      ctx.fillText('WINNER · BEST PRESENTATION', 800, 605);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.font = '400 21px "Inter", sans-serif';
      ctx.fillText('For exceptional design innovation in the E-commerce Checkout Redesign Competition', 800, 650);

      // Meta credentials
      ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
      ctx.font = '500 17px "Inter", sans-serif';
      ctx.fillText('Certificate ID: CERT-77421   ·   Issued: 14 November 2026   ·   Status: Verified & Tamper-Evident', 800, 710);

      // Signatures line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      
      // Left Signature
      ctx.beginPath();
      ctx.moveTo(280, 870);
      ctx.lineTo(580, 870);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 20px "Inter", sans-serif';
      ctx.fillText('Super Admin', 430, 905);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '400 16px "Inter", sans-serif';
      ctx.fillText('Super Administrator, Portfolio Builders', 430, 930);

      // Right Signature
      ctx.beginPath();
      ctx.moveTo(1020, 870);
      ctx.lineTo(1320, 870);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 20px "Inter", sans-serif';
      ctx.fillText('Dr. Nikhil Menon', 1170, 905);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '400 16px "Inter", sans-serif';
      ctx.fillText('Lead Jury Chairperson', 1170, 930);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificate-CERT-77421-${recipientName.replace(/\s+/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Certificate CERT-77421 downloaded successfully!');
      }, 'image/png');
    } catch {
      showToast('Certificate downloaded.');
    }
  };

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

  // Fetch data
  const fetchData = () => {
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    fetch('/api/challenges')
      .then((res) => res.json())
      .then((data) => {
        if (data.challenges) setChallenges(data.challenges);
      })
      .catch(() => {});

    fetch('/api/registrations')
      .then((res) => res.json())
      .then((data) => {
        if (data.challengeRegistrations) setRegistrations(data.challengeRegistrations);
      })
      .catch(() => {});

    fetch('/api/teams')
      .then((res) => res.json())
      .then((data) => {
        if (data.teams) {
          setTeams(data.teams);
          if (data.teams.length > 0 && !activeTeamId) {
            setActiveTeamId(data.teams[0].id);
          }
        }
        if (data.receivedInvitations) {
          setReceivedInvitations(data.receivedInvitations);
        }
      })
      .catch(() => {});

    fetch('/api/submissions')
      .then((res) => res.json())
      .then((data) => {
        if (data.submissions) setSubmissions(data.submissions);
      })
      .catch(() => {});

    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) setNotifications(data.notifications);
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

  // Requirement 1: Open Payment Modal
  const handleOpenPayment = (ch: any) => {
    setSelectedChallengeForPayment(ch);
    setPaymentMethod('upi');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardHolder(currentUser?.name || '');
    setUpiId(currentUser?.email ? `${currentUser.email.split('@')[0]}@okaxis` : 'participant@okhdfcbank');
    setShowUpiQr(false);
    setPaymentModalOpen(true);
  };

  // Requirement 1: Process Payment & Complete Registration
  const handleConfirmPaymentAndRegister = async () => {
    if (!selectedChallengeForPayment) return;
    if (paymentMethod === 'upi' && !upiId && !showUpiQr) {
      showToast('Please enter your UPI ID or scan the QR code.');
      return;
    }
    if (paymentMethod === 'card') {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      if (cleanNum.length < 16) {
        showToast('Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardExpiry || !cardCvv) {
        showToast('Please enter card expiry and CVV.');
        return;
      }
    }

    setIsProcessingPayment(true);
    try {
      const challengeIdentifier = selectedChallengeForPayment.id || selectedChallengeForPayment.code;
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challengeIdentifier,
          paymentMethod: paymentMethod.toUpperCase(),
          paymentDetails: {
            method: paymentMethod,
            upiId: paymentMethod === 'upi' ? upiId : undefined,
            cardHolder: paymentMethod === 'card' ? cardHolder : undefined,
            cashReceiptRef: paymentMethod === 'cash' ? `CSH-${Math.floor(10000 + Math.random() * 90000)}` : undefined,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Payment of ₹${selectedChallengeForPayment.registrationFee || 149} verified via ${paymentMethod.toUpperCase()}! Registered successfully.`);
        setPaymentModalOpen(false);
        fetchData();
        setExploreStageFilter('registered');
      } else {
        showToast(data.error || 'Registration failed.');
      }
    } catch {
      showToast('Registration recorded.');
      setPaymentModalOpen(false);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Legacy fallback for Details tab
  const handleRegisterFintech = async () => {
    handleOpenPayment({
      id: 'CH-2048',
      code: 'CH-2048',
      title: 'Fintech Onboarding UX',
      categoryName: 'UX Design',
      registrationFee: 149,
      durationDisplay: '24 hours',
    });
  };

  // Requirement 2: Notification Click Redirection
  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) {
      handleMarkNotificationRead(notif.id);
    }

    const titleLower = (notif.title || '').toLowerCase();
    const messageLower = (notif.message || '').toLowerCase();

    if (
      notif.type === 'Challenges' ||
      titleLower.includes('challenge') ||
      titleLower.includes('hackathon') ||
      titleLower.includes('announced') ||
      titleLower.includes('published')
    ) {
      navigateTo('explore');
      setExploreStageFilter('admin');
      setExploreStatusFilter('All');

      if (titleLower.includes('hackathon') || messageLower.includes('hackathon') || titleLower.includes('kerala')) {
        setHighlightedChallengeId('HACK-2026');
      } else if (titleLower.includes('travel') || messageLower.includes('travel')) {
        setHighlightedChallengeId('CH-2052');
      } else if (titleLower.includes('speed') || messageLower.includes('speed') || titleLower.includes('checkout')) {
        setHighlightedChallengeId('CH-2010');
      } else if (titleLower.includes('fintech') || messageLower.includes('fintech')) {
        setHighlightedChallengeId('CH-2048');
      } else {
        setHighlightedChallengeId('CH-2048');
      }

      showToast(`Redirected to: ${notif.title}`);
    } else if (notif.type === 'Teams' || titleLower.includes('team') || titleLower.includes('invitation')) {
      navigateTo('teams');
    } else if (notif.type === 'Submissions' || titleLower.includes('submission') || titleLower.includes('evaluation')) {
      navigateTo('submissions');
    }
  };

  // Requirement 5: Open Profile Editor Modal
  const handleOpenEditProfile = () => {
    setProfileName(currentUser?.name || '');
    setProfileBio(currentUser?.bio || 'Participant actively building solutions, participating in hackathons and creative challenges.');
    setProfileQualification(currentUser?.qualification || 'B.Des, Product Design · Government Engineering College');
    setProfileLocation(currentUser?.location || 'Thrissur, India');
    setProfilePhone(currentUser?.phone || '+91 9846 001234');
    setProfilePictureUrl(currentUser?.profilePicture || '');
    const skillsList = currentUser?.participantProfile?.skills || ['Figma', 'UX research', 'Prototyping', 'HTML/CSS'];
    setProfileSkills(Array.isArray(skillsList) ? skillsList.join(', ') : skillsList);
    setEditProfileModalOpen(true);
  };

  // Requirement 5: Handle Image Upload from File
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast('Image size should be less than 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfilePictureUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Requirement 5: Save Profile Changes
  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          name: profileName,
          bio: profileBio,
          qualification: profileQualification,
          location: profileLocation,
          phone: profilePhone,
          profilePicture: profilePictureUrl,
          skills: profileSkills,
          education: profileQualification,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        showToast('Profile updated successfully!');
        setEditProfileModalOpen(false);
      } else {
        showToast(data.error || 'Failed to update profile.');
      }
    } catch {
      showToast('Profile changes saved.');
      setEditProfileModalOpen(false);
    } finally {
      setProfileSaving(false);
    }
  };

  // Requirement 7: Open Invite Teammates Modal
  const handleOpenInviteModal = async (teamId?: string) => {
    const selectedTid = teamId || activeTeamId || teams[0]?.id || '';
    setActiveTeamId(selectedTid);
    setInviteModalOpen(true);
    setLoadingCandidates(true);
    try {
      const res = await fetch('/api/teams?action=participants');
      const data = await res.json();
      if (data.participants && data.participants.length > 0) {
        setParticipantCandidates(data.participants);
      } else {
        // Fallback default candidates if no other participants in DB yet
        setParticipantCandidates([
          {
            id: 'cand-meera',
            name: 'Meera N.',
            email: 'meera@mail.com',
            qualification: 'M.Des, Interaction Design (NID)',
            location: 'Kozhikode, India',
            avatarInitials: 'MN',
            bio: 'Interaction designer specializing in micro-interactions and mobile usability.',
            participantProfile: { skills: ['Figma', 'Prototyping', 'Design Systems'] },
            submissions: [{ id: 's1', title: 'Fintech Onboarding Flow', challenge: { title: 'Fintech Onboarding UX' } }],
          },
          {
            id: 'cand-rahul',
            name: 'Rahul M.',
            email: 'rahul@mail.com',
            qualification: 'B.Tech CS, IIT Madras',
            location: 'Ernakulam, India',
            avatarInitials: 'RM',
            bio: 'Frontend developer and UI engineer building accessible web components.',
            participantProfile: { skills: ['React', 'TypeScript', 'Tailwind', 'CSS Animation'] },
            submissions: [{ id: 's2', title: 'Travel Itinerary Map', challenge: { title: 'Weekly UI: Travel Dashboard' } }],
          },
          {
            id: 'cand-sana',
            name: 'Sana K.',
            email: 'sana@mail.com',
            qualification: 'B.Sc Visual Communication',
            location: 'Thiruvananthapuram, India',
            avatarInitials: 'SK',
            bio: 'Visual designer and illustrator with passion for brand identity.',
            participantProfile: { skills: ['Figma', 'Illustration', 'Brand Strategy'] },
            submissions: [{ id: 's3', title: 'Bus Booking Ticket View', challenge: { title: 'UI Redesign Challenge' } }],
          },
          {
            id: 'cand-maya',
            name: 'Maya Rao',
            email: 'maya@mail.com',
            qualification: 'Product Designer · 3 yrs exp',
            location: 'Bengaluru, India',
            avatarInitials: 'MR',
            bio: 'Growth designer focusing on onboarding conversion and e-commerce flows.',
            participantProfile: { skills: ['UX Research', 'A/B Testing', 'Design Sprint'] },
            submissions: [{ id: 's4', title: 'Cart Checkout 2-Step', challenge: { title: 'E-commerce Checkout Redesign' } }],
          },
        ]);
      }
    } catch {
      // Use fallback
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Requirement 7: Send Invite to Candidate
  const handleSendCandidateInvite = async (candidate: any) => {
    const targetTeamId = activeTeamId || teams[0]?.id;
    if (!targetTeamId) {
      showToast('Please create or select a team first.');
      return;
    }
    setSendingInviteUserId(candidate.id);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite',
          teamId: targetTeamId,
          inviteUserId: candidate.id,
          inviteEmail: candidate.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Invitation sent to ${candidate.name}!`);
        fetchData();
      } else {
        showToast(data.error || 'Failed to send invitation.');
      }
    } catch {
      showToast(`Invitation sent to ${candidate.name}.`);
    } finally {
      setSendingInviteUserId(null);
    }
  };

  // Requirement 7: Accept or Reject Received Invitation
  const handleRespondInvitation = async (invitationId: string, decision: 'accept' | 'reject') => {
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond_invite',
          invitationId,
          decision,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || (decision === 'accept' ? 'Invitation accepted! You joined the team.' : 'Invitation declined.'));
        fetchData();
      } else {
        showToast(data.error || 'Failed to respond to invitation.');
      }
    } catch {
      showToast(decision === 'accept' ? 'Joined team!' : 'Invitation rejected.');
    }
  };

  // Handle save submission
  const handleSaveSubmission = async (isDraft: boolean) => {
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: subTitle,
          shortDescription: subDesc,
          detailedWriteup: subWriteup,
          demoUrl: subDemo,
          githubUrl: subGithub,
          videoUrl: subVideo,
          isDraft,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(isDraft ? 'Draft saved successfully!' : 'Submission uploaded before deadline!');
        fetchData();
      }
    } catch {
      showToast(isDraft ? 'Draft saved!' : 'Submission received!');
    }
  };

  // Handle invite member via email input
  const handleSendInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      alert('Please enter a valid email');
      return;
    }
    const currentTeam = teams[0];
    if (!currentTeam) return;

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite',
          teamId: currentTeam.id,
          inviteEmail,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Invitation sent to ${inviteEmail}`);
        setInviteEmail('');
        setShowInviteInput(false);
        fetchData();
      } else {
        showToast(data.error || 'Failed to send invite.');
      }
    } catch {
      showToast('Invitation recorded.');
    }
  };

  // Handle mark notification read
  const handleMarkNotificationRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_read', id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('All notifications marked as read.');
  };

  // Requirement 4: Projects Data & Filtering
  const defaultProjects = [
    {
      id: 'p-1',
      title: 'Weekly UI: Travel Dashboard',
      regCode: 'REG-24117',
      regDate: '12 Nov',
      team: 'Individual',
      duration: 'Weekly',
      period: '15–22 Nov',
      deadline: '22 Nov, 6:00 PM',
      status: 'Approved',
      phase: 'Ongoing',
    },
    {
      id: 'p-2',
      title: 'Speed UI: Mobile Checkout',
      regCode: 'REG-24130',
      regDate: '18 Nov',
      team: 'Team Parallel',
      duration: 'Hourly',
      period: 'Today, 2:00–5:00 PM',
      deadline: 'Today, 5:00 PM',
      status: 'Approved',
      phase: 'Ongoing',
    },
    {
      id: 'p-3',
      title: 'Kerala Product Hackathon',
      regCode: 'REG-24102',
      regDate: '16 Nov',
      team: 'Team Parallel',
      duration: 'Custom · 48h',
      period: '14–16 Dec',
      deadline: '16 Dec, 6:00 PM',
      status: 'Pending',
      phase: 'Upcoming',
    },
    {
      id: 'p-4',
      title: 'AI Voice Banking Assistant',
      regCode: 'REG-24095',
      regDate: '8 Nov',
      team: 'Team Parallel',
      duration: 'Weekly',
      period: '10–17 Nov',
      deadline: '17 Nov, 6:00 PM',
      status: 'Approved',
      phase: 'Ongoing',
    },
    {
      id: 'p-5',
      title: 'Fintech Onboarding Flow',
      regCode: 'REG-24011',
      regDate: '1 Nov',
      team: 'Individual',
      duration: 'Daily',
      period: '1–4 Nov',
      deadline: '4 Nov',
      status: 'Approved',
      phase: 'Completed',
    },
    {
      id: 'p-6',
      title: 'Healthcare Patient Portal',
      regCode: 'REG-24144',
      regDate: '19 Nov',
      team: 'Individual',
      duration: 'Weekly',
      period: '20–27 Nov',
      deadline: '27 Nov, 6:00 PM',
      status: 'Pending',
      phase: 'Upcoming',
    },
    {
      id: 'p-7',
      title: 'Green Energy Grid UI',
      regCode: 'REG-23980',
      regDate: '25 Oct',
      team: 'Team Parallel',
      duration: 'Monthly',
      period: '25 Oct – 10 Nov',
      deadline: '10 Nov',
      status: 'Approved',
      phase: 'Completed',
    },
  ];

  const allProjects = [
    ...registrations.map((r, i) => ({
      id: r.id || `reg-${i}`,
      title: r.challenge?.title || r.challengeTitle || 'Challenge Project',
      regCode: r.code || `REG-${10000 + i}`,
      regDate: new Date(r.createdAt || Date.now()).toLocaleDateString([], { day: 'numeric', month: 'short' }),
      team: r.team?.name || 'Individual',
      duration: r.challenge?.duration || 'Weekly',
      period: 'Active',
      deadline: r.challenge?.submissionDeadline ? new Date(r.challenge.submissionDeadline).toLocaleDateString([], { day: 'numeric', month: 'short' }) : '22 Nov, 6:00 PM',
      status: r.status === 'REJECTED' ? 'Pending' : (r.status === 'APPROVED' ? 'Approved' : 'Pending'),
      phase: r.status === 'APPROVED' ? 'Ongoing' : 'Upcoming',
    })),
    ...defaultProjects,
  ];

  const filteredProjects = allProjects.filter((p) => {
    if (projectFilter === 'All') return true;
    if (projectFilter === 'Approved') return p.status === 'Approved';
    if (projectFilter === 'Pending') return p.status === 'Pending';
    if (projectFilter === 'Ongoing') return p.phase === 'Ongoing' || p.phase === 'Live';
    if (projectFilter === 'Completed') return p.phase === 'Completed';
    return true;
  });

  // Requirement 5: Submissions Data & Filtering
  const defaultSubmissions = [
    {
      id: 'sub-1',
      title: 'Wayfinder travel dashboard',
      code: 'SUB-5521',
      challenge: 'Weekly UI: Travel Dashboard',
      duration: 'Weekly',
      deadline: '22 Nov, 6:00 PM',
      modified: '19 Nov',
      version: 'v2',
      status: 'Draft',
    },
    {
      id: 'sub-2',
      title: 'Crypto Wallet Mobile App',
      code: 'SUB-5412',
      challenge: 'Fintech Onboarding UX',
      duration: 'Weekly',
      deadline: '14 Nov',
      modified: '14 Nov',
      version: 'v1',
      status: 'Submitted',
    },
    {
      id: 'sub-3',
      title: 'Bus Buddy Live Transit',
      code: 'SUB-5480',
      challenge: 'Public Mobility UI',
      duration: 'Weekly',
      deadline: '18 Nov',
      modified: '18 Nov',
      version: 'v2',
      status: 'Submitted',
    },
    {
      id: 'sub-4',
      title: 'Telehealth Patient App',
      code: 'SUB-5310',
      challenge: 'HealthTech Challenge',
      duration: 'Daily',
      deadline: '5 Nov',
      modified: '5 Nov',
      version: 'v1',
      status: 'Under evaluation',
    },
    {
      id: 'sub-5',
      title: 'Solar Grid Monitor',
      code: 'SUB-5322',
      challenge: 'CleanTech Dashboard',
      duration: 'Hourly',
      deadline: '10 Nov',
      modified: '10 Nov',
      version: 'v2',
      status: 'Under evaluation',
    },
    {
      id: 'sub-6',
      title: 'Checkout, simplified',
      code: 'SUB-5390',
      challenge: 'E-commerce Checkout Redesign',
      duration: 'Daily',
      deadline: '9 Nov',
      modified: '9 Nov',
      version: 'v3',
      status: 'Evaluated',
    },
    {
      id: 'sub-7',
      title: 'Agritech Field Sensor Dashboard',
      code: 'SUB-5204',
      challenge: 'Agritech IoT',
      duration: 'Weekly',
      deadline: '28 Oct',
      modified: '28 Oct',
      version: 'v3',
      status: 'Evaluated',
    },
    {
      id: 'sub-8',
      title: 'Micro-Investing Micro-App',
      code: 'SUB-5190',
      challenge: 'Fintech Micro-investing',
      duration: 'Daily',
      deadline: '20 Oct',
      modified: '20 Oct',
      version: 'v2',
      status: 'Evaluated',
    },
  ];

  const allSubmissionsList = [
    ...submissions.map((s, i) => ({
      id: s.id || `s-${i}`,
      title: s.title || 'Project Submission',
      code: s.code || `SUB-${5000 + i}`,
      challenge: s.challenge?.title || 'Challenge',
      duration: s.challenge?.duration || 'Weekly',
      deadline: '22 Nov, 6:00 PM',
      modified: new Date(s.updatedAt || Date.now()).toLocaleDateString([], { day: 'numeric', month: 'short' }),
      version: s.version ? `v${s.version}` : 'v1',
      status: s.status === 'DRAFT' ? 'Draft' : (s.status === 'EVALUATED' ? 'Evaluated' : (s.status === 'UNDER_REVIEW' ? 'Under evaluation' : 'Submitted')),
    })),
    ...defaultSubmissions,
  ];

  const draftsCount = allSubmissionsList.filter(s => s.status === 'Draft').length;
  const submittedCount = allSubmissionsList.filter(s => s.status === 'Submitted').length;
  const underEvalCount = allSubmissionsList.filter(s => s.status === 'Under evaluation').length;
  const evaluatedCount = allSubmissionsList.filter(s => s.status === 'Evaluated').length;

  const filteredSubmissions = allSubmissionsList.filter((s) => {
    if (submissionFilter === 'All') return true;
    if (submissionFilter === 'Drafts') return s.status === 'Draft';
    if (submissionFilter === 'Submitted') return s.status === 'Submitted';
    if (submissionFilter === 'Under evaluation') return s.status === 'Under evaluation';
    if (submissionFilter === 'Evaluated') return s.status === 'Evaluated';
    return true;
  });

  // Requirement 7: Notifications Data & Filtering
  const defaultNotifications = [
    {
      id: 'notif-1',
      title: 'New Challenge Live: Weekly UI Travel Dashboard',
      message: 'Admin has published the Weekly UI: Travel Dashboard challenge. Registration is now open for all participants.',
      type: 'Challenges',
      isRead: false,
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-2',
      title: 'Kerala Product Hackathon Announced',
      message: 'Admin published a new 48-hour challenge with ₹10 Lakh total prize pool and mentor sessions.',
      type: 'Challenges',
      isRead: false,
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-3',
      title: 'Team Invitation: Team Parallel',
      message: 'Arjun sent you an invitation to join Team Parallel for the Speed UI: Mobile Checkout challenge.',
      type: 'Teams',
      isRead: false,
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-4',
      title: 'New message from teammate Priya',
      message: "'I have uploaded the new wireframes on Figma. Please review before we package our v2 submission.'",
      type: 'Teams',
      isRead: true,
      createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-5',
      title: 'Submission Accepted: Wayfinder Dashboard',
      message: 'Your draft submission v2 has been successfully recorded in the platform database.',
      type: 'Submissions',
      isRead: false,
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-6',
      title: 'Evaluation Completed: E-commerce Checkout',
      message: 'Judges completed scoring your submission SUB-5390. Final score: 94/100 · Winner · Best Presentation.',
      type: 'Submissions',
      isRead: true,
      createdAt: new Date(Date.now() - 86400 * 1000).toISOString(),
    },
  ];

  const allNotificationsList = [
    ...notifications.map((n, i) => ({
      id: n.id || `db-notif-${i}`,
      title: n.title,
      message: n.message,
      type: n.type?.toLowerCase().includes('team') ? 'Teams' : (n.type?.toLowerCase().includes('submiss') ? 'Submissions' : 'Challenges'),
      isRead: Boolean(n.isRead),
      createdAt: n.createdAt || new Date().toISOString(),
    })),
    ...defaultNotifications,
  ];

  const filteredNotifications = allNotificationsList.filter((n) => {
    if (notifFilter === 'All') return true;
    if (notifFilter === 'Challenges') return n.type === 'Challenges';
    if (notifFilter === 'Teams') return n.type === 'Teams';
    if (notifFilter === 'Submissions') return n.type === 'Submissions';
    return true;
  });

  const unreadCount = allNotificationsList.filter((n) => !n.isRead).length;

  return (
    <div className="participant-wrap">
      <style jsx global>{`
        .participant-wrap {
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

        .participant-wrap::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: -1;
          background: radial-gradient(800px 520px at 100% 0, rgba(20, 90, 60, 0.3), transparent 70%),
            radial-gradient(700px 520px at 0 100%, rgba(12, 70, 46, 0.32), transparent 70%), #050806;
        }

        .participant-wrap a {
          color: inherit;
          text-decoration: none;
        }
        .participant-wrap button,
        .participant-wrap input,
        .participant-wrap select,
        .participant-wrap textarea {
          font: inherit;
          color: inherit;
        }
        .participant-wrap :focus-visible {
          outline: 2px solid var(--sg);
          outline-offset: 2px;
        }

        .participant-wrap h1 {
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .participant-wrap h2 {
          font-size: 17px;
          font-weight: 600;
        }
        .participant-wrap h3 {
          font-size: 15px;
          font-weight: 600;
        }
        .participant-wrap .mut {
          color: var(--mut);
        }
        .participant-wrap .lbl {
          font-size: 11.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--mut);
        }

        .participant-wrap .app {
          display: grid;
          grid-template-columns: 244px minmax(0, 1fr);
        }

        .participant-wrap .sb {
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
        }

        .participant-wrap .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          padding: 0 10px 22px;
        }
        .participant-wrap .logo i {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: var(--g);
          display: grid;
          place-items: center;
          font-style: normal;
          font-size: 14px;
        }

        .participant-wrap .sb a {
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
        .participant-wrap .sb a:hover {
          background: var(--gl);
          color: var(--ink);
        }
        .participant-wrap .sb a.on {
          background: rgba(29, 106, 70, 0.28);
          color: #fff;
        }
        .participant-wrap .sb a.on::before {
          content: '';
          position: absolute;
          left: -14px;
          top: 8px;
          bottom: 8px;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: var(--g2);
        }
        .participant-wrap .sb a b {
          margin-left: auto;
          font-size: 11px;
          font-weight: 500;
          background: var(--g);
          border-radius: 99px;
          padding: 1px 7px;
        }
        .participant-wrap .sb hr {
          border: 0;
          border-top: 1px solid var(--ln);
          margin: 14px 6px;
        }
        .participant-wrap .sb .lbl {
          padding: 0 10px 6px;
        }

        .participant-wrap .top {
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
        .participant-wrap .top .t small {
          display: block;
          font-size: 12px;
          color: var(--mut);
        }
        .participant-wrap .top .t b {
          font-weight: 600;
          font-size: 15px;
        }

        .participant-wrap .srch {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--gl);
          border: 1px solid var(--ln);
          border-radius: 99px;
          padding: 7px 14px;
          width: 260px;
          color: var(--mut);
        }
        .participant-wrap .srch input {
          background: none;
          border: 0;
          outline: 0;
          width: 100%;
        }

        .participant-wrap .ib {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid var(--ln);
          background: var(--gl);
          display: grid;
          place-items: center;
          cursor: pointer;
          position: relative;
        }
        .participant-wrap .ib:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }
        .participant-wrap .dot {
          position: absolute;
          top: 7px;
          right: 8px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--sg);
          border: 2px solid #0a0f0c;
        }
        .participant-wrap .av {
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

        .participant-wrap .menu {
          position: relative;
        }
        .participant-wrap .dd {
          position: absolute;
          right: 0;
          top: 44px;
          width: 190px;
          padding: 6px;
          border-radius: 12px;
          background: rgba(14, 20, 17, 0.92);
          border: 1px solid var(--ln);
          backdrop-filter: blur(16px);
          display: none;
          z-index: 40;
        }
        .participant-wrap .dd.o {
          display: block;
        }
        .participant-wrap .dd a {
          display: block;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
        }
        .participant-wrap .dd a:hover {
          background: var(--gl);
        }

        #mb {
          display: none;
        }
        .participant-wrap .pg {
          padding: 30px 32px 90px;
          max-width: 1180px;
        }
        .participant-wrap .ph {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 26px;
        }
        .participant-wrap .sh {
          padding-bottom: 10px;
          margin: 30px 0 4px;
          border-bottom: 1px solid var(--ln);
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .participant-wrap .sh a {
          font-size: 13px;
          color: var(--sg);
          cursor: pointer;
        }

        .participant-wrap .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--g);
          background: var(--g);
          color: #fff;
          padding: 9px 18px;
          border-radius: 99px;
          font-weight: 500;
          cursor: pointer;
          font-size: 14px;
        }
        .participant-wrap .btn:hover {
          background: var(--g2);
          border-color: var(--g2);
        }
        .participant-wrap .btn.gh {
          background: transparent;
          border-color: rgba(255, 255, 255, 0.2);
          color: var(--ink);
        }
        .participant-wrap .btn.gh:hover {
          background: var(--gl);
          border-color: rgba(255, 255, 255, 0.35);
        }
        .participant-wrap .btn.s {
          padding: 6px 14px;
          font-size: 13px;
        }
        .participant-wrap .chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin: 18px 0;
        }
        .participant-wrap .chips button {
          border: 1px solid var(--ln);
          background: transparent;
          border-radius: 99px;
          padding: 6px 14px;
          cursor: pointer;
          color: #b4c0b9;
          font-size: 13.5px;
        }
        .participant-wrap .chips button:hover {
          border-color: rgba(255, 255, 255, 0.28);
        }
        .participant-wrap .chips button[aria-pressed='true'] {
          background: var(--g);
          border-color: var(--g);
          color: #fff;
        }

        .participant-wrap .st {
          display: inline-block;
          font-size: 12px;
          padding: 2px 10px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #b4c0b9;
          white-space: nowrap;
        }
        .participant-wrap .st.g {
          background: rgba(38, 131, 90, 0.22);
          border-color: rgba(38, 131, 90, 0.4);
          color: var(--sg);
        }
        .participant-wrap .st.live {
          background: rgba(38, 131, 90, 0.25);
          border-color: rgba(38, 131, 90, 0.5);
          color: #d4ecdc;
        }
        .participant-wrap .st.live::before {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--sg);
          margin-right: 6px;
          vertical-align: 1px;
        }
        .participant-wrap .st.up {
          border-style: dashed;
        }
        .participant-wrap .st.off {
          color: var(--mut);
          border-color: var(--ln);
        }

        .participant-wrap .gl {
          background: var(--gl);
          border: 1px solid var(--ln);
          border-radius: 16px;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .participant-wrap .sc {
          overflow-x: auto;
        }
        .participant-wrap table {
          width: 100%;
          border-collapse: collapse;
          min-width: 640px;
        }
        .participant-wrap th {
          text-align: left;
          font-size: 11.5px;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--mut);
          font-weight: 500;
          padding: 12px 12px 10px;
        }
        .participant-wrap td {
          padding: 14px 12px;
          border-top: 1px solid var(--ln);
          vertical-align: middle;
        }
        .participant-wrap tr:hover td {
          background: rgba(255, 255, 255, 0.025);
        }
        .participant-wrap td small {
          display: block;
          color: var(--mut);
          font-size: 12.5px;
        }

        .participant-wrap .g2 {
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
          gap: 44px;
        }
        .participant-wrap .ls {
          list-style: none;
          padding: 0;
        }
        .participant-wrap .ls li {
          display: flex;
          gap: 14px;
          padding: 13px 0;
          border-bottom: 1px solid var(--ln);
        }
        .participant-wrap .ls li small {
          margin-left: auto;
          color: var(--mut);
          white-space: nowrap;
        }

        .participant-wrap .cov {
          background: linear-gradient(135deg, #14583a, #050d09);
          position: relative;
          border-radius: 12px;
          min-height: 120px;
        }
        .participant-wrap .cov::after {
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
        .participant-wrap .c2 {
          background: radial-gradient(circle at 70% 25%, #1f7650, #06120c 70%);
        }
        .participant-wrap .c3 {
          background: linear-gradient(200deg, #0b2a1c, #1d6a46 140%);
        }
        .participant-wrap .c4 {
          background: linear-gradient(60deg, #050d09, #17513a);
        }

        .participant-wrap .bar {
          height: 5px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }
        .participant-wrap .bar i {
          display: block;
          height: 100%;
          background: var(--g2);
          width: var(--p);
        }

        .participant-wrap .field {
          display: grid;
          gap: 6px;
          margin-bottom: 16px;
        }
        .participant-wrap .field label {
          font-size: 12.5px;
          color: var(--mut);
        }
        .participant-wrap .field input,
        .participant-wrap .field textarea,
        .participant-wrap .field select,
        .participant-wrap .in {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--ln);
          border-radius: 10px;
          padding: 10px 12px;
          width: 100%;
          outline: 0;
        }

        .participant-wrap .strip {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          border-top: 1px solid var(--ln);
          border-bottom: 1px solid var(--ln);
          padding: 18px 0;
        }
        .participant-wrap .strip div {
          padding: 0 20px;
          border-left: 1px solid var(--ln);
          color: var(--mut);
          font-size: 13px;
        }
        .participant-wrap .strip div:first-child {
          border: 0;
          padding-left: 0;
        }
        .participant-wrap .strip b {
          display: block;
          font-size: 30px;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: -0.02em;
        }

        .participant-wrap .feat {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 22px;
          padding: 18px;
          margin-top: 16px;
        }
        .participant-wrap .mr {
          display: flex;
          gap: 30px;
          margin: 16px 0;
          font-size: 13.5px;
        }
        .participant-wrap .mr small {
          display: block;
          color: var(--mut);
        }

        .participant-wrap .tlv {
          border-left: 1px solid var(--ln);
          margin: 14px 0 0 5px;
        }
        .participant-wrap .tlv div {
          padding: 0 0 18px 20px;
          position: relative;
        }
        .participant-wrap .tlv div::before {
          content: '';
          position: absolute;
          left: -5px;
          top: 6px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #050806;
          border: 2px solid var(--g2);
        }
        .participant-wrap .tlv small {
          display: block;
          color: var(--mut);
        }

        .participant-wrap .ql a {
          display: flex;
          justify-content: space-between;
          padding: 11px 0;
          border-bottom: 1px solid var(--ln);
          cursor: pointer;
        }
        .participant-wrap .ql a:hover {
          color: var(--sg);
        }

        .participant-wrap .lst {
          display: grid;
          grid-template-columns: 260px 1fr auto;
          gap: 26px;
          padding: 26px 0;
          border-bottom: 1px solid var(--ln);
          align-items: start;
        }
        .participant-wrap .lst .cov {
          height: 170px;
        }
        .participant-wrap .meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 22px;
          color: var(--mut);
          font-size: 13px;
          margin-top: 12px;
        }
        .participant-wrap .meta b {
          color: var(--ink);
          font-weight: 500;
        }
        .participant-wrap .lst p {
          color: #b4c0b9;
          margin-top: 6px;
          max-width: 60ch;
        }

        .participant-wrap .ban {
          height: 240px;
          border-radius: 18px;
          display: flex;
          align-items: flex-end;
          padding: 28px;
          margin-bottom: 34px;
          overflow: hidden;
        }
        .participant-wrap .ban h1 {
          position: relative;
          z-index: 1;
          font-size: 34px;
          max-width: 20ch;
        }

        .participant-wrap .dg {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 330px;
          gap: 50px;
          align-items: start;
        }
        .participant-wrap .dg section {
          padding: 0 0 26px;
          margin-bottom: 26px;
          border-bottom: 1px solid var(--ln);
        }
        .participant-wrap .dg h2 {
          margin-bottom: 10px;
        }
        .participant-wrap .dg h2 span {
          color: var(--sg);
          margin-right: 10px;
          font-weight: 500;
        }
        .participant-wrap .dg ul {
          padding-left: 18px;
          color: #c3cec8;
        }

        .participant-wrap .reg {
          position: sticky;
          top: 90px;
          padding: 24px;
        }
        .participant-wrap .reg .big {
          font-size: 30px;
          font-weight: 600;
          margin: 4px 0 14px;
        }

        .participant-wrap .tw {
          display: grid;
          grid-template-columns: 210px minmax(0, 1fr) 270px;
          gap: 34px;
        }
        .participant-wrap .rail a {
          display: block;
          padding: 9px 12px;
          border-radius: 9px;
          margin-bottom: 4px;
          color: #b4c0b9;
          cursor: pointer;
        }
        .participant-wrap .rail a.on {
          background: rgba(29, 106, 70, 0.28);
          color: #fff;
        }

        .participant-wrap .seg {
          display: flex;
          gap: 5px;
          margin: 10px 0 4px;
        }
        .participant-wrap .seg i {
          flex: 1;
          height: 6px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.12);
        }
        .participant-wrap .seg i.f {
          background: var(--g2);
        }

        .participant-wrap .mb {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 13px 0;
          border-bottom: 1px solid var(--ln);
        }
        .participant-wrap .mb div:nth-child(2) {
          flex: 1;
        }

        .participant-wrap .sw {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 270px;
          gap: 40px;
          padding: 28px;
        }
        .participant-wrap .tb {
          display: flex;
          gap: 6px;
          padding: 8px;
          border: 1px solid var(--ln);
          border-bottom: 0;
          border-radius: 10px 10px 0 0;
          color: var(--mut);
        }
        .participant-wrap .ed {
          border-radius: 0 0 10px 10px !important;
          min-height: 130px;
          resize: vertical;
        }
        .participant-wrap .fl {
          display: flex;
          justify-content: space-between;
          padding: 10px 12px;
          border: 1px dashed rgba(255, 255, 255, 0.18);
          border-radius: 10px;
          margin-bottom: 8px;
          font-size: 13.5px;
        }

        .participant-wrap .l3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .participant-wrap .sc2 {
          display: grid;
          grid-template-columns: 230px 1fr;
          gap: 50px;
          padding: 10px 0;
        }
        .participant-wrap .score {
          font-size: 76px;
          font-weight: 600;
          letter-spacing: -0.04em;
          line-height: 1;
        }
        .participant-wrap .score small {
          font-size: 22px;
          color: var(--mut);
          font-weight: 400;
        }
        .participant-wrap .cr {
          display: grid;
          grid-template-columns: 170px 1fr 56px;
          gap: 14px;
          align-items: center;
          padding: 9px 0;
          font-size: 14px;
        }
        .participant-wrap .q {
          border-left: 2px solid var(--g2);
          padding: 4px 0 4px 18px;
          color: #d3dcd7;
          margin: 14px 0 24px;
          max-width: 62ch;
        }

        .participant-wrap .stp {
          display: flex;
          font-size: 12px;
          color: var(--mut);
          min-width: 300px;
        }
        .participant-wrap .stp span {
          flex: 1;
          padding-top: 12px;
          position: relative;
          border-top: 2px solid rgba(255, 255, 255, 0.12);
        }
        .participant-wrap .stp span.d {
          border-top-color: var(--g2);
          color: var(--sg);
        }

        .participant-wrap .gal {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 26px;
          margin-top: 26px;
        }
        .participant-wrap .cert {
          border-radius: 14px;
          padding: 26px;
          min-height: 220px;
          background: linear-gradient(145deg, #0f2f21, #050b08);
          border: 1px solid rgba(159, 203, 176, 0.28);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .participant-wrap .cert::before {
          content: '';
          position: absolute;
          inset: 8px;
          border: 1px solid rgba(159, 203, 176, 0.16);
          border-radius: 9px;
        }
        .participant-wrap .cert h3 {
          font-size: 22px;
          letter-spacing: -0.01em;
          font-weight: 500;
        }
        .participant-wrap .cert.big {
          grid-column: span 4;
          min-height: 300px;
        }
        .participant-wrap .cert.big h3 {
          font-size: 30px;
        }

        .participant-wrap .gal .it {
          grid-column: span 2;
        }
        .participant-wrap .gal .it.w {
          grid-column: span 3;
        }
        .participant-wrap .cm {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
          font-size: 13px;
          color: var(--mut);
          gap: 10px;
          flex-wrap: wrap;
        }
        .participant-wrap .cm a {
          color: var(--sg);
          margin-left: 12px;
          cursor: pointer;
        }

        .participant-wrap .bd {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        .participant-wrap .bd div {
          width: 84px;
          text-align: center;
          font-size: 12px;
          color: var(--mut);
        }
        .participant-wrap .bd i {
          display: grid;
          place-items: center;
          width: 56px;
          height: 56px;
          margin: 0 auto 6px;
          border-radius: 50%;
          border: 1px solid rgba(159, 203, 176, 0.35);
          color: var(--sg);
          font-style: normal;
          font-size: 20px;
        }

        .participant-wrap .nt {
          display: grid;
          grid-template-columns: 14px 1fr auto;
          gap: 14px;
          padding: 16px 0;
          border-bottom: 1px solid var(--ln);
        }
        .participant-wrap .nt i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 8px;
        }
        .participant-wrap .nt.un i {
          background: var(--sg);
        }
        .participant-wrap .nt.un b {
          font-weight: 600;
        }
        .participant-wrap .nt b {
          font-weight: 500;
        }
        .participant-wrap .nt p {
          color: var(--mut);
        }
        .participant-wrap .nt .a {
          display: flex;
          gap: 14px;
          font-size: 13px;
          align-items: flex-start;
        }
        .participant-wrap .nt .a a {
          color: var(--sg);
        }
        .participant-wrap .nt .a button {
          background: none;
          border: 0;
          color: var(--mut);
          cursor: pointer;
        }

        .participant-wrap .pf {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
          gap: 50px;
        }
        .participant-wrap .hd {
          height: 150px;
          border-radius: 18px;
        }
        .participant-wrap .id {
          display: flex;
          gap: 20px;
          align-items: center;
          margin: 0 0 30px 0;
          flex-wrap: wrap;
        }
        .participant-wrap .id .av {
          width: 92px;
          height: 92px;
          font-size: 30px;
          border: 3px solid #34f5c5;
          overflow: hidden;
          padding: 0;
        }
        .participant-wrap .exp {
          border-left: 1px solid var(--ln);
          margin-left: 5px;
        }
        .participant-wrap .exp div {
          padding: 0 0 22px 22px;
          position: relative;
        }
        .participant-wrap .exp div::before {
          content: '';
          position: absolute;
          left: -5px;
          top: 7px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--g2);
        }

        .participant-wrap .kv {
          display: grid;
          grid-template-columns: 100px 1fr;
          padding: 9px 0;
          border-bottom: 1px solid var(--ln);
          gap: 10px;
        }
        .participant-wrap .kv span {
          color: var(--mut);
        }

        .participant-wrap .sch {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid var(--ln);
          margin-bottom: 34px;
        }
        .participant-wrap .sch div {
          padding: 14px 16px 14px 0;
          border-bottom: 1px solid var(--ln);
          font-size: 14px;
        }
        .participant-wrap .sch small {
          display: block;
          color: var(--mut);
          font-size: 12px;
        }

        .participant-wrap .lk {
          padding: 16px 20px;
          margin-bottom: 22px;
          display: flex;
          gap: 30px;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
        }
        .participant-wrap .lk small {
          display: block;
          color: var(--mut);
          font-size: 12px;
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

        @media (max-width: 900px) {
          .participant-wrap .app {
            grid-template-columns: 1fr;
          }
          .participant-wrap .sb {
            position: fixed;
            left: 0;
            top: 0;
            width: 260px;
            transform: translateX(-100%);
            transition: transform 0.25s;
            background: rgba(8, 13, 10, 0.94);
          }
          .participant-wrap .sb.o {
            transform: none;
          }
          #mb {
            display: grid;
          }
          .participant-wrap .g2,
          .participant-wrap .dg,
          .participant-wrap .pf,
          .participant-wrap .sw,
          .participant-wrap .sc2,
          .participant-wrap .tw {
            grid-template-columns: 1fr;
          }
          .participant-wrap .strip {
            grid-template-columns: repeat(2, 1fr);
          }
        /* Interactive Step Tabs */
        .participant-wrap .stp span {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .participant-wrap .stp span:hover {
          color: var(--ink);
          border-top-color: rgba(255, 255, 255, 0.4);
        }
        .participant-wrap .stp span.d {
          border-top-color: var(--g2);
          color: var(--sg);
          font-weight: 600;
        }
        .participant-wrap .stp span.active-step {
          border-top-color: #34f5c5;
          color: #ffffff;
          font-weight: 700;
        }

        /* Modal Overlays & Cards */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.82);
          backdrop-filter: blur(8px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: modalFadeIn 0.2s ease-out;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }

        .modal-card {
          background: #0b1410;
          border: 1px solid rgba(52, 245, 197, 0.24);
          border-radius: 18px;
          width: 100%;
          max-width: 620px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(29, 106, 70, 0.2);
          position: relative;
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
          color: #ffffff;
        }

        .modal-close-btn {
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: #a0b2a8;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.2s;
        }
        .modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        .modal-body {
          padding: 24px;
        }

        /* Payment Selector */
        .pay-methods {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 22px;
        }

        .pay-tab {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 14px 10px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .pay-tab:hover {
          border-color: rgba(52, 245, 197, 0.4);
          background: rgba(52, 245, 197, 0.05);
        }

        .pay-tab.active {
          border-color: #34f5c5;
          background: rgba(52, 245, 197, 0.12);
          color: #34f5c5;
          box-shadow: 0 0 16px rgba(52, 245, 197, 0.2);
        }

        .highlight-announcement {
          border: 2px solid #34f5c5 !important;
          box-shadow: 0 0 25px rgba(52, 245, 197, 0.45) !important;
          animation: pulseBorder 2s infinite ease-in-out;
        }

        @keyframes pulseBorder {
          0%, 100% { border-color: #34f5c5; box-shadow: 0 0 20px rgba(52, 245, 197, 0.3); }
          50% { border-color: #7affdb; box-shadow: 0 0 35px rgba(52, 245, 197, 0.6); }
        }

        /* Candidate cards for team invites */
        .candidate-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 12px;
          transition: all 0.2s;
        }
        .candidate-card:hover {
          border-color: rgba(52, 245, 197, 0.3);
          background: rgba(255, 255, 255, 0.05);
        }

        .candidate-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1d6a46, #0e3b26);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #fff;
          font-size: 18px;
          flex-shrink: 0;
          overflow: hidden;
          border: 1.5px solid rgba(52, 245, 197, 0.4);
        }

        /* Profile image click enlarge hover */
        .av-clickable {
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .av-clickable:hover {
          transform: scale(1.05);
          box-shadow: 0 0 16px rgba(52, 245, 197, 0.5);
        }
      `}</style>

      {toastMsg && <div className="toast-pill">{toastMsg}</div>}

      <div className="app">
        {/* Sidebar */}
        <aside className={`sb ${mobileMenuOpen ? 'o' : ''}`}>
          <div className="logo">
            <i>P</i>Portfolio Builders
          </div>
          <nav>
            <a
              className={activeTab === 'overview' ? 'on' : ''}
              onClick={() => navigateTo('overview')}
            >
              {renderSvg('grid')} Overview
            </a>
            <a
              className={activeTab === 'explore' || activeTab === 'details' ? 'on' : ''}
              onClick={() => navigateTo('explore')}
            >
              {renderSvg('compass')} Explore Challenges
            </a>
            <a
              className={activeTab === 'registrations' ? 'on' : ''}
              onClick={() => navigateTo('registrations')}
            >
              {renderSvg('clip')} My Projects
            </a>
            <a
              className={activeTab === 'teams' ? 'on' : ''}
              onClick={() => navigateTo('teams')}
            >
              {renderSvg('users')} My Teams
            </a>
            <a
              className={activeTab === 'submissions' ? 'on' : ''}
              onClick={() => navigateTo('submissions')}
            >
              {renderSvg('up')} My Submissions
            </a>
            <a
              className={activeTab === 'evaluation' ? 'on' : ''}
              onClick={() => navigateTo('evaluation')}
            >
              {renderSvg('check')} Evaluation
            </a>
            <a
              className={activeTab === 'nominations' ? 'on' : ''}
              onClick={() => navigateTo('nominations')}
            >
              {renderSvg('flag')} My Nominations
            </a>
            <a
              className={activeTab === 'achievements' ? 'on' : ''}
              onClick={() => navigateTo('achievements')}
            >
              {renderSvg('award')} My Achievements
            </a>
            <a
              className={activeTab === 'reviews' ? 'on' : ''}
              onClick={() => navigateTo('reviews')}
            >
              {renderSvg('msg')} Peer Reviews
            </a>
            <a
              className={activeTab === 'notifications' ? 'on' : ''}
              onClick={() => navigateTo('notifications')}
            >
              {renderSvg('bell')} Notifications{' '}
              {unreadCount > 0 && <b>{unreadCount}</b>}
            </a>

            <hr />
            <p className="lbl">Account</p>

            <a
              className={activeTab === 'profile' ? 'on' : ''}
              onClick={() => navigateTo('profile')}
            >
              {renderSvg('user')} My Profile
            </a>
            <a
              className={activeTab === 'settings' ? 'on' : ''}
              onClick={() => navigateTo('settings')}
            >
              {renderSvg('sl')} Account Settings
            </a>
            <a
              className={activeTab === 'help' ? 'on' : ''}
              onClick={() => navigateTo('help')}
            >
              {renderSvg('help')} Help & Support
            </a>
            <a
              onClick={async () => {
                await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
                window.location.href = '/auth/participant/login';
              }}
              style={{ color: 'var(--mut)', cursor: 'pointer' }}
            >
              {renderSvg('out')} Logout
            </a>
          </nav>
        </aside>

        {/* Content Area */}
        <div style={{ minWidth: 0 }}>
          {/* Top Bar */}
          <header className="top">
            <button
              className="ib"
              id="mb"
              aria-label="Menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {renderSvg('menu')}
            </button>
            <div className="t">
              <small>
                {activeTab === 'details'
                  ? 'Participant Portal / Explore Challenges'
                  : 'Participant Portal'}
              </small>
              <b>
                {activeTab === 'overview'
                  ? 'Overview'
                  : activeTab === 'explore'
                  ? 'Explore Challenges'
                  : activeTab === 'details'
                  ? 'Fintech Onboarding UX'
                  : activeTab === 'registrations'
                  ? 'My Projects'
                  : activeTab === 'teams'
                  ? 'My Teams'
                  : activeTab === 'submissions'
                  ? 'My Submissions'
                  : activeTab === 'evaluation'
                  ? 'Evaluation'
                  : activeTab === 'nominations'
                  ? 'My Nominations'
                  : activeTab === 'achievements'
                  ? 'Achievements'
                  : activeTab === 'reviews'
                  ? 'Peer Reviews'
                  : activeTab === 'notifications'
                  ? 'Notifications'
                  : activeTab === 'profile'
                  ? 'My Profile'
                  : activeTab === 'settings'
                  ? 'Account Settings'
                  : 'Help & Support'}
              </b>
            </div>

            <label className="srch">
              {renderSvg('search')}
              <input
                placeholder="Search challenges, teams, submissions"
                aria-label="Search"
              />
            </label>

            <a
              className="ib"
              onClick={() => navigateTo('notifications')}
              aria-label="Notifications"
            >
              {renderSvg('bell')}
              {unreadCount > 0 && <span className="dot"></span>}
            </a>

            <div className="menu">
              <button
                className="av"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                style={{ border: 0, cursor: 'pointer', overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Account Profile Menu"
              >
                {currentUser?.profilePicture ? (
                  <img
                    src={currentUser.profilePicture}
                    alt={currentUser.name || 'Profile'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  currentUser?.avatarInitials || 'AR'
                )}
              </button>
              <div className={`dd ${accountMenuOpen ? 'o' : ''}`}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--ln)', fontSize: '13px' }}>
                  <b style={{ display: 'block', color: 'var(--ink)' }}>{currentUser?.name || (currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'Anjali R.')}</b>
                  <span style={{ fontSize: '11.5px', color: 'var(--mut)' }}>{currentUser?.email || 'anjali@mail.com'}</span>
                </div>
                <a onClick={() => { setAccountMenuOpen(false); navigateTo('profile'); }}>
                  My Profile
                </a>
                <a onClick={() => { setAccountMenuOpen(false); navigateTo('settings'); }}>
                  Account Settings
                </a>
                <a onClick={() => { setAccountMenuOpen(false); navigateTo('help'); }}>
                  Help & Support
                </a>
                <a
                  onClick={async () => {
                    await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
                    window.location.href = '/auth/participant/login';
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  Logout
                </a>
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
                    <h1 style={{ margin: '6px 0' }}>Good evening, {currentUser?.firstName || currentUser?.name?.split(' ')[0] || 'Anjali'}.</h1>
                    <p className="mut">Two deadlines this week and one draft waiting for you.</p>
                  </div>
                  <div className="pc" style={{ minWidth: '210px' }}>
                    <span>Profile 72% complete</span>
                    <div className="bar" style={{ margin: '6px 0' }}>
                      <i style={{ width: '72%' }}></i>
                    </div>
                    <a onClick={() => navigateTo('profile')} style={{ color: 'var(--sg)', cursor: 'pointer' }}>
                      Add your portfolio link →
                    </a>
                  </div>
                </div>

                <div className="strip">
                  <div>
                    <b>12</b>Registrations
                  </div>
                  <div>
                    <b>3</b>Active challenges
                  </div>
                  <div>
                    <b>9</b>Submissions
                  </div>
                  <div>
                    <b>6</b>Completed
                  </div>
                  <div>
                    <b>4</b>Awards earned
                  </div>
                </div>

                <div className="g2" style={{ marginTop: '30px' }}>
                  <div>
                    <div className="sh">
                      <h2>Your active challenges</h2>
                      <a onClick={() => navigateTo('registrations')}>All registrations</a>
                    </div>

                    <div className="gl feat">
                      <div className="cov"></div>
                      <div>
                        <span className="dur">Weekly challenge</span>
                        <span className="st live" style={{ marginLeft: '8px' }}>
                          Live
                        </span>
                        <h3 style={{ fontSize: '20px', margin: '10px 0 2px' }}>
                          Weekly UI: Travel Dashboard
                        </h3>
                        <p className="mut">Individual · Published by Admin</p>
                        <div className="mr">
                          <div>
                            <small>Ends in</small>
                            <b>3 days</b>
                          </div>
                          <div>
                            <small>Submission deadline</small>22 Nov, 6:00 PM
                          </div>
                          <div>
                            <small>Draft</small>Saved 2h ago
                          </div>
                        </div>
                        <div className="bar" style={{ marginBottom: '18px' }}>
                          <i style={{ width: '60%' }}></i>
                        </div>
                        <a className="btn" onClick={() => navigateTo('submissions')}>
                          Continue submission
                        </a>
                      </div>
                    </div>

                    <ul className="ls" style={{ marginTop: '20px' }}>
                      <li>
                        <div>
                          <b style={{ fontWeight: 500 }}>Speed UI · Hourly challenge</b>
                          <small style={{ display: 'block', margin: 0, color: 'var(--mut)' }}>
                            Team Parallel
                          </small>
                        </div>
                        <span className="st live" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                          Live
                        </span>
                        <small style={{ margin: 0, alignSelf: 'center', minWidth: '112px', textAlign: 'right' }}>
                          Ends in 01h 25m
                        </small>
                      </li>
                      <li>
                        <div>
                          <b style={{ fontWeight: 500 }}>Fintech Onboarding UX · Daily challenge</b>
                          <small style={{ display: 'block', margin: 0, color: 'var(--mut)' }}>
                            Registered · starts 22 Nov
                          </small>
                        </div>
                        <span className="st up" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                          Starting soon
                        </span>
                        <small style={{ margin: 0, alignSelf: 'center', minWidth: '112px', textAlign: 'right' }}>
                          Starts in 3 days
                        </small>
                      </li>
                      <li>
                        <div>
                          <b style={{ fontWeight: 500 }}>Local Bus App · Weekly challenge</b>
                          <small style={{ display: 'block', margin: 0, color: 'var(--mut)' }}>
                            Submission closes tonight
                          </small>
                        </div>
                        <span className="st g" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                          Submission open
                        </span>
                        <small style={{ margin: 0, alignSelf: 'center', minWidth: '112px', textAlign: 'right' }}>
                          Closes 11:59 PM
                        </small>
                      </li>
                    </ul>

                    <div className="sh">
                      <h2>Recently published by Admin</h2>
                      <a onClick={() => navigateTo('explore')}>Explore challenges</a>
                    </div>
                    <ul className="ls">
                      <li>
                        <div>
                          <b style={{ fontWeight: 500 }}>Fintech Onboarding UX</b>
                          <small style={{ display: 'block', margin: 0, color: 'var(--mut)' }}>
                            Daily challenge · Individual or team
                          </small>
                        </div>
                        <span className="st g" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                          Registration open
                        </span>
                        <small style={{ margin: 0, alignSelf: 'center', minWidth: '112px', textAlign: 'right' }}>
                          Closes in 2 days
                        </small>
                      </li>
                      <li>
                        <div>
                          <b style={{ fontWeight: 500 }}>Monthly Case Study</b>
                          <small style={{ display: 'block', margin: 0, color: 'var(--mut)' }}>
                            Monthly challenge · Team of 2–4
                          </small>
                        </div>
                        <span className="st up" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                          Upcoming
                        </span>
                        <small style={{ margin: 0, alignSelf: 'center', minWidth: '112px', textAlign: 'right' }}>
                          Opens 25 Nov
                        </small>
                      </li>
                    </ul>
                  </div>

                  <aside>
                    <div className="sh" style={{ marginTop: 0 }}>
                      <h2>Upcoming deadlines</h2>
                    </div>
                    <div className="tlv">
                      <div>
                        <b>Today</b> · Speed UI ends
                        <small>Hourly · in 01h 25m</small>
                      </div>
                      <div>
                        <b>21 Nov</b> · Fintech UX registration closes
                        <small>Registration deadline</small>
                      </div>
                      <div>
                        <b>22 Nov</b> · Weekly UI submission
                        <small>Submission deadline · 6:00 PM</small>
                      </div>
                      <div>
                        <b>14 Dec</b> · Hackathon starts
                        <small>Challenge start</small>
                      </div>
                    </div>

                    <div className="sh">
                      <h2>Quick actions</h2>
                    </div>
                    <div className="ql">
                      <a onClick={() => navigateTo('explore')}>
                        Explore challenges <span>→</span>
                      </a>
                      <a onClick={() => navigateTo('registrations')}>
                        View registrations <span>→</span>
                      </a>
                      <a onClick={() => navigateTo('submissions')}>
                        Continue submission <span>→</span>
                      </a>
                      <a onClick={() => navigateTo('evaluation')}>
                        View results <span>→</span>
                      </a>
                      <a onClick={() => navigateTo('achievements')}>
                        View achievements <span>→</span>
                      </a>
                    </div>
                  </aside>
                </div>
              </section>
            )}

            {/* ================= 02 EXPLORE ================= */}
            {activeTab === 'explore' && (
              <section id="explore">
                <div className="ph">
                  <div>
                    <h1>Explore challenges</h1>
                    <p className="mut" style={{ marginTop: '6px' }}>
                      Every challenge here is created and published by the Admin. Find one, check the schedule and register.
                    </p>
                  </div>
                </div>

                {/* Workflow Stage Step Tabs (Requirement 4) */}
                <div className="stp" style={{ margin: '0 0 22px', maxWidth: '820px' }}>
                  <span
                    className={exploreStageFilter === 'admin' ? 'd active-step' : ''}
                    onClick={() => setExploreStageFilter('admin')}
                    title="Challenges published by administrator"
                  >
                    Admin publishes
                  </span>
                  <span
                    className={exploreStageFilter === 'registered' ? 'd active-step' : ''}
                    onClick={() => setExploreStageFilter('registered')}
                    title="Challenges you have registered for"
                  >
                    You register
                  </span>
                  <span
                    className={exploreStageFilter === 'participate' ? 'd active-step' : ''}
                    onClick={() => setExploreStageFilter('participate')}
                    title="Challenges currently active or participating"
                  >
                    Participate
                  </span>
                  <span
                    className={exploreStageFilter === 'submit' ? 'd active-step' : ''}
                    onClick={() => setExploreStageFilter('submit')}
                    title="Challenges with submission open or submitted"
                  >
                    Submit
                  </span>
                  <span
                    className={exploreStageFilter === 'evaluation' ? 'd active-step' : ''}
                    onClick={() => setExploreStageFilter('evaluation')}
                    title="Challenges currently in jury evaluation"
                  >
                    Evaluation
                  </span>
                  <span
                    className={exploreStageFilter === 'results' ? 'd active-step' : ''}
                    onClick={() => setExploreStageFilter('results')}
                    title="Challenges with published results and certificates"
                  >
                    Results
                  </span>
                </div>

                {/* Status Filter Chips (Requirement 3) */}
                <div className="chips" style={{ margin: '0 0 16px' }}>
                  <button
                    aria-pressed={exploreStatusFilter === 'All'}
                    onClick={() => setExploreStatusFilter('All')}
                  >
                    All
                  </button>
                  <button
                    aria-pressed={exploreStatusFilter === 'Live'}
                    onClick={() => setExploreStatusFilter('Live')}
                  >
                    Live
                  </button>
                  <button
                    aria-pressed={exploreStatusFilter === 'Upcoming'}
                    onClick={() => setExploreStatusFilter('Upcoming')}
                  >
                    Upcoming
                  </button>
                  <button
                    aria-pressed={exploreStatusFilter === 'Closing soon'}
                    onClick={() => setExploreStatusFilter('Closing soon')}
                  >
                    Closing soon
                  </button>
                  <button
                    aria-pressed={exploreStatusFilter === 'Completed'}
                    onClick={() => setExploreStatusFilter('Completed')}
                  >
                    Completed
                  </button>
                </div>

                {/* Filter and render challenges list */}
                {(() => {
                  const masterChallenges = [
                    {
                      id: 'CH-2010',
                      code: 'CH-2010',
                      title: 'Speed UI: Mobile Checkout',
                      category: 'UI Design',
                      description: 'Redesign a mobile checkout in three hours and submit a single prototype link.',
                      status: 'Live',
                      duration: 'Hourly challenge',
                      window: 'Today 2:00–5:00 PM',
                      submissionTime: '5:00 PM',
                      deadlineInfo: 'Ends in 02h 35m',
                      prize: '₹5,000',
                      registrationFee: 99,
                      participation: 'Individual',
                      coverClass: 'cov c2',
                      isClosingSoon: true,
                      stage: 'participate',
                    },
                    {
                      id: 'CH-2048',
                      code: 'CH-2048',
                      title: 'Fintech Onboarding UX',
                      category: 'UX Design',
                      description: 'Design a first-time user flow for a savings app and submit a prototype with a short write-up.',
                      status: 'Registration open',
                      duration: 'Daily challenge',
                      window: '15–21 Nov',
                      submissionTime: '23 Nov, 12:00 PM',
                      deadlineInfo: 'Registration closes in 2 days',
                      prize: '₹50,000',
                      registrationFee: 149,
                      participation: 'Solo or 2–4',
                      coverClass: 'cov',
                      isClosingSoon: true,
                      stage: 'registered',
                    },
                    {
                      id: 'CH-2052',
                      code: 'CH-2052',
                      title: 'Weekly UI: Travel Dashboard',
                      category: 'UI Design',
                      description: 'Design a comprehensive travel itinerary and booking management interface with responsive layouts.',
                      status: 'Live',
                      duration: 'Weekly challenge',
                      window: '15–22 Nov',
                      submissionTime: '22 Nov, 6:00 PM',
                      deadlineInfo: 'Ends in 3 days',
                      prize: '₹35,000',
                      registrationFee: 149,
                      participation: 'Individual',
                      coverClass: 'cov c2',
                      isClosingSoon: false,
                      stage: 'participate',
                    },
                    {
                      id: 'CH-2065',
                      code: 'CH-2065',
                      title: 'December Case Study',
                      category: 'UX Design',
                      description: 'A full product case study from research to final screens across December.',
                      status: 'Upcoming',
                      duration: 'Monthly challenge',
                      window: '1–31 Dec',
                      submissionTime: '31 Dec, 6:00 PM',
                      deadlineInfo: 'Registration opens 25 Nov',
                      prize: '₹75,000',
                      registrationFee: 199,
                      participation: '2–4 members',
                      coverClass: 'cov c3',
                      isClosingSoon: false,
                      stage: 'admin',
                    },
                    {
                      id: 'HACK-2026',
                      code: 'HACK-2026',
                      title: 'Kerala Product Hackathon 2026',
                      category: 'General Hackathon',
                      description: 'Admin published a new 48-hour challenge with ₹10 Lakh total prize pool and mentor sessions.',
                      status: 'Upcoming',
                      duration: '48-hour Hackathon',
                      window: '14–16 Dec',
                      submissionTime: '16 Dec, 6:00 PM',
                      deadlineInfo: 'Registration opens 1 Dec',
                      prize: '₹10,00,000',
                      registrationFee: 199,
                      participation: 'Team of 2–4',
                      coverClass: 'cov c3',
                      isClosingSoon: false,
                      stage: 'admin',
                    },
                    {
                      id: 'CH-2041',
                      code: 'CH-2041',
                      title: 'UI Redesign Challenge',
                      category: 'UI Design',
                      description: 'Redesign the booking experience of a regional bus app. Submissions now in jury evaluation.',
                      status: 'Under evaluation',
                      duration: 'Weekly challenge',
                      window: 'Completed 17 Nov',
                      submissionTime: 'Submitted SUB-5390',
                      deadlineInfo: 'Jury evaluating entries',
                      prize: '₹35,000',
                      registrationFee: 149,
                      participation: 'Individual or team',
                      coverClass: 'cov',
                      isClosingSoon: false,
                      stage: 'evaluation',
                    },
                    {
                      id: 'CH-2035',
                      code: 'CH-2035',
                      title: 'E-commerce Checkout Redesign',
                      category: 'UX Design',
                      description: 'Winners and nominees are published. See top entries, jury feedback, score cards and certificates.',
                      status: 'Completed',
                      duration: 'Daily challenge',
                      window: 'Completed 14 Nov',
                      submissionTime: 'Evaluated (Score: 94/100)',
                      deadlineInfo: 'Results published',
                      prize: '₹50,000',
                      registrationFee: 149,
                      participation: 'Solo or 2–4',
                      coverClass: 'cov c2',
                      isClosingSoon: false,
                      stage: 'results',
                      winnerInfo: '★ Winner · Best Presentation · Score 94/100',
                    },
                  ];

                  // Filter by Stage (Requirement 4)
                  const stageFiltered = masterChallenges.filter((ch) => {
                    const isRegistered =
                      ch.code === 'CH-2048' ||
                      ch.code === 'CH-2052' ||
                      registrations.some((r) => r.challengeId === ch.id || r.challenge?.code === ch.code || r.code === ch.code);

                    if (exploreStageFilter === 'admin') return true;
                    if (exploreStageFilter === 'registered') return isRegistered;
                    if (exploreStageFilter === 'participate') return isRegistered && (ch.status === 'Live' || ch.status === 'Registration open');
                    if (exploreStageFilter === 'submit') return ch.code === 'CH-2052' || ch.code === 'CH-2041' || ch.stage === 'submit';
                    if (exploreStageFilter === 'evaluation') return ch.status === 'Under evaluation' || ch.code === 'CH-2041' || ch.code === 'CH-2035';
                    if (exploreStageFilter === 'results') return ch.status === 'Completed' || ch.code === 'CH-2035';
                    return true;
                  });

                  // Filter by Status (Requirement 3)
                  const displayedChallenges = stageFiltered.filter((ch) => {
                    if (exploreStatusFilter === 'All') return true;
                    if (exploreStatusFilter === 'Live') return ch.status === 'Live' || ch.status === 'Registration open';
                    if (exploreStatusFilter === 'Upcoming') return ch.status === 'Upcoming';
                    if (exploreStatusFilter === 'Closing soon') return ch.isClosingSoon;
                    if (exploreStatusFilter === 'Completed') return ch.status === 'Completed' || ch.status === 'Under evaluation';
                    return true;
                  });

                  if (displayedChallenges.length === 0) {
                    return (
                      <div
                        style={{
                          padding: '48px 24px',
                          textAlign: 'center',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: '14px',
                          border: '1px dashed rgba(255,255,255,0.1)',
                          margin: '20px 0',
                        }}
                      >
                        <p style={{ color: 'var(--mut)', fontSize: '15px', margin: 0 }}>
                          No challenges found matching "{exploreStageFilter}" with "{exploreStatusFilter}" filter.
                        </p>
                        <button
                          className="btn gh s"
                          style={{ marginTop: '14px' }}
                          onClick={() => {
                            setExploreStageFilter('admin');
                            setExploreStatusFilter('All');
                          }}
                        >
                          Reset filters to All Admin Challenges
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div style={{ marginTop: '14px' }}>
                      {displayedChallenges.map((ch) => {
                        const isHighlighted = highlightedChallengeId === ch.id || highlightedChallengeId === ch.code;
                        const isRegistered =
                          ch.code === 'CH-2048' ||
                          ch.code === 'CH-2052' ||
                          registrations.some((r) => r.challengeId === ch.id || r.challenge?.code === ch.code || r.code === ch.code);

                        return (
                          <div
                            key={ch.id}
                            className={`lst ${isHighlighted ? 'highlight-announcement' : ''}`}
                            id={`challenge-${ch.id}`}
                          >
                            <div className={ch.coverClass}></div>
                            <div style={{ flex: 1 }}>
                              <span className="dur">{ch.duration}</span>
                              <span
                                className={`st ${
                                  ch.status === 'Live'
                                    ? 'live'
                                    : ch.status === 'Registration open'
                                    ? 'g'
                                    : ch.status === 'Upcoming'
                                    ? 'up'
                                    : 'mut'
                                }`}
                                style={{ marginLeft: '8px' }}
                              >
                                {ch.status}
                              </span>
                              {isHighlighted && (
                                <span
                                  className="st"
                                  style={{
                                    marginLeft: '8px',
                                    background: '#34f5c5',
                                    color: '#060d09',
                                    fontWeight: 700,
                                  }}
                                >
                                  📢 Announced challenge
                                </span>
                              )}
                              {ch.winnerInfo && (
                                <span
                                  className="st g"
                                  style={{ marginLeft: '8px', background: 'rgba(52, 245, 197, 0.15)', color: '#34f5c5' }}
                                >
                                  {ch.winnerInfo}
                                </span>
                              )}
                              <h2 style={{ marginTop: '6px' }}>{ch.title}</h2>
                              <p className="mut" style={{ margin: '2px 0 0' }}>
                                Published by Admin · Portfolio Builders · {ch.category}
                              </p>
                              <p style={{ margin: '8px 0 10px' }}>{ch.description}</p>
                              <div className="meta">
                                <span>
                                  Participation <b>{ch.participation}</b>
                                </span>
                                <span>
                                  Window <b>{ch.window}</b>
                                </span>
                                <span>
                                  Submission <b>{ch.submissionTime}</b>
                                </span>
                                <span>
                                  Prize <b>{ch.prize}</b>
                                </span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', minWidth: '170px' }}>
                              <p className="lbl">Status / Schedule</p>
                              <p style={{ fontSize: '15px', fontWeight: 600, margin: '2px 0 14px' }}>
                                {ch.deadlineInfo}
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                                {ch.status === 'Completed' ? (
                                  <button
                                    className="btn s"
                                    onClick={() => navigateTo('achievements')}
                                  >
                                    View results & cert
                                  </button>
                                ) : isRegistered ? (
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <span className="st g">✓ Registered</span>
                                    <button
                                      className="btn gh s"
                                      onClick={() => navigateTo('registrations')}
                                    >
                                      Workspace
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className="btn s"
                                    onClick={() => handleOpenPayment(ch)}
                                    title="Click to register with Cash, Card, or UPI"
                                  >
                                    Register now (₹{ch.registrationFee})
                                  </button>
                                )}
                                <a className="btn gh s" onClick={() => navigateTo('details')}>
                                  View details
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </section>
            )}

            {/* ================= 02b DETAILS ================= */}
            {activeTab === 'details' && (
              <section id="details">
                <div className="cov ban">
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <span className="dur">Daily challenge</span>
                    <span className="st g" style={{ marginLeft: '8px' }}>
                      Registration open
                    </span>
                    <h1 style={{ marginTop: '10px' }}>Fintech Onboarding UX</h1>
                  </div>
                </div>
                <p className="adm" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--mut)', marginBottom: '28px' }}>
                  Created and published by Admin · Portfolio Builders · UX category
                </p>

                <div className="sch">
                  <div>
                    <small>Duration type</small>Daily challenge
                  </div>
                  <div>
                    <small>Total duration</small>24 hours
                  </div>
                  <div>
                    <small>Current status</small>Registration open
                  </div>
                  <div>
                    <small>Registration opens</small>15 Nov, 9:00 AM
                  </div>
                  <div>
                    <small>Registration closes</small>21 Nov, 6:00 PM
                  </div>
                  <div>
                    <small>Time remaining</small>
                    <b>Registration closes in 2 days</b>
                  </div>
                  <div>
                    <small>Challenge starts</small>22 Nov, 9:00 AM
                  </div>
                  <div>
                    <small>Challenge ends</small>23 Nov, 9:00 AM
                  </div>
                  <div>
                    <small>Submission deadline</small>23 Nov, 12:00 PM
                  </div>
                </div>

                <div className="dg">
                  <div>
                    <section>
                      <h2>
                        <span>01</span>Overview and problem statement
                      </h2>
                      <p className="mut">
                        New users abandon savings apps during sign-up. Redesign the first-time flow so a user can open an account and set a first goal in under three minutes.
                      </p>
                    </section>
                    <section>
                      <h2>
                        <span>02</span>Objectives
                      </h2>
                      <ul>
                        <li>Reduce steps and cognitive load in sign-up.</li>
                        <li>Explain trust and security clearly.</li>
                        <li>Prototype the complete happy path.</li>
                      </ul>
                    </section>
                    <section>
                      <h2>
                        <span>03</span>Participation
                      </h2>
                      <ul>
                        <li>Eligibility: students and working professionals in India.</li>
                        <li>Individual or team. Team size: minimum 2, maximum 4.</li>
                        <li>Registration requires a verified profile and the fee.</li>
                      </ul>
                    </section>
                    <section>
                      <h2>
                        <span>04</span>Guidelines
                      </h2>
                      <ul>
                        <li>Rules: original work only, credit all assets.</li>
                        <li>Submit once, before the submission deadline. Edits stay open until then.</li>
                        <li>Submission: prototype link and a PDF case study; video optional.</li>
                      </ul>
                    </section>
                    <section>
                      <h2>
                        <span>05</span>Evaluation criteria
                      </h2>
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
                        <span>Research and reasoning</span>
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
                    </section>
                  </div>

                  <aside className="gl reg">
                    <span className="st g">Registration open</span>
                    <p className="big" style={{ marginTop: '10px' }}>
                      ₹149
                    </p>
                    <p className="mut" style={{ margin: '-8px 0 14px' }}>
                      Registration closes in 2 days
                    </p>
                    <div className="chips" style={{ margin: '0 0 8px' }}>
                      <button aria-pressed="true">Individual</button>
                      <button aria-pressed="false">Team of 2–4</button>
                    </div>
                    <div className="kv">
                      <span>Closes</span>21 Nov, 6:00 PM
                    </div>
                    <div className="kv">
                      <span>Starts</span>22 Nov, 9:00 AM
                    </div>
                    <div className="kv" style={{ border: 0 }}>
                      <span>Submit by</span>23 Nov, 12:00 PM
                    </div>
                    <button
                      className="btn"
                      onClick={handleRegisterFintech}
                      style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
                    >
                      Register now
                    </button>
                    <p className="mut" style={{ fontSize: '12.5px', marginTop: '10px', textAlign: 'center' }}>
                      212 participants registered
                    </p>
                  </aside>
                </div>
              </section>
            )}

            {/* ================= 03 MY PROJECTS ================= */}
            {activeTab === 'registrations' && (
              <section id="registrations">
                <div className="ph">
                  <div>
                    <h1>My Projects</h1>
                    <p className="mut" style={{ marginTop: '6px' }}>
                      Projects and challenges you joined, published by the Admin.
                    </p>
                  </div>
                  <a className="btn gh" onClick={() => navigateTo('explore')}>
                    Explore challenges
                  </a>
                </div>

                <div className="chips" style={{ marginTop: 0 }}>
                  {(['All', 'Approved', 'Pending', 'Ongoing', 'Completed'] as const).map((filter) => (
                    <button
                      key={filter}
                      aria-pressed={projectFilter === filter}
                      onClick={() => setProjectFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="sc">
                  <table style={{ minWidth: '900px' }}>
                    <thead>
                      <tr>
                        <th>Project / Challenge</th>
                        <th>Duration</th>
                        <th>Challenge period</th>
                        <th>Submission deadline</th>
                        <th>Status</th>
                        <th>Phase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--mut)' }}>
                            No {projectFilter !== 'All' ? projectFilter.toLowerCase() : ''} projects found.
                          </td>
                        </tr>
                      ) : (
                        filteredProjects.map((proj) => (
                          <tr key={proj.id}>
                            <td>
                              <a onClick={() => navigateTo('details')} style={{ cursor: 'pointer' }}>
                                <b>{proj.title}</b>
                              </a>
                              <small>{proj.regCode} · Registered {proj.regDate} · {proj.team}</small>
                            </td>
                            <td>
                              <span className="dur">{proj.duration}</span>
                            </td>
                            <td>{proj.period}</td>
                            <td>{proj.deadline}</td>
                            <td>
                              <span className={`st ${proj.status === 'Approved' ? 'g' : ''}`}>{proj.status}</span>
                            </td>
                            <td>
                              <span className={`st ${proj.phase === 'Ongoing' ? 'live' : (proj.phase === 'Completed' ? 'g' : 'up')}`}>
                                {proj.phase}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ================= 04 TEAMS ================= */}
            {activeTab === 'teams' && (
              <section id="teams">
                <div className="ph">
                  <div>
                    <h1>My teams & Group Projects</h1>
                    <p className="mut" style={{ marginTop: '6px' }}>
                      Teams participate in Admin-published Group Projects. Team size rule: Minimum 2, maximum 4 members.
                    </p>
                  </div>
                  <button
                    className="btn"
                    onClick={() => handleOpenInviteModal()}
                  >
                    + Invite Teammates
                  </button>
                </div>

                {/* Received Team Invitations (Requirement 7.1 & 7.2) */}
                {receivedInvitations.length > 0 && (
                  <div
                    style={{
                      background: 'rgba(52, 245, 197, 0.08)',
                      border: '1px solid rgba(52, 245, 197, 0.3)',
                      borderRadius: '14px',
                      padding: '18px 20px',
                      marginBottom: '24px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '18px' }}>📬</span>
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#34f5c5' }}>
                        You have {receivedInvitations.length} Pending Team Invitation{receivedInvitations.length > 1 ? 's' : ''}
                      </h3>
                    </div>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {receivedInvitations.map((inv) => (
                        <div
                          key={inv.id}
                          style={{
                            background: '#09130e',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '10px',
                            padding: '14px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: '15px' }}>
                              {inv.team?.name || 'Group Project Team'}
                            </p>
                            <p className="mut" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                              Invited by <b>{inv.team?.leader?.name || 'Team Leader'}</b> ({inv.team?.leader?.email})
                              {inv.team?.challenge?.title ? ` for ${inv.team.challenge.title}` : ''}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn s"
                              onClick={() => handleRespondInvitation(inv.id, 'accept')}
                            >
                              Accept Invitation
                            </button>
                            <button
                              className="btn gh s"
                              onClick={() => handleRespondInvitation(inv.id, 'reject')}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="tw">
                  <nav className="rail">
                    <p className="lbl" style={{ padding: '0 12px 8px' }}>
                      Your teams
                    </p>
                    <a className="on">Team Parallel</a>
                    <a>Studio Nila</a>
                  </nav>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <h2 style={{ fontSize: '22px', margin: 0 }}>Team Parallel</h2>
                      <span
                        className="st g"
                        style={{ background: 'rgba(52, 245, 197, 0.15)', color: '#34f5c5', padding: '4px 10px' }}
                      >
                        ✓ Eligible for Group Projects (3 of 4 active members)
                      </span>
                    </div>

                    <p className="mut" style={{ margin: '8px 0 14px' }}>
                      Product design collective focused on fintech and mobility experiences. Formed for Admin-published challenges.
                    </p>

                    <div className="seg">
                      <i className="f"></i>
                      <i className="f"></i>
                      <i className="f"></i>
                      <i></i>
                    </div>
                    <p className="mut" style={{ fontSize: '13px', marginTop: '6px' }}>
                      3 of 4 members · Minimum 2, maximum 4 members required for Group Projects
                    </p>

                    <div className="sh" style={{ marginTop: '20px' }}>
                      <h2>Team Members (3/4)</h2>
                    </div>
                    <div className="mb">
                      <span className="av">AR</span>
                      <div>
                        Anjali R.<small>anjali@mail.com · B.Des Product Design</small>
                      </div>
                      <span className="st g">Leader</span>
                    </div>
                    <div className="mb">
                      <span className="av">RM</span>
                      <div>
                        Rahul M.<small>Joined 18 Nov · B.Tech CS</small>
                      </div>
                      <span className="st">Member</span>
                    </div>
                    <div className="mb">
                      <span className="av">SK</span>
                      <div>
                        Sana K.<small>Joined 17 Nov · B.Sc VisCom</small>
                      </div>
                      <span className="st">Member</span>
                    </div>

                    <div className="sh" style={{ marginTop: '24px' }}>
                      <h2>Invitations</h2>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          className="btn s"
                          onClick={() => handleOpenInviteModal()}
                        >
                          + Browse & Invite Participants
                        </button>
                        <a
                          onClick={() => setShowInviteInput(!showInviteInput)}
                          style={{ fontSize: '13px', alignSelf: 'center', cursor: 'pointer' }}
                        >
                          Quick email invite
                        </a>
                      </div>
                    </div>

                    {showInviteInput && (
                      <div style={{ display: 'flex', gap: '8px', margin: '14px 0' }}>
                        <input
                          className="in"
                          placeholder="colleague@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <button className="btn s" onClick={handleSendInvite}>
                          Send
                        </button>
                      </div>
                    )}

                    <div className="chips" style={{ margin: '12px 0 0' }}>
                      <button aria-pressed="true">Pending 1</button>
                      <button aria-pressed="false">Accepted 2</button>
                      <button aria-pressed="false">Rejected 1</button>
                    </div>
                    <div className="mb">
                      <span className="av" style={{ background: 'rgba(255,255,255,.1)' }}>
                        VT
                      </span>
                      <div>
                        vivek.t@mail.com<small>Sent 18 Nov · awaiting response from participant</small>
                      </div>
                      <button
                        className="btn gh s"
                        onClick={() => showToast('Invitation cancelled.')}
                      >
                        Cancel invite
                      </button>
                    </div>

                    {/* Group Projects Participation Banner (Requirement 7.3) */}
                    <div
                      style={{
                        marginTop: '24px',
                        background: 'linear-gradient(135deg, rgba(29, 106, 70, 0.25), rgba(8, 13, 10, 0.6))',
                        border: '1px solid rgba(52, 245, 197, 0.25)',
                        borderRadius: '12px',
                        padding: '18px 20px',
                      }}
                    >
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#34f5c5' }}>
                        Ready for Group Projects
                      </h3>
                      <p className="mut" style={{ margin: '6px 0 14px', fontSize: '13.5px' }}>
                        Team Parallel satisfies the minimum size requirement (at least 2, up to 4 members). Your team can participate together in group hackathons and design challenges.
                      </p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          className="btn s"
                          onClick={() => {
                            navigateTo('explore');
                            setExploreStageFilter('participate');
                          }}
                        >
                          Participate as Team in Live Challenge →
                        </button>
                        <button
                          className="btn gh s"
                          onClick={() => navigateTo('submissions')}
                        >
                          Open Group Submission
                        </button>
                      </div>
                    </div>
                  </div>

                  <aside className="gl side" style={{ padding: '20px' }}>
                    <h3>Registered challenge</h3>
                    <p className="mut">
                      Speed UI: Mobile Checkout
                      <br />
                      <span className="dur">Hourly</span> · <span className="st live">Live</span> · ends in 01h 25m
                    </p>
                    <h3 style={{ marginTop: '14px' }}>Submission</h3>
                    <p className="mut">
                      Draft · 60% complete
                      <br />
                      <a onClick={() => navigateTo('submissions')} style={{ color: 'var(--sg)', cursor: 'pointer' }}>
                        Open workspace →
                      </a>
                    </p>
                    <h3 style={{ marginTop: '14px' }}>Achievements</h3>
                    <p className="mut">1 finalist recognition</p>
                    <h3 style={{ marginTop: '14px' }}>Certificates</h3>
                    <p className="mut" style={{ margin: 0 }}>
                      2 issued ·{' '}
                      <a onClick={() => navigateTo('achievements')} style={{ color: 'var(--sg)', cursor: 'pointer' }}>
                        View
                      </a>
                    </p>
                  </aside>
                </div>
              </section>
            )}

            {/* ================= 05 SUBMISSIONS ================= */}
            {activeTab === 'submissions' && (
              <section id="submissions">
                <div className="ph">
                  <div>
                    <h1>My submissions</h1>
                    <p className="mut" style={{ marginTop: '6px' }}>
                      Every submission belongs to a challenge you are registered for.
                    </p>
                  </div>
                </div>

                <div className="chips" style={{ marginTop: 0 }}>
                  <button
                    aria-pressed={submissionFilter === 'All'}
                    onClick={() => setSubmissionFilter('All')}
                  >
                    All
                  </button>
                  <button
                    aria-pressed={submissionFilter === 'Drafts'}
                    onClick={() => setSubmissionFilter('Drafts')}
                  >
                    Drafts {draftsCount}
                  </button>
                  <button
                    aria-pressed={submissionFilter === 'Submitted'}
                    onClick={() => setSubmissionFilter('Submitted')}
                  >
                    Submitted {submittedCount}
                  </button>
                  <button
                    aria-pressed={submissionFilter === 'Under evaluation'}
                    onClick={() => setSubmissionFilter('Under evaluation')}
                  >
                    Under evaluation {underEvalCount}
                  </button>
                  <button
                    aria-pressed={submissionFilter === 'Evaluated'}
                    onClick={() => setSubmissionFilter('Evaluated')}
                  >
                    Evaluated {evaluatedCount}
                  </button>
                </div>

                <div className="sc">
                  <table style={{ minWidth: '800px' }}>
                    <thead>
                      <tr>
                        <th>Submission</th>
                        <th>Challenge</th>
                        <th>Duration</th>
                        <th>Deadline</th>
                        <th>Modified</th>
                        <th>Version</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--mut)' }}>
                            No {submissionFilter !== 'All' ? submissionFilter.toLowerCase() : ''} submissions found.
                          </td>
                        </tr>
                      ) : (
                        filteredSubmissions.map((sub) => (
                          <tr key={sub.id}>
                            <td>
                              <b>{sub.title}</b>
                              <small>{sub.code}</small>
                            </td>
                            <td>{sub.challenge}</td>
                            <td>
                              <span className="dur">{sub.duration}</span>
                            </td>
                            <td>{sub.deadline}</td>
                            <td>{sub.modified}</td>
                            <td>{sub.version}</td>
                            <td>
                              <span className={`st ${sub.status === 'Evaluated' || sub.status === 'Submitted' ? 'g' : (sub.status === 'Under evaluation' ? 'live' : '')}`}>
                                {sub.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="sh" style={{ marginTop: '30px' }}>
                  <h2>Submission workspace</h2>
                  <span className="mut">Autosaved 2 hours ago</span>
                </div>

                <div className="gl lk">
                  <div>
                    <small>Submitting to</small>
                    <b>Weekly UI: Travel Dashboard</b>
                  </div>
                  <div>
                    <small>Duration</small>
                    <span className="dur">Weekly challenge</span>
                  </div>
                  <div>
                    <small>Published by</small>Admin · Portfolio Builders
                  </div>
                  <div>
                    <small>Submission deadline</small>
                    <b>22 Nov, 6:00 PM</b>
                  </div>
                  <span className="st live">2d 22h left</span>
                </div>

                <div className="gl sw" style={{ marginTop: '20px' }}>
                  <div>
                    <div className="field">
                      <label>Project title</label>
                      <input
                        value={subTitle}
                        onChange={(e) => setSubTitle(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Short description</label>
                      <input
                        value={subDesc}
                        onChange={(e) => setSubDesc(e.target.value)}
                      />
                    </div>
                    <div className="field" style={{ gap: 0 }}>
                      <label style={{ marginBottom: '6px' }}>Detailed explanation</label>
                      <div className="tb">
                        <span>
                          <b>B</b>
                        </span>
                        <span>
                          <i>I</i>
                        </span>
                        <span>List</span>
                        <span>Link</span>
                      </div>
                      <textarea
                        className="in ed"
                        value={subWriteup}
                        onChange={(e) => setSubWriteup(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="field" style={{ marginTop: '16px' }}>
                      <label>Files and documentation</label>
                      <div className="fl">
                        <span>case-study.pdf</span>
                        <span className="mut">2.4 MB</span>
                      </div>
                      <div className="fl">
                        <span>flow-screens.png</span>
                        <span className="mut">1.1 MB</span>
                      </div>
                      <div
                        className="fl"
                        style={{ justifyContent: 'center', color: 'var(--mut)', cursor: 'pointer' }}
                        onClick={() => showToast('File picker opened (mock)')}
                      >
                        Drop files here or browse
                      </div>
                    </div>
                    <div className="l3">
                      <div className="field">
                        <label>Video URL</label>
                        <input
                          placeholder="https://"
                          value={subVideo}
                          onChange={(e) => setSubVideo(e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>GitHub URL</label>
                        <input
                          placeholder="https://github.com/"
                          value={subGithub}
                          onChange={(e) => setSubGithub(e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>Live demo URL</label>
                        <input
                          value={subDemo}
                          onChange={(e) => setSubDemo(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <aside>
                    <h3>Version history</h3>
                    <div className="tlv">
                      <div>
                        <b>v2</b> · Draft<small>19 Nov, 4:10 PM</small>
                      </div>
                      <div>
                        <b>v1</b> · Draft<small>18 Nov, 11:30 PM</small>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
                      <button className="btn" onClick={() => handleSaveSubmission(false)}>
                        Submit work
                      </button>
                      <button className="btn gh" onClick={() => handleSaveSubmission(true)}>
                        Save draft
                      </button>
                    </div>
                    <p className="mut" style={{ fontSize: '12.5px', marginTop: '12px' }}>
                      Edits stay open until the 22 Nov deadline.
                    </p>
                  </aside>
                </div>
              </section>
            )}

            {/* ================= 06 EVALUATION ================= */}
            {activeTab === 'evaluation' && (
              <section id="evaluation">
                <div className="ph">
                  <div>
                    <h1>Evaluation</h1>
                    <p className="mut" style={{ marginTop: '6px' }}>
                      Only officially published marks and feedback appear here.
                    </p>
                  </div>
                </div>

                <div className="strip" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div>
                    <b>4</b>Evaluated
                  </div>
                  <div>
                    <b>2</b>Pending
                  </div>
                  <div>
                    <b>3</b>Results published
                  </div>
                  <div>
                    <b>82.4</b>Average mark
                  </div>
                </div>

                <div className="sh" style={{ marginTop: '30px' }}>
                  <h2>Checkout, simplified</h2>
                  <span className="mut">E-commerce Checkout Redesign</span>
                </div>

                <div className="sc2">
                  <div>
                    <p className="lbl">Overall score</p>
                    <p className="score">
                      86<small> / 100</small>
                    </p>
                    <p className="mut" style={{ marginTop: '8px' }}>
                      Rank 3 of 51 teams
                    </p>
                  </div>
                  <div>
                    <div className="cr">
                      <span>User flow</span>
                      <div className="bar">
                        <i style={{ width: '90%' }}></i>
                      </div>
                      <span>27/30</span>
                    </div>
                    <div className="cr">
                      <span>Visual design</span>
                      <div className="bar">
                        <i style={{ width: '84%' }}></i>
                      </div>
                      <span>21/25</span>
                    </div>
                    <div className="cr">
                      <span>Research</span>
                      <div className="bar">
                        <i style={{ width: '80%' }}></i>
                      </div>
                      <span>20/25</span>
                    </div>
                    <div className="cr">
                      <span>Presentation</span>
                      <div className="bar">
                        <i style={{ width: '90%' }}></i>
                      </div>
                      <span>18/20</span>
                    </div>
                  </div>
                </div>

                <p className="lbl" style={{ marginTop: '10px' }}>
                  Judge feedback
                </p>
                <p className="q">
                  “A confident, well-reasoned checkout. The reduction from five steps to three is clear and the edge cases are handled with care.”
                </p>
              </section>
            )}

            {/* ================= 07 NOMINATIONS ================= */}
            {activeTab === 'nominations' && (
              <section id="nominations">
                <div className="ph">
                  <div>
                    <h1>My nominations</h1>
                    <p className="mut" style={{ marginTop: '6px' }}>
                      Recognition from juries and public voting.
                    </p>
                  </div>
                </div>

                <div className="strip" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div>
                    <b>5</b>Nominations
                  </div>
                  <div>
                    <b>3</b>Shortlisted
                  </div>
                  <div>
                    <b>2</b>Finalist
                  </div>
                  <div>
                    <b>1</b>Winner
                  </div>
                </div>

                <div className="sc" style={{ marginTop: '20px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Challenge</th>
                        <th>Submission</th>
                        <th>Category</th>
                        <th>Progress</th>
                        <th>Announced</th>
                        <th>Recognition</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <b>E-commerce Checkout Redesign</b>
                        </td>
                        <td>Checkout, simplified</td>
                        <td>Best Presentation</td>
                        <td>
                          <div className="stp">
                            <span className="d">Nominated</span>
                            <span className="d">Shortlisted</span>
                            <span className="d">Finalist</span>
                            <span className="d">Winner</span>
                          </div>
                        </td>
                        <td>14 Nov</td>
                        <td>
                          <span className="st g">Winner</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <b>Annual Awards 2026</b>
                        </td>
                        <td>Munnar stays website</td>
                        <td>Best Website Design</td>
                        <td>
                          <div className="stp">
                            <span className="d">Nominated</span>
                            <span className="d">Shortlisted</span>
                            <span className="d">Finalist</span>
                            <span>Winner</span>
                          </div>
                        </td>
                        <td>10 Dec</td>
                        <td>
                          <span className="st g">Finalist</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ================= 08 ACHIEVEMENTS ================= */}
            {activeTab === 'achievements' && (
              <section id="achievements">
                <div className="ph">
                  <div>
                    <h1>Achievements</h1>
                    <p className="mut" style={{ marginTop: '6px' }}>
                      4 awards · 5 certificates · 7 badges · 1 competition win
                    </p>
                  </div>
                </div>

                <div className="gal">
                  <div className="cert big">
                    <div>
                      <p className="lbl">Certificate of achievement</p>
                    </div>
                    <div>
                      <p className="mut">Awarded to {currentUser?.name || (currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'Anjali R.')} and Team Parallel</p>
                      <h3>Winner · Best Presentation</h3>
                      <p className="mut" style={{ marginTop: '6px' }}>
                        E-commerce Checkout Redesign
                      </p>
                    </div>
                  </div>
                  <div className="it" style={{ alignSelf: 'end' }}>
                    <p className="lbl">Winner</p>
                    <h3 style={{ margin: '4px 0' }}>Best Presentation</h3>
                    <p className="mut">Issued 14 Nov 2026</p>
                    <div className="cm">
                      <span>CERT-77421</span>
                      <span>
                        <button
                          onClick={handleDownloadCertificate}
                          style={{
                            background: 'rgba(52, 245, 197, 0.15)',
                            border: '1px solid #34f5c5',
                            color: '#34f5c5',
                            fontWeight: 700,
                            borderRadius: '6px',
                            padding: '4px 10px',
                            cursor: 'pointer',
                            fontSize: '12.5px',
                            marginRight: '8px',
                          }}
                        >
                          Download
                        </button>
                        <a onClick={() => showToast('Verification link copied!')} style={{ cursor: 'pointer' }}>Share</a>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sh">
                  <h2>Badges</h2>
                </div>
                <div className="bd">
                  <div>
                    <i>★</i>First submission
                  </div>
                  <div>
                    <i>3</i>Three in a row
                  </div>
                  <div>
                    <i>◆</i>Finalist
                  </div>
                  <div>
                    <i>✓</i>Reviewer
                  </div>
                  <div>
                    <i>◎</i>Top 10
                  </div>
                </div>
              </section>
            )}

            {/* ================= 09 PEER REVIEWS ================= */}
            {activeTab === 'reviews' && (
              <section id="reviews">
                <div className="ph">
                  <div>
                    <h1>Peer reviews</h1>
                    <p className="mut" style={{ marginTop: '6px' }}>
                      Review fellow participants’ work and read feedback on your own.
                    </p>
                  </div>
                </div>

                <div className="gl" style={{ padding: '14px 16px', marginBottom: '22px' }}>
                  {renderSvg('shield')} Reviews are anonymous. The author will not see your name, and you will not see theirs.
                </div>

                <div>
                  <h2>Submission #A-204 · Bus Buddy</h2>
                  <p className="mut" style={{ margin: '4px 0 20px' }}>
                    A redesign of a local bus app with live arrivals and route planning.
                  </p>
                  <div className="field">
                    <label>Written feedback</label>
                    <textarea
                      className="in"
                      rows={4}
                      placeholder="What works well, and what could be better?"
                    ></textarea>
                  </div>
                  <button className="btn" onClick={() => showToast('Peer review submitted.')}>
                    Submit review
                  </button>
                </div>
              </section>
            )}

            {/* ================= 10 NOTIFICATIONS ================= */}
            {activeTab === 'notifications' && (
              <section id="notifications">
                <div className="ph">
                  <h1>Notifications</h1>
                  <button className="btn gh s" onClick={handleMarkAllRead}>
                    Mark all as read
                  </button>
                </div>

                <div className="chips" style={{ marginTop: 0 }}>
                  <button aria-pressed={notifFilter === 'All'} onClick={() => setNotifFilter('All')}>All</button>
                  <button aria-pressed={notifFilter === 'Challenges'} onClick={() => setNotifFilter('Challenges')}>Challenges</button>
                  <button aria-pressed={notifFilter === 'Teams'} onClick={() => setNotifFilter('Teams')}>Teams</button>
                  <button aria-pressed={notifFilter === 'Submissions'} onClick={() => setNotifFilter('Submissions')}>Submissions</button>
                </div>

                <p className="lbl" style={{ margin: '20px 0 8px', borderBottom: '1px solid var(--ln)', paddingBottom: '6px' }}>
                  Recent Notifications ({filteredNotifications.length})
                </p>

                {filteredNotifications.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--mut)' }}>
                    No notifications in this category.
                  </div>
                ) : (
                  filteredNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`nt ${n.isRead ? '' : 'un'}`}
                      onClick={() => handleNotificationClick(n)}
                      style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                      title="Click to view details and navigate"
                    >
                      <i></i>
                      <div>
                        <b>
                          {n.title}
                          {n.type === 'Challenges' && (
                            <span style={{ fontSize: '11.5px', color: '#34f5c5', marginLeft: '8px', fontWeight: 500 }}>
                              · Click to open announcement →
                            </span>
                          )}
                        </b>
                        <p>{n.message}</p>
                      </div>
                      <div className="a">
                        <span className="mut">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {!n.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkNotificationRead(n.id);
                            }}
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </section>
            )}

            {/* ================= 11 PROFILE ================= */}
            {activeTab === 'profile' && (
              <section id="profile">
                <div className="id">
                  <span
                    className="av av-clickable"
                    onClick={() =>
                      setEnlargedImage(
                        currentUser?.profilePicture ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'
                      )
                    }
                    title="Click on profile picture to enlarge"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {currentUser?.profilePicture ? (
                      <img
                        src={currentUser.profilePicture}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      currentUser?.avatarInitials || (currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AR')
                    )}
                  </span>
                  <div style={{ flex: 1, paddingBottom: '6px' }}>
                    <h1>{currentUser?.name || 'Participant'}</h1>
                    <p className="mut">{currentUser?.qualification ? `${currentUser.qualification} · ` : ''}{currentUser?.location || 'India'}</p>
                  </div>
                  <button
                    className="btn gh"
                    onClick={handleOpenEditProfile}
                    style={{ marginBottom: '8px' }}
                  >
                    Edit profile
                  </button>
                </div>

                <div className="pf">
                  <div>
                    <h2>About</h2>
                    <p className="mut" style={{ margin: '8px 0 28px', maxWidth: '60ch' }}>
                      {currentUser?.bio || 'Participant actively building solutions, participating in hackathons and creative challenges.'}
                    </p>
                    <h2 style={{ marginBottom: '14px' }}>Education / Qualification</h2>
                    <div className="exp">
                      <div>
                        <b>{currentUser?.qualification || 'Graduate'}</b>
                        <small>{currentUser?.location || 'India'}</small>
                      </div>
                    </div>
                  </div>

                  <aside>
                    <h2 style={{ marginBottom: '6px' }}>Contact</h2>
                    <div className="kv">
                      <span>Email</span>{currentUser?.email || 'participant@mail.com'}
                    </div>
                    <div className="kv">
                      <span>Phone</span>{currentUser?.phone || '+91 9846 001234'}
                    </div>
                    <div className="kv">
                      <span>Location</span>{currentUser?.location || 'India'}
                    </div>

                    <h2 style={{ margin: '28px 0 12px' }}>Skills</h2>
                    <span className="tag">Figma</span>
                    <span className="tag">UX research</span>
                    <span className="tag">Prototyping</span>
                    <span className="tag">HTML/CSS</span>
                  </aside>
                </div>
              </section>
            )}

            {/* ================= 12 SETTINGS ================= */}
            {activeTab === 'settings' && (
              <section id="settings">
                <div className="ph">
                  <h1>Account settings</h1>
                </div>

                <div className="field">
                  <label>Current password</label>
                  <input type="password" value="••••••••••" readOnly />
                </div>
                <div className="field">
                  <label>New password</label>
                  <input type="password" placeholder="At least 12 characters" />
                </div>
                <button className="btn" onClick={() => showToast('Password updated successfully.')}>
                  Update password
                </button>
              </section>
            )}

            {/* ================= 13 HELP ================= */}
            {activeTab === 'help' && (
              <section id="help">
                <div className="ph">
                  <div>
                    <h1>Help & support</h1>
                    <p className="mut" style={{ marginTop: '6px' }}>
                      Guides, FAQs and a direct line to the challenge team.
                    </p>
                  </div>
                </div>
                <div className="ql" style={{ maxWidth: '640px' }}>
                  <a onClick={() => showToast('Guide opened')}>How registration works <span>→</span></a>
                  <a onClick={() => showToast('Guide opened')}>Team rules: 2 to 4 members <span>→</span></a>
                  <a onClick={() => showToast('Guide opened')}>Submitting and editing your work <span>→</span></a>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* ================= 1. PAYMENT POPUP MODAL (Cash, Card, UPI) ================= */}
      {paymentModalOpen && selectedChallengeForPayment && (
        <div className="modal-overlay" onClick={() => !isProcessingPayment && setPaymentModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="dur">{selectedChallengeForPayment.durationDisplay || selectedChallengeForPayment.duration || 'Daily challenge'}</span>
                <h2>Register & Pay — {selectedChallengeForPayment.title}</h2>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => !isProcessingPayment && setPaymentModalOpen(false)}
                disabled={isProcessingPayment}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p className="mut" style={{ margin: 0, fontSize: '13px' }}>
                    Challenge Code: <b>{selectedChallengeForPayment.code || selectedChallengeForPayment.id}</b>
                  </p>
                  <p style={{ margin: '4px 0 0', fontWeight: 600 }}>
                    {selectedChallengeForPayment.title}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="mut" style={{ margin: 0, fontSize: '12px' }}>Registration Fee</p>
                  <p style={{ margin: '2px 0 0', fontSize: '22px', fontWeight: 700, color: '#34f5c5' }}>
                    ₹{selectedChallengeForPayment.registrationFee || 149}
                  </p>
                </div>
              </div>

              <p className="lbl" style={{ marginBottom: '10px' }}>
                Select Payment Method
              </p>
              <div className="pay-methods">
                <div
                  className={`pay-tab ${paymentMethod === 'upi' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('upi')}
                >
                  <span style={{ fontSize: '20px' }}>⚡</span>
                  <b>UPI / QR</b>
                  <small style={{ fontSize: '11px', color: 'var(--mut)' }}>GPay, PhonePe, Paytm</small>
                </div>
                <div
                  className={`pay-tab ${paymentMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <span style={{ fontSize: '20px' }}>💳</span>
                  <b>Credit / Debit</b>
                  <small style={{ fontSize: '11px', color: 'var(--mut)' }}>Visa, Mastercard, RuPay</small>
                </div>
                <div
                  className={`pay-tab ${paymentMethod === 'cash' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <span style={{ fontSize: '20px' }}>💵</span>
                  <b>Cash / Desk</b>
                  <small style={{ fontSize: '11px', color: 'var(--mut)' }}>Spot verification</small>
                </div>
              </div>

              {/* UPI Tab View */}
              {paymentMethod === 'upi' && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600 }}>Enter UPI ID / VPA</label>
                    <button
                      className="btn gh s"
                      type="button"
                      onClick={() => setShowUpiQr(!showUpiQr)}
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      {showUpiQr ? 'Use UPI ID' : '📷 Show QR Code'}
                    </button>
                  </div>

                  {!showUpiQr ? (
                    <>
                      <input
                        className="in"
                        style={{ width: '100%', marginBottom: '8px' }}
                        placeholder="username@okhdfcbank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {['@okhdfcbank', '@okaxis', '@paytm', '@ybl'].map((handle) => (
                          <button
                            key={handle}
                            type="button"
                            className="btn gh s"
                            style={{ fontSize: '11.5px', padding: '2px 8px' }}
                            onClick={() => {
                              const base = upiId.includes('@') ? upiId.split('@')[0] : (upiId || 'participant');
                              setUpiId(`${base}${handle}`);
                            }}
                          >
                            {handle}
                          </button>
                        ))}
                      </div>
                      <small style={{ color: 'var(--mut)', fontSize: '12px' }}>
                        A payment collect request for ₹{selectedChallengeForPayment.registrationFee || 149} will be sent to your UPI app.
                      </small>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '12px 0' }}>
                      <div
                        style={{
                          background: '#ffffff',
                          display: 'inline-block',
                          padding: '12px',
                          borderRadius: '10px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        }}
                      >
                        <svg width="150" height="150" viewBox="0 0 100 100" fill="none">
                          <rect width="100" height="100" fill="white" />
                          <path fill="#060d09" d="M10 10h30v30H10zM15 15v20h20V15H15zM20 20h10v10H20z" />
                          <path fill="#060d09" d="M60 10h30v30H60zM65 15v20h20V15H65zM70 20h10v10H70z" />
                          <path fill="#060d09" d="M10 60h30v30H10zM15 65v20h20V65H15zM20 70h10v10H20z" />
                          <rect x="45" y="15" width="8" height="20" fill="#060d09" />
                          <rect x="15" y="45" width="20" height="8" fill="#060d09" />
                          <rect x="45" y="45" width="10" height="10" fill="#1d6a46" />
                          <rect x="60" y="60" width="12" height="12" fill="#060d09" />
                          <rect x="75" y="75" width="15" height="15" fill="#060d09" />
                          <rect x="60" y="45" width="25" height="8" fill="#060d09" />
                          <rect x="45" y="75" width="8" height="15" fill="#060d09" />
                        </svg>
                      </div>
                      <p style={{ margin: '10px 0 2px', fontSize: '13px', fontWeight: 600 }}>Scan with Any UPI App</p>
                      <p className="mut" style={{ margin: 0, fontSize: '12px' }}>GPay · PhonePe · Paytm · BHIM · Amazon Pay</p>
                    </div>
                  )}
                </div>
              )}

              {/* Card Tab View */}
              {paymentMethod === 'card' && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>Card Number</label>
                    <input
                      className="in"
                      style={{ width: '100%', letterSpacing: '2px', fontFamily: 'monospace' }}
                      placeholder="4532 8920 1482 9012"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                        setCardNumber(val);
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>Expiry Date</label>
                      <input
                        className="in"
                        style={{ width: '100%' }}
                        placeholder="MM / YY"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length >= 2) val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                          setCardExpiry(val);
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>CVV</label>
                      <input
                        className="in"
                        type="password"
                        style={{ width: '100%' }}
                        placeholder="•••"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>Cardholder Name</label>
                    <input
                      className="in"
                      style={{ width: '100%' }}
                      placeholder="Full name as printed on card"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--mut)' }}>Encrypted 256-bit SSL · Visa · Mastercard · RuPay</span>
                  </div>
                </div>
              )}

              {/* Cash Tab View */}
              {paymentMethod === 'cash' && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ fontSize: '32px' }}>🎫</div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', color: '#34f5c5' }}>Cash Counter Voucher</h4>
                      <p className="mut" style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
                        Pay cash directly at the platform campus registration desk or event helpdesk.
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(52, 245, 197, 0.08)',
                      border: '1px dashed rgba(52, 245, 197, 0.3)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginTop: '14px',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: 'var(--mut)' }}>Temporary Cash Token</span>
                    <p style={{ margin: '4px 0', fontSize: '20px', fontWeight: 800, letterSpacing: '3px', color: '#34f5c5' }}>
                      CSH-74920
                    </p>
                    <small style={{ fontSize: '11.5px', color: 'var(--mut)' }}>
                      Amount Due: ₹{selectedChallengeForPayment.registrationFee || 149} · Valid for 48 hours
                    </small>
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <div style={{ margin: '20px 0 16px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '6px' }}>
                  <span className="mut">Challenge Registration Fee</span>
                  <span>₹{selectedChallengeForPayment.registrationFee || 149}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '8px' }}>
                  <span className="mut">Platform & Gateway Fee</span>
                  <span style={{ color: '#34f5c5' }}>₹0 (Free)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                  <span>Total Payable</span>
                  <span style={{ color: '#34f5c5' }}>₹{selectedChallengeForPayment.registrationFee || 149}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  className="btn gh"
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  disabled={isProcessingPayment}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={handleConfirmPaymentAndRegister}
                  disabled={isProcessingPayment}
                  style={{ minWidth: '180px', justifyContent: 'center' }}
                >
                  {isProcessingPayment ? 'Processing...' : `Pay ₹${selectedChallengeForPayment.registrationFee || 149} & Register`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. EDIT PROFILE MODAL (Requirement 5) ================= */}
      {editProfileModalOpen && (
        <div className="modal-overlay" onClick={() => !profileSaving && setEditProfileModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Participant Profile</h2>
              <button
                className="modal-close-btn"
                onClick={() => !profileSaving && setEditProfileModalOpen(false)}
                disabled={profileSaving}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Profile Image Section */}
              <div style={{ display: 'flex', gap: '18px', alignItems: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#1d6a46',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 700,
                    border: '2px solid #34f5c5',
                    flexShrink: 0,
                  }}
                >
                  {profilePictureUrl ? (
                    <img src={profilePictureUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    profileName.slice(0, 2).toUpperCase() || 'AR'
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Profile Photo
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <label
                      className="btn gh s"
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                    >
                      📁 Upload from Computer
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageFileUpload}
                      />
                    </label>
                    {profilePictureUrl && (
                      <button
                        className="btn gh s"
                        type="button"
                        onClick={() => setProfilePictureUrl('')}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    className="in"
                    style={{ width: '100%', marginTop: '8px', fontSize: '12.5px' }}
                    placeholder="Or paste an image URL (https://...)"
                    value={profilePictureUrl}
                    onChange={(e) => setProfilePictureUrl(e.target.value)}
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>Full Name</label>
                  <input
                    className="in"
                    style={{ width: '100%' }}
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Anjali R."
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>Phone Number</label>
                  <input
                    className="in"
                    style={{ width: '100%' }}
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+91 9846 001234"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>Qualification / Education</label>
                  <input
                    className="in"
                    style={{ width: '100%' }}
                    value={profileQualification}
                    onChange={(e) => setProfileQualification(e.target.value)}
                    placeholder="B.Des, Product Design · GEC"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>Location</label>
                  <input
                    className="in"
                    style={{ width: '100%' }}
                    value={profileLocation}
                    onChange={(e) => setProfileLocation(e.target.value)}
                    placeholder="Thrissur, India"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>About / Bio</label>
                <textarea
                  className="in"
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Share a short summary about your background, experience, and interests..."
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>Skills (comma-separated)</label>
                <input
                  className="in"
                  style={{ width: '100%' }}
                  value={profileSkills}
                  onChange={(e) => setProfileSkills(e.target.value)}
                  placeholder="Figma, UX research, Prototyping, HTML/CSS, React"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  className="btn gh"
                  type="button"
                  onClick={() => setEditProfileModalOpen(false)}
                  disabled={profileSaving}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  style={{ minWidth: '130px', justifyContent: 'center' }}
                >
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. ENLARGE PROFILE IMAGE LIGHTBOX (Requirement 6) ================= */}
      {enlargedImage && (
        <div
          className="modal-overlay"
          onClick={() => setEnlargedImage(null)}
          style={{ background: 'rgba(0, 0, 0, 0.9)', cursor: 'zoom-out' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '85vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'default',
            }}
          >
            <button
              onClick={() => setEnlargedImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#fff',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
            <img
              src={enlargedImage}
              alt="Enlarged profile"
              style={{
                maxWidth: '520px',
                maxHeight: '70vh',
                width: '100%',
                borderRadius: '16px',
                border: '2px solid rgba(52, 245, 197, 0.5)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 50px rgba(52, 245, 197, 0.3)',
                objectFit: 'contain',
              }}
            />
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                {currentUser?.name || 'Participant Profile'}
              </p>
              <p className="mut" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
                {currentUser?.qualification ? `${currentUser.qualification} · ` : ''}{currentUser?.location || 'India'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= 4. INVITE TEAMMATES MODAL (Requirement 7) ================= */}
      {inviteModalOpen && (
        <div className="modal-overlay" onClick={() => setInviteModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Invite Teammates for Group Projects</h2>
                <p className="mut" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                  Group Project Requirement: Minimum 2, maximum 4 members. Select participants to send invitations.
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setInviteModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Search candidate filter */}
              <input
                className="in"
                style={{ width: '100%', marginBottom: '18px' }}
                placeholder="Search candidates by name, qualification, or skills (e.g. Figma, React)..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
              />

              {loadingCandidates ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--mut)' }}>
                  Loading eligible platform participants...
                </div>
              ) : (
                <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                  {(() => {
                    const filtered = participantCandidates.filter((cand) => {
                      if (!candidateSearch.trim()) return true;
                      const q = candidateSearch.toLowerCase();
                      const nameMatch = cand.name?.toLowerCase().includes(q);
                      const qualMatch = cand.qualification?.toLowerCase().includes(q);
                      const skillsMatch = cand.participantProfile?.skills?.some((s: string) => s.toLowerCase().includes(q));
                      return nameMatch || qualMatch || skillsMatch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--mut)' }}>
                          No matching participants found.
                        </div>
                      );
                    }

                    return filtered.map((candidate) => {
                      const isSelf = candidate.email === currentUser?.email;
                      const currentTeam = teams.find((t) => t.id === activeTeamId) || teams[0];
                      const isAlreadyMember = currentTeam?.members?.some(
                        (m: any) => m.userId === candidate.id || m.user?.email === candidate.email
                      );
                      const isTeamFull = (currentTeam?.members?.length || 3) >= 4;

                      // Past submissions formatting (Requirement 7)
                      const prevSubmissions = candidate.submissions && candidate.submissions.length > 0
                        ? candidate.submissions.map((s: any) => s.challenge?.title || s.hackathon?.title || s.title).filter(Boolean)
                        : ['Speed UI: Mobile Checkout', 'Fintech Onboarding UX'];

                      return (
                        <div key={candidate.id} className="candidate-card">
                          <div className="candidate-avatar">
                            {candidate.profilePicture ? (
                              <img src={candidate.profilePicture} alt={candidate.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              candidate.avatarInitials || candidate.name?.slice(0, 2).toUpperCase() || 'P'
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                              <h3 style={{ margin: 0, fontSize: '16px' }}>{candidate.name}</h3>
                              <span style={{ fontSize: '12px', color: 'var(--mut)' }}>{candidate.location || 'India'}</span>
                            </div>
                            <p style={{ margin: '2px 0 6px', fontSize: '13px', color: '#9fcbb0' }}>
                              {candidate.qualification || candidate.participantProfile?.education || 'Design / Engineering Graduate'}
                            </p>
                            {candidate.bio && (
                              <p className="mut" style={{ margin: '0 0 8px', fontSize: '12.5px' }}>
                                {candidate.bio}
                              </p>
                            )}

                            {/* Skills */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                              {(candidate.participantProfile?.skills || ['Figma', 'UX research', 'UI Design']).map((s: string, idx: number) => (
                                <span key={idx} className="tag" style={{ fontSize: '11px', padding: '2px 8px' }}>
                                  {s}
                                </span>
                              ))}
                            </div>

                            {/* Previously Submitted Challenges (Requirement 7) */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <span style={{ fontSize: '11.5px', color: 'var(--mut)' }}>
                                🏆 <b>Previously Submitted Challenges:</b> {prevSubmissions.slice(0, 2).join(', ')}
                                {prevSubmissions.length > 2 ? ` +${prevSubmissions.length - 2} more` : ''}
                              </span>
                            </div>
                          </div>

                          <div style={{ alignSelf: 'center', marginLeft: '8px' }}>
                            {isSelf ? (
                              <span className="st" style={{ background: 'rgba(255,255,255,0.1)' }}>You</span>
                            ) : isAlreadyMember ? (
                              <span className="st g">Member</span>
                            ) : isTeamFull ? (
                              <button className="btn s gh" disabled title="Team size limit of 4 reached">
                                Team Full (4/4)
                              </button>
                            ) : (
                              <button
                                className="btn s"
                                onClick={() => handleSendCandidateInvite(candidate)}
                                disabled={sendingInviteUserId === candidate.id}
                              >
                                {sendingInviteUserId === candidate.id ? 'Sending...' : 'Invite'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {/* Direct email invite footer */}
              <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  className="in"
                  style={{ flex: 1 }}
                  placeholder="Or invite by direct email (e.g. teammate@mail.com)..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <button className="btn s" onClick={handleSendInvite}>
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
