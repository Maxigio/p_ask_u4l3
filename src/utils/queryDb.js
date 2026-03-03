/**
 * Esegue una query SQL e restituisce un array di oggetti { colonna: valore }
 * @param {Object} db - Istanza sql.js Database
 * @param {string} sql - Query SQL
 * @returns {Array<Object>}
 */
export function runQuery(db, sql) {
  try {
    const result = db.exec(sql)
    if (!result || result.length === 0) return []
    const { columns, values } = result[0]
    if (!columns || !values) return []
    return values.map(row => {
      const obj = {}
      columns.forEach((col, i) => { obj[col] = row[i] })
      return obj
    })
  } catch (e) {
    console.error('runQuery error:', e.message, '\nSQL:', sql)
    return []
  }
}
