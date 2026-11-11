# Base de datos de Trabajitos

Motor: PostgreSQL en Supabase. Esquema en `supabase/migrations/`, datos de prueba en `supabase/seed.sql`, pruebas en `supabase/tests/reglas.sql`.

## Tablas

| Tabla | Para qué sirve |
|---|---|
| perfiles | Un registro por usuario, con su rol (cliente, prestador, admin) |
| oficios | Catálogo de oficios |
| prestadores | Datos del prestador, ubicación, verificación y promedio |
| fotos_trabajos | Galería de cada prestador |
| solicitudes | Pedidos de servicio con su estado |
| valoraciones | Calificación de un servicio finalizado |
| notificaciones | Avisos dentro de la aplicación |
| reportes | Comentarios denunciados para el admin |

## Estados de una solicitud

pendiente, aceptada, en_curso, finalizada, cancelada.

| Quién | Cambio permitido |
|---|---|
| Cliente | pendiente a cancelada |
| Prestador | pendiente a aceptada o cancelada; aceptada a en_curso; en_curso a finalizada |

Cualquier otro cambio lanza el error "Cambio de estado no permitido".

## Reglas de seguridad (RLS y triggers)

- Cada usuario solo ve sus datos privados; el admin ve todo.
- Los prestadores verificados son públicos.
- Solo el cliente de una solicitud puede valorarla, y solo si está finalizada. Una solicitud se valora una sola vez.
- El promedio y el total de valoraciones se recalculan solos al insertar una valoración.
- Solo un admin puede cambiar el campo verificado.
- La función prestadores_cercanos(lat, lng, oficio, radio_km) devuelve prestadores verificados ordenados por distancia.

## Pruebas

El script `supabase/tests/reglas.sql` ejecuta 11 casos y no guarda nada. Se corre en el SQL Editor de Supabase; todas las líneas del informe deben decir OK.

## Límites conocidos

- Las políticas de solicitudes dejan que el cliente y el prestador editen también `precio_acordado` y `pagado`. El campo `pagado` debe quedar solo en manos del webhook de pagos (Día 11); hasta entonces no hay que confiar en él.
- No hay verificación automática de identidad: el admin aprueba a mano.