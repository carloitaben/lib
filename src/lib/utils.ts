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

export function record<T extends string[]>(...values: T) {
  return Object.fromEntries(values.map((value) => [value, value])) as {
    [K in T[number]]: K
  }
}
