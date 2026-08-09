"use client"

import Link from 'next/link'
import { ArrowUpRight, Leaf, ExternalLink } from 'lucide-react'

// Simple GitHub SVG since lucide-react v1 doesn't export Github
function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}
import { useState, useEffect } from 'react'

// ── pixel-art inline styles ────────────────────────────────────────────────

const PIXEL_CARD: React.CSSProperties = {
  imageRendering: 'pixelated',
  border: '4px solid #18131a',
  boxShadow: '4px 4px 0 #18131a',
}

const PIXEL_BTN_GREEN: React.CSSProperties = {
  ...PIXEL_CARD,
  background: '#4a7c3f',
  color: '#f0e7cf',
  fontFamily: 'var(--font-geist-mono), monospace',
  letterSpacing: '.05em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'filter .15s',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 28px',
  fontSize: 13,
  fontWeight: 700,
}

const PIXEL_BTN_DARK: React.CSSProperties = {
  ...PIXEL_BTN_GREEN,
  background: '#18131a',
  border: '4px solid #4a7c3f',
  boxShadow: '4px 4px 0 #4a7c3f',
}

// ── creature mini-card ─────────────────────────────────────────────────────

function PixelCreature({ hue, size = 64, delay = 0, rot = 0 }: { hue: string; size?: number; delay?: number; rot?: number }) {
  return (
    <div
      className="landing-creature"
      style={{
        width: size,
        height: size,
        background: hue,
        animationDelay: `${delay}s`,
        transform: `rotate(${rot}deg)`,
        position: 'relative',
      }}
    >
      {/* eyes */}
      <div style={{ position: 'absolute', top: '22%', left: '28%', width: '28%', height: '28%', background: '#fbf6e6', borderRadius: '50%', border: '3px solid #18131a' }} />
      <div style={{ position: 'absolute', top: '22%', right: '18%', width: '22%', height: '22%', background: '#fbf6e6', borderRadius: '50%', border: '3px solid #18131a' }} />
      <div style={{ position: 'absolute', top: '26%', left: '32%', width: '12%', height: '12%', background: '#18131a', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: '24%', right: '22%', width: '10%', height: '10%', background: '#18131a', borderRadius: '50%' }} />
      {/* antenna */}
      <div style={{ position: 'absolute', top: '-18%', left: '38%', width: '10%', height: '22%', background: hue, border: '2px solid #18131a' }} />
      <div style={{ position: 'absolute', top: '-24%', left: '35%', width: '16%', height: '10%', background: '#f2d584', border: '2px solid #18131a' }} />
    </div>
  )
}

// ── food pellet ────────────────────────────────────────────────────────────
function FoodPellet({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ width: 14, height: 14, background: '#db8e2d', border: '3px solid #18131a', boxShadow: '2px 2px 0 #18131a', imageRendering: 'pixelated', ...style }} />
  )
}

// ── pixel tree ─────────────────────────────────────────────────────────────
function PixelTree({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'absolute', ...style }}>
      <div style={{ width: 24, height: 22, background: '#588238', border: '4px solid #243c23', borderRadius: '45% 45% 20% 20%', imageRendering: 'pixelated' }} />
      <div style={{ width: 8, height: 8, background: '#65462c', margin: '-2px auto 0', border: '3px solid #243c23' }} />
    </div>
  )
}

// ── tick-style animated counter ────────────────────────────────────────────
function Counter({ to, duration = 2000 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration)
      setVal(Math.floor(p * to))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [to, duration])
  return <span>{val.toLocaleString()}</span>
}

// ─── main component ──────────────────────────────────────────────────────

