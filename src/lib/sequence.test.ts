import { describe, expect, test } from "vitest"
import { Sequence } from "./sequence"

describe(Sequence.name, () => {
  test("runs step functions in sequence", async () => {
    let value = 0

    await new Sequence()
      .step(() => {
        value++
      })
      .step(() => {
        value++
      })
      .step(() => {
        value++
      })
      .run()

    expect(value).toBe(3)
  })

  test("skips step functions", () => {
    const sequence = new Sequence()
      // Skip this one...
      .step((context) => {
        context.skip()
        throw Error(context.index.toString())
      })
      // ... go to last...
      .step((context) => {
        context.jump(-1)
        throw Error(context.index.toString())
      })
      .step((context) => {
        throw Error(context.index.toString())
      })
      // And finally bail out
      .step((context) => {
        context.stop()
        throw Error(context.index.toString())
      })
      // ... then to the previous one...
      .step((context) => {
        context.back()
        throw Error(context.index.toString())
      })

    expect(async () => await sequence.run()).not.toThrow()
  })

  test("allows labelling step functions", () => {
    const sequence = new Sequence()
      .step("start", (context) => {
        context.jump("stop")
        throw Error(context.index.toString())
      })
      .step("throws", (context) => {
        throw Error(context.index.toString())
      })
      .step("stop", (context) => {
        context.stop()
        throw Error(context.index.toString())
      })

    expect(async () => await sequence.run()).not.toThrow()
  })

  test("allows passing mutable context", async () => {
    const context = {
      current: 0,
    }

    const result = await new Sequence(context)
      .step(({ context, index }) => {
        context.current = index
      })
      .step(({ context, index }) => {
        context.current = index
      })
      .step(({ context, index }) => {
        context.current = index
      })
      .run()

    expect(result).toBe(context)
    expect(result.current).toBe(2)
  })
})
