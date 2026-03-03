import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

function useWindowWidth() {
  const [w, setW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
}


function FlowDiagram({ steps, header = 'flusso' }) {
  return (
    <div
      className="rounded-lg mono text-xs"
      style={{
        background: 'var(--code-bg)',
        border: '1px solid var(--border)',
        padding: '20px 24px 24px',
        marginTop: '1.5rem',
      }}
    >
      <div style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>// {header}</div>
      <div className="flex flex-col gap-4">
        {steps.map(s => (
          <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: s.color, minWidth: 20, paddingTop: 2, flexShrink: 0 }}>{s.step}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--text)', fontWeight: 500, lineHeight: 1.4 }}>{s.label}</div>
              {s.desc && (
                <div style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 4 }}>→ {s.desc}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const SECTIONS = [
  { index: '01', color: '#C8622A', title: 'Meglio di v0', tag: 'comparazione' },
  { index: '02', color: '#2D4A7A', title: 'Meglio del videomaker disorganizzato che hai conosciuto', tag: 'workflow' },
  { index: '03', color: '#3A6B4A', title: 'Codice proprietario per gestire la post-produzione', tag: 'Addio Adobe Suite' },
  { index: '04', color: '#6B3FA0', title: 'Da uno storyboard CSV a una timeline pronta', tag: 'automazione' },
]


export default function AlzareIlLivello() {
  const navigate = useNavigate()
  const w = useWindowWidth()
  const sm = w < 480
  const md = w < 768
  const lg = w >= 1200

  const paddingX = sm ? 16 : md ? 24 : lg ? 56 : 40
  const leftColW = sm ? 32 : md ? 40 : lg ? 64 : 56
  const lineLeft = paddingX + leftColW / 2 - 1
  const maxW     = lg ? 940 : 800

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Accent bar ── */}
      <div style={{
        height: 3,
        background: 'linear-gradient(90deg, #C8622A 0%, #2D4A7A 40%, #3A6B4A 70%, #6B3FA0 100%)',
      }} />

      {/* ── Header ── */}
      <div style={{
        padding: sm ? '28px 16px 40px' : md ? '36px 24px 48px' : lg ? '56px 48px 64px' : '48px 40px 56px',
        maxWidth: maxW,
        margin: '0 auto',
      }}>
        <button
          onClick={() => navigate('/')}
          className="mono text-xs flex items-center gap-2 transition-opacity hover:opacity-60"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)', marginBottom: sm ? 24 : 32 }}
        >
          ← HUB
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center' }}
        >
          <div
            className="mono"
            style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--accent-warm)', marginBottom: 14, textTransform: 'uppercase' }}
          >
            Cose che ho fatto per
          </div>
          <h1
            style={{
              fontSize: sm ? 36 : md ? 48 : lg ? 72 : 60,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text)',
              lineHeight: 1.05,
              marginBottom: 20,
            }}
          >
            alzare il livello
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: sm ? 14 : lg ? 16 : 15, maxWidth: 400, margin: '0 auto', lineHeight: 1.7 }}>
            Mi trovi con le mani infuocate e la tastiera in fiamme
          </p>
        </motion.div>
      </div>

      {/* ── Timeline ── */}
      <div
        style={{
          maxWidth: maxW,
          margin: '0 auto',
          padding: `0 ${paddingX}px ${sm ? 48 : lg ? 64 : 56}px`,
          position: 'relative',
        }}
      >
        {/* Vertical line */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: lineLeft,
            top: 10,
            bottom: 40,
            width: 2,
            background: 'linear-gradient(180deg, #C8622A 0%, #2D4A7A 35%, #3A6B4A 65%, #6B3FA0 100%)',
            opacity: 0.25,
            borderRadius: 2,
          }}
        />

        {/* ── 01: Meglio di v0 ── */}
        <TimelineSection index={0} sectionData={SECTIONS[0]} sm={sm} md={md} lg={lg} leftColW={leftColW}>
          <p style={{ color: 'var(--text-muted)', fontSize: sm ? 13 : 14, marginBottom: 24, lineHeight: 1.7 }}>
            Realizzo tanto codice con pochissimi errori spendendo poco — perché non perdo mai il contesto.
          </p>

          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: sm ? '1fr' : 'repeat(3, 1fr)' }}
          >
            {[
              {
                tool: 'v0',
                color: '#9B9B93',
                pros: ['Veloce per prototipi UI', 'Output visivo immediato'],
                cons: ['Offerta poco trasparente', 'Poca flessibilità logica', 'Limitato nel mantenimento del contesto'],
              },
              {
                tool: 'Claude',
                color: '#C8622A',
                pros: ['Un sacco di offerte dove ti riempiono di usage gratis', 'Il servizio più trasparente dei 3', 'Se ti fai furbo puoi usarlo tantissimo spendendo pochissimo'],
                cons: ['Ha degli usage limit obbligatori un po\' noiosi'],
              },
              {
                tool: 'Cursor',
                color: '#2D4A7A',
                pros: ['Agent locale quasi illimitato che ti aiuta', "Usa il tuo modello preferito direttamente dall'IDE", 'Ospita modelli migliori di quelli di Anthropic di default'],
                cons: ['Più costoso di Claude', 'Se non aggiungi i modelli è come se Cursor li comprasse e te li rivendesse, comunque più sostenibile di v0!'],
              },
            ].map(c => (
              <div
                key={c.tool}
                className="rounded-lg"
                style={{ border: `1px solid ${c.color}30`, background: `${c.color}08`, padding: '18px 18px 22px' }}
              >
                <div className="mono font-semibold text-sm" style={{ color: c.color, marginBottom: 14 }}>{c.tool}</div>
                <ul className="text-xs flex flex-col gap-2">
                  {c.pros.map((p, i) => (
                    <li key={i} className="flex gap-2" style={{ color: 'var(--text)', lineHeight: 1.5 }}>
                      <span style={{ color: c.color, flexShrink: 0 }}>+</span>{p}
                    </li>
                  ))}
                  {c.cons.map((p, i) => (
                    <li key={i} className="flex gap-2" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      <span style={{ flexShrink: 0 }}>−</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="rounded-lg"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '20px 24px', marginTop: 32 }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--text)', lineHeight: 1.8 }}>
              Fun Fact! Ho bruciato un sacco di abbonamenti per arrivare a dirti questo!{' '}
              L'ottimizzazione di cui ti parlo fa parte di una strategia che ho ideato, ma ho trovato anche chi lo fa meglio,{' '}
              <a
                href="https://www.youtube.com/@techkevinshow/videos"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#C8622A', textDecoration: 'underline', textUnderlineOffset: 3 }}
              >
                tipo lui!
              </a>
            </p>
          </div>
        </TimelineSection>

        {/* ── 02: Workflow ── */}
        <TimelineSection index={1} sectionData={SECTIONS[1]} sm={sm} md={md} lg={lg} leftColW={leftColW}>
          <p style={{ color: 'var(--text-muted)', fontSize: sm ? 13 : 14, marginBottom: 0, lineHeight: 1.7 }}>
            Ho realizzato delle chat perenni che mi permettono di organizzare la mia vita
            e il mio lavoro in modo più sereno ed efficiente.
          </p>

          <div
            className="rounded-lg mono text-xs"
            style={{
              background: 'var(--code-bg)',
              border: '1px solid var(--border)',
              padding: '20px 20px 24px',
              marginTop: '1.5rem',
            }}
          >
            {[
              { step: '01', color: '#C8622A', label: 'Idea per uno storyboard', note: 'Lo storyboard a cui mi riferisco è valido per il punto 4.' },
              { step: '02', color: '#2D4A7A', label: 'Input testuale + file di contesto', note: 'Ho realizzato dei file di contesto fissi da abbinare ai miei prompt, in modo da realizzare quello che mi serve il prima possibile.' },
              { step: '03', color: '#3A6B4A', label: 'Revisione', note: 'Punto debole, ma posso migliorarlo.' },
              { step: '04', color: '#6B3FA0', label: 'Storyboard leggibile anche da un programma di montaggio', note: null },
            ].map((s, i, arr) => (
              <div
                key={s.step}
                style={{
                  display: 'flex',
                  gap: 12,
                  paddingBottom: i < arr.length - 1 ? 18 : 0,
                  marginBottom: i < arr.length - 1 ? 18 : 0,
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <span style={{ color: s.color, minWidth: 20, paddingTop: 1, flexShrink: 0 }}>{s.step}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--text)', fontWeight: 500, lineHeight: 1.5 }}>{s.label}</div>
                  {s.note && <div style={{ color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.6 }}>{s.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </TimelineSection>

        {/* ── 03: Post-produzione ── */}
        <TimelineSection index={2} sectionData={SECTIONS[2]} sm={sm} md={md} lg={lg} leftColW={leftColW}>
          <p style={{ color: 'var(--text-muted)', fontSize: sm ? 13 : 14, marginBottom: 20, lineHeight: 1.7 }}>
            Ho ripensato i miei processi di post-produzione per essere più produttivo
            e consegnare foto e video, di tutti i tipi, più velocemente!
          </p>

          <a
            href="https://vista360degree.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg"
            style={{
              display: 'block',
              background: '#3A6B4A',
              color: '#fff',
              padding: sm ? '18px 20px' : '22px 28px',
              textDecoration: 'none',
              fontSize: sm ? 13 : 14,
              fontWeight: 500,
              lineHeight: 1.75,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Ho iniziato portando il tempo di post-produzione di un servizio foto + video 360° da 30h a 8h,{' '}
            <span style={{ opacity: 0.8 }}>il che mi ha portato al punto 4 → e a rendere il servizio accessibile attraverso questo pulsante</span>
          </a>
        </TimelineSection>

        {/* ── 04: CSV → FCPXML ── */}
        <TimelineSection index={3} sectionData={SECTIONS[3]} sm={sm} md={md} lg={lg} leftColW={leftColW} last>
          <p style={{ color: 'var(--text-muted)', fontSize: sm ? 13 : 14, marginBottom: 0, lineHeight: 1.7 }}>
            Grazie al servizio dei 360° ho avuto la possibilità di realizzare 12 video per un corso
            di sicurezza sul lavoro. Io ricevo file video e storyboard CSV, e grazie a un file{' '}
            <span className="mono" style={{ fontSize: 12, color: 'var(--text)' }}>.fcpxml</span>{' '}
            creo istantaneamente una timeline pronta alla fase di color grading.
          </p>

          <FlowDiagram
            header="Iter"
            steps={[
              { step: '01', label: 'storyboard.csv', desc: 'Ricevo lo storyboard e lo abbino a un file di contesto ideato da me, dopodiché lo do in pasto a una mia chat con Claude.', color: '#6B3FA0' },
              { step: '02', label: 'csv_to_fcpxml.py', desc: 'Un simpatico script legge il CSV e mi genera un file leggibile dai tool interni e da tutti i programmi di montaggio (anche nelle versioni free).', color: '#C8622A' },
              { step: '03', label: 'Revisione e Color grading', desc: 'Materiale ancora modificabile e revisionabile prima del render finale.', color: '#2D4A7A' },
            ]}
          />
        </TimelineSection>

      </div>

      {/* ── Closing — fuori dalla timeline, centrato ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        style={{
          textAlign: 'center',
          padding: sm ? '40px 24px 80px' : md ? '48px 32px 88px' : lg ? '64px 56px 112px' : '56px 40px 96px',
          maxWidth: maxW,
          margin: '0 auto',
          borderTop: '1px solid var(--border)',
        }}
      >
        <p
          style={{
            fontSize: sm ? 15 : lg ? 18 : 17,
            fontWeight: 500,
            color: 'var(--text)',
            lineHeight: 1.8,
            maxWidth: 480,
            margin: '0 auto',
          }}
        >
          Spero che ti sia piaciuto vedere questo sito — quando non edito i video studio, quindi{' '}
          <span style={{ color: '#6B3FA0' }}>se vuoi propormi di studiare qualcosa</span>{' '}
          <span style={{ color: '#C8622A' }}>io sono a disposizione!</span>
        </p>
      </motion.div>

    </div>
  )
}

function TimelineSection({ index, sectionData, sm, md, lg, leftColW, children, last = false }) {
  const dotSize = 10

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      style={{
        paddingBottom: last ? 0 : sm ? 56 : lg ? 88 : 72,
        position: 'relative',
      }}
    >
      {/* Full-width centered header */}
      <div style={{ textAlign: 'center', marginBottom: sm ? 24 : lg ? 40 : 32 }}>
        <div className="flex items-center justify-center gap-2 flex-wrap" style={{ marginBottom: 10 }}>
          <span
            className="mono text-xs"
            style={{ color: sectionData.color, fontWeight: 600, letterSpacing: '0.08em' }}
          >
            {sectionData.index}
          </span>
          {sectionData.tag && (
            <span
              className="mono text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              {sectionData.tag}
            </span>
          )}
        </div>
        <h2
          style={{
            fontSize: sm ? 17 : md ? 20 : lg ? 26 : 22,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text)',
            lineHeight: 1.3,
            maxWidth: '100%',
            margin: '0 auto',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            padding: sm ? '0 4px' : '0',
          }}
        >
          {sectionData.title}
        </h2>
      </div>

      {/* Dot + content row */}
      <div style={{ display: 'flex', gap: sm ? 16 : lg ? 32 : 24 }}>
        {/* Left: dot */}
        <div
          style={{
            width: leftColW,
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 4,
          }}
        >
          <div
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              background: sectionData.color,
              boxShadow: `0 0 0 3px ${sectionData.color}22`,
              flexShrink: 0,
            }}
          />
        </div>

        {/* Right: content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {children}
        </div>
      </div>
    </motion.div>
  )
}
