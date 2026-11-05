export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      fotos_trabajos: {
        Row: {
          creado_en: string | null
          id: string
          prestador_id: string | null
          url: string
        }
        Insert: {
          creado_en?: string | null
          id?: string
          prestador_id?: string | null
          url: string
        }
        Update: {
          creado_en?: string | null
          id?: string
          prestador_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_trabajos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["perfil_id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          creado_en: string | null
          id: string
          leida: boolean | null
          mensaje: string | null
          perfil_id: string | null
          titulo: string | null
        }
        Insert: {
          creado_en?: string | null
          id?: string
          leida?: boolean | null
          mensaje?: string | null
          perfil_id?: string | null
          titulo?: string | null
        }
        Update: {
          creado_en?: string | null
          id?: string
          leida?: boolean | null
          mensaje?: string | null
          perfil_id?: string | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      oficios: {
        Row: {
          id: number
          nombre: string
        }
        Insert: {
          id?: number
          nombre: string
        }
        Update: {
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      perfiles: {
        Row: {
          avatar_url: string | null
          creado_en: string | null
          id: string
          nombre: string
          rol: string
          telefono: string | null
        }
        Insert: {
          avatar_url?: string | null
          creado_en?: string | null
          id: string
          nombre: string
          rol: string
          telefono?: string | null
        }
        Update: {
          avatar_url?: string | null
          creado_en?: string | null
          id?: string
          nombre?: string
          rol?: string
          telefono?: string | null
        }
        Relationships: []
      }
      prestadores: {
        Row: {
          anios_experiencia: number | null
          ciudad: string | null
          descripcion: string | null
          lat: number | null
          lng: number | null
          oficio_id: number | null
          perfil_id: string
          promedio: number | null
          tarifa_referencia: number | null
          total_valoraciones: number | null
          verificado: boolean | null
        }
        Insert: {
          anios_experiencia?: number | null
          ciudad?: string | null
          descripcion?: string | null
          lat?: number | null
          lng?: number | null
          oficio_id?: number | null
          perfil_id: string
          promedio?: number | null
          tarifa_referencia?: number | null
          total_valoraciones?: number | null
          verificado?: boolean | null
        }
        Update: {
          anios_experiencia?: number | null
          ciudad?: string | null
          descripcion?: string | null
          lat?: number | null
          lng?: number | null
          oficio_id?: number | null
          perfil_id?: string
          promedio?: number | null
          tarifa_referencia?: number | null
          total_valoraciones?: number | null
          verificado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "prestadores_oficio_id_fkey"
            columns: ["oficio_id"]
            isOneToOne: false
            referencedRelation: "oficios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestadores_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reportes: {
        Row: {
          creado_en: string | null
          estado: string | null
          id: string
          motivo: string | null
          valoracion_id: string | null
        }
        Insert: {
          creado_en?: string | null
          estado?: string | null
          id?: string
          motivo?: string | null
          valoracion_id?: string | null
        }
        Update: {
          creado_en?: string | null
          estado?: string | null
          id?: string
          motivo?: string | null
          valoracion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reportes_valoracion_id_fkey"
            columns: ["valoracion_id"]
            isOneToOne: false
            referencedRelation: "valoraciones"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes: {
        Row: {
          cliente_id: string
          creado_en: string | null
          descripcion: string
          direccion: string | null
          estado: string
          fecha_programada: string | null
          id: string
          pagado: boolean | null
          precio_acordado: number | null
          prestador_id: string
        }
        Insert: {
          cliente_id: string
          creado_en?: string | null
          descripcion: string
          direccion?: string | null
          estado?: string
          fecha_programada?: string | null
          id?: string
          pagado?: boolean | null
          precio_acordado?: number | null
          prestador_id: string
        }
        Update: {
          cliente_id?: string
          creado_en?: string | null
          descripcion?: string
          direccion?: string | null
          estado?: string
          fecha_programada?: string | null
          id?: string
          pagado?: boolean | null
          precio_acordado?: number | null
          prestador_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["perfil_id"]
          },
        ]
      }
      valoraciones: {
        Row: {
          calidad: number | null
          cliente_id: string
          comentario: string | null
          creado_en: string | null
          id: string
          precio: number | null
          prestador_id: string
          puntualidad: number | null
          respuesta: string | null
          solicitud_id: string
          trato: number | null
        }
        Insert: {
          calidad?: number | null
          cliente_id: string
          comentario?: string | null
          creado_en?: string | null
          id?: string
          precio?: number | null
          prestador_id: string
          puntualidad?: number | null
          respuesta?: string | null
          solicitud_id: string
          trato?: number | null
        }
        Update: {
          calidad?: number | null
          cliente_id?: string
          comentario?: string | null
          creado_en?: string | null
          id?: string
          precio?: number | null
          prestador_id?: string
          puntualidad?: number | null
          respuesta?: string | null
          solicitud_id?: string
          trato?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "valoraciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valoraciones_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["perfil_id"]
          },
          {
            foreignKeyName: "valoraciones_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: true
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      es_admin: { Args: never; Returns: boolean }
      prestadores_cercanos: {
        Args: {
          p_lat: number
          p_lng: number
          p_oficio?: number
          p_radio_km?: number
        }
        Returns: {
          distancia_km: number
          nombre: string
          oficio_id: number
          perfil_id: string
          promedio: number
          tarifa_referencia: number
          total_valoraciones: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
