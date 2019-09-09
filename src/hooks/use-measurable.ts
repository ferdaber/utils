import {
  RefObject,
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
  useEffect,
  useDebugValue,
} from 'react'

import { iss } from '../utils/js'

// all properties in ClientRect are computed so they can't be destructured, wahhh
function normalizeRect(rect: ClientRect) {
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    height: rect.height,
    width: rect.width,
  } as const
}
export type Measurable = Pick<Element, 'getBoundingClientRect'>
/**
 * Allows retrieving measurements of an element efficiently. Measurements are taken
 * with every update of the element and window resizes, and can be triggered manually
 * in case updates only occur deeper in the tree that doesn't trigger an update at this level
 * @param getMeasurable callback or a ref object to retrieve the measureable object
 */
export function useMeasurable<T = ReturnType<typeof normalizeRect>>(
  getMeasurable: RefObject<Measurable> | (() => Measurable | null),
  selector?: (rect: ClientRect) => T
): readonly [T | null, () => void]
export function useMeasurable(
  getMeasurable: RefObject<Measurable> | (() => Measurable | null),
  selector?: (rect: ClientRect) => any
) {
  const [measurements, setMeasurements] = useState<ClientRect | null>(null)
  const ref = useRef<Measurable>()
  const measure = useCallback(() => {
    if (!ref.current) return
    const rect = normalizeRect(ref.current.getBoundingClientRect())
    setMeasurements(state => {
      const nextState = selector ? selector(rect) : rect
      if (!state) return selector ? selector(rect) : rect
      return iss(state, nextState) ? state : nextState
    })
  }, [selector])

  useLayoutEffect(() => {
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
  useDebugValue(measurements)
  return [measurements, measure] as const
}
