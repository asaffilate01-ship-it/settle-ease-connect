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
      case_documents: {
        Row: {
          case_id: string
          created_at: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          notes: string | null
          size_bytes: number | null
          uploaded_by: string | null
          visible_to_expert: boolean
        }
        Insert: {
          case_id: string
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
          visible_to_expert?: boolean
        }
        Update: {
          case_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
          visible_to_expert?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "case_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_events: {
        Row: {
          actor_user_id: string | null
          case_id: string
          created_at: string
          event_type: string
          id: string
          payload: Json
        }
        Insert: {
          actor_user_id?: string | null
          case_id: string
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
        }
        Update: {
          actor_user_id?: string | null
          case_id?: string
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "case_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_invoices: {
        Row: {
          amount_eur: number
          case_id: string
          created_at: string
          expert_id: string | null
          id: string
          paid_at: string | null
          payout_to_expert_eur: number | null
          platform_fee_eur: number
          quote_id: string | null
          released_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          updated_at: string
          vat_eur: number
        }
        Insert: {
          amount_eur: number
          case_id: string
          created_at?: string
          expert_id?: string | null
          id?: string
          paid_at?: string | null
          payout_to_expert_eur?: number | null
          platform_fee_eur?: number
          quote_id?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
          vat_eur?: number
        }
        Update: {
          amount_eur?: number
          case_id?: string
          created_at?: string
          expert_id?: string | null
          id?: string
          paid_at?: string | null
          payout_to_expert_eur?: number | null
          platform_fee_eur?: number
          quote_id?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
          vat_eur?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_invoices_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_invoices_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "case_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      case_messages: {
        Row: {
          body: string
          case_id: string
          created_at: string
          id: string
          internal_note: boolean
          sender_user_id: string
        }
        Insert: {
          body: string
          case_id: string
          created_at?: string
          id?: string
          internal_note?: boolean
          sender_user_id: string
        }
        Update: {
          body?: string
          case_id?: string
          created_at?: string
          id?: string
          internal_note?: boolean
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_participants: {
        Row: {
          added_at: string
          case_id: string
          expert_id: string | null
          id: string
          role: Database["public"]["Enums"]["case_participant_role"]
          user_id: string
        }
        Insert: {
          added_at?: string
          case_id: string
          expert_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["case_participant_role"]
          user_id: string
        }
        Update: {
          added_at?: string
          case_id?: string
          expert_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["case_participant_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_participants_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_participants_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
        ]
      }
      case_quotes: {
        Row: {
          amount_eur: number
          case_id: string
          compensation_model: Database["public"]["Enums"]["compensation_model"]
          created_at: string
          created_by: string | null
          description: string | null
          expert_id: string | null
          id: string
          platform_fee_eur: number | null
          platform_fee_pct: number
          responded_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["quote_status"]
          title: string
          updated_at: string
          vat_pct: number
        }
        Insert: {
          amount_eur: number
          case_id: string
          compensation_model?: Database["public"]["Enums"]["compensation_model"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          expert_id?: string | null
          id?: string
          platform_fee_eur?: number | null
          platform_fee_pct?: number
          responded_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          title: string
          updated_at?: string
          vat_pct?: number
        }
        Update: {
          amount_eur?: number
          case_id?: string
          compensation_model?: Database["public"]["Enums"]["compensation_model"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          expert_id?: string | null
          id?: string
          platform_fee_eur?: number | null
          platform_fee_pct?: number
          responded_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          title?: string
          updated_at?: string
          vat_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_quotes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_quotes_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
        ]
      }
      case_tasks: {
        Row: {
          assignee_role:
            | Database["public"]["Enums"]["case_participant_role"]
            | null
          assignee_user_id: string | null
          case_id: string
          created_at: string
          created_by: string | null
          description: string | null
          done: boolean
          done_at: string | null
          due_at: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_role?:
            | Database["public"]["Enums"]["case_participant_role"]
            | null
          assignee_user_id?: string | null
          case_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          done?: boolean
          done_at?: string | null
          due_at?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_role?:
            | Database["public"]["Enums"]["case_participant_role"]
            | null
          assignee_user_id?: string | null
          case_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          done?: boolean
          done_at?: string | null
          due_at?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_tasks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          bundesland: string | null
          case_manager_user_id: string | null
          case_type: Database["public"]["Enums"]["case_type"]
          city: string | null
          client_user_id: string
          closed_at: string | null
          created_at: string
          id: string
          language: string
          opened_at: string
          primary_expert_id: string | null
          reference: string
          status: Database["public"]["Enums"]["case_status"]
          summary: string | null
          title: string
          updated_at: string
          urgent: boolean
        }
        Insert: {
          bundesland?: string | null
          case_manager_user_id?: string | null
          case_type: Database["public"]["Enums"]["case_type"]
          city?: string | null
          client_user_id: string
          closed_at?: string | null
          created_at?: string
          id?: string
          language?: string
          opened_at?: string
          primary_expert_id?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["case_status"]
          summary?: string | null
          title: string
          updated_at?: string
          urgent?: boolean
        }
        Update: {
          bundesland?: string | null
          case_manager_user_id?: string | null
          case_type?: Database["public"]["Enums"]["case_type"]
          city?: string | null
          client_user_id?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          language?: string
          opened_at?: string
          primary_expert_id?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["case_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          urgent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cases_primary_expert_id_fkey"
            columns: ["primary_expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
        ]
      }
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
          compensation_model: Database["public"]["Enums"]["compensation_model"]
          created_at: string
          email: string | null
          full_name: string
          hourly_rate_eur: number | null
          id: string
          kammer_authority: string | null
          languages: string[]
          phone: string | null
          profession: string
          referral_fee_pct: number | null
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
          compensation_model?: Database["public"]["Enums"]["compensation_model"]
          created_at?: string
          email?: string | null
          full_name: string
          hourly_rate_eur?: number | null
          id?: string
          kammer_authority?: string | null
          languages?: string[]
          phone?: string | null
          profession: string
          referral_fee_pct?: number | null
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
          compensation_model?: Database["public"]["Enums"]["compensation_model"]
          created_at?: string
          email?: string | null
          full_name?: string
          hourly_rate_eur?: number | null
          id?: string
          kammer_authority?: string | null
          languages?: string[]
          phone?: string | null
          profession?: string
          referral_fee_pct?: number | null
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
      insurance_leads: {
        Row: {
          age: number
          assigned_to: string | null
          benefit_amount: number
          created_at: string
          email: string
          estimated_premium_max: number | null
          estimated_premium_min: number | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          preferred_language: string | null
          source: string | null
          status: string
          tobacco: boolean
          updated_at: string
          waiting_period_months: number
        }
        Insert: {
          age: number
          assigned_to?: string | null
          benefit_amount?: number
          created_at?: string
          email: string
          estimated_premium_max?: number | null
          estimated_premium_min?: number | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          preferred_language?: string | null
          source?: string | null
          status?: string
          tobacco?: boolean
          updated_at?: string
          waiting_period_months?: number
        }
        Update: {
          age?: number
          assigned_to?: string | null
          benefit_amount?: number
          created_at?: string
          email?: string
          estimated_premium_max?: number | null
          estimated_premium_min?: number | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          preferred_language?: string | null
          source?: string | null
          status?: string
          tobacco?: boolean
          updated_at?: string
          waiting_period_months?: number
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
      subscription_plans: {
        Row: {
          active: boolean
          code: string
          created_at: string
          features: Json
          household_kind: string
          id: string
          max_adults: number
          max_children: number
          monthly_price_eur: number
          name: string
          plan_group: string | null
          sort_order: number
          stripe_price_id: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          features?: Json
          household_kind?: string
          id?: string
          max_adults?: number
          max_children?: number
          monthly_price_eur: number
          name: string
          plan_group?: string | null
          sort_order?: number
          stripe_price_id?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          features?: Json
          household_kind?: string
          id?: string
          max_adults?: number
          max_children?: number
          monthly_price_eur?: number
          name?: string
          plan_group?: string | null
          sort_order?: number
          stripe_price_id?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          plan_code: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_code: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_code?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["code"]
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
      vault_access_log: {
        Row: {
          accessed_by_user_id: string | null
          action: string
          created_at: string
          document_id: string | null
          id: string
          ip: string | null
          reason: string | null
          user_agent: string | null
          vault_owner_user_id: string
        }
        Insert: {
          accessed_by_user_id?: string | null
          action: string
          created_at?: string
          document_id?: string | null
          id?: string
          ip?: string | null
          reason?: string | null
          user_agent?: string | null
          vault_owner_user_id: string
        }
        Update: {
          accessed_by_user_id?: string | null
          action?: string
          created_at?: string
          document_id?: string | null
          id?: string
          ip?: string | null
          reason?: string | null
          user_agent?: string | null
          vault_owner_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_access_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "vault_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_deputies: {
        Row: {
          accepted_at: string | null
          access_granted: boolean
          access_granted_at: string | null
          access_rule: string
          allowed_categories: string[]
          created_at: string
          deputy_user_id: string | null
          full_name: string
          id: string
          invite_email: string
          invited_at: string
          min_confirmations: number
          owner_user_id: string
          phone: string | null
          relationship: string | null
          status: string
          updated_at: string
          verification_method: string
        }
        Insert: {
          accepted_at?: string | null
          access_granted?: boolean
          access_granted_at?: string | null
          access_rule: string
          allowed_categories?: string[]
          created_at?: string
          deputy_user_id?: string | null
          full_name: string
          id?: string
          invite_email: string
          invited_at?: string
          min_confirmations?: number
          owner_user_id: string
          phone?: string | null
          relationship?: string | null
          status?: string
          updated_at?: string
          verification_method?: string
        }
        Update: {
          accepted_at?: string | null
          access_granted?: boolean
          access_granted_at?: string | null
          access_rule?: string
          allowed_categories?: string[]
          created_at?: string
          deputy_user_id?: string | null
          full_name?: string
          id?: string
          invite_email?: string
          invited_at?: string
          min_confirmations?: number
          owner_user_id?: string
          phone?: string | null
          relationship?: string | null
          status?: string
          updated_at?: string
          verification_method?: string
        }
        Relationships: []
      }
      vault_documents: {
        Row: {
          category: string
          checksum: string | null
          country: string | null
          created_at: string
          document_number: string | null
          expiry_date: string | null
          file_name: string | null
          file_size: number | null
          id: string
          is_sensitive: boolean
          issue_date: string | null
          issuer: string | null
          label: string
          mime_type: string | null
          notes: string | null
          owner_user_id: string
          storage_path: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category: string
          checksum?: string | null
          country?: string | null
          created_at?: string
          document_number?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          is_sensitive?: boolean
          issue_date?: string | null
          issuer?: string | null
          label: string
          mime_type?: string | null
          notes?: string | null
          owner_user_id: string
          storage_path?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string
          checksum?: string | null
          country?: string | null
          created_at?: string
          document_number?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          is_sensitive?: boolean
          issue_date?: string | null
          issuer?: string | null
          label?: string
          mime_type?: string | null
          notes?: string | null
          owner_user_id?: string
          storage_path?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      vault_unlock_confirmations: {
        Row: {
          confirmed_at: string
          confirmed_by_user_id: string
          deputy_id: string
          id: string
          unlock_request_id: string
        }
        Insert: {
          confirmed_at?: string
          confirmed_by_user_id: string
          deputy_id: string
          id?: string
          unlock_request_id: string
        }
        Update: {
          confirmed_at?: string
          confirmed_by_user_id?: string
          deputy_id?: string
          id?: string
          unlock_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_unlock_confirmations_deputy_id_fkey"
            columns: ["deputy_id"]
            isOneToOne: false
            referencedRelation: "vault_deputies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_unlock_confirmations_unlock_request_id_fkey"
            columns: ["unlock_request_id"]
            isOneToOne: false
            referencedRelation: "vault_unlock_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_unlock_requests: {
        Row: {
          created_at: string
          event_type: string
          evidence_note: string | null
          evidence_storage_path: string | null
          id: string
          owner_user_id: string
          rejection_reason: string | null
          requested_by_user_id: string
          status: string
          updated_at: string
          verification_method: string
          verified_at: string | null
          verified_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          evidence_note?: string | null
          evidence_storage_path?: string | null
          id?: string
          owner_user_id: string
          rejection_reason?: string | null
          requested_by_user_id: string
          status?: string
          updated_at?: string
          verification_method: string
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          evidence_note?: string | null
          evidence_storage_path?: string | null
          id?: string
          owner_user_id?: string
          rejection_reason?: string | null
          requested_by_user_id?: string
          status?: string
          updated_at?: string
          verification_method?: string
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_case: {
        Args: { _case_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_internal: { Args: { _user_id: string }; Returns: boolean }
      vault_deputy_can_read: {
        Args: { _category: string; _deputy_user: string; _owner_user: string }
        Returns: boolean
      }
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
      case_participant_role:
        | "client"
        | "case_manager"
        | "expert"
        | "observer"
        | "admin"
      case_status:
        | "new"
        | "triage"
        | "in_progress"
        | "awaiting_client"
        | "awaiting_expert"
        | "on_hold"
        | "completed"
        | "closed"
        | "cancelled"
      case_type:
        | "bereavement"
        | "visa_application"
        | "visa_extension"
        | "nationality"
        | "family_reunification"
        | "benefits_claim"
        | "housing"
        | "tax"
        | "education"
        | "healthcare"
        | "translation"
        | "driving"
        | "business"
        | "other"
      compensation_model: "referral_fee" | "wholesale" | "direct_bill"
      invoice_status:
        | "pending"
        | "paid"
        | "held_escrow"
        | "released"
        | "refunded"
        | "failed"
        | "cancelled"
      quote_status:
        | "draft"
        | "sent"
        | "accepted"
        | "declined"
        | "expired"
        | "superseded"
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
      case_participant_role: [
        "client",
        "case_manager",
        "expert",
        "observer",
        "admin",
      ],
      case_status: [
        "new",
        "triage",
        "in_progress",
        "awaiting_client",
        "awaiting_expert",
        "on_hold",
        "completed",
        "closed",
        "cancelled",
      ],
      case_type: [
        "bereavement",
        "visa_application",
        "visa_extension",
        "nationality",
        "family_reunification",
        "benefits_claim",
        "housing",
        "tax",
        "education",
        "healthcare",
        "translation",
        "driving",
        "business",
        "other",
      ],
      compensation_model: ["referral_fee", "wholesale", "direct_bill"],
      invoice_status: [
        "pending",
        "paid",
        "held_escrow",
        "released",
        "refunded",
        "failed",
        "cancelled",
      ],
      quote_status: [
        "draft",
        "sent",
        "accepted",
        "declined",
        "expired",
        "superseded",
      ],
    },
  },
} as const
