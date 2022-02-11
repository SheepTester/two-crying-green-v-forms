/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="deno.ns" />

import { parseStream } from './transactions/parse.ts'
import { scrape } from './transactions/scrape.ts'
import { TransactionDb } from './transactions/store.ts'
import { syncChunks } from './utils/async-iter.ts'
import { ignoreError } from './utils/unwrap.ts'

async function main () {
  const db = await TransactionDb.create()
  for await (const transactions of syncChunks(parseStream(scrape()))) {
    await db.withTransaction(true, (store, request) => {
      for (const transaction of transactions) {
        console.log(Object.values(transaction).join(' '))
        request(store.add(transaction)).catch(
          ignoreError(DOMException, 'ConstraintError')
        )
      }
    })
  }
}

Object.assign(window, { main })
