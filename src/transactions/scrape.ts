/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="deno.ns" />

import { frame } from '../utils/delays.ts'
import { event } from '../utils/event-listeners.ts'
import { loadScript } from '../utils/extension/load-script.ts'
import { unwrap } from '../utils/unwrap.ts'
import { RawTransaction } from './parse.ts'

/**
 * Constants for various selectors used for scraping the transactions page.
 */
const selectors = {
  startDateInput: '#ctl00_MainContent_BeginRadDateTimePicker_dateInput',
  searchBtn: '#MainContent_ContinueButton',
  resultsTable: '#ctl00_MainContent_ResultRadGrid_ctl00',
  nextPage: '.rgCurrentPage + *'
}

type ElementConstructor<Elem> = { new (...args: unknown[]): Elem; name: string }

/**
 * Able to get elements by a selector ID as defined in `selectors`.
 */
class ElementGetter {
  #iframe: HTMLIFrameElement
  #escaper: Promise<(detail: { type: 'eval'; js: string }) => void>

  constructor (iframe: HTMLIFrameElement) {
    this.#iframe = iframe
    this.#escaper = loadScript(
      './dist/isolation-escape.js',
      iframe.contentDocument ?? unwrap('Iframe has no content document')
    )
  }

  /**
   * Helper method to get an element that doesn't throw but rather returns an
   * error if the element can't be found.
   */
  #getElement<Elem extends HTMLElement> (
    selector: keyof typeof selectors,
    ExpectedElement: ElementConstructor<Elem>
  ): Elem | TypeError {
    const element = this.#iframe.contentDocument?.querySelector(
      selectors[selector]
    )
    if (!element) {
      return new TypeError(`Expected ${selector}`)
    }
    if (element instanceof ExpectedElement) {
      return element
    } else {
      return new TypeError(
        `${element.constructor.name} not a ${ExpectedElement.name}`
      )
    }
  }

  /**
   * Gets the element. Throws if the element can't be found or isn't the
   * expected type.
   */
  getElement<Elem extends HTMLElement> (
    selector: keyof typeof selectors,
    ExpectedElement: ElementConstructor<Elem>
  ): Elem {
    const element = this.#getElement(selector, ExpectedElement)
    if (element instanceof Error) {
      throw element
    }
    return element
  }

  /**
   * Resolves when the element of the right type is found.
   */
  async element<Elem extends HTMLElement> (
    selector: keyof typeof selectors,
    ExpectedElement: ElementConstructor<Elem>
  ): Promise<Elem> {
    let element = this.#getElement(selector, ExpectedElement)
    while (element instanceof TypeError) {
      await frame()
      element = this.#getElement(selector, ExpectedElement)
    }
    return element
  }

  clickJsLink (element: HTMLAnchorElement) {
    this.#escaper.then(dispatch => {
      dispatch({ type: 'eval', js: element.href })
    })
  }
}

/**
 * Get all transactions approximately since the given date.
 *
 * @param since The date of the latest transaction cached. If omitted, it'll get
 * all the transactions.
 */
export async function * scrape (
  since?: Date
): AsyncGenerator<RawTransaction, void> {
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

  const getter = new ElementGetter(iframe)

  // Start the date range from 2000
  getter.getElement('startDateInput', win.HTMLInputElement).value =
    '2000-01-01 12:00 AM'
  let first = true
  let lastDate = new Date().toString()
  do {
    if (first) {
      // Search
      getter.getElement('searchBtn', win.HTMLInputElement).click()
      first = false
    } else {
      // Click on the next page
      getter.clickJsLink(getter.getElement('nextPage', win.HTMLAnchorElement))
    }
    // Wait for results
    const table = await getter.element('resultsTable', win.HTMLTableElement)
    for (const row of table.tBodies[0].rows) {
      const [
        dateTime,
        accountName,
        cardNumber,
        location,
        transactionType,
        amount
      ] = Array.from(row.cells, td => td.textContent ?? '')
      yield {
        dateTime,
        accountName,
        cardNumber,
        location,
        transactionType:
          transactionType === 'Debit' || transactionType === 'Credit'
            ? transactionType
            : unwrap(`'${transactionType}' is neither Debit nor Credit.`),
        amount
      }
      lastDate = dateTime
    }
    // Remove the ID from the table (so can detect when the table next comes up)
    table.id = ''
  } while (!since || new Date(lastDate) >= since)
}
