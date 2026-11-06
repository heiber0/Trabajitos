do $$
declare
  informe text := '';
  n int;
  v_prom numeric;
  v_tot int;
  v_estado text;
  c1 constant uuid := 'c0000000-0000-0000-0000-000000000001';
  c2 constant uuid := 'c0000000-0000-0000-0000-000000000002';
  c4 constant uuid := 'c0000000-0000-0000-0000-000000000004';
  p1 constant uuid := 'a0000000-0000-0000-0000-000000000001';
  p2 constant uuid := 'a0000000-0000-0000-0000-000000000002';
  p3 constant uuid := 'a0000000-0000-0000-0000-000000000003';
  p4 constant uuid := 'a0000000-0000-0000-0000-000000000004';
  p14 constant uuid := 'a0000000-0000-0000-0000-000000000014';
  s1 constant uuid := 'd0000000-0000-0000-0000-000000000001';
  s4 constant uuid := 'd0000000-0000-0000-0000-000000000004';
  s6 constant uuid := 'd0000000-0000-0000-0000-000000000006';
  s7 constant uuid := 'd0000000-0000-0000-0000-000000000007';
  s9 constant uuid := 'd0000000-0000-0000-0000-000000000009';
begin
  execute 'set local role authenticated';

  -- T1: valorar un servicio NO finalizado (debe fallar)
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', c1), true);
  begin
    insert into valoraciones (solicitud_id, cliente_id, prestador_id, puntualidad, calidad, precio, trato)
    values (s6, c1, p2, 5, 5, 5, 5);
    informe := informe || E'\nT1 FALLO: dejó valorar un servicio no finalizado';
  exception when others then
    informe := informe || E'\nT1 OK (bloqueado): ' || sqlerrm;
  end;

  -- T2: valorar un servicio AJENO (debe fallar)
  begin
    insert into valoraciones (solicitud_id, cliente_id, prestador_id, puntualidad, calidad, precio, trato)
    values (s4, c1, p4, 5, 5, 5, 5);
    informe := informe || E'\nT2 FALLO: dejó valorar un servicio ajeno';
  exception when others then
    informe := informe || E'\nT2 OK (bloqueado): ' || sqlerrm;
  end;

  -- T3: suplantar a otro cliente (debe fallar)
  begin
    insert into valoraciones (solicitud_id, cliente_id, prestador_id, puntualidad, calidad, precio, trato)
    values (s4, c4, p4, 5, 5, 5, 5);
    informe := informe || E'\nT3 FALLO: dejó valorar a nombre de otro cliente';
  exception when others then
    informe := informe || E'\nT3 OK (bloqueado): ' || sqlerrm;
  end;

  -- T4: valorar dos veces el mismo servicio (debe fallar)
  begin
    insert into valoraciones (solicitud_id, cliente_id, prestador_id, puntualidad, calidad, precio, trato)
    values (s1, c1, p1, 5, 5, 5, 5);
    informe := informe || E'\nT4 FALLO: dejó valorar dos veces';
  exception when others then
    informe := informe || E'\nT4 OK (bloqueado): ' || sqlerrm;
  end;

  -- T5: valorar un servicio PROPIO y FINALIZADO (debe funcionar)
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', c4), true);
  begin
    insert into valoraciones (solicitud_id, cliente_id, prestador_id, puntualidad, calidad, precio, trato)
    values (s4, c4, p4, 5, 5, 4, 5);
    informe := informe || E'\nT5 OK: la valoración se guardó';
  exception when others then
    informe := informe || E'\nT5 FALLO: ' || sqlerrm;
  end;

  -- T6: el promedio del prestador 4 se recalculó (esperado: 4.75 y 1 valoración)
  execute 'reset role';
  select promedio, total_valoraciones into v_prom, v_tot from prestadores where perfil_id = p4;
  informe := informe || E'\nT6 ' || case when v_prom = 4.75 and v_tot = 1 then 'OK' else 'FALLO' end
             || ': promedio=' || v_prom || ', total=' || v_tot;

  -- T7: el cliente intenta saltar el estado aceptada -> finalizada (debe fallar)
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', c2), true);
  begin
    update solicitudes set estado = 'finalizada' where id = s7;
    informe := informe || E'\nT7 FALLO: el cliente cambió el estado';
  exception when others then
    informe := informe || E'\nT7 OK (bloqueado): ' || sqlerrm;
  end;

  -- T8: el prestador avanza aceptada -> en_curso (debe funcionar)
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', p3), true);
  begin
    update solicitudes set estado = 'en_curso' where id = s7;
    select estado into v_estado from solicitudes where id = s7;
    informe := informe || E'\nT8 ' || case when v_estado = 'en_curso' then 'OK' else 'FALLO' end || ': estado=' || v_estado;
  exception when others then
    informe := informe || E'\nT8 FALLO: ' || sqlerrm;
  end;

  -- T9: el prestador intenta finalizar una solicitud pendiente (debe fallar)
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', p1), true);
  begin
    update solicitudes set estado = 'finalizada' where id = s9;
    informe := informe || E'\nT9 FALLO: finalizó una solicitud pendiente';
  exception when others then
    informe := informe || E'\nT9 OK (bloqueado): ' || sqlerrm;
  end;

  -- T10: un prestador sin verificar intenta verificarse solo (debe fallar)
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', p14), true);
  begin
    update prestadores set verificado = true where perfil_id = p14;
    informe := informe || E'\nT10 FALLO: se verificó solo';
  exception when others then
    informe := informe || E'\nT10 OK (bloqueado): ' || sqlerrm;
  end;

  -- T11: el cliente 1 solo ve sus solicitudes (esperado: 2) y ninguna ajena (esperado: 0)
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', c1), true);
  select count(*) into n from solicitudes;
  informe := informe || E'\nT11a ' || case when n = 2 then 'OK' else 'FALLO' end || ': ve ' || n || ' solicitudes';
  select count(*) into n from solicitudes where id = s4;
  informe := informe || E'\nT11b ' || case when n = 0 then 'OK' else 'FALLO' end || ': ve ' || n || ' ajenas';

  execute 'reset role';
  -- Esta excepción es intencional: deshace todo y muestra el informe
  raise exception E'REPORTE DE PRUEBAS (no se guardó nada):%', informe;
end $$;