-- =========================================
-- TABLAS
-- =========================================
create table perfiles (
  id uuid primary key references auth.users on delete cascade,
  rol text not null check (rol in ('cliente','prestador','admin')),
  nombre text not null,
  telefono text,
  avatar_url text,
  creado_en timestamptz default now()
);

create table oficios (
  id serial primary key,
  nombre text unique not null
);

create table prestadores (
  perfil_id uuid primary key references perfiles on delete cascade,
  oficio_id int references oficios,
  descripcion text,
  anios_experiencia int default 0,
  tarifa_referencia int,
  ciudad text default 'Riohacha',
  lat double precision,
  lng double precision,
  verificado boolean default false,
  promedio numeric(3,2) default 0,
  total_valoraciones int default 0
);

create table fotos_trabajos (
  id uuid primary key default gen_random_uuid(),
  prestador_id uuid references prestadores on delete cascade,
  url text not null,
  creado_en timestamptz default now()
);

create table solicitudes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references perfiles not null,
  prestador_id uuid references prestadores not null,
  descripcion text not null,
  direccion text,
  fecha_programada timestamptz,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','aceptada','en_curso','finalizada','cancelada')),
  precio_acordado int,
  pagado boolean default false,
  creado_en timestamptz default now()
);

create table valoraciones (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid unique references solicitudes not null,
  cliente_id uuid references perfiles not null,
  prestador_id uuid references prestadores not null,
  puntualidad int check (puntualidad between 1 and 5),
  calidad int check (calidad between 1 and 5),
  precio int check (precio between 1 and 5),
  trato int check (trato between 1 and 5),
  comentario text,
  respuesta text,
  creado_en timestamptz default now()
);

create table notificaciones (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid references perfiles on delete cascade,
  titulo text,
  mensaje text,
  leida boolean default false,
  creado_en timestamptz default now()
);

create table reportes (
  id uuid primary key default gen_random_uuid(),
  valoracion_id uuid references valoraciones on delete cascade,
  motivo text,
  estado text default 'abierto',
  creado_en timestamptz default now()
);

-- =========================================
-- FUNCIÓN AUXILIAR: ¿el usuario actual es admin?
-- =========================================
create or replace function es_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'admin');
$$;

-- =========================================
-- ACTIVAR RLS
-- =========================================
alter table perfiles enable row level security;
alter table oficios enable row level security;
alter table prestadores enable row level security;
alter table fotos_trabajos enable row level security;
alter table solicitudes enable row level security;
alter table valoraciones enable row level security;
alter table notificaciones enable row level security;
alter table reportes enable row level security;

-- =========================================
-- POLÍTICAS
-- =========================================
-- perfiles: cada uno ve el suyo; el admin ve todos; los prestadores verificados son públicos
create policy "perfiles_ver" on perfiles for select using (
  id = auth.uid() or es_admin()
  or exists (select 1 from prestadores p where p.perfil_id = perfiles.id and p.verificado)
);
create policy "perfiles_crear_propio" on perfiles for insert with check (
  id = auth.uid() and rol in ('cliente','prestador')
);
create policy "perfiles_editar_propio" on perfiles for update
  using (id = auth.uid()) with check (id = auth.uid() and rol in ('cliente','prestador'));

-- oficios: todos leen; solo admin modifica
create policy "oficios_ver" on oficios for select using (true);
create policy "oficios_admin" on oficios for all using (es_admin()) with check (es_admin());

-- prestadores: públicos si están verificados; el dueño ve y edita el suyo
create policy "prestadores_ver" on prestadores for select using (
  verificado or perfil_id = auth.uid() or es_admin()
);
create policy "prestadores_crear_propio" on prestadores for insert with check (perfil_id = auth.uid());
create policy "prestadores_editar_propio" on prestadores for update
  using (perfil_id = auth.uid() or es_admin())
  with check (perfil_id = auth.uid() or es_admin());

