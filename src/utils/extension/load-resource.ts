/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="deno.ns" />

import chrome from './chrome.js'

/**
 * Load a web-accessible script by its local path in the extension.
 *
 * Note that in order for the script to be loadable in a web page, it must be
 * listed in the `web_accessible_resources` array in the manifest.json.
 *
 * @param target The document to load the script in.
 * @returns A dispatch function for sending a message to the script using the
 * `twocryinggreenvforms` event.
 */
export function loadScript (
  path: string,
  target = document
): Promise<(detail: unknown) => void> {
  return new Promise((resolve, reject) => {
    const script = target.createElement('script')
    script.addEventListener('load', () => {
      resolve(detail => {
        target.dispatchEvent(
          new CustomEvent('twocryinggreenvforms', { detail })
        )
      })
    })
    script.addEventListener('error', reject)
    script.src = chrome.runtime.getURL(path)
    target.head.append(script)
  })
}

export function loadStyle (path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const style = document.createElement('link')
    style.addEventListener('load', () => resolve())
    style.addEventListener('error', reject)
    style.rel = 'stylesheet'
    style.type = 'text/css'
    style.href = chrome.runtime.getURL(path)
    document.head.append(style)
  })
}
