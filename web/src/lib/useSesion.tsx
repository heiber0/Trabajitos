import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type Rol = 'cliente' | 'prestador' | 'admin'

type SesionContexto = {
  usuario: User | null
  rol: Rol | null
  cargando: boolean
  refrescar: () => Promise<void>
  cerrarSesion: () => Promise<void>
}

const Contexto = createContext<SesionContexto | null>(null)

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [rol, setRol] = useState<Rol | null>(null)
  const [cargando, setCargando] = useState(true)
  const idActual = useRef<string | null>(null)

  const cargarRol = useCallback(async (id?: string) => {
    if (!id) {
      setRol(null)
      return
    }
    const { data } = await supabase
      .from('perfiles').select('rol').eq('id', id).maybeSingle()
    setRol((data?.rol as Rol | undefined) ?? null)
  }, [])

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      const nuevo = sesion?.user ?? null
      const nuevoId = nuevo?.id ?? null

      // Misma persona (renovación de sesión o regreso a la pestaña): no se recarga nada
      if (nuevoId !== null && nuevoId === idActual.current) return

      idActual.current = nuevoId
      setUsuario(nuevo)
      if (nuevo) setCargando(true)
      // setTimeout evita bloquear a Supabase al hacer otra consulta dentro del callback
      setTimeout(() => {
        cargarRol(nuevoId ?? undefined).finally(() => setCargando(false))
      }, 0)
    })
    return () => data.subscription.unsubscribe()
  }, [cargarRol])

  const refrescar = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    await cargarRol(data.session?.user.id)
  }, [cargarRol])

  const cerrarSesion = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return (
    <Contexto.Provider value={{ usuario, rol, cargando, refrescar, cerrarSesion }}>
      {children}
    </Contexto.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSesion() {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useSesion debe usarse dentro de <SesionProvider>')
  return ctx
}