import { DependencyList, useEffect } from 'react'

/**
 * A useEffect wrapper that accepts async effect callbacks. The effect callback
 * receives an abort signal that can be checked to see if another effect has already
 * been triggered before the asynchronous function fully resolves. Any cleanup function
 * will be run if the asynchronous function fully resolves before another effect is triggered.
 * @param effect The async effect to run
 * @param deps The dependency array
 */
export function useAsyncEffect(
  effect: (signal: { readonly aborted: boolean }) => Promise<void | (() => void)>,
  deps?: DependencyList
) {
  useEffect(() => {
    const signal = { aborted: false }
    let cleanup: () => void
    effect(signal).then(cb => {
      // if the effect promise resolves before dependencies change
      // we probably want to run the cleanup function when they do eventually change
      if (cb && !signal.aborted) cleanup = cb
    })
    return () => {
      if (cleanup) cleanup()
      signal.aborted = true
    }
  }, deps)
}
