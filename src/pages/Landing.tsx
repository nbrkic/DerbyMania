import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Shield, Users, BarChart3, ArrowRight, ChevronRight,
  Zap, Globe, Lock, Star, CheckCircle2, TrendingUp, Calendar,
  Play, Award, Target, Activity
} from 'lucide-react';

/* ─── DATA ──────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Funkcionalnosti', href: '#features' },
  { label: 'Statistike',       href: '#stats' },
  { label: 'Cenovnik',         href: '#pricing' },
];

const FEATURES = [
  { icon: Trophy,   title: 'Upravljanje turnirima', desc: 'Od žreba do finala. Automatski raspored, grupe, eliminacije i praćenje rezultata u realnom vremenu.', color: 'rgba(37,99,235,0.15)', border: 'rgba(37,99,235,0.25)', iconColor: '#60A5FA', glow: 'rgba(37,99,235,0.3)' },
  { icon: Shield,   title: 'Registracija ekipa',    desc: 'Kompletan profil ekipe sa istorijatom, bojama, grbom i kontakt informacijama na jednom mestu.',      color: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',  iconColor: '#34D399', glow: 'rgba(16,185,129,0.25)' },
  { icon: Users,    title: 'Baza igrača',            desc: 'Detaljna kartoteka svakog igrača — pozicija, statistike, kartoni, golovi. Poveži sa ekipom za sekundu.', color: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',  iconColor: '#FCD34D', glow: 'rgba(245,158,11,0.25)' },
  { icon: BarChart3, title: 'Napredna analitika',   desc: 'Vizualni pregled statistika — top strelci, distribucija rezultata, golovi po minutima i trendovi.',    color: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)',  iconColor: '#C084FC', glow: 'rgba(168,85,247,0.25)' },
  { icon: Zap,      title: 'Brzo i jednostavno',     desc: 'Intuitivni interfejs koji ne zahteva obuku. Od ideje do prvog meča za manje od 10 minuta.',          color: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',   iconColor: '#F87171', glow: 'rgba(239,68,68,0.25)'  },
  { icon: Globe,    title: 'Radi svugde',             desc: 'Pristupite sa bilo kog uređaja. Desktop, tablet, mobilni — dizajn se prilagođava savršeno.',          color: 'rgba(20,184,166,0.08)', border: 'rgba(20,184,166,0.2)',  iconColor: '#2DD4BF', glow: 'rgba(20,184,166,0.25)' },
];

const STATS = [
  { value: '2,400+',  label: 'Turnira organizovano', icon: Trophy },
  { value: '18,000+', label: 'Registrovanih igrača',  icon: Users },
  { value: '94,000+', label: 'Odigranih mečeva',      icon: Activity },
  { value: '99.9%',   label: 'Uptime garantovan',     icon: Zap },
];

const PRICING = [
  { name: 'Starter', price: 'Besplatno', sub: 'Zauvek',    highlighted: false, features: ['3 aktivna turnira','10 ekipa','100 igrača','Osnovna analitika'], cta: 'Počni besplatno' },
  { name: 'Pro',     price: '€19',       sub: 'mesečno',   highlighted: true,  features: ['Neograničeni turniri','Neograničene ekipe','Neograničeni igrači','Napredna analitika','Prioritetna podrška'], cta: 'Počni trial' },
  { name: 'Klub',    price: '€49',       sub: 'mesečno',   highlighted: false, features: ['Sve iz Pro plana','Više administratora','Custom branding','API pristup','Dedicated support'], cta: 'Kontaktiraj nas' },
];

const TICKER_ITEMS = [
  '⚽ FK Partizan vs FK Crvena zvezda  3:1',
  '🏆 Liga šampiona — Grupna faza završena',
  '⚽ FK Vojvodina vs FK Vojvodina  1:0',
  '🥇 Kup Srbije — Finale zakazano',
  '⚽ FK Spartak vs FK Radnički  2:2',
  '📊 Top strelac: Marko Jović — 12 golova',
  '⚽ FK Mladost vs FK Napredak  0:3',
  '🏅 Sezona 2024/25 — 48 turnira u toku',
];

const FLOATING_CARDS = [
  {
    title: 'Finale — Liga šampiona',
    subtitle: 'Petak, 18. April · 19:00',
    home: 'FK Zvezda',    homeShort: 'FKZ', homeColor: '#EF4444',
    away: 'FK Partizan',  awayShort: 'FKP', awayColor: '#1D4ED8',
    score: '2 : 1',
    status: 'ZAVRŠENO',
    style: { top: '14%', right: '5%', transform: 'rotate(2deg)' },
    delay: '0s',
  },
  {
    title: 'Grupna faza — Kup Srbije',
    subtitle: 'Subota, 19. April · 17:00',
    home: 'FK Vojvodina', homeShort: 'FKV', homeColor: '#10B981',
    away: 'FK Spartak',   awayShort: 'FKS', awayColor: '#F59E0B',
    score: 'VS',
    status: 'ZAKAZANO',
    style: { bottom: '22%', right: '3%', transform: 'rotate(-1.5deg)' },
    delay: '1.5s',
  },
  {
    title: 'Top strelci — Sezona',
    subtitle: 'Ažurirano malopre',
    isScorers: true,
    scorers: [
      { name: 'M. Jović',    goals: 12, color: '#60A5FA' },
      { name: 'N. Radonjić', goals: 9,  color: '#34D399' },
      { name: 'S. Mitrović', goals: 7,  color: '#FCD34D' },
    ],
    style: { top: '18%', left: '3%', transform: 'rotate(-2deg)' },
    delay: '0.8s',
  },
];

/* ─── PARTICLE CANVAS ──────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string };
    const COLORS = ['#3B82F6','#60A5FA','#93C5FD','#1D4ED8','#2563EB'];

    const particles: Particle[] = Array.from({ length: 80 }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      vx:    (Math.random() - 0.5) * 0.35,
      vy:    (Math.random() - 0.5) * 0.35,
      r:     Math.random() * 1.8 + 0.4,
      alpha: Math.random() * 0.5 + 0.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59,130,246,${0.07 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      });

      raf = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.7 }} />;
}

/* ─── FLOATING CARD ────────────────────────────────────────── */
function FloatingCard({ card }: { card: typeof FLOATING_CARDS[0] }) {
  return (
    <div
      className="absolute hidden lg:block w-64 rounded-2xl pointer-events-none select-none"
      style={{
        ...card.style,
        background: 'linear-gradient(135deg, rgba(15,32,64,0.92) 0%, rgba(5,13,28,0.97) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset',
        backdropFilter: 'blur(20px)',
        animation: `floatCard 6s ease-in-out ${card.delay} infinite`,
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-white text-xs font-semibold leading-tight">{card.title}</p>
            <p className="text-silver-500 text-[10px] mt-0.5">{card.subtitle}</p>
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
            card.status === 'ZAVRŠENO' ? 'badge-gray' :
            card.status === 'ZAKAZANO' ? 'badge-blue' : ''
          }`}>
            {card.status}
          </span>
        </div>

        {card.isScorers ? (
          <div className="space-y-2">
            {card.scorers?.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="text-[10px] text-silver-600 w-3">{i+1}</span>
                <div className="flex-1 h-1.5 bg-navy-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(s.goals / 12) * 100}%`, background: s.color }} />
                </div>
                <span className="text-[10px] text-white font-semibold w-16 truncate">{s.name}</span>
                <span className="text-[10px] font-bold" style={{ color: s.color }}>{s.goals}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="text-center flex-1">
              <div className="w-8 h-8 rounded-lg mx-auto mb-1 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: card.homeColor + '30', border: `1px solid ${card.homeColor}50` }}>
                {card.homeShort?.substring(0,2)}
              </div>
              <p className="text-[9px] text-silver-400 leading-tight">{card.home}</p>
            </div>
            <div className="text-center flex-shrink-0">
              <div className="font-mono font-bold text-sm text-white bg-navy-800 px-3 py-1.5 rounded-lg border border-white/8">
                {card.score}
              </div>
            </div>
            <div className="text-center flex-1">
              <div className="w-8 h-8 rounded-lg mx-auto mb-1 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: card.awayColor + '30', border: `1px solid ${card.awayColor}50` }}>
                {card.awayShort?.substring(0,2)}
              </div>
              <p className="text-[9px] text-silver-400 leading-tight">{card.away}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom glow line */}
      <div className="h-px w-full" style={{background:'linear-gradient(90deg,transparent,rgba(96,165,250,0.4),transparent)'}} />
    </div>
  );
}

