/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { frame } from './utils/delays.ts'
import { event } from './utils/event-listeners.ts'
import { unwrap } from './utils/unwrap.ts'

const selectors = {
  startDateInput: '#ctl00_MainContent_BeginRadDateTimePicker_dateInput',
  searchBtn: '#MainContent_ContinueButton',
  resultsTable: '#ctl00_MainContent_ResultRadGrid_ctl00',
  nextPage: '.rgCurrentPage + *'
}

async function scrape () {
  // Create an iframe to the transaction page and wait for it to load
  const iframe = Object.assign(document.createElement('iframe'), {
    src: 'https://eacct-ucsd-sp.transactcampus.com/eAccounts/AccountTransaction.aspx'
  })
  Object.assign(iframe.style, {
    display: 'none'
  })
  document.body.appendChild(iframe)
  await event(iframe, 'load')

  // Need to use the iframe's HTMLElement constructors because they are not the
  // same as those in the extension's global scope due to isolated worlds
  const win = iframe.contentWindow as
    | (Window &
        typeof globalThis & { __doPostBack: (a: string, k: string) => void })
    | null
  if (!win) {
    throw new TypeError('No iframe content window')
  }

  function getElement<Elem extends HTMLElement> (
    selector: keyof typeof selectors,
    ExpectedElement: { new (...args: unknown[]): Elem; name: string }
  ): Elem {
    const element =
      iframe.contentDocument?.querySelector(selectors[selector]) ??
      unwrap(`Expected ${selector}`)
    if (element instanceof ExpectedElement) {
      return element
    } else {
      throw new TypeError(
        `${element.constructor.name} not a ${ExpectedElement.name}`
      )
    }
  }
  async function element (selector: keyof typeof selectors) {
    let element = iframe.contentDocument?.querySelector(selectors[selector])
    while (!element) {
      await frame()
      element = iframe.contentDocument?.querySelector(selectors[selector])
    }
    return element
  }

  getElement('startDateInput', win.HTMLInputElement).value =
    '2000-01-01 12:00 AM'
  getElement('searchBtn', win.HTMLInputElement).click()
  const table = await element('resultsTable')
  const results = []
  for (const row of table.querySelectorAll('tbody tr')) {
    const [
      dateTime,
      accountName,
      cardNumber,
      location,
      transactionType,
      amount
    ] = Array.from(row.children, td => td.textContent ?? '')
    results.push({
      dateTime,
      accountName,
      cardNumber,
      location,
      transactionType,
      amount
    })
  }
  console.log(results)
  // Cannot .click() due to a CSP for extensions
  const doPostBackArg =
    getElement('nextPage', win.HTMLAnchorElement).href.match(
      /javascript:__doPostBack\('(.+)',''\)/
    )?.[1] ?? unwrap('Could not get __doPostBack')
  console.log(win)
  win.__doPostBack(doPostBackArg, '')
}

console.log('hello', scrape)
;(window as any).scrape = scrape
