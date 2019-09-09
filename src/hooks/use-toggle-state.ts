import { useState, useDebugValue, useRef } from 'react'

/**
 * A useState wrapper that toggles between `true` and `false` values
 * @returns `[state, toggleState]`
 */
export function useToggleState(initialValue: boolean | (() => boolean) = false) {
  const [state, setState] = useState(initialValue)
  useDebugValue(state)
  const toggleState = useRef(() => setState(v => !v)).current
  return [state, toggleState] as const
}
