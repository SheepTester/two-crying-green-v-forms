/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'preact/hooks'
import { AccumulatedTransaction, parseStream } from '../transactions/parse.ts'
import { scrape } from '../transactions/scrape.ts'
import { TransactionDb } from '../transactions/store.ts'
import { syncChunks } from '../utils/iterables.ts'
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
        transaction.account === 'Dining Dollars Rollover' ||
        transaction.account === 'Triton2Go Dining Dollars'
      ) {
        // Keep it an integer by storing cents
        accumulated += transaction.amount * 100
        transactions.push({ ...transaction, balance: accumulated / 100 })
      }
    }
    setData(transactions)
  }, [])

  return (
    <div class='app'>
      {data && data.length > 0 && <Graph data={data} />}
      <button
        onClick={async () => {
          console.log('loading!')

          const db = await TransactionDb.create()
          for await (const transactions of syncChunks(parseStream(scrape()))) {
            // for (const transaction of transactions) {
            //   console.log(Object.values(transaction).join(' '))
            // }
            await db.withTransaction(true, (store, request) => {
              for (const transaction of transactions) {
                // Overwrite if already existing (put() instead of add())
                request(store.put(transaction))
              }
            })
          }
          console.log('done!')
        }}
      >
        Refresh
      </button>
    </div>
  )
}
