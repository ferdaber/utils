export function shallowEquals<T>(objA: unknown, objB: T): objA is T {
  if (Object.is(objA, objB)) {
    return true
  }

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false
  }

  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) {
    return false
  }

  for (let i = 0; i < keysA.length; i++) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, keysA[i]) ||
      !Object.is(objA[keysA[i]], objB[keysA[i]])
    ) {
      return false
    }
  }

  return true
}

export const iss = shallowEquals

export function array<T = any>(length: number, fill?: (idx: number) => T) {
  return fill ? Array.from({ length }, (_, idx) => fill(idx)) : Array(length)
}

export function splice<T>(
  array: ArrayLike<T>,
  start: number,
  deleteCount?: number,
  ...newElements: T[]
) {
  const newArray = Array.from(array)
  if (deleteCount !== undefined) {
    newArray.splice(start, deleteCount, ...newElements)
  } else {
    newArray.splice(start)
  }
  return Array.prototype.splice.call(array, 1, 0)
}

export function head<T>(array: ArrayLike<T>) {
  return array[0]
}

export function tail<T>(array: ArrayLike<T>) {
  return array[array.length - 1]
}

type Truthy<T> = Exclude<NonNullable<T>, false>
export function truthy<T>(array: T[]): Truthy<T>
export function truthy<T, U>(array: T[], map: (val: Truthy<T>, idx: number, array: T[]) => U): U[]
export function truthy<T, U = T>(array: T[], map?: (val: Truthy<T>, idx: number, array: T[]) => U) {
  if (!map) return array.filter(Boolean) as unknown
  return array.reduce<U[]>((acc, val, idx, array) => {
    if (Boolean(val)) {
      acc.push(map(val as Truthy<T>, idx, array))
    }
    return acc
  }, [])
}

export function delay<T = void>(ms: number, value?: T) {
  return new Promise<T>(resolve => window.setTimeout(resolve, ms, value))
}

export function delayRaf<T = void>(value?: T) {
  return new Promise<T>(resolve => window.requestAnimationFrame(() => resolve(value)))
}
