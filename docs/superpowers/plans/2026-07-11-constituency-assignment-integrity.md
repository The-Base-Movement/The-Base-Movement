# Constituency Assignment Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Prevent Ghana and Diaspora membership assignments from crossing models, validate constituency names against the canonical directory, and expose actionable assignment issues to authorized administrators.

**Architecture:** Normalize network-specific fields before registration writes, then enforce the same invariants in a Postgres trigger so browser bypasses cannot create invalid combinations. Add a security-invoker reconciliation view consumed by the existing constituency service and admin page; incomplete Ghana assignments remain allowed but visible.

**Tech Stack:** React 19, TypeScript, Vitest, Supabase Postgres migrations/RLS, existing custom admin UI.

## Global Constraints

- Ghana members use constituencies; Diaspora members use chapters.
- Keep users.constituency as the assignment source; do not add a membership junction table.
- Allow incomplete Ghana registrations with no constituency, but classify them as issues.
- Derive Ghana region from ghana_constituencies.
- Never expose additional member PII publicly.
- Add no dependency, public directory, join workflow, or assignment-history system.

---

### Task 1: Normalize registration network assignments

**Files:**
- Create: src/lib/memberNetworkAssignment.ts
- Create: src/test/memberNetworkAssignment.test.ts
- Modify: src/services/registrationService.ts

**Interfaces:**
- Produces normalizeMemberNetworkAssignment(platform, input).
- Consumes the country, region, constituency, and chapter fields already present on RegistrationFormData.

- [ ] **Step 1: Write the failing test**

Create src/test/memberNetworkAssignment.test.ts:

~~~ts
import { describe, expect, it } from 'vitest'
import { normalizeMemberNetworkAssignment } from '@/lib/memberNetworkAssignment'

describe('member network assignment normalization', () => {
  it('keeps Ghana constituency and removes chapter', () => {
    expect(normalizeMemberNetworkAssignment('GHANA', {
      country: 'Ghana',
      region: 'Greater Accra',
      constituency: '  Ablekuma North  ',
      chapter: 'Accra Central',
    })).toEqual({
      platform: 'GHANA',
      country: 'Ghana',
      region: 'Greater Accra',
      constituency: 'Ablekuma North',
      chapter: null,
    })
  })

  it('keeps Diaspora chapter and removes Ghana fields', () => {
    expect(normalizeMemberNetworkAssignment('DIASPORA', {
      country: 'Belgium',
      region: 'Greater Accra',
      constituency: 'Ablekuma North',
      chapter: ' Belgium Chapter ',
    })).toEqual({
      platform: 'DIASPORA',
      country: 'Belgium',
      region: null,
      constituency: null,
      chapter: 'Belgium Chapter',
    })
  })

  it('normalizes blank assignments to null', () => {
    expect(normalizeMemberNetworkAssignment('GHANA', {
      country: '',
      region: '',
      constituency: ' ',
      chapter: '',
    })).toEqual({
      platform: 'GHANA',
      country: 'Ghana',
      region: null,
      constituency: null,
      chapter: null,
    })
  })
})
~~~

- [ ] **Step 2: Verify the test fails**

Run: npm run test:run -- src/test/memberNetworkAssignment.test.ts

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Add the normalizer**

Create src/lib/memberNetworkAssignment.ts:

~~~ts
type AssignmentInput = {
  country?: string | null
  region?: string | null
  constituency?: string | null
  chapter?: string | null
}

const value = (input?: string | null) => input?.trim() || null

export function normalizeMemberNetworkAssignment(platform: string, input: AssignmentInput) {
  if (platform !== 'DIASPORA') {
    return {
      platform: 'GHANA' as const,
      country: 'Ghana',
      region: value(input.region),
      constituency: value(input.constituency),
      chapter: null,
    }
  }

  return {
    platform: 'DIASPORA' as const,
    country: value(input.country),
    region: null,
    constituency: null,
    chapter: value(input.chapter),
  }
}
~~~

- [ ] **Step 4: Use normalized fields in registration**

Import normalizeMemberNetworkAssignment in src/services/registrationService.ts. Before the users insert, create:

