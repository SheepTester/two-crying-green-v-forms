/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

/**
 * @returns a promise that resolves in the next animation frame.
 */
export function frame () {
  return new Promise(window.requestAnimationFrame)
}

/**
 * @returns a promise that resolves after the given wait time in milliseconds.
 */
export function delay (waitTime: number) {
  return new Promise(resolve => setTimeout(resolve, waitTime))
}
