alter table public.apps add column if not exists icon_url text, add column if not exists screenshot_urls text[] not null default '{}';
-- private bucket "app-media" (5MB); anyone may upload images and view them via signed links
create policy "Anyone can upload app media images" on storage.objects for insert to anon, authenticated with check (bucket_id = 'app-media' and (storage.extension(name) in ('png','jpg','jpeg','webp','gif','svg')));
create policy "Anyone can view app media images" on storage.objects for select to anon, authenticated using (bucket_id = 'app-media');
