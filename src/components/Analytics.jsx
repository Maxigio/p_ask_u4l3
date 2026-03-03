import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LabelList,
} from 'recharts'
import Prism from 'prismjs'
import 'prismjs/components/prism-sql'
import { useDatabase } from '../hooks/useDatabase'
import { runQuery } from '../utils/queryDb'

// ── Window width ──────────────────────────────────────────────────────────────

function useWindowWidth() {
  const [w, setW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024)
  useEffect(() => {
    const handler = () => setW(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return w
}

// ── Queries ───────────────────────────────────────────────────────────────────

const KPI_SQL = `
SELECT
  (SELECT ROUND(SUM(ore_shooting + ore_montaggio), 0) FROM attivita) as tot_ore,
  (SELECT COUNT(*) FROM contenuti) as tot_contenuti,
  (SELECT COUNT(DISTINCT settimana_id) FROM attivita) as tot_settimane`

const Q1_SQL = `SELECT
  (SELECT COUNT(DISTINCT data)
   FROM attivita WHERE tipo_giorno = 'riprese') as giorni_campo,

  (SELECT ROUND(SUM(a.ore_shooting + a.ore_montaggio), 0)
   FROM attivita a
   GROUP BY a.settimana_id
   ORDER BY SUM(a.ore_shooting + a.ore_montaggio) DESC
   LIMIT 1) as picco_ore,

  (SELECT strftime('%d/%m', s.data_inizio) || ' → ' || strftime('%d/%m', s.data_fine)
   FROM settimane s
   JOIN (
     SELECT settimana_id, SUM(ore_shooting + ore_montaggio) as tot
     FROM attivita
     GROUP BY settimana_id
     ORDER BY tot DESC LIMIT 1
   ) t ON t.settimana_id = s.id) as picco_label,

  (SELECT ROUND(
     CAST(SUM(a.ore_montaggio) AS REAL) / NULLIF(
       SUM(CASE WHEN t.categoria != 'foto' THEN a.ore_shooting ELSE 0 END), 0), 1)
   FROM attivita a
   LEFT JOIN tipologie_contenuto t ON a.tipologia_contenuto_id = t.id
   WHERE a.ore_shooting > 0 OR a.ore_montaggio > 0) as ratio_postprod,

  (SELECT ROUND(SUM(CASE WHEN t.categoria != 'foto' THEN a.ore_shooting ELSE 0 END), 0)
   FROM attivita a
   LEFT JOIN tipologie_contenuto t ON a.tipologia_contenuto_id = t.id) as ore_shooting_video,

  (SELECT ROUND(SUM(CASE WHEN t.categoria = 'foto' THEN a.ore_shooting ELSE 0 END), 0)
   FROM attivita a
   LEFT JOIN tipologie_contenuto t ON a.tipologia_contenuto_id = t.id) as ore_shooting_foto`

const Q2_SQL = `SELECT
  r.nome as referente,
  r.ruolo,
  s.data_inizio as sett_inizio,
  ms.mese_num,
  a.tipo_giorno,
  COUNT(DISTINCT a.data) as giorni,
  ROUND(SUM(a.ore_shooting + a.ore_montaggio), 1) as ore
FROM attivita a
JOIN referenti r ON a.referente_id = r.id
JOIN settimane s ON a.settimana_id = s.id
JOIN mesi_stagione ms ON strftime('%Y-%m', a.data) = ms.mese_num
WHERE r.ruolo != 'Capo Ricevimento'
GROUP BY r.id, s.id, a.tipo_giorno
ORDER BY r.nome, s.data_inizio, a.tipo_giorno`

const Q3_SQL = `SELECT
  s.id,
  s.data_inizio,
  s.note as note_settimana,
  strftime('%Y-%m', s.data_inizio) as mese_chiave,
  ROUND(SUM(a.ore_shooting + a.ore_montaggio), 1) as ore_tracciate,
  ROUND(SUM(
    CASE WHEN a.tipo_giorno = 'riprese'
    THEN t.stima_ore_montaggio_totali
    ELSE 0 END
  ), 1) as ore_montaggio_stimate_extra,
  GROUP_CONCAT(DISTINCT
    CASE WHEN a.tipo_giorno = 'riprese' THEN t.nome END
  ) as contenuti_principali
FROM settimane s
JOIN attivita a ON a.settimana_id = s.id
LEFT JOIN tipologie_contenuto t ON a.tipologia_contenuto_id = t.id
WHERE strftime('%Y-%m', s.data_inizio) IN ('2026-07', '2026-08')
GROUP BY s.id
ORDER BY s.data_inizio`


// ── Costanti design ───────────────────────────────────────────────────────────

const ACCENT_COLORS = ['#C8622A', '#2D4A7A', '#3A6B4A', '#B8860B', '#6B3FA0']

const CAT_COLORS = {
  istituzionale:  '#C8622A',
  video_long:     '#2D4A7A',
  video_short:    '#3A6B4A',
  foto:           '#B8860B',
  amministrativo: '#9B9B93',
}

const CAT_LABELS = {
  istituzionale:  'Spot',
  video_long:     'Video Lungo',
  video_short:    'Reel / Social',
  foto:           'Foto',
  amministrativo: 'Admin',
}

// Ordine fisso dei mesi per MixPivot e header Gantt
const MESI_ORDER = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']
const MESI_BREVI = {
  '2026-04': 'Apr', '2026-05': 'Mag', '2026-06': 'Giu',
  '2026-07': 'Lug', '2026-08': 'Ago', '2026-09': 'Set',
}

// Colori e label tipo_giorno (Gantt)
const TIPO_COLORS = {
  riprese:   '#C8622A',
  montaggio: '#2D4A7A',
  archivio:  '#3A6B4A',
  call:      '#6B3FA0',
  jolly:     '#B8860B',
  vacanza:   '#9B9B93',
}
const TIPO_LABELS = {
  riprese:   'Riprese',
  montaggio: 'Montaggio',
  archivio:  'Archivio',
  call:      'Call',
  jolly:     'Jolly',
  vacanza:   'Vacanza',
}
// Ordine preferenziale referenti nel Gantt
const REF_ORDER = ['Rebecca', 'Giulia', 'Lucio']

// Ordine fisso per le categorie nello stacked bar
const CAT_ORDER = ['istituzionale', 'video_long', 'video_short', 'foto', 'amministrativo']

// ── SqlBlock ──────────────────────────────────────────────────────────────────

function SqlBlock({ sql }) {
  const [open, setOpen] = useState(false)
  const codeRef = useRef(null)

  useEffect(() => {
    if (open && codeRef.current) Prism.highlightElement(codeRef.current)
  }, [open])

  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--text-muted)', background: 'none', border: 'none',
          cursor: 'pointer', padding: 0, opacity: 0.7, transition: 'opacity 150ms',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
      >
        <span style={{ fontSize: '0.6rem' }}>{open ? '▾' : '▸'}</span>
        {open ? 'Nascondi SQL' : 'Mostra SQL'}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
              <pre className="language-sql" style={{ marginTop: 8, minWidth: 0 }}>
                <code ref={codeRef} className="language-sql">{sql.trim()}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── QuerySection ──────────────────────────────────────────────────────────────

function QuerySection({ index, title, note, sql, accent, sm, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderRadius: 12,
        background: '#fff',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.03)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex' }}>
        {/* Left accent bar */}
        <div style={{ width: 3, background: accent, flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0, padding: sm ? '16px 14px 14px' : '24px 24px 20px' }}>
          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, color: accent,
              fontWeight: 700, letterSpacing: '0.06em', marginTop: 2, flexShrink: 0,
            }}>
              {String(index).padStart(2, '0')}
            </span>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, margin: 0 }}>
              {title}
            </h3>
          </div>

          {children}

          {note && (
            <p style={{
              fontSize: 13, color: 'var(--text-muted)', marginTop: 16,
              lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 14, marginBottom: 0,
            }}>
              {note}
            </p>
          )}
          <SqlBlock sql={sql} />
        </div>
      </div>
    </motion.div>
  )
}

