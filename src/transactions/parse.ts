export type RawTransaction = {
  /**
   * Date/Time, of the form YYYY-MM-DD hh:MM A/PM, eg "2022-01-12 6:00 AM"
   */
  dateTime: string

  /**
   * The name of the account used, such as "Dining Dollars," "Triton2Go Dining
   * Dollars," or "Triton Cash."
   */
  accountName: string

  /**
   * The student PID, except the A is replaced with 00000000000009.
   */
  cardNumber: string

  /**
   * Where the payment was made.
   *
   * Examples:
   * - Laundry NTP Kaleidoscope MF1
   * - HDH Pines Pines Worlds Fare Mobile Order
   * - HDH 64 Degrees 64-RC
   * - HDH Johns Market Johns 2
   */
  location: string

  /**
   * Whether money was withdrawn (Debit) or deposited (Credit).
   */
  transactionType: 'Debit' | 'Credit'

  /**
   * The amount of money removed/added. Negative if Debit. Includes units.
   *
   * Examples:
   * - Credit / 8.00 USD
   * - Debit / -2.50 USD
   *
   * I would use `parseFloat` rather than `+`/`Number` to cast this to a number
   * to ignore the "USD."
   */
  amount: string
}

export type Transaction = {
  /**
   * When the transaction was made.
   *
   * This also serves as a unique ID. The number of the transaction if there
   * were multiple transactions at the same time is added to the transaction
   * time.
   *
   * For example, Triton2Go return machines all refund the $5 deposit at 6 am.
   * If someone turned in 3 boxes the day before, then the transactions' IDs
   * would be
   *
   * 1. [time]
   * 2. [time] + 1
   * 3. [time] + 2
   *
   * While this may result in conflicts because this just adds a millisecond to
   * the transaction time, because eAccounts only gives the transaction times
   * with minute-precision, so it would take at least 60k transactions to cause
   * a conflict.
   */
  time: number

  /**
   * The account the transaction was made under.
   *
   * TODO: Is the account name normalized to some enum?
   */
  account: string

  /**
   * Amount of money added to the balance. Negative if money was removed.
   */
  amount: number

  /**
   * The name of the place where the payment was made.
   */
  location: string
}

/**
 * Number of milliseconds in a minute.
 */
const MS_PER_MIN = 60_000

/**
 * Parses a date/time string of the form YYYY-MM-DD hh:MM A/PM and returns the
 * number of *minutes* since the Unix epoch in UTC.
 */
function parseTime (dateTime: string): number {
  const [date, time, meridiem] = dateTime.split(' ')
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return (
    Date.UTC(
      year,
      month - 1,
      day,
      hour === 12
        ? meridiem === 'AM'
          ? 0
          : 12
        : meridiem === 'AM'
        ? hour
        : hour + 12,
      minute
    ) / MS_PER_MIN
  )
}

/**
 * Converts raw transactions to transactions.
 *
 * The reason why this can't convert one transaction at a time is because it
 * needs to be able to figure out unique IDs for simultaneous transactions.
 */
export function parse (raw: RawTransaction[]): Transaction[] {
  const transactions = raw.map(
    ({ dateTime, accountName, amount, location }) => {
      const time = parseTime(dateTime)
      return {
        datetime: time,
        time: time * MS_PER_MIN,
        account: accountName,
        amount: parseFloat(amount),
        location
      }
    }
  )
  for (const [i, transaction] of transactions.entries()) {
    // If the date/time matches, then increment time by 1
    if (i > 0 && transactions[i - 1].datetime === transaction.datetime) {
      transactions[i].time = transactions[i - 1].time + 1
    }
  }
  return transactions.map(({ datetime: _, ...transaction }) => transaction)
}
