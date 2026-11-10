export function normalizeTaskTitle(value) {
  if (typeof value !== 'string') {
    throw new TypeError('normalizeTaskTitle expects a string primitive');
  }
  return value.trim().replace(/\s+/g, ' ');
}
