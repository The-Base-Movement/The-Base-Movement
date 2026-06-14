export type RedirectStatusCode = 301 | 302 | 307 | 308

export interface RedirectRule {
  id: string
  sourcePath: string
  destinationPath: string
  statusCode: RedirectStatusCode
  isActive: boolean
  preserveQuery: boolean
  notes: string | null
  createdBy: string | null
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface RedirectRulePayload {
  sourcePath: string
  destinationPath: string
  statusCode: RedirectStatusCode
  isActive: boolean
  preserveQuery: boolean
  notes?: string | null
}
