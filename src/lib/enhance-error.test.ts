import { describe, expect, test, vi } from "vitest"
import { withEnhancedError } from "./enhance-error"

describe(withEnhancedError.name, () => {
  const fn = vi.fn((...args: unknown[]) => {
    void args
    throw Error()
  })

  const enhancedFn = withEnhancedError(fn, "enhancedFn")

  test("calls the wrapped function", () => {
    expect(() => enhancedFn()).toThrow()
    expect(fn).toHaveBeenCalled()
  })

  test("shows the wrapped function name", () => {
    expect(() => enhancedFn()).toThrow(`Function name: enhancedFn`)
  })

  test("shows arguments", () => {
    expect(() => enhancedFn(1, "2")).toThrow(`Function args: [1, "2"]`)
    expect(() => enhancedFn(2n)).toThrow(`Function args: [(unserializable)]`)
    expect(() => enhancedFn(() => {})).toThrow(`Function args: [anonymous()]`)
    expect(() => enhancedFn(1, [setTimeout])).toThrow(
      `Function args: [1, [setTimeout()]]`
    )
    expect(() => enhancedFn({ foo: [() => {}] })).toThrow(
      `Function args: [{"foo":"[anonymous()]"}]`
    )
  })
})
