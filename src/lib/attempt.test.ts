import { describe, expect, expectTypeOf, test, vi } from "vitest"
import type { AttemptError, AttemptSuccess } from "./attempt"
import { attempt } from "./attempt"

describe(attempt.name, () => {
  const mock = vi.fn((boom: boolean) => {
    if (Boolean(boom)) {
      throw Error()
    }

    return boom
  })

  const mockAsync = vi.fn((boom: boolean) => {
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

  test("sync error", () => {
    const result = attempt(() => mock(true))
    expect(mock).toHaveBeenCalled()
    expect(result.success).toBe(false)
    expect((result as AttemptError).error).toBeInstanceOf(Error)
  })

  test("sync success", () => {
    const result = attempt(() => mock(false))
    expect(mock).toHaveBeenCalled()
    expect(result.success).toBe(true)
    expect((result as AttemptSuccess<boolean>).data).toBe(true)
  })

  test("async error", async () => {
    const result = await attempt(() => mockAsync(true))
    expect(result.success).toBe(false)
    expect((result as AttemptError).error).toBeInstanceOf(Error)
  })

  test("async success", async () => {
    const result = await attempt(() => mockAsync(false))
    expect(result.success).toBe(true)
    expect((result as AttemptSuccess<boolean>).data).toBe(true)
  })
})
