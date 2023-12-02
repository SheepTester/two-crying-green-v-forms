/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useMemo, useState } from 'preact/hooks'
import { displayTime, parseStream, Transaction } from '../transactions/parse.ts'
import { scrape } from '../transactions/scrape.ts'
import { TransactionDb } from '../transactions/store.ts'
import { accumulate } from '../utils/cum.ts'
import { syncChunks } from '../utils/iterables.ts'
import { useAsyncEffect } from '../utils/use-async-effect.ts'
import { displayUsd, Graph } from './components/Graph.tsx'
import { BarChart, countFrequencies } from './components/BarChart.tsx'
import { locations } from './data/locations.ts'

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

  const cumTransactions = useMemo(
    () =>
      accumulate(
        transactions,
        account === 'dining-dollars'
          ? transaction =>
              transaction.account === 'Dining Dollars' ||
              transaction.account === 'Dining Dollars Rollover' ||
              transaction.account === 'Triton2Go Dining Dollars'
          : account === 'triton-cash'
          ? transaction => transaction.account === 'Triton Cash'
          : transaction => transaction.account === account
      ),
    [transactions, account]
  )
  const frequentDays = useMemo(
    () =>
      countFrequencies(
        cumTransactions,
        t => new Date(t.time).getDay(),
        [0, 1, 2, 3, 4, 5, 6]
      ).map(([day, freq]): [string, number] => [
        [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday'
        ][day],
        freq
      ]),
    [cumTransactions]
  )
  const frequentLocations = useMemo(
    () =>
      countFrequencies(
        cumTransactions,
        t => locations[t.location] || t.location
      ),
    [cumTransactions]
  )
  console.log([
    ...new Set(cumTransactions.map(a => a.location).filter(a => !locations[a]))
  ])

  return (
    <div
      class='app'
      style={{
        '--theme':
          account === 'dining-dollars'
            ? 'orange'
            : account === 'triton-cash'
            ? 'cyan'
            : ''
      }}
    >
      <div class='above-graph'>
        <div class='wrapper'>
          <div class='label'>Account</div>
          <select
            class='account-select'
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
          type='button'
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
          type='button'
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
        <>
          <Graph wrapperClass='graph-wrapper' data={cumTransactions} />
          <div class='charts'>
            <div class='chart'>
              <h2>Frequent days</h2>
              <BarChart wrapperClass='graph-wrapper' data={frequentDays} />
            </div>
            <div class='chart'>
              <h2>Frequent locations</h2>
              <BarChart
                wrapperClass='graph-wrapper'
                data={frequentLocations}
                margin={{ bottom: 120 }}
                slanted
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
