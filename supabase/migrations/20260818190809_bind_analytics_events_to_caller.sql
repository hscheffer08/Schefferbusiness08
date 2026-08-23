/*
  # Bind analytics events to the caller

  1. Problem
     - `insert_analytics` used `WITH CHECK (true)` and `analytics_events.user_id` had no
       default or constraint, so any caller could insert unlimited rows attributing
       fabricated activity to any account and poison every admin dashboard figure.

  2. Changes
     - Replace the policy so the owner column must be either null (anonymous visitor) or
       the caller's own id.

  3. Security
     - Anonymous event logging still works; forging another account's activity does not.
*/

DROP POLICY IF EXISTS "insert_analytics" ON public.analytics_events;

CREATE POLICY "insert_own_analytics"
  ON public.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
