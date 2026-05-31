export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

export function formatShort(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit',
  })
}

export function sortByDate<T extends { date: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => a.date.localeCompare(b.date))
}
