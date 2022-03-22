/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'https://esm.sh/preact@10.6.6'
import { App } from './App.tsx'
import { Page } from './Page.tsx'
import { PATH, PATTERN, TITLE } from './vars.ts'

/** Initialize the graph page on the "Error!" page. */
export async function handleErrorPage () {
  document.querySelector('#errorBox')?.remove()

  // Remove styles
  for (const sheet of document.styleSheets) {
    sheet.ownerNode?.remove()
  }
  document.title = TITLE

  const viewportMeta = document.createElement('meta')
  viewportMeta.name = 'viewport'
  viewportMeta.content = 'width=device-width, initial-scale=1'
  document.head.append(viewportMeta)

  const root = document.createElement('div')
  document.body.append(root)
  render(<Page />, root)

  window.addEventListener('popstate', () => {
    if (!PATTERN.test(window.location.pathname)) {
      window.location.reload()
    }
  })
}

/** Initialize the graph page on an existing eAccounts page. */
export async function handleNormalPage () {
  const main = document.getElementById('mainContainer')
  if (!main) {
    throw new Error("Couldn't find main container")
  }
  const root = document.createElement('div')

  let originalTitle = document.title

  let initAppIfNeeded: () => void
  new Promise<void>(resolve => {
    initAppIfNeeded = () => {
      resolve()
      main.style.display = 'none'
      root.style.display = ''
      document.title = TITLE
    }
  }).then(() => {
    main.after(root)
    render(<App />, root)
  })

  const navbarLink = document.createElement('a')
  navbarLink.href = PATH
  navbarLink.textContent = TITLE
  document.querySelector('.SiteMenu2 .SiteMenuRow')?.append(navbarLink)

  navbarLink.addEventListener('click', event => {
    window.history.pushState({}, '', PATH)
    event.preventDefault()
    initAppIfNeeded()
  })

  window.addEventListener('popstate', () => {
    if (PATTERN.test(window.location.pathname)) {
      initAppIfNeeded()
    } else {
      main.style.display = ''
      root.style.display = 'none'
      document.title = originalTitle
    }
  })
}
