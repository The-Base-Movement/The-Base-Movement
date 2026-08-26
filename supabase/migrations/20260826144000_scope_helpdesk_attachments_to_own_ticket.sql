-- helpdesk_attach_insert had no scoping at all beyond bucket_id -- any
-- authenticated member could upload into any path, including another
-- member's ticket folder ("${ticket.id}/...") if they knew/guessed the
-- ticket UUID. Lower severity than the other findings (private bucket,
-- SELECT already admin-only, UUIDs aren't guessable), but scoping it
-- properly rather than leaving it: the uploader must either own the
-- ticket (submitted_by), handle its department, or be an admin.

DROP POLICY IF EXISTS "helpdesk_attach_insert" ON storage.objects;

CREATE POLICY "helpdesk_attach_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'helpdesk-attachments'
  AND EXISTS (
    SELECT 1 FROM public.helpdesk_tickets t
    WHERE t.id::text = (storage.foldername(name))[1]
      AND (
        t.submitted_by = auth.uid()
        OR is_helpdesk_handler(t.department_id)
        OR is_admin()
      )
  )
);
