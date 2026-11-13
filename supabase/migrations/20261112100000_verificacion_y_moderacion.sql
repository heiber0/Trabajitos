-- =========================================
-- A. VERIFICACIÓN DE PRESTADORES
-- =========================================
alter table prestadores
  add column if not exists estado_verificacion text not null default 'sin_enviar',
  add column if not exists motivo_rechazo text,
  add column if not exists documento_ruta text,
  add column if not exists verificado_por uuid references perfiles on delete set null,
  add column if not exists verificado_en timestamptz;

alter table prestadores drop constraint if exists prestadores_estado_verificacion_valido;
alter table prestadores add constraint prestadores_estado_verificacion_valido
  check (estado_verificacion in ('sin_enviar','en_revision','verificado','rechazado'));

-- Los ya verificados quedan en estado "verificado"
update prestadores set estado_verificacion = 'verificado'
where verificado and estado_verificacion = 'sin_enviar';

-- verificado solo es verdadero si el estado es "verificado"
alter table prestadores drop constraint if exists prestadores_verificado_coherente;
alter table prestadores add constraint prestadores_verificado_coherente
  check (verificado = (estado_verificacion = 'verificado'));

-- Cierra huecos: nadie se crea a sí mismo verificado ni con reputación inventada
drop policy if exists "prestadores_crear_propio" on prestadores;
create policy "prestadores_crear_propio" on prestadores for insert with check (
  perfil_id = auth.uid()
  and verificado = false
  and estado_verificacion = 'sin_enviar'
  and documento_ruta is null
  and verificado_por is null
  and promedio = 0
  and total_valoraciones = 0
);

-- Protege los campos de verificación y la reputación calculada
create or replace function proteger_verificacion() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Sin sesión de usuario (SQL Editor) o administrador: sin restricción
  if auth.uid() is null or es_admin() then
    return new;
  end if;

  -- promedio y total solo los recalcula el sistema (trigger de valoraciones, profundidad 2)
  if (new.promedio is distinct from old.promedio
      or new.total_valoraciones is distinct from old.total_valoraciones)
     and pg_trigger_depth() = 1 then
    raise exception 'Estos datos los calcula el sistema';
  end if;

  if new.verificado_por is distinct from old.verificado_por
     or new.verificado_en is distinct from old.verificado_en
     or new.motivo_rechazo is distinct from old.motivo_rechazo then
    raise exception 'Solo un administrador puede modificar estos datos de verificación';
  end if;

  if new.documento_ruta is distinct from old.documento_ruta
     and old.estado_verificacion not in ('sin_enviar','rechazado') then
    raise exception 'No puedes cambiar el documento mientras está en revisión o verificado';
  end if;

  if new.estado_verificacion is distinct from old.estado_verificacion then
    if not (old.estado_verificacion in ('sin_enviar','rechazado')
            and new.estado_verificacion = 'en_revision'
            and new.documento_ruta is not null) then
      raise exception 'Cambio de estado de verificación no permitido';
    end if;
  end if;

  return new;
end; $$;

drop trigger if exists trg_proteger_verificacion on prestadores;
create trigger trg_proteger_verificacion before update on prestadores
for each row execute function proteger_verificacion();

-- Bucket privado de documentos: creación automática, tipos y tamaño, y quién sube y quién ve
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos',
  'documentos',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 15728640,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "documentos_subir_propios" on storage.objects;
create policy "documentos_subir_propios" on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documentos_ver" on storage.objects;
create policy "documentos_ver" on storage.objects for select to authenticated
  using (bucket_id = 'documentos'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin()));

