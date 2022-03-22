import { moment } from './delays.ts'

/**
 * Pagination can yield multiple values all at once, with a wait time between
 * pages. I may want to submit multiple values as they come in every page,
 * rather than waiting for all of them to be done or submitting each of them
 * individually (e.g. for IndexedDB transactions).
 *
 * This tries to gather an array of values that were produced synchronously and
 * yield them once the flurry of values ends.
 *
 * @yields Arrays of values that were yielded all at once, synchronously.
 */
export async function * syncChunks<T> (
  iterable: AsyncIterable<T>
): AsyncGenerator<T[]> {
  const iterator = iterable[Symbol.asyncIterator]()
  let values: T[] = []
  while (true) {
    const nextPromise = iterator.next()
    const flurryEnded = await Promise.race([
      nextPromise.then(() => false),
      moment().then(() => true)
    ])
    if (flurryEnded) {
      yield values
      values = []
    }
    const next = await nextPromise
    if (next.done) {
      break
    } else {
      values.push(next.value)
    }
  }
  yield values
}
