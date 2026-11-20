'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/navigation';

export default function WelcomePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);

  const [activeTab, setActiveTab] = useState<'time' | 'design'>('time');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hackathonMode, setHackathonMode] = useState<'on' | 'off'>('on');
  const [votedItems, setVotedItems] = useState<{ [key: string]: boolean }>({});
  const [countdown, setCountdown] = useState({ days: '00', hours: '00', mins: '00', secs: '00' });

  // Registration Required popup & auth state
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [regRequiredModalOpen, setRegRequiredModalOpen] = useState(false);
  const [intendedDestination, setIntendedDestination] = useState<string>('/participant');
  const [intendedRole, setIntendedRole] = useState<'participant' | 'judge' | 'public' | 'admin'>('participant');

  useEffect(() => {
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleRestrictedClick = (
    e: React.MouseEvent,
    dest: string,
    role: 'participant' | 'judge' | 'public' | 'admin' = 'participant'
  ) => {
    if (currentUser) {
      // Authenticated users proceed directly
      window.location.href = dest;
      return;
    }
    e.preventDefault();
    setIntendedDestination(dest);
    setIntendedRole(role);
    setRegRequiredModalOpen(true);
  };

  // WebGL crystal ribbons shader animation
  useEffect(() => {
    const cv = canvasRef.current;
    const hero = heroRef.current;
    if (!cv || !hero) return;

    const gl = cv.getContext('webgl', { antialias: false });
    if (!gl) return;

    const vs = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
    const fs = `precision highp float;uniform vec2 r;uniform vec2 m;uniform float t;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
    float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return s;}
    void main(){
      vec2 uv=gl_FragCoord.xy/r;vec2 p=(gl_FragCoord.xy-.5*r)/r.y;vec2 mp=(m*r-.5*r)/r.y;
      p+=(mp-p)*.4*exp(-length(p-mp)*2.4);
      float T=t*.07;
      vec2 q=vec2(fbm(p*1.6+T),fbm(p*1.6+vec2(5.2,1.3)-T));
      float v=fbm(p*1.4+2.2*q+T*.5);
      float l=abs(v-.52);
      float glow=.018/(l+.012);
      float core=smoothstep(.016,.0,l);
      vec3 base=mix(vec3(0.,.02,.015),vec3(0.,.17,.12),smoothstep(.2,.8,v)*(.4+.6*uv.y));
      vec3 col=base+vec3(.05,.95,.75)*glow*.5*(.3+.7*uv.y)+vec3(.9,1.,.97)*core*.55;
      col*=mix(.12,1.,smoothstep(0.,.55,uv.y));
      gl_FragColor=vec4(col,1.);}`;

    function compileShader(type: number, src: string) {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, src);
      gl!.compileShader(shader);
      return shader;
    }

    const pr = gl.createProgram();
    if (!pr) return;
    const vertexShader = compileShader(gl.VERTEX_SHADER, vs);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fs);
    if (!vertexShader || !fragmentShader) return;

    gl.attachShader(pr, vertexShader);
    gl.attachShader(pr, fragmentShader);
    gl.linkProgram(pr);

    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const loc = gl.getAttribLocation(pr, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uR = gl.getUniformLocation(pr, 'r');
    const uM = gl.getUniformLocation(pr, 'm');
    const uT = gl.getUniformLocation(pr, 't');

    let tx = 0.7,
      ty = 0.65,
      mx = 0.7,
      my = 0.65;
    let animId = 0;

    function handleResize() {
      if (!cv || !hero || !gl) return;
      const s = Math.min(window.devicePixelRatio || 1, 1.5) * 0.6;
      cv.width = Math.max(2, hero.clientWidth * s);
      cv.height = Math.max(2, hero.clientHeight * s);
      gl.viewport(0, 0, cv.width, cv.height);
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    const handlePointerMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width;
      ty = 1 - (e.clientY - r.top) / r.height;
    };
    hero.addEventListener('pointermove', handlePointerMove);

    function loop(ms: number) {
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;
      if (gl) {
        gl.uniform2f(uR, cv!.width, cv!.height);
        gl.uniform2f(uM, mx, my);
        gl.uniform1f(uT, ms / 1000 + 20);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      hero.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    const end = Date.now() + 36 * 3600 * 1000;
    const interval = setInterval(() => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const days = String(Math.floor(s / 86400)).padStart(2, '0');
      const hours = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
      const mins = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const secs = String(s % 60).padStart(2, '0');
      setCountdown({ days, hours, mins, secs });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleVote = (id: string) => {
    setVotedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="landing-wrap">
      <style jsx global>{`
        .landing-wrap {
          --g: #12b886;
          --gd: #0a5c40;
          --gl: rgba(255, 255, 255, 0.06);
          --bg: #000;
          --card: rgba(255, 255, 255, 0.05);
          --ink: #eaf6ee;
          --mut: #9db3a8;
          --line: rgba(255, 255, 255, 0.12);
          --t: #34f5c5;
          --r: 18px;
          background: #000;
          color: var(--ink);
          font-family: 'DM Sans', system-ui, sans-serif;
          min-height: 100vh;
        }

        .landing-wrap h1,
        .landing-wrap h2,
        .landing-wrap h3 {
          font-family: 'Bricolage Grotesque', 'DM Sans', sans-serif;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .landing-wrap .w {
          max-width: 1160px;
          margin: 0 auto;
          padding: 0 22px;
        }

        .landing-wrap section {
          padding: 72px 0;
        }

        .landing-wrap h2 {
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 800;
          margin-bottom: 10px;
        }

        .landing-wrap .sub {
          color: var(--mut);
          max-width: 60ch;
          margin-bottom: 30px;
        }

        .landing-wrap .hv {
          position: relative;
          transition: color 0.3s, border-color 0.3s, transform 0.3s, box-shadow 0.3s, background 0.3s;
        }
        .landing-wrap .hv:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 32px -20px rgba(12, 31, 20, 0.45);
        }

        .landing-wrap header {
          position: fixed;
          left: 0;
          right: 0;
          top: 0;
          z-index: 50;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.03));
          backdrop-filter: blur(18px) saturate(150%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 -1px 0 rgba(52, 245, 197, 0.08);
        }

        .landing-wrap .nav {
          display: flex;
          align-items: center;
          gap: 26px;
          height: 68px;
        }

        .landing-wrap .logo {
          font: 800 20px 'Bricolage Grotesque', sans-serif;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .landing-wrap .logo i {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          background: linear-gradient(135deg, #34f5c5, #0a6b4d);
          display: grid;
          place-items: center;
          color: #00140d;
          font-style: normal;
          font-size: 16px;
          font-weight: 800;
        }

        .landing-wrap .nav nav {
          display: flex;
          gap: 4px;
          margin-left: auto;
        }

        .landing-wrap .nav nav a {
          padding: 8px 14px;
          border-radius: 999px;
          font-weight: 500;
          font-size: 15px;
          color: var(--ink);
        }

        .landing-wrap .nav nav a:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--t);
        }

        .landing-wrap .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          border-radius: 999px;
          font-weight: 700;
          border: 2px solid #0fa97d;
          cursor: pointer;
          font-family: inherit;
          font-size: 15px;
          background: #0fa97d;
          color: #00140d;
        }

        .landing-wrap .btn:hover {
          background: #34f5c5;
          border-color: #34f5c5;
        }

        .landing-wrap .btn.o {
          background: transparent;
          color: var(--t);
          border-color: rgba(52, 245, 197, 0.45);
        }

        .landing-wrap .btn.o:hover {
          background: rgba(52, 245, 197, 0.12);
          color: var(--t);
          border-color: var(--t);
        }

        .landing-wrap .hero {
          position: relative;
          overflow: hidden;
          min-height: 100vh;
          display: grid;
          align-items: center;
          padding: 148px 0 64px;
          background: #010806;
          color: #fff;
        }

        .landing-wrap #fx {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
        }

        .landing-wrap .hero::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 0.4), transparent 62%),
            linear-gradient(transparent 72%, #010806);
        }

        .landing-wrap .hc {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 1;
          position: relative;
        }

        .landing-wrap .hero h1 {
          font-size: clamp(44px, 7.4vw, 96px);
          font-weight: 800;
          background: linear-gradient(180deg, #fff, #a3b9af);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .landing-wrap .hero .lead {
          font-size: clamp(18px, 2.2vw, 26px);
          font-weight: 700;
          color: #eaf3ef;
          margin: 22px 0 8px;
        }

        .landing-wrap .hero .lead2 {
          color: rgba(255, 255, 255, 0.72);
          max-width: 58ch;
          margin: 0 0 30px;
          font-size: 17px;
        }

        .landing-wrap .cta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .landing-wrap .facts {
          display: flex;
          gap: 28px;
          margin: 34px 0 28px;
          flex-wrap: wrap;
          justify-content: center;
          color: rgba(255, 255, 255, 0.72);
          font-size: 14px;
        }

        .landing-wrap .facts b {
          display: block;
          color: #fff;
          font: 700 22px 'Bricolage Grotesque', sans-serif;
        }

        .landing-wrap .live {
          width: min(520px, 100%);
          text-align: left;
          backdrop-filter: blur(14px);
          background: rgba(4, 26, 19, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 26px;
          padding: 26px;
          margin-top: 10px;
        }

        .landing-wrap .live .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .landing-wrap .pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          background: rgba(52, 245, 197, 0.1);
          color: var(--t);
          border: 1px solid rgba(52, 245, 197, 0.22);
        }

        .landing-wrap .pill.dot::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--t);
          animation: p 1.6s infinite;
        }

        @keyframes p {
          50% {
            opacity: 0.3;
          }
        }

        .landing-wrap .cd {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin: 18px 0;
        }

        .landing-wrap .cd div {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 10px 0;
          text-align: center;
          font: 800 26px 'Bricolage Grotesque', sans-serif;
        }

        .landing-wrap .cd small {
          display: block;
          font: 500 11px 'DM Sans', sans-serif;
          color: rgba(255, 255, 255, 0.7);
        }

        .landing-wrap .meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 16px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.72);
          margin-bottom: 20px;
        }

        .landing-wrap .meta b {
          color: #fff;
          display: block;
          font-size: 16px;
        }

        .landing-wrap .tabs {
          display: inline-flex;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          border-radius: 999px;
          padding: 5px;
          gap: 4px;
          margin-bottom: 26px;
          flex-wrap: wrap;
        }

        .landing-wrap .tabs button {
          border: 0;
          background: none;
          padding: 9px 18px;
          border-radius: 999px;
          font: 700 14px 'DM Sans', sans-serif;
          color: var(--mut);
          cursor: pointer;
        }

        .landing-wrap .tabs button:hover {
          color: var(--t);
        }

        .landing-wrap .tabs button[aria-pressed='true'] {
          background: rgba(52, 245, 197, 0.9);
          color: #00140d;
        }

        .landing-wrap .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 16px;
        }

        .landing-wrap .type,
        .landing-wrap .ch,
        .landing-wrap .award,
        .landing-wrap .step,
        .landing-wrap .entry,
        .landing-wrap .vote,
        .landing-wrap .team,
        .landing-wrap .hack {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.025));
          border: 1px solid rgba(255, 255, 255, 0.13);
          backdrop-filter: blur(16px) saturate(140%);
          border-radius: var(--r);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 24px 44px -28px #000;
        }

        .landing-wrap .type {
          padding: 22px;
          display: block;
          min-height: 150px;
        }

        .landing-wrap .type b {
          display: block;
          font: 700 20px 'Bricolage Grotesque', sans-serif;
          margin: 14px 0 4px;
        }

        .landing-wrap .type span {
          font-size: 14px;
          color: var(--mut);
        }

        .landing-wrap .type .ic {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(52, 245, 197, 0.1);
          border: 1px solid rgba(52, 245, 197, 0.2);
          display: grid;
          place-items: center;
          font-size: 20px;
        }

        .landing-wrap .list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 18px;
        }

        .landing-wrap .ch {
          border-radius: 22px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .landing-wrap .ch h3 {
          font-size: 22px;
        }

        .landing-wrap .ch p {
          font-size: 14px;
          color: var(--mut);
        }

        .landing-wrap .ch .row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .landing-wrap .tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .landing-wrap .tag {
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 8px;
          border: 1.5px solid rgba(255, 255, 255, 0.16);
          color: var(--mut);
        }

        .landing-wrap .cnt {
          display: flex;
          gap: 18px;
          font-size: 13px;
          color: var(--mut);
          border-top: 1px dashed rgba(255, 255, 255, 0.14);
          padding-top: 12px;
        }

        .landing-wrap .cnt b {
          color: var(--ink);
          font-size: 17px;
        }

        .landing-wrap .fee {
          font: 800 24px 'Bricolage Grotesque', sans-serif;
        }

        .landing-wrap .hack {
          background: linear-gradient(135deg, rgba(15, 185, 138, 0.2), rgba(255, 255, 255, 0.035) 60%);
          border-radius: 34px;
          padding: 54px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 40px;
        }

        .landing-wrap .hack .prize {
          font: 800 clamp(44px, 7vw, 84px) 'Bricolage Grotesque', sans-serif;
          line-height: 1;
          margin: 6px 0;
        }

        .landing-wrap .hack .prize small {
          font-size: 0.3em;
          display: block;
          font-weight: 500;
          color: #b8dcc4;
          margin-top: 8px;
        }

        .landing-wrap .hack ul {
          list-style: none;
          padding: 0;
          display: grid;
          gap: 10px;
          align-content: start;
        }

        .landing-wrap .hack li {
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .landing-wrap .aw {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }

        .landing-wrap .award {
          padding: 24px;
        }

        .landing-wrap .award h3 {
          font-size: 20px;
          margin: 10px 0 8px;
        }

        .landing-wrap .award span {
          font-size: 14px;
          color: var(--mut);
        }

        .landing-wrap .vote {
          margin-top: 24px;
          background: linear-gradient(145deg, rgba(15, 185, 138, 0.14), rgba(255, 255, 255, 0.03));
          border-radius: 26px;
          padding: 30px;
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          gap: 30px;
          align-items: center;
        }

        .landing-wrap .entries {
          display: grid;
          gap: 10px;
        }

        .landing-wrap .entry {
          display: flex;
          align-items: center;
          gap: 14px;
          border-radius: 16px;
          padding: 12px 16px;
        }

        .landing-wrap .entry .th {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: linear-gradient(135deg, #34f5c5, #073b2a);
          flex: none;
        }

        .landing-wrap .entry div {
          flex: 1;
        }

        .landing-wrap .entry b {
          display: block;
        }

        .landing-wrap .entry small {
          color: var(--mut);
        }

        .landing-wrap .steps {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
          counter-reset: s;
        }

        .landing-wrap .step {
          padding: 22px;
          position: relative;
          counter-increment: s;
        }

        .landing-wrap .step::after {
          content: counter(s);
          position: absolute;
          right: 16px;
          top: 6px;
          font: 800 54px 'Bricolage Grotesque', sans-serif;
          opacity: 0.1;
        }

        .landing-wrap .step b {
          display: block;
          font: 700 18px 'Bricolage Grotesque', sans-serif;
          margin-bottom: 6px;
        }

        .landing-wrap .step span {
          font-size: 14px;
          color: var(--mut);
        }

        .landing-wrap .team {
          margin-top: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          padding: 16px 22px;
          border-radius: 16px;
          font-size: 14px;
        }

        .landing-wrap .team b {
          color: var(--t);
        }

        .landing-wrap .av {
          display: flex;
        }

        .landing-wrap .av i {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--g);
          border: 3px solid #06140f;
          margin-left: -8px;
          display: block;
        }

        .landing-wrap .av i:nth-child(2) {
          background: var(--gd);
        }
        .landing-wrap .av i:nth-child(3) {
          opacity: 0.6;
        }
        .landing-wrap .av i:nth-child(4) {
          opacity: 0.3;
        }

        .landing-wrap footer {
          background: linear-gradient(180deg, transparent, rgba(10, 107, 77, 0.22));
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--mut);
          padding: 54px 0 36px;
          margin-top: 40px;
        }

        .landing-wrap footer .fg {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 30px;
        }

        .landing-wrap footer h4 {
          color: #fff;
          margin-bottom: 10px;
          font-family: 'Bricolage Grotesque', sans-serif;
        }

        .landing-wrap footer a {
          display: block;
          padding: 3px 0;
          font-size: 14px;
        }

        .landing-wrap footer a:hover {
          color: var(--t);
        }

        .landing-wrap footer .c {
          margin-top: 32px;
          font-size: 13px;
          opacity: 0.7;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          padding-top: 18px;
        }

        @media (max-width: 900px) {
          .landing-wrap .nav nav {
            display: none;
          }
          .landing-wrap .hack {
            grid-template-columns: 1fr;
            padding: 30px;
          }
          .landing-wrap .vote {
            grid-template-columns: 1fr;
          }
          .landing-wrap .steps {
            grid-template-columns: 1fr 1fr;
          }
          .landing-wrap footer .fg {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      {/* Header */}
      <header>
        <div className="w nav">
          <a className="logo" href="#top">
            <i>P</i>Portfolio Builders <span style={{ fontWeight: 500, color: 'var(--mut)' }}>Challenges</span>
          </a>
          <nav aria-label="Main">
            <a href="#portals" style={{ color: 'var(--t)', fontWeight: 700 }}>Select Portal ↓</a>
            <a href="#types">Challenges</a>
            <a href="#hackathons">Hackathons</a>
            <a href="#awards">Awards</a>
            <a href="#how">How it works</a>
          </nav>
          <a
            className="btn o hv"
            href="/login"
          >
            Sign in
          </a>
          <a className="btn hv" href="/register">Register</a>
        </div>
      </header>

      {/* Main Content */}
      <main id="top">
        {/* Hero Section */}
        <section className="hero" ref={heroRef}>
          <canvas id="fx" ref={canvasRef} aria-hidden="true"></canvas>
          <div className="w hc">
            <h1>
              Compete. Ship.
              <br />
              Get recognised.
            </h1>
            <p className="lead">Daily sprints, design battles, hackathons and yearly awards.</p>
            <p className="lead2">
              Select your authorized portal below to register or sign in. Role-based access ensures participants, judges, public voters, and administrators work in dedicated environments.
            </p>
            <div className="cta">
              <a className="btn hv" href="#portals">
                Select Your Portal
              </a>
              <a className="btn o hv" href="#challenges">
                Browse Challenges
              </a>
            </div>
            <div className="facts">
              <div>
                <b>₹99–₹199</b>registration fee
              </div>
              <div>
                <b>2–4</b>members per team
              </div>
              <div>
                <b>Up to ₹10 lakh</b>hackathon prizes
              </div>
            </div>

            {/* Featured Live Challenge */}
            <aside className="live hv" aria-label="Featured challenge">
              <div className="top">
                <span className="pill dot">Registration open</span>
                <span className="tag">24-Hour Challenge</span>
              </div>
              <h3>Redesign a ticket-booking app</h3>
              <p style={{ color: 'var(--mut)', fontSize: '15px' }}>Fix the checkout flow and present your before and after.</p>
              <div className="cd">
                <div>
                  {countdown.days}
                  <small>days</small>
                </div>
                <div>
                  {countdown.hours}
                  <small>hours</small>
                </div>
                <div>
                  {countdown.mins}
                  <small>mins</small>
                </div>
                <div>
                  {countdown.secs}
                  <small>secs</small>
                </div>
              </div>
              <div className="meta">
                <div>
                  <b>₹149</b>Registration fee
                </div>
                <div>
                  <b>Solo or team of 2–4</b>Participation
                </div>
                <div>
                  <b>128 people</b>Registered
                </div>
                <div>
                  <b>42 teams</b>Registered
                </div>
              </div>
              <a
                className="btn hv"
                href="/auth/participant/register"
                onClick={(e) => handleRestrictedClick(e, '/participant', 'participant')}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Register as Participant
              </a>
            </aside>
          </div>
        </section>

        {/* ================= STEP 1: SELECT PORTAL (FOUR DEDICATED ENTRY POINTS) ================= */}
        <section id="portals" style={{ background: 'linear-gradient(180deg, #010806, rgba(10, 92, 64, 0.15))', borderBottom: '1px solid var(--line)' }}>
          <div className="w">
            <span className="pill" style={{ marginBottom: '10px' }}>Entry Points</span>
            <h2>Select your authorized portal</h2>
            <p className="sub">
              Access is strictly partitioned by account role. Choose your designated portal below to sign in or create an account.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              {/* Portal 1: Participant */}
              <div className="type hv" style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '26px' }}>
                <div>
                  <div className="ic">👤</div>
                  <b>Participant Portal</b>
                  <span style={{ display: 'block', margin: '8px 0 16px' }}>
                    For designers & developers competing in challenges, submitting projects, and managing teams.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    className="btn hv"
                    href="/auth/participant/login"
                    onClick={(e) => handleRestrictedClick(e, '/participant', 'participant')}
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Sign in
                  </a>
                  <a
                    className="btn o hv"
                    href="/auth/participant/register"
                    onClick={(e) => handleRestrictedClick(e, '/participant', 'participant')}
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Register
                  </a>
                </div>
              </div>

              {/* Portal 2: Judge */}
              <div className="type hv" style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '26px' }}>
                <div>
                  <div className="ic">⚖️</div>
                  <b>Judge Portal</b>
                  <span style={{ display: 'block', margin: '8px 0 16px' }}>
                    For authorized industry experts evaluating assigned submissions using admin-defined rubrics.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    className="btn hv"
                    href="/auth/judge/login"
                    onClick={(e) => handleRestrictedClick(e, '/judge', 'judge')}
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Sign in
                  </a>
                  <a
                    className="btn o hv"
                    href="/auth/judge/register"
                    onClick={(e) => handleRestrictedClick(e, '/judge', 'judge')}
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Apply as Judge
                  </a>
                </div>
              </div>

              {/* Portal 3: Public Voting */}
              <div className="type hv" style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '26px' }}>
                <div>
                  <div className="ic">🗳️</div>
                  <b>Public Voting Portal</b>
                  <span style={{ display: 'block', margin: '8px 0 16px' }}>
                    For public users casting verified votes for nominees in the Annual People’s Choice Awards.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    className="btn hv"
                    href="/auth/public/login"
                    onClick={(e) => handleRestrictedClick(e, '/public#voting', 'public')}
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Sign in to vote
                  </a>
                  <a
                    className="btn o hv"
                    href="/auth/public/register"
                    onClick={(e) => handleRestrictedClick(e, '/public#voting', 'public')}
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Register to vote
                  </a>
                </div>
              </div>

              {/* Portal 4: Administrator */}
              <div className="type hv" style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '26px', border: '1px solid rgba(180, 83, 77, 0.4)' }}>
                <div>
                  <div className="ic" style={{ background: 'rgba(180, 83, 77, 0.15)', borderColor: 'rgba(180, 83, 77, 0.3)', color: '#e0908b' }}>🛡️</div>
                  <b style={{ color: '#eef3f0' }}>Admin Portal</b>
                  <span style={{ display: 'block', margin: '8px 0 16px', color: '#8a9a90' }}>
                    Restricted workspace for authorized platform administrators and management modules.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    className="btn hv"
                    href="/auth/admin/login"
                    onClick={(e) => handleRestrictedClick(e, '/admin', 'admin')}
                    style={{ padding: '8px 16px', fontSize: '13px', background: '#1b6b46', borderColor: '#1b6b46' }}
                  >
                    Admin Sign In
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Challenge Formats */}
        <section id="types">
          <div className="w">
            <h2>Pick a challenge format</h2>
            <p className="sub">
              Choose by time or by discipline. Each challenge shows its fee, schedule and team rules before you register.
            </p>
            <div className="tabs" role="group" aria-label="Challenge format">
              <button
                aria-pressed={activeTab === 'time'}
                onClick={() => setActiveTab('time')}
              >
                By time
              </button>
              <button
                aria-pressed={activeTab === 'design'}
                onClick={() => setActiveTab('design')}
              >
                By discipline
              </button>
            </div>

            {activeTab === 'time' && (
              <div className="grid">
                <a href="#challenges" className="type hv">
                  <div className="ic">☀</div>
                  <b>Daily</b>
                  <span>A new task every day.</span>
                </a>
                <a href="#challenges" className="type hv">
                  <div className="ic">📅</div>
                  <b>Weekly</b>
                  <span>One brief on a weekly cycle.</span>
                </a>
                <a href="#challenges" className="type hv">
                  <div className="ic">🗓</div>
                  <b>Monthly</b>
                  <span>A deeper monthly project.</span>
                </a>
                <a href="#challenges" className="type hv">
                  <div className="ic">🏔</div>
                  <b>Yearly</b>
                  <span>Our biggest annual challenge.</span>
                </a>
                <a href="#challenges" className="type hv">
                  <div className="ic">⏱</div>
                  <b>8-Hour</b>
                  <span>One focused working day.</span>
                </a>
                <a href="#challenges" className="type hv">
                  <div className="ic">🌗</div>
                  <b>24-Hour</b>
                  <span>Build and ship overnight.</span>
                </a>
                <a href="#challenges" className="type hv">
                  <div className="ic">⚡</div>
                  <b>48-Hour</b>
                  <span>A full weekend sprint.</span>
                </a>
                <a href="#challenges" className="type hv">
                  <div className="ic">🖐</div>
                  <b>5-Day</b>
                  <span>Runs once every month.</span>
                </a>
              </div>
            )}

            {activeTab === 'design' && (
              <div className="grid">
                <a href="#challenges" className="type hv">
                  <div className="ic">🎨</div>
                  <b>UI Challenge</b>
                  <span>Visual design, components and polish.</span>
                </a>
                <a href="#challenges" className="type hv">
                  <div className="ic">🧭</div>
                  <b>UX Challenge</b>
                  <span>Research, flows and problem solving.</span>
                </a>
                <a href="#challenges" className="type hv">
                  <div className="ic">🔁</div>
                  <b>Redesign Challenge</b>
                  <span>Improve a real product people use.</span>
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Section: Challenges List */}
        <section id="challenges" style={{ background: 'var(--gl)' }}>
          <div className="w">
            <h2>Challenges</h2>
            <p className="sub">Registered counts are shown for people and teams separately.</p>
            <div className="tabs" role="group" aria-label="Filter by status">
              {['all', 'open', 'sched', 'done'].map((st) => (
                <button
                  key={st}
                  aria-pressed={statusFilter === st}
                  onClick={() => setStatusFilter(st)}
                >
                  {st === 'all'
                    ? 'All'
                    : st === 'open'
                    ? 'Registration open'
                    : st === 'sched'
                    ? 'Scheduled'
                    : 'Completed'}
                </button>
              ))}
            </div>

            <div className="list">
              {(statusFilter === 'all' || statusFilter === 'open') && (
                <>
                  <article className="ch hv">
                    <div className="row">
                      <span className="pill">Registration open</span>
                      <span className="tag">48-Hour</span>
                    </div>
                    <h3>Fintech onboarding UX</h3>
                    <p>Design a first-time user flow for a savings app. Submit a prototype link and a short write-up.</p>
                    <div className="tags">
                      <span className="tag">Team 2–4</span>
                      <span className="tag">Solo allowed</span>
                      <span className="tag">Online</span>
                    </div>
                    <div className="cnt">
                      <div>
                        <b>212</b>
                        <br />
                        people
                      </div>
                      <div>
                        <b>64</b>
                        <br />
                        teams
                      </div>
                      <div>
                        <b>Closes</b>
                        <br />
                        21 Nov
                      </div>
                    </div>
                    <div className="row">
                      <span className="fee">₹149</span>
                      <a
                        className="btn o hv"
                        href="/public#challenge"
                        onClick={(e) => handleRestrictedClick(e, '/public#challenge', 'participant')}
                      >
                        View details
                      </a>
                    </div>
                  </article>

                  <article className="ch hv">
                    <div className="row">
                      <span className="pill">Registration open</span>
                      <span className="tag">UI Challenge</span>
                    </div>
                    <h3>Weekly UI: travel dashboard</h3>
                    <p>Design a trip-planning dashboard for desktop and mobile with a clear visual system.</p>
                    <div className="tags">
                      <span className="tag">Solo only</span>
                      <span className="tag">Online</span>
                    </div>
                    <div className="cnt">
                      <div>
                        <b>340</b>
                        <br />
                        people
                      </div>
                      <div>
                        <b>—</b>
                        <br />
                        teams
                      </div>
                      <div>
                        <b>Closes</b>
                        <br />
                        22 Nov
                      </div>
                    </div>
                    <div className="row">
                      <span className="fee">₹99</span>
                      <a
                        className="btn o hv"
                        href="/public#explore"
                        onClick={(e) => handleRestrictedClick(e, '/public#explore', 'participant')}
                      >
                        View details
                      </a>
                    </div>
                  </article>
                </>
              )}

              {(statusFilter === 'all' || statusFilter === 'sched') && (
                <>
                  <article className="ch hv">
                    <div className="row">
                      <span className="pill">Scheduled</span>
                      <span className="tag">5-Day</span>
                    </div>
                    <h3>Monthly 5-Day Case Study</h3>
                    <p>Take one problem from research to final screens in five days.</p>
                    <div className="tags">
                      <span className="tag">Team 2–4</span>
                      <span className="tag">Solo allowed</span>
                    </div>
                    <div className="cnt">
                      <div>
                        <b>Starts</b>
                        <br />1 Dec
                      </div>
                      <div>
                        <b>Ends</b>
                        <br />5 Dec
                      </div>
                      <div>
                        <b>Opens</b>
                        <br />25 Nov
                      </div>
                    </div>
                    <div className="row">
                      <span className="fee">₹149</span>
                      <a
                        className="btn o hv"
                        href="/public#explore"
                        onClick={(e) => handleRestrictedClick(e, '/public#explore', 'participant')}
                      >
                        Get notified
                      </a>
                    </div>
                  </article>

                  <article className="ch hv">
                    <div className="row">
                      <span className="pill">Scheduled</span>
                      <span className="tag">Hackathon</span>
                    </div>
                    <h3>Kerala Product Hackathon</h3>
                    <p>Build a working product with a team. Online and in-person tracks.</p>
                    <div className="tags">
                      <span className="tag">Team 2–4</span>
                      <span className="tag">Online + Offline</span>
                    </div>
                    <div className="cnt">
                      <div>
                        <b>Starts</b>
                        <br />14 Dec
                      </div>
                      <div>
                        <b>Ends</b>
                        <br />16 Dec
                      </div>
                      <div>
                        <b>Prizes</b>
                        <br />Up to ₹10L
                      </div>
                    </div>
                    <div className="row">
                      <span className="fee">₹199</span>
                      <a
                        className="btn o hv"
                        href="/public#hackathons"
                        onClick={(e) => handleRestrictedClick(e, '/public#hackathons', 'participant')}
                      >
                        Get notified
                      </a>
                    </div>
                  </article>
                </>
              )}

              {(statusFilter === 'all' || statusFilter === 'done') && (
                <>
                  <article className="ch hv">
                    <div className="row">
                      <span className="pill">Results published</span>
                      <span className="tag">24-Hour</span>
                    </div>
                    <h3>E-commerce checkout redesign</h3>
                    <p>Winners and nominees are published. See the top entries and judges’ notes.</p>
                    <div className="tags">
                      <span className="tag">Completed 9 Nov</span>
                    </div>
                    <div className="cnt">
                      <div>
                        <b>186</b>
                        <br />
                        people
                      </div>
                      <div>
                        <b>51</b>
                        <br />
                        teams
                      </div>
                      <div>
                        <b>Winners</b>
                        <br />3
                      </div>
                    </div>
                    <div className="row">
                      <span className="fee">₹149</span>
                      <a
                        className="btn o hv"
                        href="/public#winners"
                        onClick={(e) => handleRestrictedClick(e, '/public#winners', 'participant')}
                      >
                        View results
                      </a>
                    </div>
                  </article>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Section: Hackathons */}
        <section id="hackathons">
          <div className="w">
            <div className="hack">
              <div>
                <h2>Hackathons, online or on site</h2>
                <p className="sub" style={{ color: '#b8dcc4' }}>
                  Build with a team, present your work and compete for cash prizes. Each event publishes its own prize pool and rules.
                </p>
                <div className="tabs" role="group" aria-label="Participation mode" style={{ background: 'rgba(255,255,255,.1)' }}>
                  <button
                    aria-pressed={hackathonMode === 'on'}
                    onClick={() => setHackathonMode('on')}
                    style={{ color: '#b8dcc4' }}
                  >
                    Online
                  </button>
                  <button
                    aria-pressed={hackathonMode === 'off'}
                    onClick={() => setHackathonMode('off')}
                    style={{ color: '#b8dcc4' }}
                  >
                    Offline
                  </button>
                </div>
                <div className="prize">
                  Up to ₹10 lakh
                  <small>Maximum pool. The actual amount varies by event.</small>
                </div>
                <p style={{ color: '#b8dcc4', margin: '14px 0 24px' }}>
                  {hackathonMode === 'on'
                    ? 'Join from anywhere. You will get the call link and schedule after registering.'
                    : 'Meet at the venue with your team. Venue details are sent after you register.'}
                </p>
                <a
                  className="btn hv"
                  href="/public#hackathons"
                  onClick={(e) => handleRestrictedClick(e, '/public#hackathons', 'participant')}
                  style={{ background: '#fff', color: 'var(--gd)', borderColor: '#fff' }}
                >
                  Explore hackathons
                </a>
              </div>
              <ul>
                <li className="hv">
                  <b>Team size</b>
                  <span style={{ color: '#b8dcc4' }}>2 to 4 members</span>
                </li>
                <li className="hv">
                  <b>Registration fee</b>
                  <span style={{ color: '#b8dcc4' }}>₹99–₹199</span>
                </li>
                <li className="hv">
                  <b>Judging</b>
                  <span style={{ color: '#b8dcc4' }}>Marks on a published rubric</span>
                </li>
                <li className="hv">
                  <b>Results</b>
                  <span style={{ color: '#b8dcc4' }}>Winners and nominees</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section: Annual Awards & Public Choice */}
        <section id="awards">
          <div className="w">
            <h2>Annual awards</h2>
            <p className="sub">One awards season each year. Categories can change, so check the programme page for this year’s list.</p>
            <div className="aw">
              <div className="award hv">
                <span className="pill">Best Case Study</span>
                <h3>Three groups, one trophy each</h3>
                <span>Judged by case-study quality.</span>
                <div className="tags" style={{ marginTop: '12px' }}>
                  <span className="tag">Students</span>
                  <span className="tag">Agencies</span>
                  <span className="tag">Freelancers</span>
                </div>
              </div>
              <div className="award hv">
                <span className="pill">Design</span>
                <h3>Best Website Design</h3>
                <span>Layout, craft and usability.</span>
              </div>
              <div className="award hv">
                <span className="pill">Design</span>
                <h3>Best App Design</h3>
                <span>Mobile-first product design.</span>
              </div>
              <div className="award hv">
                <span className="pill">Special</span>
                <h3>Best Presentation</h3>
                <span>The clearest story behind the work.</span>
              </div>
              <div className="award hv">
                <span className="pill">Special</span>
                <h3>Most Innovative</h3>
                <span>The out-of-the-box idea.</span>
              </div>
              <div className="award hv">
                <span className="pill">Special</span>
                <h3>Best Emerging Tech</h3>
                <span>Smart use of new technology.</span>
              </div>
            </div>

            {/* Voting Component */}
            <div className="vote" id="results">
              <div>
                <span className="pill dot">Public Choice</span>
                <h2 style={{ marginTop: '12px', fontSize: '32px' }}>Vote for your favourite</h2>
                <p className="sub" style={{ margin: 0 }}>
                  Free public voting with verified email. One vote per category.
                </p>
                <a
                  className="btn hv"
                  href="/public#voting"
                  onClick={(e) => handleRestrictedClick(e, '/public#voting', 'public')}
                  style={{ marginTop: '20px' }}
                >
                  Full voting portal →
                </a>
              </div>
              <div className="entries">
                <div className="entry">
                  <span className="th"></span>
                  <div>
                    <b>Kochi Metro redesign</b>
                    <small>Team Parallel · Best App Design</small>
                  </div>
                  <button
                    className="btn o hv"
                    aria-pressed={votedItems['1'] || false}
                    onClick={(e) => {
                      if (!currentUser) {
                        handleRestrictedClick(e, '/public#voting', 'public');
                      } else {
                        toggleVote('1');
                      }
                    }}
                  >
                    {votedItems['1'] ? 'Voted' : 'Vote'}
                  </button>
                </div>
                <div className="entry">
                  <span className="th" style={{ filter: 'hue-rotate(40deg)' }}></span>
                  <div>
                    <b>Munnar stays website</b>
                    <small>Anjali R. · Best Website Design</small>
                  </div>
                  <button
                    className="btn o hv"
                    aria-pressed={votedItems['2'] || false}
                    onClick={(e) => {
                      if (!currentUser) {
                        handleRestrictedClick(e, '/public#voting', 'public');
                      } else {
                        toggleVote('2');
                      }
                    }}
                  >
                    {votedItems['2'] ? 'Voted' : 'Vote'}
                  </button>
                </div>
                <div className="entry">
                  <span className="th" style={{ filter: 'hue-rotate(-30deg)' }}></span>
                  <div>
                    <b>Farm-to-table case study</b>
                    <small>Studio Nila · Best Case Study</small>
                  </div>
                  <button
                    className="btn o hv"
                    aria-pressed={votedItems['3'] || false}
                    onClick={(e) => {
                      if (!currentUser) {
                        handleRestrictedClick(e, '/public#voting', 'public');
                      } else {
                        toggleVote('3');
                      }
                    }}
                  >
                    {votedItems['3'] ? 'Voted' : 'Vote'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: How registration works */}
        <section id="how" style={{ background: 'var(--gl)' }}>
          <div className="w">
            <h2>How registration works</h2>
            <p className="sub">The fee and team rules are shown before you confirm. Your spot is counted once payment is confirmed.</p>
            <div className="steps">
              <div className="step hv">
                <b>Choose</b>
                <span>Open a challenge and read the brief, fee and dates.</span>
              </div>
              <div className="step hv">
                <b>Solo or team</b>
                <span>Pick a format the challenge allows.</span>
              </div>
              <div className="step hv">
                <b>Check your team</b>
                <span>Teams need 2 to 4 members.</span>
              </div>
              <div className="step hv">
                <b>Pay</b>
                <span>Confirm the fee in rupees.</span>
              </div>
              <div className="step hv">
                <b>Submit</b>
                <span>Upload before the deadline and track your status.</span>
              </div>
            </div>
            <div className="team">
              <div className="av">
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </div>
              <span>
                <b>Team of 4</b> – valid. Add 2 to 4 people to continue. A team of 1 or 5 cannot register.
              </span>
            </div>
          </div>
        </section>

        {/* Section: What you earn */}
        <section>
          <div className="w">
            <h2>What you earn</h2>
            <p className="sub">Every entry builds a public record you can share.</p>
            <div className="grid">
              <div className="type hv">
                <div className="ic">📜</div>
                <b>Certificates</b>
                <span>Verifiable and shareable.</span>
              </div>
              <div className="type hv">
                <div className="ic">⭐</div>
                <b>Social proof</b>
                <span>Wins and nominations on your profile.</span>
              </div>
              <div className="type hv">
                <div className="ic">💬</div>
                <b>Peer reviews</b>
                <span>Feedback from fellow participants.</span>
              </div>
              <div className="type hv">
                <div className="ic">🏆</div>
                <b>Awards and titles</b>
                <span>Recognition from the jury and the public.</span>
              </div>
              <div className="type hv">
                <div className="ic">💰</div>
                <b>Cash prizes</b>
                <span>Set per event and published up front.</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer>
        <div className="w">
          <div className="fg">
            <div>
              <h4>Portfolio Builders</h4>
              <p style={{ fontSize: '14px', maxWidth: '34ch' }}>
                Challenges, hackathons and awards for designers and developers across Kerala and beyond.
              </p>
            </div>
            <div>
              <h4>Portals</h4>
              <a href="/public" onClick={(e) => handleRestrictedClick(e, '/public', 'public')}>Public Website</a>
              <a href="/participant" onClick={(e) => handleRestrictedClick(e, '/participant', 'participant')}>Participant Portal</a>
              <a href="/judge" onClick={(e) => handleRestrictedClick(e, '/judge', 'judge')}>Judge Portal</a>
              <a href="/admin" onClick={(e) => handleRestrictedClick(e, '/admin', 'admin')}>Admin Portal</a>
            </div>
            <div>
              <h4>Compete</h4>
              <a href="#types">Challenges</a>
              <a href="#hackathons">Hackathons</a>
              <a href="#awards">Awards</a>
              <a href="#results">Results</a>
            </div>
            <div>
              <h4>Legal & Contact</h4>
              <a href="/public#about">About us</a>
              <a href="/public#about">Rules & Guidelines</a>
              <a href="/public#about">FAQs</a>
              <a href="mailto:hello@portfoliobuilders.in">hello@portfoliobuilders.in</a>
            </div>
          </div>
          <div className="c">© 2026 Portfolio Builders. Connected to PostgreSQL (db_challenge).</div>
        </div>
      </footer>

      {/* ================= REGISTRATION REQUIRED POPUP (Section 1 Requirement) ================= */}
      <div
        className="reg-modal-backdrop"
        onClick={() => setRegRequiredModalOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(10px)',
          display: regRequiredModalOpen ? 'grid' : 'none',
          placeItems: 'center',
          padding: '20px',
        }}
      >
        <div
          className="reg-modal-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(460px, 100%)',
            background: 'rgba(14, 22, 18, 0.96)',
            border: '1px solid rgba(52, 245, 197, 0.35)',
            borderRadius: '24px',
            padding: '36px 30px',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
            position: 'relative',
            color: '#eaf6ee',
            textAlign: 'center',
          }}
        >
          <button
            onClick={() => setRegRequiredModalOpen(false)}
            style={{
              position: 'absolute',
              right: '16px',
              top: '16px',
              background: 'none',
              border: 'none',
              color: '#8b9890',
              fontSize: '26px',
              cursor: 'pointer',
              lineHeight: 1,
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
              color: '#34f5c5',
              padding: '4px 14px',
              borderRadius: '99px',
              background: 'rgba(52, 245, 197, 0.12)',
              border: '1px solid rgba(52, 245, 197, 0.3)',
              marginBottom: '14px',
              fontWeight: 700,
            }}
          >
            Authentication Gate
          </span>

          <h3
            style={{
              fontSize: '24px',
              fontWeight: 800,
              margin: '0 0 10px',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              color: '#fff',
            }}
          >
            Registration Required
          </h3>

          <p
            style={{
              color: 'rgba(255, 255, 255, 0.78)',
              fontSize: '15px',
              margin: '0 0 24px',
              lineHeight: 1.5,
            }}
          >
            Please register first to access this feature. Already have an account? You can sign in.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {intendedRole !== 'admin' && (
              <a
                className="btn"
                href={`/auth/${intendedRole}/register?redirect=${encodeURIComponent(intendedDestination)}`}
                style={{
                  padding: '12px 24px',
                  fontSize: '14.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Register Now
              </a>
            )}
            <a
              className="btn o"
              href={`/auth/${intendedRole}/login?redirect=${encodeURIComponent(intendedDestination)}`}
              style={{
                padding: '12px 24px',
                fontSize: '14.5px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
