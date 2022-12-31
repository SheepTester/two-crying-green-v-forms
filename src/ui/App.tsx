/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'preact/hooks'
import {
  CumTransaction,
  displayTime,
  parseStream,
  Transaction
} from '../transactions/parse.ts'
import { scrape } from '../transactions/scrape.ts'
import { TransactionDb } from '../transactions/store.ts'
import { accumulate } from '../utils/cum.ts'
import { syncChunks } from '../utils/iterables.ts'
import { useAsyncEffect } from '../utils/use-async-effect.ts'
import { displayUsd, Graph } from './components/Graph.tsx'

export function App () {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [account, setAccount] = useState('dining-dollars')

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
    account === 'dining-dollars'
      ? transaction =>
          transaction.account === 'Dining Dollars' ||
          transaction.account === 'Dining Dollars Rollover' ||
          transaction.account === 'Triton2Go Dining Dollars'
      : account === 'triton-cash'
      ? transaction => transaction.account === 'Triton Cash'
      : transaction => transaction.account === account
  )

  return (
    <div class='app'>
      <div class='above-graph'>
        <div class='wrapper'>
          <div class='label'>Account</div>
          <select
            class={`account-select ${
              account === 'dining-dollars' || account === 'triton-cash'
                ? account
                : ''
            }`}
            value={account}
            onChange={e => {
              setAccount(e.currentTarget.value)
            }}
          >
            <option class='dining-dollars' value='dining-dollars'>
              Dining Dollars (total)
            </option>
            <option class='triton-cash' value='triton-cash'>
              Triton Cash
            </option>
            <optgroup label='Individual accounts'>
              {Array.from(
                new Set(transactions.map(t => t.account)),
                account => (
                  <option key={account} value={account}>
                    {account}
                  </option>
                )
              )}
            </optgroup>
          </select>
        </div>
        <button
          class='action-btn refresh-btn'
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
        <button
          class='action-btn export-btn'
          onClick={() => {
            const blob = new Blob(
              [
                [
                  ['Time,Balance,Amount,Location,Account'],
                  ...cumTransactions.map(
                    ({ account, amount, balance, location, time }) => [
                      displayTime(new Date(time)),
                      displayUsd(balance, false, true),
                      displayUsd(amount, true, true),
                      location,
                      account
                    ]
                  )
                ]
                  .map(row => row.join(',') + '\n')
                  .join('')
              ],
              { type: 'text/csv' }
            )
            const url = URL.createObjectURL(blob)
            const link = Object.assign(document.createElement('a'), {
              href: url,
              download: `${account}.csv`
            })
            document.body.append(link)
            link.click()
            link.remove()
            URL.revokeObjectURL(url)
          }}
        >
          Export CSV
        </button>
        <div class='balance-wrapper'>
          <div class='label'>Balance</div>
          <div class='balance'>
            {displayUsd(
              cumTransactions[cumTransactions.length - 1]?.balance ?? 0
            )}
          </div>
        </div>
      </div>
      {cumTransactions.length > 0 && (
        <Graph data={cumTransactions} account={account} />
      )}
    </div>
  )
}
