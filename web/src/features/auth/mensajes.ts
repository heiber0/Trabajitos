export function mensajeError(err: unknown): string {
  const texto =
    err instanceof Error
      ? err.message
      : typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message: unknown }).message)
        : ''
  const t = texto.toLowerCase()

  if (t.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (t.includes('already registered')) return 'Ese correo ya tiene una cuenta. Prueba iniciar sesión.'
  if (t.includes('sin_sesion'))
    return 'Se creó la cuenta pero no se pudo iniciar la sesión. Avisa a quien administra el sitio.'
  if (t.includes('rate limit') || t.includes('too many'))
    return 'Hiciste muchos intentos seguidos. Espera un minuto e intenta de nuevo.'
  if (t.includes('failed to fetch') || t.includes('network'))
    return 'No hay conexión. Revisa tu internet e intenta de nuevo.'
  if (t.includes('password')) return 'La contraseña no es válida. Usa al menos 8 caracteres.'
  return 'No pudimos completar la acción. Intenta de nuevo.'
}