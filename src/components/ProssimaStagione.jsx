import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDatabase } from '../hooks/useDatabase'
import { runQuery } from '../utils/queryDb'

function useWindowWidth() {
  const [w, setW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024)
  useEffect(() => {
    const handler = () => setW(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return w
}

const TIPO_COLORS = {
  riprese:   { bg: '#C8622A', light: '#FEF0E8', label: 'Riprese' },
  montaggio: { bg: '#2D4A7A', light: '#EBF0F9', label: 'Montaggio' },
  archivio:  { bg: '#3A6B4A', light: '#EBF4EE', label: 'Archivio' },
  call:      { bg: '#6B3FA0', light: '#F2EEFA', label: 'Call' },
  jolly:     { bg: '#B8860B', light: '#FBF5E0', label: 'Jolly' },
  vacanza:   { bg: '#9B9B93', light: '#F4F4F2', label: 'Vacanza' },
}

const MESI = [
  { num: '2026-04', breve: 'Apr', nome: 'Aprile' },
  { num: '2026-05', breve: 'Mag', nome: 'Maggio' },
  { num: '2026-06', breve: 'Giu', nome: 'Giugno' },
  { num: '2026-07', breve: 'Lug', nome: 'Luglio' },
  { num: '2026-08', breve: 'Ago', nome: 'Agosto' },
  { num: '2026-09', breve: 'Set', nome: 'Settembre' },
]

const GIORNI_LABEL = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

function generateMonthCells(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  const totalDays = lastDay.getDate()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) {
    const mm = String(month).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    cells.push(`${year}-${mm}-${dd}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const SQL_ATTIVITA = `
SELECT a.id, a.data, a.tipo_giorno, a.ore_shooting, a.ore_montaggio,
       a.presenza_inizio, a.presenza_fine, a.orario_inizio, a.orario_fine,
       a.tipo_orario, a.note,
       t.nome as tipo_nome, t.categoria, t.piattaforma,
       r.nome as referente_nome, r.ruolo as referente_ruolo,
       s.data_inizio as sett_inizio, s.data_fine as sett_fine
FROM attivita a
LEFT JOIN tipologie_contenuto t ON a.tipologia_contenuto_id = t.id
LEFT JOIN referenti r ON a.referente_id = r.id
LEFT JOIN settimane s ON a.settimana_id = s.id
ORDER BY a.data, a.id
`

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
}

export default function ProssimaStagione() {
  const navigate = useNavigate()
  const { db, loading, error } = useDatabase()
  const [activeFilters, setActiveFilters] = useState(new Set(Object.keys(TIPO_COLORS)))
  const [selectedDay, setSelectedDay] = useState(null)
  const [modalActs, setModalActs] = useState([])
  const [currentMonthIdx, setCurrentMonthIdx] = useState(0)
  const [direction, setDirection] = useState(1)

  const w = useWindowWidth()
  const xs = w < 360
  const sm = w < 480
  const md = w < 768

  const actsByDate = useMemo(() => {
    if (!db) return {}
    const rows = runQuery(db, SQL_ATTIVITA)
    const map = {}
    for (const r of rows) {
      if (!map[r.data]) map[r.data] = []
      map[r.data].push(r)
    }
    return map
  }, [db])

  function goToMonth(idx) {
    let dir
    if (idx === 0 && currentMonthIdx === MESI.length - 1) {
      dir = 1   // wrap forward: settembre → aprile
    } else if (idx === MESI.length - 1 && currentMonthIdx === 0) {
      dir = -1  // wrap backward: aprile → settembre
    } else {
      dir = idx >= currentMonthIdx ? 1 : -1
    }
    setDirection(dir)
    setCurrentMonthIdx(idx)
    setSelectedDay(null)
  }

  function toggleFilter(tipo) {
    setActiveFilters(prev => {
      const next = new Set(prev)
      next.has(tipo) ? next.delete(tipo) : next.add(tipo)
      return next
    })
  }

  function handleDayClick(dateStr) {
    const acts = (actsByDate[dateStr] || []).filter(a => activeFilters.has(a.tipo_giorno))
    if (!acts.length) return
    setSelectedDay(dateStr)
    setModalActs(acts)
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState msg={error.message} />

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Accent bar top */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #C8622A 0%, #B8860B 50%, #2D4A7A 100%)' }} />

      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: sm ? '24px 16px 28px' : md ? '28px 24px 32px' : '32px 40px 40px' }}>

          {/* Back */}
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-muted)', background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, marginBottom: 32,
              opacity: 0.7, transition: 'opacity 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
          >
            ← HUB
          </button>

          {/* Centered title block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ textAlign: 'center' }}
          >
            {/* Eyebrow */}
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-muted)', letterSpacing: '0.08em',
              marginBottom: 16, lineHeight: 1.5,
            }}>
              cercando di non essere un{' '}
              <span style={{ color: '#C8622A', fontWeight: 700 }}>AVG(videomaker)</span>
              {' '}ho provato a immaginare cosa ci si aspetta da me per la...
            </p>

            <h1 style={{
              fontSize: sm ? 28 : md ? 36 : 48, fontWeight: 700, lineHeight: 1.1,
              color: 'var(--text)', marginBottom: 14, letterSpacing: '-0.02em',
            }}>
              Prossima Stagione
            </h1>

            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-muted)', letterSpacing: '0.08em',
              lineHeight: 1.5, maxWidth: sm ? '100%' : 520, margin: '0 auto 36px',
            }}>
              Per dirlo in{' '}
              <span style={{ color: '#C8622A', fontWeight: 700 }}>&lt; 17 parole</span>
              : Vorrei lavorare il più possibile con gli hotel questa stagione!
            </p>

            {/* Filter pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: sm ? 6 : 8 }}>
              {Object.entries(TIPO_COLORS).map(([tipo, { bg, light, label }]) => {
                const active = activeFilters.has(tipo)
                return (
                  <button
                    key={tipo}
                    onClick={() => toggleFilter(tipo)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 999,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 500,
                      background: active ? bg : 'transparent',
                      color: active ? '#fff' : 'var(--text-muted)',
                      border: `1.5px solid ${active ? bg : 'var(--border)'}`,
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Calendar section */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: sm ? '20px 12px 40px' : md ? '32px 24px 48px' : '48px 40px 80px' }}>

        {/* Month navigator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: sm ? 4 : 6, flexWrap: 'wrap', marginBottom: 32 }}>
          <NavArrow
            direction="prev"
            onClick={() => goToMonth((currentMonthIdx - 1 + MESI.length) % MESI.length)}
            size={sm ? 28 : 30}
          />

          {MESI.map((mese, i) => {
            const isActive = i === currentMonthIdx
            const isAgosto = mese.num === '2026-08'
            return (
              <button
                key={mese.num}
                onClick={() => goToMonth(i)}
                style={{
                  padding: xs ? '3px 6px' : sm ? '4px 8px' : '5px 14px',
                  borderRadius: 999,
                  fontFamily: 'var(--font-mono)',
                  fontSize: sm ? 11 : 12,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: isActive ? 'var(--text)' : 'transparent',
                  color: isActive ? 'var(--bg)' : 'var(--text-muted)',
                  border: `1.5px solid ${isActive ? 'var(--text)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {mese.breve}
                {isAgosto && (
                  <span style={{
                    width: 5, height: 5,
                    borderRadius: '50%',
                    background: isActive ? 'var(--bg)' : '#C8622A',
                    flexShrink: 0,
                    display: 'inline-block',
                  }} />
                )}
              </button>
            )
          })}

          <NavArrow
            direction="next"
            onClick={() => goToMonth((currentMonthIdx + 1) % MESI.length)}
            size={sm ? 28 : 30}
          />
        </div>

        {/* Calendar card */}
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: 16,
          background: '#fff',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.03)',
        }}>
          <div style={{ overflow: 'hidden' }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={MESI[currentMonthIdx].num}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <MonthBlock
                  mese={MESI[currentMonthIdx]}
                  actsByDate={actsByDate}
                  activeFilters={activeFilters}
                  selectedDay={selectedDay}
                  onDayClick={handleDayClick}
                  monthPad={sm ? '12px 12px 12px' : md ? '18px 18px 16px' : '28px 28px 24px'}
                  cellMinH={sm ? 50 : 72}
                  cellGap={sm ? 3 : 4}
                  numSize={sm ? 11 : 14}
                  titleSize={sm ? 16 : 20}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 56 }}>
          <button
            onClick={() => navigate('/analytics')}
            style={{
              padding: '12px 32px',
              borderRadius: 8,
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 500,
              background: 'var(--text)',
              color: 'var(--bg)',
              border: '1.5px solid var(--text)',
              cursor: 'pointer',
              transition: 'all 150ms',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--text)'
              e.currentTarget.style.color = 'var(--bg)'
            }}
          >
            Scopri le insights →
          </button>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedDay && (
          <DayModal
            dateStr={selectedDay}
            acts={modalActs}
            formatDate={formatDate}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── NavArrow ──────────────────────────────────────────────────
function NavArrow({ direction, onClick, size = 30 }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: size, height: size,
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 14,
        background: 'transparent',
        border: '1.5px solid var(--border)',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        transition: 'all 150ms',
        flexShrink: 0,
      }}
    >
      {direction === 'prev' ? '←' : '→'}
    </button>
  )
}

