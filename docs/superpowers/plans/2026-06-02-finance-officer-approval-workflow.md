# Finance Officer Role & Approval Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a secure, dedicated `FinanceOfficer` administrative role that restricts UI and table access strictly to financial modules (Donations, Expenses/Ledger, Inventory, and Orders), and implement an interactive internal budget/replenishment request approval flow with auto-ledger entries and user feedback comments.

**Architecture:**

1. **Database Schema**: Create a `public.finance_requests` table tracking requester, request details, status, officer feedback, and reviewers. Update the `role` enum/constraints on `public.admins` to support `FinanceOfficer`. Add custom RLS write/read policies on all financial tables for the `FinanceOfficer` role. Add a database function/trigger to auto-create allocation/expenditure entries in `public.mobilization_ledger` upon request approval.
2. **Services Layer**: Add `src/services/financeService.ts` containing API methods for creating, fetching, and approving/rejecting requests.
3. **Frontend Routing & RBAC**: Scoping logic in `AdminLayout.tsx` and `routes.tsx` to lock navigation sidebar tabs and block standard admins/users from viewing unpermitted screens.
4. **UI Components**: Create `/admin/FinanceRequests.tsx` as a dual-purpose dashboard page (inbox interface for the Finance Officer to review and approve/reject, and request form submission for regular admins).

**Tech Stack:** Supabase (Database + Row Level Security + Triggers), React + TypeScript (Vite client-side).

---

### Task 1: Database Schema & Migration — Role escalation and Requests table

**Files:**

- [NEW] `supabase/migrations/20260602140000_finance_officer_role_and_requests.sql`

- [ ] **Step 1: Create the migration file**
      Create `supabase/migrations/20260602140000_finance_officer_role_and_requests.sql` to add the `FinanceOfficer` role constraint, create the requests table, set up its triggers, and apply granular RLS rules.

  ```sql
  -- 1. Support FinanceOfficer in admins table
  ALTER TABLE public.admins
    DROP CONSTRAINT IF EXISTS admins_role_check,
    ADD CONSTRAINT admins_role_check CHECK (role IN ('SuperAdmin', 'RegionalAdmin', 'FinanceOfficer'));

  -- 2. Create the internal finance requests table
  CREATE TABLE IF NOT EXISTS public.finance_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      request_type TEXT NOT NULL CHECK (request_type IN ('BudgetAllocation', 'ExpenseReimbursement', 'InventoryReplenishment')),
      chapter TEXT NOT NULL,
      amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
      officer_comment TEXT,
      reviewed_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT now(),
      reviewed_at TIMESTAMPTZ
  );

  -- 3. Enable RLS on requests
  ALTER TABLE public.finance_requests ENABLE ROW LEVEL SECURITY;

  -- 4. RLS Policies on finance_requests
  -- Regular users / Requesters can see and create their own requests
  CREATE POLICY "Users can view own requests" ON public.finance_requests
      FOR SELECT USING (requester_id = auth.uid());

  CREATE POLICY "Users can create requests" ON public.finance_requests
      FOR INSERT WITH CHECK (requester_id = auth.uid());

  -- Finance Officers and SuperAdmins can view and update all requests
  CREATE POLICY "Finance staff can view all requests" ON public.finance_requests
      FOR SELECT USING (
          (SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SuperAdmin', 'FinanceOfficer')
      );

  CREATE POLICY "Finance staff can update requests" ON public.finance_requests
      FOR UPDATE USING (
          (SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SuperAdmin', 'FinanceOfficer')
      ) WITH CHECK (
          (SELECT role FROM public.admins WHERE id = auth.uid()) IN ('SuperAdmin', 'FinanceOfficer')
      );

  -- 5. Finance Officer Access Policies on existing financial tables
  -- Grant SELECT/ALL access to FinanceOfficer roles on financial tables
  CREATE POLICY "FinanceOfficer has full access to ledger" ON public.mobilization_ledger
      FOR ALL USING ((SELECT role FROM public.admins WHERE id = auth.uid()) = 'FinanceOfficer');

  CREATE POLICY "FinanceOfficer has full access to field_events" ON public.field_events
      FOR ALL USING ((SELECT role FROM public.admins WHERE id = auth.uid()) = 'FinanceOfficer');

  -- 6. Trigger to automate Ledger insertion upon request approval
  CREATE OR REPLACE FUNCTION public.handle_approved_finance_request()
  RETURNS TRIGGER AS $$
  BEGIN
      IF NEW.status = 'Approved' AND OLD.status = 'Pending' THEN
          INSERT INTO public.mobilization_ledger (
              chapter,
              transaction_type,
              amount,
              description,
              category,
              created_by
          ) VALUES (
              NEW.chapter,
              CASE
                  WHEN NEW.request_type = 'BudgetAllocation' THEN 'Allocation'::text
                  ELSE 'Expenditure'::text
              END,
              NEW.amount,
              '[Auto-Approved Request] ' || NEW.description,
              CASE
                  WHEN NEW.request_type = 'InventoryReplenishment' THEN 'Other'::text
                  ELSE 'Logistics'::text
              END,
              NEW.requester_id
          );
      END IF;
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_finance_request_approval
      AFTER UPDATE OF status ON public.finance_requests
      FOR EACH ROW EXECUTE FUNCTION public.handle_approved_finance_request();
  ```

