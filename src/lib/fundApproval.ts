/**
 * @file fundApproval.ts
 * @description Pure engine logic for fund approval chains.
 * Encapsulates limits and roles rules:
 *   Bottom → Finance Officer  (GHS 0 – tier1Max)
 *   Middle → Executives       (GHS tier1Max+1 – tier2Max)
 *   Top    → Founder / Appointed Executives (unlimited)
 */

/** Approval tier names */
export type ApprovalTierName = 'Bottom' | 'Middle' | 'Top'
/** Action attempts allowed in approval chain */
export type ApprovalAction = 'Approve' | 'Deny' | 'Acknowledge'

/** Possible decision outcomes produced by approval validator */
export type ApprovalOutcome =
  | 'PROCESSED_BOTTOM'
  | 'PROCESSED_MIDDLE'
  | 'PROCESSED_TOP'
  | 'PASS_UP'
  | 'ERROR_NOT_QUALIFIED'
  | 'ERROR_NEEDS_TOP'
  | 'ERROR_INVALID'

/**
 * Result structure returned by the approval chain rule engine
 */
export interface ApprovalResult {
  /** The decision outcome code */
  outcome: ApprovalOutcome
  /** Accompanying status message */
  message: string
}

/**
 * processFundRequest — pure approval-chain rule engine.
 *
 * @param tier      Which tier is acting ('Bottom' | 'Middle' | 'Top')
 * @param amount    Request amount in GHS
 * @param action    The action being attempted ('Approve' | 'Deny' | 'Acknowledge')
 * @param tier1Max  Maximum GHS a Bottom-tier officer may approve/deny (default 50)
 * @param tier2Max  Maximum GHS a Middle-tier executive may approve/deny (default 100)
 * @returns ApprovalResult containing outcome flag and validation explanation message.
 */
export function processFundRequest(
  tier: ApprovalTierName,
  amount: number,
  action: ApprovalAction,
  tier1Max = 50,
  tier2Max = 100
): ApprovalResult {
  // BOTTOM TIER LOGIC (Finance Officer)
  if (tier === 'Bottom') {
    if (amount >= 0 && amount <= tier1Max && (action === 'Approve' || action === 'Deny')) {
      return { outcome: 'PROCESSED_BOTTOM', message: 'Processed at bottom tier' }
    } else if (amount > tier1Max && action === 'Approve') {
      return {
        outcome: 'ERROR_NOT_QUALIFIED',
        message: 'Error: You are not qualified to perform this action',
      }
    } else if (amount > tier1Max && action === 'Acknowledge') {
      return { outcome: 'PASS_UP', message: 'Pass to the next level' }
    }
  }

  // MIDDLE TIER LOGIC (Executives)
  else if (tier === 'Middle') {
    if (
      amount >= tier1Max + 1 &&
      amount <= tier2Max &&
      (action === 'Approve' || action === 'Deny')
    ) {
      return { outcome: 'PROCESSED_MIDDLE', message: 'Processed at middle tier' }
    } else if (amount >= tier1Max + 1 && amount <= tier2Max && action === 'Acknowledge') {
      return { outcome: 'PASS_UP', message: 'Pass to the next level' }
    } else if (amount > tier2Max && action === 'Acknowledge') {
      return { outcome: 'PASS_UP', message: 'Pass to the next level' }
    } else if (amount > tier2Max && action === 'Approve') {
      return {
        outcome: 'ERROR_NEEDS_TOP',
        message: 'Error: You require top level approval as well',
      }
    }
  }

  // TOP TIER LOGIC (Founder / Appointed Executives)
  else if (tier === 'Top') {
    if (amount >= 0 && (action === 'Approve' || action === 'Deny')) {
      return { outcome: 'PROCESSED_TOP', message: 'Processed at top tier (No Limit)' }
    }
  }

  return { outcome: 'ERROR_INVALID', message: 'Error: Invalid request' }
}

/**
 * Maps a numeric approval tier (1, 2, or 3) to the named tier used by the rule engine.
 *
 * @param n - Approval tier index code
 * @returns Named ApprovalTierName
 */
export function tierNameFromNumber(n: number): ApprovalTierName {
  if (n === 1) return 'Bottom'
  if (n === 2) return 'Middle'
  return 'Top'
}

/**
 * Determines whether the outcome represents a successful/permitted step.
 *
 * @param outcome - The computed ApprovalOutcome
 * @returns Boolean flag indicating if transaction is allowed.
 */
export function isPermitted(outcome: ApprovalOutcome): boolean {
  return (
    outcome === 'PROCESSED_BOTTOM' ||
    outcome === 'PROCESSED_MIDDLE' ||
    outcome === 'PROCESSED_TOP' ||
    outcome === 'PASS_UP'
  )
}

/**
 * Determines whether the outcome requires passing the fund request up to a higher tier.
 *
 * @param outcome - The computed ApprovalOutcome
 * @returns Boolean flag indicating pass-up requirement.
 */
export function isPassUp(outcome: ApprovalOutcome): boolean {
  return outcome === 'PASS_UP'
}
