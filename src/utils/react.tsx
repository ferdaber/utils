import React, {
  lazy,
  ComponentType,
  LazyExoticComponent,
  createContext,
  Dispatch,
  ReactNode,
  useReducer,
  useContext,
  useLayoutEffect,
} from 'react'
import produce from 'immer'

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

/**
 * Creates a simple store that supports mutations in the update function
 * @param initialState initial state of the store
 * @param options
 * @returns `Provider`: the store provider; `hook`: the hook that returns the store state and the updater function
 */
export function createStore<TState>(initialState: TState, storeName?: string) {
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
    return (
      <DispatchCtx.Provider value={dispatch}>
        <StateCtx.Provider value={state}>{children}</StateCtx.Provider>
      </DispatchCtx.Provider>
    )
  }
  if (storeName) Provider.displayName = storeName

  return {
    Provider,
    useStore() {
      return [useContext(StateCtx), useContext(DispatchCtx)] as const
    },
    useDispatch() {
      return useContext(DispatchCtx)
    },
  }
}

export function StylePortal(props: { children: Element | null | undefined; className?: string }) {
  const { children, className } = props
  useLayoutEffect(() => {
    if (!children || !className) return
    children.classList.add(className)
    return () => {
      children.classList.remove(className)
    }
  }, [children, className])
  return (null as unknown) as JSX.Element
}
