import { describe, expect, test, vi } from "vitest"
import type { AttemptError, AttemptSuccess } from "./attempt"
import { attempt, attemptAsync } from "./attempt"

describe(attempt.name, () => {
  const mock = vi.fn((boom: boolean) => {
    if (Boolean(boom)) {
      throw Error()
    }

    return boom
  })

  test("error", () => {
    const result = attempt(() => mock(true))
    expect(mock).toHaveBeenCalled()
    expect(result.success).toBe(false)
    expect((result as AttemptError).error).toBeInstanceOf(Error)
  })

  test("error narrowing", () => {
    const result = attempt(
      () => mock(true),
      () => new SyntaxError()
    )

    expect((result as AttemptError).error).toBeInstanceOf(SyntaxError)
  })

  test("success", () => {
    const result = attempt(() => mock(false))
    expect(mock).toHaveBeenCalled()
    expect(result.success).toBe(true)
    expect((result as AttemptSuccess<boolean>).data).toBe(false)
  })
})

describe(attemptAsync.name, () => {
  const mock = vi.fn((boom: boolean) => {
    return new Promise<boolean>((resolve) => {
      resolve(
        new Promise<boolean>((resolve, reject) => {
          if (Boolean(boom)) {
            reject(new Error())
          } else {
            resolve(boom)
          }
        })
      )
    })
  })

  test("error", async () => {
    const result = await attemptAsync(() => mock(true))
    expect(result.success).toBe(false)
    expect((result as AttemptError).error).toBeInstanceOf(Error)
  })

  test("error narrowing", async () => {
    const result = await attemptAsync(
      () => mock(true),
      () => new SyntaxError()
    )

    expect((result as AttemptError).error).toBeInstanceOf(SyntaxError)
  })

  test("success", async () => {
    const result = await attemptAsync(() => mock(false))
    expect(result.success).toBe(true)
    expect((result as AttemptSuccess<boolean>).data).toBe(false)
  })
})
