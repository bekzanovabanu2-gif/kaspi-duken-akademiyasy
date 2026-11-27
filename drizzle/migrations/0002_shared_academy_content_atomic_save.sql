CREATE TABLE public.academy_materials (id text PRIMARY KEY, title text NOT NULL, published boolean NOT NULL DEFAULT false, position integer NOT NULL DEFAULT 0, data jsonb NOT NULL DEFAULT '{}'::jsonb);
GRANT SELECT ON public.academy_materials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_materials TO authenticated;
GRANT ALL ON public.academy_materials TO service_role;
ALTER TABLE public.academy_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read published materials" ON public.academy_materials FOR SELECT TO anon, authenticated USING (published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage materials" ON public.academy_materials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TABLE public.academy_quizzes (id text PRIMARY KEY, title text NOT NULL, published boolean NOT NULL DEFAULT false, position integer NOT NULL DEFAULT 0, data jsonb NOT NULL DEFAULT '{}'::jsonb);
GRANT SELECT ON public.academy_quizzes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_quizzes TO authenticated;
GRANT ALL ON public.academy_quizzes TO service_role;
ALTER TABLE public.academy_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read published quizzes" ON public.academy_quizzes FOR SELECT TO anon, authenticated USING (published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage quizzes" ON public.academy_quizzes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TABLE public.academy_announcements (id text PRIMARY KEY, title text NOT NULL, published boolean NOT NULL DEFAULT false, position integer NOT NULL DEFAULT 0, data jsonb NOT NULL DEFAULT '{}'::jsonb);
GRANT SELECT ON public.academy_announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_announcements TO authenticated;
GRANT ALL ON public.academy_announcements TO service_role;
ALTER TABLE public.academy_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read published announcements" ON public.academy_announcements FOR SELECT TO anon, authenticated USING (published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage announcements" ON public.academy_announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TABLE public.academy_content_revision (id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), version bigint NOT NULL DEFAULT 0);
GRANT SELECT ON public.academy_content_revision TO anon;
GRANT SELECT, INSERT, UPDATE ON public.academy_content_revision TO authenticated;
GRANT ALL ON public.academy_content_revision TO service_role;
ALTER TABLE public.academy_content_revision ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read content revision" ON public.academy_content_revision FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update content revision" ON public.academy_content_revision FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
ALTER POLICY "Anyone reads published lessons" ON public.academy_lessons USING (public.has_role(auth.uid(), 'admin') OR (published AND (module_id IS NULL OR EXISTS (SELECT 1 FROM public.academy_modules m WHERE m.id = module_id AND m.published))));
CREATE OR REPLACE FUNCTION public.is_published_lesson_media(_name text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM public.academy_lessons l WHERE l.published AND (l.module_id IS NULL OR EXISTS (SELECT 1 FROM public.academy_modules m WHERE m.id=l.module_id AND m.published)) AND (l.video_path=_name OR l.resources @> jsonb_build_array(jsonb_build_object('path',_name)))) OR EXISTS (SELECT 1 FROM public.academy_materials m WHERE m.published AND m.data->>'filePath'=_name)
$$;
CREATE OR REPLACE FUNCTION public.get_academy_content() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
 SELECT jsonb_build_object('version',COALESCE((SELECT version FROM public.academy_content_revision WHERE id=1),0),'modules',COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY position,id) FROM public.academy_modules m),'[]'::jsonb),'lessons',COALESCE((SELECT jsonb_agg(to_jsonb(l) ORDER BY position,id) FROM public.academy_lessons l),'[]'::jsonb),'materials',COALESCE((SELECT jsonb_agg(data || jsonb_build_object('id',id,'title',title,'published',published) ORDER BY position,id) FROM public.academy_materials),'[]'::jsonb),'quizzes',COALESCE((SELECT jsonb_agg(data || jsonb_build_object('id',id,'title',title,'published',published) ORDER BY position,id) FROM public.academy_quizzes),'[]'::jsonb),'announcements',COALESCE((SELECT jsonb_agg(data || jsonb_build_object('id',id,'title',title,'published',published) ORDER BY position,id) FROM public.academy_announcements),'[]'::jsonb))
