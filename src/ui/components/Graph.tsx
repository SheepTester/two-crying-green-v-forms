/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import * as d3 from 'd3'
import { CumTransaction } from '../../transactions/parse.ts'
import { extrema } from '../../utils/extrema.ts'
import { locations } from '../data/locations.ts'
import { withViewport } from './withViewport.tsx'

const margin = { top: 20, right: 20, bottom: 30, left: 40 }
// https://observablehq.com/@d3/learn-d3-interaction
const bisect = d3.bisector<CumTransaction, number>(d => d.time).center

export function displayUsd (
  amount: number,
  change = false,
  hyphen = false
): string {
  return (
    (amount < 0 ? (hyphen ? '-$' : '−$') : change ? '+$' : '$') +
    Math.abs(amount).toFixed(2)
  )
}

function displayLocalTime (date: Date): string {
  const local = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes()
  )
  return local.toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'short' // No seconds
  })
}

const TOOLTIP_WIDTH = 260
/** Approximate height */
const TOOLTIP_HEIGHT = 130
type TooltipProps = {
  datum: CumTransaction
  xScale: d3.ScaleTime<number, number, never>
  yScale: d3.ScaleLinear<number, number, never>
  width: number
  height: number
}
function Tooltip ({ datum, xScale, yScale, width, height }: TooltipProps) {
  const x = xScale(datum.time)
  const y = yScale(datum.balance)
  const anchoredLeft = x + TOOLTIP_WIDTH <= width - margin.right
  const anchoredTop = y + TOOLTIP_HEIGHT <= height - margin.bottom
  return (
    <div
      class='tooltip'
      style={{
        left: `${anchoredLeft ? x : x - TOOLTIP_WIDTH}px`,
        top: anchoredTop ? `${y}px` : null,
        bottom: !anchoredTop ? `${height - y}px` : null,
        width: `${TOOLTIP_WIDTH}px`,
        [`border-${anchoredTop ? 'top' : 'bottom'}-${
          anchoredLeft ? 'left' : 'right'
        }-radius`]: '3px'
      }}
    >
      <h2 class='tooltip-amount'>{displayUsd(datum.amount, true)}</h2>
      <p class='tooltip-line'>On {displayLocalTime(new Date(datum.time))}</p>
      <p class='tooltip-line'>
        From {locations[datum.location] || datum.location}
        {datum.location.includes('Mobile') ? ' (mobile order)' : ''}
      </p>
      <p class='tooltip-line'>Remaining: {displayUsd(datum.balance)}</p>
    </div>
  )
}

type ActualGraphProps = {
  data: CumTransaction[]
  includeZero?: boolean
  includeNow?: boolean
}
function ActualGraph ({
  data,
  viewport: { width, height },
  includeZero = false,
  includeNow = false
}: ActualGraphProps & { viewport: DOMRect }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const xAxisRef = useRef<SVGGElement>(null)
  const yAxisRef = useRef<SVGGElement>(null)
  const [hover, setHover] = useState<CumTransaction | null>(null)

  const { xScale, yScale, line, area } = useMemo(() => {
    // https://observablehq.com/@d3/d3-scaletime
    const xScale = d3
      .scaleTime()
      .domain([
        data[0].time,
        includeNow ? Date.now() : data[data.length - 1].time
      ])
      .range([margin.left, width - margin.right])
    // .nice()
    const [min, max] = extrema(data.map(d => d.balance))
    const yScale = d3
      .scaleLinear()
      .domain([includeZero ? 0 : min, max])
      .range([height - margin.bottom, margin.top])
    const line = d3
      .line<CumTransaction>()
      .x(d => xScale(d.time))
      .y(d => yScale(d.balance))
      // https://github.com/d3/d3-shape/blob/main/README.md#curveStepAfter
      .curve(d3.curveStepAfter)
    const area = d3
      .area<CumTransaction>()
      .x(d => xScale(d.time))
      .y0(height - margin.bottom)
      .y1(d => yScale(d.balance))
      .curve(d3.curveStepAfter)
    return { xScale, yScale, line, area }
  }, [data, width, height, includeZero, includeNow])

  useEffect(() => {
    if (xAxisRef.current) {
      d3.select(xAxisRef.current).call(
        d3.axisBottom(xScale).ticks(1 + Math.floor(width / 100))
      )
    }
  }, [xScale, xAxisRef.current, width])

  useEffect(() => {
    if (yAxisRef.current) {
      d3.select(yAxisRef.current).call(d3.axisLeft(yScale))
    }
  }, [yScale, yAxisRef.current])

  return (
    <>
      <svg
        class='graph'
        viewBox={`0 0 ${width} ${height}`}
        ref={svgRef}
        onMouseMove={e => {
          setHover(data[bisect(data, xScale.invert(e.offsetX).getTime())])
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id='gradient' x1='0' y1='0' x2='0' y2='1'>
            <stop class='gradient-stop' stop-opacity='0.3' offset='0%' />
            <stop class='gradient-stop' stop-opacity='0.05' offset='100%' />
          </linearGradient>
        </defs>
        <path class='data-gradient' d={area(data) ?? undefined} />
        <g
          class='axis'
          transform={`translate(0, ${height - margin.bottom})`}
          ref={xAxisRef}
        />
        <g
          class='axis'
          transform={`translate(${margin.left}, 0)`}
          ref={yAxisRef}
        />
        <path class='data-line' d={line(data) ?? undefined} />
        {hover && (
          <circle
            class='tooltip-dot'
            r='3'
            transform={`translate(${xScale(hover.time)}, ${yScale(
              hover.balance
            )})`}
          ></circle>
        )}
      </svg>
      {hover && (
        <Tooltip
          datum={hover}
          xScale={xScale}
          yScale={yScale}
          width={width}
          height={height}
        />
      )}
    </>
  )
}

export const Graph = withViewport(ActualGraph)
