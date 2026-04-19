/**
 * Cliente PostgREST propio — reemplaza @supabase/supabase-js
 * Implementa la misma interfaz que usa la app (.from().select/insert/update/delete/eq/ilike/order/range)
 * pero usando fetch directo, sin dependencias externas.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const KEY  = import.meta.env.VITE_API_KEY  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoid2ViX2Fub24ifQ.IIu6Hgh990TJGBVMWsuMk70dBKxJBlqdO3pQCl4PXms'

const HEADERS = {
  'Authorization': 'Bearer ' + KEY,
  'Content-Type':  'application/json',
  'Accept':        'application/json',
}

function buildQuery(table) {
  let _filters  = []   // ['column=eq.value', ...]
  let _order    = null // 'column.asc|desc'
  let _range    = null // [from, to]
  let _select   = '*'
  let _count    = false

  const q = {
    select(cols, opts) {
      _select = cols || '*'
      if (opts && opts.count === 'exact') _count = true
      return q
    },
    eq(col, val) {
      _filters.push(col + '=eq.' + encodeURIComponent(val))
      return q
    },
    ilike(col, val) {
      _filters.push(col + '=ilike.' + encodeURIComponent(val))
      return q
    },
    order(col, opts) {
      _order = col + '.' + ((opts && opts.ascending === false) ? 'desc' : 'asc')
      return q
    },
    range(from, to) {
      _range = [from, to]
      return q
    },
    // Ejecuta el GET y devuelve { data, count, error }
    then(resolve) {
      let url = BASE + '/' + table + '?select=' + encodeURIComponent(_select)
      _filters.forEach(f => { url += '&' + f })
      if (_order) url += '&order=' + _order

      const headers = { ...HEADERS }
      if (_count) headers['Prefer'] = 'count=exact'
      if (_range) headers['Range'] = _range[0] + '-' + _range[1]

      fetch(url, { headers })
        .then(async res => {
          const contentRange = res.headers.get('content-range')
          let count = null
          if (contentRange) {
            const m = contentRange.match(/\/(\d+)$/)
            if (m) count = parseInt(m[1])
          }
          if (!res.ok) {
            const txt = await res.text()
            resolve({ data: null, count: null, error: { message: txt } })
            return
          }
          const data = await res.json()
          resolve({ data, count, error: null })
        })
        .catch(err => resolve({ data: null, count: null, error: { message: err.message } }))

      return q
    },
  }
  return q
}

export const supabase = {
  from(table) {
    return {
      // SELECT
      select(cols, opts) {
        return buildQuery(table).select(cols, opts)
      },
      // INSERT
      async insert(rows) {
        const body = Array.isArray(rows) ? rows : [rows]
        try {
          const res = await fetch(BASE + '/' + table, {
            method: 'POST',
            headers: { ...HEADERS, 'Prefer': 'return=minimal' },
            body: JSON.stringify(body),
          })
          if (!res.ok) {
            const txt = await res.text()
            return { data: null, error: { message: txt } }
          }
          return { data: null, error: null }
        } catch (err) {
          return { data: null, error: { message: err.message } }
        }
      },
      // UPDATE — requiere llamar a .eq() antes para filtrar
      update(data) {
        const filters = []
        const u = {
          eq(col, val) {
            filters.push(col + '=eq.' + encodeURIComponent(val))
            return u
          },
          then(resolve) {
            let url = BASE + '/' + table + '?'
            url += filters.join('&')
            fetch(url, {
              method: 'PATCH',
              headers: { ...HEADERS, 'Prefer': 'return=minimal' },
              body: JSON.stringify(data),
            })
              .then(async res => {
                if (!res.ok) {
                  const txt = await res.text()
                  resolve({ data: null, error: { message: txt } })
                  return
                }
                resolve({ data: null, error: null })
              })
              .catch(err => resolve({ data: null, error: { message: err.message } }))
            return u
          },
        }
        return u
      },
      // DELETE — requiere llamar a .eq() antes para filtrar
      delete() {
        const filters = []
        const d = {
          eq(col, val) {
            filters.push(col + '=eq.' + encodeURIComponent(val))
            return d
          },
          then(resolve) {
            let url = BASE + '/' + table + '?'
            url += filters.join('&')
            fetch(url, {
              method: 'DELETE',
              headers: HEADERS,
            })
              .then(async res => {
                if (!res.ok) {
                  const txt = await res.text()
                  resolve({ data: null, error: { message: txt } })
                  return
                }
                resolve({ data: null, error: null })
              })
              .catch(err => resolve({ data: null, error: { message: err.message } }))
            return d
          },
        }
        return d
      },
    }
  }
}
