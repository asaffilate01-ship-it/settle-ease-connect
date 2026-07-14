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
      agent_commissions: {
        Row: {
          agent_user_id: string
          commission_eur: number
          commission_rate: number
          created_at: string
          gross_eur: number
          id: string
          notes: string | null
          paid_at: string | null
          period_month: string
          product: string
          referred_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_user_id: string
          commission_eur?: number
          commission_rate?: number
          created_at?: string
          gross_eur?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_month: string
          product?: string
          referred_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_user_id?: string
          commission_eur?: number
          commission_rate?: number
          created_at?: string
          gross_eur?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_month?: string
          product?: string
          referred_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_referrals: {
        Row: {
          agent_user_id: string
          created_at: string
          id: string
          notes: string | null
          product: string | null
          referred_email: string | null
          referred_user_id: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_user_id: string
          created_at?: string
          id?: string
          notes?: string | null
          product?: string | null
          referred_email?: string | null
          referred_user_id?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_user_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          product?: string | null
          referred_email?: string | null
          referred_user_id?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          code: string
          commission_rate: number
          created_at: string
          display_name: string | null
          id: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          commission_rate?: number
          created_at?: string
          display_name?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          commission_rate?: number
          created_at?: string
          display_name?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: number
          ip: string | null
          metadata: Json
          subject_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: number
          ip?: string | null
          metadata?: Json
          subject_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: number
          ip?: string | null
          metadata?: Json
          subject_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          reporter_id: string
          screenshot_url: string | null
          severity: string
          source_route: string | null
          status: string
          title: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reporter_id: string
          screenshot_url?: string | null
          severity: string
          source_route?: string | null
          status?: string
          title: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reporter_id?: string
          screenshot_url?: string | null
          severity?: string
          source_route?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      case_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assignee_expert_id: string | null
          assignee_user_id: string | null
          case_id: string
          completed_at: string | null
          id: string
          notes: string | null
          responded_at: string | null
          role: string
          scope: string | null
          status: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assignee_expert_id?: string | null
          assignee_user_id?: string | null
          case_id: string
          completed_at?: string | null
          id?: string
          notes?: string | null
          responded_at?: string | null
          role: string
          scope?: string | null
          status?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assignee_expert_id?: string | null
          assignee_user_id?: string | null
          case_id?: string
          completed_at?: string | null
          id?: string
          notes?: string | null
          responded_at?: string | null
          role?: string
          scope?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_assignments_assignee_expert_id_fkey"
            columns: ["assignee_expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_assignments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
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
          last_nudged_at: string | null
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
          last_nudged_at?: string | null
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
          last_nudged_at?: string | null
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
          depends_on: string | null
          description: string | null
          done: boolean
          done_at: string | null
          due_at: string | null
          estimated_hours: number | null
          id: string
          progress_pct: number
          start_at: string | null
          status: string
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
          depends_on?: string | null
          description?: string | null
          done?: boolean
          done_at?: string | null
          due_at?: string | null
          estimated_hours?: number | null
          id?: string
          progress_pct?: number
          start_at?: string | null
          status?: string
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
          depends_on?: string | null
          description?: string | null
          done?: boolean
          done_at?: string | null
          due_at?: string | null
          estimated_hours?: number | null
          id?: string
          progress_pct?: number
          start_at?: string | null
          status?: string
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
          {
            foreignKeyName: "case_tasks_depends_on_fkey"
            columns: ["depends_on"]
            isOneToOne: false
            referencedRelation: "case_tasks"
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
      channel_members: {
        Row: {
          channel_id: string
          joined_at: string
          last_read_at: string | null
          muted: boolean
          role: string
          user_id: string
        }
        Insert: {
          channel_id: string
          joined_at?: string
          last_read_at?: string | null
          muted?: boolean
          role?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          joined_at?: string
          last_read_at?: string | null
          muted?: boolean
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "message_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_messages: {
        Row: {
          body: string | null
          channel_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          reply_to_id: string | null
          sender_user_id: string
        }
        Insert: {
          body?: string | null
          channel_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          reply_to_id?: string | null
          sender_user_id: string
        }
        Update: {
          body?: string | null
          channel_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          reply_to_id?: string | null
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "message_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "channel_messages"
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
      embassies: {
        Row: {
          active: boolean | null
          address: string | null
          city: string
          country: string
          country_code: string
          created_at: string
          email: string | null
          emergency_phone: string | null
          id: string
          languages: string[] | null
          mission_type: string
          notes: string | null
          opening_hours: string | null
          phone: string | null
          updated_at: string
          visa_services: string[] | null
          website: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          city: string
          country: string
          country_code: string
          created_at?: string
          email?: string | null
          emergency_phone?: string | null
          id?: string
          languages?: string[] | null
          mission_type?: string
          notes?: string | null
          opening_hours?: string | null
          phone?: string | null
          updated_at?: string
          visa_services?: string[] | null
          website?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          city?: string
          country?: string
          country_code?: string
          created_at?: string
          email?: string | null
          emergency_phone?: string | null
          id?: string
          languages?: string[] | null
          mission_type?: string
          notes?: string | null
          opening_hours?: string | null
          phone?: string | null
          updated_at?: string
          visa_services?: string[] | null
          website?: string | null
        }
        Relationships: []
      }
      emergency_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          client_user_id: string
          created_at: string
          description: string | null
          id: string
          raised_by_contact_id: string | null
          raised_by_user_id: string | null
          reason: string
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          client_user_id: string
          created_at?: string
          description?: string | null
          id?: string
          raised_by_contact_id?: string | null
          raised_by_user_id?: string | null
          reason: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          client_user_id?: string
          created_at?: string
          description?: string | null
          id?: string
          raised_by_contact_id?: string | null
          raised_by_user_id?: string | null
          reason?: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_alerts_raised_by_contact_id_fkey"
            columns: ["raised_by_contact_id"]
            isOneToOne: false
            referencedRelation: "trusted_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_records: {
        Row: {
          client_user_id: string
          contract_type: string | null
          created_at: string
          currency: string | null
          employer: string
          end_date: string | null
          gross_salary_cents: number | null
          hr_contact_email: string | null
          hr_contact_name: string | null
          hr_contact_phone: string | null
          id: string
          notes: string | null
          role: string | null
          start_date: string | null
          tax_class: string | null
          updated_at: string
          works_council: string | null
        }
        Insert: {
          client_user_id: string
          contract_type?: string | null
          created_at?: string
          currency?: string | null
          employer: string
          end_date?: string | null
          gross_salary_cents?: number | null
          hr_contact_email?: string | null
          hr_contact_name?: string | null
          hr_contact_phone?: string | null
          id?: string
          notes?: string | null
          role?: string | null
          start_date?: string | null
          tax_class?: string | null
          updated_at?: string
          works_council?: string | null
        }
        Update: {
          client_user_id?: string
          contract_type?: string | null
          created_at?: string
          currency?: string | null
          employer?: string
          end_date?: string | null
          gross_salary_cents?: number | null
          hr_contact_email?: string | null
          hr_contact_name?: string | null
          hr_contact_phone?: string | null
          id?: string
          notes?: string | null
          role?: string | null
          start_date?: string | null
          tax_class?: string | null
          updated_at?: string
          works_council?: string | null
        }
        Relationships: []
      }
      expert_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          bundesland: string | null
          city: string | null
          compensation_model: Database["public"]["Enums"]["compensation_model"]
          created_at: string
          created_expert_id: string | null
          email: string
          expires_at: string
          full_name: string
          hourly_rate_eur: number | null
          id: string
          invited_by: string | null
          languages: string[]
          personal_message: string | null
          profession: string
          referral_fee_pct: number | null
          token: string
          updated_at: string
          wholesale_rate_eur: number | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          bundesland?: string | null
          city?: string | null
          compensation_model?: Database["public"]["Enums"]["compensation_model"]
          created_at?: string
          created_expert_id?: string | null
          email: string
          expires_at?: string
          full_name: string
          hourly_rate_eur?: number | null
          id?: string
          invited_by?: string | null
          languages?: string[]
          personal_message?: string | null
          profession: string
          referral_fee_pct?: number | null
          token: string
          updated_at?: string
          wholesale_rate_eur?: number | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          bundesland?: string | null
          city?: string | null
          compensation_model?: Database["public"]["Enums"]["compensation_model"]
          created_at?: string
          created_expert_id?: string | null
          email?: string
          expires_at?: string
          full_name?: string
          hourly_rate_eur?: number | null
          id?: string
          invited_by?: string | null
          languages?: string[]
          personal_message?: string | null
          profession?: string
          referral_fee_pct?: number | null
          token?: string
          updated_at?: string
          wholesale_rate_eur?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_invitations_created_expert_id_fkey"
            columns: ["created_expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_payouts: {
        Row: {
          amount_eur: number
          case_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          expert_id: string
          gross_eur: number
          id: string
          invoice_id: string | null
          kind: string
          notes: string | null
          paid_at: string | null
          payment_reference: string | null
          period_month: string
          rate: number | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_eur: number
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expert_id: string
          gross_eur?: number
          id?: string
          invoice_id?: string | null
          kind: string
          notes?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          period_month?: string
          rate?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_eur?: number
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expert_id?: string
          gross_eur?: number
          id?: string
          invoice_id?: string | null
          kind?: string
          notes?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          period_month?: string
          rate?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_payouts_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_payouts_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_payouts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "case_invoices"
            referencedColumns: ["id"]
          },
        ]
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
      family_members: {
        Row: {
          added_to_health_insurance_id: string | null
          arrival_date: string | null
          client_user_id: string
          covered_by_subscription: boolean | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          id: string
          nationality: string | null
          notes: string | null
          passport_number: string | null
          relationship: string
          residency_status: string | null
          updated_at: string
        }
        Insert: {
          added_to_health_insurance_id?: string | null
          arrival_date?: string | null
          client_user_id: string
          covered_by_subscription?: boolean | null
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          id?: string
          nationality?: string | null
          notes?: string | null
          passport_number?: string | null
          relationship: string
          residency_status?: string | null
          updated_at?: string
        }
        Update: {
          added_to_health_insurance_id?: string | null
          arrival_date?: string | null
          client_user_id?: string
          covered_by_subscription?: boolean | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          id?: string
          nationality?: string | null
          notes?: string | null
          passport_number?: string | null
          relationship?: string
          residency_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_added_to_health_insurance_id_fkey"
            columns: ["added_to_health_insurance_id"]
            isOneToOne: false
            referencedRelation: "health_insurance"
            referencedColumns: ["id"]
          },
        ]
      }
      funeral_leads: {
        Row: {
          adults_count: number
          assigned_to: string | null
          bundesland: string | null
          children_count: number
          city: string | null
          contact_name: string
          created_at: string
          email: string
          household_kind: string
          id: string
          internal_notes: string | null
          notes: string | null
          phone: string | null
          status: string
          target_benefit_eur: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          adults_count?: number
          assigned_to?: string | null
          bundesland?: string | null
          children_count?: number
          city?: string | null
          contact_name: string
          created_at?: string
          email: string
          household_kind?: string
          id?: string
          internal_notes?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          target_benefit_eur?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          adults_count?: number
          assigned_to?: string | null
          bundesland?: string | null
          children_count?: number
          city?: string | null
          contact_name?: string
          created_at?: string
          email?: string
          household_kind?: string
          id?: string
          internal_notes?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          target_benefit_eur?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      funeral_policies: {
        Row: {
          adults_covered: number
          benefit_eur: number
          children_covered: number
          created_at: string
          end_date: string | null
          household_kind: string
          id: string
          insurer_name: string
          lead_id: string | null
          notes: string | null
          policy_number: string | null
          premium_cadence: string
          premium_eur: number
          renewal_date: string | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adults_covered?: number
          benefit_eur: number
          children_covered?: number
          created_at?: string
          end_date?: string | null
          household_kind?: string
          id?: string
          insurer_name: string
          lead_id?: string | null
          notes?: string | null
          policy_number?: string | null
          premium_cadence?: string
          premium_eur: number
          renewal_date?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adults_covered?: number
          benefit_eur?: number
          children_covered?: number
          created_at?: string
          end_date?: string | null
          household_kind?: string
          id?: string
          insurer_name?: string
          lead_id?: string | null
          notes?: string | null
          policy_number?: string | null
          premium_cadence?: string
          premium_eur?: number
          renewal_date?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funeral_policies_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "funeral_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      health_insurance: {
        Row: {
          addons: Json | null
          client_user_id: string
          created_at: string
          dependants_covered: number | null
          id: string
          kasse: string
          kind: string
          membership_number: string | null
          monthly_premium_cents: number | null
          notes: string | null
          start_date: string | null
          tariff: string | null
          updated_at: string
        }
        Insert: {
          addons?: Json | null
          client_user_id: string
          created_at?: string
          dependants_covered?: number | null
          id?: string
          kasse: string
          kind: string
          membership_number?: string | null
          monthly_premium_cents?: number | null
          notes?: string | null
          start_date?: string | null
          tariff?: string | null
          updated_at?: string
        }
        Update: {
          addons?: Json | null
          client_user_id?: string
          created_at?: string
          dependants_covered?: number | null
          id?: string
          kasse?: string
          kind?: string
          membership_number?: string | null
          monthly_premium_cents?: number | null
          notes?: string | null
          start_date?: string | null
          tariff?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      insurance_leads: {
        Row: {
          age: number | null
          assigned_to: string | null
          benefit_amount: number | null
          call_log: Json
          carrier_partner: string | null
          commission_pct: number | null
          created_at: string
          email: string
          estimated_premium_max: number | null
          estimated_premium_min: number | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          preferred_contact: string | null
          preferred_language: string | null
          product_line: string | null
          referring_agent_user_id: string | null
          source: string | null
          status: string
          tobacco: boolean | null
          updated_at: string
          waiting_period_months: number | null
        }
        Insert: {
          age?: number | null
          assigned_to?: string | null
          benefit_amount?: number | null
          call_log?: Json
          carrier_partner?: string | null
          commission_pct?: number | null
          created_at?: string
          email: string
          estimated_premium_max?: number | null
          estimated_premium_min?: number | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          preferred_contact?: string | null
          preferred_language?: string | null
          product_line?: string | null
          referring_agent_user_id?: string | null
          source?: string | null
          status?: string
          tobacco?: boolean | null
          updated_at?: string
          waiting_period_months?: number | null
        }
        Update: {
          age?: number | null
          assigned_to?: string | null
          benefit_amount?: number | null
          call_log?: Json
          carrier_partner?: string | null
          commission_pct?: number | null
          created_at?: string
          email?: string
          estimated_premium_max?: number | null
          estimated_premium_min?: number | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          preferred_contact?: string | null
          preferred_language?: string | null
          product_line?: string | null
          referring_agent_user_id?: string | null
          source?: string | null
          status?: string
          tobacco?: boolean | null
          updated_at?: string
          waiting_period_months?: number | null
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
          appeals_process: string | null
          category_id: string
          common_pitfalls: Json
          created_at: string
          delivery_playbook: Json
          eligibility: string | null
          escalation_contacts: Json
          fees_detail: string | null
          forms: Json
          id: string
          jurisdiction_notes: string | null
          languages: string[]
          last_reviewed_at: string | null
          last_reviewed_by: string | null
          legal_basis: string | null
          name: string
          official_fees: string | null
          online_portals: Json
          our_wholesale_notes: string | null
          required_documents: Json
          requires_expert_role: string | null
          short_description: string | null
          slug: string
          status: string
          tips: string | null
          typical_timeline: string | null
          updated_at: string
          where_to_apply: string | null
        }
        Insert: {
          appeals_process?: string | null
          category_id: string
          common_pitfalls?: Json
          created_at?: string
          delivery_playbook?: Json
          eligibility?: string | null
          escalation_contacts?: Json
          fees_detail?: string | null
          forms?: Json
          id?: string
          jurisdiction_notes?: string | null
          languages?: string[]
          last_reviewed_at?: string | null
          last_reviewed_by?: string | null
          legal_basis?: string | null
          name: string
          official_fees?: string | null
          online_portals?: Json
          our_wholesale_notes?: string | null
          required_documents?: Json
          requires_expert_role?: string | null
          short_description?: string | null
          slug: string
          status?: string
          tips?: string | null
          typical_timeline?: string | null
          updated_at?: string
          where_to_apply?: string | null
        }
        Update: {
          appeals_process?: string | null
          category_id?: string
          common_pitfalls?: Json
          created_at?: string
          delivery_playbook?: Json
          eligibility?: string | null
          escalation_contacts?: Json
          fees_detail?: string | null
          forms?: Json
          id?: string
          jurisdiction_notes?: string | null
          languages?: string[]
          last_reviewed_at?: string | null
          last_reviewed_by?: string | null
          legal_basis?: string | null
          name?: string
          official_fees?: string | null
          online_portals?: Json
          our_wholesale_notes?: string | null
          required_documents?: Json
          requires_expert_role?: string | null
          short_description?: string | null
          slug?: string
          status?: string
          tips?: string | null
          typical_timeline?: string | null
          updated_at?: string
          where_to_apply?: string | null
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
      location_points: {
        Row: {
          accuracy_m: number | null
          captured_at: string
          heading: number | null
          id: number
          lat: number
          lng: number
          share_id: string
          speed_mps: number | null
        }
        Insert: {
          accuracy_m?: number | null
          captured_at?: string
          heading?: number | null
          id?: number
          lat: number
          lng: number
          share_id: string
          speed_mps?: number | null
        }
        Update: {
          accuracy_m?: number | null
          captured_at?: string
          heading?: number | null
          id?: number
          lat?: number
          lng?: number
          share_id?: string
          speed_mps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "location_points_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "location_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      location_shares: {
        Row: {
          alert_id: string | null
          case_id: string | null
          expires_at: string
          id: string
          last_accuracy_m: number | null
          last_lat: number | null
          last_lng: number | null
          last_point_at: string | null
          message: string | null
          mode: string
          started_at: string
          status: string
          stopped_at: string | null
          user_id: string
        }
        Insert: {
          alert_id?: string | null
          case_id?: string | null
          expires_at: string
          id?: string
          last_accuracy_m?: number | null
          last_lat?: number | null
          last_lng?: number | null
          last_point_at?: string | null
          message?: string | null
          mode: string
          started_at?: string
          status?: string
          stopped_at?: string | null
          user_id: string
        }
        Update: {
          alert_id?: string | null
          case_id?: string | null
          expires_at?: string
          id?: string
          last_accuracy_m?: number | null
          last_lat?: number | null
          last_lng?: number | null
          last_point_at?: string | null
          message?: string | null
          mode?: string
          started_at?: string
          status?: string
          stopped_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          message_id: string
          mime_type: string | null
          size_bytes: number | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          message_id: string
          mime_type?: string | null
          size_bytes?: number | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          message_id?: string
          mime_type?: string | null
          size_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "channel_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_channels: {
        Row: {
          case_id: string | null
          created_at: string
          created_by: string
          id: string
          kind: string
          last_message_at: string | null
          name: string | null
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          kind: string
          last_message_at?: string | null
          name?: string | null
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          kind?: string
          last_message_at?: string | null
          name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_channels_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          categories: Json
          email_enabled: boolean
          inapp_enabled: boolean
          push_enabled: boolean
          quiet_hours_end: number | null
          quiet_hours_start: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          categories?: Json
          email_enabled?: boolean
          inapp_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          categories?: Json
          email_enabled?: boolean
          inapp_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          kind: string
          link: string | null
          metadata: Json
          push_sent_at: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind: string
          link?: string | null
          metadata?: Json
          push_sent_at?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind?: string
          link?: string | null
          metadata?: Json
          push_sent_at?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      pensions: {
        Row: {
          beneficiary_name: string | null
          beneficiary_relationship: string | null
          client_user_id: string
          created_at: string
          currency: string | null
          id: string
          kind: string
          monthly_contribution_cents: number | null
          notes: string | null
          policy_number: string | null
          projected_monthly_payout_cents: number | null
          provider: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          beneficiary_name?: string | null
          beneficiary_relationship?: string | null
          client_user_id: string
          created_at?: string
          currency?: string | null
          id?: string
          kind: string
          monthly_contribution_cents?: number | null
          notes?: string | null
          policy_number?: string | null
          projected_monthly_payout_cents?: number | null
          provider: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          beneficiary_name?: string | null
          beneficiary_relationship?: string | null
          client_user_id?: string
          created_at?: string
          currency?: string | null
          id?: string
          kind?: string
          monthly_contribution_cents?: number | null
          notes?: string | null
          policy_number?: string | null
          projected_monthly_payout_cents?: number | null
          provider?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
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
      push_subscriptions: {
        Row: {
          auth: string | null
          created_at: string
          device_token: string | null
          endpoint: string | null
          id: string
          last_seen_at: string
          p256dh: string | null
          platform: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth?: string | null
          created_at?: string
          device_token?: string | null
          endpoint?: string | null
          id?: string
          last_seen_at?: string
          p256dh?: string | null
          platform: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string | null
          created_at?: string
          device_token?: string | null
          endpoint?: string | null
          id?: string
          last_seen_at?: string
          p256dh?: string | null
          platform?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referral_leads: {
        Row: {
          case_id: string | null
          client_user_id: string | null
          commission_expected_cents: number | null
          commission_received_cents: number | null
          converted_at: string | null
          created_at: string
          currency: string | null
          id: string
          invoice_reference: string | null
          notes: string | null
          paid_at: string | null
          partner_id: string
          source_page: string | null
          status: string
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          client_user_id?: string | null
          commission_expected_cents?: number | null
          commission_received_cents?: number | null
          converted_at?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          invoice_reference?: string | null
          notes?: string | null
          paid_at?: string | null
          partner_id: string
          source_page?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          client_user_id?: string | null
          commission_expected_cents?: number | null
          commission_received_cents?: number | null
          converted_at?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          invoice_reference?: string | null
          notes?: string | null
          paid_at?: string | null
          partner_id?: string
          source_page?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_leads_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "referral_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_partners: {
        Row: {
          active: boolean | null
          category: string
          commission_flat_cents: number | null
          commission_model: string
          commission_rate: number | null
          contact_email: string | null
          contact_phone: string | null
          countries: string[] | null
          created_at: string
          currency: string | null
          description: string | null
          disclose_to_client: boolean | null
          id: string
          languages: string[] | null
          name: string
          payout_terms: string | null
          slug: string
          updated_at: string
          url_template: string
          website: string | null
        }
        Insert: {
          active?: boolean | null
          category: string
          commission_flat_cents?: number | null
          commission_model: string
          commission_rate?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          countries?: string[] | null
          created_at?: string
          currency?: string | null
          description?: string | null
          disclose_to_client?: boolean | null
          id?: string
          languages?: string[] | null
          name: string
          payout_terms?: string | null
          slug: string
          updated_at?: string
          url_template: string
          website?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string
          commission_flat_cents?: number | null
          commission_model?: string
          commission_rate?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          countries?: string[] | null
          created_at?: string
          currency?: string | null
          description?: string | null
          disclose_to_client?: boolean | null
          id?: string
          languages?: string[] | null
          name?: string
          payout_terms?: string | null
          slug?: string
          updated_at?: string
          url_template?: string
          website?: string | null
        }
        Relationships: []
      }
      role_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          note: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          note?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          note?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      student_verifications: {
        Row: {
          country: string | null
          created_at: string
          discount_percent: number
          id: string
          id_document_path: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          student_id_number: string | null
          university: string
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          discount_percent?: number
          id?: string
          id_document_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          student_id_number?: string | null
          university: string
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          discount_percent?: number
          id?: string
          id_document_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          student_id_number?: string | null
          university?: string
          updated_at?: string
          user_id?: string
          valid_until?: string | null
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
          current_period_start: string | null
          environment: string
          id: string
          plan_code: string | null
          referring_agent_user_id: string | null
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
          current_period_start?: string | null
          environment?: string
          id?: string
          plan_code?: string | null
          referring_agent_user_id?: string | null
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
          current_period_start?: string | null
          environment?: string
          id?: string
          plan_code?: string | null
          referring_agent_user_id?: string | null
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
      tax_leads: {
        Row: {
          additional_deductions: number | null
          children_count: number
          church_tax: boolean
          commute_km: number | null
          created_at: string
          email: string
          employment_status: string
          estimated_refund_eur: number | null
          full_name: string
          gross_income_eur: number | null
          has_children: boolean
          home_office_days: number | null
          id: string
          notes: string | null
          partner_referral: string | null
          phone: string | null
          preferred_contact: string
          preferred_language: string
          source: string
          status: string
          tax_class: number | null
          tax_year: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          additional_deductions?: number | null
          children_count?: number
          church_tax?: boolean
          commute_km?: number | null
          created_at?: string
          email: string
          employment_status: string
          estimated_refund_eur?: number | null
          full_name: string
          gross_income_eur?: number | null
          has_children?: boolean
          home_office_days?: number | null
          id?: string
          notes?: string | null
          partner_referral?: string | null
          phone?: string | null
          preferred_contact?: string
          preferred_language?: string
          source?: string
          status?: string
          tax_class?: number | null
          tax_year: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          additional_deductions?: number | null
          children_count?: number
          church_tax?: boolean
          commute_km?: number | null
          created_at?: string
          email?: string
          employment_status?: string
          estimated_refund_eur?: number | null
          full_name?: string
          gross_income_eur?: number | null
          has_children?: boolean
          home_office_days?: number | null
          id?: string
          notes?: string | null
          partner_referral?: string | null
          phone?: string | null
          preferred_contact?: string
          preferred_language?: string
          source?: string
          status?: string
          tax_class?: number | null
          tax_year?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trusted_contacts: {
        Row: {
          address: string | null
          client_user_id: string
          created_at: string
          email: string | null
          emergency_order: number | null
          id: string
          is_primary: boolean | null
          language: string | null
          name: string
          notes: string | null
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          client_user_id: string
          created_at?: string
          email?: string | null
          emergency_order?: number | null
          id?: string
          is_primary?: boolean | null
          language?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          client_user_id?: string
          created_at?: string
          email?: string | null
          emergency_order?: number | null
          id?: string
          is_primary?: boolean | null
          language?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string
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
      directory_public: {
        Row: {
          bundesland: string | null
          business_name: string | null
          category: string | null
          city: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: string | null
          languages: string[] | null
          logo_url: string | null
          subcategory: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          bundesland?: string | null
          business_name?: string | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string | null
          languages?: string[] | null
          logo_url?: string | null
          subcategory?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          bundesland?: string | null
          business_name?: string | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string | null
          languages?: string[] | null
          logo_url?: string | null
          subcategory?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_expert_invitation: { Args: { _token: string }; Returns: string }
      can_access_case: {
        Args: { _case_id: string; _user_id: string }
        Returns: boolean
      }
      generate_agent_code: { Args: never; Returns: string }
      generate_monthly_agent_commissions: {
        Args: { _period?: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_agent: { Args: { _user_id: string }; Returns: boolean }
      is_agent: { Args: { _user_id: string }; Returns: boolean }
      is_channel_member: {
        Args: { _channel_id: string; _user_id: string }
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
        | "insurance_admin"
        | "tax_admin"
        | "benefits_admin"
        | "medical_admin"
        | "new_arrival_admin"
        | "lawyer"
        | "accountant"
        | "doctor"
        | "notary"
        | "translator"
        | "social_worker"
        | "beneficiary"
        | "agent"
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
        "insurance_admin",
        "tax_admin",
        "benefits_admin",
        "medical_admin",
        "new_arrival_admin",
        "lawyer",
        "accountant",
        "doctor",
        "notary",
        "translator",
        "social_worker",
        "beneficiary",
        "agent",
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
