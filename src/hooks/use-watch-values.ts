import { DependencyList, useRef, useDebugValue, useEffect } from 'react'

/**
 * Watches a list of values and returns whether or not those values have changed since the
 * last time React has rendered the component. This hook is safe for Concurrent mode and will
 * return the same value on partial rerenders.
 * @param values The list of values to watch
 * @param includeOnMount If `true` then this hook will track the first time the component renders
 * and return `true`, otherwise it will be `false`.
 */
export function useWatchValues(values: DependencyList, includeOnMount?: boolean) {
  const prevValues = useRef(includeOnMount ? undefined : values)
  useDebugValue(prevValues.current)
  const changed =
    !prevValues.current ||
    prevValues.current.length !== values.length ||
    prevValues.current.some((prevDep, i) => !Object.is(prevDep, values[i]))
  useEffect(() => {
    if (changed) {
      prevValues.current = values
    }
  })
  return changed
}
