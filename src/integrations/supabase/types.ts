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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      directory_listings: {
        Row: {
          address: string | null
          bundesland: string | null
          business_name: string
          category: string
          city: string | null
          created_at: string
          description: string | null
          email: string | null
          featured: boolean
          id: string
          languages: string[]
          logo_url: string | null
          owner_user_id: string | null
          paid_until: string | null
          phone: string | null
          status: string
          subcategory: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          bundesland?: string | null
          business_name: string
          category: string
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          featured?: boolean
          id?: string
          languages?: string[]
          logo_url?: string | null
          owner_user_id?: string | null
          paid_until?: string | null
          phone?: string | null
          status?: string
          subcategory?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          bundesland?: string | null
          business_name?: string
          category?: string
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          featured?: boolean
          id?: string
          languages?: string[]
          logo_url?: string | null
          owner_user_id?: string | null
          paid_until?: string | null
          phone?: string | null
          status?: string
          subcategory?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      expert_services: {
        Row: {
          expert_id: string
          is_lead: boolean
          note: string | null
          service_id: string
        }
        Insert: {
          expert_id: string
          is_lead?: boolean
          note?: string | null
          service_id: string
        }
        Update: {
          expert_id?: string
          is_lead?: boolean
          note?: string | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_services_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "knowledge_services"
            referencedColumns: ["id"]
          },
        ]
      }
      experts: {
        Row: {
          availability_notes: string | null
          bio: string | null
          bundesland: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string
          hourly_rate_eur: number | null
          id: string
          kammer_authority: string | null
          languages: string[]
          phone: string | null
          profession: string
          registration_number: string | null
          specialisations: string[]
          status: string
          updated_at: string
          user_id: string | null
          verified: boolean
          verified_at: string | null
          wholesale_rate_eur: number | null
        }
        Insert: {
          availability_notes?: string | null
          bio?: string | null
          bundesland?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          hourly_rate_eur?: number | null
          id?: string
          kammer_authority?: string | null
          languages?: string[]
          phone?: string | null
          profession: string
          registration_number?: string | null
          specialisations?: string[]
          status?: string
          updated_at?: string
          user_id?: string | null
          verified?: boolean
          verified_at?: string | null
          wholesale_rate_eur?: number | null
        }
        Update: {
          availability_notes?: string | null
          bio?: string | null
          bundesland?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          hourly_rate_eur?: number | null
          id?: string
          kammer_authority?: string | null
          languages?: string[]
          phone?: string | null
          profession?: string
          registration_number?: string | null
          specialisations?: string[]
          status?: string
          updated_at?: string
          user_id?: string | null
          verified?: boolean
          verified_at?: string | null
          wholesale_rate_eur?: number | null
        }
        Relationships: []
      }
      knowledge_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_regulations: {
        Row: {
          authority: string | null
          code: string
          created_at: string
          id: string
          jurisdiction: string
          last_reviewed_at: string | null
          official_url: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          authority?: string | null
          code: string
          created_at?: string
          id?: string
          jurisdiction?: string
          last_reviewed_at?: string | null
          official_url?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          authority?: string | null
          code?: string
          created_at?: string
          id?: string
          jurisdiction?: string
          last_reviewed_at?: string | null
          official_url?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_service_regulations: {
        Row: {
          note: string | null
          regulation_id: string
          service_id: string
        }
        Insert: {
          note?: string | null
          regulation_id: string
          service_id: string
        }
        Update: {
          note?: string | null
          regulation_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_service_regulations_regulation_id_fkey"
            columns: ["regulation_id"]
            isOneToOne: false
            referencedRelation: "knowledge_regulations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_service_regulations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "knowledge_services"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_services: {
        Row: {
          category_id: string
          common_pitfalls: Json
          created_at: string
          delivery_playbook: Json
          eligibility: string | null
          escalation_contacts: Json
          id: string
          jurisdiction_notes: string | null
          languages: string[]
          last_reviewed_at: string | null
          last_reviewed_by: string | null
          legal_basis: string | null
          name: string
          official_fees: string | null
          our_wholesale_notes: string | null
          required_documents: Json
          requires_expert_role: string | null
          short_description: string | null
          slug: string
          status: string
          typical_timeline: string | null
          updated_at: string
        }
        Insert: {
          category_id: string
          common_pitfalls?: Json
          created_at?: string
          delivery_playbook?: Json
          eligibility?: string | null
          escalation_contacts?: Json
          id?: string
          jurisdiction_notes?: string | null
          languages?: string[]
          last_reviewed_at?: string | null
          last_reviewed_by?: string | null
          legal_basis?: string | null
          name: string
          official_fees?: string | null
          our_wholesale_notes?: string | null
          required_documents?: Json
          requires_expert_role?: string | null
          short_description?: string | null
          slug: string
          status?: string
          typical_timeline?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          common_pitfalls?: Json
          created_at?: string
          delivery_playbook?: Json
          eligibility?: string | null
          escalation_contacts?: Json
          id?: string
          jurisdiction_notes?: string | null
          languages?: string[]
          last_reviewed_at?: string | null
          last_reviewed_by?: string | null
          legal_basis?: string | null
          name?: string
          official_fees?: string | null
          our_wholesale_notes?: string | null
          required_documents?: Json
          requires_expert_role?: string | null
          short_description?: string | null
          slug?: string
          status?: string
          typical_timeline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          preferred_language: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          preferred_language?: string
          updated_at?: string
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_internal: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "family"
        | "case_manager"
        | "funeral_director"
        | "mosque"
        | "church"
        | "temple"
        | "hospital"
        | "admin"
        | "staff"
        | "expert"
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
        "family",
        "case_manager",
        "funeral_director",
        "mosque",
        "church",
        "temple",
        "hospital",
        "admin",
        "staff",
        "expert",
      ],
    },
  },
} as const
