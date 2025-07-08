/**
 * A type guard that ensures a given array has at least one member.
 *
 * @example
 * Basic usage
 *
 * ```ts
 * const array = ["foo"]
 *
 * if (isNonEmptyArray(array)) {
 *   array[0]
 *   // ^? string
 * }
 * ```
 */
export function isNonEmptyArray<T>(array: T[]): array is [T, ...T[]] {
  return Boolean(array.length)
}

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type ValueOf<T> = T[keyof T]

export type Suggest<Suggestion extends string> = Suggestion | (string & {})

export type Require<T, K extends keyof T> = T & { [P in K]-?: T[P] }
