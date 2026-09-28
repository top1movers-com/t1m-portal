export const DEMO_TODAY = '2026-09-29'
export const DUE_SOON_DAYS = 2

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_MS = 86_400_000

export function toDateOnly(iso: string): string {
  return iso.slice(0, 10)
}

function dayNumber(iso: string): number {
  const [y, m, d] = toDateOnly(iso).split('-').map(Number)
  return Date.UTC(y, m - 1, d) / DAY_MS
}

export function addDays(iso: string, days: number): string {
  return new Date((dayNumber(iso) + days) * DAY_MS).toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from)
}

export function daysFromToday(iso: string): number {
  return daysBetween(DEMO_TODAY, iso)
}

export function isOverdue(dueDate: string | undefined, done = false): boolean {
  return !done && !!dueDate && daysFromToday(dueDate) < 0
}

export function isDueSoon(dueDate: string | undefined, done = false): boolean {
  if (done || !dueDate) return false
  const d = daysFromToday(dueDate)
  return d >= 0 && d <= DUE_SOON_DAYS
}

export function nowISO(): string {
  const t = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${DEMO_TODAY}T${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}+08:00`
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = toDateOnly(iso).split('-').map(Number)
  const base = `${MONTHS[m - 1]} ${d}`
  return y === Number(DEMO_TODAY.slice(0, 4)) ? base : `${base}, ${y}`
}

export function formatTime(iso: string): string {
  const time = iso.slice(11, 16)
  if (!time) return ''
  const [h, min] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 === 0 ? 12 : h % 12}:${String(min).padStart(2, '0')} ${suffix}`
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return '—'
  const time = formatTime(iso)
  return time ? `${formatDate(iso)}, ${time}` : formatDate(iso)
}

export function relativeDue(dueDate: string | undefined): string {
  if (!dueDate) return 'No due date'
  const d = daysFromToday(dueDate)
  if (d === 0) return 'Due today'
  if (d === 1) return 'Due tomorrow'
  if (d === -1) return '1 day overdue'
  if (d < 0) return `${-d} days overdue`
  return `Due in ${d} days`
}
