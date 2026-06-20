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
};

export type CreateRestaurantAdminRequest = {
  restaurant_id: string;
  full_name: string;
  email: string;
};

export type CreateManagerUserRequest = {
  restaurant_id: string;
  full_name: string;
  email: string;
  branch_ids: string[];
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
