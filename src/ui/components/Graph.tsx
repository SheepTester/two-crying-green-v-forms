/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useRef, useState } from 'https://esm.sh/preact@10.6.6/hooks'
import { AccumulatedTransaction } from '../../transactions/parse.ts'

/** Padding around the entire graph (so strokes aren't clipped) */
const PADDING = 10
/** Space for axis labels (adds to `PADDING`) */
const AXIS_LABEL_PADDING = 40

const padding = {
  top: PADDING,
  left: PADDING + AXIS_LABEL_PADDING,
  right: PADDING,
  bottom: PADDING + AXIS_LABEL_PADDING,
  horizontal: PADDING * 2 + AXIS_LABEL_PADDING,
  vertical: PADDING * 2 + AXIS_LABEL_PADDING
}

type Size = {
  readonly width: number
  readonly height: number
}

type ActualGraphProps = {
  data: AccumulatedTransaction[]
  size: Size
  includeZero?: boolean
}
function ActualGraph ({ data, size, includeZero = false }: ActualGraphProps) {
  const maxAmount = data.reduce((acc, curr) => Math.max(acc, curr.balance), 0)
  const minAmount = includeZero
    ? 0
    : data.reduce((acc, curr) => Math.min(acc, curr.balance), maxAmount)
  const xScale =
    (size.width - padding.horizontal) /
    (data[data.length - 1].time - data[0].time)
  const yScale = (size.height - padding.vertical) / (maxAmount - minAmount)

  // Of the form 'H x V y ...'
  const path = `M ${padding.left} ${
    yScale * (maxAmount - data[0].balance) + padding.top
  } ${data
    .map(
      ({ time, balance }) =>
        `H ${(time - data[0].time) * xScale + padding.left} V ${
          yScale * (maxAmount - balance) + padding.top
        }`
    )
    .join('')} H ${size.width - padding.right}`

  return (
    <svg class='graph' viewBox={`0 0 ${size.width} ${size.height}`}>
      <defs>
        <linearGradient id='gradient' x1='0' y1='0' x2='0' y2='1'>
          <stop class='gradient-stop' stop-opacity={0.5} offset='0%' />
          <stop class='gradient-stop' stop-opacity={0} offset='100%' />
        </linearGradient>
      </defs>

      <path
        class='axis-line'
        d={`M ${padding.left} ${padding.top} V ${
          size.height - padding.bottom
        } H ${size.width - padding.right}`}
      />
      <path
        class='data-gradient'
        d={`${path} V ${size.height - padding.bottom} H ${padding.left} z`}
        fill='url(#gradient)'
      />
      <path class='data-line' d={path} />
    </svg>
  )
}

type GraphProps = {
  data: AccumulatedTransaction[]
}
export function Graph ({ data }: GraphProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<Size | null>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (wrapper) {
      setSize(wrapper.getBoundingClientRect())

      const observer = new ResizeObserver(() => {
        setSize(wrapper.getBoundingClientRect())
      })
      observer.observe(wrapper)
      return () => {
        observer.disconnect()
      }
    }
  }, [wrapperRef.current])

  return (
    <div class='graph-wrapper' ref={wrapperRef}>
      {size && <ActualGraph data={data} size={size} includeZero />}
    </div>
  )
}
