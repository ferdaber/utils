import { useEffect, RefObject, useState, useRef, useMemo, useCallback, DependencyList } from 'react'

export interface EffectAbortController {
  readonly aborted: boolean
}
/**
 * Allows emitting an effect using an async callback.
 * @param asyncEffect the async effect callback, if it returns a promised callback, it will be used as the cleanup when it resolves
 * @param deps input array for inner `useEffect`
 */
export function useAsyncEffect(
  asyncEffect: (abortController: EffectAbortController) => Promise<void | (() => void)>,
  deps?: DependencyList
) {
  useEffect(() => {
    const abortController = {
      aborted: false,
    }
    const promise = asyncEffect(abortController)
    return () => {
      abortController.aborted = true
      promise.then(cleanup => cleanup && cleanup())
    }
  }, deps)
}

export function useImmediateEffect(effect: () => void | (() => void), deps: DependencyList) {
  const cleanup = useRef<() => void>()
  useMemo(() => {
    if (cleanup.current) {
      cleanup.current()
    }
    cleanup.current = effect() || undefined
  }, deps)
}

export type Measurable = Pick<Element, 'getBoundingClientRect'>
/**
 * Allows retrieving measurements of an element efficiently. Measurements are taken
 * with every update of the element and window resizes, and can be triggered manually
 * in case updates only occur deeper in the tree that doesn't trigger an update at this level
 * @param getMeasurable callback or a ref object to retrieve the measureable object
 * @returns [the measurements; manual measure function]
 */
export function useMeasurable(getMeasurable: RefObject<Measurable> | (() => Measurable | null)) {
  const [measurements, setMeasurements] = useState<ClientRect | null>(null)
  const ref = useRef<Measurable>()
  const measure = useCallback(() => {
    if (!ref.current) return
    // all properties are not own properties in a client rect, so destructure manually
    const { left, top, right, bottom, height, width } = ref.current.getBoundingClientRect()
    const rect = { left, top, right, bottom, height, width }
    if (!measurements) return setMeasurements(rect)
    for (const prop in rect) {
      if (rect[prop] !== measurements[prop]) {
        return setMeasurements(rect)
      }
    }
  }, [measurements])

  useEffect(() => {
    if ('current' in getMeasurable) {
      ref.current = getMeasurable.current || undefined
    } else {
      ref.current = getMeasurable() || undefined
    }
    if (ref.current) {
      measure()
    }
  })

  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  return [measurements, measure] as const
}

/**
 * Runs a timer and returns whether or not that timer is expired.
 * Useful to suspend rendering of a component as it awaits some API return value
 * @param timeoutMs timeout in milliseconds
 * @param deps optional inputs, the timeout will be reset if the inputs array changed, if no inputs are passed in then the timeout is only run once
 * @returns whether the timeout has expired
 */
export function useTimeout(timeoutMs: number, deps: DependencyList = []) {
  let [expired, setExpired] = useState(false)
  useImmediateEffect(() => {
    setExpired((expired = false))
    const timeoutId = window.setTimeout(() => {
      setExpired(true)
    }, timeoutMs)
    return () => window.clearTimeout(timeoutId)
  }, deps)
  return expired
}
