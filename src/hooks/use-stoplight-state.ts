import { useState, useDebugValue, useCallback } from 'react'

/**
 * A useState wrapper that moves between a distinct list of states
 * @param states The list of states to move between
 * @param loop If `true` moving between states will loop to the beginning or end of the list when going out of bounds
 * @param initialIdx The initial index in the list of states to start with
 * @returns `[state, gotoPrevState, gotoNextState]`
 */
export function useStoplightState<T extends readonly any[]>(
  states: T,
  loop = false,
  initialIdx: number | (() => number) = 0
) {
  const [idx, setIdx] = useState(initialIdx)
  useDebugValue([states[idx], idx])
  const next = useCallback(
    () => setIdx(idx => (idx + 1 < states.length ? idx + 1 : loop ? 0 : idx)),
    [loop, states.length]
  )
  const prev = useCallback(
    () => setIdx(idx => (idx - 1 >= 0 ? idx - 1 : loop ? states.length - 1 : idx)),
    [loop, states.length]
  )
  return [states[idx] as T[number], prev, next] as const
}
