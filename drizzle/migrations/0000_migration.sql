create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

-- The first account ever created becomes the academy admin.
create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_role after insert on auth.users for each row execute function public.handle_new_user_role();

create table public.academy_modules (
  id text primary key,
  title text not null,
  description text not null default '',
  published boolean not null default false,
  position integer not null default 0,
  updated_at timestamptz not null default now()
);
grant select on public.academy_modules to anon, authenticated;
grant insert, update, delete on public.academy_modules to authenticated;
grant all on public.academy_modules to service_role;
alter table public.academy_modules enable row level security;
create policy "Anyone reads published modules" on public.academy_modules for select to anon, authenticated using (published or public.has_role(auth.uid(), 'admin'));
create policy "Admins insert modules" on public.academy_modules for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update modules" on public.academy_modules for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete modules" on public.academy_modules for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.academy_lessons (
  id text primary key,
  module_id text,
  title text not null,
  description text not null default '',
  category text not null default '',
  duration integer not null default 5,
  cover text not null default '',
  video_url text not null default '',
  video_path text,
  video_name text,
  content text not null default '',
  resources jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  position integer not null default 0,
  updated_at timestamptz not null default now()
);
grant select on public.academy_lessons to anon, authenticated;
grant insert, update, delete on public.academy_lessons to authenticated;
grant all on public.academy_lessons to service_role;
alter table public.academy_lessons enable row level security;
create policy "Anyone reads published lessons" on public.academy_lessons for select to anon, authenticated using (published or public.has_role(auth.uid(), 'admin'));
create policy "Admins insert lessons" on public.academy_lessons for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update lessons" on public.academy_lessons for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete lessons" on public.academy_lessons for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "Admins upload lesson media" on storage.objects for insert to authenticated with check (bucket_id = 'lesson-media' and public.has_role(auth.uid(), 'admin'));
create policy "Admins update lesson media" on storage.objects for update to authenticated using (bucket_id = 'lesson-media' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete lesson media" on storage.objects for delete to authenticated using (bucket_id = 'lesson-media' and public.has_role(auth.uid(), 'admin'));