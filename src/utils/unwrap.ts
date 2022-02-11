/**
 * Throws an error when run. Useful for unwrapping nullable values.
 *
 * @example
 * document.getElementById('element') ?? unwrap('Expected element')
 */
export function unwrap (message?: string): never {
  throw new TypeError(message)
}

export function ignoreError<E extends Error> (
  Error: {
    new (...args: any[]): E
  },
  name?: string
) {
  return (error: unknown) => {
    if (error instanceof Error && (name === undefined || error.name === name)) {
      return Promise.resolve()
    } else {
      return Promise.reject(error)
    }
  }
}
