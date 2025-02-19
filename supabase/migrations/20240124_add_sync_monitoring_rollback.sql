-- Drop all related objects
drop function if exists public.rollback_sync_events;
drop function if exists public.check_sync_health;
drop view if exists public.sync_health_metrics;
drop table if exists public.sync_events;

-- Revoke permissions
revoke usage on schema public from authenticated;
revoke all on all tables in schema public from authenticated;
revoke all on all functions in schema public from authenticated;
revoke all on all functions in schema public from service_role;
