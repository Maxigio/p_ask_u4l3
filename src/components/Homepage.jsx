import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const CARDS = [
  {
    path: '/prossima-stagione',
    label: 'Prossima Stagione',
    desc: 'Il piano produzione Aprile → Settembre 2025.',
  },
  {
    path: '/backend',
    label: 'Backend',
    desc: 'Il database che governa la stagione. Cinque query, dati reali.',
  },
  {
    path: '/alzare-il-livello',
    label: 'Alzare il Livello',
    desc: 'Stack, automazioni, filosofia di lavoro.',
  },
]

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

export default function Homepage() {
  const navigate = useNavigate()

  return (
    <div
      style={{ background: 'var(--bg)', minHeight: '100vh' }}
      className="flex flex-col items-center justify-center px-6 py-16"
    >
      {/* Sitename */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mono mb-20 tracking-widest text-xs"
        style={{ color: 'var(--text-muted)', letterSpacing: '0.2em' }}
      >
        p_ask_u4l3
      </motion.p>

      {/* Navigation cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-lg flex flex-col gap-3"
      >
        {CARDS.map((card) => (
          <motion.button
            key={card.path}
            variants={item}
            onClick={() => navigate(card.path)}
            className="group text-left w-full px-8 py-7 rounded-lg transition-all duration-200"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
            }}
            whileHover={{
              borderColor: 'var(--text-muted)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}
          >
            <div
              className="text-lg font-medium mb-1"
              style={{ color: 'var(--text)' }}
            >
              {card.label}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {card.desc}
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}
