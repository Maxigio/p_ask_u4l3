import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'
import Prism from 'prismjs'
import 'prismjs/components/prism-sql'
import { useDatabase } from '../hooks/useDatabase'
import { runQuery } from '../utils/queryDb'

// ─── Queries ──────────────────────────────────────────────────────────────────

const Q1_SQL = `SELECT ms.nome as mese,
       ms.fase,
       ROUND(SUM(a.ore_shooting), 1) as ore_shooting,
       ROUND(SUM(a.ore_montaggio), 1) as ore_montaggio,
       ROUND(SUM(a.ore_shooting + a.ore_montaggio), 1) as ore_totali
FROM attivita a
JOIN mesi_stagione ms ON strftime('%Y-%m', a.data) = ms.mese_num
GROUP BY ms.mese_num
ORDER BY ms.mese_num`

const Q2_SQL = `SELECT s.data_inizio,
       s.data_fine,
       ms.nome as mese,
       ROUND(SUM(a.ore_shooting + a.ore_montaggio), 1) as ore_settimana,
       ROUND(AVG(SUM(a.ore_shooting + a.ore_montaggio))
             OVER (ORDER BY s.data_inizio
                   ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING), 1) as media_mobile
FROM attivita a
JOIN settimane s ON a.settimana_id = s.id
JOIN mesi_stagione ms ON strftime('%Y-%m', a.data) = ms.mese_num
GROUP BY s.id
ORDER BY s.data_inizio`

const Q3_SQL = `SELECT t.piattaforma,
       t.nome,
       COUNT(c.id) as num_contenuti,
       ROUND(SUM(t.stima_ore_montaggio_totali), 0) as ore_montaggio_stimate
FROM contenuti c
JOIN tipologie_contenuto t ON c.tipologia_id = t.id
GROUP BY t.id
ORDER BY num_contenuti DESC`

const Q4_SQL = `SELECT s.data_inizio,
       ms.nome as mese,
       ROUND(SUM(a.ore_shooting + a.ore_montaggio), 1) as ore_totali,
       MAX(CASE WHEN a.tipologia_contenuto_id = 1 THEN 1 ELSE 0 END) as ha_spot,
       MAX(CASE WHEN a.tipologia_contenuto_id = 1
           THEN t.stima_ore_montaggio_totali END) as ore_montaggio_spot_stimate
FROM attivita a
JOIN settimane s ON a.settimana_id = s.id
JOIN mesi_stagione ms ON strftime('%Y-%m', a.data) = ms.mese_num
LEFT JOIN tipologie_contenuto t ON a.tipologia_contenuto_id = t.id
GROUP BY s.id
ORDER BY s.data_inizio`

const Q5_SQL = `SELECT r.nome as referente,
       r.ruolo,
       COUNT(DISTINCT a.data) as giorni_coinvolti,
       ROUND(SUM(a.ore_shooting + a.ore_montaggio), 1) as ore_coinvolto,
       MIN(a.data) as primo_contatto,
       MAX(a.data) as ultimo_contatto
FROM attivita a
JOIN referenti r ON a.referente_id = r.id
GROUP BY r.id
ORDER BY giorni_coinvolti DESC`

// ─── Componenti di supporto ───────────────────────────────────────────────────

function SqlBlock({ sql }) {
  const [open, setOpen] = useState(false)
  const codeRef = useRef(null)

  useEffect(() => {
    if (open && codeRef.current) {
      Prism.highlightElement(codeRef.current)
    }
  }, [open])

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="mono text-xs flex items-center gap-2 transition-opacity hover:opacity-70"
        style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <span style={{ fontSize: '0.65rem' }}>{open ? '▾' : '▸'}</span>
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
            <pre className="language-sql mt-2">
              <code ref={codeRef} className="language-sql">{sql.trim()}</code>
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function QuerySection({ index, title, note, sql, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="rounded-lg p-6"
      style={{ border: '1px solid var(--border)', background: '#fff' }}
    >
      <div className="flex items-start gap-3 mb-5">
        <span className="mono text-xs mt-0.5 shrink-0" style={{ color: 'var(--accent-warm)' }}>
          {String(index).padStart(2, '0')}
        </span>
        <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{title}</h3>
      </div>

      {children}

      {note && (
        <p className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>{note}</p>
      )}
      <SqlBlock sql={sql} />
    </motion.div>
  )
}

// ── Tooltip personalizzato ────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded p-3 text-xs mono" style={{ background: '#fff', border: '1px solid var(--border)' }}>
      <div className="mb-1 font-medium" style={{ color: 'var(--text)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}h</div>
      ))}
    </div>
  )
}

