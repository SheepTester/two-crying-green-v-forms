/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="deno.ns" />

import chrome from './chrome.js'

export function loadScript (path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.addEventListener('load', () => resolve())
    script.addEventListener('error', reject)
    script.src = chrome.runtime.getURL(path)
    document.head.append(script)
  })
}
