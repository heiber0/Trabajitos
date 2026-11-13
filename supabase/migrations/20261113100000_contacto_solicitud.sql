-- Perfil público de un prestador (nunca incluye el teléfono)
create or replace function perfil_prestador_publico(p_id uuid)
returns table (
  perfil_id uuid, nombre text, oficio text, descripcion text, anios_experiencia int,
  tarifa_referencia int, ciudad text, verificado boolean, promedio numeric, total_valoraciones int
)
language sql stable security definer set search_path = public as $$
  select p.perfil_id, pf.nombre, o.nombre, p.descripcion, p.anios_experiencia,
         p.tarifa_referencia, p.ciudad, p.verificado, p.promedio, p.total_valoraciones
  from prestadores p
  join perfiles pf on pf.id = p.perfil_id
  left join oficios o on o.id = p.oficio_id
  where p.perfil_id = p_id
    and (p.verificado or p.perfil_id = auth.uid() or es_admin());
$$;

grant execute on function perfil_prestador_publico(uuid) to anon, authenticated;

-- La búsqueda debe seguir funcionando cuando perfiles deje de ser pública
create or replace function prestadores_cercanos(
  p_lat double precision,
  p_lng double precision,
  p_oficio int default null,
  p_radio_km double precision default 5
)
returns table (
  perfil_id uuid,
  nombre text,
  oficio_id int,
  tarifa_referencia int,
  promedio numeric,
  total_valoraciones int,
  distancia_km double precision
)
language sql stable security definer set search_path = public as $$
  with base as (
    select
      p.perfil_id, pf.nombre, p.oficio_id, p.tarifa_referencia,
      p.promedio, p.total_valoraciones,
      6371 * 2 * asin(sqrt(
        power(sin((radians(p.lat) - radians(p_lat)) / 2), 2) +
        cos(radians(p_lat)) * cos(radians(p.lat)) *
        power(sin((radians(p.lng) - radians(p_lng)) / 2), 2)
      )) as km
    from prestadores p
    join perfiles pf on pf.id = p.perfil_id
    where p.verificado
      and p.lat is not null and p.lng is not null
      and (p_oficio is null or p.oficio_id = p_oficio)
  )
  select perfil_id, nombre, oficio_id, tarifa_referencia, promedio, total_valoraciones, km
  from base
  where km <= p_radio_km
  order by km;
$$;

grant execute on function prestadores_cercanos(double precision, double precision, int, double precision)
  to anon, authenticated;

-- Contacto de la otra parte de una solicitud, solo desde que está aceptada
create or replace function contacto_solicitud(p_solicitud uuid)
returns table (nombre text, telefono text, whatsapp text)
language plpgsql stable security definer set search_path = public as $$
declare
  v_cliente uuid;
  v_prestador uuid;
  v_estado text;
  v_objetivo uuid;
  v_nombre text;
  v_tel text;
  v_digitos text;
begin
  if auth.uid() is null then
    return;
  end if;

  select s.cliente_id, s.prestador_id, s.estado
  into v_cliente, v_prestador, v_estado
  from solicitudes s where s.id = p_solicitud;
  if not found then
    return;
  end if;

  if v_estado not in ('aceptada', 'en_curso', 'finalizada') then
    return;
  end if;

  if auth.uid() = v_cliente then
    v_objetivo := v_prestador;
  elsif auth.uid() = v_prestador then
    v_objetivo := v_cliente;
  else
    return;
  end if;

  select case when v_objetivo = v_cliente then split_part(pf.nombre, ' ', 1) else pf.nombre end,
         pf.telefono
  into v_nombre, v_tel
  from perfiles pf where pf.id = v_objetivo;

  v_digitos := regexp_replace(coalesce(v_tel, ''), '\D', '', 'g');
  nombre := v_nombre;
  telefono := v_tel;
  if v_digitos ~ '^3[0-9]{9}$' then
    whatsapp := '57' || v_digitos;
  elsif v_digitos ~ '^573[0-9]{9}$' then
    whatsapp := v_digitos;
  else
    whatsapp := null;
  end if;
  return next;
end; $$;

revoke execute on function contacto_solicitud(uuid) from public, anon;
grant execute on function contacto_solicitud(uuid) to authenticated;