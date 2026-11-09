-- Reseñas públicas: solo el primer nombre del cliente
create or replace function resenas_prestador(p_prestador uuid)
returns table (
  id uuid,
  nombre_cliente text,
  puntualidad int,
  calidad int,
  precio int,
  trato int,
  comentario text,
  respuesta text,
  creado_en timestamptz
)
language sql stable security definer set search_path = public as $$
  select v.id, split_part(pf.nombre, ' ', 1), v.puntualidad, v.calidad,
         v.precio, v.trato, v.comentario, v.respuesta, v.creado_en
  from valoraciones v
  join perfiles pf on pf.id = v.cliente_id
  where v.prestador_id = p_prestador
  order by v.creado_en desc
  limit 100;
$$;

grant execute on function resenas_prestador(uuid) to anon, authenticated;

-- Fotos de trabajos: cada prestador gestiona solo su carpeta
create policy "trabajos_ver_propias" on storage.objects for select to authenticated
  using (bucket_id = 'trabajos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "trabajos_subir_propias" on storage.objects for insert to authenticated
  with check (bucket_id = 'trabajos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "trabajos_borrar_propias" on storage.objects for delete to authenticated
  using (bucket_id = 'trabajos' and (storage.foldername(name))[1] = auth.uid()::text);