~~~ts
const networkAssignment = normalizeMemberNetworkAssignment(platform, formData)
~~~

Replace the five direct assignment fields with:

~~~ts
platform: networkAssignment.platform,
country: networkAssignment.country,
region: networkAssignment.region,
constituency: networkAssignment.constituency,
chapter: networkAssignment.chapter,
~~~

Keep auto-approval and UI validation unchanged.

- [ ] **Step 5: Verify and commit**

Run:

~~~bash
npm run test:run -- src/test/memberNetworkAssignment.test.ts src/test/registration.test.ts src/test/registrationService.test.ts
npm run typecheck
~~~

Expected: all checks pass.

Commit:

~~~bash
git add src/lib/memberNetworkAssignment.ts src/test/memberNetworkAssignment.test.ts src/services/registrationService.ts
git commit -m "Normalize member network assignments"
~~~

### Task 2: Enforce assignment integrity in Postgres

**Files:**
- Create through Supabase CLI, committed as: supabase/migrations/20260711213939_enforce_member_network_assignment.sql
- Create: supabase/tests/member_network_assignment.sql

**Interfaces:**
- Produces public.enforce_user_network_assignment().
- Produces public.admin_member_assignment_issues as a security-invoker view.
- Allows Ghana rows with no constituency but rejects invalid non-null assignments.

- [ ] **Step 1: Create the migration**

Run: supabase migration new enforce_member_network_assignment

Expected: Supabase creates supabase/migrations/20260711213939_enforce_member_network_assignment.sql.

- [ ] **Step 2: Write the failing database test**

Create supabase/tests/member_network_assignment.sql:

~~~sql
begin;

do $$
begin
  if to_regprocedure('public.enforce_user_network_assignment()') is null then
    raise exception 'assignment trigger function is missing';
  end if;
  if to_regclass('public.admin_member_assignment_issues') is null then
    raise exception 'assignment reconciliation view is missing';
  end if;
end
$$;

insert into public.users (id, full_name, phone_number, platform, country, constituency, chapter)
values (
  '00000000-0000-0000-0000-000000000021',
  'Assignment Test',
  '+233200000021',
  'GHANA',
  'Ghana',
  null,
  null
);

do $$
begin
  begin
    update public.users
    set constituency = 'Not A Constituency'
    where id = '00000000-0000-0000-0000-000000000021';
    raise exception 'invalid constituency was accepted';
  exception when check_violation then null;
  end;

  begin
    update public.users
    set chapter = 'Ghana Chapter'
    where id = '00000000-0000-0000-0000-000000000021';
    if (select chapter is not null from public.users where id = '00000000-0000-0000-0000-000000000021') then
      raise exception 'Ghana chapter was retained';
    end if;
  end;
end
$$;

rollback;
~~~

- [ ] **Step 3: Verify the database test fails**

Run: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/member_network_assignment.sql

Expected: FAIL because the trigger function and view do not exist.

- [ ] **Step 4: Add the enforcement trigger**

Add to the migration:

~~~sql
create or replace function public.enforce_user_network_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_region text;
  v_constituency text;
begin
  new.platform := case
    when upper(trim(coalesce(new.platform, ''))) = 'DIASPORA' then 'DIASPORA'
    else 'GHANA'
  end;
  new.country := nullif(trim(new.country), '');
  new.region := nullif(trim(new.region), '');
  new.constituency := nullif(trim(new.constituency), '');
  new.chapter := nullif(trim(new.chapter), '');

  if new.platform = 'GHANA' then
    new.country := 'Ghana';
    new.chapter := null;

    if new.constituency is not null then
      select gc.name, gr.name into v_constituency, v_region
      from public.ghana_constituencies gc
      join public.ghana_regions gr on gr.id = gc.region_id
      where lower(trim(gc.name)) = lower(new.constituency)
      limit 1;

      if v_constituency is null then
        raise check_violation using message = 'Invalid Ghana constituency assignment';
      end if;

      new.constituency := v_constituency;
      new.region := v_region;
    end if;
  else
    new.region := null;
    new.constituency := null;

    if lower(coalesce(new.country, '')) = 'ghana' then
      raise check_violation using message = 'Diaspora members cannot use Ghana as country';
    end if;

    if new.chapter is not null and not exists (
      select 1 from public.chapters c
      where lower(trim(c.name)) = lower(new.chapter)
        and lower(coalesce(c.country, '')) <> 'ghana'
    ) then
      raise check_violation using message = 'Invalid Diaspora chapter assignment';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_user_network_assignment on public.users;
