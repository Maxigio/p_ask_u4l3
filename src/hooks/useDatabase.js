import { useState, useEffect } from 'react'

export function useDatabase() {
  const [db, setDb] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const SQL = await window.initSqlJs({
          locateFile: () => '/sql-wasm.wasm'
        })
        const response = await fetch('/data/database.sql')
        if (!response.ok) throw new Error(`Fetch fallito: ${response.status}`)
        const sqlText = await response.text()
        if (!cancelled) {
          const db = new SQL.Database()
          db.exec(sqlText)
          setDb(db)
          setLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e)
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { db, loading, error }
}
