import { describe, expect, test, vi } from "vitest"
import { Trace, Tracer } from "./tracer"

describe(Tracer.name, () => {
  const mock = vi.fn()

  function boom(explode: boolean) {
    if (explode) {
      throw Error()
    }

    return explode
  }

  const tracer = new Tracer<string[]>({
    catch: mock,
  })

  test("errors", () => {})

  test("bind", () => {
    const bounded = tracer.bind(boom)
    expect(bounded).toBeInstanceOf(Function)
    expect(bounded(["foo"], false)).toBe(false)
    expect(() => bounded(["foo"], true)).toThrowError(Trace)
  })

  test("context", () => {
    const bounded = tracer.context(["foo"], tracer.bind(boom))
    expect(bounded).toBeInstanceOf(Function)
    expect(bounded(false)).toBe(false)
  })

  test("accumulate errors", () => {
    const bounded = tracer.bind(boom)
    expect(() =>
      tracer.call(["foo"], () => bounded(["bar"], true))
    ).toThrowError(Trace)
    expect(mock).toHaveBeenCalledOnce()
  })
})
