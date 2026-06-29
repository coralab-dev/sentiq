create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles up
    where up.id = (select auth.uid())
      and up.role = 'platform_admin'
      and up.status = 'active'
  );
$$;

create or replace function private.current_restaurant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select up.restaurant_id
  from public.user_profiles up
  where up.id = (select auth.uid())
    and up.status = 'active'
  limit 1;
$$;

create or replace function private.is_restaurant_admin(target_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles up
    where up.id = (select auth.uid())
      and up.role = 'restaurant_admin'
      and up.status = 'active'
      and up.restaurant_id = target_restaurant_id
  );
$$;

create or replace function private.is_manager_of_branch(target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles up
    join public.manager_branch_assignments mba
      on mba.manager_user_id = up.id
     and mba.restaurant_id = up.restaurant_id
     and mba.status = 'active'
    join public.branches b
      on b.id = mba.branch_id
     and b.restaurant_id = up.restaurant_id
    where up.id = (select auth.uid())
      and up.role = 'manager'
      and up.status = 'active'
      and mba.branch_id = target_branch_id
  );
$$;

revoke all on function private.is_platform_admin() from public;
revoke all on function private.current_restaurant_id() from public;
revoke all on function private.is_restaurant_admin(uuid) from public;
revoke all on function private.is_manager_of_branch(uuid) from public;

grant execute on function private.is_platform_admin() to authenticated;
grant execute on function private.current_restaurant_id() to authenticated;
grant execute on function private.is_restaurant_admin(uuid) to authenticated;
grant execute on function private.is_manager_of_branch(uuid) to authenticated;

alter policy restaurants_select_authenticated
on public.restaurants
using ((select private.is_platform_admin()) or id = (select private.current_restaurant_id()));

alter policy restaurants_insert_platform_admin
on public.restaurants
with check ((select private.is_platform_admin()));

alter policy restaurants_update_platform_admin
on public.restaurants
using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

alter policy restaurant_accounts_select_authenticated
on public.restaurant_accounts
using (
  (select private.is_platform_admin())
  or private.is_restaurant_admin(restaurant_id)
);

alter policy restaurant_accounts_insert_platform_admin
on public.restaurant_accounts
with check ((select private.is_platform_admin()));

alter policy restaurant_accounts_update_platform_admin
on public.restaurant_accounts
using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

alter policy restaurant_settings_select_authenticated
on public.restaurant_settings
using (
  (select private.is_platform_admin())
  or restaurant_id = (select private.current_restaurant_id())
);

alter policy restaurant_settings_insert_admins
on public.restaurant_settings
with check (
  (select private.is_platform_admin())
  or private.is_restaurant_admin(restaurant_id)
);

alter policy restaurant_settings_update_admins
on public.restaurant_settings
using (
  (select private.is_platform_admin())
  or private.is_restaurant_admin(restaurant_id)
)
with check (
  (select private.is_platform_admin())
  or private.is_restaurant_admin(restaurant_id)
);

alter policy branches_select_authenticated
on public.branches
using (
  (select private.is_platform_admin())
  or private.is_restaurant_admin(restaurant_id)
  or private.is_manager_of_branch(id)
);

alter policy branches_insert_admins
on public.branches
with check (
  (select private.is_platform_admin())
  or private.is_restaurant_admin(restaurant_id)
);

alter policy branches_update_admins
on public.branches
using (
  (select private.is_platform_admin())
  or private.is_restaurant_admin(restaurant_id)
)
with check (
  (select private.is_platform_admin())
  or private.is_restaurant_admin(restaurant_id)
);

alter policy zones_select_authenticated
on public.zones
using (
  (select private.is_platform_admin())
  or private.is_restaurant_admin(restaurant_id)
  or private.is_manager_of_branch(branch_id)
);

alter policy zones_insert_admins
on public.zones
with check (
  (
    (select private.is_platform_admin())
    or private.is_restaurant_admin(restaurant_id)
  )
  and exists (
    select 1
    from public.branches b
    where b.id = zones.branch_id
      and b.restaurant_id = zones.restaurant_id
  )
);

alter policy zones_update_admins
on public.zones
using (
  (select private.is_platform_admin())
  or private.is_restaurant_admin(restaurant_id)
)
with check (
  (
    (select private.is_platform_admin())
    or private.is_restaurant_admin(restaurant_id)
  )
  and exists (
    select 1
    from public.branches b
    where b.id = zones.branch_id
      and b.restaurant_id = zones.restaurant_id
  )
);

alter policy user_profiles_select_authenticated
on public.user_profiles
using (
  id = (select auth.uid())
  or (select private.is_platform_admin())
  or private.is_restaurant_admin(restaurant_id)
);

drop policy user_profiles_update_platform_admin on public.user_profiles;
drop policy user_profiles_update_restaurant_admin_managers on public.user_profiles;

create policy user_profiles_update_admins
on public.user_profiles
for update
to authenticated
using (
  (select private.is_platform_admin())
  or (
    role = 'manager'
    and private.is_restaurant_admin(restaurant_id)
  )
)
with check (
  (select private.is_platform_admin())
  or (
    role = 'manager'
    and private.is_restaurant_admin(restaurant_id)
  )
);

