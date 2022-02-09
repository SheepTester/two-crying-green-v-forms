/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="deno.ns" />

import { parse } from './transactions/parse.ts'
import { scrape } from './transactions/scrape.ts'
import { TransactionDb } from './transactions/store.ts'

async function main () {
  let count = 0
  const rawTransactions = []
  for await (const transaction of scrape()) {
    rawTransactions.push(transaction)
    count++
    // if (count >= 15 * 15) break
  }

  // const transactions = parse(rawTransactions)
  // const db = await TransactionDb.create()
  // await db.withTransaction(true, store => {
  //   for (const transaction of transactions) {
  //     store.add(transaction)
  //   }
  // })
}

Object.assign(window, { main })
