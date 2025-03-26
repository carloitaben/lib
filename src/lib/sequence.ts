export type SequenceEventMap = {
  change: {
    index: number
    label?: string
  }
  stop: {
    index: number
    label?: string
  }
}

export type SequenceEvent<Key extends keyof SequenceEventMap> =
  SequenceEventMap[Key]

export type SequenceRunOptions = {
  signal?: AbortSignal
}

export type SequenceStepCallbackContext = {
  /**
   * The currently executing step function index.
   */
  index: number
  /**
   * Interrupts the whole sequence.
   */
  stop(): never
  /**
   * Interrupts the currently executing step function and runs the previous one.
   */
  back(): never
  /**
   * Interrupts the currently executing step function and runs the next one.
   */
  skip(): never
  /**
   * Interrupts the currently executing step function and runs the function at the specified index.
   * Pass `-1` to jump to the last step function.
   */
  jump(to: number): never
  /**
   * Interrupts the currently executing step function and runs the function with the specified label.
   */
  jump(to: string): never
}

export type SequenceStepCallback = (
  context: SequenceStepCallbackContext
) => void | Promise<void>

export class SequenceJumpError extends Error {
  constructor(public to: number | null) {
    super()
    this.name = "SequenceJumpError"
    this.message = "Tried to call jump() outside Sequence scope"
  }
}

export class SequenceStopError extends Error {
  constructor() {
    super()
    this.name = "SequenceStopError"
    this.message = "Tried to call stop() outside Sequence scope"
  }
}

export function isSequenceError(
  error: unknown
): error is SequenceJumpError | SequenceStopError {
  return (
    error instanceof SequenceJumpError || error instanceof SequenceStopError
  )
}

/**
 * Executes functions in order.
 *
 * @example
 * Basic usage
 * ```ts
 * const sequence = new Sequence()
 *   .step(() => console.log(0))
 *   .step(() => console.log(1))
 *   .step(() => console.log(2))
 *
 * await sequence.run()
 * // logs "0"
 * // logs "1"
 * // logs "2"
 * ```
 *
 * @example
 * Using context
 * 
 * Each sequence step receives a `SequenceStepCallbackContext` object
 * with methods for interacting with the sequence execution.
 * 
 * ```ts
 * new Sequence()
 *   .step((context) => {
 *     context.skip()
 *   })
 *   .step((context) => {
 *     context.stop()
 *   })
 * ```
 * 
 * @example
 * Labelling sequence steps
 * 
 * ```ts
 * const sequence = new Sequence()
 *   .step((context) => {
 *     context.jump("end")
 *   })
 *   .step(() => {
 *     // ...
 *   })
 *   .step(() => {
 *     // ...
 *   })
 *   .step("end", () => {
 *     // ...
 *   })
 * ```
 */
export class Sequence {
  constructor() {}

  private steps: Function[] = []

  private stepsLabelIndexMap = new Map<string, number>()

  private async runStep(
    index: number,
    options: SequenceRunOptions
  ): Promise<void> {
    if (options.signal?.aborted) {
      return
    }

    const stepFunction = this.steps[index]

    if (!stepFunction) {
      throw Error(`No step function found at index ${index}.`)
    }

    const next = index + 1 === this.steps.length ? null : index + 1

    const stepContext = {
      index,
      stop: () => {
        throw new SequenceStopError()
      },
      back: () => {
        throw new SequenceJumpError(index - 1)
      },
      skip: () => {
        throw new SequenceJumpError(next)
      },
      jump: (to: number | string) => {
        let index: number | undefined

        if (typeof to === "string") {
          index = this.stepsLabelIndexMap.get(to)

          if (typeof index !== "number") {
            throw Error(`No step function found with label "${to}".`)
          }
        } else if (to === -1) {
          index = this.steps.length - 1
        } else {
          index = to
        }

        throw new SequenceJumpError(index)
      },
    } as SequenceStepCallbackContext

    try {
      await stepFunction(stepContext)
      if (next !== null) await this.runStep(next, options)
    } catch (error) {
      if (error instanceof SequenceStopError) return

      if (error instanceof SequenceJumpError) {
        if (error.to === null) return
        return await this.runStep(error.to, options)
      }

      throw error
    }
  }

  public step(callback: SequenceStepCallback): this

  public step(label: string, callback: SequenceStepCallback): this

  public step(
    callbackOrLabel: SequenceStepCallback | string,
    callback?: SequenceStepCallback
  ) {
    if (typeof callbackOrLabel === "string" && callback) {
      const length = this.steps.push(callback)

      if (this.stepsLabelIndexMap.has(callbackOrLabel)) {
        throw Error(
          `Step function with label "${callbackOrLabel}" already defined.`
        )
      }

      this.stepsLabelIndexMap.set(callbackOrLabel, length - 1)
    } else if (typeof callbackOrLabel === "function") {
      this.steps.push(callbackOrLabel)
    }

    return this
  }

  public async run(options: SequenceRunOptions = {}) {
    await this.runStep(0, options)
  }
}
