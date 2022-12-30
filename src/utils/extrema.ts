/**
 * Used to generate a d3 domain for a list of numbers.
 */
export function extrema (data: number[]): [min: number, max: number] {
  return [
    data.reduce((acc, curr) => Math.min(acc, curr)),
    data.reduce((acc, curr) => Math.max(acc, curr))
  ]
}
