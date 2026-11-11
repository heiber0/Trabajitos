-- Solo se puede solicitar a prestadores verificados
drop policy if exists "solicitudes_crear" on solicitudes;
create policy "solicitudes_crear" on solicitudes for insert with check (
  cliente_id = auth.uid()
  and estado = 'pendiente'
  and exists (select 1 from prestadores p where p.perfil_id = prestador_id and p.verificado)
);

-- Lista de solicitudes del usuario actual, con nombres para mostrar
-- El cliente ve el nombre completo del prestador y el primer nombre del cliente
create or replace function mis_solicitudes()
returns table (
  id uuid,
  rol_yo text,
  cliente_nombre text,
  prestador_id uuid,
  prestador_nombre text,
  oficio text,
  descripcion text,
  direccion text,
  fecha_programada timestamptz,
  estado text,
  precio_acordado int,
  creado_en timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    s.id,
    case when s.cliente_id = auth.uid() then 'cliente' else 'prestador' end,
    split_part(pc.nombre, ' ', 1),
    s.prestador_id,
    pp.nombre,
    o.nombre,
    s.descripcion,
    s.direccion,
    s.fecha_programada,
    s.estado,
    s.precio_acordado,
    s.creado_en
  from solicitudes s
  join perfiles pc on pc.id = s.cliente_id
  join perfiles pp on pp.id = s.prestador_id
  join prestadores p on p.perfil_id = s.prestador_id
  left join oficios o on o.id = p.oficio_id
  where s.cliente_id = auth.uid() or s.prestador_id = auth.uid()
  order by s.creado_en desc;
$$;

grant execute on function mis_solicitudes() to authenticated;