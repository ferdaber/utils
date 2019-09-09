import { useRef, useDebugValue, useEffect } from 'react'

/**
 * Returns whether or not the component has mounted (committed its first render).
 */
export function useIsMounted() {
  const isMounted = useRef(false)
  useDebugValue(isMounted.current)
  useEffect(() => {
    isMounted.current = true
  }, [])
  return isMounted.current
}
