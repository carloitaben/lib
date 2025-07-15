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
 * Creates an `AttemptSuccess`.
 */
export function success<Data>(data: Data): AttemptSuccess<Data> {
  return { success: true, data }
}

/**
 * Creates an `AttemptError`.
 */
export function fail<Error>(error: Error): AttemptError<Error> {
  return { success: false, error }
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
 *
 * @example
 * Narrowing the error type
 *
 * ```ts
 * const result = attempt(
 *   () => JSON.parse(data),
 *   (error) => new SyntaxError("Invalid JSON", { cause: error })
 * )
 *
 * if (result.success) {
 *   result.data
 * } else {
 *   result.error
 *   //     ^? SyntaxError
 * }
 * ```
 */
export function attempt<Data, Error = unknown>(
  callback: () => Data,
  onError?: (error?: unknown) => Error
): Attempt<Data, Error> {
  try {
    const data = callback()
    return success(data)
  } catch (error) {
    return onError ? fail(onError(error)) : fail(error as Error)
  }
}

/**
 * Wraps a function in `attempt`.
 *
 * @example
 * ```ts
 * const safeParse = attemptDecorator(JSON.parse)
 * const resultFoo = safeParse("foo")
 * const resultBar = safeParse("bar")
 * ```
 */
export function attemptDecorator<Args extends unknown[], Data, Error = unknown>(
  callback: (...args: Args) => Data,
  onError?: (error?: unknown) => Error
) {
  return function decorator(...args: Args): Attempt<Data, Error> {
    return attempt(() => callback(...args), onError)
  }
}

async function resolveAsync<Data, Error = unknown>(
  maybePromise: Data | Promise<Data>,
  onError?: (error?: unknown) => Error
): Promise<Attempt<Data, Error>> {
  if (maybePromise instanceof Promise) {
    return maybePromise
      .then((data) => resolveAsync<Data, Error>(data))
      .catch((error) => (onError ? fail(onError(error)) : fail<Error>(error)))
  }

  return success(maybePromise)
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
 *
 * @example
 * Narrowing the error type
 * 
 * ```ts
 * const result = await attemptAsync(
 *   async () => JSON.parse(data),
 *   (error) => new SyntaxError("Invalid JSON", { cause: error })
 * )
 *
 * if (result.success) {
 *   result.data
 * } else {
 *   result.error
 *   //     ^? SyntaxError
 * }
 * ```
 */
export function attemptAsync<Data, Error = unknown>(
  callback: () => Promise<Data>,
  onError?: (error?: unknown) => Error
): Promise<Attempt<Data, Error>> {
  return resolveAsync<Data, Error>(callback(), onError)
}

/**
 * Wraps a function in `attemptAsync`.
 *
 * @example
 * ```ts
 * const safeParseAsync = attemptAsyncDecorator(async (data: string) => JSON.parse(data))
 * const resultFoo = await safeParse("foo")
 * const resultBar = await safeParse("bar")
 * ```
 */
export function attemptAsyncDecorator<
  Args extends unknown[],
  Data,
  Error = unknown
>(
  callback: (...args: Args) => Promise<Data>,
  onError?: (error?: unknown) => Error
) {
  return function decorator(...args: Args): Promise<Attempt<Data, Error>> {
    return attemptAsync(() => callback(...args), onError)
  }
}
