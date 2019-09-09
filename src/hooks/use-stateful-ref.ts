import {
  Dispatch,
  SetStateAction,
  useState,
  useRef,
  useEffect,
  useDebugValue,
  DependencyList,
} from 'react'
import { useLazyRef } from './use-lazy-ref'
import { useWatchValues } from './use-watch-values'

/**
 * Produces a ref that is "stateful" in that it has a setter function that
 * will trigger a rerender of the consuming component if its state changes. Note
 * that setting it to the same value will not trigger a rerender.
 *
 * Setting its `current` value directly will also not trigger a rerender, but its value
 * will be lost by the next render.
 */
export function useStatefulRef<S>(
  initialValue: S | (() => S)
): readonly [{ readonly current: S }, Dispatch<SetStateAction<S>>]
export function useStatefulRef<S = undefined>(): readonly [
  { readonly current: S | undefined },
  Dispatch<SetStateAction<S | undefined>>
]
export function useStatefulRef<S>(initialValue?: S | (() => S)) {
  // the volatile state container is a ref since it can be updated synchronously
  const state = useLazyRef<S | undefined>(initialValue)
  // use state as a "ref" to the current render cycle, rerenders of the same fiber will
  // have the same value for `ref`
  const [ref, setRef] = useState({ value: state.current })
  const lastRef = useRef(ref)
  // if the state pointer in this render is the same as the last known one
  // it means we're inside a rerender, so we reset the value to the last known value
  if (lastRef.current === ref) {
    state.current = ref.value
  }
  // use a ref for the callback to maintain its referential integrity throughout the lifetime
  // of the consuming component
  const setRefState = useRef(
    (action: S | undefined | ((prevState: S | undefined) => S | undefined)) => {
      // any updates will immediately change the volatile state
      // so that dereferenced values reflect in real time
      const nextState =
        typeof action === 'function'
          ? (action as (prevState: S | undefined) => S | undefined)(state.current)
          : action
      if (!Object.is(state.current, nextState)) {
        state.current = nextState
        setRef({ value: nextState })
      }
    }
  ).current

  useEffect(() => {
    lastRef.current = ref
  })

  useDebugValue(state.current)
  return [state, setRefState] as const
}

/**
 * Produces a ref that is "stateful" in that it has a setter function that
 * will trigger a rerender of the consuming component if its state changes. Note
 * that setting it to the same value will not trigger a rerender.
 *
 * If its dependency array changes (excluding the first render), the value of the ref will be
 * recomputed and trigger a rerender.
 *
 * An overload is provided so that the initial value can be separately set from
 * the recomputation callback
 */
export function useComputedStatefulRef<S>(
  computeValue: () => S,
  deps: DependencyList
): readonly [{ readonly current: S }, Dispatch<SetStateAction<S>>]
export function useComputedStatefulRef<S>(
  initialValue: S | (() => S),
  recomputeValue: () => S,
  deps: DependencyList
): readonly [{ readonly current: S }, Dispatch<SetStateAction<S>>]
export function useComputedStatefulRef<S>(
  initialValue: S | (() => S),
  depsOrRecomputeValue: DependencyList | (() => S),
  maybeDeps?: DependencyList
) {
  const [state, setState] = useStatefulRef(initialValue)
  const recomputeValue =
    typeof depsOrRecomputeValue === 'function' ? depsOrRecomputeValue : (initialValue as () => S)
  const deps = maybeDeps || (depsOrRecomputeValue as DependencyList)
  const depsChanged = useWatchValues(deps)
  if (depsChanged) setState(recomputeValue)
  useDebugValue(state.current)
  return [state, setState] as const
}
