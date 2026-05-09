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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      boundingBoxes: {
        Row: {
          city: string
          createdAt: string
          latitude1: number
          latitude2: number
          longitude1: number
          longitude2: number
          state: string
        }
        Insert: {
          city: string
          createdAt?: string
          latitude1: number
          latitude2: number
          longitude1: number
          longitude2: number
          state: string
        }
        Update: {
          city?: string
          createdAt?: string
          latitude1?: number
          latitude2?: number
          longitude1?: number
          longitude2?: number
          state?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          bedrooms: number | null
          builtArea: number | null
          caixaId: string
          city: string | null
          createdAt: string | null
          discount: number | null
          evaluationPrice: number | null
          geocodePrecision: string | null
          geocodeProvider: string | null
          landArea: number | null
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          number: number | null
          price: number | null
          priceAsCurrency: string | null
          sellingType: string | null
          state: string | null
          street: string | null
          totalArea: number | null
          type: string | null
        }
        Insert: {
          address?: string | null
          bedrooms?: number | null
          builtArea?: number | null
          caixaId: string
          city?: string | null
          createdAt?: string | null
          discount?: number | null
          evaluationPrice?: number | null
          geocodePrecision?: string | null
          geocodeProvider?: string | null
          landArea?: number | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: number | null
          price?: number | null
          priceAsCurrency?: string | null
          sellingType?: string | null
          state?: string | null
          street?: string | null
          totalArea?: number | null
          type?: string | null
        }
        Update: {
          address?: string | null
          bedrooms?: number | null
          builtArea?: number | null
          caixaId?: string
          city?: string | null
          createdAt?: string | null
          discount?: number | null
          evaluationPrice?: number | null
          geocodePrecision?: string | null
          geocodeProvider?: string | null
          landArea?: number | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: number | null
          price?: number | null
          priceAsCurrency?: string | null
          sellingType?: string | null
          state?: string | null
          street?: string | null
          totalArea?: number | null
          type?: string | null
        }
        Relationships: []
      }
      pipeline_state: {
        Row: {
          id: number
          current_step: string
          updated_at: string
          locked_until: string | null
        }
        Insert: {
          id?: number
          current_step?: string
          updated_at?: string
          locked_until?: string | null
        }
        Update: {
          id?: number
          current_step?: string
          updated_at?: string
          locked_until?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acquire_pipeline_lock: {
        Args: {
          lock_duration_ms?: number
        }
        Returns: {
          id: number
          current_step: string
          updated_at: string
          locked_until: string | null
        }[]
      }
      release_pipeline_lock: {
        Args: {
          new_step: string
          update_time?: string
          bump_updated_at?: boolean
        }
        Returns: undefined
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
    Enums: {},
  },
} as const
