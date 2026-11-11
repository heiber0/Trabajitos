-- Protege los datos de una solicitud: solo cambia el estado, y el precio
-- solo lo fija el prestador en el momento de aceptar.
create or replace function proteger_campos_solicitud() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Sin sesión de usuario (SQL Editor, funciones de servidor) no se restringe
  if auth.uid() is null then
    return new;
  end if;

  if new.cliente_id is distinct from old.cliente_id
     or new.prestador_id is distinct from old.prestador_id
     or new.descripcion is distinct from old.descripcion
     or new.direccion is distinct from old.direccion
     or new.fecha_programada is distinct from old.fecha_programada
     or new.pagado is distinct from old.pagado then
    raise exception 'No puedes modificar estos datos de la solicitud';
  end if;

  if new.precio_acordado is distinct from old.precio_acordado then
    if not (
      auth.uid() = old.prestador_id
      and old.estado = 'pendiente'
      and new.estado = 'aceptada'
    ) then
      raise exception 'El precio solo lo fija el prestador al aceptar la solicitud';
    end if;
  end if;

  return new;
end; $$;

drop trigger if exists trg_proteger_campos_solicitud on solicitudes;
create trigger trg_proteger_campos_solicitud before update on solicitudes
for each row execute function proteger_campos_solicitud();