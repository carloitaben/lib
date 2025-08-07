import { describe, expect, test } from "vitest"
import { isKeyOf, record } from "./utils"

describe(isKeyOf, () => {
  const symbol = Symbol()

  const object = {
    foo: "string",
    123: "number",
    [symbol]: "symbol",
  }

  test("works with primitives", () => {
    expect(isKeyOf(object, "foo")).toBe(true)
    expect(isKeyOf(object, 123)).toBe(true)
    expect(isKeyOf(object, symbol)).toBe(true)
    expect(isKeyOf(object, "invalid")).toBe(false)
  })
})

describe(record, () => {
  test("creates a record of strings", () => {
    expect(record("bar").bar).toBe("bar")
  })
})
