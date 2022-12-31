import { CumTransaction, Transaction } from '../transactions/parse.ts'

export function accumulate (
  transactions: Transaction[],
  filter: (transaction: Transaction) => boolean = () => true
): CumTransaction[] {
  const cumTransactions: CumTransaction[] = []
  /** In cents, to avoid rounding errors */
  let total = 0
  for (const transaction of transactions) {
    if (filter(transaction)) {
      total += transaction.amount * 100
      cumTransactions.push({ ...transaction, balance: total / 100 })
    }
  }
  return cumTransactions
}
