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
 * Attempts to synchronously execute a function.
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
export function attempt<Result>(callback: () => Result): Attempt<Result> {
  try {
    const data = callback()
    return { success: true, data }
  } catch (error) {
    return { success: false, error }
  }
}

async function resolveAsync<Result>(
  maybePromise: Result | Promise<Result>
): Promise<Attempt<Result>> {
  if (maybePromise instanceof Promise) {
    return maybePromise
      .then(resolveAsync)
      .catch((error) => ({ success: false, error }))
  }

  return {
    success: true,
    data: maybePromise,
  }
}

/**
 * Attempts to asynchronously execute a function.
 * If the function throws an error, it catches the error and returns it as a value,
 * similar to the [Errors as Values pattern](https://jessewarden.com/2021/04/errors-as-values.html).
 *
 * @example
 * ```ts
 * const result = await attemptAsync(async () => JSON.parse(data))
 *
 * if (result.success) {
 *   result.data
 * } else {
 *   result.error
 * }
 * ```
 */
export function attemptAsync<Result>(
  callback: () => Promise<Result>
): Promise<Attempt<Result>> {
  return resolveAsync(callback())
}
