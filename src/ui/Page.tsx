/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { App } from './App.tsx'
import { Navbar } from './components/Navbar.tsx'

export function Page () {
  return (
    <>
      <Navbar />
      <App />
    </>
  )
}
