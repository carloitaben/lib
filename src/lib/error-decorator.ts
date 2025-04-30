import { attempt } from "./attempt"

function stringify(value: unknown): string {
  if (typeof value === "function") {
    return `${value.name || "anonymous"}()`
  }

  if (typeof value === "object") {
    if (value === null) {
      return "null"
    }

    if (Array.isArray(value)) {
      return `[${value.map((value) => stringify(value)).join(", ")}]`
    }

    return JSON.stringify(
      Object.fromEntries(
        Object.entries(value).map(([key, value]) => [key, stringify(value)])
      )
    )
  }

  const result = attempt(() => JSON.stringify(value))

  return result.success ? result.data : "(unserializable)"
}

export function errorDecorator<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  displayName: string
) {
  return function enhanced(...args: Args) {
    try {
      return fn(...args)
    } catch (error) {
      if (error instanceof Error) {
        error.message =
          error.message +
          "\n\n" +
          `  - Function name: ${displayName}\n` +
          `  - Function args: ${stringify(args)}`
      }

      throw error
    }
  }
}
