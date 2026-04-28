// Stub: withDemoFallback always returns null so real DB queries run
export function withDemoFallback<T>(realHandler: () => T): T | null {
  return null
}
