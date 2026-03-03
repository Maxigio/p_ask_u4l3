import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const CARDS = [
  {
    path: '/prossima-stagione',
    index: '01',
    label: 'Prossima Stagione',
    desc: 'Il piano produzione Aprile → Settembre 2026.',
    color: '#C8622A',
  },
  {
    path: '/analytics',
    index: '02',
    label: 'Analytics',
    desc: 'Il database che governa la stagione. Tre query, dati reali.',
    color: '#2D4A7A',
  },
  {
    path: '/alzare-il-livello',
    index: '03',
    label: 'Alzare il Livello',
    desc: 'Stack, automazioni, filosofia di lavoro.',
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

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Accent bar — identico a ProssimaStagione */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #C8622A 0%, #B8860B 50%, #2D4A7A 100%)', flexShrink: 0 }} />

      {/* Contenuto centrato verticalmente */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px 64px',
      }}>

        {/* Header identità */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: 48 }}
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
            fontSize: 36,
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
            gap: 12,
          }}
        >
          {CARDS.map((card) => (
            <motion.button
              key={card.path}
              variants={item}
              onClick={() => navigate(card.path)}
              style={{
                width: '100%',
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
                overflow: 'hidden',
                transition: 'transform 150ms, box-shadow 150ms, border-color 150ms',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)'
                e.currentTarget.style.borderColor = `${card.color}50`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              {/* Top accent bar in colore sezione */}
              <div style={{ height: 3, background: card.color }} />

              {/* Body card */}
              <div style={{ padding: '18px 22px 20px', textAlign: 'center' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 600,
                    color: card.color,
                    letterSpacing: '0.06em',
                  }}>
                    {card.index}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    color: card.color,
                    lineHeight: 1,
                    marginTop: 1,
                  }}>
                    →
                  </span>
                </div>

                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--text)',
                  letterSpacing: '-0.01em',
                  marginBottom: 5,
                  lineHeight: 1.2,
                }}>
                  {card.label}
                </div>

                <div style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
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
