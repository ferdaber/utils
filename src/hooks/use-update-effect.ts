import { DependencyList, useEffect, useLayoutEffect } from 'react'
import { useIsMounted } from './use-is-mounted'

/**
 * A useEffect wrapper that only runs its effect on renders after the first one.
 *
 * Note that if a dependency list is included, the effect will only run the first time that the
 * dependencies have changed, and will exclude the first update to the component if the update did
 * not change any of the included dependencies.
 * @param effect The effect to run
 * @param deps The list of dependencies
 * @param includeFirstUpdate If `true` then the effect will run on the very first update, regardless
 * of whether or not the update changed the list of dependencies
 */
export function useUpdateEffect(
  effect: () => void | (() => void),
  deps?: DependencyList,
  includeFirstUpdate?: boolean
) {
  const isMounted = useIsMounted()
  useEffect(
    () => {
      if (!isMounted) return
      return effect()
    },
    deps ? (includeFirstUpdate ? [isMounted, ...deps] : deps) : undefined
  )
}

/**
 * A useLayoutEffect wrapper that only runs its effect on renders after the first one.
 *
 * Note that if a dependency list is included, the effect will only run the first time that the
 * dependencies have changed, and will exclude the first update to the component if the update did
 * not change any of the included dependencies.
 * @param effect The effect to run
 * @param deps The list of dependencies
 * @param includeFirstUpdate If `true` then the effect will run on the very first update, regardless
 * of whether or not the update changed the list of dependencies
 */
export function useUpdateLayoutEffect(
  effect: () => void | (() => void),
  deps?: DependencyList,
  includeFirstUpdate?: boolean
) {
  const isMounted = useIsMounted()
  useLayoutEffect(
    () => {
      if (!isMounted) return
      return effect()
    },
    deps ? (includeFirstUpdate ? [isMounted, ...deps] : deps) : undefined
  )
}
