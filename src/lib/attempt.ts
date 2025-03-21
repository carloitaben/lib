export type AttemptSuccess<Data> = {
  success: true
  data: Data
}

export type AttemptError = {
  success: false
  error: unknown
}

export type Attempt<Data> = AttemptSuccess<Data> | AttemptError

export function isSuccessfulAttempt<Data>(
  attempt: Attempt<Data>
): attempt is AttemptSuccess<Data> {
  return attempt.success === true
}

export function isFailedAttempt<Data>(
  attempt: Attempt<Data>
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
function resolve<Data>(data: Data): unknown {
  if (data instanceof Promise) {
    return data
      .then((value) => resolve(value))
      .catch(
        (error) =>
          ({
            success: false,
            error,
          } satisfies AttemptError)
      )
  }

  return {
    success: true,
    data,
  } satisfies AttemptSuccess<Data>
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
