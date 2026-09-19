-- Original files are private. The course password is validated by essay-course-access.
begin;
alter table public.essay_course_modules add column if not exists slug text;
alter table public.essay_course_modules add column if not exists category text;
alter table public.essay_course_modules add column if not exists learning_content jsonb not null default '{}'::jsonb;
create unique index if not exists essay_course_modules_slug_unique on public.essay_course_modules(slug);
-- Avoid a direct auth.users lookup in a client-facing policy.
drop policy if exists admin_crud_essay_modules on public.essay_course_modules;
create policy admin_crud_essay_modules on public.essay_course_modules for all to authenticated
using ((select auth.jwt())->'app_metadata'->>'role' = 'admin')
with check ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
create table if not exists public.essay_course_materials (
 id uuid primary key default gen_random_uuid(), module_id uuid not null references public.essay_course_modules(id),
 source_library_id text not null unique, file_name text not null, storage_path text not null,
 mime_type text not null, size_bytes bigint not null check(size_bytes>0), sha256 text not null,
 is_duplicate boolean not null default false, created_at timestamptz not null default now()
);
alter table public.essay_course_materials enable row level security;
create policy essay_materials_read on public.essay_course_materials for select to authenticated
using (public.has_essay_course_access() and exists (select 1 from public.essay_course_modules m where m.id=module_id and m.status='published'));
create policy essay_materials_admin on public.essay_course_materials for all to authenticated
using ((select auth.jwt())->'app_metadata'->>'role' = 'admin') with check ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
grant select on public.essay_course_materials to authenticated;
create table if not exists public.essay_course_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 module_id uuid not null references public.essay_course_modules(id),
 completed boolean not null default false,
 draft jsonb not null default '{}'::jsonb check (octet_length(draft::text)<60000),
 updated_at timestamptz not null default now(), primary key(user_id,module_id)
);
alter table public.essay_course_progress enable row level security;
create policy essay_progress_read on public.essay_course_progress for select to authenticated
using ((select auth.uid())=user_id and public.has_essay_course_access());
create policy essay_progress_insert on public.essay_course_progress for insert to authenticated
with check ((select auth.uid())=user_id and public.has_essay_course_access());
create policy essay_progress_update on public.essay_course_progress for update to authenticated
using ((select auth.uid())=user_id and public.has_essay_course_access())
with check ((select auth.uid())=user_id and public.has_essay_course_access());
grant select,insert,update on public.essay_course_progress to authenticated;
create policy essay_originals_course_read on storage.objects for select to authenticated
using (bucket_id='essay-course-materials' and public.has_essay_course_access() and exists (
 select 1 from public.essay_course_materials a join public.essay_course_modules m on m.id=a.module_id
 where a.storage_path=name and m.status='published'
));
grant select on public.essay_course_modules to authenticated;
commit;
