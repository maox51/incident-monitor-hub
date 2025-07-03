export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      incidencias: {
        Row: {
          area_id: string
          clasificacion_id: string
          created_at: string
          descripcion: string
          fecha_incidencia: string
          id: string
          observaciones: string | null
          prioridad: string
          reportado_por: string
          sala_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          area_id: string
          clasificacion_id: string
          created_at?: string
          descripcion: string
          fecha_incidencia?: string
          id?: string
          observaciones?: string | null
          prioridad?: string
          reportado_por: string
          sala_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          area_id?: string
          clasificacion_id?: string
          created_at?: string
          descripcion?: string
          fecha_incidencia?: string
          id?: string
          observaciones?: string | null
          prioridad?: string
          reportado_por?: string
          sala_id?: string | null
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
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
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
      generar_reporte_consolidado: {
        Args: { fecha_objetivo?: string }
        Returns: string
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
      obtener_consolidado_con_medios: {
        Args: { fecha_consolidado: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "monitor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "monitor"],
    },
  },
} as const
