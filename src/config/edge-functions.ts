export const EDGE_FUNCTIONS = {
  GET_PUBLIC_SURVEY_CONFIG: "get_public_survey_config",
  SUBMIT_FEEDBACK: "submit_feedback",
  CREATE_RESTAURANT: "create_restaurant",
  CREATE_RESTAURANT_ADMIN: "create_restaurant_admin",
  GET_PLATFORM_ACTIVITY_SUMMARY: "get_platform_activity_summary",
  UPDATE_RESTAURANT_ACCOUNT: "update_restaurant_account",
  CREATE_MANAGER_USER: "create_manager_user",
  REGENERATE_QR_TOKEN: "regenerate_qr_token",
  REGENERATE_DEVICE_TOKEN: "regenerate_device_token",
  UPDATE_ALERT_STATUS: "update_alert_status",
  EXPORT_FEEDBACK_CSV: "export_feedback_csv",
} as const;

export type EdgeFunctionName =
  (typeof EDGE_FUNCTIONS)[keyof typeof EDGE_FUNCTIONS];
