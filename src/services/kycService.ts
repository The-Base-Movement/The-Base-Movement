import { supabase } from '@/lib/supabase'

export type KycStatus = 'not_uploaded' | 'uploaded' | 'pending_verification' | 'verified' | 'failed'
export type KycDocKind = 'front' | 'back' | 'selfie'

export interface MemberKyc {
  userId: string
  ghanaCardFrontPath: string | null
  ghanaCardBackPath: string | null
  selfiePath: string | null
  status: KycStatus
  verifiedAt: string | null
}

const BUCKET = 'member-kyc'

const COLUMN: Record<KycDocKind, 'ghana_card_front_path' | 'ghana_card_back_path' | 'selfie_path'> =
  {
    front: 'ghana_card_front_path',
    back: 'ghana_card_back_path',
    selfie: 'selfie_path',
  }

const FILE_BASE: Record<KycDocKind, string> = {
  front: 'ghana-card-front',
  back: 'ghana-card-back',
  selfie: 'selfie',
}

interface KycRow {
  user_id: string
  ghana_card_front_path: string | null
  ghana_card_back_path: string | null
  selfie_path: string | null
  status: KycStatus
  verified_at: string | null
}

const SELECT =
  'user_id, ghana_card_front_path, ghana_card_back_path, selfie_path, status, verified_at'

function mapRow(r: KycRow): MemberKyc {
  return {
    userId: r.user_id,
    ghanaCardFrontPath: r.ghana_card_front_path,
    ghanaCardBackPath: r.ghana_card_back_path,
    selfiePath: r.selfie_path,
    status: r.status,
    verifiedAt: r.verified_at,
  }
}

export const kycService = {
  /** Fetch a member's KYC record (null if they have never uploaded). */
  async get(userId: string): Promise<MemberKyc | null> {
    const { data, error } = await supabase
      .from('member_kyc')
      .select(SELECT)
      .eq('user_id', userId)
      .maybeSingle()
    if (error) {
      console.error('[KYC] Failed to fetch record:', error)
      return null
    }
    return data ? mapRow(data as KycRow) : null
  },

  /**
   * Upload one document into the member's private folder, record its path, and
   * recompute status. Works for a member (own id) and an admin (member's id —
   * allowed by the is_admin() storage + table policies).
   */
  async uploadDocument(userId: string, kind: KycDocKind, file: File): Promise<MemberKyc> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${userId}/${FILE_BASE[kind]}.${ext}`

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) throw upErr

    const existing = await this.get(userId)
    const paths = {
      front: kind === 'front' ? path : (existing?.ghanaCardFrontPath ?? null),
      back: kind === 'back' ? path : (existing?.ghanaCardBackPath ?? null),
      selfie: kind === 'selfie' ? path : (existing?.selfiePath ?? null),
    }
    const anyPresent = !!(paths.front || paths.back || paths.selfie)

    const { data, error } = await supabase
      .from('member_kyc')
      .upsert(
        {
          user_id: userId,
          [COLUMN[kind]]: path,
          // Re-uploading resets any prior verdict — docs must be reviewed again.
          status: anyPresent ? 'uploaded' : 'not_uploaded',
          verified_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select(SELECT)
      .single()
    if (error) throw error

    // TODO (Phase 2 — Smile ID): when front + back + selfie are all present, invoke
    // the `submit-kyc-verification` edge function here to auto-verify on upload.
    // See docs/kyc-smileid-integration.md.

    return mapRow(data as KycRow)
  },

  /** Short-lived signed URL for viewing a stored document (private bucket). */
  async signedUrl(path: string, expiresIn = 300): Promise<string | null> {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn)
    if (error) {
      console.error('[KYC] Failed to sign URL:', error)
      return null
    }
    return data?.signedUrl ?? null
  },

  /**
   * Manually set verification status (admin review, Phase 1). In Phase 2 the
   * Smile ID callback sets this automatically.
   */
  async setStatus(userId: string, status: KycStatus): Promise<void> {
    const { error } = await supabase.from('member_kyc').upsert(
      {
        user_id: userId,
        status,
        verified_at: status === 'verified' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    if (error) throw error
  },
}
