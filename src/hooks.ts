import {
  useEffect,
  RefObject,
  useState,
  useRef,
  useCallback,
  DependencyList,
  Dispatch,
  SetStateAction,
  useLayoutEffect,
  MutableRefObject,
  useDebugValue,
} from 'react'
import { iss } from './js-utils'

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

/**
 * Returns a callback that can be called to force a rerender.
 */
export function useRerender() {
  const [, setFlag] = useState(false)
  return useRef(() => setFlag(flag => !flag)).current
}

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

/**
 * Watches a list of values and returns whether or not those values have changed since the
 * last time React has rendered the component. This hook is safe for Concurrent mode and will
 * return the same value on partial rerenders.
 * @param values The list of values to watch
 * @param includeOnMount If `true` then this hook will track the first time the component renders
 * and return `true`, otherwise it will be `false`.
 */
export function useWatchValues(values: DependencyList, includeOnMount?: boolean) {
  const prevValues = useRef(includeOnMount ? undefined : values)
  useDebugValue(prevValues.current)
  const changed =
    !values ||
    !prevValues.current ||
    prevValues.current.length !== values.length ||
    prevValues.current.some((prevDep, i) => !Object.is(prevDep, values[i]))
  useEffect(() => {
    if (changed) {
      prevValues.current = values
    }
  })
  return changed
}

const noop = () => {}
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

/**
 * A useRef wrapper that allows lazy initialization of its value
 */
export function useLazyRef<S>(init: S | (() => S)): MutableRefObject<S>
export function useLazyRef<S = undefined>(): MutableRefObject<S | undefined>
export function useLazyRef<S>(init?: S | (() => S)) {
  const [nakedValue] = useState<S | undefined>(init)
  const value = useRef(nakedValue)
  useDebugValue(value.current)
  return value
}

/**
 * A useMemo wrapper that is semantically *guaranteed* to return the same value
 * as long as dependencies don't change
 */
export function useTrueMemo<T>(init: () => T, deps: DependencyList) {
  const value = useLazyRef(init)
  let nextValue = value.current
  useImmediateEffect(() => {
    nextValue = init()
  }, deps)
  useDebugValue(nextValue)
  useUpdateEffect(() => {
    value.current = nextValue
  }, [nextValue])
  return nextValue
}

/**
 * A useCallback wrapper that is semantically *guaranteed* to return the same value
 * as long as dependencies don't change
 */
export function useTrueCallback<T extends (...args: any[]) => any>(cb: T, deps: DependencyList) {
  const value = useTrueMemo(() => cb, deps)
  useDebugValue(value)
  return value
}

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

// all properties in ClientRect are computed so they can't be destructured, wahhh
function normalizeRect(rect: ClientRect) {
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    height: rect.height,
    width: rect.width,
  } as const
}
export type Measurable = Pick<Element, 'getBoundingClientRect'>
/**
 * Allows retrieving measurements of an element efficiently. Measurements are taken
 * with every update of the element and window resizes, and can be triggered manually
 * in case updates only occur deeper in the tree that doesn't trigger an update at this level
 * @param getMeasurable callback or a ref object to retrieve the measureable object
 */
export function useMeasurable<T = ReturnType<typeof normalizeRect>>(
  getMeasurable: RefObject<Measurable> | (() => Measurable | null),
  selector?: (rect: ClientRect) => T
): readonly [T | null, () => void]
export function useMeasurable(
  getMeasurable: RefObject<Measurable> | (() => Measurable | null),
  selector?: (rect: ClientRect) => any
) {
  const [measurements, setMeasurements] = useState<ClientRect | null>(null)
  const ref = useRef<Measurable>()
  const measure = useCallback(() => {
    if (!ref.current) return
    const rect = normalizeRect(ref.current.getBoundingClientRect())
    setMeasurements(state => {
      const nextState = selector ? selector(rect) : rect
      if (!state) return selector ? selector(rect) : rect
      return iss(state, nextState) ? state : nextState
    })
  }, [selector])

  useLayoutEffect(() => {
    if ('current' in getMeasurable) {
      ref.current = getMeasurable.current || undefined
    } else {
      ref.current = getMeasurable() || undefined
    }
    if (ref.current) {
      measure()
    }
  })

  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
    }
  }, [measure])
  useDebugValue(measurements)
  return [measurements, measure] as const
}

/**
 * Runs a timer and returns whether or not that timer is expired.
 * Useful to suspend rendering of a component as it awaits some API return value
 * @param timeoutMs timeout in milliseconds
 * @param deps optional inputs, the timeout will be reset if the inputs array changed, if no inputs are passed in then the timeout is only run once
 * @returns whether the timeout has expired
 */
export function useTimeout(timeoutMs: number, deps: DependencyList = []) {
  const [expired, setExpired] = useComputedStatefulRef(() => false, [timeoutMs, ...deps])
  useEffect(() => {
    const id = window.setTimeout(setExpired, timeoutMs, true)
    return () => {
      window.clearTimeout(id)
    }
  }, [timeoutMs, ...deps])
  useDebugValue(expired.current)
  return expired.current
}
