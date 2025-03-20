// export type AttemptSuccess<Value> = {
//   success: true
//   value: Value
// }

// export type AttemptError = {
//   success: false
//   error: unknown
// }

// export type Attempt<Value> = AttemptSuccess<Value> | AttemptError

// export function isSuccessfulAttempt<Value>(
//   attempt: Attempt<Value>
// ): attempt is AttemptSuccess<Value> {
//   return attempt.success === true
// }

// export function isFailedAttempt<Value>(
//   attempt: Attempt<Value>
// ): attempt is AttemptError {
//   return attempt.success === false
// }

// function attemptPromise<Value>(value: Value | Promise<Value>) {
//   if (value instanceof Promise) {
//     return value
//       .then((value) => attemptPromise(value))
//       .catch((error) => ({
//         success: false,
//         error,
//       }))
//   }

//   return {
//     success: true,
//     value,
//   }
// }

// /**
//  * Attempts to execute a function with the provided arguments.
//  * If the function throws an error, it catches the error and returns it as a value,
//  * similar to the [Errors as Values pattern](https://jessewarden.com/2021/04/errors-as-values.html).
//  *
//  * @example
//  * ```ts
//  * const result = attempt(() => JSON.parse(data))
//  *
//  * if (result.success) {
//  *   result.data
//  * } else {
//  *   result.error
//  * }
//  * ```
//  *
//  * @example
//  * ```ts
//  * const safe = attempt.bind((a: number, b: number) => a + b, 1)
//  * ```
//  */
// export function attempt<Args extends unknown[], Value>(
//   fn: (...args: Args) => Value,
//   ...args: Args
// ): Value extends Promise<unknown>
//   ? Promise<Attempt<Awaited<Value>>>
//   : Attempt<Value> {
//   try {
//     return attemptPromise(fn(...args))
//   } catch (error) {
//     return {
//       success: false,
//       error,
//     } as any
//   }
// }

export function attempt<Args extends [unknown[]], Value>(
  callback: (...args: [Args]) => Value,
  ...args: [...Args]
) {
  try {
    return callback(...args)
  } catch (error) {}
}

const foo = attempt(() => Math.random(), [])
//    ^?

function fn(a: number, b: number) {
  return a + b
}

const bar = attempt.bind(null, fn)
//    ^?
