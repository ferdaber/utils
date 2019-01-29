import {
  useEffect,
  RefObject,
  useState,
  useRef,
  useMemo,
  useCallback,
  InputIdentityList,
} from 'react'
import { tuple } from 'index'

/**
 * Allows emitting an effect using an async callback.
 * @param asyncEffect the async effect callback, if it returns a promised callback, it will be used as the cleanup when it resolves
 * @param inputs input array for inner `useEffect`
 */
export function useAsyncEffect(
  asyncEffect: () => Promise<void | (() => void)>,
  inputs?: InputIdentityList
) {
  useEffect(() => {
    const promise = asyncEffect()
    return () => {
      promise.then(cleanup => cleanup && cleanup())
    }
  }, inputs)
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
  const [measurements, setMeasurements] = useState<ClientRect | DOMRect | null>(null)
  const instance = useRef({
    blockNextMeasureEffect: false,
    measurable: null as Measurable | null,
    rafId: null as number | null,
    timeoutId: null as number | null,
    measure() {
      // https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Performance_best_practices_for_Firefox_fe_engineers#How_do_I_avoid_triggering_uninterruptible_reflow
      if (instance.rafId) window.cancelAnimationFrame(instance.rafId)
      if (instance.timeoutId) window.clearTimeout(instance.timeoutId)
      instance.rafId = window.requestAnimationFrame(() => {
        instance.rafId = null
        instance.timeoutId = window.setTimeout(() => {
          instance.timeoutId = null
          if (instance.measurable) {
            // because we use an effect to catch any potential updates to the measurable
            // we specifically block that effect from causing an infinite loop when we
            // set the measurements state since that itself will trigger the effect
            instance.blockNextMeasureEffect = true
            setMeasurements(instance.measurable.getBoundingClientRect())
          }
        }, 0)
      })
    },
  }).current

  useEffect(() => {
    window.addEventListener('resize', instance.measure)
    return () => {
      window.removeEventListener('resize', instance.measure)
      if (instance.rafId) window.cancelAnimationFrame(instance.rafId)
      if (instance.timeoutId) window.clearTimeout(instance.timeoutId)
    }
  }, [])

  useEffect(() => {
    instance.measurable =
      typeof getMeasurable === 'function' ? getMeasurable() : getMeasurable.current
    if (instance.measurable && !instance.blockNextMeasureEffect) {
      instance.measure()
    }
    instance.blockNextMeasureEffect = false
  })

  return tuple(measurements, instance.measure)
}

/**
 * Similar to `useState` but also returns a `resetState` method in the tuple to set the state
 * to its initial value. Note that changes in the `initialState` in subsequent renders
 * will not affect the initial value `resetState` uses (it will always use the value from the first render)
 * @param initialState the initial state or a callback to create the initial state
 * @returns [current state; standard set state function; reset the state to initial value]
 */
export function useResettableState<T>(initialState: T | (() => T)) {
  const memoizedInitialState = useMemo(
    () => (typeof initialState === 'function' ? (initialState as () => T)() : initialState),
    []
  )
  const [state, setState] = useState(memoizedInitialState)
  const resetState = useCallback(() => setState(memoizedInitialState), [setState])
  return tuple(state, setState, resetState)
}

/**
 * Runs a timer and returns whether or not that timer is expired.
 * Useful to suspend rendering of a component as it awaits some API return value
 * @param timeoutMs timeout in milliseconds
 * @param inputs optional inputs, the timeout will be reset if the inputs array changed, if no inputs are passed in then the timeout is only run once
 * @returns whether the timeout has expired
 */
export function useTimeout(timeoutMs: number, inputs: InputIdentityList = []) {
  const timeoutId = useRef<number | null>(null)
  const [expired, setExpired] = useState(false)
  useEffect(() => {
    if (expired) setExpired(false)
    timeoutId.current = window.setTimeout(() => {
      timeoutId.current = null
      setExpired(true)
    }, timeoutMs)
    return () => timeoutId.current && window.clearTimeout(timeoutId.current)
  }, inputs)
  return expired
}
