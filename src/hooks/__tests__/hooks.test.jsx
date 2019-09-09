import React, { StrictMode } from 'react'
import { render, cleanup } from '@testing-library/react'
import {
  useTrueMemo,
  useTrueCallback,
  useTimeout,
  useMeasurable,
  useLazyRef,
  useImmediateEffect,
  useWatchValues,
  useAsyncEffect,
  useUpdateEffect,
} from '../index'
import { act } from 'react-dom/test-utils'

beforeEach(cleanup)

test('useUpdateEffect', () => {
  let effectsCount = 0
  const H = ({ deps, includeFirstUpdate }) => {
    useUpdateEffect(
      () => {
        effectsCount++
      },
      deps,
      includeFirstUpdate
    )
    return null
  }
  let { rerender } = render(<H />)
  expect(effectsCount).toBe(0)
  rerender(<H />)
  expect(effectsCount).toBe(1)
  rerender(<H />)
  expect(effectsCount).toBe(2)

  effectsCount = 0
  ;({ rerender } = render(<H deps={[]} />))
  expect(effectsCount).toBe(0)
  rerender(<H deps={[]} />)
  expect(effectsCount).toBe(0)

  effectsCount = 0
  ;({ rerender } = render(<H deps={[]} includeFirstUpdate />))
  expect(effectsCount).toBe(0)
  rerender(<H deps={[]} includeFirstUpdate />)
  expect(effectsCount).toBe(1)
})

test('useAsyncEffect', async () => {
  jest.useFakeTimers()
  const values = []
  const delay = jest.fn(val => new Promise(res => setTimeout(res, 200, val)))
  const H = ({ dep }) => {
    useAsyncEffect(
      async signal => {
        const val = await delay(dep)
        if (signal.aborted) return
        values.push(val)
      },
      [dep]
    )
    return null
  }
  const { rerender } = render(<H dep="a" />)
  expect(values).toHaveLength(0)

  jest.runAllTimers()
  await Promise.resolve()
  expect(values[0]).toBe('a')

  rerender(<H dep="b" />)
  expect(delay).toBeCalledTimes(2)

  rerender(<H dep="c" />)
  expect(delay).toBeCalledTimes(3)

  jest.runAllTimers()
  await Promise.resolve()
  expect(values[1]).toBe('c')
  jest.useRealTimers()
})

test('useWatchValues', () => {
  const values = []
  const H = ({ dep, includeOnMount }) => {
    values.push(useWatchValues([dep], includeOnMount))
    return null
  }
  const W = ({ dep, includeOnMount }) => (
    <StrictMode>
      <H dep={dep} includeOnMount={includeOnMount} />
    </StrictMode>
  )
  const { rerender } = render(<W />)
  expect(values[0]).toBe(false)
  expect(values[1]).toBe(false)

  rerender(<W />)
  expect(values[2]).toBe(false)
  expect(values[3]).toBe(false)

  rerender(<W dep="a" />)
  expect(values[4]).toBe(true)
  expect(values[5]).toBe(true)

  values.splice(0, values.length)
  expect(values).toHaveLength(0)
  render(<W includeOnMount />)
  expect(values[0]).toBe(true)
  expect(values[1]).toBe(true)
})

test('useImmediateEffect', () => {
  let effectsCount = 0,
    cleanupsCount = 0
  const H = ({ dep }) => {
    useImmediateEffect(() => {
      effectsCount++
      return () => {
        cleanupsCount++
      }
    }, [dep])
    return null
  }
  const W = ({ dep }) => (
    <StrictMode>
      <H dep={dep} />
    </StrictMode>
  )
  const { rerender } = render(<W />)
  expect(effectsCount).toBe(2)

  rerender(<W dep="a" />)
  expect(effectsCount).toBe(4)
  expect(cleanupsCount).toBe(2)

  rerender(<W dep="b" />)
  expect(effectsCount).toBe(6)
  expect(cleanupsCount).toBe(4)
})

test('useLazyRef', () => {
  let computes = 0
  const init = () => {
    computes++
    return { value: 'value' }
  }
  const values = []
  const H = () => {
    values.push(useLazyRef(init).current)
    return null
  }

  const { rerender } = render(<H />)
  expect(computes).toBe(1)

  rerender(<H />)
  expect(computes).toBe(1)
  expect(values[0]).toBe(values[1])
  expect(values[0]).toStrictEqual({ value: 'value' })
})

test('useTrueMemo', () => {
  const values = []
  const H = ({ dep }) => {
    values.push(useTrueMemo(() => Object.create(null), [dep]))
    return null
  }

  const { rerender } = render(<H />)
  rerender(<H />)
  expect(values[0]).toBe(values[1])

  rerender(<H dep="a" />)
  expect(values[1]).not.toBe(values[2])

  rerender(<H dep="a" />)
  expect(values[2]).toBe(values[3])

  rerender(<H dep="b" />)
  expect(values[3]).not.toBe(values[4])
})

test('useTrueCallback', () => {
  const values = []
  const H = ({ dep }) => {
    values.push(useTrueCallback(() => {}, [dep]))
    return null
  }

  const { rerender } = render(<H />)
  rerender(<H />)
  expect(values[0]).toBe(values[1])

  rerender(<H dep="a" />)
  expect(values[1]).not.toBe(values[2])

  rerender(<H dep="a" />)
  expect(values[2]).toBe(values[3])

  rerender(<H dep="b" />)
  expect(values[3]).not.toBe(values[4])
})

test('useMeasurable', () => {
  let childRenders = 0
  const values = []
  const rect = {
    left: 1,
    top: 2,
    right: 3,
    bottom: 4,
    height: 2,
    width: 2,
  }
  const el = {
    getBoundingClientRect() {
      return rect
    },
  }
  const C = () => ++childRenders
  const H = ({ useCallback, selector }) => {
    values.push(useMeasurable(useCallback ? () => el : { current: el }, selector))
    return <C />
  }

  const { rerender } = render(<H />)
  expect(values[0][0]).toBe(null)
  expect(values[1][0]).toStrictEqual(el.getBoundingClientRect())
  expect(values[1][0]).toStrictEqual(values[2][0])
  // React will sometimes render again when it bails out of a state update
  // but will not rerender children of the owner of the state
  expect(values).toHaveLength(3)
  expect(childRenders).toBe(2)

  act(() => {
    rect.bottom = 5
    window.dispatchEvent(new Event('resize', { bubbles: true }))
  })
  expect(values[2][0]).not.toStrictEqual(values[3][0])

  rerender(<H useCallback />)
  expect(values[5][0]).toStrictEqual(rect)
  expect(values).toHaveLength(6)

  rerender(<H selector={() => 'a'} />)
  expect(values[7][0]).toBe('a')
})

test('useTimeout', () => {
  jest.useFakeTimers()
  const values = []
  const H = ({ dep, ms = 100 }) => {
    values.push(useTimeout(ms, [dep]))
    return null
  }

  const { rerender } = render(<H />)
  rerender(<H />)
  expect(values[0]).toBe(false)
  expect(values[0]).toBe(values[1])

  act(() => {
    jest.runAllTimers()
  })
  expect(values[2]).toBe(true)

  rerender(<H dep="a" />)
  expect(values[3]).toBe(false)
  jest.useRealTimers()
})
