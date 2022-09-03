export function compact<T>(array: Array<T | undefined>): T[] {
  return array.filter((item) => item != null) as T[];
}
