import { Transaction } from './parse.ts'

/**
 * Promisifies an IDBRequest.
 *
 * @returns a promise that resolves with the request result.
 */
function req<T> (request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result))
    request.addEventListener('error', () => reject(request.error))
  })
}

/**
 * Helper class for managing the IndexedDB database storing the transactions.
 */
export class TransactionDb {
  static #DB_NAME = 'transactions-db'
  static #STORE_NAME = 'transactions-store'

  #db: IDBDatabase

  constructor (db: IDBDatabase) {
    this.#db = db
  }

  #transaction (write: boolean) {
    const transaction = this.#db.transaction(
      [TransactionDb.#STORE_NAME],
      write ? 'readwrite' : 'readonly'
    )
    const store = transaction.objectStore(TransactionDb.#STORE_NAME)
    return { transaction, store }
  }

  /**
   * Start a database transaction.
   *
   * @param write True for `readwrite`, false for `readonly`. `readonly` by
   * default.
   * @returns an object store to do operations on.
   */
  transaction (write = false) {
    return this.#transaction(write).store
  }

  withTransaction (
    write: boolean,
    transact: (store: IDBObjectStore, request: typeof req) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const { transaction, store } = this.#transaction(write)
      transact(store, req)
      transaction.addEventListener('complete', () => resolve())
      transaction.addEventListener('error', () => reject(transaction.error))
    })
  }

  /**
   * Open a cursor.
   *
   * @param query A key or key range. If omitted, it'll get all entries.
   * @param direction `next` (ascending order) by default.
   * @returns An async iterable producing the results from the cursor.
   */
  async * cursor (
    query?: IDBValidKey | IDBKeyRange | null,
    direction?: IDBCursorDirection,
    index?: 'account' | 'time'
  ): AsyncGenerator<Transaction, void> {
    const store = this.transaction()
    const openedCursor = index
      ? store.index(index).openCursor(query, direction)
      : store.openCursor(query, direction)
    let cursor = await req(openedCursor)
    while (cursor) {
      yield cursor.value
      cursor.continue()
      cursor = await req(openedCursor)
    }
  }

  /**
   * Create the IndexedDB database for the transactions.
   */
  static async create () {
    const openRequest = indexedDB.open(TransactionDb.#DB_NAME)

    openRequest.addEventListener('upgradeneeded', () => {
      const db = openRequest.result

      const store = db.createObjectStore(TransactionDb.#STORE_NAME, {
        keyPath: 'time'
      })
      // Ability to filter records by account
      store.createIndex('account', 'account', { unique: false })
    })

    return new TransactionDb(await req(openRequest))
  }
}
