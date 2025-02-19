-- Create sync_events table for monitoring
create table if not exists public.sync_events (
    id uuid default gen_random_uuid() primary key,
    type text not null check (type in ('artist_sync', 'platform_link', 'identifier_update')),
    status text not null check (status in ('success', 'error')),
    platform text not null check (platform in ('spotify', 'ticketmaster')),
    artist_id uuid references public.artists(id),
    platform_id text,
    error text,
    metadata jsonb,
    timestamp timestamp with time zone default now() not null
);

-- Add indexes for common queries
create index if not exists idx_sync_events_timestamp 
on public.sync_events (timestamp desc);

create index if not exists idx_sync_events_artist 
on public.sync_events (artist_id, timestamp desc);

create index if not exists idx_sync_events_status 
on public.sync_events (status, timestamp desc);

create index if not exists idx_sync_events_platform 
on public.sync_events (platform, timestamp desc);

create index if not exists idx_sync_events_type 
on public.sync_events (type, timestamp desc);

-- Add RLS policies
alter table public.sync_events enable row level security;

create policy "Public read access to sync events"
on public.sync_events for select
to authenticated
using (true);

create policy "Service role can insert sync events"
on public.sync_events for insert
to service_role
using (true);

-- Create view for sync health metrics
create or replace view sync_health_metrics as
select
    date_trunc('hour', timestamp) as time_bucket,
    count(*) as total_events,
    sum(case when status = 'success' then 1 else 0 end) as successful_events,
    sum(case when status = 'error' then 1 else 0 end) as error_events,
    round(sum(case when status = 'error' then 1 else 0 end)::numeric / 
          nullif(count(*), 0)::numeric * 100, 2) as error_rate
from public.sync_events
where timestamp >= now() - interval '24 hours'
group by time_bucket
order by time_bucket desc;

-- Create function to check sync health
create or replace function check_sync_health(
    check_period interval default interval '1 hour'
)
returns table (
    status text,
    error_rate numeric,
    total_events bigint,
    error_events bigint
)
language plpgsql
security definer
as $$
declare
    metrics record;
begin
    select
        count(*) as total_events,
        sum(case when status = 'error' then 1 else 0 end) as error_events,
        round(sum(case when status = 'error' then 1 else 0 end)::numeric / 
              nullif(count(*), 0)::numeric * 100, 2) as error_rate
    into metrics
    from public.sync_events
    where timestamp >= now() - check_period;

    return query
    select
        case
            when metrics.error_rate > 10 then 'unhealthy'
            when metrics.error_rate > 5 then 'degraded'
            else 'healthy'
        end::text as status,
        coalesce(metrics.error_rate, 0)::numeric as error_rate,
        coalesce(metrics.total_events, 0)::bigint as total_events,
        coalesce(metrics.error_events, 0)::bigint as error_events;
end;
$$;

-- Create rollback function
create or replace function rollback_sync_events(
    minutes_to_rollback int
)
returns void
language plpgsql
security definer
as $$
begin
    delete from public.sync_events
    where timestamp >= now() - (minutes_to_rollback || ' minutes')::interval;
end;
$$;

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant select on public.sync_events to authenticated;
grant select on public.sync_health_metrics to authenticated;
grant execute on function public.check_sync_health to authenticated;
grant execute on function public.rollback_sync_events to service_role;
