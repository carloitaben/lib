export type AttemptSuccess<Value> = {
  success: true
  value: Value
}

export type AttemptError = {
  success: false
  error: unknown
}

export type Attempt<Value> = AttemptSuccess<Value> | AttemptError

export function isSuccessfulAttempt<Value>(
  attempt: Attempt<Value>
): attempt is AttemptSuccess<Value> {
  return attempt.success === true
}

export function isFailedAttempt<Value>(
  attempt: Attempt<Value>
): attempt is AttemptError {
  return attempt.success === false
}

/**
 * Attempts to execute a function with the provided arguments.
 * If the function throws an error, it catches the error and returns it as a value,
 * similar to the [Errors as Values pattern](https://jessewarden.com/2021/04/errors-as-values.html).
 *
 * @example
 * ```ts
 * const result = attempt(() => JSON.parse(data))
 *
 * if (result.success) {
 *   result.data
 * } else {
 *   result.error
 * }
 * ```
 */
function resolve<Value>(value: Value): unknown {
  if (value instanceof Promise) {
    return value
      .then((value) => resolve(value))
      .catch((error) => ({
        success: false,
        error,
      }))
  }

  return {
    success: true,
    value,
  }
}

export function attempt<Result>(
  callback: () => Result
): Result extends Promise<infer V> ? Promise<Attempt<V>> : Attempt<Result> {
  try {
    return resolve(callback()) as any
  } catch (error) {
    return {
      success: false,
      error,
    } as any
  }
}
