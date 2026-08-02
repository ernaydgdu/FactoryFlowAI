export function includesQuery(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.trim().toLowerCase())
}

export function filterBySearch<T>(
  rows: T[],
  query: string,
  fields: ((row: T) => string)[],
): T[] {
  if (!query.trim()) return rows
  return rows.filter((row) =>
    fields.some((field) => includesQuery(field(row), query)),
  )
}
