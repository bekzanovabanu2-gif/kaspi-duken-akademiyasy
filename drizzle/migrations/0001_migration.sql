create or replace function public.is_published_lesson_media(_name text)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.academy_lessons l
    where l.published and (l.video_path = _name or l.resources @> jsonb_build_array(jsonb_build_object('path', _name)))
  )
$$;
create policy "Read published lesson media" on storage.objects for select to anon, authenticated
using (bucket_id = 'lesson-media' and (public.is_published_lesson_media(name) or public.has_role(auth.uid(), 'admin')));