import { describe, expect, test } from "vitest"
import { Sequence } from "./sequence"

describe(Sequence.name, () => {
  test("runs in sequence", async () => {
    const array: number[] = []

    await new Sequence()
      .step((context) => {
        array.push(context.index)
      })
      .step((context) => {
        array.push(context.index)
      })
      .step((context) => {
        array.push(context.index)
      })
      .run()

    expect(array).toEqual([0, 1, 2])
  })

  test("skips steps", () => {
    const sequence = new Sequence()
      // (0) Skip this one...
      .step((context) => {
        context.skip()
        throw Error(context.index.toString())
      })
      // (1) ... go to last...
      .step((context) => {
        context.jump(-1)
        throw Error(context.index.toString())
      })
      .step((context) => {
        throw Error(context.index.toString())
      })
      // (3) And finally bail out
      .step((context) => {
        context.stop()
        throw Error(context.index.toString())
      })
      // (2) ... then to the previous one...
      .step((context) => {
        context.back()
        throw Error(context.index.toString())
      })

    expect(async () => await sequence.run()).not.toThrow()
  })

  test("labelled steps", () => {
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

  test("aborts with AbortController", () => {
    const abortController = new AbortController()

    const sequence = new Sequence()
      .step(() => {
        abortController.abort()
      })
      .step(() => {
        throw Error()
      })

    expect(
      async () =>
        await sequence.run({
          signal: abortController.signal,
        })
    ).not.toThrow()
  })
})
