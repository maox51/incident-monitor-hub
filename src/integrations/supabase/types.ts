export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string
          room_id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type?: string
          room_id: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          room_id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          id: string
          joined_at: string
          last_read_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_group: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_group?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_group?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      clasificacion_area: {
        Row: {
          activo: boolean
          area_id: string
          clasificacion_id: string
          created_at: string
          id: string
          prioridad_sugerida: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          area_id: string
          clasificacion_id: string
          created_at?: string
          id?: string
          prioridad_sugerida?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          area_id?: string
          clasificacion_id?: string
          created_at?: string
          id?: string
          prioridad_sugerida?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clasificacion_area_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clasificacion_area_clasificacion_id_fkey"
            columns: ["clasificacion_id"]
            isOneToOne: true
            referencedRelation: "clasificaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      clasificacion_area_mapping: {
        Row: {
          activo: boolean
          area_id: string
          clasificacion_id: string
          created_at: string
          id: string
          prioridad_sugerida: string | null
        }
        Insert: {
          activo?: boolean
          area_id: string
          clasificacion_id: string
          created_at?: string
          id?: string
          prioridad_sugerida?: string | null
        }
        Update: {
          activo?: boolean
          area_id?: string
          clasificacion_id?: string
          created_at?: string
          id?: string
          prioridad_sugerida?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clasificacion_area_mapping_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clasificacion_area_mapping_clasificacion_id_fkey"
            columns: ["clasificacion_id"]
            isOneToOne: false
            referencedRelation: "clasificaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      clasificaciones: {
        Row: {
          activo: boolean
          color: string | null
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          color?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          color?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      conteos_quincenales_sala: {
        Row: {
          año: number
          created_at: string
          id: string
          mes: number
          minutos_cierres_prematuros: number
          minutos_ingresos_tardios: number
          quincena: number
          sala_id: string
          total_incidencias_cierres: number
          total_incidencias_ingresos: number
          updated_at: string
        }
        Insert: {
          año: number
          created_at?: string
          id?: string
          mes: number
          minutos_cierres_prematuros?: number
          minutos_ingresos_tardios?: number
          quincena: number
          sala_id: string
          total_incidencias_cierres?: number
          total_incidencias_ingresos?: number
          updated_at?: string
        }
        Update: {
          año?: number
          created_at?: string
          id?: string
          mes?: number
          minutos_cierres_prematuros?: number
          minutos_ingresos_tardios?: number
          quincena?: number
          sala_id?: string
          total_incidencias_cierres?: number
          total_incidencias_ingresos?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conteos_quincenales_sala_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      fcm_tokens: {
        Row: {
          created_at: string
          device_type: string | null
          id: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          id?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_type?: string | null
          id?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      imagenes_incidencias: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          incidencia_id: string
          nombre_archivo: string
          tamaño_bytes: number | null
          tipo_archivo: string | null
          url_imagen: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          incidencia_id: string
          nombre_archivo: string
          tamaño_bytes?: number | null
          tipo_archivo?: string | null
          url_imagen: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          incidencia_id?: string
          nombre_archivo?: string
          tamaño_bytes?: number | null
          tipo_archivo?: string | null
          url_imagen?: string
        }
        Relationships: [
          {
            foreignKeyName: "imagenes_incidencias_incidencia_id_fkey"
            columns: ["incidencia_id"]
            isOneToOne: false
            referencedRelation: "incidencias"
            referencedColumns: ["id"]
          },
        ]
      }
      incidencia_clasificaciones: {
        Row: {
          clasificacion_id: string
          created_at: string
          id: string
          incidencia_id: string
        }
        Insert: {
          clasificacion_id: string
          created_at?: string
          id?: string
          incidencia_id: string
        }
        Update: {
          clasificacion_id?: string
          created_at?: string
          id?: string
          incidencia_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidencia_clasificaciones_clasificacion_id_fkey"
            columns: ["clasificacion_id"]
            isOneToOne: false
            referencedRelation: "clasificaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencia_clasificaciones_incidencia_id_fkey"
            columns: ["incidencia_id"]
            isOneToOne: false
            referencedRelation: "incidencias"
            referencedColumns: ["id"]
          },
        ]
      }
      incidencias: {
        Row: {
          aprobado_por: string | null
          area_id: string
          clasificacion_id: string
          created_at: string
          descripcion: string
          estado: string
          fecha_aprobacion: string | null
          fecha_incidencia: string
          id: string
          observaciones: string | null
          prioridad: string
          reportado_por: string
          sala_id: string | null
          tiempo_minutos: number | null
          titulo: string
          updated_at: string
        }
        Insert: {
          aprobado_por?: string | null
          area_id: string
          clasificacion_id: string
          created_at?: string
          descripcion: string
          estado?: string
          fecha_aprobacion?: string | null
          fecha_incidencia?: string
          id?: string
          observaciones?: string | null
          prioridad?: string
          reportado_por: string
          sala_id?: string | null
          tiempo_minutos?: number | null
          titulo: string
          updated_at?: string
        }
        Update: {
          aprobado_por?: string | null
          area_id?: string
          clasificacion_id?: string
          created_at?: string
          descripcion?: string
          estado?: string
          fecha_aprobacion?: string | null
          fecha_incidencia?: string
          id?: string
          observaciones?: string | null
          prioridad?: string
          reportado_por?: string
          sala_id?: string | null
          tiempo_minutos?: number | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidencias_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_clasificacion_id_fkey"
            columns: ["clasificacion_id"]
            isOneToOne: false
            referencedRelation: "clasificaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          high_priority_alerts: boolean | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          high_priority_alerts?: boolean | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          high_priority_alerts?: boolean | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reportes_consolidados: {
        Row: {
          archivo_pdf_url: string | null
          areas_afectadas: number
          created_at: string
          fecha_reporte: string
          id: string
          incidencias_altas: number
          incidencias_bajas: number
          incidencias_criticas: number
          incidencias_medias: number
          salas_afectadas: number
          total_incidencias: number
          updated_at: string
        }
        Insert: {
          archivo_pdf_url?: string | null
          areas_afectadas?: number
          created_at?: string
          fecha_reporte: string
          id?: string
          incidencias_altas?: number
          incidencias_bajas?: number
          incidencias_criticas?: number
          incidencias_medias?: number
          salas_afectadas?: number
          total_incidencias?: number
          updated_at?: string
        }
        Update: {
          archivo_pdf_url?: string | null
          areas_afectadas?: number
          created_at?: string
          fecha_reporte?: string
          id?: string
          incidencias_altas?: number
          incidencias_bajas?: number
          incidencias_criticas?: number
          incidencias_medias?: number
          salas_afectadas?: number
          total_incidencias?: number
          updated_at?: string
        }
        Relationships: []
      }
      role_area_mapping: {
        Row: {
          area_id: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          area_id?: string | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          area_id?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_area_mapping_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      salas: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_actions: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      user_area_access: {
        Row: {
          area_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_area_access_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      vista_consolidados_detallados: {
        Row: {
          archivo_pdf_url: string | null
          areas_afectadas: number | null
          created_at: string | null
          fecha_reporte: string | null
          id: string | null
          incidencias_altas: number | null
          incidencias_bajas: number | null
          incidencias_criticas: number | null
          incidencias_detalle: Json | null
          incidencias_medias: number | null
          salas_afectadas: number | null
          total_incidencias: number | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      actualizar_conteo_quincenal_sala: {
        Args: {
          p_sala_id: string
          p_tipo_incidencia: string
          p_minutos: number
          p_fecha?: string
        }
        Returns: boolean
      }
      add_participant_to_group: {
        Args: {
          _room_id: string
          _user_id: string
          _new_participant_id: string
        }
        Returns: boolean
      }
      aprobar_incidencia: {
        Args: { incidencia_id: string; nuevo_estado: string }
        Returns: boolean
      }
      create_group_chat: {
        Args: {
          _name: string
          _description: string
          _creator_id: string
          _participant_ids: string[]
        }
        Returns: string
      }
      create_private_chat: {
        Args: { _user1_id: string; _user2_id: string }
        Returns: string
      }
      delete_user_fcm_tokens: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      generar_reporte_consolidado: {
        Args: { fecha_objetivo?: string }
        Returns: string
      }
      get_notification_admins: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          full_name: string
          role: string
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      insert_fcm_token: {
        Args: { p_user_id: string; p_token: string; p_device_type?: string }
        Returns: undefined
      }
      log_user_action: {
        Args: {
          p_action_type: string
          p_resource_type?: string
          p_resource_id?: string
          p_details?: Json
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: string
      }
      mark_messages_as_read: {
        Args: { _room_id: string; _user_id: string }
        Returns: number
      }
      obtener_consolidado_con_medios: {
        Args: { fecha_consolidado: string }
        Returns: Json
      }
      obtener_conteo_quincenal_sala: {
        Args: { p_sala_id: string; p_fecha?: string }
        Returns: string
      }
      obtener_estadisticas_quincenales_sala: {
        Args: { p_año?: number; p_mes?: number }
        Returns: {
          sala_id: string
          sala_nombre: string
          año: number
          mes: number
          quincena: number
          minutos_ingresos_tardios: number
          minutos_cierres_prematuros: number
          total_incidencias_ingresos: number
          total_incidencias_cierres: number
          total_minutos: number
        }[]
      }
      recalcular_conteos_quincenales: {
        Args: { p_año?: number; p_mes?: number }
        Returns: string
      }
      user_can_access_chat_room: {
        Args: { _user_id: string; _room_id: string }
        Returns: boolean
      }
      user_has_area_access: {
        Args: { _user_id: string; _area_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "monitor"
        | "supervisor_monitoreo"
        | "rrhh"
        | "supervisor_salas"
        | "finanzas"
        | "mantenimiento"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "monitor",
        "supervisor_monitoreo",
        "rrhh",
        "supervisor_salas",
        "finanzas",
        "mantenimiento",
      ],
    },
  },
} as const