export function LandingPage() {
  const [tick, setTick] = useState(0)
  const [hoveredNote, setHoveredNote] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    const id = setInterval(() => setTick(t => t + 1), 2000)
    return () => clearInterval(id)
  }, [])

  const creatures = [
    { hue: '#9b4cca', rot: -14, delay: 0 },
    { hue: '#d95aa4', rot: 8, delay: -2 },
    { hue: '#5b7fcf', rot: -5, delay: -4 },
  ]

  return (
    <main className="min-h-screen" style={{ background: '#0d1117', color: '#f0e7cf', overflowX: 'hidden' }}>

      {/* ══════ NAV ══════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(13,17,23,.92)',
        borderBottom: '3px solid #18131a',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 3px 0 #1e3a1a',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{
              width: 38, height: 38, background: '#31572d', border: '3px solid #18131a',
              boxShadow: '3px 3px 0 #18131a', display: 'grid', placeItems: 'center',
              imageRendering: 'pixelated',
            }}>
              <Leaf size={18} color="#b1d36c" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-geist-mono),monospace', fontWeight: 700, fontSize: 20, letterSpacing: '-.02em', lineHeight: 1, color: '#f0e7cf' }}>petri</div>
              <div style={{ fontFamily: 'var(--font-geist-mono),monospace', fontSize: 9, letterSpacing: '.2em', color: '#b1d36c', textTransform: 'uppercase', marginTop: 2 }}>a living world</div>
            </div>
          </Link>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a href="https://github.com/sanyamhbtu/Petri_A-Living-World" target="_blank" rel="noopener noreferrer"
              style={{ ...PIXEL_BTN_DARK, padding: '10px 18px', fontSize: 11 }}>
              <GithubIcon size={15} /> GitHub
            </a>
            <Link href="/playground" style={{ ...PIXEL_BTN_GREEN, padding: '10px 20px', fontSize: 11, textDecoration: 'none' }}>
              Play now <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════ HERO ══════ */}
      <section
        className="field-grid"
        style={{
          position: 'relative', minHeight: '92vh',
          overflow: 'hidden', isolation: 'isolate',
          opacity: visible ? 1 : 0, transition: 'opacity .6s',
        }}
      >
        {/* dither overlay */}
        <div className="field-dither" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

        {/* soil patches */}
        <div className="field-patch patch-one" style={{ borderRadius: 0 }} />
        <div className="field-patch patch-two" style={{ borderRadius: 0 }} />

        {/* trees */}
        <PixelTree style={{ top: '18%', left: '9%' }} />
        <PixelTree style={{ top: '62%', left: '73%' }} />
        <PixelTree style={{ bottom: '12%', left: '48%', transform: 'scale(.75)' }} />
        <PixelTree style={{ top: '8%', right: '14%' }} />

        {/* food pellets scattered */}
        {[{ top: '38%', left: '22%' }, { top: '58%', right: '34%' }, { top: '24%', right: '28%' }, { bottom: '28%', left: '36%' }, { top: '70%', left: '60%' }].map((pos, i) => (
          <FoodPellet key={i} style={{ position: 'absolute', ...pos, transform: tick % 2 === i % 2 ? 'scale(1.2)' : 'scale(1)', transition: 'transform .4s' }} />
        ))}

        {/* floating creatures */}
        <div className="creature-one" style={{ position: 'absolute', top: '36%', left: '41%' }}>
          <PixelCreature hue="#9b4cca" size={80} rot={-14} />
        </div>
        <div style={{ position: 'absolute', top: '22%', right: '18%' }}>
          <PixelCreature hue="#d95aa4" size={56} delay={-2} rot={10} />
        </div>
        <div style={{ position: 'absolute', bottom: '22%', left: '13%' }}>
          <PixelCreature hue="#5b7fcf" size={62} delay={-4} rot={-6} />
        </div>
        <div style={{ position: 'absolute', top: '55%', right: '8%' }}>
          <PixelCreature hue="#3db87a" size={44} delay={-6} rot={15} />
        </div>

        {/* ── hero text ── */}
        <div style={{
          position: 'relative', zIndex: 2, maxWidth: 700,
          margin: '0 auto', padding: '12vh 24px 8vh',
          textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          {/* badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(13,17,23,.7)', border: '3px solid #31572d',
            boxShadow: '3px 3px 0 #18131a', padding: '6px 16px', marginBottom: 32,
            fontFamily: 'var(--font-geist-mono),monospace', fontSize: 10,
            letterSpacing: '.22em', textTransform: 'uppercase', color: '#b1d36c',
            backdropFilter: 'blur(6px)',
          }}>
            <span style={{ width: 8, height: 8, background: '#b1d36c', display: 'inline-block', animation: 'field-drift 1.5s ease-in-out infinite alternate', boxShadow: '0 0 8px #b1d36c' }} />
            open source · always on · live ecosystem
          </div>

          {/* title */}
          <h1 style={{
            fontFamily: 'var(--font-geist-mono),monospace',
            fontSize: 'clamp(42px, 7vw, 86px)',
            fontWeight: 900, lineHeight: 1.05,
            letterSpacing: '-.04em', margin: '0 0 24px',
            color: '#f0e7cf',
            textShadow: '4px 6px 0 rgba(0,0,0,.55)',
          }}>
            A world that<br />
            <span style={{ color: '#b1d36c', textShadow: '4px 6px 0 rgba(24,90,30,.6)' }}>never stops.</span>
          </h1>

          {/* description */}
          <p style={{
            maxWidth: 560, fontSize: 18, lineHeight: 1.75,
            color: '#c8bfa8', marginBottom: 40, fontWeight: 400,
          }}>
            Petri is a living pixel-art world. Tiny <strong style={{ color: '#d98b8b' }}>Mosslings</strong> wander a shared meadow —
            they eat, they starve, they reproduce, and they die. It's alive 24/7, shared by everyone, powered by real data.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/playground" style={{ ...PIXEL_BTN_GREEN, textDecoration: 'none', fontSize: 14, padding: '16px 36px' }}
              onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.15)')}
              onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
            >
              Enter the world <ArrowUpRight size={18} />
            </Link>
            <a href="https://github.com/sanyamhbtu/Petri_A-Living-World" target="_blank" rel="noopener noreferrer"
              style={{ ...PIXEL_BTN_DARK, textDecoration: 'none', fontSize: 14, padding: '16px 36px' }}
              onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.3)')}
              onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
            >
              <GithubIcon size={18} /> Star on GitHub
            </a>
          </div>

          {/* live stats */}
          <div style={{
            marginTop: 52, display: 'flex', gap: 0, flexWrap: 'wrap', justifyContent: 'center',
            border: '3px solid #18131a', boxShadow: '4px 4px 0 #18131a',
            background: 'rgba(13,17,23,.8)', backdropFilter: 'blur(8px)',
          }}>
            {[
              { label: 'Creatures Alive', val: 24, color: '#b1d36c' },
              { label: 'Total Births', val: 1842, color: '#d98b8b' },
              { label: 'Meals Eaten', val: 9312, color: '#f4bf50' },
              { label: 'Days Running', val: 7, color: '#7fc1e8' },
            ].map((s, i) => (
              <div key={s.label} style={{
                padding: '20px 32px', textAlign: 'center',
                borderRight: i < 3 ? '3px solid #18131a' : 'none',
              }}>
                <div style={{ fontFamily: 'var(--font-geist-mono),monospace', fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>
                  <Counter to={s.val} duration={1800 + i * 200} />
                </div>
                <div style={{ fontFamily: 'var(--font-geist-mono),monospace', fontSize: 10, letterSpacing: '.18em', color: '#8a8070', textTransform: 'uppercase', marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ "WHAT IS PETRI?" STRIP ══════ */}
      <section style={{ background: '#0d1117', borderTop: '4px solid #18131a', borderBottom: '4px solid #18131a' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '90px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 2 }}>
          {[
            {
              icon: '🌱',
              title: 'Feed Them',
              body: 'Click anywhere in the world to drop food pellets. Creatures will smell it, path towards it, and eat. A well-fed colony explodes in size.',
              color: '#b1d36c',
            },
            {
              icon: '💀',
              title: 'They Die',
              body: 'Starve a creature of food and it will lose energy over ~5 real days. Overpopulation chokes supply. Nature is ruthless — every death is logged.',
              color: '#ef4444',
            },
            {
              icon: '💞',
              title: 'They Reproduce',
              body: 'Two fed adults that meet will pair and produce a child — inheriting a blend of their colours, speeds, and sizes, with small random mutations.',
              color: '#d95aa4',
            },
            {
              icon: '🌍',
              title: 'It\'s One World',
              body: 'Every visitor shares the same living simulation. What you do ripples for everyone. Leave food; change the population curve for real.',
              color: '#7fc1e8',
            },
          ].map((card, i) => (
            <div key={i}
              onMouseEnter={() => setHoveredNote(i)}
              onMouseLeave={() => setHoveredNote(null)}
              style={{
                padding: '40px 32px',
                border: '4px solid #18131a',
                background: hoveredNote === i ? '#1a2510' : '#12181f',
                borderLeft: i === 0 ? '4px solid #18131a' : '2px solid #18131a',
                transition: 'background .2s',
                cursor: 'default',
              }}>
              <div style={{ fontSize: 36, marginBottom: 20, lineHeight: 1 }}>{card.icon}</div>
              <h3 style={{
                fontFamily: 'var(--font-geist-mono),monospace', fontWeight: 800,
                fontSize: 19, color: card.color, letterSpacing: '-.02em',
                margin: '0 0 14px', textShadow: `2px 2px 0 rgba(0,0,0,.4)`,
              }}>{card.title}</h3>
              <p style={{ color: '#9a8f7c', fontSize: 15, lineHeight: 1.7, margin: 0 }}>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════ HOW IT WORKS ══════ */}
      <section style={{ background: '#0a0d12', padding: '100px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          {/* heading */}
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{
              display: 'inline-block',
              fontFamily: 'var(--font-geist-mono),monospace', fontSize: 10,
              letterSpacing: '.28em', textTransform: 'uppercase', color: '#b1d36c',
              background: 'rgba(49,87,45,.25)', border: '3px solid #31572d',
              padding: '6px 18px', marginBottom: 24, boxShadow: '2px 2px 0 #18131a',
            }}>Field Study</div>
            <h2 style={{
              fontFamily: 'var(--font-geist-mono),monospace', fontSize: 'clamp(32px,5vw,56px)',
              fontWeight: 900, letterSpacing: '-.04em', margin: '0 0 20px',
              color: '#f0e7cf', textShadow: '3px 4px 0 rgba(0,0,0,.5)',
            }}>The Lifecycle of a Mossling</h2>
            <p style={{ color: '#9a8f7c', fontSize: 17, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              Everything in Petri follows one rule: survive long enough to pass your traits on. Easier said than done.
            </p>
          </div>

          {/* timeline steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { step: '01', hue: '#b1d36c', label: 'Birth', desc: 'A newborn Mossling enters the world at the midpoint between its two parents. It inherits a blend of their hue, scale, and speed — with a small random mutation applied.', creature: '#9b4cca' },
              { step: '02', hue: '#f4bf50', label: 'Wander & Seek', desc: 'The Mossling wanders the meadow. When food is within 680 world units, it pivots and hunts it down. Eating restores 42 energy. A full battery = 100 energy.', creature: '#3db87a' },
              { step: '03', hue: '#d98b8b', label: 'Hunger', desc: 'Energy drains passively — a full creature survives ~5 real days without eating. Moving burns more. Faster Mosslings live harder. When energy hits zero, they\'re gone.', creature: '#d95aa4' },
              { step: '04', hue: '#7fc1e8', label: 'Reproduction', desc: 'Once mature (12 hrs real time), a well-fed Mossling (60+ energy) will pair with a nearby partner. Both spend 22 energy. A child is born at the midpoint. Cooldown: 12 hrs.', creature: '#5b7fcf' },
              { step: '05', hue: '#ef4444', label: 'Death', desc: 'Die by starvation, extreme old age (30 real days), or just bad luck. Every death is logged in the Field Notes panel. The world absorbs the loss and keeps going.', creature: '#8052d1' },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '60px 1fr',
                borderTop: i === 0 ? '3px solid #18131a' : '2px solid #1e2a1e',
                padding: '36px 0', gap: 36, alignItems: 'center',
              }}>
                <div style={{
                  fontFamily: 'var(--font-geist-mono),monospace', fontSize: 13,
                  fontWeight: 900, color: row.hue, letterSpacing: '.08em',
                  textAlign: 'center',
                  textShadow: `0 0 20px ${row.hue}60`,
                }}>
                  {row.step}
                </div>
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, marginTop: 4 }}>
                    <PixelCreature hue={row.creature} size={48} />
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-geist-mono),monospace', fontWeight: 800,
                      fontSize: 17, color: row.hue, marginBottom: 10, letterSpacing: '-.01em',
                    }}>{row.label}</div>
                    <p style={{ color: '#9a8f7c', fontSize: 15, lineHeight: 1.7, margin: 0 }}>{row.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CONTRIBUTE + OPEN SOURCE ══════ */}
      <section className="field-grid" style={{ position: 'relative', padding: '100px 24px', isolation: 'isolate' }}>
        <div className="field-dither" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
        <div className="field-patch" style={{ position: 'absolute', top: '20%', right: '5%', width: '12%', height: '60%', borderRadius: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 32, alignItems: 'center' }}>
          {/* text */}
          <div>
            <div style={{
              fontFamily: 'var(--font-geist-mono),monospace', fontSize: 10, letterSpacing: '.28em',
              textTransform: 'uppercase', color: '#b1d36c',
              background: 'rgba(13,17,23,.7)', border: '3px solid #31572d',
              display: 'inline-block', padding: '6px 16px', marginBottom: 24,
              boxShadow: '2px 2px 0 #18131a',
            }}>Open Source</div>

            <h2 style={{
              fontFamily: 'var(--font-geist-mono),monospace', fontSize: 'clamp(28px,4vw,48px)',
              fontWeight: 900, letterSpacing: '-.04em',
              color: '#f0e7cf', textShadow: '3px 4px 0 rgba(0,0,0,.5)',
              margin: '0 0 20px',
            }}>
              Contribute to<br /><span style={{ color: '#b1d36c' }}>the living world.</span>
            </h2>

            <p style={{ color: '#9a8f7c', fontSize: 16, lineHeight: 1.75, marginBottom: 32 }}>
              Petri is fully open source. The simulation engine, real-time WebSocket server, Postgres snapshot layer —
              all of it is on GitHub and waiting for your pull request. Add a new species. Tweak the food mechanics.
              Make the creatures smarter.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { text: '⚡ Next.js 16 + TypeScript + Tailwind CSS v4' },
                { text: '🔌 WebSocket real-time sync — 50ms tick rate' },
                { text: '🗄️ PostgreSQL + Upstash Redis snapshot layer' },
                { text: '🎮 Canvas pixel-art renderer, zero dependencies' },
                { text: '🚀 Deployed on Zerops — always-on infrastructure' },
              ].map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'rgba(13,17,23,.75)', border: '3px solid #18131a',
                  padding: '12px 16px', boxShadow: '2px 2px 0 #18131a',
                  backdropFilter: 'blur(6px)',
                }}>
                  <span style={{ fontFamily: 'var(--font-geist-mono),monospace', fontSize: 13, color: '#c8bfa8' }}>{f.text}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 14, marginTop: 36, flexWrap: 'wrap' }}>
              <a href="https://github.com/sanyamhbtu/Petri_A-Living-World" target="_blank" rel="noopener noreferrer"
                style={{ ...PIXEL_BTN_GREEN, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.15)')}
                onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
              >
                <GithubIcon size={17} /> View on GitHub
              </a>
              <a href="https://zerops.io" target="_blank" rel="noopener noreferrer"
                style={{ ...PIXEL_BTN_DARK, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.3)')}
                onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
              >
                <ExternalLink size={17} /> Zerops
              </a>
            </div>
          </div>

          {/* mini-world showcase */}
          <div style={{
            ...PIXEL_CARD,
            background: '#31572d',
            position: 'relative', height: 400, overflow: 'hidden',
          }}>
            <div className="field-dither" style={{ position: 'absolute', inset: 0 }} />
            <div className="field-patch" style={{ position: 'absolute', right: 0, bottom: 0, width: '40%', height: '35%' }} />
            <PixelTree style={{ top: '8%', left: '10%' }} />
            <PixelTree style={{ top: '14%', right: '16%', transform: 'scale(.8)' }} />
            <FoodPellet style={{ position: 'absolute', top: '38%', left: '28%' }} />
            <FoodPellet style={{ position: 'absolute', top: '60%', right: '22%' }} />
            <FoodPellet style={{ position: 'absolute', top: '22%', left: '55%' }} />
            <div style={{ position: 'absolute', top: '38%', left: '35%' }}>
              <PixelCreature hue="#9b4cca" size={68} rot={-12} />
            </div>
            <div style={{ position: 'absolute', top: '55%', right: '25%' }}>
              <PixelCreature hue="#d95aa4" size={50} delay={-2} rot={8} />
            </div>
            <div style={{ position: 'absolute', top: '20%', left: '15%' }}>
              <PixelCreature hue="#3db87a" size={40} delay={-5} rot={-4} />
            </div>
            {/* caption */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'rgba(13,17,23,.82)', padding: '14px 18px',
              borderTop: '3px solid #18131a', backdropFilter: 'blur(8px)',
              fontFamily: 'var(--font-geist-mono),monospace', fontSize: 10,
              letterSpacing: '.18em', textTransform: 'uppercase', color: '#b1d36c',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 7, height: 7, background: '#b1d36c', display: 'inline-block', boxShadow: '0 0 8px #b1d36c', animation: 'field-drift 1.5s ease-in-out infinite alternate' }} />
              Live simulation — zerops hosted
            </div>
          </div>
        </div>
      </section>

      {/* ══════ ZEROPS CALLOUT ══════ */}
      <section style={{ background: '#0d1117', borderTop: '4px solid #18131a', padding: '80px 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: '#0a0d12', border: '4px solid #18131a',
            boxShadow: '4px 4px 0 #18131a', padding: '24px 36px', marginBottom: 40,
            fontFamily: 'var(--font-geist-mono),monospace',
          }}>
            <span style={{ fontSize: 28 }}>⚡</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: '#7fc1e8', marginBottom: 4 }}>Powered by</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#f0e7cf', letterSpacing: '-.02em' }}>Zerops</div>
            </div>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-geist-mono),monospace', fontSize: 'clamp(26px,4vw,44px)',
            fontWeight: 900, letterSpacing: '-.04em', color: '#f0e7cf',
            textShadow: '3px 4px 0 rgba(0,0,0,.5)', margin: '0 0 20px',
          }}>Always alive. Zero babysitting.</h2>
          <p style={{ color: '#9a8f7c', fontSize: 16, lineHeight: 1.75, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            Petri runs 24/7 on <strong style={{ color: '#7fc1e8' }}>Zerops</strong> — a developer-focused cloud platform.
            No manual deploys, no sleep modes. The WebSocket server, Postgres, and Redis all stay hot so Mosslings
            never stop moving.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <a href="https://zerops.io" target="_blank" rel="noopener noreferrer"
              style={{ ...PIXEL_BTN_GREEN, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.15)')}
              onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
            >
              Try Zerops free <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ══════ FINAL CTA ══════ */}
      <section className="field-grid" style={{ position: 'relative', padding: '100px 24px', textAlign: 'center', isolation: 'isolate' }}>
        <div className="field-dither" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
        <div className="field-patch" style={{ position: 'absolute', bottom: 0, left: '15%', width: '70%', height: '30%', opacity: .5 }} />
        {creatures.map((c, i) => (
          <div key={i} style={{ position: 'absolute', left: ['20%','50%','76%'][i], top: ['60%','30%','55%'][i] }}>
            <PixelCreature hue={c.hue} size={[52,72,44][i]} delay={c.delay} rot={c.rot} />
          </div>
        ))}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontFamily: 'var(--font-geist-mono),monospace', fontSize: 'clamp(32px,5vw,64px)',
            fontWeight: 900, letterSpacing: '-.04em', color: '#f0e7cf',
            textShadow: '4px 6px 0 rgba(0,0,0,.55)', margin: '0 0 20px',
          }}>Ready to enter?</h2>
          <p style={{ color: '#9a8f7c', fontSize: 17, maxWidth: 480, margin: '0 auto 48px', lineHeight: 1.7 }}>
            Drop some food. Watch the chaos. The world is already running — and it could use one more visitor.
          </p>
          <Link href="/playground"
            style={{ ...PIXEL_BTN_GREEN, textDecoration: 'none', fontSize: 15, padding: '18px 44px' }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.15)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
          >
            Open the world <ArrowUpRight size={20} />
          </Link>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer style={{
        background: '#0a0d12', borderTop: '4px solid #18131a',
        padding: '28px 24px',
        display: 'flex', flexWrap: 'wrap', gap: 16,
        alignItems: 'center', justifyContent: 'space-between',
        maxWidth: '100%',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-geist-mono),monospace', fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', color: '#4a6a44' }}>
          <Leaf size={14} color="#4a6a44" /> Petri · a living world · open source · MIT
        </span>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontFamily: 'var(--font-geist-mono),monospace', fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: '#4a6a44' }}>
          <a href="https://github.com/sanyamhbtu/Petri_A-Living-World" target="_blank" rel="noopener noreferrer" style={{ color: '#4a6a44', textDecoration: 'none' }}>GitHub ↗</a>
          <a href="https://zerops.io" target="_blank" rel="noopener noreferrer" style={{ color: '#4a6a44', textDecoration: 'none' }}>Zerops</a>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, background: '#4a6a44', display: 'inline-block' }} />
            built for slow observation
          </span>
        </div>
      </footer>
    </main>
  )
}
