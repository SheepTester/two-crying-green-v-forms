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
  /** Start date of the search (inclusive) */
  startDateInput: '#ctl00_MainContent_BeginRadDateTimePicker_dateInput',
  /** "Search" button that starts the search for transactions */
  searchBtn: '#MainContent_ContinueButton',
  /** Loading thing for the first results (always in DOM, usually hidden) */
  resultsLoading: '#MainContent_LoadingPanelAction',
  /** Loading thing for subsequent pages */
  pageLoading:
    '#MainContent_LoadingPanelWhiteTransparentCenterImageMainContent_ResultPanel',
  /** Table of transactions */
  resultsTable: '#ctl00_MainContent_ResultRadGrid_ctl00',
  /** <a> that when clicked will go to the next page */
  nextPage: '.rgCurrentPage + *'
}

type ElementConstructor<Elem> = { new (...args: unknown[]): Elem; name: string }

/**
 * Able to get elements by a selector ID as defined in `selectors`.
 */
class IframeWrapper {
  win: Window & typeof globalThis
  #escaper: Promise<(detail: { type: 'eval'; js: string }) => void>

  constructor (iframe: HTMLIFrameElement) {
    // Need to use the iframe's HTMLElement constructors because they are not the
    // same as those in the extension's global scope due to isolated worlds
    const win = iframe.contentWindow as (Window & typeof globalThis) | null
    if (!win) {
      throw new TypeError('No iframe content window')
    }
    this.win = win

    this.#escaper = loadScript('./dist/isolation-escape.js', win.document)
  }

  /**
   * Helper method to get an element that doesn't throw but rather returns an
   * error if the element can't be found.
   */
  #getElement<Elem extends HTMLElement> (
    selector: keyof typeof selectors,
    ExpectedElement: ElementConstructor<Elem>
  ): Elem | TypeError {
    if (
      !(ExpectedElement.prototype instanceof this.win.Element) &&
      // Hack to prevent TypeScript from thinking this is a type guard :/
      (true as boolean)
    ) {
      throw new TypeError(
        "ExpectedElement is a foreigner from the extension's isolated world"
      )
    }
    const element = this.win.document.querySelector(selectors[selector])
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
   * @returns the element. Throws if the element can't be found or isn't the
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
   * @returns the element, or null if the element can't be found or isn't the
   * expected type.
   */
  getElementMaybe<Elem extends HTMLElement> (
    selector: keyof typeof selectors,
    ExpectedElement: ElementConstructor<Elem>
  ): Elem | null {
    const element = this.#getElement(selector, ExpectedElement)
    return element instanceof Error ? null : element
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

  /**
   * Resolves when the element is no longer present.
   */
  async elementRemoved (selector: keyof typeof selectors): Promise<void> {
    let element = this.#getElement(selector, this.win.HTMLElement)
    while (element instanceof this.win.HTMLElement) {
      await frame()
      element = this.#getElement(selector, this.win.HTMLElement)
    }
  }

  clickJsLink (element: HTMLAnchorElement) {
    this.#escaper.then(dispatch => {
      dispatch({ type: 'eval', js: element.href })
    })
  }

  static async load (url: string) {
    const iframe = Object.assign(document.createElement('iframe'), {
      src: url
    })
    Object.assign(iframe.style, {
      // display: 'none'
    })
    document.body.appendChild(iframe)
    await event(iframe, 'load')
    return new IframeWrapper(iframe)
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
  const iframe = await IframeWrapper.load(
    'https://eacct-ucsd-sp.transactcampus.com/eAccounts/AccountTransaction.aspx'
  )

  // Start the date range from 2000
  iframe.getElement('startDateInput', iframe.win.HTMLInputElement).value =
    '2000-01-01 12:00 AM'
  let first = true
  let lastDate = new Date().toString()
  do {
    if (first) {
      // Search
      iframe.getElement('searchBtn', iframe.win.HTMLInputElement).click()
      first = false
      // Wait for results
      const loading = iframe.getElement(
        'resultsLoading',
        iframe.win.HTMLDivElement
      )
      while (loading.style.display !== 'none') {
        await frame()
      }
    } else {
      // Click on the next page
      iframe.clickJsLink(
        iframe.getElement('nextPage', iframe.win.HTMLAnchorElement)
      )
      // Wait for results
      await iframe.element('pageLoading', iframe.win.HTMLDivElement)
      await iframe.elementRemoved('pageLoading')
    }
    const table = iframe.getElementMaybe(
      'resultsTable',
      iframe.win.HTMLTableElement
    )
    if (!table) {
      console.error('sad')
      return
    }
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
  // TODO: it dies after 15 pages. Need a way to detect and resuscitate
}
