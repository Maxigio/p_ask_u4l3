import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Prism from 'prismjs'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-bash'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }
  }),
}

function CodeBlock({ lang, code }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) Prism.highlightElement(ref.current) }, [])
  return (
    <pre className={`language-${lang}`} style={{ marginTop: '1rem' }}>
      <code ref={ref} className={`language-${lang}`}>{code.trim()}</code>
    </pre>
  )
}

function Section({ index, title, tag, children }) {
  return (
    <motion.section
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="py-10"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-3 mb-6">
        <span className="mono text-xs" style={{ color: 'var(--accent-warm)' }}>
          {String(index).padStart(2, '0')}
        </span>
        {tag && (
          <span
            className="mono text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            {tag}
          </span>
        )}
      </div>
      <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text)' }}>{title}</h2>
      {children}
    </motion.section>
  )
}

function Placeholder({ text }) {
  return (
    <div
      className="rounded-lg p-4 mono text-sm"
      style={{ background: 'var(--code-bg)', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}
    >
      [{text}]
    </div>
  )
}

export default function AlzareIlLivello() {
  const navigate = useNavigate()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-24">

        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="mono text-xs mb-8 flex items-center gap-2 transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ← HUB
        </button>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <h1 className="text-3xl font-semibold mb-3" style={{ color: 'var(--text)' }}>
            Alzare il Livello
          </h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: 480 }}>
            Stack, automazioni, filosofia. Non una lista di feature — un approccio.
          </p>
        </motion.div>

        {/* ── Sezione 1: Software proprietari ── */}
        <Section index={1} title="Software proprietari per post-produzione" tag="workflow">
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
            Quando un tool non esiste o costa troppo tempo da configurare, lo costruisco.
            Tre script interni hanno cambiato il workflow di post-produzione:
            meno click manuali, più output per ora di lavoro.
          </p>
          <Placeholder text="DA COMPLETARE: descrizione dei tool interni — cosa fanno, che problema risolvono, quanto tempo risparmiano" />
          <CodeBlock lang="python" code={`
# Esempio: batch export con preset automatici
import subprocess, pathlib

def export_batch(source_dir, preset="instagram_reel"):
    files = list(pathlib.Path(source_dir).glob("*.mp4"))
    for f in files:
        out = f.with_stem(f.stem + f"_{preset}")
        subprocess.run(["ffmpeg", "-i", str(f),
                        "-vf", PRESETS[preset]["vf"],
                        "-c:v", "libx264", "-crf", "23",
                        str(out)])
    return len(files)
`} />
        </Section>

        {/* ── Sezione 2: Text-to-Speech locale ── */}
        <Section index={2} title="Text-to-Speech locale" tag="privacy · zero costi">
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
            Voiceover generati in locale. Nessuna API esterna, nessun costo per carattere,
            nessun dato che esce dalla macchina. Latenza: sotto il secondo per script brevi.
          </p>
          <Placeholder text="DA COMPLETARE: stack TTS utilizzato (es. Coqui, Piper, Kokoro), modello scelto, lingua italiana, use case concreto nel workflow video" />
          <CodeBlock lang="python" code={`
# TTS locale — generazione voiceover da script
from tts_engine import synthesize

script = """
  Benvenuti al Club Family Hotel.
  Dove ogni famiglia trova il suo spazio.
"""

audio = synthesize(
    text=script,
    voice="it_female_01",
    speed=0.95,
    output="voiceover_spot.wav"
)
`} />
        </Section>

        {/* ── Sezione 3: Ottimizzazione costi AI ── */}
        <Section index={3} title="Ottimizzazione costi AI" tag="prompt chaining · batch">
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
            Le chiamate singole ai modelli sono costose. Il prompt chaining e il batch processing
            riducono il costo per output mantenendo la qualità.
          </p>
          <Placeholder text="DA COMPLETARE: riduzione % costi raggiunta, numero di chiamate risparmiate, contesto d'uso specifico" />

          {/* Schema visivo flusso */}
          <div
            className="rounded-lg p-5 mt-4 mono text-xs"
            style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', lineHeight: 2 }}
          >
            <div style={{ color: 'var(--text-muted)' }}>// flusso prompt chaining</div>
            <div className="mt-2 flex flex-col gap-2">
              {[
                { step: '01', label: 'Input batch', desc: 'N script grezzi', color: '#C8622A' },
                { step: '02', label: 'Classificazione', desc: 'modello leggero (haiku)', color: '#2D4A7A' },
                { step: '03', label: 'Refinement', desc: 'modello capace (solo per output selezionati)', color: '#3A6B4A' },
                { step: '04', label: 'Output', desc: 'N testi ottimizzati', color: '#6B3FA0' },
              ].map(s => (
                <div key={s.step} className="flex items-center gap-3">
                  <span style={{ color: s.color, minWidth: 20 }}>{s.step}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 500, minWidth: 130 }}>{s.label}</span>
                  <span style={{ color: 'var(--text-muted)' }}>→ {s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Sezione 4: Claude + Cursor vs v0 ── */}
        <Section index={4} title="Claude + Cursor vs v0" tag="comparazione">
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
            Questo sito è stato costruito con Claude + Cursor. Non con v0.
            La differenza non è estetica — è strutturale.
          </p>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {[
              {
                tool: 'v0',
                color: '#9B9B93',
                pros: ['Veloce per prototipi UI', 'Output visivo immediato'],
                cons: ['Codice generato opaco', 'Difficile da mantenere', 'Poca flessibilità logica', 'Dipende da Vercel'],
              },
              {
                tool: 'Claude',
                color: '#C8622A',
                pros: ['Ragionamento profondo sul codice', 'Architettura controllata', 'Query SQL complesse', 'Contestualizzato al progetto'],
                cons: [],
              },
              {
                tool: 'Cursor',
                color: '#2D4A7A',
                pros: ['Edit diretto su ogni file', 'Diff review chiaro', 'Nessun lock-in', 'Stack libero'],
                cons: [],
              },
            ].map(c => (
              <div
                key={c.tool}
                className="rounded-lg p-5"
                style={{ border: `1px solid ${c.color}30`, background: `${c.color}08` }}
              >
                <div
                  className="mono font-semibold text-base mb-4"
                  style={{ color: c.color }}
                >
                  {c.tool}
                </div>
                <ul className="text-sm flex flex-col gap-1.5">
                  {c.pros.map((p, i) => (
                    <li key={i} className="flex gap-2" style={{ color: 'var(--text)' }}>
                      <span style={{ color: c.color }}>+</span>{p}
                    </li>
                  ))}
                  {c.cons.map((p, i) => (
                    <li key={i} className="flex gap-2" style={{ color: 'var(--text-muted)' }}>
                      <span>−</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Closing statement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-10 pt-8"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <p className="text-lg font-medium" style={{ color: 'var(--text)', lineHeight: 1.7 }}>
              CFH sta costruendo tool interni. Io lavoro già così —{' '}
              <span style={{ color: 'var(--accent-warm)' }}>
                codice che capisci, decidi e possiedi.
              </span>
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              Non un deliverable. Un sistema.
            </p>
          </motion.div>
        </Section>

      </div>
    </div>
  )
}
