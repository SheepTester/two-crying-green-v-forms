/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'https://esm.sh/preact@10.6.6'
import { App } from './App.tsx'
import { Page } from './Page.tsx'

/** Initialize the graph page on the "Error!" page. */
export async function initErrorPage () {
  document.querySelector('#errorBox')?.remove()

  // Remove styles
  for (const sheet of document.styleSheets) {
    sheet.ownerNode?.remove()
  }

  const root = document.createElement('div')
  document.body.append(root)
  render(<Page />, root)

  window.addEventListener('popstate', () => {
    if (!window.location.pathname.endsWith('/TwoCryingGreenVForms.aspx')) {
      window.location.reload()
    }
  })
}

/** Initialize the graph page on an existing eAccounts page. */
export async function initNormalPage () {
  const main = document.getElementById('mainContainer')
  if (!main) {
    throw new Error("Couldn't find main container")
  }
  const root = document.createElement('div')

  let initAppIfNeeded: () => void
  new Promise<void>(resolve => {
    initAppIfNeeded = resolve
  }).then(() => {
    main.after(root)
    render(<App />, root)
    main.style.display = 'none'
  })

  const navbarLink = document.createElement('a')
  navbarLink.href = '/eAccounts/TwoCryingGreenVForms.aspx'
  navbarLink.textContent = 'I will type this later'
  document.querySelector('.SiteMenu2 .SiteMenuRow')?.append(navbarLink)

  navbarLink.addEventListener('click', event => {
    window.history.pushState({}, '', '/eAccounts/TwoCryingGreenVForms.aspx')
    event.preventDefault()
    initAppIfNeeded()
  })

  window.addEventListener('popstate', () => {
    if (window.location.pathname.endsWith('/TwoCryingGreenVForms.aspx')) {
      initAppIfNeeded()
      main.style.display = 'none'
      root.style.display = ''
    } else {
      main.style.display = ''
      root.style.display = 'none'
    }
  })
}
