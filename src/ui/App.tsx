/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'preact/hooks'
import { AccumulatedTransaction } from '../transactions/parse.ts'
import { TransactionDb } from '../transactions/store.ts'
import { useAsyncEffect } from '../utils/use-async-effect.ts'
import { Graph } from './components/Graph.tsx'

export function App () {
  const [data, setData] = useState<AccumulatedTransaction[] | null>(null)

  useAsyncEffect(async () => {
    const db = await TransactionDb.create()
    const transactions = []
    let accumulated = 0
    for await (const transaction of db.cursor()) {
      if (
        transaction.account === 'Dining Dollars' ||
        transaction.account === 'Triton2Go Dining Dollars'
      ) {
        accumulated += transaction.amount
        transactions.push({ ...transaction, balance: accumulated })
      }
    }
    setData(transactions)
  }, [])

  return <div class='app'>{data && <Graph data={data} />}hello</div>
}