/* ─── TICKER ────────────────────────────────────────────────── */
function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="relative overflow-hidden border-y border-white/5 py-3"
      style={{background:'rgba(5,13,28,0.6)'}}>
      <div className="flex gap-12 ticker-inner whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 text-silver-500 text-xs font-medium flex-shrink-0">
            {item}
            <span className="w-1 h-1 rounded-full bg-blue-600/60" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── MOUSE GLOW ────────────────────────────────────────────── */
function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!glowRef.current) return;
      glowRef.current.style.left = e.clientX + 'px';
      glowRef.current.style.top  = e.clientY + 'px';
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  return (
    <div ref={glowRef} className="pointer-events-none fixed z-0"
      style={{
        width: 600, height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)',
        transform: 'translate(-50%, -50%)',
        transition: 'left 0.15s ease, top 0.15s ease',
      }}
    />
  );
}

/* ─── SVG GRID DOTS ─────────────────────────────────────────── */
function GridDots() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{opacity:0.6}} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dots" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
          <circle cx="0" cy="0" r="1.3" fill="rgba(96,165,250,0.85)" />
        </pattern>
        <radialGradient id="dotFade" cx="50%" cy="25%" r="65%">
          <stop offset="0%"   stopColor="white" stopOpacity="1" />
          <stop offset="55%"  stopColor="white" stopOpacity="0.5" />
          <stop offset="100%" stopColor="white" stopOpacity="0.04" />
        </radialGradient>
        <mask id="dotMask">
          <rect width="100%" height="100%" fill="url(#dotFade)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" mask="url(#dotMask)" />
    </svg>
  );
}

