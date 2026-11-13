import { supabase } from '../../lib/supabase'
import type { Rol } from '../../lib/useSesion'

export type MiPerfil = {
  nombre: string
  telefono: string | null
  rol: Rol
  creado_en: string
}

export async function cargarMiPerfil(userId: string): Promise<MiPerfil | null> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('nombre, telefono, rol, creado_en')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    nombre: data.nombre,
    telefono: data.telefono,
    rol: data.rol as Rol,
    creado_en: data.creado_en ?? '',
  }
}

export async function guardarMiPerfil(userId: string, nombre: string, telefono: string) {
  const { data, error } = await supabase
    .from('perfiles')
    .update({ nombre, telefono })
    .eq('id', userId)
    .select('id')
  if (error) throw error
  // Si las reglas de seguridad no dejan actualizar, Supabase responde sin error y sin filas
  if (!data || data.length === 0) throw new Error('No se pudo guardar tus datos')
}

// Verifica la contraseña actual y luego la cambia
export async function cambiarContrasena(correo: string, actual: string, nueva: string) {
  const { error: errActual } = await supabase.auth.signInWithPassword({
    email: correo,
    password: actual,
  })
  if (errActual) {
    if (errActual.message.toLowerCase().includes('invalid login credentials')) {
      throw new Error('CONTRASENA_ACTUAL')
    }
    throw errActual
  }
  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) throw error
}