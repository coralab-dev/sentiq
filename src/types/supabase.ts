export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string;
type Uuid = string;

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      restaurants: TableDefinition<
        {
          id: Uuid;
          name: string;
          legal_name: string | null;
          slug: string;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          status: string;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        },
        {
          id?: Uuid;
          name: string;
          legal_name?: string | null;
          slug: string;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          status?: string;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        },
        {
          id?: Uuid;
          name?: string;
          legal_name?: string | null;
          slug?: string;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          status?: string;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        }
      >;
      restaurant_accounts: TableDefinition<
        {
          id: Uuid;
          restaurant_id: Uuid;
          plan_code: string;
          account_status: string;
          implementation_fee_mxn: number | null;
          monthly_fee_mxn: number | null;
          notes: string | null;
          started_at: Timestamp | null;
          cancelled_at: Timestamp | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id: Uuid;
          plan_code: string;
          account_status: string;
          implementation_fee_mxn?: number | null;
          monthly_fee_mxn?: number | null;
          notes?: string | null;
          started_at?: Timestamp | null;
          cancelled_at?: Timestamp | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id?: Uuid;
          plan_code?: string;
          account_status?: string;
          implementation_fee_mxn?: number | null;
          monthly_fee_mxn?: number | null;
          notes?: string | null;
          started_at?: Timestamp | null;
          cancelled_at?: Timestamp | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        }
      >;
      restaurant_settings: TableDefinition<
        {
          id: Uuid;
          restaurant_id: Uuid;
          logo_url: string | null;
          logo_storage_path: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          survey_welcome_text: string | null;
          survey_thank_you_text: string | null;
          question_general_text: string | null;
          question_attention_text: string | null;
          question_food_text: string | null;
          question_speed_text: string | null;
          contact_consent_text: string | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id: Uuid;
          logo_url?: string | null;
          logo_storage_path?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          survey_welcome_text?: string | null;
          survey_thank_you_text?: string | null;
          question_general_text?: string | null;
          question_attention_text?: string | null;
          question_food_text?: string | null;
          question_speed_text?: string | null;
          contact_consent_text?: string | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id?: Uuid;
          logo_url?: string | null;
          logo_storage_path?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          survey_welcome_text?: string | null;
          survey_thank_you_text?: string | null;
          question_general_text?: string | null;
          question_attention_text?: string | null;
          question_food_text?: string | null;
          question_speed_text?: string | null;
          contact_consent_text?: string | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        }
      >;
      branches: TableDefinition<
        {
          id: Uuid;
          restaurant_id: Uuid;
          name: string;
          slug: string;
          address: string | null;
          internal_phone: string | null;
          notes: string | null;
          status: string;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id: Uuid;
          name: string;
          slug: string;
          address?: string | null;
          internal_phone?: string | null;
          notes?: string | null;
          status?: string;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id?: Uuid;
          name?: string;
          slug?: string;
          address?: string | null;
          internal_phone?: string | null;
          notes?: string | null;
          status?: string;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        }
      >;
      zones: TableDefinition<
        {
          id: Uuid;
          restaurant_id: Uuid;
          branch_id: Uuid;
          name: string;
          description: string | null;
          status: string;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id: Uuid;
          branch_id: Uuid;
          name: string;
          description?: string | null;
          status?: string;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id?: Uuid;
          branch_id?: Uuid;
          name?: string;
          description?: string | null;
          status?: string;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        }
      >;
      user_profiles: TableDefinition<
        {
          id: Uuid;
          restaurant_id: Uuid | null;
          full_name: string;
          email: string;
          role: string;
          status: string;
          created_by: Uuid | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        },
        {
          id: Uuid;
          restaurant_id?: Uuid | null;
          full_name: string;
          email: string;
          role: string;
          status?: string;
          created_by?: Uuid | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id?: Uuid | null;
          full_name?: string;
          email?: string;
          role?: string;
          status?: string;
          created_by?: Uuid | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        }
      >;
      manager_branch_assignments: TableDefinition<
        {
          id: Uuid;
          restaurant_id: Uuid;
          manager_user_id: Uuid;
          branch_id: Uuid;
          status: string;
          created_at: Timestamp | null;
          created_by: Uuid | null;
        },
        {
          id?: Uuid;
          restaurant_id: Uuid;
          manager_user_id: Uuid;
          branch_id: Uuid;
          status?: string;
          created_at?: Timestamp | null;
          created_by?: Uuid | null;
        },
        {
          id?: Uuid;
          restaurant_id?: Uuid;
          manager_user_id?: Uuid;
          branch_id?: Uuid;
          status?: string;
          created_at?: Timestamp | null;
          created_by?: Uuid | null;
        }
      >;
      waiters: TableDefinition<
        {
          id: Uuid;
          restaurant_id: Uuid;
          branch_id: Uuid;
          name: string;
          internal_code: string | null;
          status: string;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id: Uuid;
          branch_id: Uuid;
          name: string;
          internal_code?: string | null;
          status?: string;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id?: Uuid;
          branch_id?: Uuid;
          name?: string;
          internal_code?: string | null;
          status?: string;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        }
      >;
      devices: TableDefinition<
        {
          id: Uuid;
          restaurant_id: Uuid;
          branch_id: Uuid;
          zone_id: Uuid | null;
          name: string;
          description: string | null;
          status: string;
          last_used_at: Timestamp | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id: Uuid;
          branch_id: Uuid;
          zone_id?: Uuid | null;
          name: string;
          description?: string | null;
          status?: string;
          last_used_at?: Timestamp | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id?: Uuid;
          branch_id?: Uuid;
          zone_id?: Uuid | null;
          name?: string;
          description?: string | null;
          status?: string;
          last_used_at?: Timestamp | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        }
      >;
      survey_links: TableDefinition<
        {
          id: Uuid;
          restaurant_id: Uuid;
          branch_id: Uuid;
          zone_id: Uuid | null;
          device_id: Uuid | null;
          type: string;
          name: string | null;
          token_hash: string;
          token_last4: string | null;
          status: string;
          created_by: Uuid | null;
          regenerated_at: Timestamp | null;
          revoked_at: Timestamp | null;
          last_used_at: Timestamp | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id: Uuid;
          branch_id: Uuid;
          zone_id?: Uuid | null;
          device_id?: Uuid | null;
          type: string;
          name?: string | null;
          token_hash: string;
          token_last4?: string | null;
          status?: string;
          created_by?: Uuid | null;
          regenerated_at?: Timestamp | null;
          revoked_at?: Timestamp | null;
          last_used_at?: Timestamp | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id?: Uuid;
          branch_id?: Uuid;
          zone_id?: Uuid | null;
          device_id?: Uuid | null;
          type?: string;
          name?: string | null;
          token_hash?: string;
          token_last4?: string | null;
          status?: string;
          created_by?: Uuid | null;
          regenerated_at?: Timestamp | null;
          revoked_at?: Timestamp | null;
          last_used_at?: Timestamp | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        }
      >;
      feedback_responses: TableDefinition<
        {
          id: Uuid;
          restaurant_id: Uuid;
          branch_id: Uuid;
          zone_id: Uuid | null;
          device_id: Uuid | null;
          survey_link_id: Uuid;
          waiter_id: Uuid | null;
          source: string;
          general_experience: number;
          service_attention: number;
          food_quality: number;
          service_speed: number;
          comment: string | null;
          customer_phone: string | null;
          consent_to_contact: boolean;
          consent_text_snapshot: string | null;
          has_alert: boolean;
          metadata: Json | null;
          created_at: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id: Uuid;
          branch_id: Uuid;
          zone_id?: Uuid | null;
          device_id?: Uuid | null;
          survey_link_id: Uuid;
          waiter_id?: Uuid | null;
          source: string;
          general_experience: number;
          service_attention: number;
          food_quality: number;
          service_speed: number;
          comment?: string | null;
          customer_phone?: string | null;
          consent_to_contact?: boolean;
          consent_text_snapshot?: string | null;
          has_alert?: boolean;
          metadata?: Json | null;
          created_at?: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id?: Uuid;
          branch_id?: Uuid;
          zone_id?: Uuid | null;
          device_id?: Uuid | null;
          survey_link_id?: Uuid;
          waiter_id?: Uuid | null;
          source?: string;
          general_experience?: number;
          service_attention?: number;
          food_quality?: number;
          service_speed?: number;
          comment?: string | null;
          customer_phone?: string | null;
          consent_to_contact?: boolean;
          consent_text_snapshot?: string | null;
          has_alert?: boolean;
          metadata?: Json | null;
          created_at?: Timestamp | null;
        }
      >;
      feedback_alerts: TableDefinition<
        {
          id: Uuid;
          restaurant_id: Uuid;
          branch_id: Uuid;
          zone_id: Uuid | null;
          device_id: Uuid | null;
          response_id: Uuid;
          source: string;
          general_experience: number;
          status: string;
          attended_by: Uuid | null;
          attended_at: Timestamp | null;
          internal_note: string | null;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id: Uuid;
          branch_id: Uuid;
          zone_id?: Uuid | null;
          device_id?: Uuid | null;
          response_id: Uuid;
          source: string;
          general_experience: number;
          status?: string;
          attended_by?: Uuid | null;
          attended_at?: Timestamp | null;
          internal_note?: string | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        },
        {
          id?: Uuid;
          restaurant_id?: Uuid;
          branch_id?: Uuid;
          zone_id?: Uuid | null;
          device_id?: Uuid | null;
          response_id?: Uuid;
          source?: string;
          general_experience?: number;
          status?: string;
          attended_by?: Uuid | null;
          attended_at?: Timestamp | null;
          internal_note?: string | null;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        }
      >;
      rate_limit_counters: TableDefinition<
        {
          id: Uuid;
          scope_key: string;
          survey_link_id: Uuid;
          source: string;
          window_start: Timestamp;
          request_count: number;
          expires_at: Timestamp;
          created_at: Timestamp | null;
          updated_at: Timestamp | null;
        },
        {
          id?: Uuid;
          scope_key: string;
          survey_link_id: Uuid;
          source: string;
          window_start: Timestamp;
          request_count?: number;
          expires_at: Timestamp;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        },
        {
          id?: Uuid;
          scope_key?: string;
          survey_link_id?: Uuid;
          source?: string;
          window_start?: Timestamp;
          request_count?: number;
          expires_at?: Timestamp;
          created_at?: Timestamp | null;
          updated_at?: Timestamp | null;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      current_restaurant_id: {
        Args: Record<string, never>;
        Returns: Uuid | null;
      };
      is_manager_of_branch: {
        Args: { target_branch_id: Uuid };
        Returns: boolean;
      };
      is_platform_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_restaurant_admin: {
        Args: { target_restaurant_id: Uuid };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Row"];

export type TablesInsert<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Insert"];

export type TablesUpdate<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Update"];
