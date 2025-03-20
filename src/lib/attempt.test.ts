import { describe, expect, test, vi } from "vitest"
import type { AttemptError, AttemptSuccess } from "./attempt"
import { attempt } from "./attempt"

describe(attempt.name, () => {
  function mock(a: number, b: number) {
    if (!a && !b) {
      throw Error()
    }

    return a + b
  }

  function asyncMock(a: number, b: number) {
    return new Promise<number>((resolve) => {
      resolve(
        new Promise<number>((resolve, reject) => {
          if (!a && !b) {
            reject(new Error())
          } else {
            resolve(a + b)
          }
        })
      )
    })
  }

  test("sync error", () => {
    const result = attempt(() => mock(0, 0))
    expect(result.success).toBe(false)
    expect((result as AttemptError).error).toBeInstanceOf(Error)
  })

  test("sync success", () => {
    const result = attempt(() => mock(1, 1))
    expect(result.success).toBe(true)
    expect((result as AttemptSuccess<number>).value).toBe(2)
  })

  test("async error", async () => {
    const result = await attempt(() => asyncMock(0, 0))
    expect(result.success).toBe(false)
    expect((result as AttemptError).error).toBeInstanceOf(Error)
  })

  test("async success", async () => {
    const result = await attempt(() => asyncMock(1, 1))
    expect(result.success).toBe(true)
    expect((result as AttemptSuccess<number>).value).toBe(2)
  })
})
