/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'https://esm.sh/preact@10.6.6/hooks'
import * as d3 from 'https://cdn.skypack.dev/d3@7.6.1?dts'
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
  const ref = useRef<SVGSVGElement>(null)

  const { line, area } = useMemo(() => {
    // https://observablehq.com/@d3/d3-scaletime
    const xScale = d3
      .scaleTime()
      .domain([data[0].time, data[data.length - 1].time])
      .range([margin.left, width - margin.right])
      .nice()
    const yScale = d3
      .scaleLinear()
      .domain(extrema(data.map(d => d.balance)))
      .range([margin.top, height - margin.bottom])
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
    return { line, area }
  }, [data])

  return (
    <svg class='graph' viewBox={`0 0 ${width} ${height}`} ref={ref}>
      <defs>
        <linearGradient id='gradient' x1='0' y1='0' x2='0' y2='1'>
          <stop class='gradient-stop' stop-opacity={0.3} offset='0%' />
          <stop class='gradient-stop' stop-opacity={0.05} offset='100%' />
        </linearGradient>
      </defs>
      <path class='data-gradient' d={area(data) ?? undefined} />
      <path class='data-line' d={line(data) ?? undefined} />
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
