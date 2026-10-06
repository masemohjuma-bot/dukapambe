import type { SellerTables, SellerFunctions } from "@/lib/seller/database";
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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: SellerTables & {
      admin_profiles: {
        Row: {
          created_at: string
          department: string
          emergency_access: boolean
          is_super_admin: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string
          emergency_access?: boolean
          is_super_admin?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          emergency_access?: boolean
          is_super_admin?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_profiles: {
        Row: {
          county: string | null
          created_at: string
          invitation_limit: number
          invited_by_code: string | null
          phone_number: string | null
          referral_code: string
          status: Database["public"]["Enums"]["affiliate_account_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          county?: string | null
          created_at?: string
          invitation_limit?: number
          invited_by_code?: string | null
          phone_number?: string | null
          referral_code: string
          status?: Database["public"]["Enums"]["affiliate_account_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          county?: string | null
          created_at?: string
          invitation_limit?: number
          invited_by_code?: string | null
          phone_number?: string | null
          referral_code?: string
          status?: Database["public"]["Enums"]["affiliate_account_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_profiles: {
        Row: {
          county: string | null
          created_at: string
          marketing_consent: boolean
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          county?: string | null
          created_at?: string
          marketing_consent?: boolean
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          county?: string | null
          created_at?: string
          marketing_consent?: boolean
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          last_login: string | null
          membership: Database["public"]["Enums"]["membership_plan"] | null
          profile_completion: number
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id: string
          last_login?: string | null
          membership?: Database["public"]["Enums"]["membership_plan"] | null
          profile_completion?: number
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          last_login?: string | null
          membership?: Database["public"]["Enums"]["membership_plan"] | null
          profile_completion?: number
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      seller_profiles: {
        Row: {
          application_status: Database["public"]["Enums"]["seller_application_status"]
          approved_at: string | null
          approved_by: string | null
          business_address: string
          business_cover_path: string | null
          business_description: string
          business_logo_path: string | null
          business_name: string
          business_registration_number: string
          business_type: string
          county: string
          created_at: string
          delivery_areas: string[]
          district: string
          membership_plan: Database["public"]["Enums"]["membership_plan"] | null
          national_id: string
          operating_hours: Json
          owner_name: string
          payment_methods: string[]
          phone_number: string
          profile_completion: number
          submitted_at: string | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          tin_number: string | null
          updated_at: string
          user_id: string
          ward: string
          whatsapp_number: string
        }
        Insert: {
          application_status?: Database["public"]["Enums"]["seller_application_status"]
          approved_at?: string | null
          approved_by?: string | null
          business_address?: string
          business_cover_path?: string | null
          business_description?: string
          business_logo_path?: string | null
          business_name?: string
          business_registration_number?: string
          business_type?: string
          county?: string
          created_at?: string
          delivery_areas?: string[]
          district?: string
          membership_plan?:
            | Database["public"]["Enums"]["membership_plan"]
            | null
          national_id?: string
          operating_hours?: Json
          owner_name?: string
          payment_methods?: string[]
          phone_number?: string
          profile_completion?: number
          submitted_at?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          tin_number?: string | null
          updated_at?: string
          user_id: string
          ward?: string
          whatsapp_number?: string
        }
        Update: {
          application_status?: Database["public"]["Enums"]["seller_application_status"]
          approved_at?: string | null
          approved_by?: string | null
          business_address?: string
          business_cover_path?: string | null
          business_description?: string
          business_logo_path?: string | null
          business_name?: string
          business_registration_number?: string
          business_type?: string
          county?: string
          created_at?: string
          delivery_areas?: string[]
          district?: string
          membership_plan?:
            | Database["public"]["Enums"]["membership_plan"]
            | null
          national_id?: string
          operating_hours?: Json
          owner_name?: string
          payment_methods?: string[]
          phone_number?: string
          profile_completion?: number
          submitted_at?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          tin_number?: string | null
          updated_at?: string
          user_id?: string
          ward?: string
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: SellerFunctions & {
      begin_seller_onboarding: {
        Args: never
        Returns: {
          application_status: Database["public"]["Enums"]["seller_application_status"]
          approved_at: string | null
          approved_by: string | null
          business_address: string
          business_cover_path: string | null
          business_description: string
          business_logo_path: string | null
          business_name: string
          business_registration_number: string
          business_type: string
          county: string
          created_at: string
          delivery_areas: string[]
          district: string
          membership_plan: Database["public"]["Enums"]["membership_plan"] | null
          national_id: string
          operating_hours: Json
          owner_name: string
          payment_methods: string[]
          phone_number: string
          profile_completion: number
          submitted_at: string | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          tin_number: string | null
          updated_at: string
          user_id: string
          ward: string
          whatsapp_number: string
        }
        SetofOptions: {
          from: "*"
          to: "seller_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_app_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      submit_seller_application: {
        Args: never
        Returns: {
          application_status: Database["public"]["Enums"]["seller_application_status"]
          approved_at: string | null
          approved_by: string | null
          business_address: string
          business_cover_path: string | null
          business_description: string
          business_logo_path: string | null
          business_name: string
          business_registration_number: string
          business_type: string
          county: string
          created_at: string
          delivery_areas: string[]
          district: string
          membership_plan: Database["public"]["Enums"]["membership_plan"] | null
          national_id: string
          operating_hours: Json
          owner_name: string
          payment_methods: string[]
          phone_number: string
          profile_completion: number
          submitted_at: string | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          tin_number: string | null
          updated_at: string
          user_id: string
          ward: string
          whatsapp_number: string
        }
        SetofOptions: {
          from: "*"
          to: "seller_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      account_status:
        | "PENDING_VERIFICATION"
        | "ACTIVE"
        | "PENDING_APPROVAL"
        | "DISABLED"
        | "SUSPENDED"
        | "BLOCKED"
      affiliate_account_status:
        | "PENDING"
        | "ACTIVE"
        | "PAUSED"
        | "BLOCKED"
        | "SUSPENDED"
        | "ARCHIVED"
      app_role: "BUYER" | "SELLER" | "AFFILIATE" | "ADMIN" | "SUPER_ADMIN"
      membership_plan: "BASIC" | "STANDARD" | "PREMIUM" | "ENTERPRISE"
      seller_application_status:
        | "DRAFT"
        | "SUBMITTED"
        | "PENDING_REVIEW"
        | "UNDER_REVIEW"
        | "MORE_INFORMATION_REQUIRED"
        | "APPROVED"
        | "REJECTED"
        | "SUSPENDED"
        | "BLOCKED"
      verification_status:
        | "UNVERIFIED"
        | "EMAIL_VERIFIED"
        | "PENDING_REVIEW"
        | "VERIFIED"
        | "REJECTED"
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
      account_status: [
        "PENDING_VERIFICATION",
        "ACTIVE",
        "PENDING_APPROVAL",
        "DISABLED",
        "SUSPENDED",
        "BLOCKED",
      ],
      affiliate_account_status: [
        "PENDING",
        "ACTIVE",
        "PAUSED",
        "BLOCKED",
        "SUSPENDED",
        "ARCHIVED",
      ],
      app_role: ["BUYER", "SELLER", "AFFILIATE", "ADMIN", "SUPER_ADMIN"],
      membership_plan: ["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"],
      seller_application_status: [
        "DRAFT",
        "SUBMITTED",
        "PENDING_REVIEW",
        "UNDER_REVIEW",
        "MORE_INFORMATION_REQUIRED",
        "APPROVED",
        "REJECTED",
        "SUSPENDED",
        "BLOCKED",
      ],
      verification_status: [
        "UNVERIFIED",
        "EMAIL_VERIFIED",
        "PENDING_REVIEW",
        "VERIFIED",
        "REJECTED",
      ],
    },
  },
} as const