// ── MonthBlock ────────────────────────────────────────────────
function MonthBlock({ mese, actsByDate, activeFilters, selectedDay, onDayClick,
                      monthPad = '28px 28px 24px', cellMinH = 72, cellGap = 4, numSize = 14, titleSize = 20 }) {
  const cells = generateMonthCells(mese.num)
  const isAgosto = mese.num === '2026-08'

  return (
    <div style={{ padding: monthPad }}>
      {/* Month title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <h2 style={{
          fontSize: titleSize, fontWeight: 700,
          color: 'var(--text)', letterSpacing: '-0.01em',
        }}>
          {mese.nome}
        </h2>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--text-muted)',
        }}>
          2026
        </span>
        {isAgosto && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            padding: '2px 10px', borderRadius: 999,
            background: '#FEF0E8', color: '#C8622A',
            border: '1px solid rgba(200, 98, 42, 0.3)',
            fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            picco stagionale
          </span>
        )}
      </div>

      {/* Day headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        gap: cellGap,
        marginBottom: cellGap,
      }}>
        {GIORNI_LABEL.map(g => (
          <div key={g} style={{
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            paddingBottom: 6,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            {g}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        gap: cellGap,
      }}>
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={`e-${i}`} />
          const allActs = actsByDate[dateStr] || []
          const visibleActs = allActs.filter(a => activeFilters.has(a.tipo_giorno))
          return (
            <DayCell
              key={dateStr}
              dateStr={dateStr}
              dayNum={parseInt(dateStr.split('-')[2])}
              acts={visibleActs}
              isSelected={selectedDay === dateStr}
              onClick={() => onDayClick(dateStr)}
              minH={cellMinH}
              numSize={numSize}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── DayCell ───────────────────────────────────────────────────
function DayCell({ dayNum, acts, isSelected, onClick, minH = 72, numSize = 14 }) {
  const hasActs = acts.length > 0

  // Tipi unici del giorno (deduplica, ordine di apparizione, max 4)
  const uniqueTypes = [...new Set(acts.map(a => a.tipo_giorno))]
    .filter(t => TIPO_COLORS[t])
    .slice(0, 4)

  return (
    <div
      onClick={hasActs ? onClick : undefined}
      style={{
        borderRadius: 8,
        minHeight: minH,
        cursor: hasActs ? 'pointer' : 'default',
        transition: 'transform 120ms, box-shadow 120ms',
        position: 'relative',
        overflow: 'hidden',
        // Ring bianco interno per selected — visibile su qualsiasi colore di sfondo
        outline: isSelected ? '2.5px solid rgba(255,255,255,0.9)' : 'none',
        outlineOffset: '-3px',
        boxShadow: isSelected
          ? `0 0 0 1px ${TIPO_COLORS[uniqueTypes[0]]?.bg || '#1A1A2E'}`
          : '0 0 0 1px var(--border)',
      }}
      onMouseEnter={e => {
        if (hasActs && !isSelected) {
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18), 0 0 0 1px transparent'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 0 0 1px var(--border)'
        }
        e.currentTarget.style.transform = 'none'
      }}
    >
      {/* Bande di colore — una per tipo unico, nessun blend */}
      {hasActs ? (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'row',
        }}>
          {uniqueTypes.map(tipo => (
            <div
              key={tipo}
              style={{ flex: 1, background: TIPO_COLORS[tipo].bg }}
            />
          ))}
        </div>
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'var(--bg-secondary)',
        }} />
      )}

      {/* Contenuto sopra le bande — centrato */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: numSize,
          fontWeight: hasActs ? 700 : 400,
          color: hasActs ? '#fff' : 'var(--text-muted)',
          opacity: hasActs ? 1 : 0.4,
          textShadow: hasActs ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
        }}>
          {dayNum}
        </div>
      </div>
    </div>
  )
}

