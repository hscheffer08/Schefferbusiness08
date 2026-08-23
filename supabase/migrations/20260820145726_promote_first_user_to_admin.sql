/*
# Promote first user to admin

1. Security
- Sets raw_app_meta_data.role = 'admin' for the existing user
  hscheffer08@gmail.com so they can access the admin panel.
- app_metadata is the trusted location for authorization claims (not user_metadata).
*/

UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'hscheffer08@gmail.com';
