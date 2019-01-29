import {
  lazy,
  ComponentType,
  LazyExoticComponent,
  createContext,
  Dispatch,
  ReactNode,
  useReducer,
  useEffect,
  useContext,
} from 'react'
import produce from 'immer'
import { tuple } from './js-utils'

declare const process: {
  env: {
    NODE_ENV: 'development' | 'test' | 'production'
  }
}

/**
 * Lazy loads a component if it doesn't export a default (unlike `React.lazy`).
 * The lazy loaded component should be inside a `Suspense` boundary
 * @param importCallback callback to import the component
 */
export function lazyLoad<TComponent extends ComponentType<any>>(
  importCallback: () => Promise<TComponent>
) {
  return lazy(async () => {
    const Component = await importCallback()
    return {
      default: Component,
    }
  }) as LazyExoticComponent<TComponent>
}

const defaultOptions = {}
/**
 * Creates a simple store that supports mutations in the update function
 * @param initialState initial state of the store
 * @param options
 * @returns `Provider`: the store provider; `hook`: the hook that returns the store state and the updater function
 */
export function createStore<TState>(
  initialState: TState,
  options: {
    displayName?: string
    onChange?(state: TState): void
  } = defaultOptions
) {
  type TProducer = {
    (currentState: TState): TState | void
  }

  const StateCtx = createContext(initialState)
  const DispatchCtx = createContext<Dispatch<TState | TProducer>>(() => {
    if (process.env.NODE_ENV === 'development') {
      throw new Error('store dispatch called without an enclosing provider.')
    }
  })

  function reducer(state: TState, action: TState | TProducer) {
    return typeof action === 'function' ? (produce(state, action as TProducer) as TState) : action
  }

  function Provider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState)
    useEffect(
      () => {
        options.onChange && options.onChange(state)
      },
      [state]
    )
    return (
      <DispatchCtx.Provider value={dispatch}>
        <StateCtx.Provider value={state}>{children}</StateCtx.Provider>
      </DispatchCtx.Provider>
    )
  }
  if (options.displayName) Provider.displayName = options.displayName

  return {
    Provider,
    hook() {
      return tuple(useContext(StateCtx), useContext(DispatchCtx))
    },
  }
}
