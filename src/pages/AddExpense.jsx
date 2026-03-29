import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CheckCircle, AlertCircle } from 'lucide-react'
import './AddExpense.css'

const CATEGORIES = [
  { value: 'Bebidas y comidas', emoji: '🍽️' },
  { value: 'Ocio, cultura, entradas...', emoji: '🎭' },
  { value: 'Viajes', emoji: '✈️' },
  { value: 'Hogar', emoji: '🏠' },
  { value: 'Otros', emoji: '💫' },
]

export default function AddExpense() {
  const navigate = useNavigate()
  const [status, setStatus] = useState(null) // null | 'loading' | 'success' | 'error'

  const [form, setForm] = useState({
    purpose: '',
    amount: '',
    currency: 'EUR',
    who_paid: 'Capa',
    split_type: 'equal',
    solo_for: 'Capa',
    capa_amount: '',
    pau_amount: '',
    category: 'Bebidas y comidas',
    nickname: '',
    date: new Date().toISOString().slice(0, 16),
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function handleSubmit() {
    if (!form.purpose.trim() || !form.amount) {
      setStatus('error-fields')
      return
    }

    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) {
      setStatus('error-fields')
      return
    }

    let for_whom = []
    let split_amounts = []

    if (form.split_type === 'equal') {
      for_whom = ['Capa', 'Pau']
      split_amounts = [amount / 2, amount / 2]
    } else if (form.split_type === 'solo') {
      for_whom = [form.solo_for]
      split_amounts = [amount]
    } else {
      // custom
      const ca = parseFloat(form.capa_amount) || 0
      const pa = parseFloat(form.pau_amount) || 0
      for_whom = ['Capa', 'Pau']
      split_amounts = [ca, pa]
    }

    setStatus('loading')

    const { error } = await supabase.from('expenses').insert({
      purpose: form.purpose.trim(),
      nickname: form.nickname.trim() || null,
      amount,
      currency: form.currency,
      who_paid: form.who_paid,
      split_type: form.split_type,
      for_whom,
      split_amounts,
      category: form.category,
      date: new Date(form.date).toISOString(),
      include_in_balance: true,
    })

    if (error) {
      console.error(error)
      setStatus('error')
    } else {
      setStatus('success')
      setTimeout(() => navigate('/history'), 1400)
    }
  }

  if (status === 'success') {
    return (
      <div className="add-page">
        <div className="success-screen">
          <CheckCircle size={64} color="var(--green)" strokeWidth={1.5} />
          <h2>¡Gasto guardado!</h2>
          <p>Redirigiendo al historial…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="add-page">
      <div className="add-header">
        <h1>Nuevo gasto</h1>
        <p>¿En qué habéis gastado juntos?</p>
      </div>

      <div className="add-form">
        <div className="form-section">
          <label className="form-label">¿Cómo lo llamamos?</label>
          <input
            className="form-input"
            type="text"
            placeholder="p.ej. Cena en La Pepita, Vuelo a Lisboa..."
            value={form.purpose}
            onChange={e => set('purpose', e.target.value)}
          />
        </div>

        <div className="form-section">
          <label className="form-label">Apodo entre vosotros <span className="optional">opcional</span></label>
          <input
            className="form-input"
            type="text"
            placeholder="p.ej. «La noche que descubrimos el txakoli»"
            value={form.nickname}
            onChange={e => set('nickname', e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-section" style={{ flex: 2 }}>
            <label className="form-label">Cantidad</label>
            <div className="amount-input-wrap">
              <input
                className="form-input amount-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
              />
              <div className="currency-badge">€</div>
            </div>
          </div>
          <div className="form-section" style={{ flex: 1 }}>
            <label className="form-label">Divisa</label>
            <select className="form-input" value={form.currency} onChange={e => set('currency', e.target.value)}>
              <option value="EUR">EUR €</option>
              <option value="USD">USD $</option>
              <option value="GBP">GBP £</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <label className="form-label">¿Quién pagó?</label>
          <div className="payer-selector">
            {['Capa', 'Pau'].map(p => (
              <button
                key={p}
                className={`payer-btn ${form.who_paid === p ? 'active' : ''} ${p.toLowerCase()}`}
                onClick={() => set('who_paid', p)}
              >
                {p === 'Capa' ? '🦦' : '🦒'} {p}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label className="form-label">¿Cómo se divide?</label>
          <div className="split-tabs">
            {[
              { value: 'equal', label: '⚖️ A partes iguales' },
              { value: 'solo', label: '👤 Solo para uno' },
              { value: 'custom', label: '✏️ Cantidades personalizadas' },
            ].map(s => (
              <button
                key={s.value}
                className={`split-tab ${form.split_type === s.value ? 'active' : ''}`}
                onClick={() => set('split_type', s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {form.split_type === 'solo' && (
            <div className="split-detail">
              <label className="form-label" style={{ fontSize: '13px' }}>¿Para quién?</label>
              <div className="payer-selector">
                {['Capa', 'Pau'].map(p => (
                  <button
                    key={p}
                    className={`payer-btn ${form.solo_for === p ? 'active' : ''} ${p.toLowerCase()}`}
                    onClick={() => set('solo_for', p)}
                  >
                    {p === 'Capa' ? '🦦' : '🦒'} {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.split_type === 'custom' && (
            <div className="split-detail split-custom">
              <div>
                <label className="form-label" style={{ fontSize: '13px' }}>🦦 Capa</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00 €"
                  value={form.capa_amount}
                  onChange={e => set('capa_amount', e.target.value)}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '13px' }}>🦒 Pau</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00 €"
                  value={form.pau_amount}
                  onChange={e => set('pau_amount', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="form-section">
          <label className="form-label">Categoría</label>
          <div className="cat-grid">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                className={`cat-btn ${form.category === c.value ? 'active' : ''}`}
                onClick={() => set('category', c.value)}
              >
                <span className="cat-emoji">{c.emoji}</span>
                <span className="cat-label">{c.value}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label className="form-label">Fecha y hora</label>
          <input
            className="form-input"
            type="datetime-local"
            value={form.date}
            onChange={e => set('date', e.target.value)}
          />
        </div>

        {status === 'error-fields' && (
          <div className="form-error">
            <AlertCircle size={16} />
            Por favor, rellena al menos el nombre y la cantidad del gasto.
          </div>
        )}
        {status === 'error' && (
          <div className="form-error">
            <AlertCircle size={16} />
            Error al guardar. Comprueba la conexión con la base de datos.
          </div>
        )}

        <button
          className="btn-primary submit-btn"
          onClick={handleSubmit}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <span className="loading-pulse">Guardando…</span>
          ) : (
            <>💛 Guardar gasto</>
          )}
        </button>
      </div>
    </div>
  )
}
