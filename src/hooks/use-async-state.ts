import { useState, useDebugValue } from 'react'
import { useAsyncEffect } from './use-async-effect'

export type AsyncState<T> = {
  loading: boolean
  data?: T
  lastLoaded?: Date
  error?: any
}

/**
 * useState wrapper that wraps an async state into its loading states and errors.
 * When `getData` is called, `error` is set to `undefined`, and the last known `data` is kept.
 */
export function useAsyncState<T, A extends any[]>(
  getData: (...args: A) => Promise<T>,
  getDataArgs: A
): AsyncState<T>
export function useAsyncState<T>(getData: () => Promise<T>): AsyncState<T>
export function useAsyncState<T, A extends any[]>(
  getData: (...args: A) => Promise<T>,
  getDataArgs: A = ([] as unknown) as A
) {
  const [state, setState] = useState<AsyncState<T>>({
    loading: false,
  })
  useDebugValue(state)
  useAsyncEffect(
    async signal => {
      setState(state => ({
        data: state.data,
        lastLoaded: state.lastLoaded,
        loading: true,
      }))
      try {
        const data = await getData.apply(null, getDataArgs)
        if (signal.aborted) return
        setState({
          data,
          lastLoaded: new Date(),
          loading: false,
        })
      } catch (error) {
        setState(state => ({
          data: state.data,
          lastLoaded: new Date(),
          error,
          loading: false,
        }))
      }
    },
    [getData, ...getDataArgs]
  )
  return state
}
