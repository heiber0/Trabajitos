-- Cada usuario lee solo su perfil; el administrador lee todos.
-- Los datos públicos de un prestador salen de perfil_prestador_publico (sin teléfono).
drop policy if exists "perfiles_ver" on perfiles;
create policy "perfiles_ver" on perfiles for select using (
  id = auth.uid() or es_admin()
);