-- Lista para el administrador
create or replace function prestadores_por_verificar(p_estado text default 'en_revision')
returns table (
  perfil_id uuid, nombre text, telefono text, oficio text, descripcion text,
  anios_experiencia int, tarifa_referencia int, tiene_ubicacion boolean,
  estado_verificacion text, motivo_rechazo text, documento_ruta text,
  verificado_en timestamptz, creado_en timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not es_admin() then
    raise exception 'Solo un administrador puede ver esta lista';
  end if;
  return query
  select p.perfil_id, pf.nombre, pf.telefono, o.nombre, p.descripcion, p.anios_experiencia,
         p.tarifa_referencia, (p.lat is not null and p.lng is not null),
         p.estado_verificacion, p.motivo_rechazo, p.documento_ruta, p.verificado_en, pf.creado_en
  from prestadores p
  join perfiles pf on pf.id = p.perfil_id
  left join oficios o on o.id = p.oficio_id
  where p.estado_verificacion = p_estado
  order by pf.creado_en
  limit 200;
end; $$;

grant execute on function prestadores_por_verificar(text) to authenticated;

-- Aprobar, rechazar o revocar
create or replace function decidir_verificacion(
  p_prestador uuid, p_aprobar boolean, p_motivo text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_estado text;
  v_doc text;
begin
  if not es_admin() then
    raise exception 'Solo un administrador puede verificar prestadores';
  end if;

  select estado_verificacion, documento_ruta into v_estado, v_doc
  from prestadores where perfil_id = p_prestador;
  if not found then
    raise exception 'Prestador no encontrado';
  end if;

  if p_aprobar then
    if v_estado <> 'en_revision' or v_doc is null then
      raise exception 'Solo se aprueba un prestador con documento en revisión';
    end if;
    update prestadores
    set verificado = true, estado_verificacion = 'verificado', motivo_rechazo = null,
        verificado_por = auth.uid(), verificado_en = now()
    where perfil_id = p_prestador;
  else
    if p_motivo is null or char_length(btrim(p_motivo)) < 10 then
      raise exception 'Escribe el motivo del rechazo (mínimo 10 caracteres)';
    end if;
    if v_estado not in ('en_revision','verificado') then
      raise exception 'Este prestador no tiene una verificación para rechazar';
    end if;
    update prestadores
    set verificado = false, estado_verificacion = 'rechazado', motivo_rechazo = btrim(p_motivo),
        verificado_por = auth.uid(), verificado_en = now()
    where perfil_id = p_prestador;
  end if;
end; $$;

grant execute on function decidir_verificacion(uuid, boolean, text) to authenticated;

-- =========================================
-- B. MODERACIÓN DE COMENTARIOS
-- =========================================
alter table valoraciones
  add column if not exists oculta boolean not null default false,
  add column if not exists oculta_por uuid references perfiles on delete set null,
  add column if not exists oculta_en timestamptz,
  add column if not exists oculta_motivo text;

alter table reportes
  add column if not exists resuelto_por uuid references perfiles on delete set null,
  add column if not exists resuelto_en timestamptz,
  add column if not exists resolucion text;

alter table reportes drop constraint if exists reportes_estado_valido;
alter table reportes add constraint reportes_estado_valido
  check (estado in ('abierto','ocultado','descartado'));

-- Un comentario oculto solo lo ven su autor y el administrador (el público lo ve enmascarado)
drop policy if exists "valoraciones_ver" on valoraciones;
create policy "valoraciones_ver" on valoraciones for select using (
  not oculta or es_admin() or cliente_id = auth.uid()
);

-- Solo se valora al prestador que atendió ESE servicio
drop policy if exists "valoraciones_crear_regla" on valoraciones;
create policy "valoraciones_crear_regla" on valoraciones for insert with check (
  cliente_id = auth.uid()
  and exists (
    select 1 from solicitudes s
    where s.id = solicitud_id
      and s.cliente_id = auth.uid()
      and s.prestador_id = valoraciones.prestador_id
      and s.estado = 'finalizada'
  )
);

-- Versión completa del trigger de valoraciones, ahora con moderación
create or replace function proteger_valoracion() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.solicitud_id is distinct from old.solicitud_id
     or new.cliente_id is distinct from old.cliente_id
     or new.prestador_id is distinct from old.prestador_id
     or new.puntualidad is distinct from old.puntualidad
     or new.calidad is distinct from old.calidad
     or new.precio is distinct from old.precio
     or new.trato is distinct from old.trato
     or new.comentario is distinct from old.comentario
     or new.creado_en is distinct from old.creado_en then
    raise exception 'Una valoración no se puede modificar';
  end if;

  if new.oculta is distinct from old.oculta
     or new.oculta_por is distinct from old.oculta_por
     or new.oculta_en is distinct from old.oculta_en
     or new.oculta_motivo is distinct from old.oculta_motivo then
    if not es_admin() then
      raise exception 'Solo un administrador puede moderar comentarios';
    end if;
    if old.oculta and not new.oculta then
      raise exception 'Un comentario oculto no se vuelve a mostrar';
    end if;
  end if;

  if new.respuesta is distinct from old.respuesta then
    if auth.uid() is distinct from old.prestador_id then
      raise exception 'Solo el prestador puede responder';
    end if;
    if old.respuesta is not null then
      raise exception 'Ya respondiste este comentario';
    end if;
    if new.respuesta is null
       or char_length(btrim(new.respuesta)) < 3
       or char_length(new.respuesta) > 500 then
      raise exception 'La respuesta debe tener entre 3 y 500 caracteres';
    end if;
  end if;

  return new;
end; $$;

-- Reseñas públicas: el comentario oculto se enmascara, la calificación se conserva
drop function if exists resenas_prestador(uuid);
create function resenas_prestador(p_prestador uuid)
returns table (
  id uuid, nombre_cliente text, puntualidad int, calidad int, precio int, trato int,
  comentario text, respuesta text, oculta boolean, creado_en timestamptz
)
language sql stable security definer set search_path = public as $$
  select v.id, split_part(pf.nombre, ' ', 1), v.puntualidad, v.calidad, v.precio, v.trato,
         case when v.oculta then null else v.comentario end,
         case when v.oculta then null else v.respuesta end,
         v.oculta, v.creado_en
  from valoraciones v
  join perfiles pf on pf.id = v.cliente_id
  where v.prestador_id = p_prestador
  order by v.creado_en desc
  limit 100;
$$;

grant execute on function resenas_prestador(uuid) to anon, authenticated;

-- Cola de reportes para el administrador
create or replace function reportes_para_revisar(p_estado text default 'abierto')
returns table (
  reporte_id uuid, estado text, motivo text, creado_en timestamptz, reportante text,
  valoracion_id uuid, comentario text, respuesta text, oculta boolean,
  autor text, prestador text, resuelto_en timestamptz, resolucion text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not es_admin() then
    raise exception 'Solo un administrador puede ver los reportes';
  end if;
  return query
  select r.id, r.estado, r.motivo, r.creado_en, pr.nombre,
         v.id, v.comentario, v.respuesta, v.oculta,
         pa.nombre, pp.nombre, r.resuelto_en, r.resolucion
  from reportes r
  join valoraciones v on v.id = r.valoracion_id
  join perfiles pa on pa.id = v.cliente_id
  join perfiles pp on pp.id = v.prestador_id
  left join perfiles pr on pr.id = r.reportado_por
  where (p_estado = 'abierto') = (r.estado = 'abierto')
  order by r.creado_en desc
  limit 200;
end; $$;

grant execute on function reportes_para_revisar(text) to authenticated;

-- Ocultar el comentario o descartar el reporte
create or replace function moderar_reporte(
  p_reporte uuid, p_accion text, p_nota text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_val uuid;
  v_estado text;
begin
  if not es_admin() then
    raise exception 'Solo un administrador puede moderar';
  end if;
  if p_accion not in ('ocultar','descartar') then
    raise exception 'Acción no válida';
  end if;

  select valoracion_id, estado into v_val, v_estado from reportes where id = p_reporte;
  if not found then
    raise exception 'Reporte no encontrado';
  end if;
  if v_estado <> 'abierto' then
    raise exception 'Este reporte ya fue resuelto';
  end if;

  if p_accion = 'ocultar' then
    if p_nota is null or char_length(btrim(p_nota)) < 5 then
      raise exception 'Escribe el motivo de la decisión (mínimo 5 caracteres)';
    end if;
    update valoraciones
    set oculta = true, oculta_por = auth.uid(), oculta_en = now(), oculta_motivo = btrim(p_nota)
    where id = v_val and not oculta;
    update reportes
    set estado = 'ocultado', resuelto_por = auth.uid(), resuelto_en = now(), resolucion = btrim(p_nota)
    where valoracion_id = v_val and estado = 'abierto';
  else
    update reportes
    set estado = 'descartado', resuelto_por = auth.uid(), resuelto_en = now(),
        resolucion = nullif(btrim(coalesce(p_nota, '')), '')
    where id = p_reporte;
  end if;
end; $$;

grant execute on function moderar_reporte(uuid, text, text) to authenticated;