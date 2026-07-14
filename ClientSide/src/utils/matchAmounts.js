const toPositiveAmount = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.abs(amount) : 0
}

export const getInstallmentSuggestionAmount = (txn = {}) => {
  const candidates = [
    txn.amount,
    txn.Amount,
    txn.chargeAmount,
    txn.charge_amount,
    txn.ChargeAmount,
  ]

  return candidates.map(toPositiveAmount).find((amount) => amount > 0) ?? 0
}
