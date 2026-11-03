begin;

alter table public.materials drop constraint materials_status_valid;
alter table public.materials add constraint materials_status_valid
  check (status in ('processing', 'needs_review', 'ready', 'failed', 'deleting'));

create function public.begin_material_deletion(p_owner_id uuid, p_material_id uuid)
returns setof public.materials
language plpgsql
set search_path = ''
as $$
declare
  material public.materials%rowtype;
begin
  select * into material from public.materials
    where id = p_material_id and owner_id = p_owner_id for update;
  if not found then return; end if;
  if material.status = 'processing' or material.cleanup_pending then
    raise exception 'MATERIAL_BUSY';
  end if;
  update public.materials set status = 'deleting', error_code = null
    where id = p_material_id and owner_id = p_owner_id returning * into material;
  return next material;
end;
$$;

revoke all on function public.begin_material_deletion(uuid, uuid) from public, anon, authenticated;
grant execute on function public.begin_material_deletion(uuid, uuid) to service_role;

commit;
