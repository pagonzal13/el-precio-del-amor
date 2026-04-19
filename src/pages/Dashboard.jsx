import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useBalance } from '../lib/useBalance'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'
import './Dashboard.css'

const CAT_COLORS = {
  'Bebidas y comidas': '#fb923c',
  'Ocio, cultura, entradas...': '#a78bfa',
  'Viajes': '#60a5fa',
  'Hogar': '#34d399',
  'Transporte': '#d3c834',
  'Otros': '#94a3b8',
}

const fmt = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
const fmtDec = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { debtor, creditor, amount: owedAmount, settled, loading: balanceLoading, settling, settleDebt } = useBalance()

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: true })

    if (!expenses || expenses.length === 0) {
      setLoading(false)
      return
    }

    setData(processData(expenses))
    setLoading(false)
  }

  if (loading) return (
    <div className="dash-page">
      <div className="dash-header">
        <h1>Dashboard</h1>
      </div>
      <div className="dash-loading">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.07}s` }} />
        ))}
      </div>
    </div>
  )

  if (!data) return (
    <div className="dash-page">
      <div className="dash-header"><h1>Dashboard</h1></div>
      <p style={{ color: 'var(--text-muted)', padding: '40px 0' }}>No hay datos todavía. ¡Añade tu primer gasto!</p>
    </div>
  )

  return (
    <div className="dash-page">
      <div className="dash-header">
        <h1>Dashboard</h1>
        <p>Vuestra historia en números • {data.totalExpenses} gastos desde {data.firstDate}</p>
      </div>

      {/* ── SALDO ACTUAL ── */}
      <div className="dash-balance-widget animate-in">
        {balanceLoading ? (
          <div className="dash-balance-inner loading-pulse">Calculando saldo…</div>
        ) : settled ? (
          <div className="dash-balance-inner settled">
            <div className="db-emoji">🎉</div>
            <div className="db-body">
              <div className="db-title">¡Estáis al día!</div>
              <div className="db-sub">Saldo neto = 0 €. Ninguno le debe nada al otro.</div>
            </div>
          </div>
        ) : (
          <div className={`dash-balance-inner owes ${debtor === 'Capa' ? 'capa-owes' : 'pau-owes'}`}>
            <div className="db-avatars">
              <div className={`db-av ${debtor === 'Capa' ? 'capa' : 'pau'}`}>{debtor === 'Capa' ? '🦦' : '🦒'}</div>
              <div className="db-arr">→</div>
              <div className={`db-av ${creditor === 'Capa' ? 'capa' : 'pau'}`}>{creditor === 'Capa' ? '🦦' : '🦒'}</div>
            </div>
            <div className="db-body">
              <div className="db-title">
                <span style={{ color: debtor === 'Capa' ? 'var(--capa)' : 'var(--pau)' }}>
                  {debtor}
                </span>
                {' le debe a '}
                <span style={{ color: creditor === 'Capa' ? 'var(--capa)' : 'var(--pau)' }}>
                  {creditor}
                </span>
              </div>
              <div className="db-amount">{fmtDec(owedAmount)}</div>
            </div>
            <button
              className="settle-btn"
              onClick={() => settleDebt(debtor, owedAmount)}
              disabled={settling}
            >
              {settling ? '⏳ Saldando…' : '✅ Saldar deuda'}
            </button>
            <div className="db-label-right">Saldo neto acumulado</div>
          </div>
        )}
      </div>

      {/* KPI row */}
      <div className="kpi-grid animate-in">
        <KpiCard emoji="💸" label="Total gastado" value={fmt(data.totalAmount)} sub="desde el primer día" />
        <KpiCard emoji="📅" label="Días de historia" value={data.daysTogether} sub="registrando juntos" />
        <KpiCard emoji="📊" label="Media por gasto" value={fmtDec(data.avgExpense)} sub="por ticket" />
        <KpiCard emoji="🔥" label="Racha máxima" value={`${data.maxStreak} días`} sub="gastando seguidos" />
      </div>

      {/* Balance */}
      <div className="balance-section animate-in">
        <div className="section-title">⚖️ Balance entre vosotros</div>
        <div className="balance-cards">
          <div className="balance-card capa-card">
            <div className="balance-avatar">🦦</div>
            <div className="balance-name" style={{ color: 'var(--capa)' }}>Capa</div>
            <div className="balance-amount">{fmt(data.capaPaid)}</div>
            <div className="balance-pct">{data.capaPct.toFixed(1)}% del total</div>
            <div className="balance-bar-wrap">
              <div className="balance-bar capa-bar" style={{ width: `${data.capaPct}%` }} />
            </div>
          </div>
          <div className="balance-vs">
            <div className="vs-circle">VS</div>
            {Math.abs(data.capaPaid - data.pauPaid) < 1 ? (
              <div className="vs-note">¡Perfectamente igualados! 🎯</div>
            ) : (
              <div className="vs-note">
                {data.capaPaid > data.pauPaid ? '🦦 Capa' : '🦒 Pau'} ha pagado más<br />
                <strong style={{ color: 'var(--accent)' }}>{fmtDec(Math.abs(data.capaPaid - data.pauPaid))}</strong>
              </div>
            )}
          </div>
          <div className="balance-card pau-card">
            <div className="balance-avatar">🦒</div>
            <div className="balance-name" style={{ color: 'var(--pau)' }}>Pau</div>
            <div className="balance-amount">{fmt(data.pauPaid)}</div>
            <div className="balance-pct">{data.pauPct.toFixed(1)}% del total</div>
            <div className="balance-bar-wrap">
              <div className="balance-bar pau-bar" style={{ width: `${data.pauPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly trend */}
      <div className="chart-card animate-in">
        <div className="section-title">📈 Gasto mensual acumulado</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data.monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f5c842" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f5c842" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fill: '#5a5a78', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#5a5a78', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', fontSize: '13px' }}
              labelStyle={{ color: '#f0f0f8' }}
              formatter={v => [fmt(v), 'Gastado']}
            />
            <Area type="monotone" dataKey="total" stroke="#f5c842" strokeWidth={2} fill="url(#grad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Who pays by month */}
      <div className="chart-card animate-in">
        <div className="section-title">🦦🦒 Quién pagó cada mes</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barCategoryGap="30%">
            <XAxis dataKey="month" tick={{ fill: '#5a5a78', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#5a5a78', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', fontSize: '13px' }}
              formatter={(v, name) => [fmt(v), name === 'capa' ? '🦦 Capa' : '🦒 Pau']}
            />
            <Bar dataKey="capa" fill="#7c9fff" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pau" fill="#ff8fab" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Categories */}
      <div className="two-col animate-in">
        <div className="chart-card">
          <div className="section-title">🗂️ Por categoría</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.byCategory}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {data.byCategory.map((entry) => (
                  <Cell key={entry.name} fill={CAT_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', fontSize: '13px' }}
                formatter={v => [fmt(v)]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="cat-legend">
            {data.byCategory.map(c => (
              <div key={c.name} className="legend-item">
                <div className="legend-dot" style={{ background: CAT_COLORS[c.name] }} />
                <span className="legend-name">{c.name}</span>
                <span className="legend-val">{fmt(c.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="section-title">📅 Por año</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.byYear} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: '#5a5a78', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="year" tick={{ fill: '#9898b8', fontSize: 13, fontWeight: 600 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', fontSize: '13px' }}
                formatter={v => [fmt(v), 'Total']}
              />
              <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                {data.byYear.map((_, i) => (
                  <Cell key={i} fill={`hsl(${45 + i * 18}, 90%, ${55 + i * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="year-milestones">
            {data.byYear.map(y => (
              <div key={y.year} className="milestone">
                <span className="milestone-year">{y.year}</span>
                <span className="milestone-count">{y.count} gastos</span>
                <span className="milestone-avg">{fmtDec(y.total / y.count)} media</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fun stats */}
      <div className="fun-stats animate-in">
        <div className="section-title">✨ Curiosidades de vuestra relación</div>
        <div className="fun-grid">
          <FunCard emoji="🍽️" title="Comida & bebida" value={fmt(data.catAmounts['Bebidas y comidas'] || 0)} sub={`${data.catCounts['Bebidas y comidas'] || 0} momentos alrededor de una mesa`} />
          <FunCard emoji="✈️" title="Aventuras viajeras" value={fmt(data.catAmounts['Viajes'] || 0)} sub={`${data.catCounts['Viajes'] || 0} escapadas juntos`} />
          <FunCard emoji="🎭" title="Cultura y ocio" value={fmt(data.catAmounts['Ocio, cultura, entradas...'] || 0)} sub={`${data.catCounts['Ocio, cultura, entradas...'] || 0} planes de entretenimiento`} />
          <FunCard emoji="📆" title="Mes más caro" value={data.hottestMonth.month} sub={fmt(data.hottestMonth.total)} />
          <FunCard emoji="💡" title="Gasto más grande" value={fmtDec(data.biggestExpense.amount)} sub={data.biggestExpense.purpose} />
          <FunCard emoji="☕" title="Gasto más pequeño" value={fmtDec(data.smallestExpense.amount)} sub={data.smallestExpense.purpose} />
          <FunCard emoji="💰" title="Gasto diario medio" value={fmtDec(data.dailyAvg)} sub="de media cada día desde el inicio" />
          <FunCard emoji="🏆" title="Apodos registrados" value={data.nicknameCount} sub="gastos con nombre cariñoso" />
        </div>
      </div>

      {/* Top 10 biggest */}
      <div className="chart-card animate-in">
        <div className="section-title">🏆 Los 10 gastos más grandes</div>
        <div className="top-list">
          {data.top10.map((e, i) => (
            <div key={e.id} className="top-item">
              <div className="top-rank">{i + 1}</div>
              <div className="top-info">
                <div className="top-purpose">{e.purpose}</div>
                <div className="top-meta">
                  <span className={e.who_paid === 'Capa' ? 'capa-text' : 'pau-text'}>
                    {e.who_paid === 'Capa' ? '🦦' : '🦒'} {e.who_paid}
                  </span>
                  <span>·</span>
                  <span>{new Date(e.date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="top-amount">{fmtDec(e.amount)}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

function KpiCard({ emoji, label, value, sub }) {
  return (
    <div className="kpi-card">
      <div className="kpi-emoji">{emoji}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  )
}

function FunCard({ emoji, title, value, sub }) {
  return (
    <div className="fun-card">
      <div className="fun-emoji">{emoji}</div>
      <div className="fun-title">{title}</div>
      <div className="fun-value">{value}</div>
      <div className="fun-sub">{sub}</div>
    </div>
  )
}

function processData(expenses) {
  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0)
  const totalExpenses = expenses.length
  const avgExpense = totalAmount / totalExpenses

  const capaPaid = expenses.filter(e => e.who_paid === 'Capa').reduce((s, e) => s + e.amount, 0)
  const pauPaid = expenses.filter(e => e.who_paid === 'Pau').reduce((s, e) => s + e.amount, 0)
  const capaPct = (capaPaid / totalAmount) * 100
  const pauPct = (pauPaid / totalAmount) * 100

  const firstDate = new Date(expenses[0].date)
  const daysTogether = Math.floor((new Date() - firstDate) / (1000 * 60 * 60 * 24))
  const dailyAvg = totalAmount / daysTogether

  const firstDateStr = firstDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  // Monthly data
  const monthMap = {}
  expenses.forEach(e => {
    const d = new Date(e.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
    if (!monthMap[key]) monthMap[key] = { month: label, total: 0, capa: 0, pau: 0, count: 0 }
    monthMap[key].total += e.amount
    monthMap[key][e.who_paid === 'Capa' ? 'capa' : 'pau'] += e.amount
    monthMap[key].count++
  })
  const monthly = Object.values(monthMap)

  // Hottest month
  const hottestMonth = monthly.reduce((max, m) => m.total > max.total ? m : max, monthly[0])

  // By category
  const catMap = {}
  const catCountMap = {}
  expenses.forEach(e => {
    catMap[e.category] = (catMap[e.category] || 0) + e.amount
    catCountMap[e.category] = (catCountMap[e.category] || 0) + 1
  })
  const byCategory = Object.entries(catMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // By year
  const yearMap = {}
  expenses.forEach(e => {
    const y = new Date(e.date).getFullYear().toString()
    if (!yearMap[y]) yearMap[y] = { year: y, total: 0, count: 0 }
    yearMap[y].total += e.amount
    yearMap[y].count++
  })
  const byYear = Object.values(yearMap).sort((a, b) => a.year.localeCompare(b.year))

  // Top 10
  const top10 = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 10)

  // Biggest / smallest
  const biggestExpense = top10[0]
  const smallestExpense = [...expenses].sort((a, b) => a.amount - b.amount)[0]

  // Nicknames
  const nicknameCount = expenses.filter(e => e.nickname).length

  // Max streak (days with at least one expense)
  const expDays = new Set(expenses.map(e => e.date.slice(0, 10)))
  const sortedDays = [...expDays].sort()
  let maxStreak = 1, cur = 1
  for (let i = 1; i < sortedDays.length; i++) {
    const diff = (new Date(sortedDays[i]) - new Date(sortedDays[i - 1])) / 86400000
    if (diff === 1) { cur++; maxStreak = Math.max(maxStreak, cur) }
    else cur = 1
  }

  return {
    totalAmount, totalExpenses, avgExpense, capaPaid, pauPaid, capaPct, pauPct,
    daysTogether, dailyAvg, firstDate: firstDateStr,
    monthly, hottestMonth, byCategory, byYear, top10,
    biggestExpense, smallestExpense, nicknameCount, maxStreak,
    catAmounts: catMap, catCounts: catCountMap,
  }
}
