/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import {} from 'https://esm.sh/preact@10.6.6'
import { App } from './App.tsx'

export function Page () {
  return (
    <>
      <a href='/eAccounts/AccountSummary.aspx'>summary</a>
      <App />
    </>
  )
}
