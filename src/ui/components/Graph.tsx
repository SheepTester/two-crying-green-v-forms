/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useRef, useState } from 'https://esm.sh/preact@10.6.6/hooks'
import { AccumulatedTransaction } from '../../transactions/parse.ts'

/** Padding around the entire graph (so strokes aren't clipped), in px */
const PADDING = 10
/** Space below the x-axis, in px */
const X_AXIS_PADDING = 40
/** Space left of the y-axis, in px */
const Y_AXIS_PADDING = 70
/** Minimum space for a x-axis label step, in px */
const MIN_X_STEP = 100
/** Minimum space for a y-axis label step, in px */
const MIN_Y_STEP = 20
/** Length of an axis tick mark */
const MINOR_TICK = 5
/** Length of an axis major tick mark */
const MAJOR_TICK = 10
/** Space between the y-axis (not the tick marks) and axis step labels */
const Y_STEP_LABEL_PADDING = 15

const padding = {
  top: PADDING,
  left: PADDING + Y_AXIS_PADDING,
  right: PADDING,
  bottom: PADDING + X_AXIS_PADDING,
  horizontal: PADDING * 2 + Y_AXIS_PADDING,
  vertical: PADDING * 2 + X_AXIS_PADDING
}

/**
 * Get a nice, round step value for axis labels.
 *
 * @param minStep - The minimum step value (inclusive).
 * @returns the minor and major steps. Use the minor step, and emphasize the major step.
 */
function getStep (minStep: number): { minor: number; major: number } {
  // Round down to the nearest power of ten
  const prevPower = 10 ** Math.floor(Math.log10(minStep))
  // Find the smallest round step >= the minStep
  const minorStep =
    [1, 2, 2.5, 5].find(factor => factor * prevPower >= minStep) ?? 10
  const minor = minorStep * prevPower
  return {
    minor,
    major: (minorStep < 10 ? prevPower : minorStep) * 10
  }
}

/**
 * @param end - The value to end before (inclusive).
 * @param fromZero - Whether to increase `start` so that it's a multiple of
 * `step` (i.e. the steps could have started from zero)
 * @yields steps from start to end by step.
 */
function * steps (start: number, end: number, step: number, fromZero = false) {
  let curr = fromZero ? Math.ceil(start / step) * step : start
  while (curr <= end) {
    yield curr
    curr += step
  }
}

type ActualGraphProps = {
  data: AccumulatedTransaction[]
  viewport: DOMRect
  includeZero?: boolean
}
function ActualGraph ({
  data,
  viewport,
  includeZero = false
}: ActualGraphProps) {
  const maxAmount = data.reduce((acc, curr) => Math.max(acc, curr.balance), 0)
  const minAmount = includeZero
    ? 0
    : data.reduce((acc, curr) => Math.min(acc, curr.balance), maxAmount)
  const xScale =
    (viewport.width - padding.horizontal) /
    (data[data.length - 1].time - data[0].time)
  const yScale = (viewport.height - padding.vertical) / (maxAmount - minAmount)

  const xStep = getStep(
    (MIN_X_STEP / (viewport.width - padding.horizontal)) *
      (data[data.length - 1].time - data[0].time)
  )
  const yStep = getStep(
    (MIN_Y_STEP / (viewport.height - padding.vertical)) *
      (maxAmount - minAmount)
  )
  console.log(xStep, yStep)

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
    .join('')} H ${viewport.width - padding.right}`

  return (
    <svg class='graph' viewBox={`0 0 ${viewport.width} ${viewport.height}`}>
      <defs>
        <linearGradient id='gradient' x1='0' y1='0' x2='0' y2='1'>
          <stop class='gradient-stop' stop-opacity={0.3} offset='0%' />
          <stop class='gradient-stop' stop-opacity={0.05} offset='100%' />
        </linearGradient>
      </defs>

      <path
        class='data-gradient'
        d={`${path} V ${viewport.height - padding.bottom} H ${padding.left} z`}
        fill='url(#gradient)'
      />
      <path
        class='axis-line'
        d={`M ${padding.left} ${padding.top} V ${
          viewport.height - padding.bottom
        } H ${viewport.width - padding.right} ${Array.from(
          steps(data[0].time, data[data.length - 1].time, xStep.minor, true),
          time =>
            `M ${padding.left + (time - data[0].time) * xScale} ${
              viewport.height - padding.bottom
            } v ${time % xStep.major === 0 ? MAJOR_TICK : MINOR_TICK}`
        ).join('')} ${Array.from(
          steps(minAmount, maxAmount, yStep.minor, true),
          amount =>
            `M ${padding.left} ${
              padding.top + (maxAmount - amount) * yScale
            } h ${amount % yStep.major === 0 ? -MAJOR_TICK : -MINOR_TICK}`
        ).join('')}`}
      />
      <path class='data-line' d={path} />
      <text
        class='axis-label'
        x={0}
        y={0}
        style={{
          transform: `translate(${PADDING}px, ${
            padding.top + (viewport.height - padding.vertical) / 2
          }px) rotate(-90deg)`
        }}
      >
        Dining dollars ($)
      </text>
      {Array.from(steps(minAmount, maxAmount, yStep.minor, true), amount => (
        <text
          class={`tick-mark ${amount % yStep.major === 0 ? 'tick-major' : ''}`}
          x={padding.left - Y_STEP_LABEL_PADDING}
          y={padding.top + (maxAmount - amount) * yScale}
        >
          {yStep.minor < 1 ? amount.toFixed(2) : amount}
        </text>
      ))}
    </svg>
  )
}

type GraphProps = {
  data: AccumulatedTransaction[]
}
export function Graph ({ data }: GraphProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewPort] = useState<DOMRect | null>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (wrapper) {
      setViewPort(wrapper.getBoundingClientRect())

      const observer = new ResizeObserver(() => {
        setViewPort(wrapper.getBoundingClientRect())
      })
      observer.observe(wrapper)
      return () => {
        observer.disconnect()
      }
    }
  }, [wrapperRef.current])

  return (
    <div class='graph-wrapper' ref={wrapperRef}>
      {viewport && <ActualGraph data={data} viewport={viewport} includeZero />}
    </div>
  )
}
