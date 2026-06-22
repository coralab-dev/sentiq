import type { Tables } from "./supabase";

export type UserRole = "platform_admin" | "restaurant_admin" | "manager";

export type ProfileStatus = "active" | "invited" | "inactive";
export type RestaurantStatus = "active" | "inactive" | "suspended";
export type BranchStatus = "active" | "inactive";
export type ZoneStatus = "active" | "inactive";
export type WaiterStatus = "active" | "inactive";
export type DeviceStatus = "active" | "inactive" | "lost" | "revoked";
export type SurveyLinkType = "qr" | "device";
export type SurveyLinkStatus = "active" | "inactive" | "revoked";
export type FeedbackSource = "qr" | "device";
export type AlertStatus = "pending" | "attended";
export type PlanCode = "demo" | "basico" | "pro" | "custom";
export type AccountStatus = "demo" | "pilot" | "active" | "paused" | "cancelled";

export type RatingValue = 1 | 2 | 3 | 4 | 5;
export type AlertRatingValue = 1 | 2 | 3;

export type Restaurant = Tables<"restaurants">;
export type RestaurantAccount = Tables<"restaurant_accounts">;
export type RestaurantSettings = Tables<"restaurant_settings">;
export type Branch = Tables<"branches">;
export type Zone = Tables<"zones">;
export type UserProfile = Tables<"user_profiles">;
export type ManagerBranchAssignment = Tables<"manager_branch_assignments">;
export type Waiter = Tables<"waiters">;
export type Device = Tables<"devices">;
export type SurveyLink = Tables<"survey_links">;
export type FeedbackResponse = Tables<"feedback_responses">;
export type FeedbackAlert = Tables<"feedback_alerts">;
export type RateLimitCounter = Tables<"rate_limit_counters">;

export type PublicSurveyPayload = {
  token: string;
  source: FeedbackSource;
  general_experience: RatingValue;
  service_attention: RatingValue;
  food_quality: RatingValue;
  service_speed: RatingValue;
  comment?: string | null;
  customer_phone?: string | null;
  consent_to_contact?: boolean;
};

export type PublicSurveyConfig = {
  restaurant_name: string;
  branch_name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  survey_welcome_text: string | null;
  survey_thank_you_text: string | null;
  question_general_text: string;
  question_attention_text: string;
  question_food_text: string;
  question_speed_text: string;
  contact_consent_text: string;
  source: FeedbackSource;
  device_name: string | null;
  zone_name: string | null;
};

export type FeedbackFilters = {
  date_from?: string;
  date_to?: string;
  branch_id?: string;
  source?: FeedbackSource;
  has_alert?: boolean;
};

export type AlertFilters = {
  status?: AlertStatus;
  branch_id?: string;
  date_from?: string;
  date_to?: string;
};
