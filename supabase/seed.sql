-- =========================================
-- OFICIOS
-- =========================================
insert into oficios (nombre) values
  ('Plomero'), ('Electricista'), ('Albañil'), ('Pintor'), ('Carpintero'),
  ('Cerrajero'), ('Técnico de electrodomésticos'), ('Jardinero'),
  ('Limpieza'), ('Estilista');

-- =========================================
-- USUARIOS DE PRUEBA EN AUTH
-- (a... = 15 prestadores, c... = 5 clientes; no pueden iniciar sesión)
-- =========================================
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  ('a0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  'authenticated', 'authenticated',
  'prestador' || i || '@trabajitos.test', '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
  '', '', '', ''
from generate_series(1, 15) i;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  ('c0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  'authenticated', 'authenticated',
  'cliente' || i || '@trabajitos.test', '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
  '', '', '', ''
from generate_series(1, 5) i;

-- =========================================
-- PERFILES
-- =========================================
insert into perfiles (id, rol, nombre, telefono)
select
  ('a0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  'prestador',
  (array['Carlos Pérez','Luis Gómez','Andrés Mejía','Jorge Ríos','Mario Suárez',
         'Pedro Cardozo','Iván Ortiz','Daniel Vega','Rosa Peñaranda','Marta Ibarra',
         'Julián Rojas','Samuel Epieyú','Héctor Mora','Wilmer Pushaina','Camilo Brito'])[i],
  '30000000' || lpad(i::text, 2, '0')
from generate_series(1, 15) i;

insert into perfiles (id, rol, nombre, telefono)
select
  ('c0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  'cliente',
  (array['Ana Torres','Beatriz Lara','Diego Castro','Elena Fuentes','Fabián Ramos'])[i],
  '31000000' || lpad(i::text, 2, '0')
from generate_series(1, 5) i;

-- =========================================
-- PRESTADORES (coordenadas repartidas alrededor de Riohacha)
-- Los prestadores 14 y 15 quedan sin verificar para probar el panel admin
-- =========================================
insert into prestadores (
  perfil_id, oficio_id, descripcion, anios_experiencia, tarifa_referencia,
  ciudad, lat, lng, verificado
)
select
  ('a0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  (select id from oficios order by id offset ((i - 1) % 10) limit 1),
  'Trabajo garantizado, puntual y con materiales de calidad en Riohacha.',
  (i % 10) + 1,
  30000 + (i % 6) * 10000,
  'Riohacha',
  11.5444 + sin(i * 1.7) * 0.02,
  -72.9072 + cos(i * 2.3) * 0.02,
  i < 14
from generate_series(1, 15) i;

-- =========================================
-- SOLICITUDES (5 finalizadas y varias en otros estados)
-- =========================================
insert into solicitudes (
  id, cliente_id, prestador_id, descripcion, direccion, estado, precio_acordado, pagado
)
select
  ('d0000000-0000-0000-0000-' || lpad(k::text, 12, '0'))::uuid,
  ('c0000000-0000-0000-0000-' || lpad(c::text, 12, '0'))::uuid,
  ('a0000000-0000-0000-0000-' || lpad(p::text, 12, '0'))::uuid,
  d, 'Riohacha, barrio ' || b, e, pr, (k <= 2)
from (values
  (1, 1, 1, 'Reparar una fuga en el lavamanos', 'Centro',       'finalizada', 50000),
  (2, 2, 2, 'Cambiar tomacorrientes de la sala', 'Los Nogales', 'finalizada', 60000),
  (3, 3, 3, 'Levantar un muro pequeño en el patio', 'Obrero',   'finalizada', 120000),
  (4, 4, 4, 'Pintar dos habitaciones',            'Cooperativo', 'finalizada', 150000),
  (5, 5, 5, 'Arreglar la puerta del closet',      'Boca del Monte', 'finalizada', 70000),
  (6, 1, 2, 'Instalar una lámpara en el comedor', 'Centro',      'pendiente',  null),
  (7, 2, 3, 'Reparar una grieta en la pared',     'Los Nogales', 'aceptada',   90000),
  (8, 3, 4, 'Pintar la fachada de la casa',       'Obrero',      'en_curso',   200000),
  (9, 4, 1, 'Cambiar la llave del baño',          'Cooperativo', 'pendiente',  null)
) as t(k, c, p, d, b, e, pr);

-- =========================================
-- VALORACIONES (solo de las solicitudes 1 a 3; la 4 y la 5 quedan para probar)
-- El trigger recalcula el promedio de cada prestador
-- =========================================
insert into valoraciones (
  solicitud_id, cliente_id, prestador_id, puntualidad, calidad, precio, trato, comentario
)
select s.id, s.cliente_id, s.prestador_id, v.pu, v.ca, v.pr, v.tr, v.co
from (values
  (1, 5, 4, 4, 5, 'Excelente servicio, llegó a tiempo.'),
  (2, 4, 4, 3, 4, 'Buen trabajo, aunque un poco caro.'),
  (3, 5, 5, 5, 5, 'Muy profesional y dejó todo limpio.')
) as v(k, pu, ca, pr, tr, co)
join solicitudes s
  on s.id = ('d0000000-0000-0000-0000-' || lpad(v.k::text, 12, '0'))::uuid;