create trigger trg_enforce_user_network_assignment
before insert or update of platform, country, region, constituency, chapter
on public.users
for each row execute function public.enforce_user_network_assignment();

revoke all on function public.enforce_user_network_assignment() from public, anon, authenticated;
~~~

- [ ] **Step 5: Add the reconciliation view**

Append:

~~~sql
create or replace view public.admin_member_assignment_issues
with (security_invoker = true)
as
select
  u.id,
  u.registration_number,
  u.full_name,
  u.platform,
  u.country,
  u.region,
  u.constituency,
  u.chapter,
  case
    when u.platform = 'GHANA' and u.constituency is null then 'missing_constituency'
    when u.platform = 'GHANA' and gc.id is null then 'invalid_constituency'
    when u.platform = 'GHANA' and u.chapter is not null then 'ghana_has_chapter'
    when u.platform = 'DIASPORA' and (u.constituency is not null or u.region is not null)
      then 'diaspora_has_ghana_assignment'
    when u.platform = 'DIASPORA' and lower(coalesce(u.country, '')) = 'ghana'
      then 'diaspora_country_is_ghana'
    when u.platform = 'DIASPORA' and u.chapter is not null and c.id is null
      then 'invalid_diaspora_chapter'
  end as issue_code
from public.users u
left join public.ghana_constituencies gc
  on lower(trim(gc.name)) = lower(trim(u.constituency))
left join public.chapters c
  on lower(trim(c.name)) = lower(trim(u.chapter))
  and lower(coalesce(c.country, '')) <> 'ghana'
where u.deleted_at is null
  and (
    (u.platform = 'GHANA' and (u.constituency is null or gc.id is null or u.chapter is not null))
    or
    (u.platform = 'DIASPORA' and (
      u.constituency is not null
      or u.region is not null
      or lower(coalesce(u.country, '')) = 'ghana'
      or (u.chapter is not null and c.id is null)
    ))
  );

revoke all on public.admin_member_assignment_issues from public, anon;
grant select on public.admin_member_assignment_issues to authenticated;
~~~

- [ ] **Step 6: Verify and commit**

Run:

~~~bash
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260711213939_enforce_member_network_assignment.sql
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/member_network_assignment.sql
~~~

Expected: both exit 0 and the test rolls back.

Commit:

~~~bash
git add -f supabase/migrations/20260711213939_enforce_member_network_assignment.sql supabase/tests/member_network_assignment.sql
git commit -m "Enforce member network assignments"
~~~

### Task 3: Surface reconciliation issues to administrators

**Files:**
- Modify: src/services/constituencyService.ts
- Modify: src/pages/admin/Constituencies.tsx
- Create: src/test/constituencyAssignmentIssues.test.ts

**Interfaces:**
- Produces MemberAssignmentIssue.
- Produces constituencyService.getAssignmentIssues().
- Consumes admin_member_assignment_issues from Task 2.

- [ ] **Step 1: Write the failing type contract test**

Create src/test/constituencyAssignmentIssues.test.ts:

~~~ts
import { describe, expect, it } from 'vitest'
import type { MemberAssignmentIssue } from '@/services/constituencyService'

describe('constituency assignment issues', () => {
  it('uses stable reconciliation issue codes', () => {
    const issue: MemberAssignmentIssue = {
      id: 'member-1',
      registrationNumber: 'TBM-GH-260001',
      fullName: 'Test Member',
      platform: 'GHANA',
      country: 'Ghana',
      region: null,
      constituency: null,
      chapter: null,
      issueCode: 'missing_constituency',
    }
    expect(issue.issueCode).toBe('missing_constituency')
  })
})
~~~

