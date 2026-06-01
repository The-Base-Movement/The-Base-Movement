# Newsletter Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin Newsletter page that lets staff compose, target by region/constituency/chapter/role, and send branded HTML newsletters via SendGrid, with a persistent history log stored in Supabase.

**Architecture:** A new `send-newsletter` Supabase Edge Function fetches matching emails from the `users`/`admins` tables based on an audience filter, wraps the TinyMCE body in the existing `broadcastEmail` template, and sends via SendGrid `/v3/mail/send` in batches of 1,000. Every send is recorded in a new `newsletters` table. The admin page has a compose panel (TinyMCE + audience picker) and a history panel (searchable table + view modal).

**Tech Stack:** React 18 + TypeScript, Supabase (PostgreSQL + Edge Functions / Deno), SendGrid `/v3/mail/send`, TinyMCE (`@tinymce/tinymce-react`), Vitest, custom CSS design system (inline styles + CSS variables — no Tailwind/shadcn).

---

## File Map

| File                                                        | Action | Responsibility                                    |
| ----------------------------------------------------------- | ------ | ------------------------------------------------- |
| `supabase/migrations/20260601000100_create_newsletters.sql` | Create | `newsletters` table + RLS policies                |
| `src/services/newsletterService.ts`                         | Create | DB reads/writes + edge function invoke            |
| `supabase/functions/send-newsletter/index.ts`               | Create | Fetch emails, send via SendGrid, update DB row    |
| `src/pages/admin/newsletter/ComposePanel.tsx`               | Create | Subject + audience picker + TinyMCE + Send button |
| `src/pages/admin/newsletter/HistoryPanel.tsx`               | Create | History table + view-body modal                   |
| `src/pages/admin/Newsletter.tsx`                            | Create | Page orchestrator — KPIs + Compose + History      |
| `src/routes.tsx`                                            | Modify | Add lazy import + `/admin/newsletter` route       |
| `src/components/layouts/AdminLayout.tsx`                    | Modify | Add "Newsletter" nav entry                        |
| `src/test/newsletterService.test.ts`                        | Create | Unit tests for service helper functions           |

---

## Task 1: DB Migration — `newsletters` table

**Files:**

- Create: `supabase/migrations/20260601000100_create_newsletters.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260601000100_create_newsletters.sql

CREATE TABLE public.newsletters (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject          text NOT NULL,
  body_html        text NOT NULL,
  audience_type    text NOT NULL CHECK (audience_type IN ('all','region','constituency','chapter','role')),
  audience_value   text,
  recipient_count  integer NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed')),
  error_message    text,
  sent_by          uuid REFERENCES public.users(id) ON DELETE SET NULL,
  sent_at          timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can insert newsletters"
  ON public.newsletters FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "admins can select newsletters"
  ON public.newsletters FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "admins can update newsletters"
  ON public.newsletters FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
```

- [ ] **Step 2: Apply the migration**

```bash
supabase db push
```

Expected output: `Applying migration 20260601000100_create_newsletters.sql...` with no errors.

- [ ] **Step 3: Verify the table exists**

In Supabase Dashboard → Table Editor, confirm `newsletters` appears with all columns.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260601000100_create_newsletters.sql
git commit -m "feat: add newsletters table with RLS policies"
```

---

## Task 2: `newsletterService.ts`

**Files:**

- Create: `src/services/newsletterService.ts`
- Create: `src/test/newsletterService.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/test/newsletterService.test.ts
import { describe, it, expect } from 'vitest'
import { buildAudienceLabel, formatRecipientCount } from '../services/newsletterService'