// ── Schema DB collassabile ────────────────────────────────────
const SCHEMA_TABLES = [
  { name: 'tipologie_contenuto', cols: 'id · nome · categoria · piattaforma · stima_ore_shooting_totali · stima_ore_montaggio_totali' },
  { name: 'strutture', cols: 'id · nome · nome_interno · localita' },
  { name: 'referenti', cols: 'id · nome · ruolo · struttura_id →strutture' },
  { name: 'mesi_stagione', cols: 'mese_num · nome · fase' },
  { name: 'settimane', cols: 'id · numero_settimana · data_inizio · data_fine · note' },
  { name: 'attivita', cols: 'id · data · tipo_giorno · ore_shooting · ore_montaggio · tipo_orario · settimana_id →settimane · tipologia_contenuto_id →tipologie · referente_id →referenti' },
  { name: 'contenuti', cols: 'id · attivita_id →attivita · tipologia_id →tipologie · settimana_id →settimane · formato · stato_consegna' },
]

function SchemaBlock() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-6 mb-8">
      <button
        onClick={() => setOpen(v => !v)}
        className="mono text-xs flex items-center gap-2 transition-opacity hover:opacity-70"
        style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <span style={{ fontSize: '0.65rem' }}>{open ? '▾' : '▸'}</span>
        Schema database ({SCHEMA_TABLES.length} tabelle)
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
            <div
              className="mt-3 rounded-lg p-4 grid gap-2"
              style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}
            >
              {SCHEMA_TABLES.map(t => (
                <div key={t.name} className="flex gap-3 items-start text-xs">
                  <span className="mono font-medium shrink-0" style={{ color: 'var(--accent)', minWidth: 180 }}>
                    {t.name}
                  </span>
                  <span className="mono" style={{ color: 'var(--text-muted)' }}>{t.cols}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Backend() {
  const navigate = useNavigate()
  const { db, loading, error } = useDatabase()

  const q1Data = useMemo(() => db ? runQuery(db, Q1_SQL) : [], [db])
  const q2Data = useMemo(() => db ? runQuery(db, Q2_SQL) : [], [db])
  const q3Data = useMemo(() => db ? runQuery(db, Q3_SQL) : [], [db])
  const q4Data = useMemo(() => db ? runQuery(db, Q4_SQL) : [], [db])
  const q5Data = useMemo(() => db ? runQuery(db, Q5_SQL) : [], [db])

  if (loading) return <LoadingState />
  if (error) return <ErrorState msg={error.message} />

  // Calcola max per Q3 barre inline
  const maxQ3Ore = Math.max(...q3Data.map(r => r.ore_montaggio_stimate || 0), 1)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-20">

        {/* Back nav */}
        <button
          onClick={() => navigate('/')}
          className="mono text-xs mb-8 flex items-center gap-2 transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ← p_ask_u4l3
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-2"
        >
          <h1 className="text-3xl font-semibold mb-3" style={{ color: 'var(--text)' }}>
            Backend
          </h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: 520 }}>
            Ho pianificato la stagione con rigore. Questo è il database che la governa —
            cinque query per estrarne gli insight che contano.
          </p>
        </motion.div>

        <SchemaBlock />

        {/* ── Q1: Ore per mese ── */}
        <div className="flex flex-col gap-6">
          <QuerySection
            index={1}
            title="Quanto pesa ogni mese?"
            note="Agosto è il mese più intenso: picco di shooting e montaggio concentrato su 4 settimane. Aprile e Settembre sono mesi di archivio — montaggio da materiale esistente, zero shooting."
            sql={Q1_SQL}
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={q1Data} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mese" tick={{ fontSize: 12, fontFamily: 'var(--font-mono)', fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-muted)' }} unit="h" />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="square" wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-mono)' }} />
                <Bar dataKey="ore_shooting" name="Shooting" fill="#C8622A" radius={[3, 3, 0, 0]} />
                <Bar dataKey="ore_montaggio" name="Montaggio" fill="#2D4A7A" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </QuerySection>

          {/* ── Q2: Carico settimanale ── */}
          <QuerySection
            index={2}
            title="Come si distribuisce il carico settimana per settimana?"
            note="La media mobile su 5 settimane mostra il trend reale, smorzando i picchi isolati. Agosto settimana di Ferragosto è il massimo assoluto — tutto concentrato su quei 7 giorni."
            sql={Q2_SQL}
          >
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={q2Data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="data_inizio"
                  tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--text-muted)' }}
                  tickFormatter={d => d ? d.slice(5) : ''}
                  interval={2}
                />
                <YAxis tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-muted)' }} unit="h" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded p-3 text-xs mono" style={{ background: '#fff', border: '1px solid var(--border)' }}>
                        <div className="mb-1 font-medium" style={{ color: 'var(--text)' }}>{label}</div>
                        {payload.map((p, i) => (
                          <div key={i} style={{ color: p.color }}>{p.name}: {p.value}h</div>
                        ))}
                      </div>
                    )
                  }}
                />
                <Legend iconType="line" wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-mono)' }} />
                <Line
                  type="monotone" dataKey="ore_settimana" name="Ore settimana"
                  stroke="#C8622A" strokeWidth={2} dot={{ r: 3, fill: '#C8622A' }}
                />
                <Line
                  type="monotone" dataKey="media_mobile" name="Media mobile (5 sett.)"
                  stroke="#2D4A7A" strokeWidth={1.5} strokeDasharray="4 4" dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </QuerySection>

          {/* ── Q3: Output per piattaforma ── */}
          <QuerySection
            index={3}
            title="Quanti contenuti, per quale piattaforma?"
            note="I Reel dominano in volume — sono il formato ad alta frequenza. Lo Spot Istituzionale pesa di più in ore montaggio ma esce una volta al mese."
            sql={Q3_SQL}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Contenuto', 'Piattaforma', 'N° contenuti', 'Ore montaggio stimate'].map(h => (
                      <th
                        key={h}
                        className="text-left pb-2 pr-4 mono text-xs"
                        style={{ color: 'var(--text-muted)', fontWeight: 500 }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {q3Data.map((r, i) => (
                    <tr
                      key={i}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-2 pr-4" style={{ color: 'var(--text)' }}>{r.nome}</td>
                      <td className="py-2 pr-4 mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        {r.piattaforma || '—'}
                      </td>
                      <td className="py-2 pr-4 mono text-xs" style={{ color: 'var(--text)' }}>
                        {r.num_contenuti}
                      </td>
                      <td className="py-2" style={{ minWidth: 160 }}>
                        <div className="flex items-center gap-2">
                          <div
                            className="rounded-full"
                            style={{
                              height: 6,
                              width: `${Math.max(4, ((r.ore_montaggio_stimate || 0) / maxQ3Ore) * 100)}%`,
                              background: '#2D4A7A',
                              minWidth: 4,
                              maxWidth: 120,
                            }}
                          />
                          <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
                            {r.ore_montaggio_stimate || 0}h
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </QuerySection>

          {/* ── Q4: Spot Istituzionale ── */}
          <QuerySection
            index={4}
            title="Quando cade lo Spot Istituzionale e che impatto ha sul carico?"
            note="Le settimane con Spot sono quelle ad altissima densità: lo shooting premium si somma alla produzione ordinaria. Evidenziate in arancio."
            sql={Q4_SQL}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Settimana', 'Mese', 'Ore totali', 'Spot', 'Ore Spot (stim.)'].map(h => (
                      <th
                        key={h}
                        className="text-left pb-2 pr-4 mono text-xs"
                        style={{ color: 'var(--text-muted)', fontWeight: 500 }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {q4Data.map((r, i) => {
                    const highlight = r.ha_spot === 1
                    return (
                      <tr
                        key={i}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: highlight ? '#FEF0E8' : 'transparent',
                        }}
                      >
                        <td className="py-2 pr-4 mono text-xs" style={{ color: 'var(--text)' }}>
                          {r.data_inizio}
                        </td>
                        <td className="py-2 pr-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                          {r.mese}
                        </td>
                        <td className="py-2 pr-4 mono text-xs font-medium" style={{ color: highlight ? '#C8622A' : 'var(--text)' }}>
                          {r.ore_totali}h
                        </td>
                        <td className="py-2 pr-4 text-xs">
                          {highlight
                            ? <span style={{ color: '#C8622A', fontWeight: 600 }}>●</span>
                            : <span style={{ color: 'var(--border)' }}>○</span>
                          }
                        </td>
                        <td className="py-2 mono text-xs" style={{ color: 'var(--text-muted)' }}>
                          {r.ore_montaggio_spot_stimate ? `${r.ore_montaggio_spot_stimate}h` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </QuerySection>

          {/* ── Q5: Referenti ── */}
          <QuerySection
            index={5}
            title="Chi è coinvolto e per quanto?"
            note="Rebecca è il riferimento principale per la fase di shooting. Giulia gestisce la distribuzione sui social. I Capi Ricevimento entrano nella fase di struttura."
            sql={Q5_SQL}
          >
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {q5Data.map((r, i) => (
                <div
                  key={i}
                  className="rounded-lg p-4"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                >
                  <div className="font-medium mb-0.5" style={{ color: 'var(--text)' }}>{r.referente}</div>
                  <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{r.ruolo}</div>
                  <div className="flex gap-4 text-xs mono">
                    <div>
                      <div style={{ color: 'var(--accent-warm)', fontWeight: 600 }}>{r.giorni_coinvolti}</div>
                      <div style={{ color: 'var(--text-muted)' }}>giorni</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--accent-warm)', fontWeight: 600 }}>{r.ore_coinvolto}h</div>
                      <div style={{ color: 'var(--text-muted)' }}>ore</div>
                    </div>
                  </div>
                  {r.primo_contatto && (
                    <div className="mono text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                      {r.primo_contatto} → {r.ultimo_contatto}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </QuerySection>
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <div className="mono text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
          Inizializzazione database...
        </div>
        <div className="flex gap-1 justify-center">
          {[0,1,2].map(i => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              className="rounded-full"
              style={{ width: 6, height: 6, background: 'var(--text-muted)' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ErrorState({ msg }) {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="mono text-sm" style={{ color: 'var(--accent-warm)' }}>
        Errore DB: {msg}
      </div>
    </div>
  )
}
