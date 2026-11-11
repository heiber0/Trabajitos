-- 1. Una valoración es inmutable; el prestador solo puede añadir UNA respuesta
create or replace function proteger_valoracion() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Sin sesión de usuario (SQL Editor, funciones de servidor) no se restringe
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

  if new.respuesta is distinct from old.respuesta then
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

drop trigger if exists trg_proteger_valoracion on valoraciones;
create trigger trg_proteger_valoracion before update on valoraciones
for each row execute function proteger_valoracion();

-- 2. Las cuatro calificaciones son obligatorias y el comentario tiene tope
alter table valoraciones alter column puntualidad set not null;
alter table valoraciones alter column calidad set not null;
alter table valoraciones alter column precio set not null;
alter table valoraciones alter column trato set not null;
alter table valoraciones add constraint valoraciones_comentario_largo
  check (comentario is null or char_length(comentario) <= 500);

-- 3. Reportes: quién reporta, un reporte por persona y comentario, motivo acotado
alter table reportes add column if not exists reportado_por uuid
  references perfiles on delete set null default auth.uid();
alter table reportes alter column motivo set not null;
alter table reportes add constraint reportes_motivo_largo
  check (char_length(btrim(motivo)) between 5 and 300);
create unique index if not exists reportes_unico on reportes (valoracion_id, reportado_por);

drop policy if exists "reportes_crear" on reportes;
create policy "reportes_crear" on reportes for insert with check (
  reportado_por = auth.uid()
  and exists (select 1 from valoraciones v where v.id = valoracion_id)
);