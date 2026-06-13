export function formatAgendaNumber(number: string) {
  return String(Number.parseInt(number, 10) || number)
}
