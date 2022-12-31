/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'preact/hooks'
import {
  CumTransaction,
  parseStream,
  Transaction
} from '../transactions/parse.ts'
import { scrape } from '../transactions/scrape.ts'
import { TransactionDb } from '../transactions/store.ts'
import { accumulate } from '../utils/cum.ts'
import { syncChunks } from '../utils/iterables.ts'
import { useAsyncEffect } from '../utils/use-async-effect.ts'
import { Graph } from './components/Graph.tsx'

export function App () {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useAsyncEffect(async () => {
    const db = await TransactionDb.create()
    const transactions = []
    for await (const transaction of db.cursor()) {
      transactions.push(transaction)
    }
    setTransactions(transactions)
  }, [])

  const cumTransactions = accumulate(
    transactions,
    transaction =>
      transaction.account === 'Dining Dollars' ||
      transaction.account === 'Dining Dollars Rollover' ||
      transaction.account === 'Triton2Go Dining Dollars'
  )

  return (
    <div class='app'>
      {cumTransactions.length > 0 && <Graph data={cumTransactions} />}
      <button
        onClick={async () => {
          setRefreshing(true)
          const lastDate =
            transactions.length > 0
              ? new Date(transactions[transactions.length - 1].time)
              : undefined
          const db = await TransactionDb.create()
          const newTransactions: Transaction[] = []
          for await (const transactions of syncChunks(
            parseStream(scrape(lastDate))
          )) {
            await db.withTransaction(true, (store, request) => {
              for (const transaction of transactions) {
                newTransactions.push(transaction)
                // Overwrite if already existing (put() instead of add())
                request(store.put(transaction))
              }
            })
          }
          // `transactions` should be chronological, but `scrape` yields reverse
          // chronological
          newTransactions.reverse()
          // Remove duplicate IDs
          if (lastDate) {
            while (
              newTransactions.length > 0 &&
              newTransactions[0].time <= lastDate.getTime()
            ) {
              newTransactions.shift()
            }
          }
          if (newTransactions.length > 0) {
            setTransactions([...transactions, ...newTransactions])
          }
          setRefreshing(false)
        }}
        disabled={refreshing}
      >
        Refresh
      </button>
    </div>
  )
}
