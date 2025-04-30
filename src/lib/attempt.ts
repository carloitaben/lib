export type AttemptSuccess<Data> = {
  success: true
  data: Data
}

export type AttemptError<Error = unknown> = {
  success: false
  error: Error
}

export type Attempt<Data, Error = unknown> =
  | AttemptSuccess<Data>
  | AttemptError<Error>

export type AttemptErrorFn<Error = unknown> = (error: Error) => void

export function isSuccessfulAttempt<Data, Error = unknown>(
  attempt: Attempt<Data, Error>
): attempt is AttemptSuccess<Data> {
  return attempt.success === true
}

export function isFailedAttempt<Data, Error = unknown>(
  attempt: Attempt<Data, Error>
): attempt is AttemptError<Error> {
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
export function attempt<Data, Error = unknown>(
  callback: () => Data
): Attempt<Data, Error> {
  try {
    const data = callback()
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}

async function resolveAsync<Data, Error = unknown>(
  maybePromise: Data | Promise<Data>
): Promise<Attempt<Data, Error>> {
  if (maybePromise instanceof Promise) {
    return maybePromise
      .then((data) => resolveAsync<Data, Error>(data))
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
export function attemptAsync<Data, Error = unknown>(
  callback: () => Promise<Data>
): Promise<Attempt<Data, Error>> {
  return resolveAsync<Data, Error>(callback())
}
