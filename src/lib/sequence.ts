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

export type SequenceStepCallbackContext<Context extends unknown = never> = {
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
} & (Context extends never
  ? {
      context?: never
    }
  : {
      context: Context
    })

export type SequenceStepCallback<Context extends unknown = never> = (
  context: SequenceStepCallbackContext<Context>
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

/**
 * TODO: document
 */
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
 * ```ts
 * const sequence = new Sequence()
 *   .step(() => console.log(0))
 *   .step(() => console.log(1))
 *   .step(() => console.log(2))
 *
 * await sequence.run()
 * ```
 *
 * Each sequence callback receives a `SequenceStepCallbackContext<Context>` object
 * with methods for interacting with the sequence execution.
 *
 * @example
 * Skipping steps
 *
 *
 */
export class Sequence<Context extends unknown = never> {
  private steps: Function[] = []
  private stepsLabelIndexMap = new Map<string, number>()

  /**
   * TODO: document overload without context
   */
  constructor(context?: never)

  /**
   * TODO: document overload with context
   */
  constructor(context: Context)

  constructor(private context: Context) {}

  private async runStep(index: number, context: Context): Promise<void> {
    const stepFunction = this.steps[index]

    if (!stepFunction) {
      throw Error(`No step function found at index ${index}.`)
    }

    const next = index + 1 === this.steps.length ? null : index + 1

    const stepContext = {
      index,
      context,
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
    } as SequenceStepCallbackContext<Context>

    try {
      await stepFunction(stepContext)
      if (next !== null) await this.runStep(next, context)
    } catch (error) {
      if (error instanceof SequenceStopError) return

      if (error instanceof SequenceJumpError) {
        if (error.to === null) return
        return await this.runStep(error.to, context)
      }

      throw error
    }
  }

  /**
   * TODO: document
   */
  public step(callback: SequenceStepCallback<Context>): this

  /**
   * TODO: document
   */
  public step(label: string, callback: SequenceStepCallback<Context>): this

  public step(
    callbackOrLabel: SequenceStepCallback<Context> | string,
    callback?: SequenceStepCallback<Context>
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

  /**
   * TODO: abort with AbortController
   */
  public async run(
    options: {
      context?: Context
      signal?: AbortSignal
    } = {}
  ) {
    const context = options.context ?? this.context
    await this.runStep(0, context)
    return context as Context extends never ? void : Context
  }
}
