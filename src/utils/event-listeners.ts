/**
 * @returns a promise that resolves when the event is fired.
 */
export function event (target: EventTarget, eventName: string): Promise<void> {
  return new Promise(resolve => {
    target.addEventListener(eventName, () => resolve(), { once: true })
  })
}
