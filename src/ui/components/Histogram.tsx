/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useMemo, useRef } from 'preact/hooks'
import * as d3 from 'd3'
import { withViewport } from './withViewport.tsx'
import { displayUsd } from './Graph.tsx'

const defaultMargin = { top: 20, right: 20, bottom: 30, left: 40 }
type Margin = typeof defaultMargin

const formatter = new Intl.DateTimeFormat(undefined, {
  timeZone: 'UTC',
  timeStyle: 'short'
})

export type Format = 'number' | 'time' | 'money'
export type HistogramProps = {
  data: number[]
  margin?: Partial<Margin>
  format?: Format
}
export const Histogram = withViewport<HistogramProps>(props => {
  const {
    viewport: { width, height },
    data,
    margin: customMargin,
    format = 'number'
  } = props
  const margin = { ...defaultMargin, ...customMargin }
  const svgRef = useRef<SVGSVGElement>(null)
  const xAxisRef = useRef<SVGGElement>(null)
  const yAxisRef = useRef<SVGGElement>(null)

  const { bins, xScale, yScale } = useMemo(() => {
    // https://observablehq.com/@d3/histogram/2
    const bins = d3.bin().thresholds(40)(data)
    const xScale =
      format === 'time'
        ? d3
            .scaleUtc()
            .domain([0, 1440])
            .range([margin.left, width - margin.right])
        : d3
            .scaleLinear()
            .domain([bins[0].x0 ?? 0, bins[bins.length - 1].x1 ?? 0])
            .range([margin.left, width - margin.right])
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(bins, d => d.length) ?? 0])
      .range([height - margin.bottom, margin.top])
      .nice()
    return { bins, xScale, yScale }
  }, [data, width, height])

  useEffect(() => {
    if (xAxisRef.current) {
      d3.select(xAxisRef.current).call(
        d3
          .axisBottom(xScale)
          .ticks(width / 80)
          .tickSizeOuter(0)
          // https://observablehq.com/@d3/sleep-cycles
          .tickFormat(d =>
            format === 'time'
              ? formatter.format(+d * 60_000)
              : format === 'money'
              ? displayUsd(+d)
              : String(d)
          )
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
      <svg class='graph' viewBox={`0 0 ${width} ${height}`} ref={svgRef}>
        <g
          class='axis'
          transform={`translate(0, ${height - margin.bottom})`}
          ref={xAxisRef}
        />
        <g
          class='axis bar-chart-y-axis'
          transform={`translate(${margin.left}, 0)`}
          ref={yAxisRef}
        />
        {bins.map((d, i) => (
          <rect
            key={i}
            class='bar'
            x={xScale(d.x0 ?? 0)}
            width={Math.max(xScale(d.x1 ?? 0) - xScale(d.x0 ?? 0) - 1, 0)}
            y={yScale(d.length)}
            height={yScale(0) - yScale(d.length)}
          >
            <title>
              {format === 'time'
                ? formatter.formatRange(
                    (d.x0 ?? 0) * 60_000,
                    (d.x1 ?? 0) * 60_000
                  )
                : format === 'money'
                ? `${displayUsd(d.x0 ?? 0)} – ${displayUsd(d.x1 ?? 0)}`
                : `${d.x0} – ${d.x1}`}{' '}
              ({d.length})
            </title>
          </rect>
        ))}
      </svg>
    </>
  )
})
