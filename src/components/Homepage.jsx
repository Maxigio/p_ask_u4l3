import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

function useWindowWidth() {
  const [w, setW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024)
  useEffect(() => {
    const handler = () => setW(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return w
}

const CARDS = [
  {
    path: '/prossima-stagione',
    index: '01',
    label: 'Prossima Stagione',
    desc: 'Il piano di produzione Aprile → Settembre 2026.',
    color: '#C8622A',
  },
  {
    path: '/analytics',
    index: '02',
    label: 'Analytics',
    desc: 'Il database che governa la stagione. Tra query, dati realistici.',
    color: '#2D4A7A',
  },
  {
    path: '/alzare-il-livello',
    index: '03',
    label: 'Alzare il Livello',
    desc: 'Quattro traguardi reali raggiunti.',
    color: '#3A6B4A',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

export default function Homepage() {
  const navigate = useNavigate()
  const w = useWindowWidth()
  const sm = w < 480
  const md = w < 768

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Accent bar */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #C8622A 0%, #B8860B 50%, #2D4A7A 100%)', flexShrink: 0 }} />

      {/* Contenuto centrato verticalmente */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: sm ? '32px 16px 44px' : md ? '40px 20px 52px' : '48px 24px 64px',
      }}>

        {/* Header identità */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: sm ? 28 : md ? 36 : 48 }}
        >
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            Ciao
          </p>

          <div style={{
            fontSize: sm ? 24 : md ? 30 : 36,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--text)',
            lineHeight: 1,
            marginBottom: 14,
            fontFamily: 'var(--font-mono)',
          }}>
            Pasquale
          </div>

          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
          }}>
            Spero vada tutto bene!
          </p>
        </motion.div>

        {/* Card navigation */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{
            width: '100%',
            maxWidth: 520,
            display: 'flex',
            flexDirection: 'column',
            gap: sm ? 8 : md ? 10 : 12,
          }}
        >
          {CARDS.map((card) => (
            <motion.button
              key={card.path}
              variants={item}
              onClick={() => navigate(card.path)}
              style={{
                width: '100%',
                background: card.color,
                border: `1px solid ${card.color}`,
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'center',
                overflow: 'hidden',
                transition: 'opacity 150ms, transform 150ms, box-shadow 150ms',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = '0.88'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = `0 8px 32px ${card.color}50`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Body card */}
              <div style={{
                padding: sm ? '16px 16px 20px' : md ? '18px 20px 22px' : '20px 24px 24px',
              }}>
                {/* Index + arrow centrati */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  marginBottom: 10,
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.7)',
                    letterSpacing: '0.06em',
                  }}>
                    {card.index}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1,
                  }}>
                    →
                  </span>
                </div>

                <div style={{
                  fontSize: sm ? 16 : md ? 17 : 18,
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: '-0.01em',
                  marginBottom: 5,
                  lineHeight: 1.2,
                }}>
                  {card.label}
                </div>

                <div style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.75)',
                  lineHeight: 1.5,
                }}>
                  {card.desc}
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
