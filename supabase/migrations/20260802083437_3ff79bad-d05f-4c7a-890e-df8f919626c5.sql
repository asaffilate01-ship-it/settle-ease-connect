DROP POLICY IF EXISTS "vault owner manages own files" ON storage.objects;
DROP POLICY IF EXISTS "vault deputy reads allowed files" ON storage.objects;
DROP POLICY IF EXISTS "staff reads vault files for verification" ON storage.objects;
DROP POLICY IF EXISTS "vault owner uploads own files" ON storage.objects;
DROP POLICY IF EXISTS "vault owner reads own files with assurance" ON storage.objects;
DROP POLICY IF EXISTS "vault owner updates own files with assurance" ON storage.objects;
DROP POLICY IF EXISTS "vault owner deletes own files with assurance" ON storage.objects;
DROP POLICY IF EXISTS "vault deputy reads allowed files with assurance" ON storage.objects;
DROP POLICY IF EXISTS "students upload own verification evidence" ON storage.objects;
DROP POLICY IF EXISTS "students read own verification evidence" ON storage.objects;
DROP POLICY IF EXISTS "assured staff read verification evidence" ON storage.objects;

CREATE POLICY "vault owner uploads own files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "vault owner reads own files with assurance"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'vault'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM public.vault_documents vd
       WHERE vd.id::text = (storage.foldername(name))[2]
         AND vd.owner_user_id = auth.uid()
         AND (NOT vd.is_sensitive OR auth.jwt()->>'aal' = 'aal2')
    )
  );

CREATE POLICY "vault owner updates own files with assurance"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'vault'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.jwt()->>'aal' = 'aal2'
  )
  WITH CHECK (
    bucket_id = 'vault'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.jwt()->>'aal' = 'aal2'
  );

CREATE POLICY "vault owner deletes own files with assurance"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'vault'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.jwt()->>'aal' = 'aal2'
  );

CREATE POLICY "vault deputy reads allowed files with assurance"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'vault'
    AND EXISTS (
      SELECT 1 FROM public.vault_documents vd
       WHERE vd.id::text = (storage.foldername(name))[2]
         AND vd.owner_user_id::text = (storage.foldername(name))[1]
         AND public.vault_deputy_can_read(auth.uid(), vd.owner_user_id, vd.category)
         AND (NOT vd.is_sensitive OR auth.jwt()->>'aal' = 'aal2')
    )
  );

CREATE POLICY "students upload own verification evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'student-verifications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "students read own verification evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-verifications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "assured staff read verification evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-verifications'
    AND public.is_internal(auth.uid())
    AND auth.jwt()->>'aal' = 'aal2'
  );