import type { SupabaseClient } from "@supabase/supabase-js";

type RestaurantRow = { id: string; name: string; slug: string; contact_email: string | null; status: string; created_at: string; updated_at: string | null };
type AccountRow = { restaurant_id: string; plan_code: string; account_status: string; started_at: string | null; cancelled_at: string | null; updated_at: string | null };
type BranchRow = { id: string; restaurant_id: string; name: string; slug: string; status: string; created_at: string };
type UserRow = { id: string; restaurant_id: string | null; full_name: string; email: string; role: string; status: string; created_at: string; updated_at: string | null };
type DeviceRow = { restaurant_id: string; status: string; last_used_at: string | null };
type SurveyLinkRow = { restaurant_id: string; status: string; updated_at: string | null; regenerated_at: string | null };
type PlatformActivitySummaryItem = { restaurant_id: string; response_count: number; alert_count: number; pending_alert_count: number; attended_alert_count: number; avg_general_experience: number | null; last_response_at: string | null; last_alert_at: string | null };
type UpdateRestaurantAccountRequest = { restaurant_id: string; plan_code: "demo" | "basico" | "pro" | "custom"; account_status: "demo" | "pilot" | "active" | "paused" | "cancelled" };

export type RestaurantDetailData = {
  restaurant: { id: string; name: string; slug: string; contactEmail: string | null; status: string; createdAt: string; updatedAt: string | null };
  account: { planCode: string; accountStatus: string; startedAt: string | null; cancelledAt: string | null } | null;
  branches: Array<{ id: string; name: string; slug: string; status: string; createdAt: string }>;
  administrators: Array<{ id: string; fullName: string; email: string; status: string; createdAt: string }>;
  aggregates: { branchCount: number; activeBranchCount: number; userCount: number; activeUserCount: number; invitedUserCount: number; deviceCount: number; activeDeviceCount: number; activeSurveyLinkCount: number };
  activity: { available: boolean; responseCount: number | null; alertCount: number | null; pendingAlertCount: number | null; attendedAlertCount: number | null; avgGeneralExperience: number | null; lastResponseAt: string | null; lastAlertAt: string | null };
  lastActivityAt: string;
};

