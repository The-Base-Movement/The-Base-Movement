-- voice_notes_select checked EXISTS(any message referencing this file),
-- not that the requesting user is a participant of that message's
-- conversation. Any authenticated member could list()/query storage.objects
-- for the voice-notes bucket and enumerate + fetch every voice note ever
-- sent platform-wide, not just their own conversations. Scope it the same
-- way messages_select already is.

DROP POLICY IF EXISTS "voice_notes_select" ON storage.objects;

CREATE POLICY "voice_notes_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-notes'
  AND EXISTS (
    SELECT 1
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE m.audio_url = objects.name
      AND (
        c.member_id = auth.uid()
        OR c.leader_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM group_conversation_members gcm
          WHERE gcm.conversation_id = m.conversation_id
            AND gcm.user_id = auth.uid()
        )
        OR is_admin()
      )
  )
);
