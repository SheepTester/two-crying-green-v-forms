/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'https://esm.sh/preact@10.6.6/hooks'
import { Transaction } from '../transactions/parse.ts'
import { TransactionDb } from '../transactions/store.ts'
import { useAsyncEffect } from '../utils/use-async-effect.ts'
import { Graph } from './components/Graph.tsx'

export function App () {
  const [data, setData] = useState<Transaction[] | null>(null)

  useAsyncEffect(async () => {
    const db = await TransactionDb.create()
    const transactions = []
    for await (const transaction of db.cursor()) {
      transactions.push(transaction)
    }
    setData(transactions)
  }, [])

  return <div class='app'>{data && <Graph data={data} />}hello</div>
}
