import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

export function useBalance() {
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [settling, setSettling] = useState(false)

  const calcBalance = useCallback(async () => {
    setLoading(true)
    const { data: expenses } = await supabase
      .from('expenses')
      .select('who_paid, amount, for_whom, split_amounts')
      .eq('include_in_balance', true)

    if (!expenses) { setLoading(false); return }

    let net = 0
    for (const e of expenses) {
      const payer = e.who_paid
      const forWhom = e.for_whom || []
      const splits = e.split_amounts || []
      const owes = {}
      forWhom.forEach((person, i) => { owes[person] = splits[i] ?? e.amount })
      for (const [person, amt] of Object.entries(owes)) {
        if (person === payer) continue
        if (payer === 'Capa' && person === 'Pau') net += amt
        else if (payer === 'Pau' && person === 'Capa') net -= amt
      }
    }

    setBalance(net)
    setLoading(false)
  }, [])

  useEffect(() => { calcBalance() }, [calcBalance])

  async function settleDebt(currentDebtor, currentAmount) {
    if (!currentDebtor || currentAmount < 0.01) return
    setSettling(true)

    const { error } = await supabase.from('expenses').insert({
      purpose: 'Pago de deudas pendientes',
      nickname: null,
      amount: currentAmount,
      currency: 'EUR',
      who_paid: currentDebtor,
      split_type: 'solo',
      for_whom: [currentDebtor],
      split_amounts: [currentAmount],
      category: 'Otros',
      date: new Date().toISOString(),
      include_in_balance: true,
    })

    setSettling(false)
    if (!error) await calcBalance()
    return error
  }

  const debtor   = balance === null ? null : balance > 0 ? 'Pau'  : 'Capa'
  const creditor = balance === null ? null : balance > 0 ? 'Capa' : 'Pau'
  const amount   = balance === null ? 0 : Math.abs(balance)
  const settled  = amount < 0.01

  return { balance, debtor, creditor, amount, settled, loading, settling, settleDebt }
}
