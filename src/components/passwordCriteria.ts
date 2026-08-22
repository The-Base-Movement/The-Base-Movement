export interface PasswordCriteria {
  hasMinLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSymbol: boolean
}

export function evaluatePassword(password: string): PasswordCriteria {
  return {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  }
}

export function isPasswordValid(password: string): boolean {
  const c = evaluatePassword(password)
  return c.hasMinLength && c.hasUppercase && c.hasLowercase && c.hasNumber && c.hasSymbol
}
