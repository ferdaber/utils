/**
 * Helper method to automatically create a tuple type without manual assertion
 * @param elements elements in the tuple
 */
export function tuple<TElements extends any[]>(...elements: TElements) {
  return elements
}

/**
 * Maps over an object's keys and returns another object with `mapFn`
 * applied to each property
 */
export function map<T extends Record<string, any>, U>(
  obj: T,
  mapFn: (value: T[keyof T], key: keyof T) => U
) {
  return Object.keys(obj).reduce(
    (acc, key: keyof T) => ({
      ...acc,
      [key]: mapFn(obj[key], key),
    }),
    {} as Record<keyof T, U>
  )
}

/**
 * A promisified `setTimeout`
 * @param ms `setTimeout` duration
 */
export function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

/**
 * A promisified `requestAnimationFrame`
 */
export function delayRaf() {
  return new Promise<number>(resolve => requestAnimationFrame(resolve))
}
