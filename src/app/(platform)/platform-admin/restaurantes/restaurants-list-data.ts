import type { SupabaseClient } from "@supabase/supabase-js";

type RestaurantRow = { id: string; name: string; slug: string; contact_email: string | null; status: string; created_at: string; updated_at: string | null };
type AccountRow = { restaurant_id: string; plan_code: string; account_status: string; updated_at: string | null };
type BranchRow = { restaurant_id: string; status: string };
type UserRow = { restaurant_id: string | null; role: string; status: string; updated_at?: string | null };
export type RestaurantListItem = { id: string; name: string; slug: string; contactEmail: string | null; restaurantStatus: string; createdAt: string; planCode: string | null; accountStatus: string | null; branchCount: number; activeBranchCount: number; userCount: number; activeUserCount: number; lastActivityAt: string | null };

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

export async function loadRestaurantsListData(supabase: SupabaseClient): Promise<RestaurantListItem[]> {
  const [restaurantsResult, accountsResult, branchesResult, usersResult] = await Promise.all([
    supabase.from("restaurants").select("id,name,slug,contact_email,status,created_at,updated_at"),
    supabase.from("restaurant_accounts").select("restaurant_id,plan_code,account_status,updated_at"),
    supabase.from("branches").select("restaurant_id,status"),
    supabase.from("user_profiles").select("restaurant_id,role,status,updated_at").not("restaurant_id", "is", null),
  ]);
  const error = restaurantsResult.error || accountsResult.error || branchesResult.error || usersResult.error;
  if (error) throw error;
  return combineRestaurantsListData({ restaurants: (restaurantsResult.data ?? []) as RestaurantRow[], accounts: (accountsResult.data ?? []) as AccountRow[], branches: (branchesResult.data ?? []) as BranchRow[], users: (usersResult.data ?? []) as UserRow[] });
}
