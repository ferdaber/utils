import { useState, useRef } from 'react'

/**
 * Returns a callback that can be called to force a rerender.
 */
export function useRerender() {
  const [, setFlag] = useState(false)
  return useRef(() => setFlag(flag => !flag)).current
}
