/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>

import { PATH, TITLE } from '../vars.ts'

/// <reference lib="dom" />
/// <reference lib="deno.ns" />

const navbarLinks: [string, string][] = [
  ['Summary', './AccountSummary.aspx'],
  ['Transactions', './AccountTransaction.aspx'],
  ['Statements', './ReportStatementAvailable.aspx']
]

export function Navbar () {
  return (
    <div class='navbar'>
      {navbarLinks.map(([label, path]) => (
        <a class='navbar-link' href={path}>
          {label}
        </a>
      ))}
      <a class='navbar-link current' href={PATH}>
        {TITLE}
      </a>
    </div>
  )
}