type DetailInput = { restaurant: RestaurantRow | null; account: AccountRow | null; branches: BranchRow[]; users: UserRow[]; devices: DeviceRow[]; surveyLinks: SurveyLinkRow[] };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidRestaurantId(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function combineRestaurantDetailData(input: DetailInput): RestaurantDetailData | null {
  const { restaurant, account, branches, users, devices, surveyLinks } = input;
  if (!restaurant) return null;

  const administrators = users.filter((user) => user.role === "restaurant_admin").map((user) => ({ id: user.id, fullName: user.full_name, email: user.email, status: user.status, createdAt: user.created_at }));
  const activityCandidates = [restaurant.updated_at, account?.updated_at, ...users.map((user) => user.updated_at), ...devices.map((device) => device.last_used_at), ...surveyLinks.flatMap((link) => [link.updated_at, link.regenerated_at])].filter((value): value is string => Boolean(value));

  return {
    restaurant: { id: restaurant.id, name: restaurant.name, slug: restaurant.slug, contactEmail: restaurant.contact_email, status: restaurant.status, createdAt: restaurant.created_at, updatedAt: restaurant.updated_at },
    account: account ? { planCode: account.plan_code, accountStatus: account.account_status, startedAt: account.started_at, cancelledAt: account.cancelled_at } : null,
    branches: branches.map((branch) => ({ id: branch.id, name: branch.name, slug: branch.slug, status: branch.status, createdAt: branch.created_at })),
    administrators,
    aggregates: { branchCount: branches.length, activeBranchCount: branches.filter((branch) => branch.status === "active").length, userCount: users.length, activeUserCount: users.filter((user) => user.status === "active").length, invitedUserCount: users.filter((user) => user.status === "invited").length, deviceCount: devices.length, activeDeviceCount: devices.filter((device) => device.status === "active").length, activeSurveyLinkCount: surveyLinks.filter((link) => link.status === "active").length },
    activity: emptyActivity(),
    lastActivityAt: activityCandidates.sort().at(-1) ?? restaurant.created_at,
  };
}

export function mergeRestaurantDetailActivitySummary(detail: RestaurantDetailData | null, activity: PlatformActivitySummaryItem | null | undefined): RestaurantDetailData | null {
  if (!detail) return null;
  if (!activity || activity.restaurant_id !== detail.restaurant.id) return { ...detail, activity: emptyActivity() };
  const lastActivityAt = [detail.lastActivityAt, activity.last_response_at, activity.last_alert_at].filter((value): value is string => Boolean(value)).sort().at(-1) ?? detail.lastActivityAt;
  return {
    ...detail,
    activity: {
      available: true,
      responseCount: activity.response_count,
      alertCount: activity.alert_count,
      pendingAlertCount: activity.pending_alert_count,
      attendedAlertCount: activity.attended_alert_count,
      avgGeneralExperience: activity.avg_general_experience,
      lastResponseAt: activity.last_response_at,
      lastAlertAt: activity.last_alert_at,
    },
    lastActivityAt,
  };
}

export function buildUpdateRestaurantAccountPayload(input: { restaurantId: string; planCode: string; accountStatus: string }): UpdateRestaurantAccountRequest {
  if (!isValidRestaurantId(input.restaurantId)) throw new Error("invalid_restaurant_id");
  if (!["demo", "basico", "pro", "custom"].includes(input.planCode)) throw new Error("invalid_plan_code");
  if (!["demo", "pilot", "active", "paused", "cancelled"].includes(input.accountStatus)) throw new Error("invalid_account_status");
  return { restaurant_id: input.restaurantId, plan_code: input.planCode as UpdateRestaurantAccountRequest["plan_code"], account_status: input.accountStatus as UpdateRestaurantAccountRequest["account_status"] };
}

async function loadDetailActivitySummary(restaurantId: string): Promise<PlatformActivitySummaryItem | null> {
  const { invokeFunction } = await import("../../../../../lib/supabase/functions");
  const response = await invokeFunction<Record<string, unknown>, { ok: true; items: PlatformActivitySummaryItem[] }>("get_platform_activity_summary", { restaurant_id: restaurantId });
  return response.items[0] ?? null;
}

export async function loadRestaurantDetailData(supabase: SupabaseClient, restaurantId: string): Promise<RestaurantDetailData | null> {
  if (!isValidRestaurantId(restaurantId)) throw new Error("invalid_restaurant_id");

  const [restaurantResult, accountResult, branchesResult, usersResult, devicesResult, linksResult] = await Promise.all([
    supabase.from("restaurants").select("id,name,slug,contact_email,status,created_at,updated_at").eq("id", restaurantId).maybeSingle(),
    supabase.from("restaurant_accounts").select("restaurant_id,plan_code,account_status,started_at,cancelled_at,updated_at").eq("restaurant_id", restaurantId).maybeSingle(),
    supabase.from("branches").select("id,restaurant_id,name,slug,status,created_at").eq("restaurant_id", restaurantId).order("created_at"),
    supabase.from("user_profiles").select("id,restaurant_id,full_name,email,role,status,created_at,updated_at").eq("restaurant_id", restaurantId).order("created_at"),
    supabase.from("devices").select("restaurant_id,status,last_used_at").eq("restaurant_id", restaurantId),
    supabase.from("survey_links").select("restaurant_id,status,updated_at,regenerated_at").eq("restaurant_id", restaurantId),
  ]);
  const error = restaurantResult.error ?? accountResult.error ?? branchesResult.error ?? usersResult.error ?? devicesResult.error ?? linksResult.error;
  if (error) throw error;

  const detail = combineRestaurantDetailData({ restaurant: restaurantResult.data as RestaurantRow | null, account: accountResult.data as AccountRow | null, branches: (branchesResult.data ?? []) as BranchRow[], users: (usersResult.data ?? []) as UserRow[], devices: (devicesResult.data ?? []) as DeviceRow[], surveyLinks: (linksResult.data ?? []) as SurveyLinkRow[] });
  if (!detail) return null;
  try {
    return mergeRestaurantDetailActivitySummary(detail, await loadDetailActivitySummary(restaurantId));
  } catch {
    return mergeRestaurantDetailActivitySummary(detail, null);
  }
}

function emptyActivity(): RestaurantDetailData["activity"] {
  return { available: false, responseCount: null, alertCount: null, pendingAlertCount: null, attendedAlertCount: null, avgGeneralExperience: null, lastResponseAt: null, lastAlertAt: null };
}