- [ ] **Step 2: Verify the test fails**

Run: npm run test:run -- src/test/constituencyAssignmentIssues.test.ts

Expected: FAIL because MemberAssignmentIssue is not exported.

- [ ] **Step 3: Add the service contract**

Export MemberAssignmentIssue from src/services/constituencyService.ts:

~~~ts
export type MemberAssignmentIssue = {
  id: string
  registrationNumber: string | null
  fullName: string
  platform: 'GHANA' | 'DIASPORA'
  country: string | null
  region: string | null
  constituency: string | null
  chapter: string | null
  issueCode:
    | 'missing_constituency'
    | 'invalid_constituency'
    | 'ghana_has_chapter'
    | 'diaspora_has_ghana_assignment'
    | 'diaspora_country_is_ghana'
    | 'invalid_diaspora_chapter'
}
~~~

Add this method:

~~~ts
async getAssignmentIssues(): Promise<MemberAssignmentIssue[]> {
  const { data, error } = await supabase
    .from('admin_member_assignment_issues')
    .select('id, registration_number, full_name, platform, country, region, constituency, chapter, issue_code')
    .order('full_name')

  if (error) {
    console.error('[CONSTITUENCY] Assignment reconciliation failed:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    registrationNumber: row.registration_number as string | null,
    fullName: row.full_name as string,
    platform: row.platform as 'GHANA' | 'DIASPORA',
    country: row.country as string | null,
    region: row.region as string | null,
    constituency: row.constituency as string | null,
    chapter: row.chapter as string | null,
    issueCode: row.issue_code as MemberAssignmentIssue['issueCode'],
  }))
}
~~~

- [ ] **Step 4: Add the admin reconciliation panel**

In src/pages/admin/Constituencies.tsx:

- Import MemberAssignmentIssue.
- Add assignmentIssues state.
- Load getConstituencies() and getAssignmentIssues() with Promise.all.
- Change the fourth KPI from Total Members to Assignment Issues and show assignmentIssues.length with a destructive-color bar.
- Below the KPI strip, render a panel only when issues exist.
- The compact table columns are Member, Platform, Current assignment, and Issue.
- Navigate member names to /admin/members/ plus the issue id.
- Format issue codes with issue.issueCode.replaceAll('_', ' '); do not add a mapping component.

- [ ] **Step 5: Verify and commit**

Run:

~~~bash
npm run test:run -- src/test/constituencyAssignmentIssues.test.ts src/test/memberNetworkAssignment.test.ts
npm run typecheck
~~~

Expected: all checks pass.

Commit:

~~~bash
git add src/services/constituencyService.ts src/pages/admin/Constituencies.tsx src/test/constituencyAssignmentIssues.test.ts
git commit -m "Expose constituency assignment issues"
~~~

### Task 4: End-to-end verification

**Files:** Modify only when a Task 1–3 defect is found.

- [ ] **Step 1: Run focused tests**

Run:

~~~bash
npm run test:run -- src/test/memberNetworkAssignment.test.ts src/test/constituencyAssignmentIssues.test.ts src/test/registration.test.ts src/test/registrationService.test.ts
~~~

Expected: all four files pass.

- [ ] **Step 2: Run static checks**

Run:

~~~bash
npm run typecheck
npx eslint src/lib/memberNetworkAssignment.ts src/services/registrationService.ts src/services/constituencyService.ts src/pages/admin/Constituencies.tsx src/test/memberNetworkAssignment.test.ts src/test/constituencyAssignmentIssues.test.ts
git diff --check
~~~

Expected: all commands exit 0.

- [ ] **Step 3: Verify rendered behavior**

Open /admin/constituencies with an authorized admin. Confirm the Assignment Issues KPI matches the table, member links open the correct detail page, and the panel is absent when there are no issues.

- [ ] **Step 4: Update graph and confirm a clean branch**

Run:

~~~bash
graphify update .
git status --short
~~~

Expected: graph update succeeds and Git reports no uncommitted files.

