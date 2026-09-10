// Stable public tutor route.
// Delegate directly to the resilient public core so stale/placeholder Supabase
// environment values in older enrichment layers cannot break user requests.
export { default } from './education-tutor-public.js';