// ── DayModal ──────────────────────────────────────────────────
// Il backdrop gestisce il click-to-close; la card è centrata con flexbox
// (non con transform: translate) per evitare conflitti con Framer Motion scale
function DayModal({ dateStr, acts, formatDate, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15, 15, 13, 0.5)',
          backdropFilter: 'blur(2px)',
          zIndex: 40,
        }}
      />

      {/* Centering wrapper — NON animato, solo flexbox */}
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50,
        pointerEvents: 'none',
        padding: '24px',
      }}>
        {/* Card animata */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            pointerEvents: 'auto',
            width: '100%', maxWidth: 420,
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Modal header */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-muted)', marginBottom: 4,
                letterSpacing: '0.05em',
              }}>
                {dateStr}
              </div>
              <div style={{
                fontSize: 16, fontWeight: 600,
                color: 'var(--text)', textTransform: 'capitalize',
              }}>
                {formatDate(dateStr)}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28,
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: 16,
                flexShrink: 0, marginLeft: 12,
              }}
            >
              ×
            </button>
          </div>

          {/* Modal body */}
          <div style={{
            padding: '16px 24px 24px',
            display: 'flex', flexDirection: 'column', gap: 10,
            maxHeight: '55vh', overflowY: 'auto',
          }}>
            {acts.map((a, i) => {
              const col = TIPO_COLORS[a.tipo_giorno] || { bg: '#999', light: '#f0f0f0', label: a.tipo_giorno }
              const ore = (a.ore_shooting || 0) + (a.ore_montaggio || 0)
              const orario = a.tipo_orario === 'presenza'
                ? (a.presenza_inizio && a.presenza_fine ? `${a.presenza_inizio}–${a.presenza_fine}` : null)
                : (a.orario_inizio && a.orario_fine ? `${a.orario_inizio}–${a.orario_fine}` : null)

              return (
                <div key={i} style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: col.light,
                  border: `1px solid ${col.bg}22`,
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 4,
                  }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600,
                      color: col.bg,
                    }}>
                      {col.label}
                    </span>
                    {ore > 0 && (
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11,
                        color: col.bg, opacity: 0.8,
                        background: col.bg + '18',
                        padding: '2px 8px', borderRadius: 999,
                      }}>
                        {ore}h
                      </span>
                    )}
                  </div>
                  {a.tipo_nome && (
                    <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
                      {a.tipo_nome}
                    </div>
                  )}
                  {orario && (
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11,
                      color: 'var(--text-muted)',
                    }}>
                      {orario}
                    </div>
                  )}
                  {a.referente_nome && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                      {a.referente_nome}
                      {a.referente_ruolo && <span style={{ opacity: 0.6 }}> · {a.referente_ruolo}</span>}
                    </div>
                  )}
                  {a.note && (
                    <div style={{
                      fontSize: 12, color: 'var(--text-muted)',
                      fontStyle: 'italic', marginTop: 4,
                    }}>
                      {a.note}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </>
  )
}

// ── Loading / Error ───────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          Caricamento database...
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ErrorState({ msg }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#C8622A' }}>
        Errore: {msg}
      </div>
    </div>
  )
}