describe('buildAudienceLabel', () => {
  it('returns "All members" when type is all', () => {
    expect(buildAudienceLabel('all', null)).toBe('All members')
  })

  it('returns "Region: Greater Accra" when type is region', () => {
    expect(buildAudienceLabel('region', 'Greater Accra')).toBe('Region: Greater Accra')
  })

  it('returns "Constituency: Ayawaso West" when type is constituency', () => {
    expect(buildAudienceLabel('constituency', 'Ayawaso West')).toBe('Constituency: Ayawaso West')
  })

  it('returns "Chapter: Lapaz 04" when type is chapter', () => {
    expect(buildAudienceLabel('chapter', 'Lapaz 04')).toBe('Chapter: Lapaz 04')
  })

  it('returns "Role: REGIONAL_MANAGER" when type is role', () => {
    expect(buildAudienceLabel('role', 'REGIONAL_MANAGER')).toBe('Role: REGIONAL_MANAGER')
  })
})

describe('formatRecipientCount', () => {
  it('returns "0 recipients" for zero', () => {
    expect(formatRecipientCount(0)).toBe('0 recipients')
  })

  it('returns "1 recipient" for one', () => {
    expect(formatRecipientCount(1)).toBe('1 recipient')
  })

  it('returns "42 recipients" for many', () => {
    expect(formatRecipientCount(42)).toBe('42 recipients')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/test/newsletterService.test.ts
```

Expected: FAIL — `buildAudienceLabel` and `formatRecipientCount` not found.

- [ ] **Step 3: Write `newsletterService.ts`**

```typescript
// src/services/newsletterService.ts
import { supabase } from '@/lib/supabase'

export type AudienceType = 'all' | 'region' | 'constituency' | 'chapter' | 'role'

export interface Newsletter {
  id: string
  subject: string
  body_html: string
  audience_type: AudienceType
  audience_value: string | null
  recipient_count: number
  status: 'sent' | 'failed'
  error_message: string | null
  sent_by: string | null
  sent_at: string
  created_at: string
}

export interface SendNewsletterPayload {
  newsletter_id: string
  subject: string
  body_html: string
  audience_type: AudienceType
  audience_value: string | null
}

// Pure helpers (exported for tests)
export function buildAudienceLabel(type: AudienceType, value: string | null): string {
  if (type === 'all') return 'All members'
  const prefix = type.charAt(0).toUpperCase() + type.slice(1)
  return `${prefix}: ${value ?? ''}`
}

export function formatRecipientCount(count: number): string {
  return count === 1 ? '1 recipient' : `${count} recipients`
}

export const newsletterService = {
  async getNewsletters(): Promise<Newsletter[]> {
    const { data, error } = await supabase
      .from('newsletters')
      .select('*')
      .order('sent_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Newsletter[]
  },

  async getAudienceOptions(type: AudienceType): Promise<string[]> {
    if (type === 'all') return []

    if (type === 'role') {
      const { data, error } = await supabase.from('admins').select('role').not('role', 'is', null)
      if (error) throw error
      return [...new Set((data ?? []).map((r: { role: string }) => r.role))].sort()
    }

    const col = type // 'region' | 'constituency' | 'chapter'
    const { data, error } = await supabase
      .from('users')
      .select(col)
      .not(col, 'is', null)
      .neq(col, '')
      .is('deleted_at', null)
    if (error) throw error
    return [...new Set((data ?? []).map((r: Record<string, string>) => r[col]))].sort()
  },

  async getRecipientCount(type: AudienceType, value: string | null): Promise<number> {
    if (type === 'role') {
      const { count, error } = await supabase
        .from('admins')
        .select('id', { count: 'exact', head: true })
        .eq('role', value ?? '')
      if (error) throw error
      return count ?? 0
    }

    let query = supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .not('email', 'is', null)
      .neq('email', '')
      .is('deleted_at', null)

    if (type !== 'all' && value) {
      query = query.eq(type, value)
    }

    const { count, error } = await query
    if (error) throw error
    return count ?? 0
  },

  async createAndSend(payload: SendNewsletterPayload): Promise<{ sent: number; batches: number }> {
    // Insert record first so edge function can update it
    const { error: insertError } = await supabase.from('newsletters').insert({
      id: payload.newsletter_id,
      subject: payload.subject,
      body_html: payload.body_html,
      audience_type: payload.audience_type,
      audience_value: payload.audience_value,
      status: 'sent',
    })
    if (insertError) throw insertError

    const { data, error } = await supabase.functions.invoke('send-newsletter', {
      body: payload,
    })
    if (error) throw error
    return data as { sent: number; batches: number }
  },
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/test/newsletterService.test.ts
```

Expected: PASS — 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/services/newsletterService.ts src/test/newsletterService.test.ts
git commit -m "feat: add newsletterService with audience helpers and DB methods"
```

---

## Task 3: `send-newsletter` Edge Function

**Files:**

- Create: `supabase/functions/send-newsletter/index.ts`

- [ ] **Step 1: Write the edge function**

```typescript
// supabase/functions/send-newsletter/index.ts
// @ts-nocheck
// THE BASE: NEWSLETTER SEND
// Fetches emails matching the audience filter, wraps body in broadcastEmail
// template, sends via SendGrid /v3/mail/send, updates the newsletters row.
//
// Required secret: SENDGRID_API_KEY
// Auto-injected:   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { broadcastEmail } from '../_shared/email-templates.ts'

const BATCH_SIZE = 1000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { newsletter_id, subject, body_html, audience_type, audience_value } = await req.json()

    const sgKey: string | undefined = Deno.env.get('SENDGRID_API_KEY')
    if (!sgKey) {
      return new Response(JSON.stringify({ skipped: true, reason: 'SENDGRID_API_KEY not set' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch recipient emails based on audience
    let emails: string[] = []

    if (audience_type === 'role') {
      const { data, error } = await supabase
        .from('admins')
        .select('id')
        .eq('role', audience_value ?? '')
      if (error) throw error
      const ids = (data ?? []).map((r: { id: string }) => r.id)
      if (ids.length > 0) {
        const { data: users, error: uErr } = await supabase
          .from('users')
          .select('email')
          .in('id', ids)
          .not('email', 'is', null)
          .neq('email', '')
        if (uErr) throw uErr
        emails = (users ?? []).map((u: { email: string }) => u.email)
      }
    } else {
      let query = supabase
        .from('users')
        .select('email')
        .not('email', 'is', null)
        .neq('email', '')
        .is('deleted_at', null)

      if (audience_type !== 'all' && audience_value) {
        query = query.eq(audience_type, audience_value)
      }

      const { data, error } = await query
      if (error) throw error
      emails = (data ?? []).map((u: { email: string }) => u.email)
    }

    if (emails.length === 0) {
      await supabase
        .from('newsletters')
        .update({ recipient_count: 0, status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', newsletter_id)
      return new Response(JSON.stringify({ sent: 0, batches: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Build branded HTML
    const html = broadcastEmail({
      subject,
      preheader: subject,
      body: `<div style="line-height:1.65;color:#444">${body_html}</div>`,
      ctaLabel: 'Go to your dashboard →',
      ctaUrl: 'https://nevermind-beta.vercel.app/dashboard',
    })

    // Send in batches
    let batchCount = 0
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE)
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sgKey}`,
        },
        body: JSON.stringify({
          personalizations: batch.map((email) => ({ to: [{ email }] })),
          from: { email: 'brastyphler17@gmail.com', name: 'The Base Movement' },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      })
      if (res.status !== 202) {
        const errText = await res.text()
        await supabase
          .from('newsletters')
          .update({ status: 'failed', error_message: `SendGrid error ${res.status}: ${errText}` })
          .eq('id', newsletter_id)
        throw new Error(`SendGrid batch ${batchCount + 1} failed: ${res.status} ${errText}`)
      }
      batchCount++
      console.warn(`[NEWSLETTER] Batch ${batchCount} sent (${batch.length} emails)`)
    }

    // Update record
    await supabase
      .from('newsletters')
      .update({ recipient_count: emails.length, status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', newsletter_id)

    return new Response(JSON.stringify({ sent: emails.length, batches: batchCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null
          ? JSON.stringify(err)
          : String(err)
    console.error('[NEWSLETTER-ERROR]', message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
```

- [ ] **Step 2: Deploy the function**

```bash
supabase functions deploy send-newsletter
```

Expected: `Deployed Functions on project vhlyekyxutwbxlvktnzd: send-newsletter`

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/send-newsletter/index.ts
git commit -m "feat: add send-newsletter edge function"
```

---

## Task 4: `ComposePanel.tsx`

**Files:**

- Create: `src/pages/admin/newsletter/ComposePanel.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/pages/admin/newsletter/ComposePanel.tsx
import { useRef, useState, useEffect } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import type { AudienceType } from '@/services/newsletterService'
import { newsletterService, formatRecipientCount } from '@/services/newsletterService'

interface ComposePanelProps {
  isSending: boolean
  onSend: (
    subject: string,
    bodyHtml: string,
    audienceType: AudienceType,
    audienceValue: string | null
  ) => void
}

export function ComposePanel({ isSending, onSend }: ComposePanelProps) {
  const editorRef = useRef<{ getContent: () => string } | null>(null)
  const [subject, setSubject] = useState('')
  const [audienceType, setAudienceType] = useState<AudienceType>('all')
  const [audienceValue, setAudienceValue] = useState<string | null>(null)
  const [audienceOptions, setAudienceOptions] = useState<string[]>([])
  const [recipientCount, setRecipientCount] = useState<number | null>(null)

  useEffect(() => {
    setAudienceValue(null)
    setAudienceOptions([])
    setRecipientCount(null)
    if (audienceType !== 'all') {
      newsletterService
        .getAudienceOptions(audienceType)
        .then(setAudienceOptions)
        .catch(() => {})
    } else {
      newsletterService
        .getRecipientCount('all', null)
        .then(setRecipientCount)
        .catch(() => {})
    }
  }, [audienceType])

  useEffect(() => {
    if (audienceType === 'all' || audienceValue) {
      newsletterService
        .getRecipientCount(audienceType, audienceValue)
        .then(setRecipientCount)
        .catch(() => {})
    } else {
      setRecipientCount(null)
    }
  }, [audienceType, audienceValue])

  function handleSend() {
    const body = editorRef.current?.getContent() ?? ''
    onSend(subject, body, audienceType, audienceValue)
  }

  const canSend =
    !isSending &&
    subject.trim().length > 0 &&
    (audienceType === 'all' || audienceValue !== null) &&
    (recipientCount === null || recipientCount > 0)

  return (
    <div className="panel" style={{ padding: '20px 24px' }}>
      <div className="ph" style={{ marginBottom: 18 }}>
        <div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            Compose newsletter
          </p>
          <p
            style={{
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              margin: '2px 0 0',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Sent via SendGrid · wrapped in branded template
          </p>
        </div>
      </div>

      {/* Subject */}
      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface-muted))',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 6,
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Movement update — June 2026"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '8px 12px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontFamily: "'Public Sans', sans-serif",
            color: 'hsl(var(--on-surface))',
            background: 'hsl(var(--background))',
            outline: 'none',
          }}
        />
      </div>

      {/* Audience type */}
      <div style={{ marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 6,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Audience
          </label>
          <select
            value={audienceType}
            onChange={(e) => setAudienceType(e.target.value as AudienceType)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '8px 12px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontFamily: "'Public Sans', sans-serif",
              color: 'hsl(var(--on-surface))',
              background: 'hsl(var(--background))',
              cursor: 'pointer',
            }}
          >
            <option value="all">All members</option>
            <option value="region">By region</option>
            <option value="constituency">By constituency</option>
            <option value="chapter">By chapter</option>
            <option value="role">By role</option>
          </select>
        </div>

        {/* Audience value */}
        {audienceType !== 'all' && (
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 6,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {audienceType.charAt(0).toUpperCase() + audienceType.slice(1)}
            </label>
            <select
              value={audienceValue ?? ''}
              onChange={(e) => setAudienceValue(e.target.value || null)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontFamily: "'Public Sans', sans-serif",
                color: 'hsl(var(--on-surface))',
                background: 'hsl(var(--background))',
                cursor: 'pointer',
              }}
            >
              <option value="">— select —</option>
              {audienceOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Recipient count preview */}
      {recipientCount !== null && (
        <p
          style={{
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            marginBottom: 14,
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}
          >
            people
          </span>
          ~{formatRecipientCount(recipientCount)}
        </p>
      )}

      {/* TinyMCE */}
      <div style={{ marginBottom: 18 }}>
        <label
          style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface-muted))',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 6,
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Body
        </label>
        <Editor
          apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
          onInit={(_, editor) => {
            editorRef.current = editor
          }}
          initialValue=""
          init={{
            height: 400,
            menubar: false,
            plugins: [
              'advlist',
              'autolink',
              'lists',
              'link',
              'charmap',
              'searchreplace',
              'wordcount',
            ],
            toolbar:
              'undo redo | blocks | bold italic underline forecolor | alignleft aligncenter alignright | bullist numlist | link | removeformat',
            statusbar: false,
            content_style:
              'body { font-family: "Public Sans", sans-serif; font-size:14px; color:#1f2520; line-height:1.65; background:white; }',
            branding: false,
          }}
        />
      </div>

      {/* Send */}
      <button
        className="btn btn-primary"
        onClick={handleSend}
        disabled={!canSend}
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          send
        </span>
        {isSending ? 'Sending…' : 'Send newsletter'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/newsletter/ComposePanel.tsx
git commit -m "feat: add newsletter ComposePanel with TinyMCE and audience picker"
```

---

## Task 5: `HistoryPanel.tsx`

**Files:**

- Create: `src/pages/admin/newsletter/HistoryPanel.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/pages/admin/newsletter/HistoryPanel.tsx
import { useState } from 'react'
import type { Newsletter } from '@/services/newsletterService'
import { buildAudienceLabel } from '@/services/newsletterService'

interface HistoryPanelProps {
  newsletters: Newsletter[]
  isLoading: boolean
}

export function HistoryPanel({ newsletters, isLoading }: HistoryPanelProps) {
  const [search, setSearch] = useState('')
  const [viewingBody, setViewingBody] = useState<Newsletter | null>(null)

  const filtered = newsletters.filter((n) => n.subject.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <div className="panel" style={{ padding: '20px 24px' }}>
        <div className="ph" style={{ marginBottom: 14 }}>
          <div>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              Send history
            </p>
            <p
              style={{
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                margin: '2px 0 0',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {newsletters.length} newsletter{newsletters.length !== 1 ? 's' : ''} sent
            </p>
          </div>
          <input
            type="text"
            placeholder="Search by subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              fontFamily: "'Public Sans', sans-serif",
              color: 'hsl(var(--on-surface))',
              background: 'hsl(var(--background))',
              outline: 'none',
              width: 200,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {isLoading ? (
          <p
            style={{
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              padding: '20px 0',
            }}
          >
            Loading…
          </p>
        ) : filtered.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              padding: '20px 0',
            }}
          >
            {search ? 'No newsletters match your search.' : 'No newsletters sent yet.'}
          </p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Date', 'Subject', 'Audience', 'Recipients', 'Status'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '6px 8px',
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr
                  key={n.id}
                  onClick={() => setViewingBody(n)}
                  style={{ borderBottom: '1px solid hsl(var(--border))', cursor: 'pointer' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'hsl(var(--container-low))')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td
                    style={{
                      padding: '10px 8px',
                      color: 'hsl(var(--on-surface-muted))',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {new Date(n.sent_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td
                    style={{
                      padding: '10px 8px',
                      color: 'hsl(var(--on-surface))',
                      fontWeight: 'var(--font-weight-medium, 500)',
                      maxWidth: 220,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {n.subject}
                  </td>
                  <td style={{ padding: '10px 8px', color: 'hsl(var(--on-surface-muted))' }}>
                    {buildAudienceLabel(n.audience_type, n.audience_value)}
                  </td>
                  <td
                    style={{
                      padding: '10px 8px',
                      color: 'hsl(var(--on-surface))',
                      textAlign: 'right',
                    }}
                  >
                    {n.recipient_count.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span className={n.status === 'sent' ? 'pill pill-ok' : 'pill pill-err'}>
                      {n.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View body modal */}
      {viewingBody && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setViewingBody(null)}
        >
          <div
            style={{
              background: 'hsl(var(--background))',
              borderRadius: 'var(--radius-lg)',
              width: '90%',
              maxWidth: 680,
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid hsl(var(--border))',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {viewingBody.subject}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {buildAudienceLabel(viewingBody.audience_type, viewingBody.audience_value)} ·{' '}
                  {viewingBody.recipient_count.toLocaleString()} recipients
                </p>
              </div>
              <button
                onClick={() => setViewingBody(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
                >
                  close
                </span>
              </button>
            </div>
            <div
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                fontSize: 13,
                fontFamily: "'Public Sans', sans-serif",
                color: 'hsl(var(--on-surface))',
                lineHeight: 1.7,
              }}
              dangerouslySetInnerHTML={{ __html: viewingBody.body_html }}
            />
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/newsletter/HistoryPanel.tsx
git commit -m "feat: add newsletter HistoryPanel with search and view modal"
```

---

## Task 6: `Newsletter.tsx` Page

**Files:**

- Create: `src/pages/admin/Newsletter.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/pages/admin/Newsletter.tsx
import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { newsletterService } from '@/services/newsletterService'
import type { AudienceType, Newsletter } from '@/services/newsletterService'
import { ComposePanel } from './newsletter/ComposePanel'
import { HistoryPanel } from './newsletter/HistoryPanel'

export default function NewsletterPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)

  const fetchNewsletters = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await newsletterService.getNewsletters()
      setNewsletters(data)
    } catch {
      // fail silently — history is non-critical
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNewsletters()
  }, [fetchNewsletters])

  async function handleSend(
    subject: string,
    bodyHtml: string,
    audienceType: AudienceType,
    audienceValue: string | null
  ) {
    setIsSending(true)
    setSendResult(null)
    const newsletter_id = uuidv4()
    try {
      const { sent } = await newsletterService.createAndSend({
        newsletter_id,
        subject,
        body_html: bodyHtml,
        audience_type: audienceType,
        audience_value: audienceValue,
      })
      setSendResult(
        `✓ Newsletter sent to ${sent.toLocaleString()} recipient${sent !== 1 ? 's' : ''}.`
      )
      fetchNewsletters()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setSendResult(`✗ Send failed: ${msg}`)
    } finally {
      setIsSending(false)
    }
  }

  // KPI derivations
  const thisMonth = newsletters.filter((n) => {
    const d = new Date(n.sent_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const totalRecipients = newsletters.reduce((sum, n) => sum + n.recipient_count, 0)
  const lastSent = newsletters[0]
    ? new Date(newsletters[0].sent_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

  const kpis = [
    {
      label: 'Total sent',
      value: newsletters.length.toLocaleString(),
      bar: 'hsl(var(--on-surface))',
    },
    { label: 'Sent this month', value: thisMonth.toLocaleString(), bar: 'hsl(var(--primary))' },
    {
      label: 'Total recipients',
      value: totalRecipients.toLocaleString(),
      bar: 'hsl(var(--accent))',
    },
    { label: 'Last sent', value: lastSent, bar: 'hsl(var(--destructive))' },
  ]

  return (
    <div className="main">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 22, color: 'hsl(var(--primary))' }}
          >
            mail
          </span>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 20,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Newsletter
          </h1>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Compose and send branded email newsletters to members and staff via SendGrid.
        </p>
      </div>

      {/* KPIs */}
      <div className="kpis" style={{ marginBottom: 20 }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="panel"
            style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: kpi.bar,
              }}
            />
            <p
              style={{
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 6px',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Send result banner */}
      {sendResult && (
        <div
          style={{
            padding: '8px 14px',
            marginBottom: 14,
            borderRadius: 'var(--radius-sm)',
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 12,
            fontWeight: 'var(--font-weight-medium, 500)',
            background: sendResult.startsWith('✓')
              ? 'rgba(34,197,94,0.08)'
              : 'rgba(239,68,68,0.08)',
            color: sendResult.startsWith('✓') ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
            border: `1px solid ${sendResult.startsWith('✓') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{sendResult}</span>
          <button
            onClick={() => setSendResult(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0 4px',
              color: 'inherit',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              close
            </span>
          </button>
        </div>
      )}

      <ComposePanel isSending={isSending} onSend={handleSend} />

      <div style={{ marginTop: 20 }}>
        <HistoryPanel newsletters={newsletters} isLoading={isLoading} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Check `uuid` is available**

```bash
grep "\"uuid\"" package.json
```

If not found, install it:

```bash
npm install uuid
npm install -D @types/uuid
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Newsletter.tsx
git commit -m "feat: add Newsletter admin page with KPIs, compose, and history"
```

---

## Task 7: Route + Nav

**Files:**

- Modify: `src/routes.tsx`
- Modify: `src/components/layouts/AdminLayout.tsx`

- [ ] **Step 1: Add lazy import and route to `src/routes.tsx`**

After line 83 (`const AdminMLIntelligence = ...`), add:

```typescript
const AdminNewsletter = lazy(() => import('./pages/admin/Newsletter'))
```

After line 203 (`{ path: '/admin/ml-intelligence', element: <AdminMLIntelligence /> },`), add:

```typescript
{ path: '/admin/newsletter', element: <AdminNewsletter /> },
```

- [ ] **Step 2: Add nav entry to `src/components/layouts/AdminLayout.tsx`**

After the broadcasts nav entry (lines 286–291):

```typescript
{
  to: '/admin/newsletter',
  icon: 'mail',
  label: 'Newsletter',
  permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
},
```

- [ ] **Step 3: Type-check**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes.tsx src/components/layouts/AdminLayout.tsx
git commit -m "feat: wire /admin/newsletter route and nav entry"
```

---

## Task 8: Deploy + Smoke Test

- [ ] **Step 1: Push all commits**

```bash
git push
```

- [ ] **Step 2: Deploy the edge function**

```bash
supabase functions deploy send-newsletter
```

- [ ] **Step 3: Smoke test in browser**

1. Navigate to `/admin/newsletter`
2. Confirm 4 KPI tiles render
3. Set Audience to "All members" — confirm recipient count appears
4. Type a subject, write a body in TinyMCE
5. Click **Send newsletter**
6. Confirm green success banner appears with recipient count
7. Confirm the newsletter appears in the history table below
8. Click the history row — confirm the view modal opens with the body HTML

- [ ] **Step 4: Verify history in Supabase**

Supabase Dashboard → Table Editor → `newsletters` — confirm a row exists with `status = 'sent'` and correct `recipient_count`.

---

## Self-Review

**Spec coverage:**

- ✅ TinyMCE body editor → ComposePanel uses `@tinymce/tinymce-react`
- ✅ Audience: all / region / constituency / chapter / role → `getAudienceOptions` + targeting in edge fn
- ✅ Recipient count preview → `getRecipientCount` shown below picker
- ✅ SendGrid send via `/v3/mail/send` → edge function batches 1,000
- ✅ `newsletters` table with RLS → Task 1 migration
- ✅ History log with search → HistoryPanel
- ✅ View body modal → HistoryPanel modal
- ✅ KPI strip → Newsletter.tsx kpis array
- ✅ Status pills sent/failed → `pill-ok` / `pill-err`
- ✅ Route + nav entry → Task 7
- ✅ Error banner on failure → red result banner in Newsletter.tsx

**Placeholder scan:** No TBDs, no "handle edge cases" vagueness. All code is complete. ✅

**Type consistency:** `AudienceType`, `Newsletter`, `SendNewsletterPayload` defined in Task 2 and used consistently in Tasks 4, 5, 6. `buildAudienceLabel` and `formatRecipientCount` defined in Task 2 and imported in Tasks 4 and 5. ✅
