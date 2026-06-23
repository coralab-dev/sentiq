import type {
  AlertStatus,
  FeedbackFilters,
  FeedbackSource,
  PublicSurveyConfig,
  PublicSurveyPayload,
} from "./domain";

export type GetPublicSurveyConfigRequest = {
  token: string;
};

export type GetPublicSurveyConfigResponse = PublicSurveyConfig;

export type SubmitFeedbackRequest = PublicSurveyPayload;

export type SubmitFeedbackResponse = {
  ok: true;
  response_id: string;
  has_alert: boolean;
};

export type CreateRestaurantRequest = {
  restaurant_name: string;
  legal_name?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  plan_code: "demo" | "basico" | "pro" | "custom";
  account_status: "demo" | "pilot" | "active";
  branch_name: string;
  branch_slug?: string | null;
  branch_address?: string | null;
  branch_internal_phone?: string | null;
  branch_notes?: string | null;
  create_initial_qr?: boolean;
};

export type CreateRestaurantResponse = {
  ok: true;
  restaurant_id: string;
  restaurant_slug: string;
  account_id: string;
  settings_id: string;
  branch_id: string;
  branch_slug: string;
  qr_link_id?: string;
  qr_url?: string;
  token_last4?: string;
};

export type CreateRestaurantAdminRequest = {
  restaurant_id: string;
  full_name: string;
  email: string;
};

export type CreateRestaurantAdminResponse = {
  ok: true;
  user_id: string;
  email: string;
  restaurant_id: string;
  status: "active" | "invited";
  created: boolean;
};

export type PlatformActivitySummaryItem = {
  restaurant_id: string;
  response_count: number;
  alert_count: number;
  pending_alert_count: number;
  attended_alert_count: number;
  avg_general_experience: number | null;
  last_response_at: string | null;
  last_alert_at: string | null;
};

export type GetPlatformActivitySummaryRequest = {
  restaurant_id?: string;
};

export type GetPlatformActivitySummaryResponse = {
  ok: true;
  items: PlatformActivitySummaryItem[];
};

export type UpdateRestaurantAccountRequest = {
  restaurant_id: string;
  plan_code: "demo" | "basico" | "pro" | "custom";
  account_status: "demo" | "pilot" | "active" | "paused" | "cancelled";
};

export type UpdateRestaurantAccountResponse = {
  ok: true;
  restaurant_id: string;
  plan_code: UpdateRestaurantAccountRequest["plan_code"];
  account_status: UpdateRestaurantAccountRequest["account_status"];
  started_at: string | null;
  cancelled_at: string | null;
  updated_at: string;
};

export type CreateManagerUserRequest = {
  full_name: string;
  email: string;
  branch_ids: string[];
  restaurant_id?: string;
};

export type CreateManagerUserResponse = {
  ok: true;
  user_id: string;
  email: string;
  status: "active" | "invited";
  branch_ids: string[];
  created: boolean;
};

export type RegenerateQrTokenRequest =
  | { branch_id: string; survey_link_id?: never }
  | { survey_link_id: string; branch_id?: never };

export type RegenerateDeviceTokenRequest =
  | { device_id: string; survey_link_id?: never }
  | { survey_link_id: string; device_id?: never };

export type RegenerateTokenResponse = {
  ok: true;
  url: string;
  token_last4: string;
};

export type UpdateAlertStatusRequest = {
  alert_id: string;
  status: Extract<AlertStatus, "attended">;
  internal_note?: string | null;
};

export type UpdateAlertStatusResponse = {
  ok: true;
  alert_id: string;
  status: AlertStatus;
};

export type ExportFeedbackCsvRequest = FeedbackFilters & {
  source?: FeedbackSource;
};

export type ExportFeedbackCsvResponse = {
  ok: true;
  filename: string;
  content: string;
};
