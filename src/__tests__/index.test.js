import { tuple } from '../index'

it('creates a tuple', () => {
  expect(tuple(0, 'a', true)).toEqual([0, 'a', true])
})