/* ─── HERO GLOW LINES ───────────────────────────────────────── */
function GlowLines() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" style={{opacity:0.5}}>
      <defs>
        <linearGradient id="lineH" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="transparent" />
          <stop offset="30%"  stopColor="#1D4ED8" />
          <stop offset="50%"  stopColor="#60A5FA" />
          <stop offset="70%"  stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        <linearGradient id="lineH2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="transparent" />
          <stop offset="40%"  stopColor="#1E3A8A" />
          <stop offset="60%"  stopColor="#3B82F6" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        <linearGradient id="lineV" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="transparent" />
          <stop offset="30%"  stopColor="#1D4ED8" />
          <stop offset="50%"  stopColor="#60A5FA" />
          <stop offset="70%"  stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        <linearGradient id="lineV2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#3B82F6" />
          <stop offset="40%"  stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      {/* Horizontal accent lines */}
      <line x1="0" y1="33%" x2="100%" y2="33%" stroke="url(#lineH)"  strokeWidth="0.8" />
      <line x1="0" y1="66%" x2="100%" y2="66%" stroke="url(#lineH2)" strokeWidth="0.5" />
      {/* Vertical accent lines */}
      <line x1="25%" y1="0" x2="25%" y2="100%" stroke="url(#lineV)"  strokeWidth="0.8" />
      <line x1="50%" y1="0" x2="50%" y2="60%"  stroke="url(#lineV2)" strokeWidth="1.2" />
      <line x1="75%" y1="0" x2="75%" y2="100%" stroke="url(#lineV)"  strokeWidth="0.8" />
      {/* Glowing intersection dots */}
      <circle cx="25%" cy="33%" r="2.5" fill="#3B82F6" opacity="0.6" />
      <circle cx="50%" cy="33%" r="3"   fill="#60A5FA" opacity="0.8" />
      <circle cx="75%" cy="33%" r="2.5" fill="#3B82F6" opacity="0.6" />
      <circle cx="25%" cy="66%" r="2"   fill="#1D4ED8" opacity="0.5" />
      <circle cx="75%" cy="66%" r="2"   fill="#1D4ED8" opacity="0.5" />
    </svg>
  );
}

