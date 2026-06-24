import type { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SupabaseBrowserClient = ReturnType<typeof getSupabaseBrowserClient>;

export type AccountSettingsProfile = {
  id: string;
  restaurant_id: string | null;
};

export type RestaurantAccountRestaurantRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
};

export type RestaurantAccountRow = {
  restaurant_id: string;
  plan_code: string | null;
  account_status: string | null;
  started_at: string | null;
  cancelled_at: string | null;
  updated_at: string | null;
};

export type AccountBranchRow = {
  restaurant_id: string;
  status: string;
};

export type AccountUserProfileRow = {
  restaurant_id: string | null;
  role: string;
  status: string;
};

export type AccountDeviceRow = {
  restaurant_id: string;
  status: string;
  last_used_at: string | null;
};

export type AccountSurveyLinkRow = {
  restaurant_id: string;
  status: string;
  updated_at: string | null;
  regenerated_at: string | null;
};

export type RestaurantAccountSettingsData = {
  status: "success" | "missing_profile";
  restaurant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string | null;
    updatedAt: string | null;
  } | null;
  account: {
    planCode: string | null;
    accountStatus: string | null;
    startedAt: string | null;
    cancelledAt: string | null;
    updatedAt: string | null;
  } | null;
  aggregates: {
    totalBranches: number;
    activeBranches: number;
    activeUsers: number;
    invitedUsers: number;
    activeDevices: number;
    activeSurveyLinks: number;
    lastOperationalActivityAt: string | null;
  };
};

const emptyAggregates: RestaurantAccountSettingsData["aggregates"] = {
  totalBranches: 0,
  activeBranches: 0,
  activeUsers: 0,
  invitedUsers: 0,
  activeDevices: 0,
  activeSurveyLinks: 0,
  lastOperationalActivityAt: null,
};

export function getLatestOperationalActivityAt(input: {
  devices: AccountDeviceRow[];
  surveyLinks: AccountSurveyLinkRow[];
}): string | null {
  const timestamps = [
    ...input.devices
      .filter((device) => device.status === "active")
      .map((device) => device.last_used_at),
    ...input.surveyLinks
      .filter((link) => link.status === "active")
      .flatMap((link) => [link.updated_at, link.regenerated_at]),
  ].filter((value): value is string => Boolean(value));

  if (!timestamps.length) {
    return null;
  }

  return timestamps.sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
}

export function combineRestaurantAccountSettingsData(input: {
  profile: AccountSettingsProfile | null;
  restaurant: RestaurantAccountRestaurantRow | null;
  account: RestaurantAccountRow | null;
  branches: AccountBranchRow[];
  users: AccountUserProfileRow[];
  devices: AccountDeviceRow[];
  surveyLinks: AccountSurveyLinkRow[];
}): RestaurantAccountSettingsData {
  if (!input.profile?.restaurant_id) {
    return {
      status: "missing_profile",
      restaurant: null,
      account: null,
      aggregates: emptyAggregates,
    };
  }

  return {
    status: "success",
    restaurant: input.restaurant
      ? {
          id: input.restaurant.id,
          name: input.restaurant.name,
          slug: input.restaurant.slug,
          status: input.restaurant.status,
          createdAt: input.restaurant.created_at,
          updatedAt: input.restaurant.updated_at,
        }
      : null,
    account: input.account
      ? {
          planCode: input.account.plan_code,
          accountStatus: input.account.account_status,
          startedAt: input.account.started_at,
          cancelledAt: input.account.cancelled_at,
          updatedAt: input.account.updated_at,
        }
      : null,
    aggregates: {
      totalBranches: input.branches.length,
      activeBranches: input.branches.filter((branch) => branch.status === "active").length,
      activeUsers: input.users.filter((user) => user.status === "active").length,
      invitedUsers: input.users.filter((user) => user.status === "invited").length,
      activeDevices: input.devices.filter((device) => device.status === "active").length,
      activeSurveyLinks: input.surveyLinks.filter((link) => link.status === "active").length,
      lastOperationalActivityAt: getLatestOperationalActivityAt({
        devices: input.devices,
        surveyLinks: input.surveyLinks,
      }),
    },
  };
}

export async function loadRestaurantAccountSettingsData(
  supabase: SupabaseBrowserClient,
): Promise<RestaurantAccountSettingsData> {
  const { getCurrentSessionProfile } = await import("@/lib/auth");
  const sessionState = await getCurrentSessionProfile();
  const profile = sessionState.profile
    ? {
        id: sessionState.profile.id,
        restaurant_id: sessionState.profile.restaurant_id,
      }
    : null;

  if (!profile?.restaurant_id) {
    return combineRestaurantAccountSettingsData({
      profile,
      restaurant: null,
      account: null,
      branches: [],
      users: [],
      devices: [],
      surveyLinks: [],
    });
  }

  const restaurantId = profile.restaurant_id;
  const [
    restaurantResult,
    accountResult,
    branchesResult,
    usersResult,
    devicesResult,
    surveyLinksResult,
  ] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, slug, status, created_at, updated_at")
      .eq("id", restaurantId)
      .maybeSingle(),
    supabase
      .from("restaurant_accounts")
      .select("restaurant_id, plan_code, account_status, started_at, cancelled_at, updated_at")
      .eq("restaurant_id", restaurantId)
      .maybeSingle(),
    supabase.from("branches").select("restaurant_id, status").eq("restaurant_id", restaurantId),
    supabase
      .from("user_profiles")
      .select("restaurant_id, role, status")
      .eq("restaurant_id", restaurantId),
    supabase
      .from("devices")
      .select("restaurant_id, status, last_used_at")
      .eq("restaurant_id", restaurantId),
    supabase
      .from("survey_links")
      .select("restaurant_id, status, updated_at, regenerated_at")
      .eq("restaurant_id", restaurantId),
  ]);

  const error =
    restaurantResult.error ??
    accountResult.error ??
    branchesResult.error ??
    usersResult.error ??
    devicesResult.error ??
    surveyLinksResult.error;

  if (error) {
    throw error;
  }

  return combineRestaurantAccountSettingsData({
    profile,
    restaurant: restaurantResult.data,
    account: accountResult.data,
    branches: branchesResult.data ?? [],
    users: usersResult.data ?? [],
    devices: devicesResult.data ?? [],
    surveyLinks: surveyLinksResult.data ?? [],
  });
}
