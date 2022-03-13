/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="deno.ns" />

import { parseStream } from './transactions/parse.ts'
import { scrape } from './transactions/scrape.ts'
import { TransactionDb } from './transactions/store.ts'
import { initErrorPage, initNormalPage } from './ui/index.tsx'
import { syncChunks } from './utils/async-iter.ts'

async function main () {
  const db = await TransactionDb.create()
  for await (const transactions of syncChunks(parseStream(scrape()))) {
    await db.withTransaction(true, (store, request) => {
      for (const transaction of transactions) {
        console.log(Object.values(transaction).join(' '))
        // Overwrite if already existing (put() instead of add())
        request(store.put(transaction))
      }
    })
  }
}

async function main2 () {
  const db = await TransactionDb.create()
  const transactions = []
  for await (const transaction of db.cursor()) {
    transactions.push(transaction)
  }
  console.log(transactions)
}

if (window.location.pathname.endsWith('/TwoCryingGreenVForms.aspx')) {
  initErrorPage()
} else {
  initNormalPage()
}

Object.assign(window, { main, main2 })
