import { useEffect } from 'https://esm.sh/preact@10.6.6/hooks'

/**
 * `useEffect` but the callback cannot return a cleanup function. This allows
 * the callback to be an async function.
 */
export function useAsyncEffect (
  callback: () => unknown,
  dependencies?: ReadonlyArray<unknown>
) {
  useEffect(() => {
    callback()
  }, dependencies)
}