/* ─── HEXAGON DECORATION ────────────────────────────────────── */
function HexRing({ size, opacity, style }: { size: number; opacity: number; style?: React.CSSProperties }) {
  const r = size / 2;
  const points = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${r + r * Math.cos(a)},${r + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg width={size} height={size} className="absolute pointer-events-none" style={{ opacity, ...style }}>
      <polygon points={points} fill="none" stroke="rgba(96,165,250,0.5)" strokeWidth="1" />
    </svg>
  );
}

/* ─── MAIN COMPONENT ────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-navy-950 text-ice-100 overflow-x-hidden">
      <style>{`
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px) rotate(var(--rot, 0deg)); }
          50%       { transform: translateY(-12px) rotate(var(--rot, 0deg)); }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ticker-inner { animation: ticker 35s linear infinite; }
        @keyframes shimmerText {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .shimmer-text {
          background: linear-gradient(
            105deg,
            #ffffff 0%,
            #ffffff 40%,
            #1D4ED8 44%,
            #3B82F6 48%,
            #60A5FA 50%,
            #3B82F6 52%,
            #1D4ED8 56%,
            #ffffff 60%,
            #ffffff 100%
          );
          background-size: 400% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerText 10s linear infinite;
        }
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(37,99,235,0.3); box-shadow: 0 0 20px rgba(37,99,235,0.1); }
          50%       { border-color: rgba(96,165,250,0.5); box-shadow: 0 0 40px rgba(37,99,235,0.25); }
        }
        .border-pulse { animation: borderPulse 3s ease-in-out infinite; }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .count-up { animation: countUp 0.6s ease forwards; }
        @keyframes rotateHex {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .hex-rotate { animation: rotateHex 30s linear infinite; transform-origin: center; }
        @keyframes pingOnce {
          0%   { transform: scale(1);   opacity: 0.8; }
          70%  { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1);   opacity: 0; }
        }
        .live-dot::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: #3B82F6;
          animation: pingOnce 1.5s ease-out infinite;
        }
        @keyframes slideInLeft {
          from { opacity:0; transform: translateX(-30px); }
          to   { opacity:1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity:0; transform: translateX(30px); }
          to   { opacity:1; transform: translateX(0); }
        }
        .slide-left  { animation: slideInLeft  0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
        .slide-right { animation: slideInRight 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s forwards; }
      `}</style>

      <MouseGlow />

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? 'glass-nav shadow-nav' : 'bg-transparent border-b border-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg btn-primary flex items-center justify-center relative">
              <Zap size={14} fill="currentColor" className="text-white relative z-10" />
              <div className="absolute inset-0 rounded-lg bg-blue-400/20 animate-pulse" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Goal<span className="text-gradient">Storm</span>
            </span>
            <span className="hidden sm:block badge-blue text-[9px] ml-1">BETA</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="nav-link relative group">
                {l.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-blue-400 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/app')} className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium hidden sm:block">
              Prijavi se
            </button>
            <button onClick={() => navigate('/app')} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 relative overflow-hidden group">
              <span className="relative z-10 flex items-center gap-1.5">Počni besplatno <ArrowRight size={14} /></span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden">

        {/* Layered backgrounds */}
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 100% 80% at 50% 0%, #0F2040 0%, #02060F 60%)'}} />

        {/* LINE GRID — klasični plavi grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage:'linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)',
          backgroundSize:'48px 48px',
        }} />

        {/* Grid dot intersections — svetlije tačke na preseku */}
        <GridDots />
        <GlowLines />

        {/* BLUE GLOW — centralni snažan glow odozgo */}
        <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
          height:'65%',
          background:'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(37,99,235,0.45) 0%, rgba(29,78,216,0.15) 40%, transparent 70%)',
        }} />

        {/* Dodatni glow pojasevi */}
        <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
          height:'40%',
          background:'radial-gradient(ellipse 40% 35% at 50% 0%, rgba(96,165,250,0.25) 0%, transparent 100%)',
        }} />

        {/* Orbs — pojačani */}
        <div className="orb animate-orb-float"      style={{width:600,height:600,top:'0%',left:'5%',background:'radial-gradient(circle, rgba(37,99,235,0.5) 0%, transparent 65%)',filter:'blur(90px)'}} />
        <div className="orb animate-orb-float-slow" style={{width:500,height:500,top:'5%',right:'5%',background:'radial-gradient(circle, rgba(96,165,250,0.3) 0%, transparent 65%)',filter:'blur(110px)'}} />
        <div className="orb animate-orb-float"      style={{width:350,height:350,bottom:'10%',left:'20%',background:'radial-gradient(circle, rgba(29,78,216,0.35) 0%, transparent 70%)',filter:'blur(80px)',animationDelay:'2s'}} />
        {/* Center bottom glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{
          width:800,height:300,
          background:'radial-gradient(ellipse, rgba(37,99,235,0.2) 0%, transparent 70%)',
          filter:'blur(40px)',
        }} />

        {/* Hexagon decorations */}
        <HexRing size={300} opacity={0.06} style={{top:'8%',  right:'12%'}} />
        <HexRing size={180} opacity={0.08} style={{bottom:'20%',left:'8%'}} />
        <HexRing size={80}  opacity={0.12} style={{top:'60%', right:'25%'}} />

        {/* Rotating hex */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{opacity:0.03}}>
          <svg width="800" height="800" className="hex-rotate">
            <polygon points="400,50 700,225 700,575 400,750 100,575 100,225" fill="none" stroke="#3B82F6" strokeWidth="1"/>
            <polygon points="400,120 640,255 640,545 400,680 160,545 160,255" fill="none" stroke="#3B82F6" strokeWidth="0.5"/>
          </svg>
        </div>

        {/* Particle system */}
        <ParticleCanvas />

        {/* Scan line */}
        <div className="scan-line" />

        {/* Floating cards */}
        {FLOATING_CARDS.map((card, i) => (
          <FloatingCard key={i} card={card} />
        ))}

        {/* ── HERO CONTENT ── */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">

          {/* Live badge */}
          <div className="opacity-0 animate-fade-up inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8 border-pulse"
            style={{background:'rgba(5,13,28,0.8)',border:'1px solid rgba(37,99,235,0.3)',backdropFilter:'blur(12px)'}}>
            <span className="relative w-2 h-2 live-dot">
              <span className="w-2 h-2 rounded-full bg-blue-500 block" />
            </span>
            <span className="text-xs text-silver-300 font-medium tracking-wide">Platforma za fudbalske turnire</span>
            <span className="w-px h-3 bg-white/10" />
            <span className="text-xs text-blue-400 font-semibold">48 turnira aktivno</span>
          </div>

          {/* Main heading */}
          <h1 className="opacity-0 animate-fade-up-1 font-display leading-[0.92] tracking-tight mb-8">
            <span className="block text-6xl sm:text-7xl md:text-8xl font-bold text-white/90 mb-1">Organizuj.</span>
            <span className="block text-6xl sm:text-7xl md:text-8xl font-bold shimmer-text mb-1">Takmičite se.</span>
            <span className="block text-6xl sm:text-7xl md:text-8xl font-bold text-white/90">Pobedite.</span>
          </h1>

          {/* Subtext */}
          <p className="opacity-0 animate-fade-up-2 text-silver-400 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            Sve što ti treba za vođenje profesionalnih fudbalskih turnira —<br className="hidden sm:block" />
            ekipe, igrači, raspored, rezultati i statistike na jednom mestu.
          </p>

          {/* CTA row */}
          <div className="opacity-0 animate-fade-up-3 flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button
              onClick={() => navigate('/app')}
              className="btn-primary px-8 py-4 rounded-xl text-base font-semibold flex items-center gap-2 w-full sm:w-auto justify-center group"
            >
              <Zap size={16} fill="currentColor" />
              Počni besplatno
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/app')}
              className="btn-ghost px-8 py-4 rounded-xl text-base font-medium flex items-center gap-2 w-full sm:w-auto justify-center group"
            >
              <Play size={15} className="text-blue-400" />
              Pogledaj demo
            </button>
          </div>

          {/* Trust row */}
          <div className="opacity-0 animate-fade-up-3 flex items-center justify-center gap-5 mb-16 text-xs text-silver-600">
            {['Bez kreditne kartice','Besplatno zauvek','Setup za 2 minute'].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-blue-500" />
                {t}
              </span>
            ))}
          </div>

          {/* Stats strip */}
          <div className="opacity-0 animate-fade-up-4 inline-grid grid-cols-3 gap-px rounded-2xl overflow-hidden border border-white/8"
            style={{background:'rgba(5,13,28,0.85)',backdropFilter:'blur(20px)'}}>
            {STATS.slice(0,3).map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="px-8 py-5 text-center hover:bg-white/3 transition-colors">
                  <Icon size={14} className="text-blue-500 mx-auto mb-2 opacity-70" />
                  <div className="stat-num text-2xl sm:text-3xl text-white mb-1">{s.value}</div>
                  <div className="text-silver-600 text-[11px] whitespace-nowrap">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-navy-950 to-transparent pointer-events-none" />
      </section>

      {/* ── TICKER ──────────────────────────────────────────────── */}
      <Ticker />

      {/* ── SOCIAL PROOF ────────────────────────────────────────── */}
      <section className="py-16 relative">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-silver-600 text-xs uppercase tracking-widest mb-8">Veruju nam organizatori širom regiona</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {['FK Partizan','FK Crvena zvezda','FK Vojvodina','FK Spartak','FK Napredak','FK Mladost'].map(club => (
              <div key={club} className="flex items-center gap-2 text-silver-600 hover:text-silver-400 transition-colors">
                <Trophy size={13} className="text-blue-600/50" />
                <span className="text-sm font-medium">{club}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section id="features" className="py-32 relative overflow-hidden">
        <div className="orb" style={{width:500,height:500,top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)',filter:'blur(80px)'}} />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <div className="badge-blue inline-block mb-5">Funkcionalnosti</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-5">Sve na jednom mestu</h2>
            <p className="text-silver-400 text-lg max-w-xl mx-auto">GoalStorm pokriva svaki aspekt organizacije turnira, od prvog žreba do pobedničke ceremonije.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="relative rounded-2xl p-7 group cursor-default overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background:`linear-gradient(135deg, ${f.color} 0%, rgba(5,13,28,0.9) 100%)`,
                    border:`1px solid ${f.border}`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                >
                  {/* Corner glow */}
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{background:`radial-gradient(circle at top right, ${f.glow}, transparent 70%)`}} />

                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 relative"
                    style={{background:f.color, border:`1px solid ${f.border}`}}>
                    <Icon size={20} style={{color:f.iconColor}} />
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{boxShadow:`0 0 20px ${f.glow}`}} />
                  </div>

                  <h3 className="font-display text-lg font-semibold text-white mb-3 group-hover:text-gradient transition-all">{f.title}</h3>
                  <p className="text-silver-400 text-sm leading-relaxed">{f.desc}</p>

                  {/* Bottom shimmer on hover */}
                  <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{background:`linear-gradient(90deg, transparent, ${f.iconColor}60, transparent)`}} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────── */}
      <section id="stats" className="py-24 relative overflow-hidden">
        <div className="orb" style={{width:700,height:350,left:'50%',top:'50%',transform:'translate(-50%,-50%)',background:'radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)',filter:'blur(80px)'}} />
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <div
            className="rounded-3xl p-12 md:p-16 border-pulse"
            style={{background:'linear-gradient(135deg, rgba(15,32,64,0.7) 0%, rgba(5,13,28,0.9) 100%)',border:'1px solid rgba(37,99,235,0.2)',backdropFilter:'blur(20px)'}}
          >
            <div className="text-center mb-16">
              <div className="badge-blue inline-block mb-5">Brojke govore</div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">Platforma kojoj organizatori veruju</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
              {STATS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="text-center group">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600/20 transition-colors">
                      <Icon size={18} className="text-blue-400" />
                    </div>
                    <div className="stat-num text-4xl md:text-5xl text-gradient mb-2">{s.value}</div>
                    <div className="text-silver-500 text-sm">{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Bottom testimonial strip */}
            <div className="mt-14 pt-10 border-t border-white/6 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
              <div className="flex -space-x-2">
                {['M','N','S','A','D'].map((l,i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-navy-950 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{background:`hsl(${220+i*15},70%,45%)`}}>
                    {l}
                  </div>
                ))}
              </div>
              <div className="text-silver-400 text-center sm:text-left">
                <span className="text-white font-semibold">500+ organizatora</span> već koriste GoalStorm svaki dan
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_,i) => <Star key={i} size={13} fill="#F59E0B" className="text-amber-400" />)}
                <span className="text-silver-400 text-xs ml-1">4.9/5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────── */}
      <section id="pricing" className="py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="badge-blue inline-block mb-5">Cenovnik</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-5">Jednostavno, transparentno</h2>
            <p className="text-silver-400 text-lg">Počni besplatno. Nadogradi kad budeš spreman.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 ${plan.highlighted ? 'md:scale-105' : ''}`}
                style={plan.highlighted ? {
                  background:'linear-gradient(135deg, rgba(37,99,235,0.22) 0%, rgba(5,13,28,0.98) 100%)',
                  border:'1px solid rgba(96,165,250,0.35)',
                  boxShadow:'0 0 60px rgba(37,99,235,0.2), 0 1px 0 rgba(255,255,255,0.08) inset',
                } : {
                  background:'linear-gradient(135deg, rgba(15,32,64,0.5) 0%, rgba(5,13,28,0.85) 100%)',
                  border:'1px solid rgba(255,255,255,0.07)',
                }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-glow-sm">
                      Najpopularnije
                    </span>
                  </div>
                )}

                <div className="mb-7">
                  <div className="text-silver-500 text-sm font-medium mb-3">{plan.name}</div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-display text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-silver-500 text-sm">/{plan.sub}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm text-silver-400">
                      <CheckCircle2 size={14} className="text-blue-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/app')}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${plan.highlighted ? 'btn-primary' : 'btn-outline-blue'}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden">
        <div className="orb" style={{width:800,height:400,left:'50%',top:'50%',transform:'translate(-50%,-50%)',background:'radial-gradient(ellipse, rgba(37,99,235,0.18) 0%, transparent 70%)',filter:'blur(100px)'}} />
        <GridDots />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="badge-blue inline-flex items-center gap-2 mb-8">
            <Target size={11} />
            Krenimo zajedno
          </div>
          <h2 className="font-display text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Spreman za<br />
            <span className="shimmer-text">prvi turnir?</span>
          </h2>
          <p className="text-silver-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Pridruži se hiljadama organizatora koji koriste GoalStorm svaki dan.<br />
            Besplatno. Bez kreditne kartice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/app')}
              className="btn-primary px-10 py-4 rounded-xl text-base font-semibold inline-flex items-center gap-2 group"
            >
              <Zap size={16} fill="currentColor" />
              Počni sada — besplatno
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/app')}
              className="btn-ghost px-8 py-4 rounded-xl text-base font-medium inline-flex items-center gap-2"
            >
              <Award size={16} className="text-blue-400" />
              Pogledaj demo
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/5">
        <div className="divider-glow" />
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md btn-primary flex items-center justify-center">
                <Zap size={12} fill="currentColor" className="text-white" />
              </div>
              <span className="font-display font-bold text-white">GoalStorm</span>
              <span className="badge-blue text-[9px] ml-1">2025</span>
            </div>
            <div className="flex items-center gap-8">
              {NAV_LINKS.map(l => (
                <a key={l.label} href={l.href} className="text-silver-600 hover:text-silver-300 text-sm transition-colors">{l.label}</a>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-silver-700 text-xs">
              <Lock size={11} />
              © 2025 GoalStorm. Sva prava zadržana.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}