-- fotos: públicas; solo el dueño sube y borra
create policy "fotos_ver" on fotos_trabajos for select using (true);
create policy "fotos_gestionar_propias" on fotos_trabajos for all
  using (prestador_id = auth.uid()) with check (prestador_id = auth.uid());

-- solicitudes: ven solo cliente, prestador involucrado o admin
create policy "solicitudes_ver" on solicitudes for select using (
  cliente_id = auth.uid() or prestador_id = auth.uid() or es_admin()
);
create policy "solicitudes_crear" on solicitudes for insert with check (
  cliente_id = auth.uid() and estado = 'pendiente'
);
create policy "solicitudes_actualizar" on solicitudes for update
  using (cliente_id = auth.uid() or prestador_id = auth.uid())
  with check (cliente_id = auth.uid() or prestador_id = auth.uid());

-- valoraciones: públicas; solo el cliente puede crear, y solo si el servicio está finalizado
create policy "valoraciones_ver" on valoraciones for select using (true);
create policy "valoraciones_crear_regla" on valoraciones for insert with check (
  cliente_id = auth.uid()
  and exists (
    select 1 from solicitudes s
    where s.id = solicitud_id
      and s.cliente_id = auth.uid()
      and s.estado = 'finalizada'
  )
);
create policy "valoraciones_responder" on valoraciones for update
  using (prestador_id = auth.uid()) with check (prestador_id = auth.uid());

-- notificaciones: cada uno ve y marca las suyas
create policy "notificaciones_propias" on notificaciones for all
  using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

-- reportes: cualquier usuario reporta; solo admin revisa
create policy "reportes_crear" on reportes for insert with check (auth.uid() is not null);
create policy "reportes_admin" on reportes for select using (es_admin());
create policy "reportes_admin_gestionar" on reportes for update using (es_admin()) with check (es_admin());

-- =========================================
-- TRIGGERS Y REGLAS DE NEGOCIO
-- =========================================
-- 1. Solo el admin puede cambiar verificado
create or replace function proteger_verificado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.verificado is distinct from old.verificado and not es_admin() then
    raise exception 'Solo un administrador puede verificar un prestador';
  end if;
  return new;
end; $$;

create trigger trg_proteger_verificado before update on prestadores
for each row execute function proteger_verificado();

-- 2. Recalcular promedio y total al insertar una valoración
create or replace function actualizar_promedio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update prestadores p set
    total_valoraciones = (select count(*) from valoraciones v where v.prestador_id = new.prestador_id),
    promedio = (
      select coalesce(round(avg((v.puntualidad + v.calidad + v.precio + v.trato) / 4.0), 2), 0)
      from valoraciones v where v.prestador_id = new.prestador_id
    )
  where p.perfil_id = new.prestador_id;
  return new;
end; $$;

create trigger trg_actualizar_promedio after insert on valoraciones
for each row execute function actualizar_promedio();

-- 3. Solo se permiten cambios de estado válidos según quién los hace
create or replace function validar_cambio_estado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.estado = old.estado then
    return new;
  end if;

  -- el cliente solo puede cancelar mientras esté pendiente
  if auth.uid() = old.cliente_id and old.estado = 'pendiente' and new.estado = 'cancelada' then
    return new;
  end if;

  -- el prestador controla el avance del servicio
  if auth.uid() = old.prestador_id then
    if (old.estado = 'pendiente' and new.estado in ('aceptada','cancelada'))
       or (old.estado = 'aceptada' and new.estado = 'en_curso')
       or (old.estado = 'en_curso' and new.estado = 'finalizada') then
      return new;
    end if;
  end if;

  raise exception 'Cambio de estado no permitido: % -> %', old.estado, new.estado;
end; $$;

create trigger trg_validar_estado before update of estado on solicitudes
for each row execute function validar_cambio_estado();

-- =========================================
-- FUNCIÓN DE BÚSQUEDA POR CERCANÍA (Haversine, en km)
-- =========================================
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
language sql stable as $$
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