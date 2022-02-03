import { loadScript } from './load-script.ts'

const isolationEscape = loadScript('./dist/isolation-escape.js')

export function evalJs (js: string): void {
  // Can't return a Promise because functions need to be cloned
  isolationEscape.then(() => {
    document.dispatchEvent(
      new CustomEvent('twocryinggreenvforms', {
        detail: { type: 'eval', js }
      })
    )
  })
}
