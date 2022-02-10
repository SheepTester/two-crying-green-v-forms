/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="deno.ns" />

import { parseStream } from './transactions/parse.ts'
import { scrape } from './transactions/scrape.ts'
import { TransactionDb } from './transactions/store.ts'

async function main () {
  console.log((await scrape(undefined, '2022-02-06 8:25 PM').next()).value)

  return
  const transactions = []
  for await (const transaction of parseStream(
    scrape(undefined, '2022-02-06 8:25 PM')
  )) {
    console.log(Object.values(transaction).join(' '))
    transactions.push(transaction)
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
