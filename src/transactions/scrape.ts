/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="deno.ns" />

import { moment } from '../utils/delays.ts'
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
  /** End date of the search (exclusive) */
  endDateInput: '#ctl00_MainContent_EndRadDateTimePicker_dateInput',
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
    if (!(ExpectedElement.prototype instanceof this.win.Element)) {
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
  element<Elem extends HTMLElement> (
    selector: keyof typeof selectors,
    ExpectedElement: ElementConstructor<Elem>,
    target?: Node
  ): Promise<Elem> {
    const element = this.#getElement(selector, ExpectedElement)
    if (element instanceof this.win.HTMLElement) {
      return Promise.resolve(element)
    }
    return new Promise(resolve => {
      const observer = new MutationObserver(() => {
        const element = this.#getElement(selector, ExpectedElement)
        if (element instanceof this.win.HTMLElement) {
          resolve(element)
          observer.disconnect()
        }
      })
      observer.observe(target ?? this.win.document.body, {
        // Include descendants
        subtree: true,
        // Track removed/added children
        childList: true
      })
    })
  }

  /**
   * Resolves when the element is no longer present.
   */
  elementRemoved (
    selector: keyof typeof selectors,
    target?: Node
  ): Promise<void> {
    const element = this.#getElement(selector, this.win.HTMLElement)
    if (element instanceof Error) {
      return Promise.resolve()
    }
    return new Promise(resolve => {
      const observer = new MutationObserver(() => {
        const element = this.#getElement(selector, this.win.HTMLElement)
        if (element instanceof Error) {
          resolve()
          observer.disconnect()
        }
      })
      observer.observe(target ?? this.win.document.body, {
        // Include descendants
        subtree: true,
        // Track removed/added children
        childList: true
      })
    })
  }

  clickJsLink (element: HTMLAnchorElement) {
    this.#escaper.then(dispatch => {
      dispatch({ type: 'eval', js: element.href })
    })
  }

  setValue (selector: keyof typeof selectors, value: string) {
    const input = this.getElement(selector, this.win.HTMLInputElement)
    input.value = value
    // Needed for it to acknowledge the change in value
    input.dispatchEvent(new FocusEvent('focus'))
    input.dispatchEvent(new FocusEvent('blur'))
  }

  remove () {
    this.win.frameElement?.remove()
  }

  static async load (url: string) {
    const iframe = Object.assign(document.createElement('iframe'), {
      src: url
    })
    Object.assign(iframe.style, {
      display: 'none'
    })
    document.body.appendChild(iframe)
    await event(iframe, 'load')
    return new IframeWrapper(iframe)
  }
}

/**
 * Get all transactions approximately since the given date. Gives transactions
 * in reverse chronological order.
 *
 * You shouldn't have to worry about `until`; it is used to recursively continue
 * pagination if pagination dies after the 15 pages.
 *
 * @param since The date of the latest transaction cached. If omitted, it'll get
 * all the transactions.
 * @param until The date before which to start the search. If after 15 pages,
 * eAccounts dies, we can resume the search from the given date. This date is
 * exclusive, so the first transaction will be the transaction right before the
 * given date.
 */
export async function * scrape (
  since?: Date,
  until?: string
): AsyncGenerator<RawTransaction, void> {
  // Create an iframe to the transaction page and wait for it to load
  const iframe = await IframeWrapper.load(
    'https://eacct-ucsd-sp.transactcampus.com/eAccounts/AccountTransaction.aspx'
  )

  // Start the date range from 2000
  iframe.setValue('startDateInput', '2000-01-01 12:00 AM')
  if (until !== undefined) {
    iframe.setValue('endDateInput', until)
  }
  let first = true
  let lastDate = new Date().toString()
  /** Tracks the date before the last date */
  let penultimateDate = lastDate
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
        await moment()
      }
    } else {
      // Click on the next page
      const nextPageLink = iframe.getElementMaybe(
        'nextPage',
        iframe.win.HTMLAnchorElement
      )
      if (!nextPageLink) {
        // If there is no next page, then we've reached the end!
        break
      }
      iframe.clickJsLink(nextPageLink)
      // Wait for results
      await iframe.element('pageLoading', iframe.win.HTMLDivElement)
      await iframe.elementRemoved('pageLoading')
    }
    const table = iframe.getElementMaybe(
      'resultsTable',
      iframe.win.HTMLTableElement
    )
    if (!table) {
      // If it finished loading but the table hasn't updated, then eAccounts has
      // given up. (It usually 404's after 15 pages.)
      yield * scrape(since, penultimateDate)
      break
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
      if (dateTime !== lastDate) {
        // Shift the dates down
        penultimateDate = lastDate
        lastDate = dateTime
      }
    }
    // Remove the ID from the table (so can detect when the table next comes up)
    table.id = ''
  } while (!since || new Date(lastDate) >= since)
  iframe.remove()
}
