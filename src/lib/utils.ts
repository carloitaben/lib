/**
 * A type guard that ensures the given value is a key of the given object.
 *
 * @example
 * Basic usage
 *
 * ```ts
 * const object = {
 *   foo: "foo",
 *   bar: "bar",
 * }
 *
 * function fn(maybeKey: string) {
 *   if (isKeyOf(object, maybeKey)) {
 *     maybeKey
 *     // ^? "foo" | "bar"
 *   }
 * }
 * ```
 */
export function isKeyOf<T extends Record<PropertyKey, unknown>>(
  object: T,
  value: unknown,
): value is keyof T {
  switch (typeof value) {
    case "string":
    case "number":
    case "symbol":
      return value in object
    default:
      return false
  }
}

/**
 * Creates an object where each key is a value from the provided arguments,
 * and each value is the same as the key.
 *
 * This can be useful for creating a mapping of string constants to themselves.
 *
 * @example
 * Basic usage
 *
 * ```ts
 * const colors = record("red", "green", "blue")
 *
 * console.log(colors.red)   // "red"
 * console.log(colors.green) // "green"
 * console.log(colors.blue)  // "blue"
 * ```
 *
 * @example
 * Type safety
 *
 * ```ts
 * const directions = record("up", "down", "left", "right")
 *
 * function move(direction: keyof typeof directions) {
 *   console.log(`Moving ${direction}`)
 * }
 *
 * move(directions.up)    // Valid
 * move(directions.down)  // Valid
 * move("forward")        // Error
 * ```
 */
export function record<T extends string[]>(...values: T) {
  return Object.fromEntries(values.map((value) => [value, value])) as {
    [K in T[number]]: K
  }
}

export type EnsureOptions<K, V> = {
  key: K
  set: (key: K) => V
}

export function ensure<K, V>(
  map: Map<K, V>,
  { key, set }: EnsureOptions<K, V>,
): V

export function ensure<K extends WeakKey, V>(
  weakMap: WeakMap<K, V>,
  { key, set }: EnsureOptions<K, V>,
): V

export function ensure(
  map: Map<unknown, unknown> | WeakMap<WeakKey, unknown>,
  { key, set }: EnsureOptions<any, unknown>,
) {
  return map.has(key) ? map.get(key) : map.set(key, set(key)).get(key)
}

export type MemoOptions = {
  lru?: number
  ttl?: number
}

export function memo<T extends unknown[], U>(
  fn: (...args: T) => U,
  { lru = Infinity, ttl = Infinity }: MemoOptions,
) {
  const cache = new Map<string, U>()
  return (...args: T) =>
    ensure(cache, {
      key: JSON.stringify(args),
      set: () => fn(...args),
    })
}

export function share<T extends unknown[], U>(fn: (...args: T) => Promise<U>) {
  let flight: U | undefined = undefined
  return async (...args: T) => {
    if (!flight) {
      flight = await fn(...args).finally(() => (flight = undefined))
    }
    return flight
  }
}

export function once<T extends unknown[], U>(fn: (...args: T) => U) {
  let ran = false
  let value: U
  return (...args: T) => {
    if (!ran) {
      ran = true
      value = fn(...args)
    }
    return value
  }
}

export function lazy<T>(fn: () => T) {
  return once(fn.bind(null))
}

export function tap<T>(effect: (value: T) => void) {
  return (value: T) => {
    effect(value)
    return value
  }
}
