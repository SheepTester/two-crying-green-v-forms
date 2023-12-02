/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { ComponentType } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'

export function withViewport<T> (
  wrapperClass: string,
  Component: ComponentType<T & { viewport: DOMRect }>
) {
  return (props: T) => {
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
      <div class={wrapperClass} ref={wrapperRef}>
        {viewport && <Component {...props} viewport={viewport} />}
      </div>
    )
  }
}
