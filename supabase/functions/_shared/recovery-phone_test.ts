import { isGhanaRecoveryPhone } from './recovery-phone.ts'

Deno.test('recognizes Ghana E.164 numbers only', () => {
  if (!isGhanaRecoveryPhone('+233541234567')) throw new Error('Ghana number was not recognized')
  if (isGhanaRecoveryPhone('+32467814742')) throw new Error('International number was misrouted')
})
