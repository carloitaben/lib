import { merge } from "ts-deepmerge"
import { attempt } from "./attempt"

export class Trace<Context> {
  constructor(
    public error: unknown,
    public context: Context,
    public fn: { displayName: string; name: string; args: unknown[] }
  ) {}
}

export class Tracer<Context> {
  constructor(
    private options: {
      catch: (trace: Trace<Context>) => void | Promise<void>
    }
  ) {}

  public bind<Args extends unknown[], Result>(fn: (...args: Args) => Result) {
    let displayName = fn.name

    function binder(context: Context, ...args: Args) {
      try {
        return fn(...args)
      } catch (error) {
        if (error instanceof Trace) {
          throw new Trace(error.error, merge(error.context, context), {
            args,
            displayName,
            name: fn.name,
          })
        }

        throw new Trace(error, context, {
          args,
          displayName,
          name: fn.name,
        })
      }
    }

    return Object.assign(binder, {
      get displayName() {
        return displayName
      },
      set displayName(displayName: string) {
        if (displayName !== fn.name) {
          throw Error(
            "cannot rename function more that once to prevent weird traces"
          )
        }

        displayName = displayName
      },
    })
  }

  public context<Args extends unknown[], Result>(
    context: Context,
    fn: (...args: [Context, ...Args]) => Result
  ) {
    const bounded = this.bind(fn)
    return (...args: Args) => bounded(context, ...args)
  }

  public call<Args extends unknown[], Result>(
    context: Context,
    fn: (...args: Args) => Result,
    ...args: Args
  ) {
    try {
      return this.bind(fn)(context, ...args)
    } catch (error) {
      const trace =
        error instanceof Trace
          ? error
          : new Trace(error, context, {
              args,
              displayName: "Tracer call function",
              name: "Tracer call function",
            })

      this.options.catch(trace)
      throw trace.context.error
    }
  }
}