// ── Tooltip generico ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px',
      fontFamily: 'var(--font-mono)', fontSize: 12,
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.fill, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}h</strong>
        </div>
      ))}
    </div>
  )
}

// ── Schema DB ─────────────────────────────────────────────────────────────────

const SCHEMA_TABLES = [
  { name: 'tipologie_contenuto', cols: 'id · nome · categoria · piattaforma · stima_ore_shooting · stima_ore_montaggio' },
  { name: 'strutture',           cols: 'id · nome · nome_interno · localita' },
  { name: 'referenti',           cols: 'id · nome · ruolo · struttura_id →strutture' },
  { name: 'mesi_stagione',       cols: 'mese_num · nome · fase' },
  { name: 'settimane',           cols: 'id · numero_settimana · data_inizio · data_fine · note' },
  { name: 'attivita',            cols: 'id · data · tipo_giorno · ore_shooting · ore_montaggio · tipo_orario · settimana_id →settimane · tipologia_contenuto_id →tipologie · referente_id →referenti' },
  { name: 'contenuti',           cols: 'id · attivita_id →attivita · tipologia_id →tipologie · settimana_id →settimane · formato · stato_consegna' },
]

function SchemaBlock({ sm }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: 40 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--text-muted)', background: 'none',
          border: '1px solid var(--border)', borderRadius: 6,
          cursor: 'pointer', padding: '6px 12px', transition: 'border-color 150ms',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-muted)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <span style={{ fontSize: '0.6rem' }}>{open ? '▾' : '▸'}</span>
        Schema database — {SCHEMA_TABLES.length} tabelle
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: 10, borderRadius: 10, padding: '16px 20px',
              background: 'var(--code-bg)', border: '1px solid var(--border)',
              display: 'grid', gap: 8,
            }}>
              {SCHEMA_TABLES.map(t => (
                <div key={t.name} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', fontSize: 12 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 600,
                    color: 'var(--accent)', minWidth: sm ? 130 : 200, flexShrink: 0,
                  }}>
                    {t.name}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {t.cols}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Q1 — Pannello KPI analitici ──────────────────────────────────────────────

function KpiPanel({ data, totOre, sm }) {
  if (!data) return null
  const { giorni_campo, picco_ore, picco_label,
          ratio_postprod, ore_shooting_video, ore_shooting_foto } = data

  const cards = [
    {
      value: `${giorni_campo} giorni`,
      label: 'sul campo',
      sub: 'riprese effettive',
      color: '#C8622A',
    },
    {
      value: `${totOre}h`,
      label: 'ore di lavoro',
      sub: 'riprese + montaggio',
      color: '#3A6B4A',
    },
    {
      value: `${picco_ore}h`,
      label: 'la settimana più impegnativa',
      sub: `${picco_label || '—'} · riprese + montaggio`,
      color: '#2D4A7A',
    },
    {
      value: `1h → ${ratio_postprod}h`,
      label: 'ratio post-produzione',
      sub: `video ${ore_shooting_video}h · foto ${ore_shooting_foto}h`,
      color: '#B8860B',
    },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 12,
    }}>
      {cards.map((c, i) => (
        <div key={i} style={{
          borderRadius: 10,
          background: c.color,
          padding: '22px 20px 18px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: sm ? 20 : 28, fontWeight: 700, color: '#fff',
            fontFamily: 'var(--font-mono)', lineHeight: 1, marginBottom: 6,
            letterSpacing: '-0.02em',
          }}>
            {c.value}
          </div>
          <div style={{
            fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.92)', marginBottom: 4,
          }}>
            {c.label}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em',
          }}>
            {c.sub}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Q2 — Gantt timeline referenti × settimane ────────────────────────────────

function GanttChart({ data, sm, md }) {
  const [tooltip, setTooltip] = useState(null)
  const outerRef = useRef(null)

  // 1. Settimane uniche ordinate
  const settimane = [...new Set(data.map(r => r.sett_inizio))].sort()
  const numWeeks = settimane.length

  // 2. Referenti unici, ordinati secondo REF_ORDER
  const seenRefs = new Set()
  const refs = []
  for (const row of data) {
    if (!seenRefs.has(row.referente)) {
      seenRefs.add(row.referente)
      refs.push({ nome: row.referente, ruolo: row.ruolo })
    }
  }
  refs.sort((a, b) =>
    (REF_ORDER.indexOf(a.nome) === -1 ? 99 : REF_ORDER.indexOf(a.nome)) -
    (REF_ORDER.indexOf(b.nome) === -1 ? 99 : REF_ORDER.indexOf(b.nome))
  )

  // 3. Lookup: byRef[referente][sett_inizio] = [{ tipo_giorno, giorni, ore }]
  const byRef = {}
  for (const row of data) {
    if (!byRef[row.referente]) byRef[row.referente] = {}
    if (!byRef[row.referente][row.sett_inizio]) byRef[row.referente][row.sett_inizio] = []
    byRef[row.referente][row.sett_inizio].push({
      tipo_giorno: row.tipo_giorno, giorni: row.giorni, ore: row.ore,
    })
  }

  // 4. Header mesi: raggruppa settimane per mese
  const settMese = {}
  for (const row of data) settMese[row.sett_inizio] = row.mese_num
  const monthGroups = []
  let curMese = null
  for (const sett of settimane) {
    const m = settMese[sett]
    if (m !== curMese) { monthGroups.push({ mese_num: m, count: 1 }); curMese = m }
    else monthGroups[monthGroups.length - 1].count++
  }

  const tipiPresenti = [...new Set(data.map(r => r.tipo_giorno))].filter(t => TIPO_COLORS[t])
  const HW = sm ? 100 : md ? 130 : 150
  const BH = 44
  const GAP = 3

  function handleMouseEnter(e, sett, activities) {
    if (!activities.length || !outerRef.current) return
    const blockRect = e.currentTarget.getBoundingClientRect()
    const outerRect = outerRef.current.getBoundingClientRect()
    setTooltip({
      x: blockRect.left - outerRect.left + blockRect.width / 2,
      y: blockRect.top - outerRect.top,
      sett, activities,
    })
  }

  // CSS Grid: colonna fissa (label) + numWeeks colonne 1fr → si adattano al container
  const gridCols = `${HW}px repeat(${numWeeks}, minmax(0, 1fr))`

  return (
    // outerRef: position relative per il tooltip assoluto (non tagliato dall'overflow)
    <div ref={outerRef} style={{ position: 'relative' }}>

      {/* Scroll solo se la viewport è troppo stretta — sulla largezza target il grid si adatta */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          columnGap: GAP,
          rowGap: GAP,
          // Larghezza minima: sotto questo valore scatta lo scroll
          minWidth: HW + numWeeks * 14,
        }}>

          {/* ── Header mesi ── */}
          <div /> {/* spacer colonna label */}
          {monthGroups.map(mg => (
            <div key={mg.mese_num} style={{
              gridColumn: `span ${mg.count}`,
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
              color: 'var(--text-muted)', textAlign: 'center',
              borderBottom: '2px solid var(--border)', paddingBottom: 5,
              letterSpacing: '0.06em',
            }}>
              {MESI_BREVI[mg.mese_num] || mg.mese_num.slice(5)}
            </div>
          ))}

          {/* ── Righe dati ── (flatMap evita React.Fragment nel grid) */}
          {refs.flatMap(ref => [

            // Label colonna
            <div key={`${ref.nome}-label`} style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              paddingRight: 10, height: BH,
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.2 }}>
                {ref.nome}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-muted)', marginTop: 2,
              }}>
                {ref.ruolo}
              </div>
            </div>,

            // Blocchi settimana
            ...settimane.map(sett => {
              const activities = byRef[ref.nome]?.[sett] || []
              const totalOre = activities.reduce((s, a) => s + (a.ore || 0), 0)
              const isActive = activities.length > 0
              return (
                <div
                  key={`${ref.nome}-${sett}`}
                  onMouseEnter={e => handleMouseEnter(e, sett, activities)}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    height: BH, borderRadius: 5,
                    background: isActive ? 'transparent' : 'var(--bg-secondary)',
                    display: 'flex', overflow: 'hidden',
                  }}
                >
                  {activities.map((act, i) => (
                    <div key={i} style={{
                      flex: totalOre > 0 ? act.ore / totalOre : 1 / activities.length,
                      background: TIPO_COLORS[act.tipo_giorno] || '#ccc',
                      height: '100%',
                    }} />
                  ))}
                </div>
              )
            }),
          ])}
        </div>
      </div>

      {/* Tooltip: fuori dal div overflow → non viene tagliato */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x,
          top: tooltip.y - 8,
          transform: 'translate(-50%, -100%)',
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 8, padding: '10px 14px',
          fontFamily: 'var(--font-mono)', fontSize: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          pointerEvents: 'none', zIndex: 10, whiteSpace: 'nowrap',
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            {tooltip.sett}
          </div>
          {tooltip.activities.map((act, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <div style={{
                width: 8, height: 8, borderRadius: 2, flexShrink: 0,
                background: TIPO_COLORS[act.tipo_giorno] || '#ccc',
              }} />
              <span style={{ color: 'var(--text)' }}>
                {TIPO_LABELS[act.tipo_giorno] || act.tipo_giorno}
              </span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                {act.giorni}g · {act.ore}h
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Legenda */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 16,
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
      }}>
        {tipiPresenti.map(tipo => (
          <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: TIPO_COLORS[tipo] }} />
            <span>{TIPO_LABELS[tipo] || tipo}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Q3 — Mix contenuti per mese (Stacked Bar) ─────────────────────────────────

function formatWeekLabel(dateStr) {
  const parts = dateStr.split('-')
  const months = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic']
  return `${parts[2]} ${months[parseInt(parts[1]) - 1]}`
}

function CaricoRealeChart({ data }) {
  const processed = data.map(r => ({
    name: formatWeekLabel(r.data_inizio),
    mese: r.mese_chiave,
    tracciate: r.ore_tracciate,
    montaggio_extra: r.ore_montaggio_stimate_extra,
    totale: r.ore_tracciate + r.ore_montaggio_stimate_extra,
    contenuto: r.contenuti_principali || '',
    isFerragosto: (r.note_settimana || '').includes('FERRAGOSTO'),
    isSpot: (r.contenuti_principali || '').includes('Spot'),
  }))

  const CaricoTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const row = processed.find(r => r.name === label)
    const tracciate = payload.find(p => p.dataKey === 'tracciate')
    const extra     = payload.find(p => p.dataKey === 'montaggio_extra')
    return (
      <div style={{
        background: '#fff', border: '1px solid var(--border)',
        borderRadius: 8, padding: '10px 14px',
        fontFamily: 'var(--font-mono)', fontSize: 12,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        maxWidth: 220,
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{label}</div>
        {row?.contenuto && (
          <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontSize: 11 }}>
            {row.contenuto}
          </div>
        )}
        {tracciate && (
          <div style={{ color: '#2D4A7A', marginBottom: 3 }}>
            ore tracciate: <strong>{tracciate.value}h</strong>
          </div>
        )}
        {extra && (
          <div style={{ color: '#C8622A', marginBottom: 3 }}>
            montaggio stimato: <strong>+{extra.value}h</strong>
          </div>
        )}
        <div style={{
          borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6,
          color: 'var(--text-muted)',
        }}>
          totale reale: <strong>{(tracciate?.value || 0) + (extra?.value || 0)}h</strong>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={processed} barCategoryGap="25%" margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-muted)' }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-muted)' }}
          domain={[0, 'auto']}
        />
        <Tooltip content={<CaricoTooltip />} />
        <Legend
          formatter={v => v === 'tracciate' ? 'Ore di ripresa' : 'Montaggio Stimato'}
          iconType="square"
          wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
        />
        {/* Layer 1 — ore tracciate: barra solida */}
        <Bar dataKey="tracciate" stackId="a" fill="#2D4A7A" opacity={0.9} radius={[0,0,0,0]} />
        {/* Layer 2 — montaggio extra stimato: trasparente sopra */}
        <Bar dataKey="montaggio_extra" stackId="a" fill="#C8622A" opacity={0.35} radius={[3,3,0,0]}>
          <LabelList
            content={({ x, y, width, index }) => {
              const row = processed[index]
              if (!row) return null
              const lbl = row.isFerragosto ? 'Ferragosto' : row.isSpot ? 'Spot' : null
              if (!lbl) return null
              return (
                <text
                  x={x + width / 2} y={y - 5}
                  textAnchor="middle" fontSize={9}
                  fill={row.isFerragosto ? '#B8860B' : '#C8622A'}
                  fontFamily="var(--font-mono)" fontWeight={700}
                >
                  {lbl}
                </text>
              )
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Analytics() {
  const navigate = useNavigate()
  const { db, loading, error } = useDatabase()
  const w = useWindowWidth()
  const sm = w < 480
  const md = w < 768

  const kpiData = useMemo(() => db ? runQuery(db, KPI_SQL) : [], [db])
  const q1Data  = useMemo(() => db ? runQuery(db, Q1_SQL)  : [], [db])
  const q2Data  = useMemo(() => db ? runQuery(db, Q2_SQL)  : [], [db])
  const q3Data  = useMemo(() => db ? runQuery(db, Q3_SQL)  : [], [db])

  if (loading) return <LoadingState />
  if (error)   return <ErrorState msg={error.message} />

  const kpi = kpiData[0] || {}

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Barra gradiente */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #C8622A 0%, #B8860B 50%, #2D4A7A 100%)' }} />

      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          padding: sm ? '24px 16px 28px' : md ? '28px 24px 32px' : '32px 40px 40px',
        }}>
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ textAlign: 'center' }}
          >
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-muted)', letterSpacing: '0.08em',
              marginBottom: 16, lineHeight: 1.5,
            }}>
              Mi sto allenando a estrapolare
            </p>

            <h1 style={{
              fontSize: sm ? 28 : md ? 36 : 48, fontWeight: 700, lineHeight: 1.1,
              color: 'var(--text)', marginBottom: 14, letterSpacing: '-0.02em',
            }}>
              Analytics
            </h1>

            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-muted)', letterSpacing: '0.06em',
              lineHeight: 1.7, maxWidth: 480, margin: '0 auto',
            }}>
              Da quando parlo con la paperella di{' '}
              <a
                href="https://pll.harvard.edu/course/cs50s-introduction-databases-sql"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#C8622A', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}
              >CS50</a>
              {' '}non sono più stato lo stesso.
            </p>
          </motion.div>
        </div>
      </div>

      {/* KPI strip */}
      {kpi.tot_ore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          style={{ borderBottom: '1px solid var(--border)', background: '#fff' }}
        >
          <div style={{
            maxWidth: 900, margin: '0 auto',
            padding: sm ? '0 16px' : '0 40px',
            display: 'flex',
            flexDirection: sm ? 'column' : 'row',
          }}>
            {[
              { label: 'contenuti pianificati', value: kpi.tot_contenuti, color: '#C8622A' },
              { label: 'ottimizzazione montaggio stimata', value: '50%', color: '#3A6B4A', cta: 'scopri come' },
              { label: 'settimane di stagione', value: kpi.tot_settimane, color: '#2D4A7A' },
            ].map((k, i) => (
              <div key={i} style={{
                flex: 1, textAlign: 'center', padding: sm ? '14px 8px' : '14px 8px',
                borderRight: !sm && i < 2 ? '1px solid var(--border)' : 'none',
                borderBottom: sm && i < 2 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  fontSize: sm ? 22 : 30, fontWeight: 700, color: k.color,
                  fontFamily: 'var(--font-mono)', lineHeight: 1, marginBottom: 5,
                }}>
                  {k.value}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--text-muted)', letterSpacing: '0.05em',
                  marginBottom: k.cta ? 6 : 0,
                }}>
                  {k.label}
                </div>
                {k.cta && (
                  <button
                    onClick={() => navigate('/alzare-il-livello')}
                    style={{
                      fontSize: 10, fontFamily: 'var(--font-mono)',
                      color: k.color, background: 'none',
                      border: `1px solid ${k.color}`, borderRadius: 4,
                      padding: '2px 8px', cursor: 'pointer',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {k.cta}
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Contenuto principale */}
      <div style={{
        maxWidth: 900, margin: '0 auto',
        padding: sm ? '24px 16px 48px' : md ? '32px 24px 60px' : '48px 40px 80px',
      }}>

        <SchemaBlock sm={sm} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Q1 — KPI analitici ────────────────────────────────────────── */}
          <QuerySection
            index={1}
            title="Durata del mio impegno"
            accent={ACCENT_COLORS[0]}
            note="Questi numeri sono assolutamente ipotetici, ma realistici."
            sql={Q1_SQL}
            sm={sm}
          >
            <KpiPanel data={q1Data[0]} totOre={kpi.tot_ore} sm={sm} />
          </QuerySection>

          {/* ── Q2 — Chi è coinvolto e quando ────────────────────────────── */}
          <QuerySection
            index={2}
            title="Chi è coinvolto e quando?"
            accent={ACCENT_COLORS[1]}
            note="Lo sapevi? Sto facendo questo sito per capire se passerò la maggior parte della stagione a fare eventi o a fare qualcosa di figo che ti possa impressionare!"
            sql={Q2_SQL}
            sm={sm}
          >
            <GanttChart data={q2Data} sm={sm} md={md} />
          </QuerySection>

          {/* ── Q3 — Mix contenuti per mese ──────────────────────────────── */}
          <QuerySection
            index={3}
            title="Perché distribuire le ore di montaggio in questo modo?"
            accent={ACCENT_COLORS[2]}
            note={<>Le ore stimate di montaggio hanno l'obiettivo di realizzare tutti i video pattuiti prima di Settembre, in modo da poterci concentrare sui montaggi di materiale dall'archivio. Se vuoi sapere come farò a non finire in burnout guarda la pagina{' '}<span onClick={() => navigate('/alzare-il-livello')} style={{ color: '#3A6B4A', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>Alzare il livello</span></>}
            sql={Q3_SQL}
            sm={sm}
          >
            <CaricoRealeChart data={q3Data} />
          </QuerySection>

        </div>
      </div>
    </div>
  )
}

// ── Loading / Error ───────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 13,
          color: 'var(--text-muted)', marginBottom: 12,
        }}>
          Inizializzazione database...
        </div>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
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
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg)',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#C8622A' }}>
        Errore DB: {msg}
      </div>
    </div>
  )
}
