/**
 * Throws an error when run. Useful for unwrapping nullable values.
 *
 * @example
 * document.getElementById('element') ?? unwrap('Expected element')
 */
export function unwrap (message?: string): never {
  throw new TypeError(message)
}