alter policy manager_branch_assignments_select_authenticated
on public.manager_branch_assignments
using (
  (select private.is_platform_admin())
  or private.is_restaurant_admin(restaurant_id)
  or manager_user_id = (select auth.uid())
);

alter policy manager_branch_assignments_insert_admins
on public.manager_branch_assignments
with check (
  (
    (select private.is_platform_admin())
    or private.is_restaurant_admin(restaurant_id)
  )
  and exists (
    select 1
    from public.user_profiles up
    where up.id = manager_branch_assignments.manager_user_id
      and up.role = 'manager'
      and up.restaurant_id = manager_branch_assignments.restaurant_id
  )
  and exists (
    select 1
    from public.branches b
    where b.id = manager_branch_assignments.branch_id
      and b.restaurant_id = manager_branch_assignments.restaurant_id
  )
);

alter policy manager_branch_assignments_update_admins
on public.manager_branch_assignments
using (
  (select private.is_platform_admin())
  or private.is_restaurant_admin(restaurant_id)
)
with check (
  (
    (select private.is_platform_admin())
    or private.is_restaurant_admin(restaurant_id)
  )
  and exists (
    select 1
    from public.user_profiles up
    where up.id = manager_branch_assignments.manager_user_id
      and up.role = 'manager'
      and up.restaurant_id = manager_branch_assignments.restaurant_id
  )
  and exists (
    select 1
    from public.branches b
    where b.id = manager_branch_assignments.branch_id
      and b.restaurant_id = manager_branch_assignments.restaurant_id
  )
);

alter policy waiters_select_authenticated
on public.waiters
using (
  private.is_restaurant_admin(restaurant_id)
  or private.is_manager_of_branch(branch_id)
);

alter policy waiters_insert_restaurant_admin
on public.waiters
with check (
  private.is_restaurant_admin(restaurant_id)
  and exists (
    select 1
    from public.branches b
    where b.id = waiters.branch_id
      and b.restaurant_id = waiters.restaurant_id
  )
);

alter policy waiters_update_restaurant_admin
on public.waiters
using (private.is_restaurant_admin(restaurant_id))
with check (
  private.is_restaurant_admin(restaurant_id)
  and exists (
    select 1
    from public.branches b
    where b.id = waiters.branch_id
      and b.restaurant_id = waiters.restaurant_id
  )
);

alter policy devices_select_authenticated
on public.devices
using (
  (select private.is_platform_admin())
  or private.is_restaurant_admin(restaurant_id)
  or private.is_manager_of_branch(branch_id)
);

alter policy devices_insert_admins
on public.devices
with check (
  (
    (select private.is_platform_admin())
    or private.is_restaurant_admin(restaurant_id)
  )
  and exists (
    select 1
    from public.branches b
    where b.id = devices.branch_id
      and b.restaurant_id = devices.restaurant_id
  )
  and (
    zone_id is null
    or exists (
      select 1
      from public.zones z
      where z.id = devices.zone_id
        and z.branch_id = devices.branch_id
        and z.restaurant_id = devices.restaurant_id
    )
  )
);

alter policy devices_update_admins
on public.devices
using (
  (select private.is_platform_admin())
  or private.is_restaurant_admin(restaurant_id)
)
with check (
  (
    (select private.is_platform_admin())
    or private.is_restaurant_admin(restaurant_id)
  )
  and exists (
    select 1
    from public.branches b
    where b.id = devices.branch_id
      and b.restaurant_id = devices.restaurant_id
  )
  and (
    zone_id is null
    or exists (
      select 1
      from public.zones z
      where z.id = devices.zone_id
        and z.branch_id = devices.branch_id
        and z.restaurant_id = devices.restaurant_id
    )
  )
);

alter policy survey_links_select_authenticated
on public.survey_links
using (
  (select private.is_platform_admin())
  or private.is_restaurant_admin(restaurant_id)
  or private.is_manager_of_branch(branch_id)
);

alter policy feedback_responses_select_restaurant_roles
on public.feedback_responses
using (
  private.is_restaurant_admin(restaurant_id)
  or private.is_manager_of_branch(branch_id)
);

alter policy feedback_alerts_select_restaurant_roles
on public.feedback_alerts
using (
  private.is_restaurant_admin(restaurant_id)
  or private.is_manager_of_branch(branch_id)
);

revoke all on table public.rate_limit_counters from anon;
revoke all on table public.rate_limit_counters from authenticated;

create policy rate_limit_counters_no_client_access
on public.rate_limit_counters
for all
to anon, authenticated
using (false)
with check (false);

revoke execute on function public.is_platform_admin() from authenticated;
revoke execute on function public.current_restaurant_id() from authenticated;
revoke execute on function public.is_restaurant_admin(uuid) from authenticated;
revoke execute on function public.is_manager_of_branch(uuid) from authenticated;

drop function public.is_platform_admin();
drop function public.current_restaurant_id();
drop function public.is_restaurant_admin(uuid);
drop function public.is_manager_of_branch(uuid);
