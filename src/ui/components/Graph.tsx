/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import * as d3 from 'd3'
import { CumTransaction } from '../../transactions/parse.ts'
import { extrema } from '../../utils/extrema.ts'

const margin = { top: 20, right: 30, bottom: 30, left: 40 }
// https://observablehq.com/@d3/learn-d3-interaction
const bisect = d3.bisector<CumTransaction, number>(d => d.time).center

function displayUsd (amount: number, change = false): string {
  return (amount < 0 ? '−$' : change ? '+$' : '$') + Math.abs(amount).toFixed(2)
}

const TOOLTIP_WIDTH = 250
/** Approximate height */
const TOOLTIP_HEIGHT = 150
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
  return (
    <div
      class='tooltip'
      style={{
        left: `${
          x + TOOLTIP_WIDTH > width - margin.right ? x - TOOLTIP_WIDTH : x
        }px`,
        top: y + TOOLTIP_HEIGHT <= height - margin.bottom ? `${y}px` : null,
        bottom:
          y + TOOLTIP_HEIGHT > height - margin.bottom
            ? `${height - y}px`
            : null,
        width: `${TOOLTIP_WIDTH}px`
      }}
    >
      <h2 class='tooltip-amount'>{displayUsd(datum.amount, true)}</h2>
      <p class='tooltip-line'>On {new Date(datum.time).toLocaleString()}</p>
      <p class='tooltip-line'>At {datum.location}</p>
      <p class='tooltip-line'>Remaining: {displayUsd(datum.balance)}</p>
      <p class='tooltip-line'>{datum.account}</p>
    </div>
  )
}

type ActualGraphProps = {
  data: CumTransaction[]
  viewport: DOMRect
  includeZero?: boolean
}
function ActualGraph ({
  data,
  viewport: { width, height },
  includeZero = false
}: ActualGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const xAxisRef = useRef<SVGGElement>(null)
  const yAxisRef = useRef<SVGGElement>(null)
  const [hover, setHover] = useState<CumTransaction | null>(null)

  const { xScale, yScale, line, area } = useMemo(() => {
    // https://observablehq.com/@d3/d3-scaletime
    const xScale = d3
      .scaleTime()
      .domain([data[0].time, data[data.length - 1].time])
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
  }, [data, width, height, includeZero])

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
            r='2.5'
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

type GraphProps = {
  data: CumTransaction[]
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
