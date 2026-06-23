import type { SupabaseClient } from "@supabase/supabase-js";

type RestaurantRow = { id: string; name: string; slug: string; contact_email: string | null; status: string; created_at: string; updated_at: string | null };
type AccountRow = { restaurant_id: string; plan_code: string; account_status: string; updated_at: string | null };
type BranchRow = { restaurant_id: string; status: string };
type UserRow = { restaurant_id: string | null; role: string; status: string; updated_at?: string | null };
type PlatformActivitySummaryItem = { restaurant_id: string; response_count: number; alert_count: number; pending_alert_count: number; attended_alert_count: number; avg_general_experience: number | null; last_response_at: string | null; last_alert_at: string | null };
export type RestaurantListItem = { id: string; name: string; slug: string; contactEmail: string | null; restaurantStatus: string; createdAt: string; planCode: string | null; accountStatus: string | null; branchCount: number; activeBranchCount: number; userCount: number; activeUserCount: number; lastActivityAt: string | null; activityAvailable?: boolean; responseCount?: number | null; alertCount?: number | null; pendingAlertCount?: number | null; attendedAlertCount?: number | null; avgGeneralExperience?: number | null; lastResponseAt?: string | null; lastAlertAt?: string | null };

export function combineRestaurantsListData({ restaurants, accounts, branches, users }: { restaurants: RestaurantRow[]; accounts: AccountRow[]; branches: BranchRow[]; users: UserRow[] }): RestaurantListItem[] {
  return restaurants.map((restaurant) => {
    const account = accounts.find((item) => item.restaurant_id === restaurant.id) ?? null;
    const restaurantBranches = branches.filter((item) => item.restaurant_id === restaurant.id);
    const restaurantUsers = users.filter((item) => item.restaurant_id === restaurant.id);
    const activity = [restaurant.updated_at, account?.updated_at, ...restaurantUsers.map((item) => item.updated_at)].filter((value): value is string => Boolean(value)).sort().at(-1) ?? restaurant.created_at;
    return { id: restaurant.id, name: restaurant.name, slug: restaurant.slug, contactEmail: restaurant.contact_email, restaurantStatus: restaurant.status, createdAt: restaurant.created_at, planCode: account?.plan_code ?? null, accountStatus: account?.account_status ?? null, branchCount: restaurantBranches.length, activeBranchCount: restaurantBranches.filter((item) => item.status === "active").length, userCount: restaurantUsers.length, activeUserCount: restaurantUsers.filter((item) => item.status === "active").length, lastActivityAt: activity };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getRestaurantsSummary(items: RestaurantListItem[]) { return { total: items.length, active: items.filter((item) => item.restaurantStatus === "active").length, demoPilot: items.filter((item) => item.accountStatus === "demo" || item.accountStatus === "pilot").length, inactiveSuspended: items.filter((item) => item.restaurantStatus === "inactive" || item.restaurantStatus === "suspended").length }; }

export function mergePlatformActivitySummary(items: RestaurantListItem[], activityItems: PlatformActivitySummaryItem[]): RestaurantListItem[] {
  const byRestaurant = new Map(activityItems.map((item) => [item.restaurant_id, item]));
  return items.map((item) => {
    const activity = byRestaurant.get(item.id);
    if (!activity) return { ...item, activityAvailable: false, responseCount: null, alertCount: null, pendingAlertCount: null, attendedAlertCount: null, avgGeneralExperience: null, lastResponseAt: null, lastAlertAt: null };
    const lastActivityAt = [item.lastActivityAt, activity.last_response_at, activity.last_alert_at].filter((value): value is string => Boolean(value)).sort().at(-1) ?? item.lastActivityAt;
    return {
      ...item,
      activityAvailable: true,
      responseCount: activity.response_count,
      alertCount: activity.alert_count,
      pendingAlertCount: activity.pending_alert_count,
      attendedAlertCount: activity.attended_alert_count,
      avgGeneralExperience: activity.avg_general_experience,
      lastResponseAt: activity.last_response_at,
      lastAlertAt: activity.last_alert_at,
      lastActivityAt,
    };
  });
}

export async function loadPlatformActivitySummary(restaurantId?: string): Promise<PlatformActivitySummaryItem[]> {
  const { invokeFunction } = await import("../../../../lib/supabase/functions");
  const response = await invokeFunction<Record<string, unknown>, { ok: true; items: PlatformActivitySummaryItem[] }>("get_platform_activity_summary", restaurantId ? { restaurant_id: restaurantId } : {});
  return response.items;
}

export async function loadRestaurantsListData(supabase: SupabaseClient): Promise<RestaurantListItem[]> {
  const [restaurantsResult, accountsResult, branchesResult, usersResult] = await Promise.all([
    supabase.from("restaurants").select("id,name,slug,contact_email,status,created_at,updated_at"),
    supabase.from("restaurant_accounts").select("restaurant_id,plan_code,account_status,updated_at"),
    supabase.from("branches").select("restaurant_id,status"),
    supabase.from("user_profiles").select("restaurant_id,role,status,updated_at").not("restaurant_id", "is", null),
  ]);
  const error = restaurantsResult.error || accountsResult.error || branchesResult.error || usersResult.error;
  if (error) throw error;
  const items = combineRestaurantsListData({ restaurants: (restaurantsResult.data ?? []) as RestaurantRow[], accounts: (accountsResult.data ?? []) as AccountRow[], branches: (branchesResult.data ?? []) as BranchRow[], users: (usersResult.data ?? []) as UserRow[] });
  try {
    return mergePlatformActivitySummary(items, await loadPlatformActivitySummary());
  } catch {
    return mergePlatformActivitySummary(items, []);
  }
}
