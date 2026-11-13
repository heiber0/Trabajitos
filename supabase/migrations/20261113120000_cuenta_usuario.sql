-- El usuario puede editar su propio perfil, pero no su rol
drop policy if exists "perfiles_editar_propio" on perfiles;
create policy "perfiles_editar_propio" on perfiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create or replace function proteger_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Sin sesión de usuario (SQL Editor): sin restricción
  if auth.uid() is null then
    return new;
  end if;

  if new.rol is distinct from old.rol
     or new.id is distinct from old.id
     or new.creado_en is distinct from old.creado_en then
    raise exception 'No puedes cambiar estos datos del perfil';
  end if;

  return new;
end; $$;

drop trigger if exists trg_proteger_perfil on perfiles;
create trigger trg_proteger_perfil before update on perfiles
for each row execute function proteger_perfil();

-- Formato de nombre y celular (solo para datos nuevos; no revisa los existentes)
alter table perfiles drop constraint if exists perfiles_nombre_largo;
alter table perfiles add constraint perfiles_nombre_largo
  check (char_length(btrim(nombre)) between 3 and 80) not valid;

alter table perfiles drop constraint if exists perfiles_telefono_formato;
alter table perfiles add constraint perfiles_telefono_formato
  check (telefono is null or telefono ~ '^3[0-9]{9}$') not valid;