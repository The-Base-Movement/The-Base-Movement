-- Allow Regional Admins to fully manage (INSERT, UPDATE, DELETE, SELECT) entries in mobilization_ledger for their chapter
DROP POLICY IF EXISTS "Regional admins can view chapter ledger" ON public.mobilization_ledger;
DROP POLICY IF EXISTS "Regional admins can manage chapter ledger" ON public.mobilization_ledger;

CREATE POLICY "Regional admins can manage chapter ledger" ON public.mobilization_ledger
    FOR ALL
    USING (
        chapter IN (
            SELECT chapter FROM public.admins WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        chapter IN (
            SELECT chapter FROM public.admins WHERE id = auth.uid()
        )
    );