- [ ] **Step 2: Deploy the migration**
      Run the SQL directly using the Supabase CLI:

  ```bash
  supabase db query --linked -f supabase/migrations/20260602140000_finance_officer_role_and_requests.sql
  ```

- [ ] **Step 3: Verify the changes**
      Confirm the `finance_requests` table exists and the triggers are registered:

  ```sql
  SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'finance_requests';
  ```

- [ ] **Step 4: Commit to Git**
  ```bash
  git add supabase/migrations/
  git commit -m "feat(db): create finance_requests and setup FinanceOfficer policies"
  ```

---

### Task 2: Service Layer — Implement `financeService.ts`

**Files:**

- [NEW] `src/services/financeService.ts`

- [ ] **Step 1: Create the service file**
      Create `src/services/financeService.ts` with Supabase bindings:

  ```ts
  import { supabase } from '@/lib/supabase'

  export interface FinanceRequest {
    id: string
    requester_id: string
    request_type: 'BudgetAllocation' | 'ExpenseReimbursement' | 'InventoryReplenishment'
    chapter: string
    amount: number
    description: string
    status: 'Pending' | 'Approved' | 'Rejected'
    officer_comment: string | null
    reviewed_by: string | null
    created_at: string
    reviewed_at: string | null
    requester_name?: string
  }

  export const financeService = {
    async getRequests(): Promise<FinanceRequest[]> {
      const { data, error } = await supabase
        .from('finance_requests')
        .select(
          `
          *,
          users:requester_id (full_name)
        `
        )
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data ?? []).map((r: any) => ({
        ...r,
        requester_name: r.users?.full_name ?? 'Unknown User',
      }))
    },

    async createRequest(request: {
      request_type: FinanceRequest['request_type']
      chapter: string
      amount: number
      description: string
    }): Promise<FinanceRequest> {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('finance_requests')
        .insert({
          requester_id: user.id,
          request_type: request.request_type,
          chapter: request.chapter,
          amount: request.amount,
          description: request.description,
          status: 'Pending',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },

    async reviewRequest(
      requestId: string,
      status: 'Approved' | 'Rejected',
      comment: string
    ): Promise<void> {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('finance_requests')
        .update({
          status,
          officer_comment: comment,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (error) throw error
    },
  }
  ```

- [ ] **Step 2: Commit to Git**
  ```bash
  git add src/services/financeService.ts
  git commit -m "feat(services): implement financeService for approval workflows"
  ```

---

### Task 3: RBAC Frontend Scoping in Layout and Routing

**Files:**

- [MODIFY] `src/components/layouts/AdminLayout.tsx`
- [MODIFY] `src/routes.tsx`

- [ ] **Step 1: Update navigation link scoping inside `AdminLayout.tsx`**
      Modify the sidebar navigation filter logic inside `AdminLayout.tsx`. If the current admin's role is `FinanceOfficer`, filter the tabs so that only donations, spending ledger, store inventory, orders, and the new finance requests inbox are displayed.

  ```tsx
  // Inside AdminLayout.tsx menu filtering
  const tabs = allTabs.filter((tab) => {
    if (adminRole === 'FinanceOfficer') {
      return [
        'donations',
        'spending-ledger',
        'store-inventory',
        'orders',
        'finance-requests',
      ].includes(tab.id)
    }
    return true
  })
  ```

- [ ] **Step 2: Setup path routing inside `routes.tsx`**
      Register the `/admin/finance-requests` route and wrap it securely under the `AdminLayout` wrappers.

- [ ] **Step 3: Commit to Git**
  ```bash
  git add src/components/layouts/AdminLayout.tsx src/routes.tsx
  git commit -m "feat(rbac): scope AdminLayout tabs and add finance-requests route"
  ```

---

### Task 4: UI Components — Create the Centralized `FinanceRequests.tsx` Page

**Files:**

- [NEW] `src/pages/admin/FinanceRequests.tsx`

- [ ] **Step 1: Implement the UI Component**
      Create the React view in `src/pages/admin/FinanceRequests.tsx` featuring standard HSL CSS styles:
  - A **Requester Panel**: Form to submit requests, along with a list of historical requests with the comment feedback from the officer.
  - An **Officer Inbox Panel** (only visible to `FinanceOfficer` and `SuperAdmin` roles): Dashboard displaying incoming `Pending` requests with a modal interface allowing one-click **Approve** and **Reject** decisions requiring feedback comments.

- [ ] **Step 2: Perform build and TypeScript checks**
      Ensure the full application builds seamlessly and type checks without warnings:

  ```bash
  npm run typecheck
  npm run lint
  ```

- [ ] **Step 3: Commit and Push**
  ```bash
  git add src/pages/admin/FinanceRequests.tsx
  git commit -m "feat(ui): build FinanceRequests management panel"
  git push
  ```

---

## Self-Review

### Spec Coverage Check

| Spec Requirement                                                                   | Task / Step                     |
| ---------------------------------------------------------------------------------- | ------------------------------- |
| Limit `FinanceOfficer` role strictly to donations, expenses, inventory, and orders | Task 3 Step 1 ✅                |
| Create a central page for submitting internal messages/requests                    | Task 4 Step 1 ✅                |
| Allow the officer to Approve or Reject requests with feedback comments             | Task 2 Step 1, Task 4 Step 1 ✅ |
| Automatically record approved requests inside mobilization ledger                  | Task 1 Step 1 (DB trigger) ✅   |
| Keep local database migrations and reference documentation synced                  | Task 1 Step 1, Task 1 Step 4 ✅ |
