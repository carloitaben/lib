import { attempt } from "./attempt"

export function withEnhancedError<Args extends unknown[], Result>(
  fn: (...args: Args) => Result
) {
  let name = fn.name

  function enhanced(...args: Args) {
    try {
      return fn(...args)
    } catch (error) {
      if (error instanceof Error) {
        error.message =
          error.message +
          "\n\n" +
          `  - Function name: ${name}${
            fn.name === name ? "(inherited)" : ""
          }\n` +
          `  - Function args: ${JSON.stringify(args)}`
      }

      throw error
    }
  }

  return Object.assign(enhanced, {
    get displayName() {
      return name
    },
    set displayName(displayName: string) {
      name = displayName
    },
  })
}