$$;
GRANT EXECUTE ON FUNCTION public.get_academy_content() TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.save_academy_content(_content jsonb, _version bigint) RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE current_version bigint; item jsonb; idx integer; kind text;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(726413);
 SELECT COALESCE((SELECT version FROM public.academy_content_revision WHERE id=1),0) INTO current_version;
 IF current_version <> _version THEN RAISE EXCEPTION 'CONTENT_CONFLICT'; END IF;
 FOREACH kind IN ARRAY ARRAY['modules','lessons','materials','quizzes','announcements'] LOOP
  IF jsonb_typeof(_content->kind) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'INVALID_CONTENT'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(_content->kind) v WHERE COALESCE(trim(v->>'id'),'')='' OR COALESCE(trim(v->>'title'),'')='') THEN RAISE EXCEPTION 'INVALID_CONTENT'; END IF;
 END LOOP;
 idx:=0;
 FOR item IN SELECT value FROM jsonb_array_elements(_content->'modules') LOOP
  INSERT INTO public.academy_modules(id,title,description,published,position,updated_at) VALUES(item->>'id',item->>'title',COALESCE(item->>'description',''),COALESCE((item->>'published')::boolean,true),idx,now()) ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,published=EXCLUDED.published,position=EXCLUDED.position,updated_at=EXCLUDED.updated_at; idx:=idx+1;
 END LOOP;
 idx:=0;
 FOR item IN SELECT value FROM jsonb_array_elements(_content->'lessons') LOOP
  IF item->>'moduleId' IS NOT NULL AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(_content->'modules') m WHERE m->>'id'=item->>'moduleId') THEN RAISE EXCEPTION 'INVALID_MODULE'; END IF;
  INSERT INTO public.academy_lessons(id,module_id,title,description,category,duration,cover,video_url,video_path,video_name,content,resources,published,position,updated_at) VALUES(item->>'id',item->>'moduleId',item->>'title',COALESCE(item->>'description',''),COALESCE(item->>'category',''),COALESCE((item->>'duration')::integer,5),COALESCE(item->>'cover',''),COALESCE(item->>'videoUrl',''),item->>'videoPath',item->>'videoName',COALESCE(item->>'content',''),COALESCE(item->'resources','[]'::jsonb),COALESCE((item->>'published')::boolean,false),idx,now()) ON CONFLICT(id) DO UPDATE SET module_id=EXCLUDED.module_id,title=EXCLUDED.title,description=EXCLUDED.description,category=EXCLUDED.category,duration=EXCLUDED.duration,cover=EXCLUDED.cover,video_url=EXCLUDED.video_url,video_path=EXCLUDED.video_path,video_name=EXCLUDED.video_name,content=EXCLUDED.content,resources=EXCLUDED.resources,published=EXCLUDED.published,position=EXCLUDED.position,updated_at=EXCLUDED.updated_at; idx:=idx+1;
 END LOOP;
 FOREACH kind IN ARRAY ARRAY['materials','quizzes','announcements'] LOOP
  idx:=0;
  FOR item IN SELECT value FROM jsonb_array_elements(_content->kind) LOOP
   EXECUTE format('INSERT INTO public.academy_%I(id,title,published,position,data) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,published=EXCLUDED.published,position=EXCLUDED.position,data=EXCLUDED.data',kind) USING item->>'id',item->>'title',COALESCE((item->>'published')::boolean,kind='materials'),idx,item; idx:=idx+1;
  END LOOP;
  EXECUTE format('DELETE FROM public.academy_%I WHERE id NOT IN (SELECT value->>''id'' FROM jsonb_array_elements($1))',kind) USING _content->kind;
 END LOOP;
 DELETE FROM public.academy_lessons WHERE id NOT IN (SELECT value->>'id' FROM jsonb_array_elements(_content->'lessons'));
 DELETE FROM public.academy_modules WHERE id NOT IN (SELECT value->>'id' FROM jsonb_array_elements(_content->'modules'));
 INSERT INTO public.academy_content_revision(id,version) VALUES(1,current_version+1) ON CONFLICT(id) DO UPDATE SET version=EXCLUDED.version;
 RETURN current_version+1;
END
$$;
REVOKE ALL ON FUNCTION public.save_academy_content(jsonb,bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_academy_content(jsonb,bigint) TO authenticated;