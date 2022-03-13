/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Transaction } from '../../transactions/parse.ts'

type GraphProps = {
  data: Transaction[]
}
export function Graph ({ data }: GraphProps) {
  let d = 'M0 0'
  let total = 0
  let i = 0
  for (const transaction of data) {
    d += `L${i / data.length} ${total / 4e3}`
    total += transaction.amount
    i++
  }
  d += 'V 0 z'
  return (
    <svg class='graph' viewBox='0 0 1 1' vectorEffect='non-scaling-stroke'>
      <path d={d} />
    </svg>
  )
}
