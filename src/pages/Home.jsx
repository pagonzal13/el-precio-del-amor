import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useBalance } from '../lib/useBalance'
import { ArrowRight, Sparkles, Heart } from 'lucide-react'
import './Home.css'

export default function Home() {
  const [stats, setStats] = useState(null)
  const [lastExpense, setLastExpense] = useState(null)
  const { debtor, creditor, amount, settled, loading: balanceLoading, settling, settleDebt } = useBalance()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, who_paid, category, date, purpose')
      .order('date', { ascending: false })

    if (!expenses) return

    const total = expenses.reduce((s, e) => s + e.amount, 0)
    const capaTotal = expenses.filter(e => e.who_paid === 'Capa').reduce((s, e) => s + e.amount, 0)
    const pauTotal = expenses.filter(e => e.who_paid === 'Pau').reduce((s, e) => s + e.amount, 0)

    // First day
    const sorted = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date))
    const firstDate = sorted[0]?.date ? new Date(sorted[0].date) : null
    const daysTogether = firstDate
      ? Math.floor((new Date() - firstDate) / (1000 * 60 * 60 * 24))
      : 0

    setStats({ total, capaTotal, pauTotal, count: expenses.length, daysTogetherInApp: daysTogetherInApp(daysTotal(firstDate)) })
    setLastExpense(expenses[0])
  }

  function daysTotal(firstDate) {
    if (!firstDate) return 0
    return Math.floor((new Date() - new Date(firstDate)) / (1000 * 60 * 60 * 24))
  }

  function daysTogetherInApp(d) { return d }

  const fmt = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="hero-badge">
          <Heart size={14} fill="currentColor" />
          <span>Tu app de gastos compartidos</span>
        </div>
        <h1 className="hero-title">
          El Precio<br /><em>del Amor</em>
        </h1>
        <p className="hero-sub">
          Cada céntimo gastado juntos es parte de una anécdota. Aquí podéis guardar todas las vuestras.
        </p>

        <div className="hero-avatars">
          <div className="hero-avatar-wrap">
            <div className="hero-avatar capa">🦦</div>
            <div className="hero-avatar-name" style={{ color: 'var(--capa)' }}>Capa</div>
          </div>
          <div className="hero-connector">
            <span>💛</span>
          </div>
          <div className="hero-avatar-wrap">
            <div className="hero-avatar pau">🦒</div>
            <div className="hero-avatar-name" style={{ color: 'var(--pau)' }}>Pau</div>
          </div>
        </div>
      </div>

      {/* ── BALANCE CARD ── */}
      <div className="balance-hero animate-in">
        {balanceLoading ? (
          <div className="balance-hero-card loading-pulse">Calculando balance…</div>
        ) : settled ? (
          <div className="balance-hero-card settled">
            <span className="balance-emoji">🎉</span>
            <div>
              <div className="balance-main">¡Estáis al día!</div>
              <div className="balance-sub">Ninguno le debe nada al otro. Equilibrio total. 💛</div>
            </div>
          </div>
        ) : (
          <div className={`balance-hero-card owes ${debtor === 'Capa' ? 'capa-owes' : 'pau-owes'}`}>
            <div className="balance-avatars-row">
              <div className={`bal-avatar ${debtor === 'Capa' ? 'capa' : 'pau'}`}>
                {debtor === 'Capa' ? '🦦' : '🦒'}
              </div>
              <div className="bal-arrow">→</div>
              <div className={`bal-avatar ${creditor === 'Capa' ? 'capa' : 'pau'}`}>
                {creditor === 'Capa' ? '🦦' : '🦒'}
              </div>
            </div>
            <div className="balance-text-col">
              <div className="balance-main">
                <span style={{ color: debtor === 'Capa' ? 'var(--capa)' : 'var(--pau)' }}>
                  {debtor === 'Capa' ? '🦦 Capa' : '🦒 Pau'}
                </span>
                {' '}le debe a{' '}
                <span style={{ color: creditor === 'Capa' ? 'var(--capa)' : 'var(--pau)' }}>
                  {creditor === 'Capa' ? '🦦 Capa' : '🦒 Pau'}
                </span>
              </div>
              <div className="balance-amount-big">
                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)}
              </div>
              <div className="balance-sub">Saldo neto acumulado de todos los gastos</div>
              <button
                className="settle-btn"
                onClick={() => settleDebt(debtor, amount)}
                disabled={settling}
              >
                {settling ? '⏳ Saldando…' : '✅ Saldar deuda'}
              </button>
            </div>
          </div>
        )}
      </div>

      {stats && (
        <div className="home-stats animate-in">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>💸</div>
            <div>
              <div className="stat-value">{fmt(stats.total)}</div>
              <div className="stat-label">Total gastado juntos</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--capa-soft)', color: 'var(--capa)' }}>🦦</div>
            <div>
              <div className="stat-value">{fmt(stats.capaTotal)}</div>
              <div className="stat-label">Pagado por Capa</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--pau-soft)', color: 'var(--pau)' }}>🦒</div>
            <div>
              <div className="stat-value">{fmt(stats.pauTotal)}</div>
              <div className="stat-label">Pagado por Pau</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>📖</div>
            <div>
              <div className="stat-value">{stats.count.toLocaleString('es-ES')}</div>
              <div className="stat-label">Momentos registrados</div>
            </div>
          </div>
        </div>
      )}

      <div className="home-cards animate-in">
        <div className="action-card add-card">
          <div className="action-card-icon">✨</div>
          <div>
            <h3>Nuevo gasto</h3>
            <p>Para registrar nuevos momentos</p>
          </div>
          <Link to="/add" className="btn-primary" style={{ marginLeft: 'auto' }}>
            Añadir <ArrowRight size={16} />
          </Link>
        </div>

        <div className="action-card dash-card">
          <div className="action-card-icon">📊</div>
          <div>
            <h3>Ver el dashboard</h3>
            <p>La relación en datos y métricas</p>
          </div>
          <Link to="/dashboard" className="btn-primary" style={{ marginLeft: 'auto' }}>
            Explorar <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {lastExpense && (
        <div className="last-expense animate-in">
          <div className="section-label">
            <Sparkles size={14} />
            Último gasto registrado
          </div>
          <div className="last-expense-card card">
            <div className="last-expense-info">
              <span className="last-cat-badge">{getCatEmoji(lastExpense.category)}</span>
              <div>
                <div className="last-purpose">{lastExpense.purpose}</div>
                <div className="last-meta">
                  <span style={{ color: lastExpense.who_paid === 'Capa' ? 'var(--capa)' : 'var(--pau)' }}>
                    {lastExpense.who_paid === 'Capa' ? '🦦' : '🦒'} {lastExpense.who_paid}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>·</span>
                  <span>{new Date(lastExpense.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
            <div className="last-amount">{fmt(lastExpense.amount)}</div>
          </div>
        </div>
      )}

      <div className="home-manifesto animate-in">
        <div className="manifesto-card card">
          <div className="manifesto-icon">💛</div>
          <p>
            Todos sabemos que una relación no se mide sólo en besos y abrazos. También en las cenas en las que no paráis de hablar y reir,
            los viajes con la mejor compañía, las cerves después de un mal o estupendo día, y los helados que nunca van al estómago sino al corazón.
            <strong> Esto es El Precio del Amor</strong>: vuestra historia contada en momentos de gasto compartido.
          </p>
        </div>
      </div>
    </div>
  )
}

function getCatEmoji(cat) {
  const map = {
    'Bebidas y comidas': '🍽️',
    'Viajes': '✈️',
    'Ocio, cultura, entradas...': '🎭',
    'Hogar': '🏠',
    'Otros': '💫',
  }
  return map[cat] || '💫'
}
