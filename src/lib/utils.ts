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
