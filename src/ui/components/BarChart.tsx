/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useMemo, useRef } from 'preact/hooks'
import * as d3 from 'd3'
import { withViewport } from './withViewport.tsx'

const defaultMargin = { top: 20, right: 20, bottom: 30, left: 40 }
type Margin = typeof defaultMargin

export type BarChartProps = {
  data: [group: string, frequency: number][]
  slanted?: boolean
  margin?: Partial<Margin>
}
export const BarChart = withViewport<BarChartProps>(props => {
  const {
    viewport: { width, height },
    data,
    slanted = false,
    margin: customMargin
  } = props
  const margin = { ...defaultMargin, ...customMargin }
  const svgRef = useRef<SVGSVGElement>(null)
  const xAxisRef = useRef<SVGGElement>(null)
  const yAxisRef = useRef<SVGGElement>(null)

  const { xScale, yScale } = useMemo(() => {
    // https://observablehq.com/@d3/bar-chart/2
    const xScale = d3
      .scaleBand()
      .domain(data.map(([group]) => group))
      .range([margin.left, width - margin.right])
      .padding(0.1)
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, ([, frequency]) => frequency) ?? 0])
      .range([height - margin.bottom, margin.top])
    return { xScale, yScale }
  }, [data, width, height])

  useEffect(() => {
    if (xAxisRef.current) {
      d3.select(xAxisRef.current).call(d3.axisBottom(xScale).tickSizeOuter(0))
    }
  }, [xScale, xAxisRef.current])

  useEffect(() => {
    if (yAxisRef.current) {
      d3.select(yAxisRef.current).call(d3.axisLeft(yScale))
    }
  }, [yScale, yAxisRef.current])

  return (
    <>
      <svg class='graph' viewBox={`0 0 ${width} ${height}`} ref={svgRef}>
        <g
          class={`axis ${slanted ? 'slanted' : ''}`}
          transform={`translate(0, ${height - margin.bottom})`}
          ref={xAxisRef}
        />
        <g
          class='axis bar-chart-y-axis'
          transform={`translate(${margin.left}, 0)`}
          ref={yAxisRef}
        />
        {data.map(([group, frequency], i) => (
          <rect
            key={i}
            class='bar'
            x={xScale(group)}
            y={yScale(frequency)}
            width={xScale.bandwidth()}
            height={yScale(0) - yScale(frequency)}
          >
            <title>
              {group} ({frequency})
            </title>
          </rect>
        ))}
      </svg>
    </>
  )
})

export function countFrequencies<T, K> (
  data: T[],
  getKey: (datum: T) => K,
  keys?: K[]
): [K, number][] {
  const frequencies = new Map<K, number>()
  if (keys) {
    for (const key of keys) {
      frequencies.set(key, 0)
    }
  }
  for (const datum of data) {
    const key = getKey(datum)
    frequencies.set(key, (frequencies.get(key) ?? 0) + 1)
  }
  const arr = Array.from(frequencies.entries())
  if (!keys) {
    // Sort by frequency
    arr.sort((a, b) => b[1] - a[1])
  }
  return arr
}
