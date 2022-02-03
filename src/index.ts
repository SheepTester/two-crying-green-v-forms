/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="deno.ns" />

import { scrape } from './scraping/get-transactions.ts'

Object.assign(window, { scrape })
