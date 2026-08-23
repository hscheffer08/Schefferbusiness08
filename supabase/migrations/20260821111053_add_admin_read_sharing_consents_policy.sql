-- Allow admins to read all sharing_consents rows (currently only own-user SELECT works)
CREATE POLICY "admin_read_sharing_consents"
  ON sharing_consents FOR SELECT
  TO authenticated
  USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);
