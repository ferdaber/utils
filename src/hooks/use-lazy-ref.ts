import { MutableRefObject, useState, useRef, useDebugValue } from 'react'

/**
 * A useRef wrapper that allows lazy initialization of its value
 */
export function useLazyRef<S>(init: S | (() => S)): MutableRefObject<S>
export function useLazyRef<S = undefined>(): MutableRefObject<S | undefined>
export function useLazyRef<S>(init?: S | (() => S)) {
  const [nakedValue] = useState<S | undefined>(init)
  const value = useRef(nakedValue)
  useDebugValue(value.current)
  return value
}
