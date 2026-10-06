import type { Application, DocumentRecord } from "./model";
import type { Json } from "@/integrations/supabase/types";
type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };
export type SellerTables = {
  seller_onboarding: Table<Application & { updated_at: string }>;
  seller_documents: Table<DocumentRecord & { user_id: string }>;
  seller_stores: Table<{
    id: string;
    user_id: string;
    name: string;
    slug: string;
    description: string;
    business_hours: string;
    delivery_options: string;
    pickup_available: boolean;
    shipping_regions: string[];
    logo_path: string | null;
    banner_path: string | null;
    created_at: string;
  }>;
  seller_preferences: Table<{ user_id: string; preferences: Json }>;
  seller_notifications: Table<{
    id: string;
    user_id: string;
    event: string;
    message: string;
    created_at: string;
    read_at: string | null;
  }>;
  seller_application_comments: Table<{
    id: string;
    user_id: string;
    comment: string;
    created_at: string;
  }>;
  seller_verification: Table<{ user_id: string; status: string; badges: string[] }>;
};
export type SellerFunctions = {
  seller_start: { Args: Record<string, never>; Returns: Application };
  seller_save_step: {
    Args: { p_step: number; p_values: Json; p_revision: number; p_complete: boolean };
    Returns: Application;
  };
  seller_set_document: {
    Args: {
      p_kind: string;
      p_bucket: string | null;
      p_path: string | null;
      p_name: string | null;
      p_mime: string | null;
      p_size: number | null;
    };
    Returns: undefined;
  };
  seller_submit: {
    Args: { p_revision: number; p_confirm: boolean; p_terms: boolean };
    Returns: Application;
  };
  seller_initialize_dashboard: { Args: Record<string, never>; Returns: undefined };
  seller_activate: { Args: Record<string, never>; Returns: undefined };
  seller_can_edit: { Args: { p_user: string }; Returns: boolean };
  seller_is_approved: { Args: { p_user: string }; Returns: boolean };
};
