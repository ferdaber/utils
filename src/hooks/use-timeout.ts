import { DependencyList, useEffect, useDebugValue } from 'react'

import { useComputedStatefulRef } from './use-stateful-ref'

/**
 * Runs a timer and returns whether or not that timer is expired.
 * Useful to suspend rendering of a component as it awaits some API return value
 * @param timeoutMs timeout in milliseconds
 * @param deps optional inputs, the timeout will be reset if the inputs array changed, if no inputs are passed in then the timeout is only run once
 * @returns whether the timeout has expired
 */
export function useTimeout(timeoutMs: number, deps: DependencyList = []) {
  const [expired, setExpired] = useComputedStatefulRef(() => false, [timeoutMs, ...deps])
  useEffect(() => {
    const id = window.setTimeout(setExpired, timeoutMs, true)
    return () => {
      window.clearTimeout(id)
    }
  }, [timeoutMs, ...deps])
  useDebugValue(expired.current)
  return expired.current
}
