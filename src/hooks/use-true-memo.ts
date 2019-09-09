import { DependencyList, useDebugValue, useEffect } from 'react'
import { useLazyRef } from './use-lazy-ref'
import { useImmediateEffect } from './use-immediate-effect'

/**
 * A useMemo wrapper that is semantically *guaranteed* to return the same value
 * as long as dependencies don't change
 */
export function useTrueMemo<T>(init: () => T, deps: DependencyList) {
  const value = useLazyRef<T>()
  let nextValue = value.current
  useImmediateEffect(() => {
    nextValue = init()
  }, deps)
  useDebugValue(nextValue)
  useEffect(() => {
    value.current = nextValue
  }, [nextValue])
  return nextValue!
}

/**
 * A useCallback wrapper that is semantically *guaranteed* to return the same value
 * as long as dependencies don't change
 */
export function useTrueCallback<T extends (...args: any[]) => any>(cb: T, deps: DependencyList) {
  const value = useTrueMemo(() => cb, deps)
  useDebugValue(value)
  return value
}
