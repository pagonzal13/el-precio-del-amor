import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Search, Download } from 'lucide-react'
import './History.css'

const CATEGORIES = ['Todas', 'Bebidas y comidas', 'Ocio, cultura, entradas...', 'Viajes', 'Hogar', 'Otros']
const CAT_EMOJI = {
  'Bebidas y comidas': '🍽️',
  'Ocio, cultura, entradas...': '🎭',
  'Viajes': '✈️',
  'Hogar': '🏠',
  'Otros': '💫',
}
const PAGE_SIZE = 40

// Columns en el mismo orden que la tabla de expenses en PostgreSQL
const CSV_COLUMNS = [
  'id', 'created_at', 'purpose', 'nickname', 'amount', 'currency',
  'who_paid', 'split_type', 'for_whom', 'split_amounts', 'category',
  'date', 'include_in_balance'
]

function escapeCsvField(val) {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

async function exportAllToCsv() {
  // Descarga todos los gastos sin paginación
  const PAGE = 1000
  let allData = []
  let offset = 0
  let total = null

  do {
    const { data, count, error } = await supabase
      .from('expenses')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false })
      .range(offset, offset + PAGE - 1)

    if (error || !data) break
    if (total === null) total = count || 0
    allData = allData.concat(data)
    offset += PAGE
  } while (offset < total)

  // Construir CSV
  const rows = [CSV_COLUMNS.join(',')]
  for (const exp of allData) {
    const row = CSV_COLUMNS.map(col => {
      const val = exp[col]
      // Arrays (for_whom, split_amounts) — serializar como JSON para reimportar fácilmente
      if (Array.isArray(val)) return escapeCsvField(JSON.stringify(val))
      return escapeCsvField(val)
    })
    rows.push(row.join(','))
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gastos_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function History() {
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('Todas')
  const [payerFilter, setPayerFilter] = useState('Todos')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)

    let q = supabase
      .from('expenses')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (catFilter !== 'Todas') q = q.eq('category', catFilter)
    if (payerFilter !== 'Todos') q = q.eq('who_paid', payerFilter)
    if (search.trim()) q = q.ilike('purpose', `%${search.trim()}%`)

    const { data, count } = await q
    setExpenses(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [page, catFilter, payerFilter, search])

  useEffect(() => {
    setPage(0)
  }, [catFilter, payerFilter, search])

  useEffect(() => {
    load()
  }, [load])

  const fmt = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
  const fmtDate = (d) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })

  const handleExport = async () => {
    setExporting(true)
    await exportAllToCsv()
    setExporting(false)
  }

  // Group by month
  const grouped = {}
  expenses.forEach(e => {
    const key = new Date(e.date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(e)
  })

  return (
    <div className="history-page">
      <div className="history-header">
        <div className="history-header-top">
          <div>
            <h1>Historial</h1>
            <p>{total.toLocaleString('es-ES')} momentos guardados</p>
          </div>
          <button
            className="btn-export"
            onClick={handleExport}
            disabled={exporting}
            title="Exportar todos los gastos a CSV"
          >
            <Download size={16} />
            {exporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
        </div>
      </div>

      <div className="history-filters">
        <div className="search-wrap">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          <div className="filter-group">
            {['Todos', 'Capa', 'Pau'].map(p => (
              <button
                key={p}
                className={`filter-pill ${payerFilter === p ? 'active' : ''}`}
                onClick={() => setPayerFilter(p)}
              >
                {p === 'Capa' ? '🦦 ' : p === 'Pau' ? '🦒 ' : ''}{p}
              </button>
            ))}
          </div>

          <select
            className="cat-select"
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c !== 'Todas' ? `${CAT_EMOJI[c]} ` : ''}{c}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="history-loading">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="history-empty">
          <span style={{ fontSize: '48px' }}>🔍</span>
          <p>No hay gastos con estos filtros</p>
        </div>
      ) : (
        <div className="history-list">
          {Object.entries(grouped).map(([month, items]) => (
            <div key={month} className="month-group">
              <div className="month-header">
                <span className="month-label">{month}</span>
                <span className="month-sum">{fmt(items.reduce((s, e) => s + e.amount, 0))}</span>
              </div>
              {items.map(exp => (
                <ExpenseRow
                  key={exp.id}
                  exp={exp}
                  fmt={fmt}
                  fmtDate={fmtDate}
                  onClick={() => navigate(`/edit/${exp.id}`)}
                />
              ))}
            </div>
          ))}

          <div className="pagination">
            <button
              className="btn-ghost"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              ← Anterior
            </button>
            <span className="page-info">
              {page + 1} / {Math.ceil(total / PAGE_SIZE) || 1}
            </span>
            <button
              className="btn-ghost"
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage(p => p + 1)}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ExpenseRow({ exp, fmt, fmtDate, onClick }) {
  return (
    <div className="expense-row expense-row--clickable" onClick={onClick}>
      <div className="exp-cat-icon">{CAT_EMOJI[exp.category] || '💫'}</div>
      <div className="exp-info">
        <div className="exp-purpose">{exp.purpose}</div>
        {exp.nickname && <div className="exp-nickname">✨ {exp.nickname}</div>}
        <div className="exp-meta">
          <span className={`exp-payer ${exp.who_paid.toLowerCase()}`}>
            {exp.who_paid === 'Capa' ? '🦦' : '🦒'} {exp.who_paid}
          </span>
          <span className="sep">·</span>
          <span className="exp-cat-tag">{exp.category}</span>
          <span className="sep">·</span>
          <span className="exp-date">{fmtDate(exp.date)}</span>
        </div>
      </div>
      <div className="exp-right">
        <div className="exp-amount">{fmt(exp.amount)}</div>
        <div className="exp-edit-hint">✏️</div>
      </div>
    </div>
  )
}
