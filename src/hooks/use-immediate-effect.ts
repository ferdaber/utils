import { DependencyList, useRef, useEffect } from 'react'

import { noop } from '../utils/js'
import { useWatchValues } from './use-watch-values'

/**
 * Runs an effect immediately if its dependencies change. That the callback is run
 * inside the call stack of this hook (it is not queued to run after the render nor after commit)
 *
 * If a setState is called within the effect it will cause a rerender and may cause an infinite loop
 * if the dependencies change on subsequent rerenders
 *
 * A cleanup function can be returned that will run the next time the effect is run with different dependencies.
 * If the effect causes an immediate rerender or its own render is interrupted, the cleanup function will be called
 * multiple times, so be wary of unintended side effects (make sure it's idempotent)
 * @param effect
 * @param deps
 */
export function useImmediateEffect(effect: () => void | (() => void), deps: DependencyList) {
  const depsChanged = useWatchValues(deps, true)
  const prevEffectCleanup = useRef(noop)

  let cleanup = noop
  if (depsChanged) {
    // the cleanup function is run eagerly and can be run multiple times
    // if React decides to suspend the tree, so setting ref values is unsafe
    // but in general setting ref values outside of an effect is an unsafe action
    prevEffectCleanup.current()
    const cb = effect()
    if (cb) cleanup = cb
  }
  useEffect(() => {
    if (depsChanged) {
      prevEffectCleanup.current = cleanup
    }
  })
}
