/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import * as d3 from 'd3'
import { AccumulatedTransaction } from '../../transactions/parse.ts'
import { extrema } from '../../utils/extrema.ts'

const margin = { top: 20, right: 30, bottom: 30, left: 40 }

type ActualGraphProps = {
  data: AccumulatedTransaction[]
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
      .line<AccumulatedTransaction>()
      .x(d => xScale(d.time))
      .y(d => yScale(d.balance))
      // https://github.com/d3/d3-shape/blob/main/README.md#curveStepAfter
      .curve(d3.curveStepAfter)
    const area = d3
      .area<AccumulatedTransaction>()
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
    <svg class='graph' viewBox={`0 0 ${width} ${height}`} ref={svgRef}>
      <defs>
        <linearGradient id='gradient' x1='0' y1='0' x2='0' y2='1'>
          <stop class='gradient-stop' stop-opacity={0.3} offset='0%' />
          <stop class='gradient-stop' stop-opacity={0.05} offset='100%' />
        </linearGradient>
      </defs>
      <path class='data-gradient' d={area(data) ?? undefined} />
      <path class='data-line' d={line(data) ?? undefined} />
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
