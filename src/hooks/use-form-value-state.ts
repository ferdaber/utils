import { useState, useDebugValue, useRef } from 'react'

interface ValueEvent {
  target: {
    value: string
  }
}
/**
 * A useState wrapper that also returns an event handler for any form fields that have a `checked` property
 * for its event targets
 * @returns `[state, setState, eventHandler]`
 */
export function useFormValueState(initialState: string | (() => string) = '') {
  const [state, setState] = useState(initialState)
  useDebugValue(state)
  const eventHandler = useRef((event: ValueEvent) => setState(event.target.value)).current
  return [state, setState, eventHandler] as const
}

interface CheckedEvent {
  target: {
    checked: boolean
  }
}
/**
 * A useState wrapper that also returns an event handler for any form fields that have a `checked` property
 * for its event targets
 * @returns `[state, setState, eventHandler]`
 */
export function useFormToggleState(initialState: boolean | (() => boolean) = false) {
  const [state, setState] = useState(initialState)
  useDebugValue(state)
  const eventHandler = useRef((event: CheckedEvent) => setState(event.target.checked)).current
  return [state, setState, eventHandler] as const
}
