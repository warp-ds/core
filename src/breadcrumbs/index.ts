/**
 * Inject a seperator between each item in a list
 * @param array List of items
 * @param separator Element to be interleaved between each item
 * @returns
 */
export function interleave<T, K>(array: T[], separator: K): (T | K)[] {
  return array.flatMap((el: T) => [el, separator]).slice(0, -1);
}
